/* Testimonial portraits — the person's photo drawn as a dot matrix.
   Each .testimonial-face span carries the photo URL in --face. Until this
   script runs the span shows a CSS halftone of the same photo; here it gets
   a canvas of dots sized by the photo's brightness, and the dots react to
   the cursor while the card is hovered. The effect comes from the span's
   --face-fx (set per layout in global.css):
     spot   the dots under the cursor grow and brighten
     repel  the dots move away from the cursor
   Reduced motion gets the still portrait. */
(() => {
  const els = document.querySelectorAll('.testimonial-face');
  if (!els.length) return;

  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CELL = 4, TAU = Math.PI * 2;
  const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
  const faces = [];

  /* Read the photo into one brightness value per dot. The crop matches
     the CSS fallback: cover, centred, a quarter down. */
  function sample(f) {
    const w = f.el.clientWidth, h = f.el.clientHeight;
    if (!w || !h || !f.img) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    f.w = w; f.h = h;
    f.cv.width = Math.round(w * dpr); f.cv.height = Math.round(h * dpr);
    f.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cols = f.cols = Math.ceil(w / CELL), rows = f.rows = Math.ceil(h / CELL);
    const oc = document.createElement('canvas');
    oc.width = cols; oc.height = rows;
    const o = oc.getContext('2d', { willReadFrequently: true });
    const iw = f.img.naturalWidth, ih = f.img.naturalHeight;
    const s = Math.max(cols / iw, rows / ih), dw = iw * s, dh = ih * s;
    o.drawImage(f.img, (cols - dw) * 0.5, (rows - dh) * 0.25, dw, dh);
    const d = o.getImageData(0, 0, cols, rows).data;
    f.lum = new Float32Array(cols * rows);
    for (let i = 0; i < f.lum.length; i++) {
      const l = (0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) / 255;
      f.lum[i] = clamp01((l - 0.5) * 1.5 + 0.55);
    }
    f.el.classList.add('is-canvas');
    draw(f);
  }

  function draw(f) {
    const { ctx, cols, rows, lum, t, fx } = f;
    if (!lum) return;
    const live = t > 0.001;
    const half = CELL / 2, maxR = CELL * 0.5;
    const base = new Path2D(), hi = new Path2D();
    ctx.clearRect(0, 0, f.w, f.h);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const l = lum[y * cols + x];
        if (l < 0.06) continue;
        let px = x * CELL + half, py = y * CELL + half, b = 0;
        const r = maxR * l;
        if (live) {
          const dx = px - f.mx, dy = py - f.my, d = Math.hypot(dx, dy);
          if (fx === 'repel') {
            const fo = clamp01(1 - d / 120), push = fo * fo * 46 * t;
            if (d > 0.01) { px += dx / d * push; py += dy / d * push; }
            b = fo * 0.7 * t;
          } else {
            b = clamp01(1 - d / 140); b = b * b * (3 - 2 * b) * t;
          }
        }
        base.moveTo(px + r, py); base.arc(px, py, r, 0, TAU);
        if (b > 0.03) {
          const rh = Math.min(CELL * 0.7, r * (1 + 0.8 * b)) * Math.min(1, b * 2.5);
          hi.moveTo(px + rh, py); hi.arc(px, py, rh, 0, TAU);
        }
      }
    }
    ctx.fillStyle = 'rgba(226,224,250,0.8)'; ctx.fill(base);
    ctx.fillStyle = '#ffffff'; ctx.fill(hi);
  }

  /* One loop for every face; it stops when nothing is hovered or easing. */
  let raf = 0;
  const kick = () => { if (!raf && !still) raf = requestAnimationFrame(tick); };
  function tick() {
    raf = 0;
    let live = false;
    for (const f of faces) {
      if (!f.hover && f.t === 0) continue;
      f.t += ((f.hover ? 1 : 0) - f.t) * 0.12;
      if (!f.hover && f.t < 0.002) f.t = 0;
      draw(f);
      live = true;
    }
    if (live) raf = requestAnimationFrame(tick);
  }

  function setup(el) {
    const m = /url\((['"]?)(.*?)\1\)/.exec(getComputedStyle(el).getPropertyValue('--face'));
    const card = el.closest('.testimonial-card');
    if (!m || !card) return;
    const cv = document.createElement('canvas');
    el.appendChild(cv);
    const f = { el, cv, ctx: cv.getContext('2d'), img: null, lum: null, t: 0, hover: false, mx: -999, my: -999, fx: 'spot' };
    const track = e => { const r = el.getBoundingClientRect(); f.mx = e.clientX - r.left; f.my = e.clientY - r.top; };
    const img = new Image();
    img.onload = () => { f.img = img; sample(f); };
    img.src = m[2];
    new ResizeObserver(() => sample(f)).observe(el);
    card.addEventListener('pointerenter', e => {
      if (e.pointerType === 'touch') return;
      f.fx = getComputedStyle(el).getPropertyValue('--face-fx').trim() || 'spot';
      f.hover = true; track(e); kick();
    });
    card.addEventListener('pointermove', track);
    card.addEventListener('pointerleave', () => { f.hover = false; kick(); });
    faces.push(f);
  }

  /* Load each photo only when its card is close to the viewport. */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      for (const en of entries) if (en.isIntersecting) { io.unobserve(en.target); setup(en.target); }
    }, { rootMargin: '400px' });
    els.forEach(el => io.observe(el));
  } else {
    els.forEach(setup);
  }
})();
