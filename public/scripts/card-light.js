/* Card light: the drift and the edge light on every glass card on the
   site (the list is the selector below). Styles are in global.css under
   "Card light".

   Cards are grouped by their parent, which is the grid they sit in.
   Drift: the bands are drawn in the grid's coordinates, so the light
   leaves one card and enters the next. Each card gets a .card-light span
   and the start and end background positions for its slice (--cl-*). The
   animation itself is CSS and only runs while the grid is on screen.
   Edge light: while the pointer is inside a grid, every card in it gets
   the pointer position in its own coordinates (--el-x, --el-y), so rims
   near the cursor light up, not only the hovered card's. */
(function () {
  'use strict';

  var cards = [].slice.call(document.querySelectorAll(
    '.testimonial-card, .case-card, .next-case, .wall .tile, .how-step, ' +
    '.loop-card, .p-card, .b-card, .j-scene, .case-summary-card, .pw-gate'
  ));
  if (!cards.length) return;

  /* Unit vector of a 115deg CSS gradient line. The second band runs at
     245deg, which is the same vector mirrored on x. */
  var UX = 0.9063, UY = 0.4226;

  var groups = [];
  cards.forEach(function (card) {
    /* Journey scenes each sit in their own row; their grid is the list. */
    var parent = card.closest('.journey-list') || card.parentElement, group = null;
    for (var i = 0; i < groups.length; i++) if (groups[i].el === parent) group = groups[i];
    if (!group) {
      group = { el: parent, cards: [] };
      groups.push(group);
      /* One pool of light per grid, under its cards (see .card-pool). */
      var pool = document.createElement('span');
      pool.className = 'card-pool';
      pool.setAttribute('aria-hidden', 'true');
      parent.classList.add('card-light-grid');
      parent.appendChild(pool);
    }
    group.cards.push(card);
    var light = document.createElement('span');
    light.className = 'card-light';
    light.setAttribute('aria-hidden', 'true');
    card.appendChild(light);
  });

  /* Card position inside its grid, from layout offsets so the tilt and
     reveal transforms don't skew it. */
  var offsetIn = function (card, parent) {
    if (card.offsetParent === parent) return [card.offsetLeft, card.offsetTop];
    if (card.offsetParent === parent.offsetParent) {
      return [card.offsetLeft - parent.offsetLeft, card.offsetTop - parent.offsetTop];
    }
    var a = card.getBoundingClientRect(), b = parent.getBoundingClientRect();
    return [a.left - b.left, a.top - b.top];
  };

  var px = function (n) { return n.toFixed(1) + 'px'; };

  var measure = function () {
    groups.forEach(function (g) {
      var W = g.el.offsetWidth, H = g.el.offsetHeight;
      if (!W || !H) return;
      var L = W * UX + H * UY;            /* length of the gradient line across the grid */
      var w = Math.max(320, L * 0.5);     /* half-width of a band */
      var D = L / 2 + w;                  /* travel either side of the grid centre */
      var S = 2 * D + Math.hypot(W, H) + 100; /* square tile that always covers the grid */
      var bx = W / 2 - S / 2, by = H / 2 - S / 2;
      g.cards.forEach(function (card) {
        var o = offsetIn(card, g.el), x = bx - o[0], y = by - o[1], st = card.style;
        st.setProperty('--cl-s', px(S));
        st.setProperty('--cl-w', px(w));
        st.setProperty('--cl-ax0', px(x - D * UX)); st.setProperty('--cl-ay0', px(y - D * UY));
        st.setProperty('--cl-ax1', px(x + D * UX)); st.setProperty('--cl-ay1', px(y + D * UY));
        st.setProperty('--cl-bx0', px(x + D * UX)); st.setProperty('--cl-by0', px(y - D * UY));
        st.setProperty('--cl-bx1', px(x - D * UX)); st.setProperty('--cl-by1', px(y + D * UY));
      });
    });
  };

  var measureQueued = 0;
  var queueMeasure = function () {
    if (measureQueued) return;
    measureQueued = requestAnimationFrame(function () { measureQueued = 0; measure(); });
  };

  measure();
  window.addEventListener('resize', queueMeasure);
  window.addEventListener('load', queueMeasure);
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(queueMeasure);
    groups.forEach(function (g) {
      ro.observe(g.el);
      /* Cards too: the Work wall filter moves tiles without resizing the wall. */
      g.cards.forEach(function (card) { ro.observe(card); });
    });
  }

  /* Run the drift only while its grid is on screen. */
  if (window.IntersectionObserver) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { en.target.classList.toggle('card-light-on', en.isIntersecting); });
    }, { rootMargin: '100px' });
    groups.forEach(function (g) { io.observe(g.el); });
  } else {
    groups.forEach(function (g) { g.el.classList.add('card-light-on'); });
  }

  /* Edge light, for a mouse or trackpad only. */
  if (!window.matchMedia || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  groups.forEach(function (g) {
    var cx = 0, cy = 0, raf = 0;
    var flush = function () {
      raf = 0;
      var gr = g.el.getBoundingClientRect();
      g.el.style.setProperty('--pl-x', px(cx - gr.left));
      g.el.style.setProperty('--pl-y', px(cy - gr.top));
      g.cards.forEach(function (card) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--el-x', px(cx - r.left));
        card.style.setProperty('--el-y', px(cy - r.top));
      });
    };
    g.el.addEventListener('pointermove', function (e) {
      cx = e.clientX; cy = e.clientY;
      g.el.classList.add('card-edge-near');
      if (!raf) raf = requestAnimationFrame(flush);
    });
    g.el.addEventListener('pointerleave', function () { g.el.classList.remove('card-edge-near'); });
  });
})();
