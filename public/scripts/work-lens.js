/* Gravitational lens, the Work page hero. One canvas[data-work-lens].
   A star field with one heavy, invisible mass in front of it. The mass bends
   the light behind it, so every star near it is seen as two stretched arcs on
   the mass's Einstein ring instead of as a point.

   Story   The page opens with the mass sitting in front of the case stars
           (one per case study, in the accent colour): they read as a broken
           ring of smears. Then the mass lets go and they settle into sharp,
           numbered points. "Four problems, brought into focus."
   Pointer After that the pointer is the mass: move it over the field and the
           stars around it bend (mouse and pen, not touch).
   Cards   Hovering or focusing a .work-card lights its star.

   The bending is the real point-mass lens equation. A source at distance b
   from the mass, with Einstein radius E, is seen at
       t± = (b ± sqrt(b² + 4E²)) / 2
   along the same line through the mass. A small round source of radius p
   becomes an arc of half-angle asin(p / b) at each of those radii, squeezed
   radially by dt/db. With b <= p the arcs close into a full ring.

   Markup:  canvas.work-lens[data-work-lens][data-count=N], and an empty
            [data-work-lens-anchor] whose box says where the case stars sit.
   Colours: --space-dot and --space-accent on the canvas.
   Reduced motion (the media query or <html data-motion="reduce"): the field
   is drawn once, in focus, and stays still. */
(function () {
  'use strict';

  var canvas = document.querySelector('canvas[data-work-lens]');
  if (!canvas || !canvas.getContext) return;
  var anchor = document.querySelector('[data-work-lens-anchor]');
  var ctx = canvas.getContext('2d');
  var TAU = Math.PI * 2;
  var mq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  function reduced() {
    return !!(mq && mq.matches) || document.documentElement.getAttribute('data-motion') === 'reduce';
  }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function lerp(a, b, p) { return a + (b - a) * p; }
  function ease(p) { p = clamp(p, 0, 1); return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function rgbOf(s, fb) {
    var m = /^#?([0-9a-f]{6})$/i.exec((s || '').trim());
    if (m) { var n = parseInt(m[1], 16); return (n >> 16) + ',' + (n >> 8 & 255) + ',' + (n & 255); }
    m = /rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/.exec(s || '');
    return m ? m[1] + ',' + m[2] + ',' + m[3] : fb;
  }

  var HOLD = 1.9, FOCUS = 2.6;                  // seconds: the smeared opening, then the settle
  var COUNT = clamp(parseInt(canvas.getAttribute('data-count'), 10) || 4, 1, 6);
  // Where each case star rests, as angle and distance (in cluster radii) from the cluster's centre.
  var REST = [[-2.45, 0.56], [-0.62, 0.44], [0.78, 0.62], [2.5, 0.4], [1.6, 0.2], [-1.5, 0.22]];

  var W = 0, H = 0, K = 1;
  var col = { dot: '240,237,232', accent: '128,128,240' };
  var stars = [], cases = [];
  var cx = 0, cy = 0, R = 120;                  // the cluster: centre and radius
  var lens = { x: 0, y: 0, e: 0 };              // the mass: where, and its Einstein radius
  var ptr = { x: 0, y: 0, on: false };
  var hot = -1;                                 // the case whose card is hovered
  var clock = 0, last = 0, raf = 0, onScreen = true, calm = reduced(), started = false;

  function colours() {
    var cs = getComputedStyle(canvas);
    col.dot = rgbOf(cs.getPropertyValue('--space-dot'), col.dot);
    col.accent = rgbOf(cs.getPropertyValue('--space-accent'), col.accent);
  }
  function seed() {
    var rand = rng(23), n = Math.round(clamp(W * H / 7000, 60, 240)), i;
    stars = [];
    for (i = 0; i < n; i++) {
      var depth = 0.3 + rand() * 0.7;
      stars.push({
        x: rand() * W, y: rand() * H, depth: depth,
        r: (0.6 + depth * 1.1) * (rand() < 0.07 ? 1.6 : 1), a: 0.16 + depth * 0.46,
        ph: rand() * TAU, sp: 0.3 + rand() * 0.9, accent: rand() < 0.06
      });
    }
    cases = [];
    for (i = 0; i < COUNT; i++) cases.push({ ang: REST[i][0], dist: REST[i][1], glow: 0 });
  }
  function measure() {
    var r = canvas.getBoundingClientRect();
    if (anchor) {
      var a = anchor.getBoundingClientRect();
      if (a.width) { cx = a.left - r.left + a.width / 2; cy = a.top - r.top + a.height / 2; R = Math.min(a.width, a.height) / 2; return; }
    }
    cx = W * 0.72; cy = H * 0.48; R = Math.min(W, H) * 0.22;
  }
  function resize() {
    var r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var k = Math.min(window.devicePixelRatio || 1, 2);
    if (r.width !== W || r.height !== H || k !== K) {
      var first = !W, sx = r.width / (W || 1), sy = r.height / (H || 1);
      W = r.width; H = r.height; K = k;
      canvas.width = Math.round(W * K); canvas.height = Math.round(H * K);
      if (first) seed();
      else for (var i = 0; i < stars.length; i++) { stars[i].x *= sx; stars[i].y *= sy; }
    }
    measure();
    if (calm) draw();
  }

  /* One source as the mass shows it: two arcs, or a plain dot when the mass
     is absent or far away. rgb is the colour, a the opacity, p the radius. */
  function image(x, y, p, rgb, a) {
    var E = lens.e, dx = x - lens.x, dy = y - lens.y, b = Math.sqrt(dx * dx + dy * dy);
    if (E < 0.5 || b > E * 14) {
      ctx.fillStyle = 'rgba(' + rgb + ',' + a + ')';
      ctx.beginPath(); ctx.arc(x, y, p, 0, TAU); ctx.fill();
      return;
    }
    var root = Math.sqrt(b * b + 4 * E * E), phi = Math.atan2(dy, dx);
    var half = b <= p ? Math.PI : Math.asin(p / b);
    var t1 = (b + root) / 2, t2 = (root - b) / 2;             // radii of the two images
    var w1 = 2 * p * 0.5 * (1 + b / root), w2 = 2 * p * 0.5 * (1 - b / root);
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(' + rgb + ',' + a + ')';
    ctx.lineWidth = Math.max(w1, 0.6);
    ctx.beginPath(); ctx.arc(lens.x, lens.y, t1, phi - half, phi + half); ctx.stroke();
    if (w2 > 0.25) {                                          // the fainter one, inside the ring, on the far side
      ctx.strokeStyle = 'rgba(' + rgb + ',' + a * clamp(w2 / (p * 0.8), 0.15, 1) + ')';
      ctx.lineWidth = w2;
      ctx.beginPath(); ctx.arc(lens.x, lens.y, t2, phi + Math.PI - half, phi + Math.PI + half); ctx.stroke();
    }
  }

  function draw() {
    var i, s, intro = calm ? 1 : ease((clock - HOLD) / FOCUS);     // 0 smeared, 1 in focus
    var bent = clamp(lens.e / (R * 0.5), 0, 1);
    ctx.setTransform(K, 0, 0, K, 0, 0);
    ctx.clearRect(0, 0, W, H);

    for (i = 0; i < stars.length; i++) {
      s = stars[i];
      var tw = calm ? 1 : 0.78 + 0.22 * Math.sin(clock * s.sp + s.ph);
      image(s.x, s.y, s.r, s.accent ? col.accent : col.dot, +(s.a * tw).toFixed(3));
    }

    // The mass's Einstein ring, as a faint reticle while it is bending anything.
    if (lens.e > 2) {
      ctx.save();
      ctx.setLineDash([1, 7]); ctx.lineCap = 'round'; ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(' + col.dot + ',' + (0.3 * bent).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(lens.x, lens.y, lens.e, 0, TAU); ctx.stroke();
      ctx.restore();
    }

    // The case stars. They start almost behind the mass and travel out to rest.
    var font = '500 11px ' + (getComputedStyle(canvas).fontFamily || 'sans-serif');
    for (i = 0; i < cases.length; i++) {
      var c = cases[i];
      var d = lerp(0.045 + i * 0.022, c.dist, intro) * R;
      var x = cx + Math.cos(c.ang) * d, y = cy + Math.sin(c.ang) * d;
      c.glow = calm ? (hot === i ? 1 : 0) : lerp(c.glow, hot === i ? 1 : 0, 0.14);
      var p = clamp(R * 0.034, 3.2, 5.5) * (1 + c.glow * 0.45);
      // A soft halo, only once the star is a point.
      var sharp = clamp(1 - bent * 1.6, 0, 1);
      if (sharp > 0.02) {
        var g = ctx.createRadialGradient(x, y, 0, x, y, p * 6);
        g.addColorStop(0, 'rgba(' + col.accent + ',' + (0.28 + c.glow * 0.25) * sharp + ')');
        g.addColorStop(1, 'rgba(' + col.accent + ',0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, p * 6, 0, TAU); ctx.fill();
      }
      image(x, y, p, col.accent, 1);
      if (sharp > 0.02) {
        ctx.font = font; ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(' + col.dot + ',' + ((0.55 + c.glow * 0.45) * sharp).toFixed(3) + ')';
        ctx.fillText('0' + (i + 1), x + p + 9, y + 0.5);
      }
    }
  }

  function step(now) {
    raf = 0;
    if (!onScreen || calm || document.hidden) { last = 0; return; }
    var dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now; clock += dt;

    // Background stars slide slowly, so a still pointer keeps bending new light.
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      s.x -= (2 + s.depth * 5) * dt;
      if (s.x < -4) s.x += W + 8;
    }

    var intro = ease((clock - HOLD) / FOCUS), k = 1 - Math.exp(-dt * 7);
    if (intro < 1) {                              // the opening: the mass sits on the cluster and lets go
      lens.x = cx; lens.y = cy; lens.e = R * 0.5 * (1 - intro);
    } else if (ptr.on) {                          // afterwards the pointer is the mass
      if (lens.e < 1) { lens.x = ptr.x; lens.y = ptr.y; }
      lens.x = lerp(lens.x, ptr.x, k * 1.6 > 1 ? 1 : k * 1.6); lens.y = lerp(lens.y, ptr.y, k * 1.6 > 1 ? 1 : k * 1.6);
      lens.e = lerp(lens.e, clamp(R * 0.3, 34, 72), k);
    } else {
      lens.e = lerp(lens.e, 0, k);
      if (lens.e < 0.5) lens.e = 0;
    }
    draw();
    raf = requestAnimationFrame(step);
  }
  function wake() { if (!raf && !calm && onScreen) raf = requestAnimationFrame(step); }

  function start() {
    if (started) return;
    started = true;
    colours(); resize();
    canvas.classList.add('is-live');
    if (calm) draw(); else wake();
  }
  function setMotion() {
    var c = reduced();
    if (c === calm) return;
    calm = c;
    if (calm) { cancelAnimationFrame(raf); raf = 0; lens.e = 0; draw(); }
    else { clock = HOLD + FOCUS; last = 0; wake(); }
  }

  window.addEventListener('pointermove', function (ev) {
    if (ev.pointerType === 'touch' || !W) return;
    var r = canvas.getBoundingClientRect();
    ptr.x = ev.clientX - r.left; ptr.y = ev.clientY - r.top;
    ptr.on = ptr.y > 0 && ptr.y < r.height && ptr.x > 0 && ptr.x < r.width;
  }, { passive: true });
  document.addEventListener('pointerleave', function () { ptr.on = false; });
  window.addEventListener('blur', function () { ptr.on = false; });
  window.addEventListener('scroll', function () {             // the pointer stays put while the field scrolls under it
    if (!ptr.on) return;
    var r = canvas.getBoundingClientRect();
    if (r.bottom < 0) ptr.on = false;
  }, { passive: true });

  // A card lights its star.
  var cards = document.querySelectorAll('.work-card');
  function bind(el, i) {
    function on() { hot = i; if (calm) draw(); }
    function off() { if (hot === i) hot = -1; if (calm) draw(); }
    el.addEventListener('pointerenter', on); el.addEventListener('pointerleave', off);
    el.addEventListener('focus', on); el.addEventListener('blur', off);
  }
  for (var n = 0; n < cards.length && n < COUNT; n++) bind(cards[n], n);

  if (window.ResizeObserver) {
    var ro = new ResizeObserver(function () { resize(); wake(); });
    ro.observe(canvas); if (anchor) ro.observe(anchor);
  } else window.addEventListener('resize', function () { resize(); wake(); });
  if (window.IntersectionObserver) {
    new IntersectionObserver(function (es) {
      onScreen = es[es.length - 1].isIntersecting; last = 0;
      wake();
    }).observe(canvas);   // only pauses the field off screen
  }
  start();                // the canvas is the top of the page, so it starts straight away
  document.addEventListener('visibilitychange', function () { last = 0; wake(); });
  if (mq) { if (mq.addEventListener) mq.addEventListener('change', setMotion); else if (mq.addListener) mq.addListener(setMotion); }
  document.addEventListener('jj:motionchange', setMotion);
  if (window.MutationObserver) {
    new MutationObserver(function () { colours(); if (calm) draw(); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }
})();
