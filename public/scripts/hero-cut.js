/* Hero intro "First light".
   Every pixel and every inline style is a pure function of time inside seek(t):
   no CSS animations, no timers, nothing carried from one frame to the next.
   The one event is the bang, fired once when playback crosses BANG.
     0.00-0.55  a plain dark page, one dot at the centre fades in
     0.55-0.90  gravity: a thin ring shrinks into the dot, which grows and brightens
     0.90       BANG: HeroSpace.bang() makes the real star field fly out from the dot
                (it draws its own shock ring); the dot fades; the portrait's dots
                fly from the centre to the portrait (HeroFace.intro)
     0.90-2.4   text arrives as the wave reaches it, the nav slides down last
   The canvas is transparent: it draws only the dot, the ring and the portrait dots.

   Markup contract (all inside or near section.hero):
     canvas[data-cut-canvas]   the stage (transparent, over the page)
     [data-cut-line]           the headline block (arrives first)
     [data-cut-rise]           elements that arrive after it, in DOM order
     [data-cut-nav]            the fixed nav (slides down at the end)
     [data-cut-replay]         replay button
   Colours come from CSS custom properties on the canvas:
     --cut-cream (dot), --cut-line (ring), --cut-indigo (X-ray handles)
   html.cut-pending (set before first paint) hides the DOM parts until the first frame. */
(function () {
  'use strict';

  var DOT_IN = 0.25;             // the dot fades in
  var GATHER = 0.55, GATHER_DUR = 0.35;
  var BANG = 0.9;
  var SHORT_FROM = 0.55;         // return visits start with the ring gathering
  var WAVE_DUR = 1.3, WAVE_REACH = 0.9;   // wavefront: expoOut over WAVE_DUR to 0.9 * the long side
  var LATEST = 0.75;             // no element arrives later than BANG + this
  var STAGGER = 0.06, ARRIVE_DUR = 0.55, RISE_PX = 14;
  var NAV_AT = BANG + 0.55, NAV_DUR = 0.5;
  var FACE_DONE = BANG + 1.35;   // the last portrait dot has landed
  // The stage is drawn once per frame at device resolution (up to 2x, capped at
  // about 4 megapixels).
  var PIXELS = 4.2e6;
  var MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  var TAU = Math.PI * 2;

  var root = document.documentElement;
  var canvas = document.querySelector('[data-cut-canvas]');
  if (!canvas) return;
  var main = canvas.getContext('2d');

  var W = 0, H = 0, K = 1, U = 1, col = {}, fontFamily = 'sans-serif';
  var raf = 0, playing = false, xrayOn = false, banged = false;
  var lowQ = false;              // set when the device cannot hold the frame rate
  var stale = true;              // colours and font are re-read on play, X-ray and resize
  var planMemo = null;

  /* ---------- easing, as functions of time ---------- */
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function lerp(a, b, p) { return a + (b - a) * p; }
  function prog(t, start, dur) { return clamp((t - start) / dur, 0, 1); }
  function expoOut(p) { return p >= 1 ? 1 : 1 - Math.pow(2, -10 * p); }
  function expoIn(p) { return p <= 0 ? 0 : Math.pow(2, 10 * (p - 1)); }

  /* ---------- measuring (layout only, no animation state) ---------- */
  function els() {
    return {
      line: document.querySelector('[data-cut-line]'),
      rise: Array.prototype.slice.call(document.querySelectorAll('[data-cut-rise]')),
      nav: document.querySelector('[data-cut-nav]')
    };
  }
  // When the wave reaches each element. Measured once per play and per resize.
  function plan(e) {
    var w = Math.max(1, window.innerWidth), h = Math.max(1, window.innerHeight);
    if (planMemo && planMemo.w === w && planMemo.h === h) return planMemo;
    var list = (e.line ? [e.line] : []).concat(e.rise), items = [], end = 0, i;
    var reach = WAVE_REACH * Math.max(w, h);
    for (i = 0; i < list.length; i++) {
      var r = list[i].getBoundingClientRect();
      var d = Math.sqrt(Math.pow(r.left + r.width / 2 - w / 2, 2) + Math.pow(r.top + r.height / 2 - h / 2, 2));
      // Invert R = expoOut(p) * reach for the time the front passes the centre.
      var frac = d / reach, ta = frac >= 1 ? LATEST : Math.min(LATEST, -Math.log(1 - frac) / Math.LN2 / 10 * WAVE_DUR);
      var at = BANG + ta + i * STAGGER;
      items.push({ el: list[i], at: at });
      end = Math.max(end, at + ARRIVE_DUR);
    }
    planMemo = { w: w, h: h, items: items, T: Math.max(end, FACE_DONE, NAV_AT + NAV_DUR) + 0.05 };
    return planMemo;
  }
  function duration() { return plan(els()).T; }
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
    col.cream = v('--cut-cream', '#f0ede8');
    col.indigo = v('--cut-indigo', '#5c5cd4');
    col.line = v('--cut-line', '#8080f0');
    if (e.line) fontFamily = getComputedStyle(e.line).fontFamily;
  }
  // The headline's text box in viewport coordinates, padded (used by X-ray).
  function geom(e) {
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
    return g;
  }

  /* ---------- the canvas: the dot, the ring, the portrait's dots ---------- */
  function disc(c, x, y, r, alpha) {
    if (r <= 0.05 || alpha <= 0) return;
    c.globalAlpha = alpha;
    c.fillStyle = col.cream;
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  }
  function render(c, t) {
    var ox = W / 2, oy = H / 2;
    c.clearRect(0, 0, W, H);
    if (t < BANG) {
      var gp = prog(t, GATHER, GATHER_DUR), grow = expoIn(gp);
      disc(c, ox, oy, lerp(2.5, 4, grow), expoOut(prog(t, 0, DOT_IN)) * lerp(0.8, 1, grow));
      var rr = U * 0.11 * (1 - grow);
      if (gp > 0 && rr > 0.3) {
        c.globalAlpha = 0.7 * gp;
        c.strokeStyle = col.line; c.lineWidth = 1;
        c.beginPath(); c.arc(ox, oy, rr, 0, TAU); c.stroke();
      }
    } else {
      var q = expoOut(prog(t, BANG, 0.25));
      disc(c, ox, oy, 4 * (1 - q), 1 - q);
      c.globalAlpha = 1;
      // The portrait's points leave the dot and settle (see hero-face.js).
      if (window.HeroFace) window.HeroFace.intro(c, t, { x1: ox - 3, x2: ox + 3, y1: oy - 3, y2: oy + 3 }, BANG);
    }
    c.globalAlpha = 1;
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
  function applyDom(t, P, e) {
    var done = t >= P.T, i;
    for (i = 0; i < P.items.length; i++) {
      var p = expoOut(prog(t, P.items[i].at, ARRIVE_DUR));
      put(P.items[i].el, 'opacity', done ? '' : p.toFixed(3));
      put(P.items[i].el, 'transform', done ? '' : 'translate3d(0,' + ((1 - p) * RISE_PX).toFixed(2) + 'px,0)');
    }
    if (e.nav) {
      var n = expoOut(prog(t, NAV_AT, NAV_DUR));
      put(e.nav, 'transform', done ? '' : 'translate3d(0,' + (-(1 - n) * 100).toFixed(2) + '%,0)');
    }
    if (root.classList.contains('cut-pending')) root.classList.remove('cut-pending');
  }

  /* ---------- seek: the whole piece at time t ---------- */
  function seek(t) {
    var e = els();
    size(e);
    var P = plan(e);
    t = clamp(t, 0, P.T);
    // The one event: release the star field when playback crosses the bang.
    if (playing && !banged && t >= BANG) {
      banged = true;
      var hs = window.HeroSpace;
      if (hs && hs.bang) hs.bang(W / 2, H / 2);
      else if (hs && hs.live) hs.live();
    }
    main.setTransform(K, 0, 0, K, 0, 0);
    main.globalAlpha = 1;
    render(main, t);
    applyDom(t, P, e);
  }

  /* ---------- X-ray: show the selection that survived ---------- */
  function handles(c, r, scale, lw) {
    var hs = Math.max(6, lw * 2.6) * scale;
    if (hs <= 0.2) return;
    var pts = [[r.x, r.y], [r.x + r.w, r.y], [r.x, r.y + r.h], [r.x + r.w, r.y + r.h], [r.x + r.w / 2, r.y], [r.x + r.w / 2, r.y + r.h]];
    for (var i = 0; i < pts.length; i++) {
      c.fillStyle = col.cream; c.fillRect(pts[i][0] - hs / 2, pts[i][1] - hs / 2, hs, hs);
      c.strokeStyle = col.indigo; c.lineWidth = Math.max(1, lw * 0.6); c.strokeRect(pts[i][0] - hs / 2, pts[i][1] - hs / 2, hs, hs);
    }
  }
  function drawXray(p) {
    var el = els();
    size(el);
    var g = geom(el), e = expoOut(p);
    main.setTransform(K, 0, 0, K, 0, 0);
    main.globalAlpha = 1;
    main.clearRect(0, 0, W, H);
    main.fillStyle = col.line;
    main.fillRect(W / 2 - W * e / 2, Math.round(g.y1), W * e, 1);
    main.fillRect(W / 2 - W * e / 2, Math.round(g.y2), W * e, 1);
    main.fillRect(Math.round(g.x1), g.cy - H * e / 2, 1, H * e);
    main.fillRect(Math.round(g.x2), g.cy - H * e / 2, 1, H * e);
    handles(main, { x: g.x1, y: g.y1, w: g.x2 - g.x1, h: g.y2 - g.y1 }, e, 2);
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
    if (window.HeroFace) window.HeroFace.live(was);
    if (window.HeroSpace) window.HeroSpace.live();
    if (was) { document.dispatchEvent(new CustomEvent('jj:cutdone')); report(); }
  }
  function play(from) {
    cancelAnimationFrame(raf);
    if (window.scrollY > 40) { finish(); return; }
    playing = true;
    banged = false;
    stale = true;
    planMemo = null;
    if (window.HeroFace) window.HeroFace.hide();
    if (window.HeroSpace) window.HeroSpace.hide();
    root.classList.add('cut-playing');
    canvas.style.display = 'block';
    var start = from || 0, t0 = 0, T = duration(), last = 0, slow = 0;
    stats = { gaps: [], cost: [], from: start };
    seek(start);
    SKIP.forEach(function (n) { window.addEventListener(n, finish, { capture: true, passive: true }); });
    raf = requestAnimationFrame(function tick(now) {
      if (!playing) return;
      if (!t0) t0 = now;
      // On 120/144 Hz displays draw every other refresh: evenly paced, half the work.
      if (last && now - last < 11) { raf = requestAnimationFrame(tick); return; }
      if (last) stats.gaps.push(now - last);
      // Five frames slower than 21 ms: a smaller buffer.
      if (last && now - last > 21 && ++slow > 5) lowQ = true;
      last = now;
      var t = start + (now - t0) / 1000;
      if (t >= T) { finish(); return; }
      var c0 = performance.now();
      seek(t);
      stats.cost.push(performance.now() - c0);
      raf = requestAnimationFrame(tick);
    });
  }

  // The X-ray lines sit on a fixed canvas but follow the headline, so redraw
  // them when the page scrolls or resizes.
  var redrawQueued = false;
  function redrawXray() {
    if (redrawQueued || playing || !xrayOn) return;
    redrawQueued = true;
    requestAnimationFrame(function () { redrawQueued = false; if (!playing && xrayOn) drawXray(1); });
  }
  window.addEventListener('resize', function () { stale = true; planMemo = null; redrawXray(); });
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
