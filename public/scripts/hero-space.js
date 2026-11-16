/* Particle field, with gestures. One instance per canvas[data-hero-space].
   A loose field of dots fills its area behind the content. They drift, lean
   away from the pointer and get dragged along in its wake.
     Flick   a fast, straight push of the pointer throws a comet that way. It
             sheds sparks, drags the field along, bends around a planet, and
             scatters and lights the portrait if it crosses it (HeroFace.push).
     Circle  fast circles spin up a planet where you circled: a dotted sphere
             with tilted rings, and a pull on the field around it. It lasts a
             few seconds, longer while you keep circling, then lets go.
     Comet + planet   a comet that grazes the rings is caught as a moon (three
             at most). One that hits the sphere shatters the planet.
     Hold    press and hold (mouse or pen, not touch) for a black hole that
             pulls the field in while it charges. Letting go sends out a
             shockwave and throws the field outward.
     Buttons while a .btn is hovered or focused, nearby dots and a few accent
             orbiters circle it; on leave they are let go.
   And a small PARTS read-out in the bottom-left corner on instances that ask.

   Markup:  canvas.hero-space[data-hero-space]. Its root is the closest
            [data-space-root], else the closest .hero, else the parent. The
            page field at the top of the inner pages (Base.astro) sits behind
            the content, so its root is main.
   Attributes on the canvas:
     data-space-auto     go live by itself when scrolled into view. Without it
                         the instance is the hero's and waits for
                         HeroSpace.live(), which hero-cut.js calls
     data-space-counter  draw the PARTS read-out (label from data-label)
     data-space-face     talk to window.HeroFace (push, attract, burst, count)
   Colours from CSS custom properties on the canvas:
     --space-dot, --space-accent, --space-ink (the page behind, hides the far ring)
   hero-cut.js calls HeroSpace.live() when the intro ends and HeroSpace.hide()
   when it replays; both, comet() and planet() act on the hero instance.
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
  function dot(ctx, x, y, r) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); }

  // Where a press must not start a black hole, and what counts as a button.
  var NO_HOLE = 'a, button, input, textarea, select, label, kbd, [role=button]';
  var BTN_SEL = 'a.btn, button.btn, .btn, button[type=submit], input[type=submit]';
  var MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  var HOLD_MS = 250, CHARGE_S = 1.6, ORBITERS = 46, MAX_MOONS = 3;

  var instances = [], heroInst = null;

  function Space(canvas) {
    var root = canvas.closest('[data-space-root]') || canvas.closest('.hero') || canvas.parentNode;
    var ctx = canvas.getContext('2d');
    var auto = canvas.hasAttribute('data-space-auto');
    var wantCounter = canvas.hasAttribute('data-space-counter');
    var wantFace = canvas.hasAttribute('data-space-face');

    var W = 0, H = 0, K = 1, S = 1;               // size, pixel ratio, scale against a 1440 wide page
    var col = { dot: '240,237,232', accent: '128,128,240', ink: '28,26,23' };
    var P = [];                                   // the field
    var comets = [], sparks = [], moons = [], debris = [], shocks = [], planet = null;
    var live = false, raf = 0, last = 0, clock = 0, onScreen = true, calm = reduced();
    var ptr = { x: 0, y: 0, vx: 0, vy: 0, on: false, px: 0, py: 0 };
    var trail = [];                               // recent pointer samples: x, y, time
    var cometAt = 0;
    var pending = null, hole = null, holdSel = '';          // black hole: waiting, charging
    var hoverBtn = null, focusBtn = null;                   // button gravity
    var grav = { btn: null, e: 0, cx: 0, cy: 0, rx: 0, ry: 0 };
    var orbiters = [];
    var shown = 0;                                // the counter's eased number

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
          bo: false, ba: 0, bw: 0.4 + rand() * 0.8, bk: rand() * 0.35   // in orbit round a button
        });
        P[i].x = P[i].hx; P[i].y = P[i].hy;
      }
      var r2 = rng(11);
      orbiters = [];
      for (i = 0; i < ORBITERS; i++) orbiters.push({ a0: r2() * TAU, w: (0.7 + r2() * 0.9) * (r2() < 0.8 ? 1 : -1), k: 0.94 + r2() * 0.5, r: 1.3 + r2() * 1.7 });
    }
    function resize() {
      var r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var k = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(3.2e6 / (r.width * r.height)));
      if (r.width === W && r.height === H && k === K) return;
      var first = !W, sx = r.width / (W || 1), sy = r.height / (H || 1);
      W = r.width; H = r.height; K = k; S = clamp(W / 1440, 0.6, 1.15);
      canvas.width = Math.round(W * K); canvas.height = Math.round(H * K);
      if (first) seed();
      else for (var i = 0; i < P.length; i++) { P[i].hx *= sx; P[i].hy *= sy; P[i].x *= sx; P[i].y *= sy; }
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
      planet = { x: x, y: y, dir: dir, age: 0, life: 7, rings: rings, core: core, tilt: -0.32 * dir };
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

      // Circles: more than a turn and a half, in a small area, at speed.
      if (Math.abs(turn) > TAU * 1.5 && path > 520 * S && span < 380 * S) {
        if (!planet || planet.age > planet.life - 0.6) spinPlanet(cx, cy, turn > 0 ? 1 : -1);
        else planet.life = Math.min(planet.life + 0.06, planet.age + 7);
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
      if (calm) return;
      // A press that wanders is a drag or a flick, not a hold.
      if (pending && Math.abs(ev.clientX - pending.cx) + Math.abs(ev.clientY - pending.cy) > 8) cancelPending();
      if (hole) return;
      trail.push({ x: x, y: y, t: now });
      readGesture(now);
    });
    function leave() { ptr.on = false; trail.length = 0; cancelPending(); abortHole(); }
    root.addEventListener('pointerleave', leave);
    root.addEventListener('pointercancel', leave);

    /* ---------- black hole ---------- */
    root.addEventListener('pointerdown', function (ev) {
      if (!live || calm || ev.button !== 0 || ev.pointerType === 'touch') return;
      if (ev.target.closest && ev.target.closest(NO_HOLE)) return;
      var r = canvas.getBoundingClientRect();
      if (ev.clientY < r.top || ev.clientY > r.bottom) return;
      cancelPending();
      pending = { cx: ev.clientX, cy: ev.clientY, timer: setTimeout(startHole, HOLD_MS) };
    });
    window.addEventListener('pointerup', function () {
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
      hole = { x: p.cx - r.left, y: p.cy - r.top, cx: p.cx, cy: p.cy, t: 0, charge: 0 };
      holdSel = root.style.userSelect;
      root.style.userSelect = 'none'; root.style.webkitUserSelect = 'none';
      try { var sel = window.getSelection(); if (sel) sel.removeAllRanges(); } catch (e) {}
      trail.length = 0;
      window.addEventListener('scroll', abortHole, { passive: true });   // the hole is pinned to the screen
      wake();
    }
    function endHole() {
      hole = null;
      root.style.userSelect = holdSel; root.style.webkitUserSelect = holdSel;
      window.removeEventListener('scroll', abortHole);
    }
    function abortHole() { if (hole) endHole(); }
    function releaseHole() {
      var h = hole, c = h.charge, i, p;
      endHole();
      shocks.push({ x: h.x, y: h.y, age: 0, life: 0.9, max: (240 + 420 * c) * S, power: c });
      var reach = (380 + 260 * c) * S;
      for (i = 0; i < P.length; i++) {
        p = P[i];
        var ox = p.x - h.x, oy = p.y - h.y, od = Math.sqrt(ox * ox + oy * oy) || 1;
        if (od < reach) { var f = 1 - od / reach; p.vx += ox / od * (200 + 900 * c) * f; p.vy += oy / od * (200 + 900 * c) * f; }
      }
      for (i = 0; i < 6 + Math.round(26 * c); i++) {
        var a = Math.random() * TAU, v = (120 + Math.random() * 380) * (0.5 + c);
        sparks.push({ x: h.x, y: h.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, age: 0, life: 0.5 + Math.random() * 0.7, r: 0.5 + Math.random() * 1.3 });
      }
      if (wantFace && window.HeroFace && window.HeroFace.burst) window.HeroFace.burst(h.cx, h.cy, 0.6 + c * 1.6);
      wake();
    }

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
      var b = calm || !live ? null : hoverBtn || focusBtn;
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
    function total() {
      var n = P.length + sparks.length + moons.length + Math.round(ORBITERS * grav.e), i;
      if (planet) n += planet.rings.length + planet.core.length;
      for (i = 0; i < debris.length; i++) n += debris[i].d.length;
      if (wantFace && window.HeroFace && window.HeroFace.count) n += window.HeroFace.count() | 0;
      return n;
    }
    // Small mono read-out, like the intro's chip but quiet.
    function drawCounter(dt) {
      if (!wantCounter || W < 700) return;
      var target = total();
      if (calm) shown = target;
      else { shown += (target - shown) * Math.min(1, dt * 5); if (Math.abs(target - shown) < 0.5) shown = target; }
      var u = clamp(W / 1440, 0.75, 1.25), pad = Math.round(Math.max(16, W * 0.03));
      ctx.font = '500 ' + Math.round(11 * u) + 'px ' + MONO;
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = 'rgba(' + col.dot + ',0.45)';
      ctx.fillText((canvas.getAttribute('data-label') || 'PARTS') + '  ' + Math.round(shown), pad, H - pad);
    }
    function draw(dt) {
      var i, p, c;
      ctx.setTransform(K, 0, 0, K, 0, 0);
      ctx.clearRect(0, 0, W, H);

      ptr.vx *= Math.exp(-dt * 6); ptr.vy *= Math.exp(-dt * 6);
      var tx = ptr.on ? ptr.x / W - 0.5 : 0, ty = ptr.on ? ptr.y / H - 0.5 : 0;
      ptr.px += (tx - ptr.px) * Math.min(1, dt * 3); ptr.py += (ty - ptr.py) * Math.min(1, dt * 3);

      if (hole) {
        hole.t += dt; hole.charge = clamp(hole.t / CHARGE_S, 0, 1);
        if (wantFace && window.HeroFace && window.HeroFace.attract) window.HeroFace.attract(hole.cx, hole.cy, hole.charge);
      }
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
        if (wantFace && window.HeroFace && window.HeroFace.push) {
          var hr = canvas.getBoundingClientRect();
          window.HeroFace.push(hr.left + c.x, hr.top + c.y, c.vx * dt * 5, c.vy * dt * 5, 95 * S);
        }
        if (c.age > 6 || c.x < -260 || c.y < -260 || c.x > W + 260 || c.y > H + 260) comets.splice(i, 1);
      }
      if (sparks.length > 400) sparks.splice(0, sparks.length - 400);

      /* the field */
      var reachP = 300 * S, gb = Math.min(1, grav.e * 1.4), holeReach = hole ? (200 + 260 * hole.charge) * S : 0;
      for (i = 0; i < P.length; i++) {
        p = P[i];
        var hx = p.hx + Math.cos(clock * p.sp + p.ph) * p.amp - ptr.px * p.depth * 26;
        var hy = p.hy + Math.sin(clock * p.sp * 0.8 + p.ph) * p.amp - ptr.py * p.depth * 26;
        var ax = (hx - p.x) * 2.2 - p.vx * 1.6, ay = (hy - p.y) * 2.2 - p.vy * 1.6;

        // Button gravity: dots near the hovered button are taken up into an ellipse round it.
        if (grav.btn) {
          var bx = p.x - grav.cx, by = p.y - grav.cy;
          if (!p.bo && bx * bx + by * by < 360 * 360 && p.ph / TAU < grav.e) {
            p.bo = true; p.ba = Math.atan2(by / grav.ry, bx / grav.rx);
          }
          if (p.bo) {
            var oa = p.ba + clock * p.bw, ok = 1 + p.bk;
            var gtx = grav.cx + Math.cos(oa) * grav.rx * ok, gty = grav.cy + Math.sin(oa) * grav.ry * ok;
            ax = ax * (1 - gb) + ((gtx - p.x) * 8 - p.vx * 2.4) * gb;
            ay = ay * (1 - gb) + ((gty - p.y) * 8 - p.vy * 2.4) * gb;
          }
        }
        if (ptr.on && !p.bo) {
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
        if (planet) {
          var qx = p.x - planet.x, qy = p.y - planet.y, qd = Math.sqrt(qx * qx + qy * qy) || 1;
          if (qd < reachP) {
            var qf = (1 - qd / reachP) * grow * fade, inward = qd < 125 * S ? -260 : 150;
            ax += (-qy / qd * planet.dir * 330 - qx / qd * inward) * qf;
            ay += (qx / qd * planet.dir * 330 - qy / qd * inward) * qf;
          }
        }
        if (hole) {
          // Pulled in and swirled, harder the longer it has charged.
          var wx = p.x - hole.x, wy = p.y - hole.y, wd = Math.sqrt(wx * wx + wy * wy) || 1;
          if (wd < holeReach) {
            var wf = (1 - wd / holeReach) * (0.25 + hole.charge * 0.75);
            ax += (-wx / wd * 560 - wy / wd * 420) * wf;
            ay += (-wy / wd * 560 + wx / wd * 420) * wf;
          }
        }
        p.vx += ax * dt; p.vy += ay * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      }
      ctx.beginPath();
      ctx.fillStyle = 'rgba(' + col.dot + ',0.7)';
      for (i = 0; i < P.length; i++) { p = P[i]; if (!p.accent && p.depth >= 0.65) dot(ctx, p.x, p.y, p.r * (1 + 0.25 * Math.sin(clock * 1.4 + p.ph * 3))); }
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = 'rgba(' + col.dot + ',0.38)';
      for (i = 0; i < P.length; i++) { p = P[i]; if (!p.accent && p.depth < 0.65) dot(ctx, p.x, p.y, p.r); }
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = 'rgba(' + col.accent + ',0.8)';
      for (i = 0; i < P.length; i++) { p = P[i]; if (p.accent) dot(ctx, p.x, p.y, p.r * (1 + 0.3 * Math.sin(clock * 1.1 + p.ph * 2))); }
      ctx.fill();

      /* the black hole: a dark disc with a thin accretion ring */
      if (hole) {
        var hc = hole.charge, rd = (4 + 30 * hc) * S, hg = ctx.createRadialGradient(hole.x, hole.y, rd, hole.x, hole.y, rd * 3.4);
        hg.addColorStop(0, 'rgba(' + col.accent + ',' + (0.18 + 0.2 * hc).toFixed(3) + ')');
        hg.addColorStop(1, 'rgba(' + col.accent + ',0)');
        ctx.fillStyle = hg;
        ctx.beginPath(); ctx.arc(hole.x, hole.y, rd * 3.4, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(' + col.ink + ',0.97)';
        ctx.beginPath(); ctx.arc(hole.x, hole.y, rd, 0, TAU); ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(' + col.accent + ',' + (0.5 + 0.4 * hc).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(hole.x, hole.y, rd * 1.25 + 1, 0, TAU); ctx.stroke();
        ctx.lineWidth = 1.8; ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(' + col.dot + ',' + (0.55 + 0.4 * hc).toFixed(3) + ')';
        var sa = clock * (3 + 5 * hc);
        ctx.beginPath(); ctx.arc(hole.x, hole.y, rd * 1.25 + 1, sa, sa + 1.1); ctx.stroke();
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
        ctx.beginPath(); ctx.arc(sh.x, sh.y, sr, 0, TAU); ctx.stroke();
        ctx.strokeStyle = 'rgba(' + col.dot + ',' + (sal * 0.5).toFixed(3) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(sh.x, sh.y, sr * 0.82, 0, TAU); ctx.stroke();
      }

      /* orbiters round the hovered button */
      if (grav.e > 0.01 && grav.rx) {
        // A faint track under them, so the orbit reads at a glance.
        ctx.strokeStyle = 'rgba(' + col.accent + ',' + (0.28 * grav.e).toFixed(3) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(grav.cx, grav.cy, grav.rx * 1.02, grav.ry * 1.02, 0, 0, TAU); ctx.stroke();
        ctx.beginPath();
        ctx.fillStyle = 'rgba(' + col.accent + ',' + (0.9 * grav.e).toFixed(3) + ')';
        for (i = 0; i < orbiters.length; i++) {
          var o = orbiters[i], oa2 = o.a0 + clock * o.w;
          dot(ctx, grav.cx + Math.cos(oa2) * grav.rx * o.k, grav.cy + Math.sin(oa2) * grav.ry * o.k, o.r * (0.8 + 0.2 * S));
        }
        ctx.fill();
      }

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

      drawCounter(dt);
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
      cancelPending(); abortHole(); releaseGrav(); grav.e = 0;
      comets.length = 0; sparks.length = 0; moons.length = 0; debris.length = 0; shocks.length = 0;
      planet = null; trail.length = 0;
    }
    function goLive() {
      if (live) return;
      live = true;
      colours(); resize();
      canvas.classList.add('is-live');
      if (calm) draw(0);
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
        if (onScreen && auto) goLive();
        wake();
      }).observe(canvas);   // the canvas, not the root: the page field's root is all of main
    } else if (auto) goLive();
    document.addEventListener('visibilitychange', function () { last = 0; wake(); });

    return { live: goLive, hide: hide, comet: throwComet, planet: spinPlanet, auto: auto, setMotion: setMotion, retheme: retheme };
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
    hide: function () { if (heroInst) heroInst.hide(); },
    comet: function (x, y, dx, dy, speed) { if (heroInst) heroInst.comet(x, y, dx, dy, speed); },
    planet: function (x, y, dir) { if (heroInst) heroInst.planet(x, y, dir); }
  };
})();
