/* Hero portrait made of dots.
   The face is a stipple of the photo (built by tools/hero-face/build.mjs). The
   dots drift like the site's particles; near the pointer they swell, take the
   photo's colour and merge into the photo itself; the opened area has a liquid
   edge and its trail shrinks back to dots. A click scatters them and they spring home.
   The head also turns a few degrees toward the pointer wherever it is on the page
   (each dot has a depth, so the face reads as a rounded head, not a flat sheet), and
   goes back to facing front when the pointer leaves or rests. As the hero scrolls
   away the dots come loose, drift down and out, shrink and fade; scrolling back
   re-forms the face. Dots inside the opened photo stay unturned so they keep
   lining up with it. Reduced motion (the media query, or the site's
   data-motion="reduce" on <html>, re-read on the jj:motionchange event) turns
   the turn, the dissolve, the drift and the physics off.

   API for hero-space.js (client px): HeroFace.attract(x, y, strength 0..1) pulls
   every dot toward a point while it is called each frame; HeroFace.burst(x, y,
   power) scatters them (power 1 = a click); HeroFace.count() is the dot count.
   The hole can also eat the portrait. HeroFace.consume(x, y, reach, rd, amount)
   is called each frame while it is held: dots within reach of the point let go
   of their places and fall in, a growing share of them as amount goes 0..1, and
   one that gets within rd is gone. It returns the share gone so far and lapses
   100 ms after the last call. Then one of:
     spit(x, y)            the hole was let go early: gone dots come back at
                           that point and spring home
     keep()                it ate the lot: the portrait stays gone (a game runs)
     restore(pts, instant) the game is over: every dot flies home from one of
                           the client points in pts [x, y, x, y, ...], a few at
                           a time, and once the face has formed the photo shows
                           through it for a moment. instant puts it back at once.

   Markup:
     div[data-hero-face]  data-photo="/assets/images/hero-face.webp"
                          data-dots="/assets/hero-face-{theme}.json"   {theme} = dark | light
       canvas
   Colours come from CSS custom properties on the div:
     --face-dot                      the dots
     --face-shadow, --face-mid, --face-light   the photo's grade, dark to light
   Entry: hero-cut.js draws the dots flying out of the headline bar on its own
   canvas (HeroFace.intro), then calls HeroFace.live() when the intro ends. */
(function () {
  'use strict';

  var box = document.querySelector('[data-hero-face]');
  var canvas = box && box.querySelector('canvas');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');

  var TAU = Math.PI * 2;
  var BLEED = 0.4;               // canvas extends past the box by this share of its width
  var GW = 80, GH = 100;         // the reveal field, a grid over the box
  var STRAYS = 70;               // loose dots around the head
  var motionMQ = matchMedia('(prefers-reduced-motion: reduce)');
  // Reduced motion is the system setting or the site's own switch.
  function readCalm() {
    return motionMQ.matches || document.documentElement.getAttribute('data-motion') === 'reduce';
  }
  var calm = readCalm();

  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function lerp(a, b, p) { return a + (b - a) * p; }
  function smooth(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function expoOut(p) { return p >= 1 ? 1 : 1 - Math.pow(2, -10 * p); }
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function rgb(str) {
    var m = /^#?([0-9a-f]{6})$/i.exec(str.trim());
    if (m) { var n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
    m = /(\d+)[, ]+(\d+)[, ]+(\d+)/.exec(str);
    return m ? [+m[1], +m[2], +m[3]] : [240, 237, 232];
  }

  /* ---------- state ---------- */
  var N = 0;                                   // dots, strays included
  var ux, uy, br, lum, u1, u2, u3;             // per dot: home (0..1 of the box), radius, tone, three random numbers
  var dz, fvp;                                 // per dot: depth (-1..1, 0 for strays), and last frame's reveal value
  var X, Y, VX, VY;                            // per dot: position and velocity, px in the box
  var colR, colG, colB;                        // per dot: its colour in the photo's grade
  var field = new Float32Array(GW * GH), tmp = new Float32Array(GW * GH);
  var maskC = document.createElement('canvas'); maskC.width = GW; maskC.height = GH;
  var maskX = maskC.getContext('2d'), maskD = maskX.createImageData(GW, GH);
  var rimC = document.createElement('canvas'); rimC.width = GW; rimC.height = GH;
  var rimX = rimC.getContext('2d'), rimD = rimX.createImageData(GW, GH);
  var rimL = document.createElement('canvas'), rimLX = rimL.getContext('2d');
  var speed = 0;                               // pointer speed, smoothed, px per second
  var layerC = document.createElement('canvas'), layerX = layerC.getContext('2d');
  var photo = null, photoC = null;             // the image, and its graded copy
  var W = 0, H = 0, K = 1, unit = 1;           // box size in px, pixel ratio, px per dot-space unit
  var col = { dot: [240, 237, 232], shadow: [28, 26, 23], mid: [92, 92, 212], light: [240, 237, 232] };
  var theme = '', loadedTheme = '', spaceW = 1000;
  var mode = 'wait';                           // wait: nothing shown | live
  var appear = 0, clock = 0, last = 0, raf = 0, onScreen = true;
  var ptr = { x: 0, y: 0, lx: 0, ly: 0, on: false, seen: 0, px: 0, py: 0 };
  var whole = 0, wholeTo = 0;                  // reduced motion: the whole photo, faded
  var ghostAt = 0;
  var look = { x: 0, y: 0, t: 0, on: false, yaw: 0, pitch: 0 };   // pointer anywhere in the viewport, and the head's smoothed turn
  var att = { x: 0, y: 0, s: 0, until: 0 };   // the attractor set by HeroFace.attract, client px
  // Eaten by the hole. gone, per dot: 0 here, 0..1 falling in, 1 swallowed,
  // below 0 waiting that many seconds to fly home.
  var gone, nGone = 0, held = false;
  var eat = { x: 0, y: 0, reach: 0, rd: 0, amount: 0, until: 0 };
  var flashAt = 0, flashEnd = 0;               // after a restore: when the photo shows through, and until when
  var hero = box.closest('.hero');

  /* ---------- colours, theme, data ---------- */
  function readColours() {
    var cs = getComputedStyle(box);
    function v(n, fb) { var s = cs.getPropertyValue(n).trim(); return s ? rgb(s) : fb; }
    col.dot = v('--face-dot', col.dot);
    col.shadow = v('--face-shadow', col.shadow);
    col.mid = v('--face-mid', col.mid);
    col.light = v('--face-light', col.light);
    // Light dots mean a dark page: use the set that puts dots where the photo is light.
    theme = (col.dot[0] * 0.2126 + col.dot[1] * 0.7152 + col.dot[2] * 0.0722) > 128 ? 'dark' : 'light';
  }
  function grade(l, out, o) {
    var a, b, p;
    if (l < 0.5) { a = col.shadow; b = col.mid; p = l * 2; } else { a = col.mid; b = col.light; p = l * 2 - 2 + 1; }
    out[o] = lerp(a[0], b[0], p); out[o + 1] = lerp(a[1], b[1], p); out[o + 2] = lerp(a[2], b[2], p);
  }
  // The photo, pulled most of the way to the site's three colours; a little of
  // the original colour stays so skin still reads as skin.
  function gradePhoto() {
    if (!photo) return;
    var w = photo.naturalWidth, h = photo.naturalHeight;
    photoC = photoC || document.createElement('canvas');
    photoC.width = w; photoC.height = h;
    var c = photoC.getContext('2d');
    c.drawImage(photo, 0, 0);
    var img;
    try { img = c.getImageData(0, 0, w, h); } catch (e) { return; }
    var d = img.data, g = [0, 0, 0];
    for (var i = 0; i < d.length; i += 4) {
      var l = clamp(((0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255 - 0.03) / 0.72, 0, 1);
      grade(Math.pow(l, 0.9), g, 0);
      d[i] = lerp(Math.min(255, d[i] * 1.3), g[0], 0.55); d[i + 1] = lerp(Math.min(255, d[i + 1] * 1.3), g[1], 0.55); d[i + 2] = lerp(Math.min(255, d[i + 2] * 1.3), g[2], 0.55);
    }
    c.putImageData(img, 0, 0);
  }
  function colourDots() {
    if (!N) return;
    var g = [0, 0, 0];
    for (var i = 0; i < N; i++) {
      grade(Math.pow(lum[i], 0.9), g, 0);
      colR[i] = g[0]; colG[i] = g[1]; colB[i] = g[2];
    }
  }
  function setDots(json) {
    var d = json.d, n = d.length / 4, rand = rng(21), i;
    spaceW = json.w;
    var ratio = json.h / json.w;
    N = n + STRAYS;
    ux = new Float32Array(N); uy = new Float32Array(N); br = new Float32Array(N); lum = new Float32Array(N);
    u1 = new Float32Array(N); u2 = new Float32Array(N); u3 = new Float32Array(N);
    dz = new Float32Array(N); fvp = new Float32Array(N);
    X = new Float32Array(N); Y = new Float32Array(N); VX = new Float32Array(N); VY = new Float32Array(N);
    colR = new Float32Array(N); colG = new Float32Array(N); colB = new Float32Array(N);
    gone = new Float32Array(N); nGone = 0;
    if (held) { gone.fill(1); nGone = N; }
    for (i = 0; i < n; i++) {
      ux[i] = d[i * 4] / json.w; uy[i] = d[i * 4 + 1] / json.h;
      br[i] = d[i * 4 + 2] / 10; lum[i] = d[i * 4 + 3] / 100;
      // Depth: an ellipsoid bulge over the face, a little nearer where the tone is
      // lighter, falling to nothing at the edges and down the neck.
      var nx = (ux[i] - 0.5) / 0.36, ny = (uy[i] - 0.42) / 0.46;
      dz[i] = Math.min(1, Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)) * (0.8 + 0.4 * lum[i]) * (1 - smooth(0.66, 0.88, uy[i])));
    }
    // Strays: loose dots around the head, thicker above it, that never settle.
    for (i = n; i < N; i++) {
      var a = -Math.PI * (0.02 + 0.96 * rand()), far = 0.5 + 0.34 * Math.pow(rand(), 1.6);
      ux[i] = 0.5 + Math.cos(a) * far * 0.95;
      uy[i] = 0.44 + Math.sin(a) * far * 0.95 / ratio;
      br[i] = 1.6 + rand() * 2.2; lum[i] = -1;
    }
    for (i = 0; i < N; i++) { u1[i] = rand(); u2[i] = rand(); u3[i] = rand(); }
    colourDots();
    home();
  }
  function home() {
    for (var i = 0; i < N; i++) { X[i] = ux[i] * W; Y[i] = uy[i] * H; VX[i] = 0; VY[i] = 0; }
  }
  function loadDots() {
    readColours();
    if (theme === loadedTheme) { colourDots(); gradePhoto(); return; }
    var want = theme, url = (box.getAttribute('data-dots') || '').replace('{theme}', want);
    loadedTheme = want;
    fetch(url).then(function (r) { return r.json(); }).then(function (json) {
      if (want !== theme) return;
      setDots(json);
      gradePhoto();
      appear = 0;
      wake();
    }).catch(function () { loadedTheme = ''; });
  }
  function loadPhoto() {
    var img = new Image();
    img.decoding = 'async';
    img.onload = function () { photo = img; gradePhoto(); };
    img.src = box.getAttribute('data-photo');
  }

  /* ---------- size ---------- */
  function resize() {
    var r = box.getBoundingClientRect();
    if (!r.width) return;
    var w = r.width, h = r.height;
    // Up to 2x, but never more than about 3.4 megapixels of canvas.
    var k = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(3.4e6 / ((w * (1 + BLEED * 2)) * (h + w * BLEED * 2))));
    if (w === W && h === H && k === K) return;
    var sx = W ? w / W : 1, sy = H ? h / H : 1;
    for (var i = 0; i < N; i++) { X[i] *= sx; Y[i] *= sy; }
    W = w; H = h; K = k; unit = W / spaceW;
    var pad = Math.round(W * BLEED);
    canvas.width = Math.round((W + pad * 2) * K);
    canvas.height = Math.round((H + pad * 2) * K);
    layerC.width = Math.round(W * K); layerC.height = Math.round(H * K);
    rimL.width = Math.round(W * K / 2); rimL.height = Math.round(H * K / 2);
  }

  /* ---------- the reveal field ---------- */
  function stamp(x, y, rad, dt) {
    var gx = x / W * GW, gy = y / H * GH, rx = rad / W * GW, ry = rad / H * GH;
    var x0 = Math.max(0, Math.floor(gx - rx * 2)), x1 = Math.min(GW - 1, Math.ceil(gx + rx * 2));
    var y0 = Math.max(0, Math.floor(gy - ry * 2)), y1 = Math.min(GH - 1, Math.ceil(gy + ry * 2));
    var gain = Math.min(1, dt * 11);
    for (var j = y0; j <= y1; j++) {
      for (var i = x0; i <= x1; i++) {
        var dx = (i + 0.5 - gx) / rx, dy = (j + 0.5 - gy) / ry, to = 1.25 * Math.exp(-(dx * dx + dy * dy));
        var k = j * GW + i;
        if (to > field[k]) field[k] += (to - field[k]) * gain;
      }
    }
  }
  function stepField(dt) {
    var decay = Math.exp(-dt / 1.15), mix = Math.min(0.5, dt * 9), energy = 0, i, j, k;
    for (j = 0; j < GH; j++) {
      for (i = 0; i < GW; i++) {
        k = j * GW + i;
        var a = field[k], n = 0, s = 0;
        if (i > 0) { s += field[k - 1]; n++; }
        if (i < GW - 1) { s += field[k + 1]; n++; }
        if (j > 0) { s += field[k - GW]; n++; }
        if (j < GH - 1) { s += field[k + GW]; n++; }
        a = (a + (s / n - a) * mix) * decay;
        tmp[k] = a < 0.003 ? 0 : a;
        energy += tmp[k];
      }
    }
    var t = field; field = tmp; tmp = t;
    return energy;
  }
  function fieldAt(x, y) {
    var gx = x / W * GW - 0.5, gy = y / H * GH - 0.5;
    if (gx < -1 || gy < -1 || gx > GW || gy > GH) return 0;
    var i = Math.floor(gx), j = Math.floor(gy), fx = gx - i, fy = gy - j;
    function at(a, b) { return a < 0 || b < 0 || a >= GW || b >= GH ? 0 : field[b * GW + a]; }
    return lerp(lerp(at(i, j), at(i + 1, j), fx), lerp(at(i, j + 1), at(i + 1, j + 1), fx), fy);
  }

  /* ---------- one frame ---------- */
  function frame(now) {
    raf = 0;
    if (mode !== 'live' || !N || !W) return;
    var dt = last ? Math.min(0.034, (now - last) / 1000) : 0.016;
    last = now; clock += dt;
    appear = Math.min(1, appear + dt / 0.9);
    var i, pad = W * BLEED;
    var rc = box.getBoundingClientRect(), tnow = performance.now();

    // How far the hero has scrolled away, 0..1: the face comes apart as it goes.
    var away = 0;
    if (!calm) away = clamp((window.pageYOffset || 0) / (0.6 * ((hero && hero.offsetHeight) || window.innerHeight)), 0, 1);
    var ee = away * Math.sqrt(away);             // away^1.5, the share of the way each dot has flown

    // The head turns toward the pointer anywhere on the page, and back to front
    // when it leaves the window or rests for a few seconds.
    var yawTo = 0, pitchTo = 0;
    if (!calm && look.on && tnow - look.t < 4000) {
      var hx0 = rc.left + W * 0.5, hy0 = rc.top + H * 0.5;
      yawTo = clamp((look.x - hx0) / Math.max(hx0, window.innerWidth - hx0, 1), -1, 1) * 0.16;
      pitchTo = clamp((look.y - hy0) / Math.max(hy0, window.innerHeight - hy0, 1), -1, 1) * 0.10;
    }
    var ease = 1 - Math.exp(-dt / 0.25);
    look.yaw += (yawTo - look.yaw) * ease; look.pitch += (pitchTo - look.pitch) * ease;
    var turning = !calm && (Math.abs(look.yaw) > 0.0005 || Math.abs(look.pitch) > 0.0005);
    var cyw = Math.cos(look.yaw), syw = Math.sin(look.yaw), cpt = Math.cos(look.pitch), spt = Math.sin(look.pitch);
    var dscale = 0.22 * W, pcx = W * 0.5, pcy = H * 0.42;

    // An idle face gives itself away: now and then a slow pass of light crosses it.
    var ghost = false, gx = 0, gy = 0;
    if (!calm && away < 0.15 && !ptr.on && now - ptr.seen > 5000) {
      if (!ghostAt) ghostAt = now;
      var gp = (now - ghostAt) / 2600;
      if (gp < 1) {
        ghost = true;
        gx = W * lerp(0.2, 0.8, smooth(0, 1, gp));
        gy = H * (0.42 + 0.16 * Math.sin(gp * TAU * 0.75));
      } else if (gp > 3.4) ghostAt = now;
    } else ghostAt = 0;

    // Being eaten: only while consume() keeps being called. If it stops without
    // a spit or a keep, the dots it took come back by themselves.
    var eatOn = !calm && !held && tnow < eat.until, eatX = eat.x - rc.left, eatY = eat.y - rc.top;
    if (!eatOn && !held && nGone) spit(eat.x, eat.y);
    if (flashAt) {
      if (tnow > flashEnd) { flashAt = 0; if (!calm) wholeTo = 0; }
      else if (tnow > flashAt) wholeTo = 1;
    }

    if (away > 0.15 || eatOn || held) { field.fill(0); ptr.lx = ptr.x; ptr.ly = ptr.y; }
    else if (!calm) {
      if (ptr.on) {
        var dx = ptr.x - ptr.lx, dy = ptr.y - ptr.ly, steps = Math.min(8, 1 + Math.floor(Math.sqrt(dx * dx + dy * dy) / (W * 0.05)));
        // A fast pointer leaves bigger drops behind it.
        speed += (Math.sqrt(dx * dx + dy * dy) / dt - speed) * Math.min(1, dt * 8);
        var rad = W * clamp(0.13 + speed / (W * 18), 0.13, 0.18);
        for (i = 1; i <= steps; i++) stamp(ptr.lx + dx * i / steps, ptr.ly + dy * i / steps, rad, 0.06);
        ptr.lx = ptr.x; ptr.ly = ptr.y;
      } else if (ghost) stamp(gx, gy, W * 0.12, dt);
    }
    var energy = stepField(dt);
    whole += (wholeTo - whole) * Math.min(1, dt * 7);

    // The face leans a few pixels away from the pointer, near dots more than far ones.
    var tx = ptr.on ? (ptr.x / W - 0.5) : 0, ty = ptr.on ? (ptr.y / H - 0.5) : 0;
    ptr.px += (tx - ptr.px) * Math.min(1, dt * 4); ptr.py += (ty - ptr.py) * Math.min(1, dt * 4);

    // Clear in device pixels: the canvas size is rounded, so a clear in box
    // units can leave its last column, and dots crossing that edge pile up there.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(K, 0, 0, K, pad * K, pad * K);

    // The photo, where the field has opened it.
    var showPhoto = photoC && (energy > 0.05 || whole > 0.01);
    if (showPhoto) {
      // The field is cut at a threshold, so a fading drop shrinks like liquid
      // instead of dimming, and the threshold wobbles so its edge is never a
      // clean circle. Just outside the edge runs a thin band of the mid colour.
      var md = maskD.data, rd = rimD.data, gi, gj;
      for (gj = 0; gj < GH; gj++) {
        for (gi = 0; gi < GW; gi++) {
          i = gj * GW + gi;
          var fl = field[i], o = i * 4 + 3;
          if (fl < 0.2 && whole < 0.01) { md[o] = 0; rd[o] = 0; continue; }
          var thr = 0.5 + (calm ? 0 : 0.085 * Math.sin(gi * 0.33 + clock * 1.9) * Math.sin(gj * 0.29 - clock * 1.4) + 0.04 * Math.sin((gi + gj) * 0.61 + clock * 2.6));
          var inside = smooth(thr - 0.05, thr + 0.05, fl);
          md[o] = 255 * Math.max(inside, whole);
          rd[o] = 200 * smooth(thr - 0.1, thr - 0.02, fl) * (1 - inside) * (1 - whole);
        }
      }
      maskX.putImageData(maskD, 0, 0);
      rimX.putImageData(rimD, 0, 0);
      rimLX.globalCompositeOperation = 'copy';
      rimLX.imageSmoothingEnabled = true; rimLX.imageSmoothingQuality = 'high';
      rimLX.drawImage(rimC, 0, 0, rimL.width, rimL.height);
      rimLX.globalCompositeOperation = 'source-in';
      rimLX.fillStyle = 'rgb(' + col.mid[0] + ',' + col.mid[1] + ',' + col.mid[2] + ')';
      rimLX.fillRect(0, 0, rimL.width, rimL.height);
      // Keep the band on the head: outside the silhouette there is nothing to open.
      rimLX.globalCompositeOperation = 'destination-in';
      rimLX.drawImage(photoC, 0, 0, rimL.width, rimL.height);
      ctx.drawImage(rimL, 0, 0, W, H);
      layerX.globalCompositeOperation = 'copy';
      layerX.imageSmoothingEnabled = true; layerX.imageSmoothingQuality = 'high';
      layerX.drawImage(maskC, 0, 0, layerC.width, layerC.height);
      layerX.globalCompositeOperation = 'source-in';
      layerX.drawImage(photoC, 0, 0, layerC.width, layerC.height);
      ctx.drawImage(layerC, 0, 0, W, H);
    }

    // Loosened dots hold on less (never to nothing, or they would stop and hang).
    var kLoose = (1 - away) * (1 - away), k = 95 * (kLoose < 0.03 ? 0.03 : kLoose), damp = 8.5, reach = W * 0.24, d = col.dot;
    var base = 'rgb(' + d[0] + ',' + d[1] + ',' + d[2] + ')';
    var hot = [], hx = ptr.on ? ptr.x : gx, hy = ptr.on ? ptr.y : gy, push = !calm && (ptr.on || ghost);
    var pull = !calm && att.s > 0 && tnow < att.until, pullX = att.x - rc.left, pullY = att.y - rc.top;
    var driftUp = 1 + 6 * away, rShrink = 1 - 0.4 * away, aFade = appear * (1 - 0.65 * away);
    ctx.fillStyle = base;
    ctx.beginPath();
    for (i = 0; i < N; i++) {
      var g0 = gone[i], eatShrink = 1;
      if (g0 >= 1) { fvp[i] = 0; continue; }
      if (g0 < 0) {                              // not back yet
        gone[i] = g0 + dt > 0 ? 0 : g0 + dt;
        if (gone[i] < 0) { fvp[i] = 0; continue; }
      }
      var stray = lum[i] < 0, depth = stray ? 1.6 : 0.4 + lum[i];
      var amp = calm ? 0 : (stray ? 7 + u2[i] * 9 : 0.9) * unit * (stray ? 1.6 : 1.4) * driftUp;
      var sp = stray ? 0.12 + u3[i] * 0.2 : 0.5 + u3[i] * 0.7;
      var bx = ux[i] * W, by = uy[i] * H;
      if (turning && !stray) {
        // Turn the head: rotate the dot's home about the head's centre, using its depth.
        // Dots inside the opened photo hold still so they stay lined up with it.
        var tt = fvp[i] > 0.02 ? 1 - smooth(0.02, 0.3, fvp[i]) : 1;
        if (tt > 0) {
          var zz = dz[i] * dscale, ox0 = bx - pcx, oy0 = by - pcy;
          bx += (pcx + ox0 * cyw + zz * syw - bx) * tt;
          by += (pcy + oy0 * cpt + zz * spt - by) * tt;
        }
      }
      var hxI = bx + Math.cos(clock * sp + u1[i] * TAU) * amp;
      var hyI = by + Math.sin(clock * sp * 0.8 + u2[i] * TAU) * amp;
      if (stray) { hxI -= ptr.px * depth * W * 0.03; hyI -= ptr.py * depth * H * 0.03; }
      if (away > 0) {
        // Scrolling away: each dot, in its own time, flies outward from the face and down.
        var ei = clamp(ee * 1.5 - u2[i] * 0.5, 0, 1);
        hxI += (ux[i] - 0.5) * W * 1.1 * ei; hyI += H * (0.25 + u1[i] * 0.9) * ei;
      }
      if (calm) { X[i] = hxI; Y[i] = hyI; }
      else {
        var ax = (hxI - X[i]) * k - VX[i] * damp, ay = (hyI - Y[i]) * k - VY[i] * damp;
        if (eatOn && u1[i] < eat.amount) {
          // Its turn: it lets go of its place and falls into the hole, swirling and shrinking.
          var ex = eatX - X[i], ey = eatY - Y[i], ed = Math.sqrt(ex * ex + ey * ey) || 1;
          if (ed < eat.reach) {
            gone[i] += dt / 1.6;
            if (ed < eat.rd * 1.3 || gone[i] >= 1) { gone[i] = 1; nGone++; fvp[i] = 0; continue; }
            ax = (ex - ey * 0.5) / ed * 2200 - VX[i] * 2.5; ay = (ey + ex * 0.5) / ed * 2200 - VY[i] * 2.5;
            eatShrink = clamp(ed / (W * 0.3), 0.35, 1);
          }
        } else if (g0 > 0) gone[i] = 0;
        if (pull) {
          var qx = pullX - X[i], qy = pullY - Y[i], qd = Math.sqrt(qx * qx + qy * qy);
          if (qd > 0.01) { var qa = att.s * 2600 * unit / (0.35 + qd / W); ax += qx / qd * qa; ay += qy / qd * qa; }
        }
        if (push) {
          var rx = X[i] - hx, ry = Y[i] - hy, rr = Math.sqrt(rx * rx + ry * ry);
          if (rr < reach && rr > 0.01) { var f = (1 - rr / reach); f = f * f * (ptr.on ? 240 : 120) * unit * 3; ax += rx / rr * f; ay += ry / rr * f; }
        }
        VX[i] += ax * dt; VY[i] += ay * dt; X[i] += VX[i] * dt; Y[i] += VY[i] * dt;
      }
      var tw = calm ? 1 : 1 + 0.22 * Math.sin(clock * (0.9 + u1[i] * 2.2) + u3[i] * TAU);
      var r = br[i] * unit * tw * (0.35 + 0.65 * expoOut(clamp(appear * 1.6 - u2[i] * 0.6, 0, 1))) * rShrink * eatShrink;
      if (r < 0.45) r = 0.45;
      var fv = stray ? 0 : Math.max(fieldAt(X[i], Y[i]), whole);
      fvp[i] = fv;
      if (fv > 0.02) { hot.push(i, r, fv); continue; }
      ctx.moveTo(X[i] + r, Y[i]);
      ctx.arc(X[i], Y[i], r, 0, TAU);
    }
    ctx.globalAlpha = aFade;
    ctx.fill();

    // Dots inside the trail: they swell and take the photo's colour, then give way to it.
    for (i = 0; i < hot.length; i += 3) {
      var q = hot[i], v = hot[i + 2], m = smooth(0.16, 0.36, v);
      var alpha = (1 - smooth(0.44, 0.62, v)) * aFade;
      if (alpha < 0.02) continue;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgb(' + (lerp(d[0], colR[q], m) | 0) + ',' + (lerp(d[1], colG[q], m) | 0) + ',' + (lerp(d[2], colB[q], m) | 0) + ')';
      ctx.beginPath();
      ctx.arc(X[q], Y[q], hot[i + 1] * (1 + 1.7 * smooth(0.18, 0.44, v)), 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Reduced motion draws only while something is changing.
    if (calm && appear >= 1 && Math.abs(wholeTo - whole) < 0.004) return;
    wake();
  }
  function wake() {
    if (raf || mode !== 'live' || !onScreen || document.hidden) return;
    last = 0;
    raf = requestAnimationFrame(frame);
  }

  /* ---------- pointer ---------- */
  function local(ev) {
    var r = box.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  }
  box.addEventListener('pointermove', function (ev) {
    var p = local(ev);
    if (!ptr.on) { ptr.lx = p.x; ptr.ly = p.y; }
    ptr.x = p.x; ptr.y = p.y; ptr.on = true; ptr.seen = performance.now();
    if (calm) wholeTo = 1;
    wake();
  });
  // The head follows the pointer anywhere in the window: only record where it is.
  window.addEventListener('pointermove', function (ev) {
    look.x = ev.clientX; look.y = ev.clientY; look.t = performance.now(); look.on = true;
  }, { passive: true });
  document.addEventListener('mouseleave', function () { look.on = false; });
  window.addEventListener('blur', function () { look.on = false; });
  // Burst: every dot is thrown away from a point (box px), nearer ones harder.
  // power 1 is a click.
  function scatter(x, y, power) {
    for (var i = 0; i < N; i++) {
      var dx = X[i] - x, dy = Y[i] - y, dd = Math.sqrt(dx * dx + dy * dy) || 1;
      var f = (1500 + u1[i] * 2800) * unit * 2.4 / (1 + dd / (W * 0.5)) * power, spin = (u2[i] - 0.5) * 0.9;
      VX[i] += (dx / dd * Math.cos(spin) - dy / dd * Math.sin(spin)) * f;
      VY[i] += (dy / dd * Math.cos(spin) + dx / dd * Math.sin(spin)) * f;
    }
  }
  function leave() { ptr.on = false; ptr.seen = performance.now(); if (calm) wholeTo = 0; wake(); }
  box.addEventListener('pointerleave', leave);
  box.addEventListener('pointercancel', leave);
  box.addEventListener('pointerdown', function (ev) {
    if (mode !== 'live' || !N) return;
    var p = local(ev);
    ptr.seen = performance.now();
    if (calm) { wholeTo = wholeTo ? 0 : 1; wake(); return; }
    scatter(p.x, p.y, 1);
    if (ev.pointerType !== 'mouse') { ptr.x = ptr.lx = p.x; ptr.y = ptr.ly = p.y; ptr.on = true; }
    wake();
  });
  window.addEventListener('pointerup', function (ev) { if (ev.pointerType !== 'mouse' && ptr.on) leave(); });

  /* ---------- entry: drawn by hero-cut.js on its canvas, in viewport px ---------- */
  // Each dot leaves the headline bar (g) as the bar wipes, and arcs to its place.
  function intro(c, t, g, from) {
    if (!N) return;
    var r = box.getBoundingClientRect();
    if (!r.width) return;
    var un = r.width / spaceW, d = col.dot;
    c.fillStyle = 'rgb(' + d[0] + ',' + d[1] + ',' + d[2] + ')';
    c.beginPath();
    for (var i = 0; i < N; i++) {
      var p = (t - from - 0.02 - u1[i] * 0.42) / 0.85;
      if (p <= 0) continue;
      p = expoOut(Math.min(1, p));
      var ox = lerp(g.x1, g.x2, u2[i]), oy = lerp(g.y1, g.y2, u3[i]);
      var hx = r.left + ux[i] * r.width, hy = r.top + uy[i] * r.height;
      var dx = hx - ox, dy = hy - oy, bow = Math.sin(p * Math.PI) * (u3[i] - 0.5) * 0.5;
      var x = lerp(ox, hx, p) - dy * bow, y = lerp(oy, hy, p) + dx * bow;
      var rad = Math.max(0.45, br[i] * un * Math.min(1, 0.25 + p));
      c.moveTo(x + rad, y);
      c.arc(x, y, rad, 0, TAU);
    }
    c.fill();
  }
  // Something passing by (a comet from hero-space.js), in viewport px: dots in
  // its way are thrown along (ix, iy) and aside, and the photo opens behind it.
  function push(cx, cy, ix, iy, rad) {
    if (mode !== 'live' || !N || calm) return;
    var r = box.getBoundingClientRect(), x = cx - r.left, y = cy - r.top, hit = false;
    if (x < -rad || y < -rad || x > W + rad || y > H + rad) return;
    var mag = Math.sqrt(ix * ix + iy * iy);
    for (var i = 0; i < N; i++) {
      var dx = X[i] - x, dy = Y[i] - y, d2 = dx * dx + dy * dy;
      if (d2 > rad * rad) continue;
      var d = Math.sqrt(d2) || 1, f = 1 - d / rad;
      VX[i] += (ix + dx / d * mag * 0.8) * f; VY[i] += (iy + dy / d * mag * 0.8) * f;
      hit = true;
    }
    if (x > 0 && y > 0 && x < W && y < H) { stamp(x, y, rad * 0.75, 0.05); hit = true; }
    if (hit) { ptr.seen = performance.now(); wake(); }
  }
  // A black hole charging somewhere (hero-space.js): while this is called every
  // frame, all dots are pulled toward the point; it lapses 100 ms after the last call.
  function attract(cx, cy, strength) {
    att.x = cx; att.y = cy; att.s = clamp(strength, 0, 1); att.until = performance.now() + 100;
    wake();
  }
  function burst(cx, cy, power) {
    if (mode !== 'live' || !N || calm) return;
    var r = box.getBoundingClientRect();
    scatter(cx - r.left, cy - r.top, power);
    ptr.seen = performance.now();
    wake();
  }
  function count() { return N; }
  // The hole eating the portrait (see the top of the file). Client px.
  function consume(cx, cy, reach, rd, amount) {
    if (held) return 1;
    if (mode !== 'live' || !N || calm) return 0;
    eat.x = cx; eat.y = cy; eat.reach = reach; eat.rd = rd; eat.amount = amount; eat.until = performance.now() + 100;
    wake();
    return nGone / N;
  }
  function spit(cx, cy) {
    eat.until = 0;
    if (held || !N) return;
    var r = box.getBoundingClientRect(), x = cx - r.left, y = cy - r.top;
    for (var i = 0; i < N; i++) {
      if (gone[i] >= 1) {
        var a = u3[i] * TAU, v = (300 + u2[i] * 900) * unit * 2;
        X[i] = x + Math.cos(a) * 6; Y[i] = y + Math.sin(a) * 6; VX[i] = Math.cos(a) * v; VY[i] = Math.sin(a) * v;
      }
      gone[i] = 0;
    }
    nGone = 0;
    wake();
  }
  function keep() {
    if (!N) return;
    held = true; eat.until = 0; flashAt = 0;
    gone.fill(1); nGone = N; field.fill(0);
    wake();
  }
  function restore(pts, instant) {
    held = false; eat.until = 0; nGone = 0;
    if (!N) return;
    var r = box.getBoundingClientRect(), n = pts ? pts.length >> 1 : 0, now = performance.now(), i;
    if (instant || calm) { gone.fill(0); home(); wake(); return; }
    for (i = 0; i < N; i++) {
      var k = n ? (i % n) * 2 : -1, a = u3[i] * TAU, v = (200 + u2[i] * 700) * unit * 2;
      X[i] = (k < 0 ? W / 2 : pts[k] - r.left) + Math.cos(a) * 8; Y[i] = (k < 0 ? H / 2 : pts[k + 1] - r.top) + Math.sin(a) * 8;
      VX[i] = Math.cos(a) * v; VY[i] = Math.sin(a) * v;
      gone[i] = -(0.02 + u1[i] * 0.8);
    }
    flashAt = now + 1900; flashEnd = flashAt + 1100;
    ptr.seen = now;
    wake();
  }
  function live(formed) {
    mode = 'live';
    resize();
    if (formed && N) { appear = 1; home(); }
    box.classList.add('is-live');
    wake();
  }
  function hide() {
    mode = 'wait';
    cancelAnimationFrame(raf); raf = 0;
    box.classList.remove('is-live');
    field.fill(0);
  }

  /* ---------- wiring ---------- */
  if (window.ResizeObserver) new ResizeObserver(function () { resize(); wake(); }).observe(box);
  else window.addEventListener('resize', function () { resize(); wake(); });
  if (window.IntersectionObserver) new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; wake(); }).observe(box);
  document.addEventListener('visibilitychange', wake);
  new MutationObserver(loadDots).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  window.addEventListener('scroll', wake, { passive: true });
  function motionChanged() { calm = readCalm(); whole = wholeTo = 0; look.yaw = look.pitch = 0; wake(); }
  motionMQ.addEventListener('change', motionChanged);
  document.addEventListener('jj:motionchange', motionChanged);

  resize();
  loadDots();
  loadPhoto();

  window.HeroFace = { intro: intro, live: live, hide: hide, push: push, attract: attract, burst: burst, count: count, consume: consume, spit: spit, keep: keep, restore: restore };
})();
