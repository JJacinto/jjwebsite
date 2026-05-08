/* jordangilroy-style text hover: two stacked copies, chars slide up/in per-char with stagger */
(function() {
  var DUR     = 300;
  var STAGGER = 200;

  function wrap(el) {
    if (el.dataset.scDone) return;
    el.dataset.scDone = '1';
    var text = el.textContent;
    el.textContent = '';
    for (var i = 0; i < text.length; i++) {
      /* Replace regular spaces with non-breaking spaces — a plain space
         inside .sc-wrap (display: inline-block) can collapse to zero
         width, which makes "Book a call" render as "Bookacall". */
      var ch = text[i] === ' ' ? ' ' : text[i];
      var w  = document.createElement('span');
      w.className = 'sc-wrap';
      var c1 = document.createElement('span');
      c1.className   = 'sc-c1';
      c1.textContent = ch;
      var c2 = document.createElement('span');
      c2.className   = 'sc-c2';
      c2.setAttribute('aria-hidden', 'true');
      c2.textContent = ch;
      w.appendChild(c1);
      w.appendChild(c2);
      el.appendChild(w);
    }
  }

  function setDelays(el, reversed) {
    var wraps = Array.prototype.slice.call(el.querySelectorAll('.sc-wrap'));
    var n = wraps.length;
    wraps.forEach(function(w, i) {
      var idx = reversed ? n - 1 - i : i;
      w.style.setProperty('--sc-d', (n > 1 ? Math.round(idx * STAGGER / (n - 1)) : 0) + 'ms');
    });
  }

  function bind(trigger, textEl) {
    wrap(textEl);
    trigger.addEventListener('mouseenter', function() {
      setDelays(textEl, false);
      textEl.getBoundingClientRect();
      textEl.classList.add('sc-on');
    });
    trigger.addEventListener('mouseleave', function() {
      setDelays(textEl, true);
      textEl.classList.remove('sc-on');
    });
  }

  /* Defer ALL per-char wrapping past the pill-nav cross-page slide.
     Pre-wrapping every nav link, button, and case-card title on page
     load mutates the DOM heavily (hundreds of inserted spans, multiple
     forced reflows from textContent reads/writes) and runs in the same
     frame as the 320ms slide — that's what makes the slide stutter.
     The work is moved to idle time; first hover within the idle window
     binds inline so there's no missed effect. */
  function bindAll() {
    document.querySelectorAll('.pill-nav a').forEach(function(a) { bind(a, a); });
    document.querySelectorAll('.mobile-menu a[data-page]').forEach(function(a) { bind(a, a); });
    document.querySelectorAll('.btn').forEach(function(btn) {
      var spans = Array.prototype.slice.call(btn.querySelectorAll('span')).reverse();
      var txt = null;
      for (var i = 0; i < spans.length; i++) {
        if (!spans[i].classList.contains('btn-icon') && spans[i].textContent.trim()) { txt = spans[i]; break; }
      }
      if (txt) bind(btn, txt);
    });
    document.querySelectorAll('.case-card, .next-case').forEach(function(card) {
      var title = card.querySelector('.case-card-title');
      if (title) bind(card, title);
    });
  }
  if (window.requestIdleCallback) {
    window.requestIdleCallback(bindAll, { timeout: 1200 });
  } else {
    setTimeout(bindAll, 420);
  }
})();
