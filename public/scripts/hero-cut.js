/* Hero intro "Every part earns its place".
   Every pixel and every inline style is a pure function of time inside seek(t):
   no CSS animations, no timers, nothing carried from one frame to the next.
   120 BPM, one event per beat (0.5 s), 14 beats:
     1-3   one dot splits into a ring of eight          (dark)
     4     the ring opens like an iris                   (cream field)
     5-8   statement type, one word selected             (camera push and pull)
     9     everything unselected is cut; the selection becomes a card (dark)
     10    the card tilts into 3D and comes apart in four layers
     11    the camera dives into the top layer; a dot matrix fills the screen (cream)
     12    a ripple crosses the matrix and lifts it into a sphere (indigo)
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
  // The stage is drawn once per frame at device resolution (up to 2x, capped at
  // about 4 megapixels). Smear on fast moves is drawn per element, not per frame.
  var PIXELS = 4.2e6;
  var MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  var TAU = Math.PI * 2;

  var root = document.documentElement;
  var canvas = document.querySelector('[data-cut-canvas]');
  if (!canvas) return;
  var main = canvas.getContext('2d');

  var W = 0, H = 0, K = 1, U = 1, col = {}, fontFamily = 'sans-serif';
  var raf = 0, playing = false, xrayOn = false;
  var lowQ = false;              // set when the device cannot hold the frame rate
  var stale = true;              // colours and font are re-read on play, X-ray and resize
  var memo = { key: '', L: null };

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
  function size(e) {
    var w = Math.max(1, window.innerWidth), h = Math.max(1, window.innerHeight);
    var k = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt((lowQ ? 1.5e6 : PIXELS) / (w * h)));
    if (w !== W || h !== H || k !== K) {
      W = w; H = h; K = k; stale = true;
      canvas.width = Math.round(W * K);
      canvas.height = Math.round(H * K);
    }
    U = Math.min(W, H);
    if (!stale) return;
    stale = false;
    var cs = getComputedStyle(canvas);
    function v(name, fb) { return cs.getPropertyValue(name).trim() || fb; }
    col.ink = v('--cut-ink', '#1c1a17');
    col.cream = v('--cut-cream', '#f0ede8');
    col.indigo = v('--cut-indigo', '#5c5cd4');
    col.line = v('--cut-line', '#8080f0');
    if (e.line) fontFamily = getComputedStyle(e.line).fontFamily;
  }
  // The headline's text box in viewport coordinates, padded: the one part that stays.
  var geomMemo = null;
  function geom(e) {
    if (playing && geomMemo && geomMemo.w === W && geomMemo.h === H) return geomMemo.g;
    var r;
    if (e.line) {
      var range = document.createRange();
      range.selectNodeContents(e.line);
      r = range.getBoundingClientRect();
    }
    if (!r || !r.width) r = { left: W * 0.1, right: W * 0.9, top: H * 0.45, bottom: H * 0.55, height: H * 0.1 };
    var my = Math.round(r.height * 0.12) + 4, mx = Math.round(Math.min(r.height, 90) * 0.3) + 4;
    var g = {
      x1: clamp(r.left - mx, 0, W), x2: clamp(r.right + mx, 0, W),
      y1: clamp(r.top - my, 0, H), y2: clamp(r.bottom + my, 0, H)
    };
    g.cy = (g.y1 + g.y2) / 2;
    geomMemo = { w: W, h: H, g: g };
    return g;
  }
  function list(attr, fallback) { return (canvas.getAttribute(attr) || fallback).split('|'); }
  // The dot matrix: one point per cell across the whole viewport.
  function matrix() {
    var sp = Math.max(W, H) / 34, cols = Math.ceil(W / sp) + 1, rows = Math.ceil(H / sp) + 1;
    return { sp: sp, cols: cols, rows: rows, n: cols * rows, ox: (W - (cols - 1) * sp) / 2, oy: (H - (rows - 1) * sp) / 2 };
  }

  /* ---------- bar 1: one dot becomes a ring, the ring becomes the field ---------- */
  var SPLIT_AT = [0, 0.25, 0.5, 1.0], RING = [0, 0.1, 0.16, 0.22];
  function drawDots(c, t) {
    var cx = W / 2, cy = H / 2, diag = Math.sqrt(W * W + H * H) / 2 + 20;
    c.fillStyle = col.ink; c.fillRect(0, 0, W, H);
    var L = 0;
    for (var s = 0; s < SPLIT_AT.length; s++) if (t >= SPLIT_AT[s]) L = s;
    var n = 1 << L, p = expoOut(prog(t, SPLIT_AT[L], 0.35));
    var rot = t * 1.5 - Math.PI / 2;
    // Beat 4: the centre swells to fill the ring, then opens to the edges.
    var disc = U * RING[3] * expoOut(prog(t, 1.5, 0.18)) + (diag - U * RING[3]) * Math.pow(prog(t, 1.62, 0.38), 3);
    if (disc > 0) { c.fillStyle = col.cream; c.beginPath(); c.arc(cx, cy, disc, 0, TAU); c.fill(); }
    var dot = U * 0.03 * (L === 0 ? spring(t) : 1);
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
    var words = canvas.getAttribute('data-words') || 'EVERY|PART|EARNS ITS PLACE.';
    var key = [W, H, words, fontFamily].join('/');
    if (memo.key === key) return memo.L;
    var ws = words.split('|');
    var A = ws[0] || 'EVERY', S = ws[1] || 'PART', two = (ws[2] || 'EARNS ITS PLACE.').split(' ');
    c.font = '900 100px ' + fontFamily;
    function m(s) { return c.measureText(s).width; }
    var wA = m(A), wS = m(S), w2 = m(two.join(' ')), w1 = wA + 44 + wS + 12;
    var k = Math.min(W * 0.88 / Math.max(w1, w2), H * 0.5 / 174), fs = 100 * k;
    var x0 = (W - Math.max(w1, w2) * k) / 2, yb1 = (H - 1.74 * fs) / 2 + 0.72 * fs;
    var L = { fs: fs, cap: 0.72 * fs, x0: x0, yb1: yb1, yb2: yb1 + 1.02 * fs, A: A, S: S, wA: wA * k, wS: wS * k, w1: w1 * k, w2: w2 * k };
    L.xS = x0 + L.wA + 0.44 * fs;
    L.box = { x: L.xS - 0.12 * fs, y: yb1 - L.cap - 0.14 * fs, w: L.wS + 0.24 * fs, h: L.cap + 0.28 * fs };
    L.two = [];
    var x = x0;
    for (var i = 0; i < two.length; i++) { var w = m(two[i]) * k; L.two.push({ s: two[i], x: x, w: w }); x += w + m(' ') * k; }
    memo.key = key; memo.L = L;
    return L;
  }
  function camera(t, L) {
    var keys = [
      [2.0, L.x0 + L.wA / 2, L.yb1 - L.cap / 2, Math.min(2.4, W * 0.9 / L.wA)],
      [2.5, L.x0 + L.w1 / 2, L.yb1 - L.cap / 2, Math.min(1.5, W * 0.94 / L.w1)],
      [3.0, L.x0 + L.w2 * 0.4, L.yb2 - L.cap / 2 - L.fs * 0.18, Math.min(1.7, W * 0.94 / (L.w2 * 0.8))],
      [3.5, W / 2, H / 2, 1]
    ];
    var a = keys[0], b = keys[0];
    for (var i = 1; i < keys.length; i++) if (t >= keys[i][0]) { a = keys[i - 1]; b = keys[i]; }
    var p = expoInOut(prog(t, b[0], 0.44));
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
    var w = Math.min(W * 0.56, H * 0.74), h = w * 0.62;
    return { x: W / 2 - w / 2, y: H / 2 - h / 2, w: w, h: h };
  }
  function handles(c, r, scale, lw) {
    var hs = Math.max(6, lw * 2.6) * scale;
    if (hs <= 0.2) return;
    var pts = [[r.x, r.y], [r.x + r.w, r.y], [r.x, r.y + r.h], [r.x + r.w, r.y + r.h], [r.x + r.w / 2, r.y], [r.x + r.w / 2, r.y + r.h]];
    for (var i = 0; i < pts.length; i++) {
      c.fillStyle = col.cream; c.fillRect(pts[i][0] - hs / 2, pts[i][1] - hs / 2, hs, hs);
      c.strokeStyle = col.indigo; c.lineWidth = Math.max(1, lw * 0.6); c.strokeRect(pts[i][0] - hs / 2, pts[i][1] - hs / 2, hs, hs);
    }
  }
  function monoSize() { return Math.round(clamp(W / 1440, 0.8, 1.25) * 11); }
  // Two-line read-out beside a box, like a design tool's inspector.
  function readout(c, x, y, a, b, q, fg) {
    if (q <= 0.01) return;
    var fs = monoSize();
    c.font = '500 ' + fs + 'px ' + MONO; c.textBaseline = 'top';
    var w = Math.max(c.measureText(a).width, c.measureText(b).width);
    if (x + w > W - 16) x = W - 16 - w;
    c.save();
    c.beginPath(); c.rect(x, y, w * q + 1, fs * 3); c.clip();
    c.fillStyle = fg; c.fillText(a, x, y);
    c.fillStyle = col.line; c.fillText(b, x, y + fs * 1.5);
    c.restore();
  }
  function pad3(n) { n = Math.round(n); return (n < 10 ? '00' : n < 100 ? '0' : '') + n; }
  function drawType(c, t) {
    var L = lockup(c), fs = L.fs, cam = camera(t, L), i;
    c.fillStyle = col.cream; c.fillRect(0, 0, W, H);
    if (t >= 4) {                                 // beat 9: the cut carries the dark in
      var edge = W * expoInOut(prog(t, 4, 0.36));
      c.fillStyle = col.ink; c.fillRect(0, 0, edge, H);
      if (edge < W) { c.fillStyle = col.line; c.fillRect(edge - 3, 0, 6, H); }
    }
    // Smear: while the camera moves fast the type is drawn several times along
    // the path it just travelled, so the blur follows speed and direction.
    var prev = camera(t - 0.022, L);
    var speed = (Math.abs(cam.x - prev.x) + Math.abs(cam.y - prev.y)) * cam.s + Math.abs(cam.s - prev.s) * W;
    var passes = lowQ ? 1 : speed > 60 ? 7 : speed > 8 ? 4 : 1;
    c.font = '900 ' + fs + 'px ' + fontFamily;
    c.textBaseline = 'alphabetic';
    c.fillStyle = col.ink;
    for (var s = passes - 1; s >= 0; s--) {
      var f = passes > 1 ? s / (passes - 1) : 0;
      c.save();
      c.translate(W / 2, H / 2); c.scale(lerp(cam.s, prev.s, f), lerp(cam.s, prev.s, f)); c.translate(-lerp(cam.x, prev.x, f), -lerp(cam.y, prev.y, f));
      c.globalAlpha = passes > 1 ? 1.6 / passes : 1;
      word(c, L.A, L.x0, L.yb1, L.wA, fs, 2.0, 4.0, t);
      word(c, L.S, L.xS, L.yb1, L.wS, fs, 2.58, 4.06, t);
      for (i = 0; i < L.two.length; i++) word(c, L.two[i].s, L.two[i].x, L.yb2, L.two[i].w, fs, 3.0 + 0.07 * i, 4.02 + 0.03 * i, t);
      c.restore();
    }
    c.save();
    c.translate(W / 2, H / 2); c.scale(cam.s, cam.s); c.translate(-cam.x, -cam.y);
    // The selection: opens around the word, then travels and grows into the card.
    var open = spring(t - 2.5), lw = Math.max(2, fs * 0.03);
    if (open > 0) {
      var k = card(), mv = expoInOut(prog(t, 4.05, 0.42));
      var r = { x: lerp(L.box.x, k.x, mv), y: lerp(L.box.y, k.y, mv), w: lerp(L.box.w * open, k.w, mv), h: lerp(L.box.h, k.h, mv) };
      var fill = expoInOut(prog(t, 4.12, 0.36));
      if (fill > 0) { c.fillStyle = col.cream; c.fillRect(r.x, r.y + r.h * (1 - fill), r.w, r.h * fill); }
      c.strokeStyle = col.indigo; c.lineWidth = lw; c.strokeRect(r.x, r.y, r.w, r.h);
      handles(c, r, Math.min(1, open), lw);
      if (t >= 4.05) readout(c, r.x + r.w + 14, r.y, 'W ' + pad3(r.w) + '  H ' + pad3(r.h), 'SELECTED 1/5', expoOut(prog(t, 4.1, 0.3)), col.cream);
    }
    c.restore();
  }

  /* ---------- bars 3-4: the card in 3D, its layers, then the points ---------- */
  function view(t) {
    var v;
    if (t < 5.5) {                       // the card: tilt back, come apart, then dive in
      var e = expoInOut(prog(t, 4.5, 0.45)), back = 1 - expoInOut(prog(t, 5.0, 0.3));
      v = { tilt: 1.08 * e * back, yaw: (-0.55 * e - 0.5 * Math.max(0, t - 4.5)) * back, zoom: 1 + 11 * expoIn(prog(t, 5.0, 0.36)) };
    } else {                             // the sphere: lift, tilt, spin
      v = { tilt: 0.9 * expoInOut(prog(t, 5.5, 0.42)), yaw: 1.7 * expoInOut(prog(t, 5.5, 1.2)), zoom: 1 };
    }
    v.ct = Math.cos(v.tilt); v.st = Math.sin(v.tilt); v.cy = Math.cos(v.yaw); v.sy = Math.sin(v.yaw); v.f = U * 2.2;
    return v;
  }
  function project(v, x, y, z) {
    var x1 = x * v.cy - y * v.sy, y1 = x * v.sy + y * v.cy;
    var y2 = y1 * v.ct - z * v.st, z2 = y1 * v.st + z * v.ct, s = v.f / (v.f + z2) * v.zoom;
    return { x: W / 2 + x1 * s, y: H / 2 + y2 * s, s: s };
  }
  function gap(t) { return U * 0.16 * expoOut(prog(t, 4.55, 0.4)); }
  function drawLayers(c, t) {
    var k = card(), v = view(t), sep = gap(t), names = list('data-layers', 'surface|states|rules|data');
    var lw = Math.max(2, U * 0.004), i, q;
    for (i = 3; i >= 0; i--) {
      var z = (1.5 - i) * sep;
      var a = project(v, -k.w / 2, -k.h / 2, z), b = project(v, k.w / 2, -k.h / 2, z);
      var d = project(v, -k.w / 2, k.h / 2, z), e = project(v, k.w / 2, k.h / 2, z);
      c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.lineTo(e.x, e.y); c.lineTo(d.x, d.y); c.closePath();
      if (i === 0) { c.fillStyle = col.cream; c.fill(); }
      else if (i === 1) { c.fillStyle = col.indigo; c.fill(); }
      else { c.fillStyle = col.ink; c.fill(); c.strokeStyle = i === 2 ? col.line : col.cream; c.lineWidth = lw; c.stroke(); }
      // Label on a leader line, drawn out on beat 10 and pulled back on beat 11.
      q = expoOut(prog(t, 4.62 + 0.05 * i, 0.3)) * (1 - expoInOut(prog(t, 4.96, 0.16)));
      if (q > 0.01 && names[i]) {
        var anchor = project(v, k.w / 2, 0, z), lead = U * 0.06 * q, tx = anchor.x + 12 + lead + 8;
        c.font = '500 ' + monoSize() + 'px ' + MONO; c.textBaseline = 'middle';
        c.fillStyle = col.cream; c.fillRect(anchor.x + 12, anchor.y - 0.5, lead, 1);
        c.save();
        c.beginPath(); c.rect(tx, anchor.y - 10, c.measureText(names[i]).width * q + 1, 20); c.clip();
        c.fillText(names[i], tx, anchor.y);
        c.restore();
      }
    }
    q = 1 - expoInOut(prog(t, 4.96, 0.16));
    var top = project(v, -k.w / 2, -k.h / 2, 1.5 * sep);
    readout(c, Math.max(16, top.x - 20), Math.max(60, top.y - U * 0.14), 'ROT ' + pad3(-v.yaw * 180 / Math.PI) + '.0°', 'LAYERS 4/4', q * expoOut(prog(t, 4.55, 0.3)), col.cream);
    if (t < 4.75) handles(c, k, 1 - expoOut(prog(t, 4.5, 0.2)), Math.max(2, lockup(c).fs * 0.03));
  }
  // Each point: a cell of the matrix, then a point on the sphere, then part of the bar.
  function drawPoints(c, t, g) {
    // Until the lift on beat 12 the matrix is flat on the screen, whatever the card's camera is doing.
    var M = matrix(), v = t < 5.5 ? { ct: 1, st: 0, cy: 1, sy: 0, f: U * 2.2, zoom: 1 } : view(t), R = U * 0.36, n = M.n;
    var maxD = Math.sqrt(W * W + H * H) / 2, cx = W / 2, cy = H / 2;
    var bcols = 48, brows = Math.ceil(n / bcols), cw = (g.x2 - g.x1) / bcols, chh = (g.y2 - g.y1) / brows;
    var ring = maxD * 1.15 * prog(t, 5.24, 0.5), band = M.sp * 3.4;       // the ripple
    var iris = expoInOut(prog(t, 5.5, 0.4)) * (maxD + 20);                  // indigo behind the points
    var grow = expoIn(prog(t, 6.22, 0.27)), gather = t >= 6;
    if (gather) { c.save(); c.beginPath(); c.rect(g.x1, g.y1, g.x2 - g.x1, g.y2 - g.y1); c.rect(0, 0, W, H * (1 - grow)); c.clip(); }
    for (var i = 0; i < n; i++) {
      var mx = M.ox + (i % M.cols) * M.sp - cx, my = M.oy + (i / M.cols | 0) * M.sp - cy;
      var d = Math.sqrt(mx * mx + my * my), dn = d / maxD;
      var born = spring(t - 5.1 - dn * 0.14);
      if (born <= 0) continue;
      var wave = Math.max(0, 1 - Math.abs(d - ring) / band) * (t < 5.9 ? 1 : 0);
      var yy = 1 - 2 * (i + 0.5) / n, rr = Math.sqrt(1 - yy * yy), ph = i * 2.39996;
      var st = (i * 0.618) % 1, m1 = expoInOut(prog(t - dn * 0.1, 5.54, 0.4));
      var p = project(v, lerp(mx, rr * Math.cos(ph) * R, m1), lerp(my, yy * R, m1), lerp(0, rr * Math.sin(ph) * R, m1));
      var m2 = expoInOut(prog(t - st * 0.1, 6.0, 0.36));
      var x = lerp(p.x, g.x1 + (i % bcols + 0.5) * cw, m2), y = lerp(p.y, g.y1 + ((i / bcols | 0) + 0.5) * chh, m2);
      var base = M.sp * lerp(0.26, 0.24, m1) * born * (1 + wave * 1.5) * (m1 > 0 ? p.s : 1);
      var w = lerp(base, cw * 3.4, grow * m2), h = lerp(base, chh * 3.4, grow * m2);
      c.fillStyle = wave > 0.05 ? col.indigo : (d < iris || gather ? col.cream : col.ink);
      if (m2 > 0.5) c.fillRect(x - w / 2, y - h / 2, w, h);
      else { c.beginPath(); c.arc(x, y, w / 2, 0, TAU); c.fill(); }
    }
    if (gather) c.restore();
  }

  /* ---------- the read-outs in the corners (the data moment) ---------- */
  var COUNT = [[0, 1], [0.25, 2], [0.5, 4], [1, 8], [2, 1], [2.5, 2], [3, 5], [4, 1], [4.5, 4], [5.1, -1], [6, 1]];
  function count(t) {
    var v0 = 0, v1 = 0, tk = 0, n = matrix().n;
    for (var i = 0; i < COUNT.length; i++) if (t >= COUNT[i][0]) { v0 = i ? COUNT[i - 1][1] : 0; v1 = COUNT[i][1]; tk = COUNT[i][0]; }
    return Math.round(lerp(v0 < 0 ? n : v0, v1 < 0 ? n : v1, expoOut(prog(t, tk, 0.3))));
  }
  function drawChip(c, t, fixed) {
    var u = clamp(W / 1440, 0.75, 1.25), pad = Math.round(Math.max(16, W * 0.03));
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
    c.strokeStyle = col.cream; c.lineWidth = 1; c.strokeRect(pad + 0.5, y + 0.5, w - 1, h - 1);
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
    var pad = Math.round(Math.max(16, W * 0.03)), tick = 12 * open, fs = monoSize();
    c.fillStyle = ((t >= 1.85 && t < 4.18) || (t >= 5.3 && t < 5.7)) ? col.ink : col.cream;
    c.fillRect(pad, pad, tick, 1); c.fillRect(pad, pad, 1, tick);
    c.fillRect(W - pad - tick, pad, tick, 1); c.fillRect(W - pad - 1, pad, 1, tick);
    c.fillRect(W - pad - tick, H - pad - 1, tick, 1); c.fillRect(W - pad - 1, H - pad - tick, 1, tick);
    c.font = '500 ' + fs + 'px ' + MONO;
    c.textBaseline = 'top';
    var beat = Math.min(14, Math.floor(t / 0.5) + 1), frame = Math.floor((t % 1) * 60);
    var left = 'JJ  INTRO', right = 'BEAT ' + two(beat) + '/14  120 BPM';
    var code = 'FR ' + pad3(Math.floor(t * 60)) + '  00:' + two(Math.floor(t)) + ':' + two(frame);
    var rw = c.measureText(right).width, lw = c.measureText(left).width, cw = c.measureText(code).width;
    c.save(); c.beginPath(); c.rect(pad + 18, pad, lw * open + 2, 24); c.clip(); c.fillText(left, pad + 18, pad + 6); c.restore();
    c.save(); c.beginPath(); c.rect(W - pad - 18 - rw * open, pad, rw * open + 2, 24); c.clip(); c.fillText(right, W - pad - 18 - rw, pad + 6); c.restore();
    c.save(); c.beginPath(); c.rect(W - pad - 18 - cw * open, H - pad - 24, cw * open + 2, 24); c.clip(); c.fillText(code, W - pad - 18 - cw, H - pad - 6 - fs); c.restore();
  }

  /* ---------- one frame of canvas at time t ---------- */
  function render(c, t, g) {
    var p;
    if (t < 2) {
      drawDots(c, t);
    } else if (t < 4.5) {
      drawType(c, t);
    } else if (t < 5.36) {                            // beats 10-11: layers, then the dive
      c.fillStyle = col.ink; c.fillRect(0, 0, W, H);
      drawLayers(c, t);
      if (t >= 5.1) drawPoints(c, t, g);
    } else if (t < 6) {                               // beats 11-12: matrix, ripple, sphere
      c.fillStyle = col.cream; c.fillRect(0, 0, W, H);
      p = expoInOut(prog(t, 5.5, 0.4));
      if (p > 0) { c.fillStyle = col.indigo; c.beginPath(); c.arc(W / 2, H / 2, p * (Math.sqrt(W * W + H * H) / 2 + 20), 0, TAU); c.fill(); }
      drawPoints(c, t, g);
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
      if (p > 0 && p < 1) { c.fillStyle = col.line; c.fillRect(edge - 2, g.y1, 4, g.y2 - g.y1); }
    }
    drawHud(c, t);
    drawChip(c, t);
  }

  /* ---------- the DOM half of the frame ---------- */
  // Write an inline style only when its value changes. For most of the piece the
  // DOM parts sit still, so most frames touch the DOM not at all (which also keeps
  // anything observing the page, such as dev overlays, quiet).
  var written = new WeakMap();
  function put(el, prop, val) {
    var w = written.get(el);
    if (!w) { w = {}; written.set(el, w); }
    if (w[prop] === val) return;
    w[prop] = val;
    el.style[prop] = val;
  }
  function applyDom(t, g, T, e) {
    var done = t >= T, i;
    if (e.line) {
      if (done) put(e.line, 'clipPath', '');
      else {
        var inset = 100;
        if (t >= WIPE) {
          var r = e.line.getBoundingClientRect();
          var edge = lerp(g.x1, g.x2, expoInOut(prog(t, WIPE, 0.45)));
          inset = clamp((r.right - edge) / r.width * 100, 0, 100);
        }
        put(e.line, 'clipPath', 'inset(-0.3em ' + inset.toFixed(2) + '% -0.3em -0.3em)');
      }
    }
    for (i = 0; i < e.rise.length; i++) {
      var p = expoOut(prog(t, RISE_AT + i * RISE_STEP, RISE_DUR));
      put(e.rise[i], 'opacity', done ? '' : p.toFixed(3));
      put(e.rise[i], 'transform', done ? '' : 'translate3d(0,' + ((1 - p) * 20).toFixed(2) + 'px,0)');
    }
    if (e.nav) {
      var n = expoOut(prog(t, WIPE + 0.1, 0.5));
      put(e.nav, 'transform', done ? '' : 'translate3d(0,' + (-(1 - n) * 100).toFixed(2) + '%,0)');
    }
    if (root.classList.contains('cut-pending')) root.classList.remove('cut-pending');
  }

  /* ---------- seek: the whole piece at time t ---------- */
  function seek(t) {
    var e = els();
    size(e);
    var T = duration(), g = geom(e);
    t = clamp(t, 0, T);
    main.setTransform(K, 0, 0, K, 0, 0);
    main.globalAlpha = 1;
    render(main, t, g);
    applyDom(t, g, T, e);
  }

  /* ---------- X-ray: show the selection that survived ---------- */
  function drawXray(p) {
    var el = els();
    size(el);
    var g = geom(el), e = expoOut(p);
    main.setTransform(K, 0, 0, K, 0, 0);
    main.clearRect(0, 0, W, H);
    main.fillStyle = col.line;
    main.fillRect(W / 2 - W * e / 2, Math.round(g.y1), W * e, 1);
    main.fillRect(W / 2 - W * e / 2, Math.round(g.y2), W * e, 1);
    main.fillRect(Math.round(g.x1), g.cy - H * e / 2, 1, H * e);
    main.fillRect(Math.round(g.x2), g.cy - H * e / 2, 1, H * e);
    handles(main, { x: g.x1, y: g.y1, w: g.x2 - g.x1, h: g.y2 - g.y1 }, e, 2);
    if (e > 0.5) drawChip(main, 0, '1 / ' + matrix().n);
  }
  function xray(on) {
    xrayOn = !!on;
    if (playing) return;
    cancelAnimationFrame(raf);
    if (!xrayOn) { canvas.style.display = 'none'; return; }
    canvas.style.display = 'block';
    stale = true;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { drawXray(1); return; }
    var t0 = performance.now();
    (function tick(now) {
      var p = clamp((now - t0) / 500, 0, 1);
      drawXray(p);
      if (p < 1 && xrayOn && !playing) raf = requestAnimationFrame(tick);
    })(t0);
  }

  /* ---------- transport ---------- */
  // Add ?cutdebug to the URL to get a timing read-out after a run.
  var stats = null;
  function report() {
    if (!stats || !/[?&]cutdebug/.test(location.search) || !stats.gaps.length) return;
    function q(a, f) { var b = a.slice().sort(function (x, y) { return x - y; }); return b[Math.min(b.length - 1, Math.floor(b.length * f))].toFixed(1); }
    var g = stats.gaps, c = stats.cost;
    var text = [
      'hero-cut timing',
      'frames drawn   ' + g.length,
      'frame gap ms   median ' + q(g, 0.5) + '  p95 ' + q(g, 0.95) + '  worst ' + q(g, 1),
      'gaps over 25ms ' + g.filter(function (x) { return x > 25; }).length,
      'script ms      median ' + q(c, 0.5) + '  p95 ' + q(c, 0.95) + '  worst ' + q(c, 1),
      'low quality    ' + lowQ,
      'stage px       ' + canvas.width + ' x ' + canvas.height,
      'viewport       ' + W + ' x ' + H + '  dpr ' + window.devicePixelRatio,
      'overlay        ' + (document.querySelector('[data-retune], #retune-root, retune-overlay') ? 'retune present' : 'none found'),
      navigator.userAgent
    ].join(String.fromCharCode(10));
    var pre = document.getElementById('cut-debug') || document.body.appendChild(document.createElement('pre'));
    pre.id = 'cut-debug';
    pre.textContent = text;
    pre.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:99999;margin:0;padding:12px 14px;max-width:calc(100vw - 24px);overflow:auto;font:12px/1.5 ui-monospace,Menlo,Consolas,monospace;background:#000;color:#fff;border:1px solid #8080f0;white-space:pre;user-select:all';
    console.log(text);
  }
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
    if (was) { document.dispatchEvent(new CustomEvent('jj:cutdone')); report(); }
  }
  function play(from) {
    cancelAnimationFrame(raf);
    if (window.scrollY > 40) { finish(); return; }
    playing = true;
    stale = true;
    root.classList.add('cut-playing');
    canvas.style.display = 'block';
    var start = from || 0, t0 = 0, T = duration(), last = 0, slow = 0;
    stats = { gaps: [], cost: [], from: start };
    seek(start);
    var go = function () {
      if (!playing) return;
      stale = true; memo.key = ''; geomMemo = null;
      SKIP.forEach(function (n) { window.addEventListener(n, finish, { capture: true, passive: true }); });
      raf = requestAnimationFrame(function tick(now) {
        if (!playing) return;
        if (!t0) t0 = now;
        // On 120/144 Hz displays draw every other refresh: evenly paced, half the work.
        if (last && now - last < 11) { raf = requestAnimationFrame(tick); return; }
        if (last) stats.gaps.push(now - last);
        // Five frames slower than 21 ms: no smear and a smaller buffer.
        if (last && now - last > 21 && ++slow > 5) lowQ = true;
        last = now;
        var t = start + (now - t0) / 1000;
        if (t >= T) { finish(); return; }
        var c0 = performance.now();
        seek(t);
        stats.cost.push(performance.now() - c0);
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
  window.addEventListener('resize', function () { stale = true; redrawXray(); });
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
