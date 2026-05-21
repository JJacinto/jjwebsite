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

/* Theme toggle — light ↔ dark. Dark is the site default; clicking the
   toggle stores the user's choice in localStorage so the anti-FOUC
   bootstrap on the next page load applies it before paint. System
   prefers-color-scheme is intentionally not followed. */
(function () {
  const root = document.documentElement;
  /* Reduced-motion users skip the cross-fade — they get an instant
     swap, which is the existing pre-animation behavior. */
  const allowAnim = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function flip(source) {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    /* Drop the transient class onto <html> *before* mutating
       data-theme so the CSS rule it activates is already in effect
       when the custom properties cascade. The matching rule in
       global.css applies a 0.5s transition to color / background-
       color / border-color / fill / stroke / box-shadow on every
       element for the duration; the class is removed at 500ms so
       it doesn't burden subsequent hover interactions. */
    if (allowAnim) root.classList.add('theme-transitioning');
    if (next === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
    try { localStorage.setItem('theme', next); } catch (_) {}
    if (allowAnim) {
      setTimeout(() => root.classList.remove('theme-transitioning'), 500);
    }
    /* Override the data-umami-event auto-fire with a richer call that
       carries the resulting theme as a property — gives the dashboard
       a "switched-to-dark vs switched-to-light" breakdown, plus a
       source dimension so we can see desktop nav vs mobile menu use. */
    if (window.umami && typeof window.umami.track === 'function') {
      window.umami.track('theme-toggle', { theme: next, source: source });
    }
  }
  const navBtn = document.getElementById('themeToggle');
  if (navBtn) navBtn.addEventListener('click', () => flip('nav'));
  const mobileBtn = document.getElementById('mobileThemeToggle');
  if (mobileBtn) mobileBtn.addEventListener('click', () => {
    flip('mobile-menu');
    /* Drop focus so the button doesn't keep its :focus ring after tap
       — touch users were reading the persistent focus state as "this
       button stays selected". */
    mobileBtn.blur();
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

  document.addEventListener('mousemove', function(e) {
    const card = e.target.closest('.case-card, .testimonial-card, .next-case, .hero-photo, .btn, .logo-outer, .about-cta-avatar-stack');
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
    var t = e.target.closest('.case-card, .testimonial-card, .next-case, .btn, .logo-outer, .about-cta-avatar-stack');
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

/* Brands marquee — slow-down + tooltip */
(function() {
  const marquee = document.querySelector('.brands-marquee');
  const track   = document.querySelector('.brands-track');
  const tip     = document.getElementById('brandsTooltip');
  if (!marquee || !track || !tip) return;
  let rampTimer, tipTimer, anim;
  function getAnim() { if (!anim) anim = track.getAnimations()[0]; return anim; }
  function rampRate(target, step) {
    clearTimeout(rampTimer);
    const a = getAnim();
    if (!a) return;
    const cur = a.playbackRate;
    if (Math.abs(cur - target) < 0.005) { a.playbackRate = target; return; }
    a.playbackRate = cur + (target - cur) * step;
    rampTimer = setTimeout(() => rampRate(target, step), 30);
  }
  marquee.addEventListener('mouseenter', () => rampRate(0.08, 0.14));
  marquee.addEventListener('mouseleave', () => { rampRate(1, 0.18); clearTimeout(tipTimer); tip.classList.remove('visible'); });
  document.querySelectorAll('.brands-track a').forEach(link => {
    let host = '';
    try { host = new URL(link.href).hostname.replace(/^www\./, ''); } catch(e) {}
    if (!host) return;
    link.addEventListener('mouseenter', (e) => {
      clearTimeout(tipTimer);
      tipTimer = setTimeout(() => {
        tip.textContent = 'Go to ' + host;
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
  ball.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg><span class="cursor-ball-label">View testimonials on Linkedin</span>';
  document.body.appendChild(ball);
  let activeCard = null;
  document.addEventListener('mousemove', function(e) {
    ball.style.left = e.clientX + 'px';
    ball.style.top  = e.clientY + 'px';
    const card = e.target.closest('.case-card, .testimonial-card, .next-case');
    if (card !== activeCard) {
      activeCard = card;
      if (card) {
        const isTestimonial = card.classList.contains('testimonial-card');
        if (isTestimonial) {
          ball.classList.add('is-linkedin');
        } else {
          ball.classList.remove('is-linkedin');
          const svg = ball.querySelector('svg');
          svg.style.animation = 'none';
          svg.getBoundingClientRect();
          svg.style.animation = '';
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
  });
})();
