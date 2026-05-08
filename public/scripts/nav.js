/* Nav scroll + active link progress fill */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
  const progress = Math.min(1, window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight));
  const activeLink = document.querySelector('.pill-nav a.active');
  if (activeLink) activeLink.style.setProperty('--nav-scroll-progress', progress);
}, { passive: true });

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
  pillIndicator.style.left  = pos.left + 'px';
  pillIndicator.style.width = pos.width + 'px';
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
window.addEventListener('load', () => {
  const active = pillNav.querySelector('a.active');
  if (!active) { pillIndicator.style.width = '0'; return; }
  const toPos = getPillPos(active);
  const saved = sessionStorage.getItem('pillFrom');
  sessionStorage.removeItem('pillFrom');
  if (saved) {
    const from = JSON.parse(saved);
    pillIndicator.style.transition = 'none';
    pillIndicator.style.left  = from.left + 'px';
    pillIndicator.style.width = from.width + 'px';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      pillIndicator.style.transition = '';
      pillIndicator.style.left  = toPos.left + 'px';
      pillIndicator.style.width = toPos.width + 'px';
    }));
  } else {
    pillIndicator.style.transition = 'none';
    pillIndicator.style.left  = toPos.left + 'px';
    pillIndicator.style.width = toPos.width + 'px';
    requestAnimationFrame(() => { pillIndicator.style.transition = ''; });
  }
});
window.addEventListener('resize', movePillIndicator);

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
    if (card.classList.contains('hero-photo')) return { deg: 4, z: 6, baseScale: 1, pressScale: 1 };
    if (card.classList.contains('btn'))        return { deg: 12, z: 14, baseScale: 1, pressScale: 0.94 };
    return { deg: 9, z: 14, baseScale: 1.04, pressScale: 0.97 };
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
    const card = e.target.closest('.case-card, .testimonial-card, .next-case, .hero-photo, .btn');
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
    var t = e.target.closest('.case-card, .testimonial-card, .next-case, .btn');
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
