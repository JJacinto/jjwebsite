/* Contact page: two bodies. João's star (accent) orbits the "Get in touch"
   button; the visitor's star eases toward their pointer. The closer the two
   are, the faster João's star orbits, the clearer the dashed line between
   them and the more particles stream from the visitor's star to João's.
   When any button in the section is hovered (or keyboard-focused), both stars
   move to that button and orbit it together on opposite sides, just outside
   its edge, so neither ends up behind it.
   When a message is actually sent (compose-modal.js fires "jj:message-sent")
   the two spiral in around the button while ripples quicken, then one flash.
   A small read-out under the field shows the separation.

   Markup (src/pages/contact.astro):
     #contact-section canvas.contact-binary   the overlay, above the field
     #compose-open                            the button João's star orbits
     #contact-readout                         the read-out (DOM text, aria-hidden)
   Colours from CSS custom properties on the canvas, like hero-space.js:
     --space-dot (visitor, line, labels), --space-accent (João, rings)
   Reduced motion (the media query or <html data-motion="reduce">), same rule
   as hero-space.js: the bodies are drawn once and stay still, no stream, no
   orbit; a send only changes the read-out text.
   window.ContactBinary.send() plays the send moment (for testing).
   A no-op when the markup is missing. */
(function () {
  'use strict';

  var api = { send: function () {} };
  window.ContactBinary = api;

  var section = document.getElementById('contact-section');
  var cv = section ? section.querySelector('canvas.contact-binary') : null;
  var cta = document.getElementById('compose-open');
  var readout = document.getElementById('contact-readout');
  if (!section || !cv || !cta || !cv.getContext) return;
  var ctx = cv.getContext('2d');
  if (!ctx) return;
  /* The two stars go on a second canvas above the content, so a star passing
     a button is drawn in front of it, never hidden behind it. The line, the
     stream and the ripples stay on the canvas under the content. */
  var cvTop = document.createElement('canvas');
  cvTop.className = 'contact-binary contact-binary--top';
  cvTop.setAttribute('aria-hidden', 'true');
  cv.parentNode.insertBefore(cvTop, cv.nextSibling);
  var ctxBase = ctx, ctxTop = cvTop.getContext('2d') || ctx;

  var TAU = Math.PI * 2;
  var MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  /* Tuning: the approved defaults. */
  var SIZE = 1, GLOW = 1, REACH = 380, SPEED = 1, STREAM = 1, LINE = 1, RIPPLE = 1, FLASH = 1;
  var T_IN = 2.4, T_HOLD = 4.2;

  var mq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  function reduced() {
    return !!(mq && mq.matches) || document.documentElement.getAttribute('data-motion') === 'reduce';
  }
  function isPt() { return !!(window.jjLang && window.jjLang() === 'pt'); }

  var col = { dot: '240,237,232', accent: '128,128,240' };
  var W = 0, H = 0, K = 1;
  var calm = reduced(), onScreen = true, raf = 0, last = 0, started = 0, t0 = 0;
  var ptr = { cx: 0, cy: 0, on: false };         /* client coordinates */
  var v = { x: 0, y: 0, init: false };            /* the visitor's body, eased toward the pointer */
  var theta = 0.9, born = performance.now() - 1000;
  var stream = [], spawnAcc = 0;
  var rings = [];                                 /* { t0, s } ripples from the pair */
  var send = null;                                /* { t0, r0, a0, ph, lastHalf, merged } */
  var pendingSend = false, calmTimer = 0, calmSent = false;
  var mode = 'sep', dist = 0, inspiral = 0;       /* what the read-out says */
  var shownText = '';
  var BTN_SEL = 'a.btn, button.btn, .btn';
  var hoverBtn = null, focusBtn = null, hk = 0;   /* the hovered button, and how far the pair has moved to it */
  var orb = { x: 0, y: 0, rx: 0, ry: 0, init: false };   /* the orbit, eased between buttons */

  /* ---------- helpers ---------- */
  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function ease(x) { x = clamp(x); return x * x * (3 - 2 * x); }
  function rgbOf(s, fb) {
    s = (s || '').trim();
    var m = /^#?([0-9a-f]{6})$/i.exec(s);
    if (m) { var n = parseInt(m[1], 16); return (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255); }
    m = /^#?([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(s);
    if (m) return parseInt(m[1] + m[1], 16) + ',' + parseInt(m[2] + m[2], 16) + ',' + parseInt(m[3] + m[3], 16);
    m = /(\d+)[, ]+(\d+)[, ]+(\d+)/.exec(s);
    return m ? m[1] + ',' + m[2] + ',' + m[3] : fb;
  }
  function colours() {
    var cs = getComputedStyle(cv);
    col.dot = rgbOf(cs.getPropertyValue('--space-dot'), col.dot);
    col.accent = rgbOf(cs.getPropertyValue('--space-accent'), col.accent);
  }
  function dot(x, y, r, a, rgb) {
    if (a <= 0.01) return;
    ctx.fillStyle = 'rgba(' + rgb + ',' + (a > 1 ? 1 : a).toFixed(3) + ')';
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  function glow(x, y, r, a, rgb) {
    if (a <= 0.005) return;
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(' + rgb + ',' + Math.min(1, a).toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  /* A star: a soft halo, a disc, and a small fully opaque core of the same colour. */
  function body(x, y, r, a, rgb, name) {
    if (a <= 0.01) return;
    glow(x, y, r * 7, 0.34 * a * GLOW, rgb);
    glow(x, y, r * 2.6, 0.7 * a * GLOW, rgb);
    dot(x, y, r, 0.8 * a, rgb);
    dot(x, y, r * 0.45, a, rgb);
    if (name) {
      ctx.fillStyle = 'rgba(' + col.dot + ',' + (0.8 * a).toFixed(3) + ')';
      ctx.font = '11px ' + MONO;
      ctx.textAlign = 'center';
      ctx.fillText(name, x, y - r - 12);
    }
  }

  /* ---------- read-out ---------- */
  function au(px) {
    var s = (px / 1000).toFixed(2);
    return isPt() ? s.replace('.', ',') : s;
  }
  function renderReadout() {
    if (!readout) return;
    var pt = isPt(), txt;
    if (mode === 'merged') txt = pt ? 'FUNDIDOS · SINAL ENVIADO' : 'MERGED · SIGNAL SENT';
    else if (mode === 'inspiral') txt = (pt ? 'ESPIRAL ' : 'INSPIRAL ') + au(inspiral) + (pt ? ' UA' : ' AU');
    else txt = (pt ? 'SEPARAÇÃO ' : 'SEPARATION ') + au(dist) + (pt ? ' UA' : ' AU');
    if (txt !== shownText) { shownText = txt; readout.textContent = txt; }
    readout.classList.toggle('is-sent', mode === 'merged');
  }

  /* ---------- sizing ---------- */
  function resize() {
    var r = cv.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    var k = Math.min(window.devicePixelRatio || 1, 2);
    if (r.width === W && r.height === H && k === K) return true;
    W = r.width; H = r.height; K = k;
    cv.width = cvTop.width = Math.round(W * K); cv.height = cvTop.height = Math.round(H * K);
    return true;
  }

  /* ---------- one frame ---------- */
  function frame(now, still) {
    raf = 0;
    if (!resize()) return;
    var dt = still ? 0 : last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    if (!t0) t0 = now;
    var t = calm ? 99 : (now - t0) / 1000;
    ctxTop.setTransform(K, 0, 0, K, 0, 0);
    ctxTop.clearRect(0, 0, W, H);
    ctx.setTransform(K, 0, 0, K, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 1;

    var sr = cv.getBoundingClientRect(), br = cta.getBoundingClientRect();
    var c = { x: br.left - sr.left + br.width / 2, y: br.top - sr.top + br.height / 2 };
    /* the orbit: round the hovered button, else round "Get in touch" */
    var ob = (!send && !calm && (hoverBtn || focusBtn)) || null;
    var obr = ob ? ob.getBoundingClientRect() : br;
    var otx = obr.left - sr.left + obr.width / 2, oty = obr.top - sr.top + obr.height / 2;
    var otrx = obr.width / 2 + 24, otry = obr.height / 2 + 20;
    var oe = orb.init && !calm ? Math.min(1, dt * 6) : 1;
    orb.x += (otx - orb.x) * oe; orb.y += (oty - orb.y) * oe;
    orb.rx += (otrx - orb.rx) * oe; orb.ry += (otry - orb.ry) * oe; orb.init = true;
    hk += ((ob ? 1 : 0) - hk) * (calm ? 1 : Math.min(1, dt * 5));
    var hke = ease(hk);
    function jp(a) { a = a === undefined ? theta : a; return { x: orb.x + orb.rx * Math.cos(a), y: orb.y + orb.ry * Math.sin(a) }; }

    /* where the visitor's body wants to be */
    var tx, ty;
    if (ptr.on && !calm) { tx = ptr.cx - sr.left; ty = ptr.cy - sr.top; }
    else if (calm) { tx = W * 0.22; ty = H * 0.3; }
    else { tx = W * 0.22 + Math.sin(now * 0.00035) * W * 0.07; ty = H * 0.3 + Math.cos(now * 0.00027) * H * 0.06; }
    if (!v.init) { v.x = tx; v.y = ty; v.init = true; }
    if (calm) { v.x = tx; v.y = ty; }
    else { v.x += (tx - v.x) * Math.min(1, dt * 7); v.y += (ty - v.y) * Math.min(1, dt * 7); }

    var d = Math.hypot(v.x - c.x, v.y - c.y);
    var p = clamp(1 - d / REACH);                   /* proximity, 0 far to 1 touching */
    var J, Y, aJ = ease((t - 0.3) / 0.6), aY = ease((t - 0.8) / 0.6) * ease((now - born) / 600);
    var merged = false, flash = 0;

    if (send) {
      var st = (now - send.t0) / 1000, u = clamp(st / T_IN);
      if (st < T_IN) {
        var w = 2.2 + 17 * u * u;
        send.ph += w * dt;
        var half = Math.floor(send.ph / Math.PI);
        if (half !== send.lastHalf) { send.lastHalf = half; rings.push({ t0: now, s: (0.35 + 0.5 * u) * RIPPLE }); }
        var r = send.r0 * Math.pow(1 - u, 0.55), a = send.a0 + send.ph;
        var bx = Math.cos(a) * r / 2, by = Math.sin(a) * r / 2 * 0.72;
        var k = ease(st / 0.35);
        var j0 = jp();
        J = { x: j0.x + (c.x - bx - j0.x) * k, y: j0.y + (c.y - by - j0.y) * k };
        Y = { x: v.x + (c.x + bx - v.x) * k, y: v.y + (c.y + by - v.y) * k };
        mode = 'inspiral'; inspiral = r;
      } else {
        if (!send.merged) {
          send.merged = true;
          rings.push({ t0: now, s: 1.4 * RIPPLE }); rings.push({ t0: now + 260, s: 0.7 * RIPPLE }); rings.push({ t0: now + 560, s: 0.4 * RIPPLE });
        }
        mode = 'merged';
        merged = true;
        flash = 1 - clamp((st - T_IN) / 0.7);
        theta += 0.5 * dt;
        J = jp();
        Y = null;
        if (st > T_IN + T_HOLD) { send = null; born = now; mode = 'sep'; }
      }
    } else {
      if (!calm) theta += ((0.45 + 1.2 * SPEED * p * p) * (1 - hke) + 0.8 * hke) * dt;
      J = jp();
      var wob = (3 + 5 * p) * (1 - hke);
      var Yo = jp(theta + Math.PI);                 /* the visitor's place on the orbit, opposite João */
      var Yf = { x: v.x - wob * Math.cos(theta), y: v.y - wob * Math.sin(theta) };
      Y = { x: Yf.x + (Yo.x - Yf.x) * hke, y: Yf.y + (Yo.y - Yf.y) * hke };
      if (!calmSent) mode = 'sep';
      dist = d;
    }
    renderReadout();

    /* ripples from the button */
    rings = rings.filter(function (g) { return now - g.t0 < 2600; });
    ctx.strokeStyle = 'rgb(' + col.accent + ')';
    for (var q = 0; q < rings.length; q++) {
      var ag = (now - rings[q].t0) / 1000; if (ag < 0) continue;
      ctx.globalAlpha = Math.max(0, Math.min(0.6, 0.45 * rings[q].s) * (1 - ag / 2.6));
      ctx.lineWidth = 1 + rings[q].s * 0.8;
      ctx.beginPath(); ctx.arc(c.x, c.y, ag * 420, 0, TAU); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    /* the line between the two, and the stream across it */
    if (Y) {
      var intro = ease((t - 1.2) / 0.5) * (1 - ease((t - 2.8) / 0.9)) * 0.3;
      var la = Math.min(1, Math.max(intro, 0.14 + 0.22 * p) * LINE) * Math.min(aJ, aY) * (1 - hke);
      ctx.globalAlpha = la; ctx.strokeStyle = 'rgb(' + col.dot + ')'; ctx.lineWidth = 1; ctx.setLineDash([2, 6]);
      ctx.beginPath(); ctx.moveTo(Y.x, Y.y); ctx.lineTo(J.x, J.y); ctx.stroke(); ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      if (!calm && !send && t > 2 && hk < 0.3) {
        spawnAcc += p * p * 14 * STREAM * dt;
        if (spawnAcc > 40) spawnAcc = 40;
        while (spawnAcc > 1 && stream.length < 400) { spawnAcc -= 1; stream.push({ u: 0, dur: 0.8 + Math.random() * 0.7, k: 0.5 + Math.random() }); }
      }
      var mx = (Y.x + J.x) / 2, my = (Y.y + J.y) / 2, sx = J.x - Y.x, sy = J.y - Y.y;
      for (var n = stream.length - 1; n >= 0; n--) {
        var pt = stream[n]; pt.u += dt / pt.dur;
        if (pt.u >= 1) { stream.splice(n, 1); continue; }
        var cx = mx - sy * 0.3 * pt.k, cy = my + sx * 0.3 * pt.k, uu = pt.u, iu = 1 - uu;
        var px = iu * iu * Y.x + 2 * iu * uu * cx + uu * uu * J.x, py = iu * iu * Y.y + 2 * iu * uu * cy + uu * uu * J.y;
        dot(px, py, 1, Math.sin(Math.PI * uu) * 0.6 * (1 - hke), uu < 0.55 ? col.dot : col.accent);
      }
    } else { stream.length = 0; }

    if (flash > 0) glow(c.x, c.y, 120 + 260 * (1 - flash), Math.min(1, 0.75 * flash * FLASH), col.accent);
    var you = isPt() ? 'tu' : 'you';
    ctx = ctxTop;
    body(J.x, J.y, (merged ? 6.5 : 4.5) * SIZE, aJ, col.accent, merged ? '' : 'João');
    if (Y) body(Y.x, Y.y, 3.6 * SIZE, aY, col.dot, send ? '' : you);
    ctx = ctxBase;

    ctx.globalAlpha = 1;
    if (!still) wake();
  }

  /* ---------- loop control ---------- */
  function wake() {
    if (raf || calm || !onScreen || document.hidden) return;
    raf = requestAnimationFrame(function (now) { frame(now, false); });
  }
  /* Reduced motion: the bodies are drawn once, and again when something changes. */
  function drawStill() { if (calm && onScreen) frame(performance.now(), true); }

  /* ---------- the send moment ---------- */
  function startSend() {
    if (send) return;
    if (calm) {
      calmSent = true; mode = 'merged'; renderReadout();
      clearTimeout(calmTimer);
      calmTimer = setTimeout(function () { calmSent = false; mode = 'sep'; renderReadout(); }, 6000);
      return;
    }
    var br = cta.getBoundingClientRect(), sr = cv.getBoundingClientRect();
    var cx = br.left - sr.left + br.width / 2, cy = br.top - sr.top + br.height / 2;
    var d = Math.hypot(v.x - cx, v.y - cy);
    send = { t0: performance.now(), r0: Math.max(150, Math.min(d * 2, 440)), a0: Math.atan2(v.y - cy, v.x - cx), ph: 0, lastHalf: 0, merged: false };
    wake();
  }
  api.send = startSend;

  /* A message went out. If the modal is still covering the page, wait for it to close. */
  document.addEventListener('jj:message-sent', function () {
    var bd = document.getElementById('compose-backdrop');
    if (bd && bd.classList.contains('is-open')) pendingSend = true;
    else startSend();
  });
  document.addEventListener('jj:compose-closed', function () {
    if (!pendingSend) return;
    pendingSend = false;
    setTimeout(startSend, 350);
  });

  /* ---------- wiring ---------- */
  function track(e) { ptr.cx = e.clientX; ptr.cy = e.clientY; ptr.on = true; }
  section.addEventListener('pointermove', track, { passive: true });
  section.addEventListener('pointerdown', track, { passive: true });
  section.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') ptr.on = false; hoverBtn = null; }, { passive: true });

  /* The hovered or keyboard-focused button: the pair orbits it together. */
  function btnOf(t) {
    var b = t && t.closest ? t.closest(BTN_SEL) : null;
    return b && section.contains(b) && !b.disabled && !b.closest('footer') ? b : null;
  }
  section.addEventListener('pointerover', function (e) {
    if (e.pointerType === 'touch') return;
    var b = btnOf(e.target); if (b) { hoverBtn = b; wake(); }
  });
  section.addEventListener('pointerout', function (e) {
    var b = btnOf(e.target);
    if (b && b === hoverBtn && !(e.relatedTarget && b.contains(e.relatedTarget))) hoverBtn = null;
  });
  section.addEventListener('focusin', function (e) {
    var b = btnOf(e.target), fv = true;
    try { fv = b && b.matches(':focus-visible'); } catch (x) {}
    if (b && fv) { focusBtn = b; wake(); }
  });
  section.addEventListener('focusout', function (e) { if (focusBtn && focusBtn.contains(e.target)) focusBtn = null; });

  if (window.ResizeObserver) new ResizeObserver(function () { drawStill(); wake(); }).observe(cv);
  else window.addEventListener('resize', function () { drawStill(); wake(); });
  if (window.IntersectionObserver) {
    new IntersectionObserver(function (es) {
      onScreen = es[es.length - 1].isIntersecting; last = 0;
      if (onScreen) { drawStill(); wake(); }
    }).observe(section);
  }
  document.addEventListener('visibilitychange', function () { last = 0; wake(); });

  /* The site's motion setting or the system's changed. */
  function setMotion() {
    var c = reduced();
    if (c === calm) return;
    calm = c;
    if (calm) {
      cancelAnimationFrame(raf); raf = 0;
      send = null; rings.length = 0; stream.length = 0; mode = 'sep'; calmSent = false;
      drawStill();
    } else { last = 0; t0 = 0; wake(); }
  }
  if (mq) { if (mq.addEventListener) mq.addEventListener('change', setMotion); else if (mq.addListener) mq.addListener(setMotion); }
  document.addEventListener('jj:motionchange', setMotion);

  /* The theme changed: read the colours again. */
  function retheme() { colours(); drawStill(); }
  if (window.MutationObserver) {
    new MutationObserver(retheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-contrast'] });
  }
  document.addEventListener('jj:langchange', function () { renderReadout(); drawStill(); });

  colours();
  renderReadout();
  drawStill();
  wake();
})();
