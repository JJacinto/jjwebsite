/* Particle field, with gestures. One instance per canvas[data-hero-space].
   A loose field of dots fills its area behind the content. They drift, lean
   away from the pointer and get dragged along in its wake.
     Flick   a fast, straight push of the pointer throws a comet that way. It
             sheds sparks, drags the field along, bends around a planet, and
             scatters and lights the portrait if it crosses it (HeroFace.push).
     Circle  moving makes things. As the pointer starts to turn, its path shows
             as a thin line. Fast circles spin up a planet where you circled: a
             dotted sphere with tilted rings, and a pull on the field around
             it. The path you drew becomes a constellation round it: bodies set
             down where the hand went (small planets, a ringed one, moons,
             stars), joined in the order drawn. Keep circling and you keep
             drawing, up to MAX_BODIES. The figure turns slowly with the
             planet. It lasts a few seconds, longer while you keep circling.
     Comet + planet   a comet that grazes the rings is caught as a moon (three
             at most). One that hits the sphere shatters the planet.
     Hold    staying still takes things. Press and hold (mouse or pen, not
             touch) for a black hole. Its reach grows for as long as you hold,
             out to the whole field: dots let go of their places, streak in,
             join the disc, spiral down and are swallowed, and the hole grows
             with what it has eaten. The disc is made of dots in a tilted
             plane: near ones pass in front of the shadow, far ones are bent
             up over it. Letting go sends out a shockwave and throws back
             everything it took.
     Buttons while a .btn is hovered or focused, two bodies circle it on
             opposite sides of a faint track (João in accent, the visitor
             in the dot colour) and a few nearby dots drift into orbit;
             on leave they are let go. data-space-no-orbit turns this off
             (the contact page draws its own pair).
     Rally   (mouse or pen, instances with data-space-rally) letting go of a
             black hole also serves a ball across the screen. The pointer is
             your paddle, a crescent of dots at the hole's x; a paddle on the
             far side always sends it back. Each return you make is +1 and a
             little faster. Miss and it ends. Escape, scrolling away or the
             motion setting ends it quietly. While it runs there are no new
             holes, comets or planets. Best score: localStorage 'jj-rally-best',
             and umami 'hero-rally' { score } once per finished game.
     Swarm   (instances with data-space-rally) a hole held for SWARM_S or more
             gives no rally when you let go: it gives back a swarm. A quiet
             line under the hole says which you will get (data-hole-a: a
             rally, data-hole-b: a warning, data-hole-c: the swarm). On the
             hero (data-space-face) the hole also eats the portrait while it
             is held (HeroFace.consume) and keeps it for the game. The swarm
             is rows of small dot figures that march
             across and step down. The pointer (or the arrow keys) moves your
             ship along the bottom, a press (or Space) shoots. They drop
             shots back; three hits, or the swarm reaching you, ends it. A
             cleared swarm is followed by a faster one. When it ends, the
             dots fly home from what is left of the swarm and the portrait
             forms again (HeroFace.restore). Best score: localStorage
             'jj-swarm-best', umami 'hero-swarm' { score }. Read-out words:
             data-swarm-label (SCORE), data-swarm-hint.
   The score (RALLY 05  BEST 07) is centred on the net, under the nav.

   Markup:  canvas.hero-space[data-hero-space]. Its root is the closest
            [data-space-root], else the closest .hero, else the parent. The
            page field at the top of the inner pages (Base.astro) sits behind
            the content, so its root is main.
   Attributes on the canvas:
     data-space-auto     go live by itself when scrolled into view. Without it
                         the instance is the hero's and waits for
                         HeroSpace.live(), which hero-cut.js calls
     data-space-face     talk to window.HeroFace (push, attract, burst, count)
     data-space-rally    the rally game above. Its read-out words are read when
                         drawn, so the language swap works: data-rally-label
                         (RALLY), data-best-label (BEST), data-rally-hint
                         (MOVE TO RETURN)
   Colours from CSS custom properties on the canvas:
     --space-dot, --space-accent, --space-ink (the page behind, hides the far ring)
   hero-cut.js calls HeroSpace.live() when the intro ends and HeroSpace.hide()
   when it replays; both, comet() and planet() act on the hero instance.
   HeroSpace.bang(clientX, clientY) goes live like live() does, with every dot
   starting at that screen point and flying out to its place (about 1 to 1.6 s,
   fast then slowing down, paths slightly bowed), plus one shock ring. live()
   afterwards leaves the flight alone, hide() cancels it. Reduced motion: it is
   just live().
   Reduced motion (the media query or <html data-motion="reduce">): the field
   is drawn once and stays still, with no gestures. */
(function () {
  'use strict';

  var canvases = document.querySelectorAll('canvas[data-hero-space]');
  var TAU = Math.PI * 2;
  var mq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  function reduced() {
    return !!(mq && mq.matches) || document.documentElement.getAttribute('data-motion') === 'reduce';
  }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function lerp(a, b, p) { return a + (b - a) * p; }
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function spring(t) { return t <= 0 ? 0 : 1 - Math.exp(-6 * t) * Math.cos(9 * t); }
  function rgbOf(s, fb) {
    s = s.trim();
    var m = /^#?([0-9a-f]{6})$/i.exec(s);
    if (m) { var n = parseInt(m[1], 16); return (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255); }
    m = /(\d+)[, ]+(\d+)[, ]+(\d+)/.exec(s);
    return m ? m[1] + ',' + m[2] + ',' + m[3] : fb;
  }
  // Gargantua's light: a warm white and the amber it cools to.
  var HOT = '255,242,224', AMBER = '255,176,98';
  function smooth(a, b, x) { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
  function rgba(c, a) { return 'rgba(' + c + ',' + a.toFixed(3) + ')'; }
  function dot(ctx, x, y, r) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); }

  // Where a press must not start a black hole, and what counts as a button.
  var NO_HOLE = 'a, button, input, textarea, select, label, kbd, [role=button]';
  var BTN_SEL = 'a.btn, button.btn, .btn, button[type=submit], input[type=submit]';
  var MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  var HOLE_SAYS = { a: 'let go now for a quiet game of zero-gravity pong', b: 'keep holding and I can\'t promise anything', c: 'too late. let go and it\'s war' };
  var SWARM_S = 5.5;     // a hole held this long gives back a swarm, not a rally
  var HOLD_MS = 250, CHARGE_S = 1.6, MAX_MOONS = 3, MAX_BODIES = 12, DISC_N = 150;
  var BODY_STEP = 0.9;      // radians of turn round the planet between two bodies of the constellation
  var KINDS =['planet', 'star', 'ringed', 'star', 'moon', 'star'];

  var instances = [], heroInst = null;

  function Space(canvas) {
    var root = canvas.closest('[data-space-root]') || canvas.closest('.hero') || canvas.parentNode;
    var ctx = canvas.getContext('2d');
    // The two bodies round a hovered button go on a canvas above the content,
    // so they pass in front of a button, never behind it. Made on first use.
    var top = null, tctx = null, topDirty = false;
    function topCtx() {
      if (!top) {
        top = document.createElement('canvas');
        top.className = 'hero-space-top';
        top.setAttribute('aria-hidden', 'true');
        canvas.parentNode.insertBefore(top, canvas.nextSibling);
        tctx = top.getContext('2d');
        top.width = Math.round(W * K); top.height = Math.round(H * K);
      }
      return tctx;
    }
    function clearTop() {
      if (!topDirty || !tctx) return;
      tctx.setTransform(1, 0, 0, 1, 0, 0); tctx.clearRect(0, 0, top.width, top.height); topDirty = false;
    }
    var auto = canvas.hasAttribute('data-space-auto');
    var wantFace = canvas.hasAttribute('data-space-face');

    var W = 0, H = 0, K = 1, S = 1;               // size, pixel ratio, scale against a 1440 wide page
    var col = { dot: '240,237,232', accent: '128,128,240', ink: '28,26,23' };
    var P = [];                                   // the field
    var comets = [], sparks = [], moons = [], debris = [], shocks = [], planet = null;
    var live = false, raf = 0, last = 0, clock = 0, onScreen = true, calm = reduced();
    var ptr = { x: 0, y: 0, vx: 0, vy: 0, on: false, px: 0, py: 0 };
    var trail = [];                               // recent pointer samples: x, y, time
    var cometAt = 0;
    var ink = 0, inkT = 0;                        // the pointer's own line while it circles: shown, wanted
    var streaks = [], PX = 0, PY = 0, PZ = 0;     // dots falling into the hole this frame; holeProj's result
    var pending = null, hole = null, holdSel = '';          // black hole: waiting, charging
    var hoverBtn = null, focusBtn = null;                   // button gravity
    var grav = { btn: null, e: 0, cx: 0, cy: 0, rx: 0, ry: 0 };
    var wantRally = canvas.hasAttribute('data-space-rally');
    var noOrbit = canvas.hasAttribute('data-space-no-orbit');
    var game = null, best = 0, roU = 1;                     // rally game, best score, read-out scale
    var inv = null;                                         // the swarm game
    var bangOn = false, bangT = 0, bangEnd = 0;             // the eruption: elapsed, when the last dot lands

    /* ---------- set-up ---------- */
    function colours() {
      var cs = getComputedStyle(canvas);
      col.dot = rgbOf(cs.getPropertyValue('--space-dot'), col.dot);
      col.accent = rgbOf(cs.getPropertyValue('--space-accent'), col.accent);
      col.ink = rgbOf(cs.getPropertyValue('--space-ink'), col.ink);
    }
    function seed() {
      var rand = rng(5), n = Math.round(clamp(W * H / 5200, 70, 320)), i;
      P = [];
      for (i = 0; i < n; i++) {
        var depth = 0.35 + rand() * 0.65;
        P.push({
          hx: rand() * W, hy: rand() * H, x: 0, y: 0, vx: 0, vy: 0,
          r: (0.7 + depth * 1.4) * (rand() < 0.06 ? 1.7 : 1), a: 0.18 + depth * 0.5,
          depth: depth, ph: rand() * TAU, sp: 0.15 + rand() * 0.35, amp: 6 + rand() * 14,
          accent: rand() < 0.08,
          bo: false, ba: 0, bw: 0.4 + rand() * 0.8, bk: rand() * 0.35,  // in orbit round a button
          hk: 0, hr: 0, hth: 0,                                         // taken by the hole: 1 in its disc (radius, angle), 2 swallowed
          bf: false, bh: false, bx: 0, by: 0, bnx: 0, bny: 0, bdl: 0, bdu: 1  // in flight from the eruption: waiting, start, bow, delay, length
        });
        P[i].x = P[i].hx; P[i].y = P[i].hy;
      }
    }
    function resize() {
      var r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var k = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(3.2e6 / (r.width * r.height)));
      if (r.width === W && r.height === H && k === K) return;
      var first = !W, sx = r.width / (W || 1), sy = r.height / (H || 1);
      W = r.width; H = r.height; K = k; S = clamp(W / 1440, 0.6, 1.15);
      canvas.width = Math.round(W * K); canvas.height = Math.round(H * K);
      if (top) { top.width = canvas.width; top.height = canvas.height; topDirty = false; }
      if (first) seed();
      else for (var i = 0; i < P.length; i++) { P[i].hx *= sx; P[i].hy *= sy; P[i].x *= sx; P[i].y *= sy; P[i].bx *= sx; P[i].by *= sy; P[i].bnx *= sx; P[i].bny *= sy; }
      if (grav.btn) measureGrav();
      if (calm && live) draw(0);
    }

    /* ---------- gestures ---------- */
    function throwComet(x, y, dx, dy, speed) {
      var d = Math.sqrt(dx * dx + dy * dy) || 1, v = clamp(speed * 0.55, 650, 1500) * S;
      comets.push({ x: x, y: y, vx: dx / d * v, vy: dy / d * v, age: 0 });
      if (comets.length > 3) comets.shift();
    }
    function spinPlanet(x, y, dir) {
      var rand = rng((x * 13 + y * 7) | 0), rings = [], core = [], i;
      for (i = 0; i < 170; i++) {
        var band = rand() < 0.62 ? 0 : 1;        // two bands with a gap between them
        rings.push({ r: (band ? 182 + rand() * 50 : 96 + rand() * 58) * S, th: rand() * TAU, size: 0.9 + rand() * 1.5, late: rand() * 0.5, accent: rand() < 0.25 });
      }
      for (i = 0; i < 120; i++) {
        var yy = 1 - 2 * (i + 0.5) / 120;
        core.push({ y: yy, rr: Math.sqrt(1 - yy * yy), ph: i * 2.39996 });
      }
      moons.length = 0;
      planet = { x: x, y: y, dir: dir, age: 0, life: 7, rings: rings, core: core, tilt: -0.32 * dir, bodies: [], rand: rand, k0: (rand() * KINDS.length) | 0, lastA: 0 };
      // The path that made it becomes the start of the constellation, set down in the order drawn.
      // One body per BODY_STEP of turn round the centre (wider steps if the path
      // was long, so it starts with five at most).
      var total = 0, acc = 0, step, pa = null, da;
      for (i = 0; i < trail.length; i++) {
        da = Math.atan2(trail[i].y - y, trail[i].x - x);
        if (pa !== null) total += Math.abs(turnBy(pa, da));
        pa = da;
      }
      step = Math.max(BODY_STEP, total / 5); pa = null;
      for (i = 0; i < trail.length; i++) {
        da = Math.atan2(trail[i].y - y, trail[i].x - x);
        if (pa !== null) acc += Math.abs(turnBy(pa, da));
        pa = da;
        if (acc >= step) { acc = 0; addBody(trail[i].x, trail[i].y, -0.25 - planet.bodies.length * 0.09); }
      }
    }
    function turnBy(a, b) { var d = b - a; return d > Math.PI ? d - TAU : d < -Math.PI ? d + TAU : d; }
    // The constellation turns as one figure, slowly, the way the planet spins.
    function bodyRot(pl) { return pl.dir * pl.age * 0.1; }
    // One more body in the direction of the pointer, clear of the sphere. Each
    // sits a little further out than the last, so the figure winds outward
    // round the planet and its lines never cross.
    function addBody(x, y, age) {
      var pl = planet, n = pl.bodies.length;
      if (n >= MAX_BODIES) return;
      var dx = x - pl.x, dy = y - pl.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
      pl.lastA = Math.atan2(dy, dx);
      pl.bodies.push({
        r: Math.max(d, 96 * S) * (0.95 + 0.065 * n) * (0.96 + pl.rand() * 0.08), a: pl.lastA - bodyRot(pl),
        kind: KINDS[(n + pl.k0) % KINDS.length], size: 0.85 + pl.rand() * 0.5, tilt: (pl.rand() - 0.5) * 1.2,
        age: age || 0, x: x, y: y
      });
    }
    function drawBody(bd, a) {
      var x = bd.x, y = bd.y, u = bd.size * (0.8 + 0.2 * S) * spring(bd.age * 1.4), r;
      if (bd.kind === 'star') {
        var gl = 7 * u * (0.8 + 0.2 * Math.sin(clock * 2 + bd.a * 9));
        ctx.strokeStyle = rgba(col.dot, 0.55 * a); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x - gl, y); ctx.lineTo(x + gl, y); ctx.moveTo(x, y - gl); ctx.lineTo(x, y + gl); ctx.stroke();
        ctx.fillStyle = rgba(col.dot, a);
        ctx.beginPath(); ctx.arc(x, y, 2 * u, 0, TAU); ctx.fill();
        return;
      }
      if (bd.kind === 'moon') {
        var mg = ctx.createRadialGradient(x, y, 0, x, y, 12 * u);
        mg.addColorStop(0, rgba(col.accent, 0.4 * a)); mg.addColorStop(1, rgba(col.accent, 0));
        ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(x, y, 12 * u, 0, TAU); ctx.fill();
        ctx.fillStyle = rgba(col.accent, a);
        ctx.beginPath(); ctx.arc(x, y, 3.6 * u, 0, TAU); ctx.fill();
        return;
      }
      // A small world, lit from the upper left so it reads as a ball; one kind wears a ring.
      var ringed = bd.kind === 'ringed';
      r = (ringed ? 6.5 : 9) * u;
      if (r < 0.3) return;
      ctx.lineWidth = 1.1; ctx.strokeStyle = rgba(col.accent, 0.8 * a);
      if (ringed) { ctx.beginPath(); ctx.ellipse(x, y, r * 2.1, r * 0.6, bd.tilt, Math.PI, TAU); ctx.stroke(); }
      ctx.fillStyle = rgba(col.ink, a);
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      var bg = ctx.createRadialGradient(x - r * 0.45, y - r * 0.45, r * 0.1, x, y, r);
      bg.addColorStop(0, rgba(col.dot, a)); bg.addColorStop(0.65, rgba(col.dot, 0.5 * a)); bg.addColorStop(1, rgba(col.accent, 0.3 * a));
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      if (ringed) { ctx.beginPath(); ctx.ellipse(x, y, r * 2.1, r * 0.6, bd.tilt, 0, Math.PI); ctx.stroke(); }
    }
    // Read the last second or so of pointer movement for a flick or for circles.
    function readGesture(now) {
      while (trail.length && now - trail[0].t > 1100) trail.shift();
      var n = trail.length;
      if (n < 4) return;
      var i, a, b, path = 0, turn = 0, prev = null, minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9, cx = 0, cy = 0;
      var recentPath = 0, recentTurn = 0, first = null;
      for (i = 1; i < n; i++) {
        a = trail[i - 1]; b = trail[i];
        var dx = b.x - a.x, dy = b.y - a.y, len = Math.sqrt(dx * dx + dy * dy);
        minX = Math.min(minX, b.x); maxX = Math.max(maxX, b.x); minY = Math.min(minY, b.y); maxY = Math.max(maxY, b.y);
        cx += b.x; cy += b.y;
        if (len < 3) continue;
        var ang = Math.atan2(dy, dx), dAng = 0;
        if (prev !== null) { dAng = ang - prev; if (dAng > Math.PI) dAng -= TAU; if (dAng < -Math.PI) dAng += TAU; }
        prev = ang; path += len; turn += dAng;
        if (now - b.t < 130) { if (!first) first = a; recentPath += len; recentTurn += Math.abs(dAng); }
      }
      cx /= n - 1; cy /= n - 1;
      var span = Math.max(maxX - minX, maxY - minY);
      // The line shows once the pointer has clearly started to turn.
      inkT = span < 380 * S ? clamp((Math.abs(turn) - TAU * 0.45) / (TAU * 0.7), 0, 1) : 0;

      // Circles: more than a turn and a half, in a small area, at speed.
      if (Math.abs(turn) > TAU * 1.5 && path > 520 * S && span < 380 * S) {
        if (!planet || planet.age > planet.life - 0.6) spinPlanet(cx, cy, turn > 0 ? 1 : -1);
        else {
          // Still circling: it lasts longer, and the drawing goes on.
          planet.life = Math.min(planet.life + 0.06, planet.age + 7);
          var tip = trail[n - 1];
          if (Math.abs(turnBy(planet.lastA, Math.atan2(tip.y - planet.y, tip.x - planet.x))) > BODY_STEP) addBody(tip.x, tip.y, 0);
        }
        return;
      }
      // Flick: fast, nearly straight, and not part of a circle in progress.
      if (first && now - cometAt > 650 && Math.abs(turn) < Math.PI * 0.9) {
        var lastS = trail[n - 1], ddx = lastS.x - first.x, ddy = lastS.y - first.y, chord = Math.sqrt(ddx * ddx + ddy * ddy);
        var dt = Math.max(16, lastS.t - first.t) / 1000, speed = recentPath / dt;
        if (chord > 130 * S && chord / recentPath > 0.95 && recentTurn < 0.7 && speed > 1500 * S) {
          cometAt = now;
          throwComet(lastS.x, lastS.y, ddx, ddy, speed);
        }
      }
    }
    root.addEventListener('pointermove', function (ev) {
      if (!live) return;
      var r = canvas.getBoundingClientRect(), now = performance.now();
      var x = ev.clientX - r.left, y = ev.clientY - r.top;
      // The root can be taller than the field (the page field's root is main).
      if (y < -80 || y > r.height + 80) { if (ptr.on) leave(); return; }
      var lastS = trail[trail.length - 1];
      if (lastS) {
        var dt = Math.max(8, now - lastS.t) / 1000;
        ptr.vx = lerp(ptr.vx, (x - lastS.x) / dt, 0.5); ptr.vy = lerp(ptr.vy, (y - lastS.y) / dt, 0.5);
      }
      ptr.x = x; ptr.y = y; ptr.on = true;
      if (inv && !inv.over) inv.tx = x;
      if (calm) return;
      // A press that wanders is a drag or a flick, not a hold.
      if (pending && Math.abs(ev.clientX - pending.cx) + Math.abs(ev.clientY - pending.cy) > 8) cancelPending();
      if (hole || playing()) return;     // in a rally the pointer is the paddle, not a gesture
      trail.push({ x: x, y: y, t: now });
      readGesture(now);
    });
    function leave() { ptr.on = false; trail.length = 0; cancelPending(); abortHole(); }
    root.addEventListener('pointerleave', leave);
    root.addEventListener('pointercancel', leave);

    /* ---------- black hole ---------- */
    root.addEventListener('pointerdown', function (ev) {
      // In the swarm game a press shoots (links and buttons still work).
      if (inv && !inv.over) {
        if (ev.button === 0 && !(ev.target.closest && ev.target.closest(NO_HOLE))) inv.fire = true;
        return;
      }
      if (!live || calm || ev.button !== 0 || ev.pointerType === 'touch' || playing()) return;
      if (ev.target.closest && ev.target.closest(NO_HOLE)) return;
      var r = canvas.getBoundingClientRect();
      if (ev.clientY < r.top || ev.clientY > r.bottom) return;
      cancelPending();
      pending = { cx: ev.clientX, cy: ev.clientY, timer: setTimeout(startHole, HOLD_MS) };
    });
    window.addEventListener('pointerup', function () {
      if (inv) inv.fire = false;
      if (pending) cancelPending();
      if (hole) releaseHole();
    });
    window.addEventListener('pointercancel', function () { cancelPending(); abortHole(); });
    function cancelPending() {
      if (pending) { clearTimeout(pending.timer); pending = null; }
    }
    function startHole() {
      var p = pending; pending = null;
      if (!p || !live || calm) return;
      var r = canvas.getBoundingClientRect();
      // Its own disc: dots on rings from the inner edge (f 0) to the outer (f 1), more of them inside.
      var disc = [];
      for (var i = 0; i < DISC_N; i++) disc.push({ f: Math.pow(Math.random(), 1.3), th: Math.random() * TAU, s: 0.6 + Math.random() * 1.1 });
      hole = { x: p.cx - r.left, y: p.cy - r.top, cx: p.cx, cy: p.cy, t: 0, charge: 0, spin: 0, eaten: 0, disc: disc,
        rd: 5 * S, un: 0, DR: 1.6, DT: 0.26, cr: 1, sr: 0, pull: 0.25, reach: 200 * S, face: 0 };
      holdSel = root.style.userSelect;
      root.style.userSelect = 'none'; root.style.webkitUserSelect = 'none';
      try { var sel = window.getSelection(); if (sel) sel.removeAllRanges(); } catch (e) {}
      trail.length = 0;
      window.addEventListener('scroll', abortHole, { passive: true });   // the hole is pinned to the screen
      wake();
    }
    // A point of the disc, radius r and angle th in its plane, as seen: PX, PY
    // from the hole's centre in the disc's own frame (before the roll), PZ its
    // depth (1 nearest, -1 farthest). Light from the far side is bent round the
    // hole, so those points are pushed outward and never sit behind the shadow:
    // the far half of the disc shows as an arc over the top.
    function holeProj(r, th) {
      var ex = Math.cos(th) * r, ez = Math.sin(th) * r, sy = ez * hole.DT;
      if (ez < 0) {
        var b = Math.sqrt(ex * ex + sy * sy) || 1, e = hole.rd * 1.2;
        var k = 1 + ((b + Math.sqrt(b * b + 4 * e * e)) / 2 / b - 1) * smooth(0, 0.4, -ez / r);
        ex *= k; sy *= k;
      }
      PX = ex; PY = sy; PZ = ez / r;
    }
    function endHole() {
      // Everything it took is let go where it was; the swallowed ones come back at the centre.
      for (var i = 0; i < P.length; i++) {
        var p = P[i];
        if (!p.hk) continue;
        if (p.hk === 2) {
          var a = Math.random() * TAU, d = hole.rd * Math.random();
          p.x = hole.x + Math.cos(a) * d; p.y = hole.y + Math.sin(a) * d * 0.5;
        }
        p.hk = 0; p.vx = 0; p.vy = 0;
      }
      hole = null;
      root.style.userSelect = holdSel; root.style.webkitUserSelect = holdSel;
      window.removeEventListener('scroll', abortHole);
    }
    function face() { return wantFace && window.HeroFace && window.HeroFace.consume ? window.HeroFace : null; }
    function abortHole() {
      if (!hole) return;
      var f = face();
      if (f) f.spit(hole.cx, hole.cy);
      endHole();
    }
    function releaseHole() {
      var h = hole, c = h.charge, m = Math.min(1, h.eaten / 80), i, p;   // m: how much it ate
      endHole();
      shocks.push({ x: h.x, y: h.y, age: 0, life: 0.9 + 0.4 * m, max: (240 + 420 * c + 520 * m) * S, power: c, flat: 0.32 });
      var reach = (380 + 260 * c + 520 * m) * S, kick = 200 + 900 * c + 500 * m;
      for (i = 0; i < P.length; i++) {
        p = P[i];
        var ox = p.x - h.x, oy = p.y - h.y, od = Math.sqrt(ox * ox + oy * oy) || 1;
        if (od < reach) { var f = 1 - od / reach; p.vx += ox / od * kick * f; p.vy += oy / od * kick * f; }
      }
      for (i = 0; i < 6 + Math.round(26 * c); i++) {
        var a = Math.random() * TAU, v = (120 + Math.random() * 380) * (0.5 + c);
        sparks.push({ x: h.x, y: h.y, vx: Math.cos(a) * v * 1.3, vy: Math.sin(a) * v * 0.35, age: 0, life: 0.5 + Math.random() * 0.7, r: 0.5 + Math.random() * 1.3 });
      }
      // Held past SWARM_S, on any page, it gives back a swarm to shoot down (and
      // keeps what it ate of the portrait until that is over). Let go sooner
      // and the portrait's dots are thrown back with the rest, and it is a rally.
      var hf = face(), ate = h.t >= SWARM_S && wantRally && !calm && !playing();
      if (ate) { if (hf) hf.keep(); }
      else {
        if (hf) hf.spit(h.cx, h.cy);
        if (wantFace && window.HeroFace && window.HeroFace.burst) window.HeroFace.burst(h.cx, h.cy, 0.6 + c * 1.6);
      }
      if (ate) startSwarm(h);
      else if (wantRally && !calm && !playing()) startGame(h);
      wake();
    }

    /* ---------- rally: pong, played with the field ---------- */
    // Serve from the released hole. The player's paddle is a crescent of dots at
    // the hole's x (pd is its side: -1 left, 1 right), the far one answers every
    // ball. Hits turn the ball by where it landed on the paddle. Everything is in
    // canvas pixels and dt, and the ball drags the field like a comet does.
    var RALLY_KEY = 'jj-rally-best';
    function playing() { return (!!game && !game.over) || (!!inv && !inv.over); }
    function readBest(key) {
      try { return parseInt(localStorage.getItem(key), 10) || 0; } catch (e) { return 0; }
    }
    function saveBest(n, key) {
      if (n <= best) return;
      best = n;
      try { localStorage.setItem(key, String(n)); } catch (e) {}
    }
    function startGame(h) {
      var dir = h.x < W / 2 ? 1 : -1, pd = -dir, a = (Math.random() * 2 - 1) * 0.3, sp = (520 + 380 * h.charge) * S;
      var px = pd < 0 ? clamp(h.x, 48 * S, W * 0.42) : W - clamp(W - h.x, 48 * S, W * 0.42);
      best = readBest(RALLY_KEY);
      trail.length = 0;
      game = {
        pd: pd, t: 0, over: false, overT: 0, score: 0, sp: sp, half: 52 * S, r: 3 * S,
        px: px, py: h.y, ox: pd < 0 ? W - 56 * S : 56 * S, oy: h.y, oOff: (Math.random() * 2 - 1) * 0.6,
        pFlash: 0, oFlash: 0,
        ball: { x: h.x, y: h.y, vx: dir * sp * Math.cos(a), vy: sp * Math.sin(a) }
      };
    }
    // Ends it now with no read-out: Escape, hide, scrolled away, motion setting.
    function quitGame() {
      if (game && !game.over) saveBest(game.score, RALLY_KEY);
      game = null;
      if (inv && !inv.over) { saveBest(inv.score, SWARM_KEY); faceBack(calm || !live); }
      inv = null;
    }
    function finishGame() {
      var g = game;
      g.over = true; g.overT = 0; g.ball = null;
      saveBest(g.score, RALLY_KEY);
      if (g.score >= 1 && window.umami && window.umami.track) {
        try { window.umami.track('hero-rally', { score: g.score }); } catch (e) {}
      }
    }
    // A hit: the ball leaves the paddle at x going out (+1 right, -1 left).
    function bounce(g, b, x, yc, padY, out) {
      var a = clamp((yc - padY) / g.half, -1, 1) * 0.6, i, p, n = 8 + Math.floor(Math.random() * 5);
      b.x = x + out * g.r; b.y = yc;
      b.vx = out * g.sp * Math.cos(a); b.vy = g.sp * Math.sin(a);
      for (i = 0; i < n; i++) {
        var sa = (out > 0 ? 0 : Math.PI) + (Math.random() - 0.5) * 2.4, sv = 90 + Math.random() * 260;
        sparks.push({ x: x, y: yc, vx: Math.cos(sa) * sv, vy: Math.sin(sa) * sv, age: 0, life: 0.35 + Math.random() * 0.5, r: 0.6 + Math.random() * 1.2 });
      }
      var reach = 120 * S;
      for (i = 0; i < P.length; i++) {
        p = P[i];
        var dx = p.x - x, dy = p.y - yc, d = Math.sqrt(dx * dx + dy * dy) || 1;
        if (d < reach) { var f = 1 - d / reach; p.vx += out * 150 * f; p.vy += dy / d * 70 * f; }
      }
    }
    function updateGame(dt) {
      var g = game, b = g.ball, k, pd = g.pd;
      g.t += dt;
      g.pFlash *= Math.exp(-dt * 6); g.oFlash *= Math.exp(-dt * 6);
      if (g.over) { g.overT += dt; if (g.overT > 3.1) game = null; return; }

      // The pointer is the paddle, eased. The far one follows the ball.
      g.py += (clamp(ptr.y, g.half, H - g.half) - g.py) * (1 - Math.exp(-dt / 0.06));
      var toOpp = b.vx * pd < 0;
      g.oy += ((toOpp ? b.y + g.oOff * g.half : H / 2) - g.oy) * (1 - Math.exp(-dt / (toOpp ? 0.1 : 0.45)));
      g.oy = clamp(g.oy, g.half, H - g.half);

      var x0 = b.x, y0 = b.y;
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.y < 12) { b.y = 12; b.vy = Math.abs(b.vy); }
      else if (b.y > H - 12) { b.y = H - 12; b.vy = -Math.abs(b.vy); }

      // Did it cross a paddle's x this frame, heading for it?
      if (toOpp && (x0 - g.ox) * pd > 0 && (b.x - g.ox) * pd <= 0) {
        var yo = lerp(y0, b.y, (g.ox - x0) / (b.x - x0));
        if (Math.abs(yo - g.oy) > g.half + g.r - 2) g.oy = yo - g.oOff * g.half;   // it never misses
        bounce(g, b, g.ox, yo, g.oy, pd); g.oFlash = 1;
      } else if (!toOpp && (x0 - g.px) * pd < 0 && (b.x - g.px) * pd >= 0) {
        var yp = lerp(y0, b.y, (g.px - x0) / (b.x - x0));
        if (Math.abs(yp - g.py) <= g.half + g.r) {
          g.score++; g.sp = Math.min(g.sp * 1.06, 1500 * S);
          bounce(g, b, g.px, yp, g.py, -pd); g.pFlash = 1;
          g.oOff = (Math.random() * 2 - 1) * 0.6;
        }
      }
      if (pd < 0 ? b.x < -g.r * 4 : b.x > W + g.r * 4) { finishGame(); return; }

      for (k = Math.random() < 0.5 ? 2 : 1; k > 0; k--) {
        sparks.push({ x: b.x, y: b.y, vx: b.vx * 0.05 + (Math.random() - 0.5) * 60, vy: b.vy * 0.05 + (Math.random() - 0.5) * 60, age: 0, life: 0.35 + Math.random() * 0.6, r: 0.5 + Math.random() * 1.1 });
      }
      pushFace(b, dt);
    }
    function drawPaddle(g, x, y, edge, flash, a) {
      ctx.beginPath();
      ctx.fillStyle = 'rgba(' + col.accent + ',' + (0.9 * a).toFixed(3) + ')';
      for (var i = 0; i < 9; i++) {
        var f = i / 4 - 1, q = 1 - f * f;
        dot(ctx, x + edge * q * 9 * S, y + f * g.half, (2.3 + 0.9 * q) * S + 0.3 + flash * 1.6);
      }
      ctx.fill();
    }
    function drawGame() {
      var g = game, b = g.ball, a = clamp(g.t / 0.3, 0, 1) * (g.over ? 1 - clamp(g.overT / 0.5, 0, 1) : 1), y;
      if (a > 0.004) {
        ctx.beginPath();
        ctx.fillStyle = 'rgba(' + col.dot + ',' + (0.18 * a).toFixed(3) + ')';
        for (y = rallyTop() + 44; y < H; y += 14 * S) dot(ctx, W / 2, y, 1.1 * S + 0.2);   // the net starts under the score
        ctx.fill();
        drawPaddle(g, g.px, g.py, g.pd, g.pFlash, a);
        drawPaddle(g, g.ox, g.oy, -g.pd, g.oFlash, a);
      }
      if (!b) return;
      var sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy) || 1, L = Math.min(150 * S, sp * 0.1), ux = b.vx / sp, uy = b.vy / sp;
      var tail = ctx.createLinearGradient(b.x, b.y, b.x - ux * L, b.y - uy * L);
      tail.addColorStop(0, 'rgba(' + col.dot + ',0.8)');
      tail.addColorStop(1, 'rgba(' + col.dot + ',0)');
      ctx.strokeStyle = tail; ctx.lineWidth = 2 * S + 0.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - ux * L, b.y - uy * L); ctx.stroke();
      ctx.fillStyle = 'rgb(' + col.dot + ')';
      ctx.beginPath(); ctx.arc(b.x, b.y, g.r, 0, TAU); ctx.fill();
    }
    /* ---------- swarm: what the hole gives back when it has eaten the portrait ---------- */
    // Rows of small figures made of dots march across and step down; the ship
    // along the bottom follows the pointer and shoots on a press. Canvas pixels
    // and dt, like the rally. Figures and ship are lists of dot offsets.
    var SWARM_KEY = 'jj-swarm-best';
    var FIGS = [
      [[0, 0], [2.2, 0], [1.1, 1.9], [-1.1, 1.9], [-2.2, 0], [-1.1, -1.9], [1.1, -1.9]],   // a ring round a centre
      [[-2.4, -1.2], [-1.2, 0], [0, 1.2], [1.2, 0], [2.4, -1.2], [0, -0.8]],               // a chevron
      [[0, -2.2], [-1.8, 0], [1.8, 0], [0, 2.2], [0, 0]]                                   // a diamond
    ];
    var SHIP = [[0, -2.4], [-1.1, -0.8], [1.1, -0.8], [-2.2, 0.8], [0, 0.8], [2.2, 0.8]];
    // A new swarm, every figure flying out from (ox, oy) to its place in the rows.
    function swarmWave(g, ox, oy) {
      var cols = W > 900 ? 9 : W > 600 ? 7 : 5, rows = 4, cw = Math.min(64 * S, W * 0.8 / cols), ch = 46 * S, r, c;
      var x0 = W / 2 - (cols - 1) * cw / 2, y0 = rallyTop() + 56 * S;
      g.foes = []; g.fx = 0; g.fy = 0; g.dir = 1; g.total = cols * rows; g.born = g.t; g.bombIn = 1.8;
      for (r = 0; r < rows; r++) {
        for (c = 0; c < cols; c++) {
          g.foes.push({ sx: x0 + c * cw, sy: y0 + r * ch, kind: r === 0 ? 0 : r < 3 ? 1 : 2, top: r === 0, col: c,
            late: (r * cols + c) / g.total * 0.5, x: ox, y: oy, alive: true });
        }
      }
      g.ox = ox; g.oy = oy;
    }
    function startSwarm(h) {
      best = readBest(SWARM_KEY);
      trail.length = 0;
      var x = clamp(ptr.x, 24 * S, W - 24 * S);
      inv = { t: 0, over: false, overT: 0, score: 0, lives: 3, wave: 1, x: x, tx: x, y: H - 64 * S, key: 0,
        cool: 0.6, fire: false, shots: [], bombs: [], hurt: 0, foes: [] };
      swarmWave(inv, h.x, h.y);
    }
    // The portrait comes home from what is left of the swarm (or from the ship).
    function faceBack(instant) {
      var f = face(), g = inv, r = canvas.getBoundingClientRect(), pts = [], i;
      if (!f) return;
      for (i = 0; g && i < g.foes.length; i++) if (g.foes[i].alive) pts.push(r.left + g.foes[i].x, r.top + g.foes[i].y);
      if (!pts.length && g) pts.push(r.left + g.x, r.top + g.y);
      f.restore(pts, instant);
    }
    function finishSwarm() {
      var g = inv;
      g.over = true; g.overT = 0; g.shots.length = 0; g.bombs.length = 0; g.fire = false;
      saveBest(g.score, SWARM_KEY);
      faceBack(false);
      if (g.score >= 1 && window.umami && window.umami.track) {
        try { window.umami.track('hero-swarm', { score: g.score }); } catch (e) {}
      }
    }
    function burstAt(x, y, n, v) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * TAU, s = (0.3 + Math.random()) * v;
        sparks.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, age: 0, life: 0.35 + Math.random() * 0.5, r: 0.6 + Math.random() * 1.2 });
      }
    }
    function updateSwarm(dt) {
      var g = inv, i, j, f, s, alive = 0, minX = 1e9, maxX = -1e9, maxY = -1e9, age;
      g.t += dt; g.hurt *= Math.exp(-dt * 5);
      if (g.over) { g.overT += dt; if (g.overT > 3.1) inv = null; return; }
      age = g.t - g.born;

      g.tx = clamp(g.tx + g.key * 560 * S * dt, 24 * S, W - 24 * S);
      g.x += (g.tx - g.x) * (1 - Math.exp(-dt / 0.05));

      // The swarm: faster as it thins and with every wave; at an edge it turns and steps down.
      for (i = 0; i < g.foes.length; i++) {
        f = g.foes[i];
        if (!f.alive) continue;
        alive++; minX = Math.min(minX, f.sx); maxX = Math.max(maxX, f.sx);
      }
      if (!alive) { g.wave++; g.score += 10; swarmWave(g, W / 2, -40); return; }
      if (age > 1.2) {
        g.fx += g.dir * (22 + 95 * (1 - alive / g.total) + 9 * g.wave) * S * dt;
        if ((g.dir > 0 && maxX + g.fx > W - 28 * S) || (g.dir < 0 && minX + g.fx < 28 * S)) { g.dir = -g.dir; g.fy += 18 * S; }
      }
      for (i = 0; i < g.foes.length; i++) {
        f = g.foes[i];
        if (!f.alive) continue;
        var e = clamp((age - f.late) / 0.7, 0, 1); e = 1 - Math.pow(1 - e, 3);
        f.x = lerp(g.ox, f.sx + g.fx, e); f.y = lerp(g.oy, f.sy + g.fy, e);
        if (f.y > maxY) maxY = f.y;
      }
      if (age > 1.2 && maxY > g.y - 26 * S) { finishSwarm(); return; }

      // Your shots, up to three in the air.
      g.cool -= dt;
      if (g.fire && g.cool <= 0 && g.shots.length < 3) { g.cool = 0.26; g.shots.push({ x: g.x, y: g.y - 12 * S }); }
      for (i = g.shots.length - 1; i >= 0; i--) {
        s = g.shots[i];
        s.y -= 640 * S * dt;
        if (s.y < -10) { g.shots.splice(i, 1); continue; }
        for (j = 0; j < g.foes.length; j++) {
          f = g.foes[j];
          if (!f.alive || Math.abs(f.x - s.x) > 15 * S || Math.abs(f.y - s.y) > 14 * S) continue;
          f.alive = false; g.score += f.top ? 3 : 1;
          burstAt(f.x, f.y, 9, 220);
          g.shots.splice(i, 1);
          break;
        }
      }

      // Theirs: now and then the lowest figure of a column drops one.
      g.bombIn -= dt;
      if (g.bombIn <= 0 && age > 1.2) {
        g.bombIn = Math.max(0.45, 1.3 - 0.12 * g.wave) * (0.6 + Math.random() * 0.8);
        var pick = null, k = (Math.random() * g.foes.length) | 0;
        for (i = 0; i < g.foes.length && !pick; i++) { f = g.foes[(k + i) % g.foes.length]; if (f.alive) pick = f; }
        for (i = 0; pick && i < g.foes.length; i++) { f = g.foes[i]; if (f.alive && f.col === pick.col && f.y > pick.y) pick = f; }
        if (pick) g.bombs.push({ x: pick.x, y: pick.y + 10 * S });
      }
      for (i = g.bombs.length - 1; i >= 0; i--) {
        s = g.bombs[i];
        s.y += (230 + 20 * g.wave) * S * dt;
        if (s.y > H + 10) { g.bombs.splice(i, 1); continue; }
        if (Math.abs(s.x - g.x) < 14 * S && Math.abs(s.y - g.y) < 12 * S) {
          g.bombs.splice(i, 1);
          g.lives--; g.hurt = 1;
          burstAt(g.x, g.y, 16, 300);
          shocks.push({ x: g.x, y: g.y, age: 0, life: 0.7, max: 120 * S, power: 0.6 });
          if (g.lives <= 0) { finishSwarm(); return; }
        }
      }
    }
    function drawSwarm() {
      var g = inv, a = clamp(g.t / 0.3, 0, 1) * (g.over ? 1 - clamp(g.overT / 0.45, 0, 1) : 1), u = 3.1 * S + 0.6, i, j, f, fig, pass;
      if (a < 0.004) return;
      var wob = Math.sin(g.t * 5) * 0.12;
      for (pass = 0; pass < 2; pass++) {             // the top row in accent, the rest in the dot colour
        ctx.beginPath();
        ctx.fillStyle = rgba(pass ? col.accent : col.dot, 0.95 * a);
        for (i = 0; i < g.foes.length; i++) {
          f = g.foes[i];
          if (!f.alive || !!f.top !== !!pass) continue;
          fig = FIGS[f.kind];
          for (j = 0; j < fig.length; j++) dot(ctx, f.x + fig[j][0] * u * (1 + (j % 2 ? wob : -wob)), f.y + fig[j][1] * u, 1.5 * S + 0.5);
        }
        ctx.fill();
      }
      if (g.over) return;
      // The ship, with a dot under it for each life in hand.
      ctx.beginPath();
      ctx.fillStyle = rgba(col.accent, 0.95 * a);
      for (j = 0; j < SHIP.length; j++) dot(ctx, g.x + SHIP[j][0] * u, g.y + SHIP[j][1] * u, 1.9 * S + 0.5 + g.hurt * 1.6);
      for (j = 0; j < g.lives - 1; j++) dot(ctx, g.x + (j - (g.lives - 2) / 2) * 9 * S, g.y + 18 * S, 1.3 * S + 0.4);
      ctx.fill();
      ctx.strokeStyle = rgba(col.dot, 0.9 * a); ctx.lineWidth = 2 * S + 0.5; ctx.lineCap = 'round';
      ctx.beginPath();
      for (i = 0; i < g.shots.length; i++) { ctx.moveTo(g.shots[i].x, g.shots[i].y); ctx.lineTo(g.shots[i].x, g.shots[i].y + 14 * S); }
      ctx.stroke();
      ctx.strokeStyle = rgba(col.accent, 0.45 * a); ctx.lineWidth = 1.4 * S + 0.4;
      ctx.beginPath();
      for (i = 0; i < g.bombs.length; i++) { ctx.moveTo(g.bombs[i].x, g.bombs[i].y); ctx.lineTo(g.bombs[i].x, g.bombs[i].y - 12 * S); }
      ctx.stroke();
      ctx.beginPath();
      ctx.fillStyle = rgba(col.accent, a);
      for (i = 0; i < g.bombs.length; i++) dot(ctx, g.bombs[i].x, g.bombs[i].y, 2.4 * S + 0.5);
      ctx.fill();
    }
    function two(n) { return n < 10 ? '0' + n : '' + n; }
    // RALLY 05   BEST 07, with MOVE TO RETURN under it for the first moments.
    // The swarm game uses the same read-out with its own words.
    function drawRally(g, labelAttr, label, hintAttr, hintWord) {
      var ra = clamp(g.t / 0.3, 0, 1) * (g.over && g.overT > 2.5 ? 1 - clamp((g.overT - 2.5) / 0.6, 0, 1) : 1);
      if (ra <= 0) return;
      // A score board: centred on the net, under the nav, clear of the hero's copy.
      setReadout();
      var px = Math.max(12, Math.round(13 * roU)), y = rallyTop();
      ctx.font = '500 ' + px + 'px ' + MONO;
      var s = (canvas.getAttribute(labelAttr) || label) + ' ' + two(g.score);
      var b = best > 0 ? (canvas.getAttribute('data-best-label') || 'BEST') + ' ' + two(best) : '';
      var gap = ctx.measureText('   ').width, sw = ctx.measureText(s).width, bw = b ? ctx.measureText(b).width : 0;
      var x = W / 2 - (sw + (b ? gap + bw : 0)) / 2;
      ctx.fillStyle = 'rgba(' + col.accent + ',' + ra.toFixed(3) + ')';
      ctx.fillText(s, x, y);
      ctx.fillStyle = 'rgba(' + col.dot + ',' + (0.55 * ra).toFixed(3) + ')';
      if (b) ctx.fillText(b, x + sw + gap, y);
      if (!g.over && g.t < 2.5) {
        var hint = canvas.getAttribute(hintAttr) || hintWord;
        ctx.fillStyle = 'rgba(' + col.dot + ',' + (0.55 * ra * Math.min(1, (2.5 - g.t) / 0.4)).toFixed(3) + ')';
        ctx.fillText(hint, W / 2 - ctx.measureText(hint).width / 2, y + Math.round(px * 1.8));
      }
    }
    // Baseline of the score: below the fixed nav.
    function rallyTop() { return Math.round(Math.max(104, H * 0.13)); }

    /* ---------- comet meets planet ---------- */
    function captureMoon(c, Rref) {
      var ct = Math.cos(planet.tilt), st = Math.sin(planet.tilt);
      var dx = c.x - planet.x, dy = c.y - planet.y;
      var ex = dx * ct + dy * st, ey = (-dx * st + dy * ct) / 0.34;     // into the ring plane
      var r0 = Math.sqrt(ex * ex + ey * ey), rt = clamp(r0, 1.6 * Rref, 2.8 * Rref);
      var sign = dx * c.vy - dy * c.vx > 0 ? 1 : -1;
      moons.push({ th: Math.atan2(ey, ex), r: r0, rt: rt, w: sign * 2.6 * Math.pow(110 * S / rt, 1.2), tr: [] });
      for (var k = 0; k < 10; k++) {
        sparks.push({ x: c.x, y: c.y, vx: (Math.random() - 0.5) * 160, vy: (Math.random() - 0.5) * 160, age: 0, life: 0.4 + Math.random() * 0.6, r: 0.6 + Math.random() });
      }
    }
    // The planet breaks: its dots fly out as a ring of debris, the field is thrown clear.
    function shatter(c, R) {
      var ct = Math.cos(planet.tilt), st = Math.sin(planet.tilt), rot = planet.age * 1.3 * planet.dir, i, d = [];
      function add(px, py, speed, size, accent) {
        var ang = Math.atan2(py - planet.y, px - planet.x) + (Math.random() - 0.5) * 0.5;
        d.push({ x: px, y: py, vx: Math.cos(ang) * speed + c.vx * 0.2, vy: Math.sin(ang) * speed + c.vy * 0.2, r: size, accent: accent });
      }
      for (i = 0; i < planet.core.length; i++) {
        var k = planet.core[i], sx = Math.cos(k.ph + rot) * k.rr * R, sy = k.y * R;
        add(planet.x + sx * ct - sy * st, planet.y + sx * st + sy * ct, (150 + Math.random() * 380) * S, (0.8 + Math.random() * 1.1) * S + 0.3, false);
      }
      for (i = 0; i < planet.rings.length; i++) {
        var g = planet.rings[i], open = spring((planet.age - g.late) * 0.8), rr = g.r * open;
        var ex = Math.cos(g.th) * rr, ey = Math.sin(g.th) * rr * 0.34;
        add(planet.x + ex * ct - ey * st, planet.y + ex * st + ey * ct, (100 + Math.random() * 320) * S, g.size, g.accent);
      }
      for (i = 0; i < planet.bodies.length; i++) {
        if (planet.bodies[i].age > 0) add(planet.bodies[i].x, planet.bodies[i].y, (120 + Math.random() * 260) * S, 2.4 * S + 0.6, true);
      }
      debris.push({ age: 0, life: 1.2, d: d });
      shocks.push({ x: planet.x, y: planet.y, age: 0, life: 1.2, max: 340 * S, power: 0.8 });
      var reach = 360 * S;
      for (i = 0; i < P.length; i++) {
        var p = P[i], ox = p.x - planet.x, oy = p.y - planet.y, od = Math.sqrt(ox * ox + oy * oy) || 1;
        if (od < reach) { var f = 1 - od / reach; p.vx += ox / od * 520 * f; p.vy += oy / od * 520 * f; }
      }
      planet = null; moons.length = 0;
    }

    /* ---------- button gravity ---------- */
    function btnOf(t) {
      var b = t && t.closest ? t.closest(BTN_SEL) : null;
      return b && root.contains(b) && !b.disabled ? b : null;
    }
    function focusVisible(b) {
      try { return b.matches(':focus-visible'); } catch (e) { return true; }
    }
    // The button's box in canvas space. Read when the hover starts and on resize, not per frame.
    function measureGrav() {
      var r = canvas.getBoundingClientRect(), b = grav.btn.getBoundingClientRect();
      grav.cx = b.left - r.left + b.width / 2; grav.cy = b.top - r.top + b.height / 2;
      grav.rx = b.width / 2 * 1.08 + 26; grav.ry = b.height / 2 * 1.1 + 24;
    }
    function releaseGrav() {
      if (!grav.btn) return;
      for (var i = 0; i < P.length; i++) {
        var p = P[i];
        if (!p.bo) continue;
        p.bo = false;
        if (calm) continue;
        var ox = p.x - grav.cx, oy = p.y - grav.cy, od = Math.sqrt(ox * ox + oy * oy) || 1;
        p.vx += ox / od * 110; p.vy += oy / od * 110;      // a small push as they let go
      }
      grav.btn = null;
    }
    function updateGrav() {
      var b = calm || !live || noOrbit ? null : hoverBtn || focusBtn;
      if (b === grav.btn) return;
      releaseGrav();
      if (b && W) { grav.btn = b; grav.e = 0; measureGrav(); }
      wake();
    }
    root.addEventListener('pointerover', function (ev) {
      if (ev.pointerType === 'touch') return;
      var b = btnOf(ev.target);
      if (b && b !== hoverBtn) { hoverBtn = b; updateGrav(); }
    });
    root.addEventListener('pointerout', function (ev) {
      var b = btnOf(ev.target);
      if (b && b === hoverBtn && !(ev.relatedTarget && b.contains(ev.relatedTarget))) { hoverBtn = null; updateGrav(); }
    });
    root.addEventListener('focusin', function (ev) {
      var b = btnOf(ev.target);
      if (b && focusVisible(b)) { focusBtn = b; updateGrav(); }   // a mouse click's focus doesn't count
    });
    root.addEventListener('focusout', function (ev) {
      if (focusBtn && focusBtn.contains(ev.target)) { focusBtn = null; updateGrav(); }
    });

    /* ---------- one frame ---------- */
    // Font and margin for the rally read-out; returns the margin.
    function setReadout() {
      roU = clamp(W / 1440, 0.75, 1.25);
      ctx.font = '500 ' + Math.round(11 * roU) + 'px ' + MONO;
      ctx.textBaseline = 'alphabetic';
      return Math.round(Math.max(16, W * 0.03));
    }
    // A comet or the ball crossing the portrait scatters and lights it.
    function pushFace(c, dt) {
      if (wantFace && window.HeroFace && window.HeroFace.push) {
        var hr = canvas.getBoundingClientRect();
        window.HeroFace.push(hr.left + c.x, hr.top + c.y, c.vx * dt * 5, c.vy * dt * 5, 95 * S);
      }
    }
    function draw(dt) {
      var i, p, c;
      ctx.setTransform(K, 0, 0, K, 0, 0);
      ctx.clearRect(0, 0, W, H);

      ptr.vx *= Math.exp(-dt * 6); ptr.vy *= Math.exp(-dt * 6);
      var tx = ptr.on ? ptr.x / W - 0.5 : 0, ty = ptr.on ? ptr.y / H - 0.5 : 0;
      ptr.px += (tx - ptr.px) * Math.min(1, dt * 3); ptr.py += (ty - ptr.py) * Math.min(1, dt * 3);

      streaks.length = 0;
      if (hole) {
        // It charges in CHARGE_S, then keeps growing for as long as it is held:
        // a longer reach, a harder pull, and a bigger shadow for every dot eaten.
        hole.t += dt; hole.charge = clamp(hole.t / CHARGE_S, 0, 1);
        var over = Math.max(0, hole.t - CHARGE_S);
        var sz = 1 - Math.pow(1 - hole.charge, 3) + Math.min(0.5, over * 0.05) + Math.min(0.6, hole.eaten * 0.005) + 0.35 * hole.face;
        hole.rd = (5 + 46 * sz) * S * (1 + 0.025 * Math.sin(hole.t * 2.3));
        hole.un = smooth(0.05, 0.85, hole.charge);
        hole.DR = 1.6 + 3.3 * hole.un;
        // The disc's plane tips and rolls slowly, so it is seen from a moving angle.
        hole.DT = 0.26 - 0.09 * hole.un + 0.035 * Math.sin(hole.t * 0.6);
        var roll = -0.2 + 0.05 * Math.sin(hole.t * 0.43);
        hole.roll = roll; hole.cr = Math.cos(roll); hole.sr = Math.sin(roll);
        hole.pull = 0.25 + 0.75 * hole.charge + Math.min(1.2, over * 0.22);
        hole.reach = Math.min(Math.sqrt(W * W + H * H), (200 + 190 * hole.t) * S);
        // The portrait is within its reach too: a growing share of it falls in.
        var hf0 = face();
        if (hf0) hole.face = hf0.consume(hole.cx, hole.cy, hole.reach, hole.rd, clamp((hole.t - 0.8) / 2.2, 0, 1));
        if (wantFace && window.HeroFace && window.HeroFace.attract) window.HeroFace.attract(hole.cx, hole.cy, hole.charge);
      }
      if (game) updateGame(dt);
      if (inv) updateSwarm(dt);
      if (bangOn) bangT += dt;
      grav.e += ((grav.btn ? 1 : 0) - grav.e) * Math.min(1, dt * 2.5);
      if (grav.e < 0.004 && !grav.btn) grav.e = 0;

      // The planet: how grown it is, and how far along its end.
      var grow = 0, fade = 1;
      if (planet) {
        planet.age += dt;
        grow = spring(planet.age * 0.9);
        fade = clamp((planet.life - planet.age) / 0.9, 0, 1);
        if (planet.age >= planet.life) {
          // Let go: the field around it is thrown outward.
          for (i = 0; i < P.length; i++) {
            p = P[i];
            var ox = p.x - planet.x, oy = p.y - planet.y, od = Math.sqrt(ox * ox + oy * oy) || 1;
            if (od < 300 * S) { p.vx += ox / od * 260; p.vy += oy / od * 260; }
          }
          planet = null; moons.length = 0;
        }
      }

      /* comets */
      for (i = comets.length - 1; i >= 0; i--) {
        c = comets[i];
        c.age += dt;
        if (planet) {
          var gx = planet.x - c.x, gy = planet.y - c.y, g2 = gx * gx + gy * gy + 2500, gd = Math.sqrt(g2);
          var pull = 9e6 * S * S / g2 * fade;
          c.vx += gx / gd * pull * dt; c.vy += gy / gd * pull * dt;
        }
        c.x += c.vx * dt; c.y += c.vy * dt;
        if (planet && grow > 0.5 && fade > 0.3) {
          var Rs = 58 * S * grow * (0.4 + 0.6 * fade);
          var pdx = c.x - planet.x, pdy = c.y - planet.y, pd = Math.sqrt(pdx * pdx + pdy * pdy);
          if (pd < Rs) { shatter(c, Rs); comets.splice(i, 1); continue; }
          if (pd > 1.3 * Rs && pd < 3.2 * Rs && moons.length < MAX_MOONS) { captureMoon(c, 58 * S); comets.splice(i, 1); continue; }
        }
        for (var k2 = 0; k2 < 2; k2++) {
          sparks.push({ x: c.x, y: c.y, vx: c.vx * 0.06 + (Math.random() - 0.5) * 70, vy: c.vy * 0.06 + (Math.random() - 0.5) * 70, age: 0, life: 0.45 + Math.random() * 0.8, r: 0.5 + Math.random() * 1.3 });
        }
        pushFace(c, dt);
        if (c.age > 6 || c.x < -260 || c.y < -260 || c.x > W + 260 || c.y > H + 260) comets.splice(i, 1);
      }
      if (sparks.length > 400) sparks.splice(0, sparks.length - 400);

      /* the field */
      var reachP = 300 * S, gb = Math.min(1, grav.e * 1.4);
      for (i = 0; i < P.length; i++) {
        p = P[i];
        var hx = p.hx + Math.cos(clock * p.sp + p.ph) * p.amp - ptr.px * p.depth * 26;
        var hy = p.hy + Math.sin(clock * p.sp * 0.8 + p.ph) * p.amp - ptr.py * p.depth * 26;
        // Still flying out from the eruption: the path is set, nothing else acts on it.
        if (p.bf) {
          var bu = (bangT - p.bdl) / p.bdu;
          p.vx = 0; p.vy = 0;
          if (bu < 0) { p.bh = true; p.x = p.bx; p.y = p.by; continue; }
          p.bh = false;
          if (bu >= 1) { p.bf = false; p.x = hx; p.y = hy; continue; }
          var be = (1 - Math.exp(-6.5 * bu)) / (1 - Math.exp(-6.5)), bb = 4 * be * (1 - be);
          p.x = p.bx + (hx - p.bx) * be + p.bnx * bb; p.y = p.by + (hy - p.by) * be + p.bny * bb;
          continue;
        }
        // Taken by the hole: on a ring of its disc, winding down until it is swallowed.
        if (p.hk) {
          p.vx = 0; p.vy = 0;
          if (p.hk === 1) {
            p.hr *= Math.exp(-dt * (0.16 + 0.2 * hole.charge));
            p.hth += dt * 2.6 * Math.pow(hole.rd * 2 / p.hr, 1.5);
            if (p.hr < hole.rd * 1.35) { p.hk = 2; hole.eaten++; p.x = hole.x; p.y = hole.y; }
            else {
              holeProj(p.hr, p.hth);
              var he = Math.min(1, dt * 12);
              p.x += (hole.x + PX * hole.cr - PY * hole.sr - p.x) * he; p.y += (hole.y + PX * hole.sr + PY * hole.cr - p.y) * he;
            }
          }
          continue;
        }
        var ax = (hx - p.x) * 2.2 - p.vx * 1.6, ay = (hy - p.y) * 2.2 - p.vy * 1.6;

        // Button gravity: dots near the hovered button are taken up into an ellipse round it.
        if (grav.btn) {
          var bx = p.x - grav.cx, by = p.y - grav.cy;
          if (!p.bo && bx * bx + by * by < 200 * 200 && p.ph / TAU < grav.e * 0.25) {
            p.bo = true; p.ba = Math.atan2(by / grav.ry, bx / grav.rx);
          }
          if (p.bo) {
            var oa = p.ba + clock * p.bw, ok = 1 + p.bk;
            var gtx = grav.cx + Math.cos(oa) * grav.rx * ok, gty = grav.cy + Math.sin(oa) * grav.ry * ok;
            ax = ax * (1 - gb) + ((gtx - p.x) * 8 - p.vx * 2.4) * gb;
            ay = ay * (1 - gb) + ((gty - p.y) * 8 - p.vy * 2.4) * gb;
          }
        }
        if (ptr.on && !p.bo && !hole) {
          // The pointer's wake: nearby dots are carried along with it, and step aside.
          var dx = p.x - ptr.x, dy = p.y - ptr.y, d2 = dx * dx + dy * dy, reach = 150 * S;
          if (d2 < reach * reach) {
            var f = 1 - Math.sqrt(d2) / reach;
            ax += ptr.vx * f * 2.2 + dx * f * 5; ay += ptr.vy * f * 2.2 + dy * f * 5;
          }
        }
        for (var j = 0; j < comets.length; j++) {
          c = comets[j];
          var cx = p.x - c.x, cy = p.y - c.y, c2 = cx * cx + cy * cy, cr = 90 * S;
          if (c2 < cr * cr) { var cf = 1 - Math.sqrt(c2) / cr; ax += c.vx * cf * 5; ay += c.vy * cf * 5; }
        }
        if (game && game.ball) {                 // the ball drags the field like a comet
          var bl = game.ball, lx = p.x - bl.x, ly = p.y - bl.y, l2 = lx * lx + ly * ly, lr = 90 * S;
          if (l2 < lr * lr) { var lf = 1 - Math.sqrt(l2) / lr; ax += bl.vx * lf * 5; ay += bl.vy * lf * 5; }
        }
        if (planet) {
          var qx = p.x - planet.x, qy = p.y - planet.y, qd = Math.sqrt(qx * qx + qy * qy) || 1;
          if (qd < reachP) {
            var qf = (1 - qd / reachP) * grow * fade, inward = qd < 125 * S ? -260 : 150;
            ax += (-qy / qd * planet.dir * 330 - qx / qd * inward) * qf;
            ay += (qx / qd * planet.dir * 330 - qy / qd * inward) * qf;
          }
        }
        if (hole && !p.bo) {
          var wx = p.x - hole.x, wy = p.y - hole.y, wd = Math.sqrt(wx * wx + wy * wy) || 1;
          if (wd < hole.reach) {
            // Along the disc and across it (wl, wn), and how hard it is held (wf).
            var wl = wx * hole.cr + wy * hole.sr, wn = -wx * hole.sr + wy * hole.cr;
            var wf = Math.pow(1 - wd / hole.reach, 1.4) * hole.pull, grip = Math.min(1, wf * 1.5);
            // It lets go of its place, is pulled in and swirled, and pressed into the disc's plane.
            ax -= (hx - p.x) * 2.2 * grip; ay -= (hy - p.y) * 2.2 * grip;
            ax += (-wx / wd * 720 - wy / wd * 400) * wf + wn * hole.sr * 5 * wf;
            ay += (-wy / wd * 720 + wx / wd * 200) * wf - wn * hole.cr * 5 * wf;
            var we = Math.sqrt(wl * wl + wn * wn / (hole.DT * hole.DT));
            if (wd < hole.rd * 1.25) { p.hk = 2; hole.eaten++; p.x = hole.x; p.y = hole.y; p.vx = 0; p.vy = 0; continue; }
            if (hole.un > 0.25 && we < hole.rd * hole.DR) {
              p.hk = 1; p.hr = Math.max(we, hole.rd * 1.7); p.hth = Math.atan2(wn / hole.DT, wl);
              continue;
            }
            if (wf > 0.1) streaks.push(p.x, p.y, p.vx, p.vy, wf);
          }
        }
        p.vx += ax * dt; p.vy += ay * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      }
      if (bangOn && bangT >= bangEnd) bangOn = false;
      // The eruption fades in over its first moments so its origin is not a white blob.
      if (bangOn && bangT < 0.08) ctx.globalAlpha = bangT / 0.08;
      ctx.beginPath();
      ctx.fillStyle = 'rgba(' + col.dot + ',0.7)';
      for (i = 0; i < P.length; i++) { p = P[i]; if (!p.accent && !p.bh && !p.hk && p.depth >= 0.65) dot(ctx, p.x, p.y, p.r * (1 + 0.25 * Math.sin(clock * 1.4 + p.ph * 3))); }
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = 'rgba(' + col.dot + ',0.38)';
      for (i = 0; i < P.length; i++) { p = P[i]; if (!p.accent && !p.bh && !p.hk && p.depth < 0.65) dot(ctx, p.x, p.y, p.r); }
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = 'rgba(' + col.accent + ',0.8)';
      for (i = 0; i < P.length; i++) { p = P[i]; if (p.accent && !p.bh && !p.hk) dot(ctx, p.x, p.y, p.r * (1 + 0.3 * Math.sin(clock * 1.1 + p.ph * 2))); }
      ctx.fill();
      ctx.globalAlpha = 1;

      /* dots on their way into the hole are drawn out into warm streaks */
      if (streaks.length) {
        ctx.lineCap = 'round'; ctx.lineWidth = 1;
        for (i = 0; i < streaks.length; i += 5) {
          ctx.strokeStyle = rgba(AMBER, Math.min(0.6, streaks[i + 4] * 0.7));
          ctx.beginPath(); ctx.moveTo(streaks[i], streaks[i + 1]);
          ctx.lineTo(streaks[i] - streaks[i + 2] * 0.07, streaks[i + 1] - streaks[i + 3] * 0.07); ctx.stroke();
        }
      }

      /* the black hole (after Gargantua), built in depth like the planet is:
         a dark shadow, and a disc of dots in a tilted plane that slowly tips
         and rolls. Dots on the near side are larger and cross in front of the
         shadow; dots on the far side are bent round it (holeProj) into an arc
         over the top. The side turning towards us is brighter. A soft glow
         sits under the dots, a halo and a thin photon ring hug the shadow.
         It forms in stages: a dark point with its ring, then the disc unfurls
         outward, then the halo and the bloom come up. Dots it captures from
         the field join the disc and wind down into it. */
      if (hole) {
        var hc = hole.charge, ht = hole.t, rd = hole.rd, unfurl = hole.un, DR = hole.DR, DT = hole.DT;
        var haloA = smooth(0.15, 0.7, hc), bloomA = smooth(0.35, 1, hc), big = rd * DR * 1.6;
        var lum = (0.45 + 0.55 * hc) * (0.94 + 0.06 * Math.sin(ht * 7.1) * Math.sin(ht * 3.3));
        var dotK = 0.7 + 0.3 * S, hotS = 'rgb(' + HOT + ')', amberS = 'rgb(' + AMBER + ')';
        hole.spin += (0.8 + 2.4 * hc) * dt;
        // The glow under the dots: half of the disc's ellipse, behind or in front.
        var discPass = function (front) {
          ctx.save();
          ctx.beginPath(); ctx.rect(-big, front ? 0 : -big, big * 2, big); ctx.clip();
          // Brighter on the side turning towards us, with a slow shimmer.
          var sh = 0.04 * Math.sin(hole.spin);
          var gx = ctx.createLinearGradient(-rd * DR, 0, rd * DR, 0);
          gx.addColorStop(0, rgba(AMBER, 0));
          gx.addColorStop(0.16, rgba(AMBER, 0.4 * lum));
          gx.addColorStop(0.34 + sh, rgba(HOT, 0.8 * lum));
          gx.addColorStop(0.52 + sh, rgba(HOT, 0.45 * lum));
          gx.addColorStop(0.74, rgba(AMBER, 0.2 * lum));
          gx.addColorStop(1, rgba(AMBER, 0));
          ctx.fillStyle = gx;
          // Nested bands, brightest towards the inner edge.
          [[DR, 1.9, 0.22], [1.6 + (DR - 1.6) * 0.6, 1.7, 0.3], [1.6 + (DR - 1.6) * 0.3, 1.6, 0.38]].forEach(function (b) {
            ctx.globalAlpha = b[2];
            ctx.beginPath();
            ctx.ellipse(0, 0, rd * b[0], rd * b[0] * DT, 0, 0, TAU);
            ctx.ellipse(0, 0, rd * b[1], rd * b[1] * DT, 0, 0, TAU);
            ctx.fill('evenodd');
          });
          ctx.restore();
        };
        // One dot of the disc, if it is on the side being drawn.
        var discDot = function (front, r, th, s, a) {
          holeProj(r, th);
          if ((PZ >= 0) !== front) return;
          ctx.globalAlpha = Math.min(1, a * lum * (0.62 - 0.38 * Math.cos(th)) * 1.25);
          ctx.fillStyle = r < rd * 2.7 ? hotS : amberS;
          ctx.beginPath(); ctx.arc(PX, PY, s * (1 + 0.45 * PZ) * dotK, 0, TAU); ctx.fill();
        };
        // Its own dots, then the ones it took from the field. Inner rings turn faster.
        var discDots = function (front) {
          var q, d0, rr;
          for (q = 0; q < hole.disc.length; q++) {
            d0 = hole.disc[q];
            rr = rd * (1.6 + (DR - 1.6) * d0.f);
            if (!front) d0.th += dt * 2.6 * Math.pow(rd * 2 / rr, 1.5);
            if (unfurl > d0.f * 0.9) discDot(front, rr, d0.th, d0.s, clamp((unfurl - d0.f * 0.9) * 5, 0, 1));
          }
          for (q = 0; q < P.length; q++) if (P[q].hk === 1) discDot(front, P[q].hr, P[q].hth, P[q].r, 1);
          ctx.globalAlpha = 1;
        };
        ctx.save();
        ctx.translate(hole.x, hole.y); ctx.rotate(hole.roll);
        ctx.globalCompositeOperation = 'lighter';
        // Bloom round the whole thing, and a long flat glow along the disc plane.
        if (bloomA > 0) {
          var bl = ctx.createRadialGradient(0, 0, rd * 0.9, 0, 0, rd * 3.6);
          bl.addColorStop(0, rgba(HOT, 0.14 * lum * bloomA));
          bl.addColorStop(0.4, rgba(AMBER, 0.07 * lum * bloomA));
          bl.addColorStop(1, rgba(AMBER, 0));
          ctx.fillStyle = bl;
          ctx.beginPath(); ctx.arc(0, 0, rd * 3.6, 0, TAU); ctx.fill();
        }
        ctx.save();
        ctx.scale(1, 0.06);
        var pg = ctx.createRadialGradient(0, 0, 0, 0, 0, rd * DR * 1.4);
        pg.addColorStop(0, rgba(HOT, 0.4 * lum * unfurl));
        pg.addColorStop(1, rgba(AMBER, 0));
        ctx.fillStyle = pg;
        ctx.beginPath(); ctx.arc(0, 0, rd * DR * 1.4, 0, TAU); ctx.fill();
        ctx.restore();
        discPass(false);
        // The far side's light, bent round: a halo hugging the shadow, stronger over the top.
        if (haloA > 0) {
          var lg = ctx.createRadialGradient(0, 0, rd, 0, 0, rd * 2.2);
          lg.addColorStop(0, rgba(HOT, 0.7 * lum * haloA));
          lg.addColorStop(0.12, rgba(HOT, 0.42 * lum * haloA));
          lg.addColorStop(0.3, rgba(AMBER, 0.22 * lum * haloA));
          lg.addColorStop(0.6, rgba(AMBER, 0.08 * lum * haloA));
          lg.addColorStop(1, rgba(AMBER, 0));
          ctx.fillStyle = lg;
          ctx.beginPath(); ctx.arc(0, 0, rd * 2.2, 0, TAU); ctx.fill();
          ctx.globalAlpha = 0.4;
          ctx.beginPath(); ctx.arc(0, 0, rd * 2.2, Math.PI, TAU); ctx.fill();
          ctx.globalAlpha = 1;
        }
        discDots(false);
        // The shadow.
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = rgba(col.ink, 0.98);
        ctx.beginPath(); ctx.arc(0, 0, rd, 0, TAU); ctx.fill();
        ctx.globalCompositeOperation = 'lighter';
        // The photon ring, there from the first moment, brighter on the approaching side.
        var pr = ctx.createLinearGradient(-rd, 0, rd, 0);
        pr.addColorStop(0, rgba(HOT, 0.95 * lum)); pr.addColorStop(1, rgba(AMBER, 0.45 * lum));
        ctx.lineWidth = 1.1 * S + 0.4;
        ctx.strokeStyle = pr;
        ctx.beginPath(); ctx.arc(0, 0, rd * 1.02, 0, TAU); ctx.stroke();
        discPass(true);
        discDots(true);
        ctx.restore();

        // Near the top or bottom of the field the hole would be cut off in a
        // straight line where the canvas ends. Fade that edge out under it
        // instead, more the further it hangs over.
        var ext = rd * 2.6, fadeH = Math.min(H * 0.25, Math.max(64 * S, Math.min(rd * 1.3, 110 * S))), fx0 = hole.x - big * 1.2, fw = big * 2.4;
        var overB = clamp((hole.y + ext - (H - fadeH)) / fadeH, 0, 1), overT = clamp((fadeH - (hole.y - ext)) / fadeH, 0, 1), fg;
        if (overB > 0 || overT > 0) {
          ctx.save();
          ctx.globalCompositeOperation = 'destination-out';
          if (overB > 0) {
            fg = ctx.createLinearGradient(0, H - fadeH, 0, H);
            fg.addColorStop(0, 'rgba(0,0,0,0)'); fg.addColorStop(0.9, rgba('0,0,0', overB)); fg.addColorStop(1, rgba('0,0,0', overB));
            ctx.fillStyle = fg; ctx.fillRect(fx0, H - fadeH, fw, fadeH);
          }
          if (overT > 0) {
            fg = ctx.createLinearGradient(0, fadeH, 0, 0);
            fg.addColorStop(0, 'rgba(0,0,0,0)'); fg.addColorStop(0.9, rgba('0,0,0', overT)); fg.addColorStop(1, rgba('0,0,0', overT));
            ctx.fillStyle = fg; ctx.fillRect(fx0, 0, fw, fadeH);
          }
          ctx.restore();
        }

        // A quiet line under it says what letting go will get you: a rally,
        // then a warning, then (past SWARM_S) the swarm. Small, dim, easy to miss.
        if (wantRally) {
          var capAt = ht >= SWARM_S ? SWARM_S : ht >= SWARM_S - 1.8 ? SWARM_S - 1.8 : 0.7;
          var capK = ht >= SWARM_S ? 'c' : ht >= SWARM_S - 1.8 ? 'b' : 'a';
          var capA = 0.4 * clamp((ht - capAt) / 0.5, 0, 1) * (capK === 'c' ? 1 : clamp((capK === 'a' ? SWARM_S - 1.8 - ht : SWARM_S - ht) / 0.3, 0, 1));
          if (capA > 0.01) {
            var capY = hole.y + rd * 2.3 + 22;
            if (capY > H - 14) capY = hole.y - rd * 2.3 - 14;
            setReadout();
            ctx.font = '500 ' + Math.max(10, Math.round(11 * roU)) + 'px ' + MONO;
            ctx.textAlign = 'center';
            ctx.fillStyle = rgba(capK === 'c' ? AMBER : col.dot, capA);
            ctx.fillText(canvas.getAttribute('data-hole-' + capK) || HOLE_SAYS[capK], clamp(hole.x, 150, W - 150), capY);
            ctx.textAlign = 'start';
          }
        }
      }

      /* the hand's own line while it circles: the first sign that moving draws */
      var nowT = performance.now();
      while (trail.length && nowT - trail[0].t > 1100) trail.shift();
      if (trail.length < 3 || hole) inkT = 0;
      ink += (inkT - ink) * Math.min(1, dt * 8);
      if (ink > 0.02 && trail.length > 2) {
        ctx.lineWidth = 1.2; ctx.lineCap = 'round';
        for (i = 1; i < trail.length; i++) {
          ctx.strokeStyle = rgba(col.accent, 0.6 * ink * i / trail.length);
          ctx.beginPath(); ctx.moveTo(trail[i - 1].x, trail[i - 1].y); ctx.lineTo(trail[i].x, trail[i].y); ctx.stroke();
        }
      }

      /* the planet: far half of the rings, the sphere, near half of the rings */
      if (planet) {
        var ct = Math.cos(planet.tilt), st = Math.sin(planet.tilt), R = 58 * S * grow * (0.4 + 0.6 * fade);
        var ring = function (front) {
          // A faint line under each band, so the rings read as rings.
          var open0 = spring(planet.age * 0.8) * (1 + (1 - fade) * 0.9);
          ctx.strokeStyle = 'rgba(' + col.accent + ',' + (0.22 * fade).toFixed(3) + ')';
          ctx.lineWidth = 1;
          [125, 207].forEach(function (rr0) {
            ctx.beginPath();
            ctx.ellipse(planet.x, planet.y, rr0 * S * open0, rr0 * S * open0 * 0.34, planet.tilt, front ? 0 : Math.PI, front ? Math.PI : TAU);
            ctx.stroke();
          });
          for (var a2 = 0; a2 < 2; a2++) {
            ctx.beginPath();
            ctx.fillStyle = 'rgba(' + (a2 ? col.accent : col.dot) + ',' + (0.85 * fade).toFixed(3) + ')';
            for (var q = 0; q < planet.rings.length; q++) {
              var g = planet.rings[q];
              if (!!g.accent !== !!a2) continue;
              var sn = Math.sin(g.th);
              if ((sn > 0) !== front) continue;
              var open = spring((planet.age - g.late) * 0.8), rr = g.r * open * (1 + (1 - fade) * 0.9);
              var ex = Math.cos(g.th) * rr, ey = sn * rr * 0.34;
              dot(ctx, planet.x + ex * ct - ey * st, planet.y + ex * st + ey * ct, g.size * (0.75 + 0.35 * sn));
            }
            ctx.fill();
          }
        };
        for (i = 0; i < planet.rings.length; i++) {
          var gr = planet.rings[i];
          gr.th += planet.dir * dt * 190 * S / Math.pow(gr.r / S, 0.95) * (0.5 + 0.5 * fade + (1 - grow));
        }
        // The constellation's lines, in the order drawn. They go down first, so
        // the sphere and the rings pass in front of them. Each line runs out to
        // its body as the body appears.
        var brot = bodyRot(planet), spread = 1 + (1 - fade) * 0.5, prevB = null;
        ctx.lineWidth = 1; ctx.lineCap = 'round';
        ctx.strokeStyle = rgba(col.accent, 0.5 * fade);
        ctx.beginPath();
        for (i = 0; i < planet.bodies.length; i++) {
          var bd = planet.bodies[i];
          bd.age += dt;
          if (bd.age <= 0) continue;
          bd.x = planet.x + Math.cos(bd.a + brot) * bd.r * spread; bd.y = planet.y + Math.sin(bd.a + brot) * bd.r * spread;
          if (prevB) {
            var lp = clamp(bd.age / 0.25, 0, 1);
            ctx.moveTo(prevB.x, prevB.y); ctx.lineTo(lerp(prevB.x, bd.x, lp), lerp(prevB.y, bd.y, lp));
          }
          prevB = bd;
        }
        ctx.stroke();
        ring(false);
        if (R > 1) {
          ctx.fillStyle = 'rgba(' + col.ink + ',' + (0.92 * fade).toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(planet.x, planet.y, R * 0.96, 0, TAU); ctx.fill();
          var halo = ctx.createRadialGradient(planet.x, planet.y, R * 0.6, planet.x, planet.y, R * 2.3);
          halo.addColorStop(0, 'rgba(' + col.accent + ',' + (0.22 * fade).toFixed(3) + ')');
          halo.addColorStop(1, 'rgba(' + col.accent + ',0)');
          ctx.fillStyle = halo;
          ctx.beginPath(); ctx.arc(planet.x, planet.y, R * 2.3, 0, TAU); ctx.fill();
          ctx.beginPath();
          ctx.fillStyle = 'rgba(' + col.dot + ',' + (0.95 * fade).toFixed(3) + ')';
          var rot = planet.age * 1.3 * planet.dir;
          for (i = 0; i < planet.core.length; i++) {
            var k = planet.core[i], zx = Math.cos(k.ph + rot) * k.rr, zz = Math.sin(k.ph + rot) * k.rr;
            if (zz < -0.15) continue;
            var sx = zx * R, sy = k.y * R;
            dot(ctx, planet.x + sx * ct - sy * st, planet.y + sx * st + sy * ct, (0.8 + 1.3 * (zz + 0.15)) * S + 0.4);
          }
          ctx.fill();
        }
        ring(true);
        for (i = 0; i < planet.bodies.length; i++) if (planet.bodies[i].age > 0) drawBody(planet.bodies[i], fade);

        /* moons: caught comets, circling in the plane of the rings with a short trail */
        for (i = 0; i < moons.length; i++) {
          var m = moons[i];
          m.th += m.w * dt; m.r += (m.rt - m.r) * Math.min(1, dt * 1.5);
          var mex = Math.cos(m.th) * m.r, mey = Math.sin(m.th) * m.r * 0.34;
          var mx = planet.x + mex * ct - mey * st, my = planet.y + mex * st + mey * ct;
          m.tr.push(mx, my); if (m.tr.length > 28) m.tr.splice(0, 2);
          var hidden = Math.sin(m.th) < 0 && Math.sqrt((mx - planet.x) * (mx - planet.x) + (my - planet.y) * (my - planet.y)) < R;
          if (hidden) continue;
          ctx.lineCap = 'round'; ctx.lineWidth = 1.6 * S + 0.4;
          for (var t2 = 2; t2 < m.tr.length; t2 += 2) {
            ctx.strokeStyle = 'rgba(' + col.accent + ',' + (0.55 * fade * t2 / m.tr.length).toFixed(3) + ')';
            ctx.beginPath(); ctx.moveTo(m.tr[t2 - 2], m.tr[t2 - 1]); ctx.lineTo(m.tr[t2], m.tr[t2 + 1]); ctx.stroke();
          }
          ctx.fillStyle = 'rgba(' + col.dot + ',' + (0.95 * fade).toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(mx, my, 2.4 * S + 0.8, 0, TAU); ctx.fill();
        }
      }

      /* debris from a shattered planet, and shockwaves */
      for (i = debris.length - 1; i >= 0; i--) {
        var db = debris[i];
        db.age += dt;
        if (db.age >= db.life) { debris.splice(i, 1); continue; }
        var da = (1 - db.age / db.life), damp = Math.exp(-dt * 2.2);
        for (var a3 = 0; a3 < 2; a3++) {
          ctx.beginPath();
          ctx.fillStyle = 'rgba(' + (a3 ? col.accent : col.dot) + ',' + (0.9 * da * da).toFixed(3) + ')';
          for (var q2 = 0; q2 < db.d.length; q2++) {
            var b = db.d[q2];
            if (a3 === 0) { b.vx *= damp; b.vy *= damp; b.x += b.vx * dt; b.y += b.vy * dt; }
            if (!!b.accent === !!a3) dot(ctx, b.x, b.y, b.r * (0.4 + 0.6 * da));
          }
          ctx.fill();
        }
      }
      for (i = shocks.length - 1; i >= 0; i--) {
        var sh = shocks[i];
        sh.age += dt;
        if (sh.age >= sh.life) { shocks.splice(i, 1); continue; }
        var sp0 = sh.age / sh.life, sr = sh.max * (1 - Math.pow(1 - sp0, 3)), sal = (1 - sp0) * (0.35 + 0.5 * sh.power);
        ctx.strokeStyle = 'rgba(' + col.accent + ',' + sal.toFixed(3) + ')';
        ctx.lineWidth = 1 + 1.6 * sh.power * (1 - sp0);
        var sf = sh.flat || 1;
        ctx.beginPath(); ctx.ellipse(sh.x, sh.y, sr, sr * sf, 0, 0, TAU); ctx.stroke();
        ctx.strokeStyle = 'rgba(' + col.dot + ',' + (sal * 0.5).toFixed(3) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(sh.x, sh.y, sr * 0.82, sr * 0.82 * sf, 0, 0, TAU); ctx.stroke();
      }

      /* two bodies round the hovered button, on opposite sides of a faint track */
      if (grav.e > 0.01 && grav.rx) {
        ctx.strokeStyle = 'rgba(' + col.accent + ',' + (0.16 * grav.e).toFixed(3) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(grav.cx, grav.cy, grav.rx, grav.ry, 0, 0, TAU); ctx.stroke();
        var oa2 = 0.9 + clock * 0.7, tc = topCtx() || ctx;
        clearTop(); tc.setTransform(K, 0, 0, K, 0, 0); topDirty = true;
        for (i = 0; i < 2; i++) {
          var orc = i ? col.dot : col.accent, orr = (i ? 3 : 3.6) * (0.8 + 0.2 * S);
          var ox2 = grav.cx + Math.cos(oa2 + i * Math.PI) * grav.rx, oy2 = grav.cy + Math.sin(oa2 + i * Math.PI) * grav.ry;
          var og = tc.createRadialGradient(ox2, oy2, 0, ox2, oy2, orr * 4);
          og.addColorStop(0, rgba(orc, 0.45 * grav.e)); og.addColorStop(1, rgba(orc, 0));
          tc.fillStyle = og; tc.beginPath(); tc.arc(ox2, oy2, orr * 4, 0, TAU); tc.fill();
          tc.fillStyle = rgba(orc, 0.95 * grav.e); tc.beginPath(); tc.arc(ox2, oy2, orr, 0, TAU); tc.fill();
        }
      } else clearTop();

      /* sparks, then the comets themselves */
      for (i = sparks.length - 1; i >= 0; i--) {
        var s = sparks[i];
        s.age += dt;
        if (s.age >= s.life) { sparks.splice(i, 1); continue; }
        s.vx *= Math.exp(-dt * 2.2); s.vy *= Math.exp(-dt * 2.2);
        s.x += s.vx * dt; s.y += s.vy * dt;
        var sa2 = 1 - s.age / s.life;
        ctx.fillStyle = 'rgba(' + (i % 3 ? col.dot : col.accent) + ',' + (sa2 * 0.9).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r * (0.5 + sa2), 0, TAU); ctx.fill();
      }
      for (i = 0; i < comets.length; i++) {
        c = comets[i];
        var sp = Math.sqrt(c.vx * c.vx + c.vy * c.vy) || 1, L = Math.min(260 * S, sp * 0.17), ux = c.vx / sp, uy = c.vy / sp;
        var tail = ctx.createLinearGradient(c.x, c.y, c.x - ux * L, c.y - uy * L);
        tail.addColorStop(0, 'rgba(' + col.dot + ',0.9)');
        tail.addColorStop(0.35, 'rgba(' + col.accent + ',0.45)');
        tail.addColorStop(1, 'rgba(' + col.accent + ',0)');
        ctx.strokeStyle = tail; ctx.lineWidth = 2.2 * S + 0.6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.x - ux * L, c.y - uy * L); ctx.stroke();
        var glow = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, 30 * S);
        glow.addColorStop(0, 'rgba(' + col.accent + ',0.55)');
        glow.addColorStop(1, 'rgba(' + col.accent + ',0)');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(c.x, c.y, 30 * S, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgb(' + col.dot + ')';
        ctx.beginPath(); ctx.arc(c.x, c.y, 2.6 * S + 0.6, 0, TAU); ctx.fill();
      }

      if (game) drawGame();
      if (game) drawRally(game, 'data-rally-label', 'RALLY', 'data-rally-hint', 'MOVE TO RETURN');
      if (inv) drawSwarm();
      if (inv) drawRally(inv, 'data-swarm-label', 'SCORE', 'data-swarm-hint', 'MOVE AND CLICK TO SHOOT');
    }
    function frame(now) {
      raf = 0;
      if (!live || !W) return;
      var dt = last ? Math.min(0.034, (now - last) / 1000) : 0.016;
      last = now; clock += dt;
      draw(dt);
      wake();
    }
    function wake() {
      if (raf || !live || calm || !onScreen || document.hidden) return;
      raf = requestAnimationFrame(frame);
    }

    /* ---------- wiring ---------- */
    function clearAll() {
      cancelPending(); abortHole(); releaseGrav(); grav.e = 0; clearTop();
      comets.length = 0; sparks.length = 0; moons.length = 0; debris.length = 0; shocks.length = 0;
      planet = null; trail.length = 0;
      quitGame();
      bangOn = false;      // a cancelled eruption leaves the dots at home
      for (var i = 0; i < P.length; i++) {
        if (P[i].bf) { P[i].bf = false; P[i].bh = false; P[i].x = P[i].hx; P[i].y = P[i].hy; P[i].vx = 0; P[i].vy = 0; }
      }
    }
    function goLive() {
      if (live) return;
      live = true;
      colours(); resize();
      canvas.classList.add('is-live');
      if (calm) draw(0);
      last = 0; wake();
    }
    // Live, with every dot starting at one screen point and flying out to its place.
    function bang(clientX, clientY) {
      goLive();
      if (calm) return;
      if (!W) resize();
      if (!W || !P.length) return;
      var r = canvas.getBoundingClientRect(), ox = clientX - r.left, oy = clientY - r.top, end = 0, i, p;
      for (i = 0; i < P.length; i++) {
        p = P[i];
        var dx = p.hx - ox, dy = p.hy - oy, d = Math.sqrt(dx * dx + dy * dy) || 1, bow = (Math.random() * 2 - 1) * 0.14 * d;
        p.bf = true; p.bh = true; p.bx = ox; p.by = oy;
        p.bnx = -dy / d * bow; p.bny = dx / d * bow;                       // sideways, so paths are not straight
        p.bdu = 0.9 + Math.random() * 0.5;
        p.bdl = (1 - p.depth) * 0.12 + Math.random() * 0.13;               // shallow dots leave a little later
        p.x = ox; p.y = oy; p.vx = 0; p.vy = 0;
        end = Math.max(end, p.bdl + p.bdu);
      }
      bangOn = true; bangT = 0; bangEnd = end;
      shocks.push({ x: ox, y: oy, age: 0, life: 1.3, max: Math.max(W, H) * 0.9, power: 0.7 });   // no velocity kick
      last = 0; wake();
    }
    function hide() {
      live = false;
      cancelAnimationFrame(raf); raf = 0;
      canvas.classList.remove('is-live');
      clearAll();
    }
    // The site's motion setting or the system's changed.
    function setMotion() {
      var c = reduced();
      if (c === calm) return;
      calm = c;
      if (calm) {
        cancelAnimationFrame(raf); raf = 0;
        clearAll();
        if (live) draw(0);
      } else {
        updateGrav(); last = 0; wake();
      }
    }
    function retheme() { colours(); if (calm && live) draw(0); }

    if (window.ResizeObserver) new ResizeObserver(function () { resize(); wake(); }).observe(canvas);
    else window.addEventListener('resize', function () { resize(); wake(); });
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (es) {
        onScreen = es[es.length - 1].isIntersecting; last = 0;
        if (!onScreen && (game || inv)) quitGame();
        if (onScreen && auto) goLive();
        wake();
      }).observe(canvas);   // the canvas, not the root: the page field's root is all of main
    } else if (auto) goLive();
    document.addEventListener('visibilitychange', function () { last = 0; wake(); });
    if (wantRally || wantFace) window.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && playing()) quitGame(); });
    // The swarm game from the keyboard: arrows move, Space shoots.
    if (wantRally) {
      var swarmKey = function (ev, down) {
        if (!inv || inv.over) return;
        if (ev.key === 'ArrowLeft') inv.key = down ? -1 : inv.key < 0 ? 0 : inv.key;
        else if (ev.key === 'ArrowRight') inv.key = down ? 1 : inv.key > 0 ? 0 : inv.key;
        else if (ev.key === ' ') inv.fire = down;
        else return;
        ev.preventDefault();
      };
      window.addEventListener('keydown', function (ev) { swarmKey(ev, true); });
      window.addEventListener('keyup', function (ev) { swarmKey(ev, false); });
    }

    return { live: goLive, bang: bang, hide: hide, comet: throwComet, planet: spinPlanet, auto: auto, setMotion: setMotion, retheme: retheme };
  }

  for (var n = 0; n < canvases.length; n++) {
    if (!canvases[n].getContext) continue;
    var inst = Space(canvases[n]);
    instances.push(inst);
    if (!inst.auto && !heroInst) heroInst = inst;
  }

  // One set of listeners for every instance.
  function motionChanged() { for (var i = 0; i < instances.length; i++) instances[i].setMotion(); }
  if (mq) { if (mq.addEventListener) mq.addEventListener('change', motionChanged); else if (mq.addListener) mq.addListener(motionChanged); }
  document.addEventListener('jj:motionchange', motionChanged);
  if (window.MutationObserver) {
    new MutationObserver(function () { for (var i = 0; i < instances.length; i++) instances[i].retheme(); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

  // The hero's hooks (the intro script calls these). No-ops on pages without a hero field.
  window.HeroSpace = {
    live: function () { if (heroInst) heroInst.live(); },
    bang: function (x, y) { if (heroInst) heroInst.bang(x, y); },
    hide: function () { if (heroInst) heroInst.hide(); },
    comet: function (x, y, dx, dy, speed) { if (heroInst) heroInst.comet(x, y, dx, dy, speed); },
    planet: function (x, y, dir) { if (heroInst) heroInst.planet(x, y, dir); }
  };
})();
