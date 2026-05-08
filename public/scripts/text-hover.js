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
      var ch = text[i] === ' ' ? ' ' : text[i];
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
})();
