/* Nav scroll + active link progress fill */
const nav = document.getElementById('nav');

/* Toggle the solid/scrolled nav state and update the active link's
   scroll-progress fill. */
function syncNavScroll() {
  nav.classList.toggle('scrolled', window.scrollY > 40);
  const progress = Math.min(1, window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight));
  const activeLink = document.querySelector('.pill-nav a.active');
  if (activeLink) activeLink.style.setProperty('--nav-scroll-progress', progress);
}

/* Apply the scrolled state right away so a page opened mid-scroll
   paints the solid nav immediately. The .nav-anim class — which
   carries the nav's background/border/shadow transitions — is added
   only once the page has fully settled (load + scroll restoration),
   so this initial sync lands instantly with no jarring fade-in. */
syncNavScroll();
function enableNavAnim() {
  syncNavScroll();
  requestAnimationFrame(() => nav.classList.add('nav-anim'));
}
if (document.readyState === 'complete') enableNavAnim();
else window.addEventListener('load', enableNavAnim, { once: true });

window.addEventListener('scroll', syncNavScroll, { passive: true });

/* Pill indicator */
const pillNav  = document.getElementById('pillNav');
const pillIndicator = document.getElementById('pillIndicator');
function getPillPos(link) {
  const navRect = pillNav.getBoundingClientRect();
  const aRect   = link.getBoundingClientRect();
  return { left: aRect.left - navRect.left, width: aRect.width };
}
function movePillIndicator() {
  const active = pillNav.querySelector('a.active');
  if (!active) { pillIndicator.style.width = '0'; return; }
  const pos = getPillPos(active);
  pillIndicator.style.transition = 'none';
  pillIndicator.style.transform = `translate3d(${pos.left}px, 0, 0)`;
  pillIndicator.style.width     = pos.width + 'px';
  requestAnimationFrame(() => { pillIndicator.style.transition = ''; });
}
/* Cross-page slide: save position before navigating, restore & animate on next page */
pillNav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    const active = pillNav.querySelector('a.active');
    if (!active) return;
    const pos = getPillPos(active);
    sessionStorage.setItem('pillFrom', JSON.stringify(pos));
  });
});

/* Land the indicator at the saved from-position synchronously — before
   the first paint of the new page — so it doesn't visually pop from
   default (left:0 width:0) to the from-pos before sliding. */
const savedFrom = (function () {
  try {
    const raw = sessionStorage.getItem('pillFrom');
    if (!raw) return null;
    sessionStorage.removeItem('pillFrom');
    return JSON.parse(raw);
  } catch (_) { return null; }
})();
if (savedFrom) {
  pillIndicator.style.transition = 'none';
  pillIndicator.style.transform = `translate3d(${savedFrom.left}px, 0, 0)`;
  pillIndicator.style.width     = savedFrom.width + 'px';
  /* Reveal the indicator now that it's at the correct from-position;
     the .is-positioned class fades it in (opacity 0 → 1) concurrent
     with the slide, hiding the brief moment when CSS painted it at
     transform:0 width:0 before this script ran. */
  pillIndicator.classList.add('is-positioned');
}

/* Trigger the slide as soon as fonts are ready — `window.load` waits
   for images/CSS too, by which time heavy init work (particle canvas,
   FBM gradient) is competing for the main thread and the slide
   stutters. Fonts are what affect pill widths. */
const ready = document.fonts && document.fonts.ready
  ? document.fonts.ready
  : Promise.resolve();
ready.then(() => {
  const active = pillNav.querySelector('a.active');
  if (!active) { pillIndicator.style.width = '0'; return; }
  const toPos = getPillPos(active);
  if (savedFrom) {
    /* Re-enable the transition then write the target position. Two rAFs
       ensure the from-position has been committed to the compositor
       before the transition starts, so the slide actually animates. */
    requestAnimationFrame(() => requestAnimationFrame(() => {
      pillIndicator.style.transition = '';
      pillIndicator.style.transform = `translate3d(${toPos.left}px, 0, 0)`;
      pillIndicator.style.width     = toPos.width + 'px';
    }));
  } else {
    /* First visit / no saved position — snap silently then reveal. */
    pillIndicator.style.transition = 'none';
    pillIndicator.style.transform = `translate3d(${toPos.left}px, 0, 0)`;
    pillIndicator.style.width     = toPos.width + 'px';
    requestAnimationFrame(() => {
      pillIndicator.style.transition = '';
      pillIndicator.classList.add('is-positioned');
    });
  }
});
window.addEventListener('resize', movePillIndicator);

/* Settings menu — language and text size.
   The choices themselves are stored and applied by the settings script
   in <head> (window.jjPrefs) and the language script (window.jjSetLang),
   both in Base.astro. This block only runs the menu: open and close,
   keep keyboard focus inside while it is open, and keep the controls
   showing what is in use. */
(function () {
  const wrap  = document.getElementById('settings');
  const btn   = document.getElementById('settingsBtn');
  const panel = document.getElementById('settingsPanel');
  const prefs = window.jjPrefs;
  if (!wrap || !btn || !panel || !prefs) return;

  function check(name, value) {
    const input = panel.querySelector('input[name="' + name + '"][value="' + value + '"]');
    if (input) input.checked = true;
  }
  /* Make the controls show the current choices. */
  function sync() {
    check('jj-lang', window.jjLang ? window.jjLang() : 'en');
    check('jj-textsize', prefs.get('textsize'));
  }
  sync();

  function track(setting, value) {
    if (window.umami && typeof window.umami.track === 'function') {
      window.umami.track('settings-change', { setting: setting, value: value });
    }
  }

  panel.addEventListener('change', function (e) {
    const el = e.target;
    if (el.name === 'jj-lang') {
      if (window.jjSetLang) window.jjSetLang(el.value);
      track('lang', el.value);
    } else if (el.name === 'jj-textsize') {
      prefs.set('textsize', el.value);
      track('textsize', el.value);
    }
  });

  /* What Tab can land on: buttons and one radio per group
     (the chosen one), which is how radio groups take focus. */
  function stops() {
    return Array.prototype.filter.call(panel.querySelectorAll('button, input'), function (el) {
      return el.type !== 'radio' || el.checked;
    });
  }

  /* Closing plays an exit animation first (.is-closing in global.css);
     the panel counts as closed from the moment it starts. */
  let closing = false;
  let closeTimer = 0;
  function finishClose() {
    clearTimeout(closeTimer);
    if (!closing) return;
    closing = false;
    panel.classList.remove('is-closing');
    panel.hidden = true;
  }
  panel.addEventListener('animationend', function (e) {
    if (e.target === panel && closing) finishClose();
  });

  function isOpen() { return !panel.hidden && !closing; }
  function open() {
    if (isOpen()) return;
    sync();
    closing = false;
    panel.classList.remove('is-closing');
    panel.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    wrap.classList.add('is-open');
    const first = panel.querySelector('input:checked') || stops()[0];
    if (first) first.focus();
  }
  function close(returnFocus) {
    if (!isOpen()) return;
    closing = true;
    panel.classList.add('is-closing');
    /* Fallback in case animationend never fires (e.g. animations off). */
    clearTimeout(closeTimer);
    closeTimer = setTimeout(finishClose, 400);
    btn.setAttribute('aria-expanded', 'false');
    wrap.classList.remove('is-open');
    if (returnFocus) btn.focus();
  }

  btn.addEventListener('click', function () { if (isOpen()) close(true); else open(); });
  document.getElementById('settingsClose').addEventListener('click', function () { close(true); });

  document.addEventListener('keydown', function (e) {
    if (!isOpen()) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      close(true);
      return;
    }
    if (e.key !== 'Tab') return;
    const list = stops();
    const first = list[0];
    const last = list[list.length - 1];
    const at = document.activeElement;
    if (!panel.contains(at)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && at === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && at === last) { e.preventDefault(); first.focus(); }
  });

  /* A click or tap anywhere else closes it. */
  document.addEventListener('pointerdown', function (e) {
    if (isOpen() && !wrap.contains(e.target)) close(false);
  });
})();

/* Mobile menu */
function toggleMobile() {
  const menu   = document.getElementById('mobileMenu');
  const toggle = document.getElementById('navToggle');
  const open   = menu.classList.toggle('open');
  toggle.classList.toggle('open', open);
  toggle.setAttribute('aria-expanded', String(open));
}

/* Reveal observer */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* 3D card tilt */
(function() {
  let tiltCard = null;
  let lastX = 0, lastY = 0, lastT = 0;
  let bounceTimer;
  const BOUNCE_MAX = 0.05;
  const BOUNCE_GAIN = 0.012;
  const TILT_TRANS = 'box-shadow 0.28s, border-color 0.38s, opacity 0.35s ease, filter 0.35s ease, scale 0.32s cubic-bezier(0.34, 1.56, 0.64, 1)';
  const RESET_TRANS = 'transform 0.55s cubic-bezier(0.22,1,0.36,1), box-shadow 0.28s, border-color 0.38s, opacity 0.35s ease, filter 0.35s ease, scale 0.42s cubic-bezier(0.34, 1.56, 0.64, 1)';

  const tiltConfig = function (card) {
    if (card.classList.contains('hero-photo'))             return { deg: 4,  z: 6,  baseScale: 1,    pressScale: 1    };
    if (card.classList.contains('logo-outer'))             return { deg: 8,  z: 10, baseScale: 1,    pressScale: 0.93 };
    if (card.classList.contains('btn'))                    return { deg: 12, z: 14, baseScale: 1,    pressScale: 0.94 };
    if (card.classList.contains('about-cta-avatar-stack')) return { deg: 12, z: 14, baseScale: 1,    pressScale: 0.94 };
    return                                                        { deg: 9,  z: 14, baseScale: 1.04, pressScale: 0.97 };
  };

  const clearTilt = function (el) {
    el.style.transition = RESET_TRANS;
    el.style.transform = '';
    el.style.scale = '';
    el.style.removeProperty('--tilt-mx');
    el.style.removeProperty('--tilt-my');
    el.style.removeProperty('--water-dx');
    el.style.removeProperty('--water-dy');
    el.classList.remove('tilt-active');
  };

  /* Low motion (settings menu or system) turns the tilt off. */
  const lowMotion = function () { return document.documentElement.getAttribute('data-motion') === 'reduce'; };

  document.addEventListener('mousemove', function(e) {
    if (lowMotion()) {
      if (tiltCard) { clearTilt(tiltCard); tiltCard = null; }
      return;
    }
    const card = e.target.closest('.case-card, .testimonial-card, .wall .tile:not(.ghost), .j-scene.has-case, .next-case, .case-img-ph.is-filled, .hero-photo, .btn, .logo-outer, .about-cta-avatar-stack');
    if (tiltCard && tiltCard !== card) {
      clearTilt(tiltCard);
      tiltCard = null;
    }
    if (!card) return;
    const now = performance.now();
    if (tiltCard !== card) { lastX = e.clientX; lastY = e.clientY; lastT = now; }
    tiltCard = card;
    const cfg = tiltConfig(card);
    const r  = card.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width  / 2)) / (r.width  / 2);
    const dy = (e.clientY - (r.top  + r.height / 2)) / (r.height / 2);
    card.style.setProperty('--tilt-mx', ((e.clientX - r.left) / r.width  * 100).toFixed(1));
    card.style.setProperty('--tilt-my', ((e.clientY - r.top)  / r.height * 100).toFixed(1));
    card.classList.add('tilt-active');
    if (card.classList.contains('hero-photo')) {
      card.style.setProperty('--water-dx', dx.toFixed(3));
      card.style.setProperty('--water-dy', dy.toFixed(3));
    }

    const dt = Math.max(1, now - lastT);
    const speed = Math.hypot(e.clientX - lastX, e.clientY - lastY) / dt;
    const bounce = Math.min(BOUNCE_MAX, speed * BOUNCE_GAIN);
    lastX = e.clientX; lastY = e.clientY; lastT = now;

    card.style.transition = TILT_TRANS;
    card.style.transform = `perspective(800px) rotateX(${-dy * cfg.deg}deg) rotateY(${dx * cfg.deg}deg) translateZ(${cfg.z}px)`;
    var pressFactor = card.classList.contains('is-pressed') ? cfg.pressScale : 1;
    card.style.scale = String((cfg.baseScale + bounce) * pressFactor);
    if (bounce > 0.002) {
      clearTimeout(bounceTimer);
      bounceTimer = setTimeout(function () {
        if (tiltCard === card) {
          var pf = card.classList.contains('is-pressed') ? cfg.pressScale : 1;
          card.style.scale = String(cfg.baseScale * pf);
        }
      }, 90);
    }
  });

  var pressedBtn = null;
  function setPressed(el, on) {
    if (!el) return;
    if (on) el.classList.add('is-pressed'); else el.classList.remove('is-pressed');
    if (tiltCard === el) {
      var cfg = tiltConfig(el);
      var pf = on ? cfg.pressScale : 1;
      el.style.scale = String(cfg.baseScale * pf);
    }
  }
  document.addEventListener('pointerdown', function (e) {
    if (lowMotion() || !e.target.closest) return;
    var t = e.target.closest('.case-card, .testimonial-card, .wall .tile:not(.ghost), .j-scene.has-case, .next-case, .case-img-ph.is-filled, .btn, .logo-outer, .about-cta-avatar-stack');
    if (!t) return;
    pressedBtn = t;
    setPressed(t, true);
  });
  function releasePress() {
    if (!pressedBtn) return;
    setPressed(pressedBtn, false);
    pressedBtn = null;
  }
  document.addEventListener('pointerup', releasePress);
  document.addEventListener('pointercancel', releasePress);
  document.addEventListener('mouseleave', function() {
    if (!tiltCard) return;
    clearTilt(tiltCard);
    tiltCard = null;
  });
})();

/* Brands marquee — scroll nudge, hover slow-down, tooltip.
   The CSS loop keeps drifting on its own. Scrolling while the strip is
   on screen gives it a capped push in the scroll's direction (down rolls
   left-to-right, up rolls right-to-left), which eases back to the normal
   drift over about a second. The strip keeps the last scroll direction.
   Hovering slows it right down. */
(function() {
  const marquee = document.querySelector('.brands-marquee');
  const track   = document.querySelector('.brands-track');
  const tip     = document.getElementById('brandsTooltip');
  if (!marquee || !track || !tip) return;
  const BOOST_PER_PX = 0.012;  // extra speed per pixel scrolled
  const BOOST_MAX    = 2;      // at most 3x the normal drift
  const BOOST_DECAY  = 0.93;   // per frame; ~1s back to normal
  const EASE         = 0.1;    // how quickly the rate follows its target
  let tipTimer, anim, raf = 0, inView = false;
  let dir = 1, boost = 0, hover = false, lastY = window.scrollY;
  function getAnim() { if (!anim) anim = track.getAnimations()[0]; return anim; }
  function tick() {
    const a = getAnim();
    if (!a) { raf = 0; return; }
    boost *= BOOST_DECAY;
    if (boost < 0.005) boost = 0;
    const target = dir * (hover ? 0.08 : 1 + boost);
    const cur = a.playbackRate + (target - a.playbackRate) * EASE;
    const settled = Math.abs(target - cur) < 0.005 && !boost;
    a.playbackRate = settled ? target : cur;
    raf = settled ? 0 : requestAnimationFrame(tick);
  }
  function kick() { if (!raf) raf = requestAnimationFrame(tick); }
  if (window.IntersectionObserver) {
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; }).observe(marquee);
  } else {
    inView = true;
  }
  window.addEventListener('scroll', () => {
    const y = window.scrollY, dy = y - lastY;
    lastY = y;
    if (!dy || !inView) return;
    dir = dy > 0 ? -1 : 1;
    boost = Math.min(BOOST_MAX, boost + Math.abs(dy) * BOOST_PER_PX);
    kick();
  }, { passive: true });
  marquee.addEventListener('mouseenter', () => { hover = true; kick(); });
  marquee.addEventListener('mouseleave', () => { hover = false; kick(); clearTimeout(tipTimer); tip.classList.remove('visible'); });
  document.querySelectorAll('.brands-track a').forEach(link => {
    let host = '';
    try { host = new URL(link.href).hostname.replace(/^www\./, ''); } catch(e) {}
    if (!host) return;
    link.addEventListener('mouseenter', (e) => {
      clearTimeout(tipTimer);
      tipTimer = setTimeout(() => {
        tip.textContent = ((window.jjLang ? window.jjLang() : 'en') === 'pt' ? 'Ir para ' : 'Go to ') + host;
        tip.classList.add('visible');
        tip.style.left = (e.clientX - tip.offsetWidth / 2) + 'px';
        tip.style.top  = (e.clientY - 44) + 'px';
      }, 2000);
    });
    link.addEventListener('mousemove', (e) => {
      if (!tip.classList.contains('visible')) return;
      tip.style.left = (e.clientX - tip.offsetWidth / 2) + 'px';
      tip.style.top  = (e.clientY - 44) + 'px';
    });
    link.addEventListener('mouseleave', () => { clearTimeout(tipTimer); tip.classList.remove('visible'); });
  });
})();

/* Cursor ball — accent circle with arrow that tilts with card */
(function() {
  const TILT = 4;
  const ball = document.createElement('div');
  ball.id = 'cursor-ball';
  ball.setAttribute('aria-hidden', 'true');
  ball.innerHTML =
    '<svg class="cursor-ball-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>' +
    '<svg class="cursor-ball-eye" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>' +
    '<span class="cursor-ball-label">View LinkedIn</span>';
  document.body.appendChild(ball);
  const ballLabel = ball.querySelector('.cursor-ball-label');
  let activeCard = null;
  document.addEventListener('mousemove', function(e) {
    /* Low motion: no custom cursor (global.css hides the ball and gives
       the cards their normal pointer back). */
    if (document.documentElement.getAttribute('data-motion') === 'reduce') {
      if (activeCard) { activeCard = null; ball.classList.remove('is-active'); }
      return;
    }
    ball.style.left = e.clientX + 'px';
    ball.style.top  = e.clientY + 'px';
    const card = e.target.closest('.case-card, .testimonial-card[href], .wall .tile:not(.ghost):has(.rd), .j-scene.has-case, .next-case, .case-img-ph.is-filled');
    if (card !== activeCard) {
      activeCard = card;
      if (card) {
        const isTestimonial = card.classList.contains('testimonial-card');
        const isImage = card.classList.contains('case-img-ph');
        ball.classList.toggle('is-linkedin', isTestimonial);
        ball.classList.toggle('is-image', isImage);
        /* Cards can name their action on the ball, e.g. "View case study". */
        const label = !isTestimonial && !isImage ? card.dataset.cursorLabel : '';
        ball.classList.toggle('is-labelled', !!label);
        ballLabel.textContent = label || ((window.jjLang ? window.jjLang() : 'en') === 'pt' ? 'Ver LinkedIn' : 'View LinkedIn');
        if (!isTestimonial && !isImage) {
          /* Replay the arrow nudge when entering a case card. */
          const arrow = ball.querySelector('.cursor-ball-arrow');
          arrow.style.animation = 'none';
          arrow.getBoundingClientRect();
          arrow.style.animation = '';
        }
        ball.classList.add('is-active');
      } else {
        ball.classList.remove('is-active');
      }
    }
    if (card) {
      const r  = card.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width  / 2)) / (r.width  / 2);
      const dy = (e.clientY - (r.top  + r.height / 2)) / (r.height / 2);
      ball.style.transform = `translate(-50%,-50%) perspective(800px) rotateX(${(-dy*TILT).toFixed(2)}deg) rotateY(${(dx*TILT).toFixed(2)}deg)`;
    } else {
      ball.style.transform = 'translate(-50%,-50%)';
    }
  });
  document.addEventListener('mouseleave', function() {
    activeCard = null;
    ball.classList.remove('is-active');
    ball.classList.remove('is-linkedin');
    ball.classList.remove('is-labelled');
  });
})();
