/* Hero intro "Every part earns its place".
   Every pixel and every inline style is a pure function of time inside seek(t):
   no CSS animations, no timers, nothing carried from one frame to the next.
   120 BPM, one event per beat (0.5 s), 14 beats:
     1-3   one dot splits into a ring of eight          (dark)
     4     the ring opens like an iris                   (cream field)
     5-8   statement type, one word selected             (camera push and pull)
     9     everything unselected is cut; the selection becomes a card (dark)
     10    the card tilts into 3D and comes apart in four layers
     11    the layers turn into their own grids of points
     12    the points gather into a sphere               (indigo field)
     13    the sphere flattens into one bar where the headline sits (dark)
     14    the bar wipes aside: it is the headline

   Markup contract (all inside or near section.hero):
     canvas[data-cut-canvas]   the stage
        data-words="EVERY|PART|EARNS ITS PLACE."   first word | selected word | second line
        data-layers="surface|states|rules|data"    labels of the four layers
        data-label="PARTS"                         label of the counter
     [data-cut-line]           the headline block (revealed by the last wipe)
     [data-cut-rise]           elements that settle after the headline, in DOM order
     [data-cut-nav]            the fixed nav (slides down at the end)
     [data-cut-replay]         replay button
   Colours come from CSS custom properties on the canvas:
     --cut-ink, --cut-cream, --cut-indigo, --cut-line
   html.cut-pending (set before first paint) hides the DOM parts until the first frame. */
(function () {
  'use strict';

  var WIPE = 6.5;                // beat 14: the bar becomes the headline
  var SHORT_FROM = 5.5;          // return visits start at beat 12
  var RISE_AT = WIPE + 0.45, RISE_STEP = 0.1, RISE_DUR = 0.5;
  var SUBFRAMES = 3, SHUTTER = 0.0125;
  var MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  var N = 384, TAU = Math.PI * 2;

  var root = document.documentElement;
  var canvas = document.querySelector('[data-cut-canvas]');
  if (!canvas) return;
  var main = canvas.getContext('2d');
  var buf = document.createElement('canvas'), bx = buf.getContext('2d');

  var W = 0, H = 0, K = 1, U = 1, col = {}, fontFamily = 'sans-serif';
  var raf = 0, playing = false, xrayOn = false;
  var lowQ = false;              // set when the device cannot hold the frame rate: sharper cost, same motion

  /* ---------- easing, as functions of time ---------- */
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function lerp(a, b, p) { return a + (b - a) * p; }
  function prog(t, start, dur) { return clamp((t - start) / dur, 0, 1); }
  function expoOut(p) { return p >= 1 ? 1 : 1 - Math.pow(2, -10 * p); }
  function expoIn(p) { return p <= 0 ? 0 : Math.pow(2, 10 * (p - 1)); }
  function expoInOut(p) {
    if (p <= 0) return 0; if (p >= 1) return 1;
    return p < 0.5 ? Math.pow(2, 20 * p - 10) / 2 : (2 - Math.pow(2, -20 * p + 10)) / 2;
  }
  // Damped spring, damping ratio about 0.8: settles in ~0.4 s with ~1% overshoot.
  function spring(t) {
    if (t <= 0) return 0;
    var w = 10, d = 14;
    return 1 - Math.exp(-d * t) * (Math.cos(w * t) + (d / w) * Math.sin(w * t));
  }

  /* ---------- measuring (layout only, no animation state) ---------- */
  function els() {
    return {
      line: document.querySelector('[data-cut-line]'),
      rise: Array.prototype.slice.call(document.querySelectorAll('[data-cut-rise]')),
      nav: document.querySelector('[data-cut-nav]')
    };
  }
  function duration() {
    return RISE_AT + Math.max(0, els().rise.length - 1) * RISE_STEP + RISE_DUR + 0.1;
  }
  function size() {
    var r = canvas.getBoundingClientRect();
    var w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    var k = Math.min(window.devicePixelRatio || 1, lowQ ? 1 : 2, 2560 / w);
    if (w !== W || h !== H || k !== K) {
      W = w; H = h; K = k;
      canvas.width = buf.width = Math.round(W * K);
      canvas.height = buf.height = Math.round(H * K);
    }
    U = Math.min(W, H);
    var cs = getComputedStyle(canvas);
    function v(name, fb) { return cs.getPropertyValue(name).trim() || fb; }
    col.ink = v('--cut-ink', '#1c1a17');
    col.cream = v('--cut-cream', '#f0ede8');
    col.indigo = v('--cut-indigo', '#5c5cd4');
    col.line = v('--cut-line', '#8080f0');
    var e = els();
    if (e.line) fontFamily = getComputedStyle(e.line).fontFamily;
  }
  // The headline's text box in canvas coordinates, padded: the one part that stays.
  function geom() {
    var e = els(), cr = canvas.getBoundingClientRect(), r;
    if (e.line) {
      var range = document.createRange();
      range.selectNodeContents(e.line);
      r = range.getBoundingClientRect();
    }
    if (!r || !r.width) r = { left: cr.left + W * 0.1, right: cr.left + W * 0.9, top: cr.top + H * 0.45, bottom: cr.top + H * 0.55, height: H * 0.1 };
    var my = Math.round(r.height * 0.12) + 4, mx = Math.round(Math.min(r.height, 90) * 0.3) + 4;
    var g = {
      x1: clamp(r.left - cr.left - mx, 0, W), x2: clamp(r.right - cr.left + mx, 0, W),
      y1: clamp(r.top - cr.top - my, 0, H), y2: clamp(r.bottom - cr.top + my, 0, H)
    };
    g.cy = (g.y1 + g.y2) / 2;
    return g;
  }
  function list(attr, fallback) { return (canvas.getAttribute(attr) || fallback).split('|'); }

  /* ---------- bar 1: one dot becomes a ring, the ring becomes the field ---------- */
  var SPLIT_AT = [0, 0.25, 0.5, 1.0], RING = [0, 0.07, 0.11, 0.15];
  function drawDots(c, t) {
    var cx = W / 2, cy = H / 2, diag = Math.sqrt(W * W + H * H) / 2 + 20;
    c.fillStyle = col.ink; c.fillRect(0, 0, W, H);
    var L = 0;
    for (var s = 0; s < SPLIT_AT.length; s++) if (t >= SPLIT_AT[s]) L = s;
    var n = 1 << L, p = expoOut(prog(t, SPLIT_AT[L], 0.35));
    var rot = t * 1.3 - Math.PI / 2;
    // Beat 4: the centre swells to fill the ring, then opens to the edges.
    var disc = U * RING[3] * expoOut(prog(t, 1.5, 0.18)) + (diag - U * RING[3]) * Math.pow(prog(t, 1.62, 0.38), 3);
    if (disc > 0) { c.fillStyle = col.cream; c.beginPath(); c.arc(cx, cy, disc, 0, TAU); c.fill(); }
    var dot = U * 0.019 * (L === 0 ? spring(t) : 1);
    c.fillStyle = t >= 1.5 ? col.indigo : col.cream;
    for (var i = 0; i < n; i++) {
      var target = TAU * i / n, from = L > 1 ? TAU * (i - (i & 1)) / n : target;
      var a = rot + lerp(from, target, p);
      var rad = Math.max(lerp(U * RING[Math.max(0, L - 1)], U * RING[L], p), disc);
      c.beginPath(); c.arc(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, dot, 0, TAU); c.fill();
    }
  }

  /* ---------- bar 2: the statement, one word selected ---------- */
  function lockup(c) {
    var ws = list('data-words', 'EVERY|PART|EARNS ITS PLACE.');
    var A = ws[0] || 'EVERY', S = ws[1] || 'PART', two = (ws[2] || 'EARNS ITS PLACE.').split(' ');
    c.font = '900 100px ' + fontFamily;
    function m(s) { return c.measureText(s).width; }
    var wA = m(A), wS = m(S), w2 = m(two.join(' ')), w1 = wA + 44 + wS + 12;
    var k = Math.min(W * 0.8 / Math.max(w1, w2), H * 0.42 / 174), fs = 100 * k;
    var x0 = (W - Math.max(w1, w2) * k) / 2, yb1 = (H - 1.74 * fs) / 2 + 0.72 * fs;
    var L = { fs: fs, cap: 0.72 * fs, x0: x0, yb1: yb1, yb2: yb1 + 1.02 * fs, A: A, S: S, wA: wA * k, wS: wS * k, w1: w1 * k, w2: w2 * k };
    L.xS = x0 + L.wA + 0.44 * fs;
    L.box = { x: L.xS - 0.12 * fs, y: yb1 - L.cap - 0.14 * fs, w: L.wS + 0.24 * fs, h: L.cap + 0.28 * fs };
    L.two = [];
    var x = x0;
    for (var i = 0; i < two.length; i++) { var w = m(two[i]) * k; L.two.push({ s: two[i], x: x, w: w }); x += w + m(' ') * k; }
    return L;
  }
  function camera(t, L) {
    var keys = [
      [2.0, L.x0 + L.wA / 2, L.yb1 - L.cap / 2, Math.min(2.2, W * 0.82 / L.wA)],
      [2.5, L.x0 + L.w1 / 2, L.yb1 - L.cap / 2, Math.min(1.45, W * 0.9 / L.w1)],
      [3.0, L.x0 + L.w2 * 0.42, L.yb2 - L.cap / 2 - L.fs * 0.22, Math.min(1.5, W * 0.9 / (L.w2 * 0.84))],
      [3.5, W / 2, H / 2, 1]
    ];
    var a = keys[0], b = keys[0];
    for (var i = 1; i < keys.length; i++) if (t >= keys[i][0]) { a = keys[i - 1]; b = keys[i]; }
    var p = expoInOut(prog(t, b[0], 0.42));
    return { x: lerp(a[1], b[1], p), y: lerp(a[2], b[2], p), s: lerp(a[3], b[3], p) };
  }
  // A word that rises into, and later drops out of, its own slot.
  function word(c, s, x, yb, w, fs, inAt, outAt, t) {
    var a = expoOut(prog(t, inAt, 0.38)), b = expoIn(prog(t, outAt, 0.28));
    if (a <= 0 || b >= 1) return;
    c.save();
    c.beginPath(); c.rect(x - fs * 0.05, yb - fs * 0.95, w + fs * 0.1, fs * 1.2); c.clip();
    c.fillText(s, x, yb + (1 - a) * fs * 1.1 + b * fs * 1.25);
    c.restore();
  }
  function card() {
    var w = Math.min(W * 0.5, H * 0.46), h = w * 0.62;
    return { x: W / 2 - w / 2, y: H / 2 - h / 2, w: w, h: h };
  }
  function handles(c, r, scale, lw) {
    var hs = Math.max(5, lw * 2.6) * scale;
    if (hs <= 0.2) return;
    var pts = [[r.x, r.y], [r.x + r.w, r.y], [r.x, r.y + r.h], [r.x + r.w, r.y + r.h]];
    for (var i = 0; i < 4; i++) {
      c.fillStyle = col.cream; c.fillRect(pts[i][0] - hs / 2, pts[i][1] - hs / 2, hs, hs);
      c.strokeStyle = col.indigo; c.lineWidth = Math.max(1, lw * 0.6); c.strokeRect(pts[i][0] - hs / 2, pts[i][1] - hs / 2, hs, hs);
    }
  }
  function drawType(c, t) {
    var L = lockup(c), fs = L.fs, cam = camera(t, L), i;
    c.fillStyle = col.cream; c.fillRect(0, 0, W, H);
    if (t >= 4) {                                 // beat 9: the cut carries the dark in
      var edge = W * expoInOut(prog(t, 4, 0.36));
      c.fillStyle = col.ink; c.fillRect(0, 0, edge, H);
      c.fillStyle = col.line; c.fillRect(edge - 2, 0, edge < W ? 4 : 0, H);
    }
    c.save();
    c.translate(W / 2, H / 2); c.scale(cam.s, cam.s); c.translate(-cam.x, -cam.y);
    c.font = '900 ' + fs + 'px ' + fontFamily;
    c.textBaseline = 'alphabetic';
    c.fillStyle = col.ink;
    word(c, L.A, L.x0, L.yb1, L.wA, fs, 2.0, 4.0, t);
    word(c, L.S, L.xS, L.yb1, L.wS, fs, 2.58, 4.06, t);
    for (i = 0; i < L.two.length; i++) word(c, L.two[i].s, L.two[i].x, L.yb2, L.two[i].w, fs, 3.0 + 0.07 * i, 4.02 + 0.03 * i, t);
    // The selection: opens around the word, then travels and grows into the card.
    var open = spring(t - 2.5), lw = Math.max(2, fs * 0.03);
    if (open > 0) {
      var k = card(), mv = expoInOut(prog(t, 4.05, 0.42));
      var r = { x: lerp(L.box.x, k.x, mv), y: lerp(L.box.y, k.y, mv), w: lerp(L.box.w * open, k.w, mv), h: lerp(L.box.h, k.h, mv) };
      var fill = expoInOut(prog(t, 4.12, 0.36));
      if (fill > 0) { c.fillStyle = col.cream; c.fillRect(r.x, r.y + r.h * (1 - fill), r.w, r.h * fill); }
      c.strokeStyle = col.indigo; c.lineWidth = lw; c.strokeRect(r.x, r.y, r.w, r.h);
      handles(c, r, Math.min(1, open), lw);
    }
    c.restore();
  }

  /* ---------- bars 3-4: the card in 3D, its layers, its points ---------- */
  function view(t) {
    var e = expoInOut(prog(t, 4.5, 0.45));
    var tilt = 1.08 * e, yaw = -0.55 * e - 0.5 * Math.max(0, t - 4.5);
    return { ct: Math.cos(tilt), st: Math.sin(tilt), cy: Math.cos(yaw), sy: Math.sin(yaw), f: U * 2.2 };
  }
  function project(v, x, y, z) {
    var x1 = x * v.cy - y * v.sy, y1 = x * v.sy + y * v.cy;
    var y2 = y1 * v.ct - z * v.st, z2 = y1 * v.st + z * v.ct, s = v.f / (v.f + z2);
    return { x: W / 2 + x1 * s, y: H / 2 + y2 * s, s: s };
  }
  function gap(t) { return U * 0.13 * expoOut(prog(t, 4.55, 0.4)) + U * 0.04 * expoOut(prog(t, 5.0, 0.4)); }
  function drawLayers(c, t) {
    var k = card(), v = view(t), sep = gap(t), names = list('data-layers', 'surface|states|rules|data');
    var lw = Math.max(1.5, U * 0.003), i, q;
    c.font = '500 ' + Math.round(clamp(W / 1440, 0.75, 1.2) * 11) + 'px ' + MONO;
    c.textBaseline = 'middle';
    for (i = 3; i >= 0; i--) {
      var z = (1.5 - i) * sep, wipe = expoInOut(prog(t, 5.0 + 0.04 * i, 0.35));
      var xr = lerp(k.w / 2, -k.w / 2, wipe);           // the fill retracts, leaving its points
      if (wipe < 1) {
        var a = project(v, -k.w / 2, -k.h / 2, z), b = project(v, xr, -k.h / 2, z);
        var d = project(v, -k.w / 2, k.h / 2, z), e = project(v, xr, k.h / 2, z);
        c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.lineTo(e.x, e.y); c.lineTo(d.x, d.y); c.closePath();
        if (i === 0) { c.fillStyle = col.cream; c.fill(); }
        else if (i === 1) { c.fillStyle = col.indigo; c.fill(); }
        else { c.fillStyle = col.ink; c.fill(); c.strokeStyle = i === 2 ? col.line : col.cream; c.lineWidth = lw; c.stroke(); }
      }
      // Label on a leader line, drawn out on beat 10 and pulled back on beat 11.
      q = expoOut(prog(t, 4.62 + 0.05 * i, 0.3)) * (1 - expoInOut(prog(t, 4.98, 0.2)));
      if (q > 0.01 && names[i]) {
        var anchor = project(v, k.w / 2, 0, z), lead = U * 0.05 * q, tx = anchor.x + 10 + lead + 8;
        c.fillStyle = col.cream; c.fillRect(anchor.x + 10, anchor.y - 0.5, lead, 1);
        c.save();
        c.beginPath(); c.rect(tx, anchor.y - 10, c.measureText(names[i]).width * q, 20); c.clip();
        c.fillText(names[i], tx, anchor.y);
        c.restore();
      }
    }
    if (t < 4.75) handles(c, k, 1 - expoOut(prog(t, 4.5, 0.2)), Math.max(2, lockup(c).fs * 0.03));
  }
  // One of 384 points: on its layer, then on the sphere, then in the headline bar.
  function drawPoints(c, t, g) {
    var k = card(), v = view(t), sep = gap(t), R = U * 0.25;
    var cw = (g.x2 - g.x1) / 48, chh = (g.y2 - g.y1) / 8, base = Math.max(2, U * 0.007);
    var grow = expoIn(prog(t, 6.22, 0.27));
    c.fillStyle = col.cream;
    for (var i = 0; i < N; i++) {
      var layer = i / 96 | 0, j = i % 96, gx = j % 12, gy = j / 12 | 0;
      var lx = (gx / 11 - 0.5) * k.w * 0.86, ly = (gy / 7 - 0.5) * k.h * 0.8, lz = (1.5 - layer) * sep;
      if (t < 5.5) {                                     // only where the fill has gone
        var wipe = expoInOut(prog(t, 5.0 + 0.04 * layer, 0.35));
        if (lx < lerp(k.w / 2, -k.w / 2, wipe)) continue;
      }
      var yy = 1 - 2 * (i + 0.5) / N, rr = Math.sqrt(1 - yy * yy), ph = i * 2.39996;
      var st = (i * 0.618) % 1, m1 = expoInOut(prog(t - st * 0.1, 5.5, 0.38));
      var p = project(v, lerp(lx, rr * Math.cos(ph) * R, m1), lerp(ly, yy * R, m1), lerp(lz, rr * Math.sin(ph) * R, m1));
      var m2 = expoInOut(prog(t - st * 0.1, 6.0, 0.36));
      var x = lerp(p.x, g.x1 + (i % 48 + 0.5) * cw, m2), y = lerp(p.y, g.y1 + ((i / 48 | 0) + 0.5) * chh, m2);
      var w = lerp(base * p.s, cw + 0.8, grow * m2), h = lerp(base * p.s, chh + 0.8, grow * m2);
      c.fillRect(x - w / 2, y - h / 2, w, h);
    }
  }

  /* ---------- the read-outs in the corners (the data moment) ---------- */
  var COUNT = [[0, 1], [0.25, 2], [0.5, 4], [1, 8], [2, 1], [2.5, 2], [3, 5], [4, 1], [4.5, 4], [5, 384], [6, 1]];
  function count(t) {
    var v0 = 0, v1 = 0, tk = 0;
    for (var i = 0; i < COUNT.length; i++) if (t >= COUNT[i][0]) { v0 = i ? COUNT[i - 1][1] : 0; v1 = COUNT[i][1]; tk = COUNT[i][0]; }
    return Math.round(lerp(v0, v1, expoOut(prog(t, tk, 0.3))));
  }
  function drawChip(c, t, fixed) {
    var u = clamp(W / 1440, 0.7, 1.25), pad = Math.round(Math.max(16, W * 0.03));
    var label = canvas.getAttribute('data-label') || 'PARTS', num = fixed || String(count(t));
    c.textBaseline = 'alphabetic';
    c.font = '500 ' + Math.round(11 * u) + 'px ' + MONO;
    var lw = c.measureText(label).width;
    c.font = '900 ' + Math.round(26 * u) + 'px ' + fontFamily;
    var nw = c.measureText(num).width;
    var h = Math.round(44 * u), w = Math.round(lw + nw + 38 * u);
    var open = fixed ? 1 : expoOut(prog(t, 0.05, 0.3));
    var y = H - pad - h + (fixed ? 0 : expoIn(prog(t, WIPE, 0.35)) * (pad + h + 8));
    c.save();
    c.beginPath(); c.rect(pad, y, w * open, h); c.clip();
    c.fillStyle = col.indigo; c.fillRect(pad, y, w, h);
    c.fillStyle = col.cream;
    c.font = '500 ' + Math.round(11 * u) + 'px ' + MONO;
    c.fillText(label, pad + 13 * u, y + h / 2 + 4 * u);
    c.font = '900 ' + Math.round(26 * u) + 'px ' + fontFamily;
    c.fillText(num, pad + 25 * u + lw, y + h / 2 + 9.5 * u);
    c.restore();
  }
  function two(n) { return (n < 10 ? '0' : '') + n; }
  function drawHud(c, t) {
    var open = expoOut(prog(t, 0.05, 0.35)) * (1 - expoIn(prog(t, WIPE - 0.3, 0.3)));
    if (open <= 0.01) return;
    var u = clamp(W / 1440, 0.75, 1.2), pad = Math.round(Math.max(16, W * 0.03)), tick = 10 * open;
    c.fillStyle = (t >= 1.85 && t < 4.18) ? col.ink : col.cream;
    c.fillRect(pad, pad, tick, 1); c.fillRect(pad, pad, 1, tick);
    c.fillRect(W - pad - tick, pad, tick, 1); c.fillRect(W - pad - 1, pad, 1, tick);
    c.font = '500 ' + Math.round(11 * u) + 'px ' + MONO;
    c.textBaseline = 'top';
    var beat = Math.min(14, Math.floor(t / 0.5) + 1), frame = Math.floor((t % 1) * 60);
    var left = 'JJ / 120 BPM', right = '00:' + two(Math.floor(t)) + ':' + two(frame) + '  ' + two(beat) + '/14';
    var rw = c.measureText(right).width, lw = c.measureText(left).width;
    c.save(); c.beginPath(); c.rect(pad + 14, pad, lw * open + 2, 24); c.clip(); c.fillText(left, pad + 14, pad + 6); c.restore();
    c.save(); c.beginPath(); c.rect(W - pad - 14 - rw * open, pad, rw * open + 2, 24); c.clip(); c.fillText(right, W - pad - 14 - rw, pad + 6); c.restore();
  }

  /* ---------- one frame of canvas at time t ---------- */
  function render(c, t, g) {
    var p;
    if (t < 2) {
      drawDots(c, t);
    } else if (t < 4.5) {
      drawType(c, t);
    } else if (t < 6) {
      c.fillStyle = col.ink; c.fillRect(0, 0, W, H);
      p = expoInOut(prog(t, 5.5, 0.4));               // beat 12: indigo opens from the centre
      if (p > 0) { c.fillStyle = col.indigo; c.beginPath(); c.arc(W / 2, H / 2, p * (Math.sqrt(W * W + H * H) / 2 + 20), 0, TAU); c.fill(); }
      if (t < 5.5) drawLayers(c, t);
      if (t >= 5) drawPoints(c, t, g);
    } else if (t < WIPE) {                            // beat 13: the field shuts onto the bar
      c.fillStyle = col.ink; c.fillRect(0, 0, W, H);
      p = expoInOut(prog(t, 6, 0.45));
      var top = lerp(0, g.cy, p), bot = lerp(H, g.cy, p);
      c.fillStyle = col.indigo; c.fillRect(0, top, W, bot - top);
      drawPoints(c, t, g);
    } else {                                          // beat 14: the bar wipes into the headline
      c.fillStyle = col.ink; c.fillRect(0, 0, W, H);
      p = expoInOut(prog(t, WIPE, 0.45));
      var edge = lerp(g.x1, g.x2, p);
      c.fillStyle = col.cream; c.fillRect(edge, g.y1, g.x2 - edge, g.y2 - g.y1);
      if (p > 0 && p < 1) { c.fillStyle = col.line; c.fillRect(edge - 1.5, g.y1, 3, g.y2 - g.y1); }
    }
    drawHud(c, t);
    drawChip(c, t);
  }

  /* ---------- the DOM half of the frame ---------- */
  function applyDom(t, g, T) {
    var e = els(), done = t >= T, i;
    if (e.line) {
      if (done) e.line.style.clipPath = '';
      else {
        var cr = canvas.getBoundingClientRect(), r = e.line.getBoundingClientRect();
        var edge = lerp(g.x1, g.x2, expoInOut(prog(t, WIPE, 0.45))) + cr.left;
        var inset = t < WIPE ? r.width + 40 : clamp(r.right - edge, 0, r.width + 40);
        e.line.style.clipPath = 'inset(-0.3em ' + inset.toFixed(1) + 'px -0.3em -0.3em)';
      }
    }
    for (i = 0; i < e.rise.length; i++) {
      var p = expoOut(prog(t, RISE_AT + i * RISE_STEP, RISE_DUR));
      e.rise[i].style.opacity = done ? '' : p.toFixed(3);
      e.rise[i].style.transform = done ? '' : 'translate3d(0,' + ((1 - p) * 20).toFixed(2) + 'px,0)';
    }
    if (e.nav) {
      var n = expoOut(prog(t, WIPE + 0.1, 0.5));
      e.nav.style.transform = done ? '' : 'translate3d(0,' + (-(1 - n) * 100).toFixed(2) + '%,0)';
    }
    root.classList.remove('cut-pending');
  }

  /* ---------- seek: the whole piece at time t ---------- */
  function seek(t) {
    size();
    var T = duration(), g = geom();
    t = clamp(t, 0, T);
    main.setTransform(1, 0, 0, 1, 0, 0);
    // Motion blur: average a few sub-frames across the shutter, so fast moves
    // smear along their own direction and still parts stay sharp.
    var n = lowQ ? 1 : SUBFRAMES;
    for (var i = 0; i < n; i++) {
      bx.setTransform(K, 0, 0, K, 0, 0);
      render(bx, Math.max(0, t - SHUTTER * i / n), g);
      main.globalAlpha = 1 / (i + 1);
      main.drawImage(buf, 0, 0);
    }
    main.globalAlpha = 1;
    applyDom(t, g, T);
  }

  /* ---------- X-ray: show the selection that survived ---------- */
  function drawXray(p) {
    size();
    var g = geom(), e = expoOut(p);
    main.setTransform(K, 0, 0, K, 0, 0);
    main.clearRect(0, 0, W, H);
    main.fillStyle = col.line;
    main.fillRect(W / 2 - W * e / 2, Math.round(g.y1), W * e, 1);
    main.fillRect(W / 2 - W * e / 2, Math.round(g.y2), W * e, 1);
    main.fillRect(Math.round(g.x1), g.cy - H * e / 2, 1, H * e);
    main.fillRect(Math.round(g.x2), g.cy - H * e / 2, 1, H * e);
    handles(main, { x: g.x1, y: g.y1, w: g.x2 - g.x1, h: g.y2 - g.y1 }, e, 2);
    if (e > 0.5) drawChip(main, 0, '1 / 384');
  }
  function xray(on) {
    xrayOn = !!on;
    if (playing) return;
    cancelAnimationFrame(raf);
    if (!xrayOn) { canvas.style.display = 'none'; return; }
    canvas.style.display = 'block';
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { drawXray(1); return; }
    var t0 = performance.now();
    (function tick(now) {
      var p = clamp((now - t0) / 500, 0, 1);
      drawXray(p);
      if (p < 1 && xrayOn && !playing) raf = requestAnimationFrame(tick);
    })(t0);
  }

  /* ---------- transport ---------- */
  var SKIP = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
  function finish() {
    cancelAnimationFrame(raf);
    var was = playing;
    playing = false;
    SKIP.forEach(function (n) { window.removeEventListener(n, finish, true); });
    seek(duration());
    canvas.style.display = 'none';
    root.classList.remove('cut-playing', 'cut-pending');
    if (xrayOn) xray(true);
    if (was) document.dispatchEvent(new CustomEvent('jj:cutdone'));
  }
  function play(from) {
    cancelAnimationFrame(raf);
    if (window.scrollY > 40) { finish(); return; }
    playing = true;
    root.classList.add('cut-playing');
    canvas.style.display = 'block';
    var start = from || 0, t0 = 0, T = duration(), last = 0, slow = 0;
    seek(start);
    var go = function () {
      if (!playing) return;
      SKIP.forEach(function (n) { window.addEventListener(n, finish, { capture: true, passive: true }); });
      raf = requestAnimationFrame(function tick(now) {
        if (!playing) return;
        if (!t0) t0 = now;
        // Six frames slower than 24 ms: drop the blur and the retina buffer.
        if (last && now - last > 24 && ++slow > 6) lowQ = true;
        last = now;
        var t = start + (now - t0) / 1000;
        if (t >= T) { finish(); return; }
        seek(t);
        raf = requestAnimationFrame(tick);
      });
    };
    // Wait for the display face so the type is drawn in it, but never for long.
    var ready = document.fonts && document.fonts.load ? document.fonts.load('900 100px ' + fontFamily) : Promise.resolve();
    Promise.race([ready, new Promise(function (r) { setTimeout(r, 900); })]).then(go, go);
  }

  // The X-ray lines sit on a fixed canvas but follow the headline, so redraw
  // them when the page scrolls or resizes.
  var redrawQueued = false;
  function redrawXray() {
    if (redrawQueued || playing || !xrayOn) return;
    redrawQueued = true;
    requestAnimationFrame(function () { redrawQueued = false; if (!playing && xrayOn) drawXray(1); });
  }
  window.addEventListener('resize', redrawXray);
  window.addEventListener('scroll', redrawXray, { passive: true });
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('[data-cut-replay]');
    if (b) { ev.preventDefault(); window.scrollTo(0, 0); play(0); }
  });

  window.HeroCut = {
    seek: seek, play: play, skip: finish, xray: xray,
    get duration() { return duration(); },
    SHORT_FROM: SHORT_FROM
  };

  if (root.classList.contains('intro-run')) play(0);
  else if (root.classList.contains('intro-short')) play(SHORT_FROM);
  else finish();
})();
