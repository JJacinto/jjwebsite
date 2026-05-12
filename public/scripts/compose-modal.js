/* Compose modal */
(function () {
  var INTENTS = ["Let’s chat", "Start a project"];
  var mounted   = false;
  var intentIdx = 0;
  var selectIntent = null;

  /* Calendar */
  var CAL_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var CAL_WDAYS  = ['Mo','Tu','We','Th','Fr','Sa','Su'];
  var CAL_TIMES  = ['9:00','9:30','10:00','10:30','11:00','11:30','12:00','12:30',
                    '13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30'];
  var calYear  = new Date().getFullYear();
  var calMonth = new Date().getMonth();
  var calSel   = null;

  var getSharedFieldsHTML = function () {
    return (
      '<div class="compose-shared-row">' +
        '<div class="compose-field">' +
          '<label class="eyebrow" for="user-name">Your name</label>' +
          '<input class="compose-input" id="user-name" type="text" required autocomplete="name" placeholder="First name or full name">' +
        '</div>' +
        '<div class="compose-field">' +
          '<label class="eyebrow" for="user-email">Your email</label>' +
          '<input class="compose-input" id="user-email" type="email" required autocomplete="email" placeholder="you@example.com">' +
        '</div>' +
      '</div>'
    );
  };

  var getChatFieldsHTML = function () {
    return (
      '<div class="compose-field">' +
        '<label class="eyebrow" for="chat-body">Message</label>' +
        '<textarea class="compose-textarea" id="chat-body" rows="5" required autocomplete="off" placeholder="What&#x27;s on your mind?"></textarea>' +
      '</div>'
    );
  };

  var getProjectFieldsHTML = function () {
    return (
      '<div class="compose-field">' +
        '<span class="eyebrow">Engagement type</span>' +
        '<div class="form-radio-group">' +
          '<label class="form-radio"><input type="radio" name="proj-engagement" value="One-time" required checked><span>One-time</span></label>' +
          '<label class="form-radio"><input type="radio" name="proj-engagement" value="Recurring project" required><span>Recurring project</span></label>' +
        '</div>' +
      '</div>' +
      '<div class="compose-field">' +
        '<span class="eyebrow" id="proj-budget-label">Budget</span>' +
        '<div class="form-radio-group">' +
          '<label class="form-radio"><input type="radio" name="proj-budget" value="$3k-$5k" required><span>$3k–$5k</span></label>' +
          '<label class="form-radio"><input type="radio" name="proj-budget" value="$5k-$10k" required><span>$5k–$10k</span></label>' +
          '<label class="form-radio"><input type="radio" name="proj-budget" value="$10k-$25k" required><span>$10k–$25k</span></label>' +
          '<label class="form-radio"><input type="radio" name="proj-budget" value="$25k+" required><span>$25k+</span></label>' +
        '</div>' +
      '</div>' +
      '<div class="compose-field">' +
        '<div class="form-slider-row">' +
          '<span class="eyebrow" id="proj-timeline-label">Timeline</span>' +
          '<span class="form-slider-val" id="proj-timeline-val">Flexible</span>' +
        '</div>' +
        '<input class="form-slider" type="range" id="proj-timeline" min="1" max="4" value="2" step="1" aria-labelledby="proj-timeline-label" aria-valuetext="Flexible">' +
        '<div class="form-slider-ticks"><span>Exploring</span><span>Flexible</span><span>Soon (1–3 mo)</span><span>ASAP</span></div>' +
      '</div>' +
      '<div class="compose-field">' +
        '<label class="eyebrow" for="proj-context">Tell me about the project</label>' +
        '<textarea class="compose-textarea" id="proj-context" rows="3" required autocomplete="off" placeholder="What are you building, for whom, and what&#x27;s the biggest challenge?"></textarea>' +
      '</div>' +
      '<div class="compose-field">' +
        '<label class="eyebrow" for="proj-links">Relevant links <span class="compose-optional">(optional)</span></label>' +
        '<div class="compose-input-with-icon">' +
          '<svg class="compose-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>' +
          '<input class="compose-input compose-input--has-icon" id="proj-links" type="url" autocomplete="url" placeholder="https://figma.com/…, github.com/…">' +
        '</div>' +
      '</div>'
    );
  };

  var getBookFieldsHTML = function () {
    var timeOpts = CAL_TIMES.map(function (t) {
      var h    = parseInt(t.split(':')[0], 10);
      var m    = t.split(':')[1];
      var ampm = h >= 12 ? 'PM' : 'AM';
      var h12  = h % 12 || 12;
      return '<option value="' + t + '">' + h12 + ':' + m + ' ' + ampm + '</option>';
    }).join('');
    return (
      '<div class="compose-cal">' +
        '<div class="cal-nav-row">' +
          '<button class="cal-nav-btn" id="cal-prev" type="button" aria-label="Previous month">&#8592;</button>' +
          '<span class="cal-month-label" id="cal-month-label"></span>' +
          '<button class="cal-nav-btn" id="cal-next" type="button" aria-label="Next month">&#8594;</button>' +
        '</div>' +
        '<div class="cal-weekdays">' +
          CAL_WDAYS.map(function (d) { return '<span>' + d + '</span>'; }).join('') +
        '</div>' +
        '<div class="cal-grid" id="cal-grid"></div>' +
        '<div class="cal-time-wrap" id="cal-time" style="display:none">' +
          '<label class="eyebrow" for="cal-time-select">Select a time</label>' +
          '<select class="compose-select" id="cal-time-select">' +
            '<option value="">Choose a time…</option>' +
            timeOpts +
          '</select>' +
        '</div>' +
      '</div>'
    );
  };

  var buildCalGrid = function (yr, mo) {
    var grid    = document.getElementById('cal-grid');
    var lbl     = document.getElementById('cal-month-label');
    var prevBtn = document.getElementById('cal-prev');
    if (!grid || !lbl) return;
    lbl.textContent = CAL_MONTHS[mo] + ' ' + yr;
    var today = new Date(); today.setHours(0, 0, 0, 0);
    if (prevBtn) prevBtn.disabled = (yr === today.getFullYear() && mo === today.getMonth());
    var firstDow = (new Date(yr, mo, 1).getDay() + 6) % 7;
    var daysInMo = new Date(yr, mo + 1, 0).getDate();
    var html = '';
    for (var i = 0; i < firstDow; i++) html += '<div class="cal-day cal-day-empty" aria-hidden="true"></div>';
    for (var d = 1; d <= daysInMo; d++) {
      var ts  = new Date(yr, mo, d).getTime();
      var cls = 'cal-day';
      var isDisabled = ts < today.getTime();
      if (isDisabled)                       cls += ' is-disabled';
      if (ts === today.getTime())           cls += ' is-today';
      if (calSel && ts === calSel.getTime()) cls += ' is-selected';
      var dateStr = new Date(yr, mo, d).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      var attrs = isDisabled
        ? ' role="button" aria-disabled="true" tabindex="-1"'
        : ' role="button" tabindex="0"';
      html += '<div class="' + cls + '"' + attrs + ' data-d="' + d + '" aria-label="' + dateStr + '">' + d + '</div>';
    }
    grid.innerHTML = html;
    var selectDay = function (cell) {
      calSel = new Date(yr, mo, parseInt(cell.dataset.d, 10));
      buildCalGrid(yr, mo);
      var tw  = document.getElementById('cal-time');
      var ts2 = document.getElementById('cal-time-select');
      if (tw) tw.style.display = '';
      if (ts2) { ts2.value = ''; ts2.focus(); }
    };
    var cells = grid.querySelectorAll('.cal-day:not(.is-disabled):not(.cal-day-empty)');
    cells.forEach(function (cell, idx) {
      cell.addEventListener('click', function () { selectDay(cell); });
      cell.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectDay(cell); return; }
        var step = 0;
        if (e.key === 'ArrowRight')      step = 1;
        else if (e.key === 'ArrowLeft')  step = -1;
        else if (e.key === 'ArrowDown')  step = 7;
        else if (e.key === 'ArrowUp')    step = -7;
        if (!step) return;
        e.preventDefault();
        var nextIdx = idx + step;
        if (cells[nextIdx]) cells[nextIdx].focus();
      });
    });
  };

  var bindBookCal = function () {
    var today = new Date(); today.setHours(0, 0, 0, 0);
    calYear  = today.getFullYear();
    calMonth = today.getMonth();
    calSel   = null;
    buildCalGrid(calYear, calMonth);
    var prevBtn = document.getElementById('cal-prev');
    var nextBtn = document.getElementById('cal-next');
    if (prevBtn) prevBtn.addEventListener('click', function () {
      calMonth--;
      if (calMonth < 0) { calMonth = 11; calYear--; }
      buildCalGrid(calYear, calMonth);
    });
    if (nextBtn) nextBtn.addEventListener('click', function () {
      calMonth++;
      if (calMonth > 11) { calMonth = 0; calYear++; }
      buildCalGrid(calYear, calMonth);
    });
  };

  var bindFormToggle = function (container) {
    container.querySelectorAll('.form-toggle').forEach(function (group) {
      var fbtns = group.querySelectorAll('.form-toggle-btn');
      fbtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          fbtns.forEach(function (b) { b.classList.remove('is-selected'); });
          btn.classList.add('is-selected');
        });
      });
    });
  };

  var bindProjectSlider = function (container) {
    var slider = container.querySelector('#proj-timeline');
    var val    = container.querySelector('#proj-timeline-val');
    var labels = ['Exploring', 'Flexible', 'Soon (1–3 mo)', 'ASAP'];
    if (slider && val) {
      slider.addEventListener('input', function () {
        var label = labels[+slider.value - 1];
        val.textContent = label;
        slider.setAttribute('aria-valuetext', label);
      });
    }
  };

  /* Budget label tracks the engagement type — one-time work is a flat
     "Budget", a recurring engagement reads as "Monthly budget" so the
     same $3k/$5k/$10k brackets parse as a monthly rate. */
  var bindBudgetLabel = function (container) {
    var label = container.querySelector('#proj-budget-label');
    var radios = container.querySelectorAll('input[name="proj-engagement"]');
    if (!label || !radios.length) return;
    var update = function () {
      var checked = container.querySelector('input[name="proj-engagement"]:checked');
      label.textContent = (checked && checked.value === 'Recurring project') ? 'Monthly budget' : 'Budget';
    };
    radios.forEach(function (r) { r.addEventListener('change', update); });
    update();
  };

  var showFields = function (idx) {
    var chatEl = document.getElementById('compose-fields-chat');
    var projEl = document.getElementById('compose-fields-project');
    var bookEl = document.getElementById('compose-fields-book');
    if (chatEl) chatEl.style.display = (idx === 0) ? '' : 'none';
    if (projEl) projEl.style.display = (idx === 1) ? '' : 'none';
    if (bookEl) bookEl.style.display = (idx === 2) ? '' : 'none';
  };

  var collectSharedFields = function () {
    var nEl = document.getElementById('user-name');
    var eEl = document.getElementById('user-email');
    return {
      name:  nEl ? nEl.value.trim() : '',
      email: eEl ? eEl.value.trim() : ''
    };
  };

  var collectFormData = function () {
    if (intentIdx === 2) {
      var dateStr = calSel
        ? calSel.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        : 'Not selected';
      var timeEl  = document.getElementById('cal-time-select');
      var timeStr = timeEl && timeEl.value ? timeEl.value : 'Not selected';
      return { subject: 'Call booking request', message: 'Date: ' + dateStr + '\nTime: ' + timeStr };
    }
    var shared      = collectSharedFields();
    var sharedHead  = 'From: ' + (shared.name || '—') + ' <' + (shared.email || '—') + '>';
    if (intentIdx === 1) {
      var engEl       = document.querySelector('#compose-fields-project input[name="proj-engagement"]:checked');
      var engagement  = engEl ? engEl.value : 'Not specified';
      var budgetEl    = document.querySelector('#compose-fields-project input[name="proj-budget"]:checked');
      var budget      = budgetEl ? budgetEl.value : 'Not specified';
      var timelineEl  = document.getElementById('proj-timeline-val');
      var timeline    = timelineEl ? timelineEl.textContent : 'Not specified';
      var ctxEl       = document.getElementById('proj-context');
      var context     = ctxEl ? ctxEl.value : '';
      var linksEl     = document.getElementById('proj-links');
      var links       = linksEl ? linksEl.value.trim() : '';
      return {
        subject: 'Project inquiry — ' + engagement + (shared.name ? ' (' + shared.name + ')' : ''),
        message: [sharedHead, '',
                  'Engagement: ' + engagement, 'Budget: ' + budget,
                  'Timeline: ' + timeline,
                  context ? '\nProject details:\n' + context : null,
                  links ? '\nRelevant links:\n' + links : null].filter(function (l) { return l !== null; }).join('\n')
      };
    }
    var bodyEl = document.getElementById('chat-body');
    var msg    = bodyEl ? bodyEl.value : '';
    return {
      subject: shared.name ? 'Message from ' + shared.name : 'New message',
      message: sharedHead + '\n\n' + msg
    };
  };

  var getHTML = function () {
    var btnsHTML = INTENTS.map(function (label, i) {
      return '<button class="intent-btn" role="radio" aria-checked="' + (i === 0 ? 'true' : 'false') +
        '" tabindex="' + (i === 0 ? '0' : '-1') + '" data-idx="' + i + '" type="button">' + label + '</button>';
    }).join('');
    return (
      '<div class="compose-backdrop" id="compose-backdrop" role="presentation" aria-hidden="true">' +
        '<div class="compose-modal" id="compose-modal" role="dialog" aria-modal="true"' +
          ' aria-labelledby="compose-heading" aria-describedby="compose-eyebrow">' +
          '<div class="compose-modal-top">' +
            '<button class="compose-close" id="compose-close" type="button" aria-label="Close">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>' +
            '</button>' +
            '<div class="compose-header">' +
              '<span class="eyebrow" id="compose-eyebrow">Let&#x27;s talk</span>' +
              '<h2 id="compose-heading">What brings you here?</h2>' +
            '</div>' +
            '<div class="intent-toggle" role="radiogroup" aria-label="Message intent">' + btnsHTML + '</div>' +
          '</div>' +
          '<div class="compose-modal-body">' +
            '<div id="compose-fields-shared">' + getSharedFieldsHTML() + '</div>' +
            '<div id="compose-fields-chat">' + getChatFieldsHTML() + '</div>' +
            '<div id="compose-fields-project" style="display:none">' + getProjectFieldsHTML() + '</div>' +
            '<div id="compose-fields-book" style="display:none">' + getBookFieldsHTML() + '</div>' +
          '</div>' +
          '<div class="compose-footer" id="compose-footer">' +
            '<button class="compose-copy-email" id="compose-copy-email" type="button" aria-label="Copy email address">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>' +
              '<span id="compose-copy-hint">Copy my email address</span>' +
            '</button>' +
            '<div class="compose-footer-actions">' +
              '<button class="btn btn-dark-outline" id="compose-cancel" type="button"><span>Cancel</span></button>' +
              '<button class="btn btn-accent" id="compose-send" type="button" aria-label="Submit message">' +
                '<span class="btn-icon"><svg viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true"><path d="M120-160v-640l760 320-760 320Zm80-120 474-200-474-200v140l240 60-240 60v140Zm0 0v-400 400Z"/></svg></span>' +
                '<span>Submit</span>' +
              '</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  };

  var closeModal = function () {
    var bd = document.getElementById('compose-backdrop');
    if (!bd) return;
    bd.classList.remove('is-open');
    bd.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    var opener = document.getElementById('compose-open');
    if (opener) opener.focus();
  };

  var CONTACT_EMAIL = ['contact', '\x40', 'joaojacinto.com'].join('');
  var WEB3FORMS_KEY = '44df2be4-a63f-4af9-9de9-1eabe6739a60';
  var WEB3FORMS_URL = 'https://api.web3forms.com/submit';

  var THROTTLE_KEY = 'compose-throttle';
  var COOLDOWN_SCHEDULE_MS = [
    5  * 60 * 1000,
    30 * 60 * 1000,
    2  * 60 * 60 * 1000,
    12 * 60 * 60 * 1000,
    24 * 60 * 60 * 1000
  ];

  var getThrottleState = function () {
    try {
      var raw = localStorage.getItem(THROTTLE_KEY);
      if (!raw) return { count: 0, lastAt: 0 };
      var s = JSON.parse(raw);
      return s && typeof s.count === 'number' ? s : { count: 0, lastAt: 0 };
    } catch (_) { return { count: 0, lastAt: 0 }; }
  };
  var setThrottleState = function (state) {
    try { localStorage.setItem(THROTTLE_KEY, JSON.stringify(state)); } catch (_) {}
  };
  var cooldownFor = function (count) {
    if (count <= 0) return 0;
    var idx = Math.min(count - 1, COOLDOWN_SCHEDULE_MS.length - 1);
    return COOLDOWN_SCHEDULE_MS[idx];
  };
  var checkThrottle = function () {
    var s = getThrottleState();
    var remaining = cooldownFor(s.count) - (Date.now() - s.lastAt);
    return { ok: remaining <= 0, remainingMs: Math.max(0, remaining) };
  };
  var recordSubmit = function () {
    var s = getThrottleState();
    setThrottleState({ count: s.count + 1, lastAt: Date.now() });
  };
  var formatRemaining = function (ms) {
    if (ms < 60 * 1000)        return Math.ceil(ms / 1000)        + 's';
    if (ms < 60 * 60 * 1000)   return Math.ceil(ms / 60000)       + ' min';
    return Math.ceil(ms / (60 * 60 * 1000)) + ' h';
  };

  var bindEvents = function () {
    var bd        = document.getElementById('compose-backdrop');
    var modal     = document.getElementById('compose-modal');
    var btns      = Array.prototype.slice.call(document.querySelectorAll('.intent-btn'));
    var cancelBtn = document.getElementById('compose-cancel');
    var sendBtn   = document.getElementById('compose-send');
    var closeBtn  = document.getElementById('compose-close');
    var copyBtn   = document.getElementById('compose-copy-email');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    var copyHint  = document.getElementById('compose-copy-hint');
    var projEl    = document.getElementById('compose-fields-project');
    bindFormToggle(projEl);
    bindProjectSlider(projEl);
    bindBudgetLabel(projEl);
    bindBookCal();

    selectIntent = function (idx, fromUserInteraction) {
      var prev = intentIdx;
      intentIdx = idx;
      btns.forEach(function (b, i) {
        b.setAttribute('aria-checked', String(i === idx));
        b.setAttribute('tabindex', i === idx ? '0' : '-1');
      });
      showFields(idx);
      /* Track in-modal intent switches (user clicked a different tab
         after opening). Only fire when the user actually changed
         the value AND the change came from interaction (not from
         openModal's auto-select). Lets the dashboard see "people
         opened to project but switched to chat" patterns. */
      if (fromUserInteraction && prev !== idx && window.umami && typeof window.umami.track === 'function') {
        var label = ['chat', 'project', 'book-call'][idx] || 'chat';
        window.umami.track('compose-modal-intent-switch', { intent: label });
      }
    };

    bd.addEventListener('click', function (e) { if (e.target === bd) closeModal(); });

    btns.forEach(function (btn, i) {
      btn.addEventListener('click', function () { selectIntent(i, true); });
      btn.addEventListener('keydown', function (e) {
        var len = btns.length;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          var next = (i + 1) % len; selectIntent(next, true); btns[next].focus();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          var prev = (i - 1 + len) % len; selectIntent(prev, true); btns[prev].focus();
        }
      });
    });

    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var addr = ['contact', '\x40', 'joaojacinto.com'].join('');
        navigator.clipboard && navigator.clipboard.writeText(addr).then(function () {
          if (!copyHint) return;
          copyHint.textContent = 'Copied!';
          setTimeout(function () { copyHint.textContent = 'Copy my email address'; }, 2000);
        });
      });
    }

    cancelBtn.addEventListener('click', closeModal);

    var validateCurrentForm = function () {
      var nameEl  = document.getElementById('user-name');
      var emailEl = document.getElementById('user-email');
      if (nameEl && !nameEl.value.trim()) { nameEl.focus(); nameEl.reportValidity && nameEl.reportValidity(); return false; }
      if (emailEl && (!emailEl.value.trim() || (emailEl.checkValidity && !emailEl.checkValidity()))) {
        emailEl.focus(); emailEl.reportValidity && emailEl.reportValidity();
        return false;
      }
      if (intentIdx === 0) {
        var body = document.getElementById('chat-body');
        if (body && !body.value.trim()) { body.focus(); body.reportValidity && body.reportValidity(); return false; }
        return true;
      }
      if (intentIdx === 1) {
        var eng = document.querySelector('#compose-fields-project input[name="proj-engagement"]:checked');
        var bud = document.querySelector('#compose-fields-project input[name="proj-budget"]:checked');
        var ctx = document.getElementById('proj-context');
        if (!eng) {
          var firstEng = document.querySelector('#compose-fields-project input[name="proj-engagement"]');
          if (firstEng) { firstEng.focus(); firstEng.reportValidity && firstEng.reportValidity(); }
          return false;
        }
        if (!bud) {
          var firstBud = document.querySelector('#compose-fields-project input[name="proj-budget"]');
          if (firstBud) { firstBud.focus(); firstBud.reportValidity && firstBud.reportValidity(); }
          return false;
        }
        if (!ctx.value.trim()) { ctx.focus(); ctx.reportValidity && ctx.reportValidity(); return false; }
        return true;
      }
      return true;
    };

    sendBtn.addEventListener('click', function () {
      var btnLabel = sendBtn.querySelector('span:last-child');
      if (!validateCurrentForm()) return;
      var gate     = checkThrottle();
      if (!gate.ok) {
        btnLabel.textContent = 'Try again in ' + formatRemaining(gate.remainingMs);
        sendBtn.disabled = true;
        setTimeout(function () {
          btnLabel.textContent = 'Submit';
          sendBtn.disabled = false;
        }, 3500);
        return;
      }
      var data = collectFormData();
      sendBtn.disabled = true;

      /* intentIdx: 0 = chat, 1 = project, 2 = book a call */
      var intentLabel = ['chat', 'project', 'book-call'][intentIdx] || 'chat';

      var trackSubmit = function (transport) {
        if (window.umami && typeof window.umami.track === 'function') {
          window.umami.track('compose-modal-submit', {
            intent:    intentLabel,
            transport: transport
          });
        }
      };

      var mailtoFallback = function () {
        var url = 'mailto:' + CONTACT_EMAIL +
          '?subject=' + encodeURIComponent(data.subject) +
          '&body=' + encodeURIComponent(data.message);
        btnLabel.textContent = 'Opening mail…';
        window.location.href = url;
        recordSubmit();
        trackSubmit('mailto');
        setTimeout(function () {
          btnLabel.textContent = 'Sent ✓';
          setTimeout(function () { closeModal(); }, 1400);
        }, 600);
      };

      if (!WEB3FORMS_KEY) { mailtoFallback(); return; }

      btnLabel.textContent = 'Sending…';
      var shared = collectSharedFields();
      fetch(WEB3FORMS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          to: CONTACT_EMAIL,
          from_name: shared.name || 'Website visitor',
          replyto: shared.email || '',
          subject: data.subject,
          message: data.message,
          botcheck: ''
        })
      }).then(function (res) {
        if (!res.ok) throw new Error('server');
        return res.json();
      }).then(function (json) {
        if (!json.success) throw new Error(json.message || 'server');
        recordSubmit();
        trackSubmit('web3forms');
        btnLabel.textContent = 'Sent ✓';
        setTimeout(function () { closeModal(); }, 1800);
      }).catch(function () {
        mailtoFallback();
      });
    });

    var getFocusable = function () {
      return Array.prototype.filter.call(
        modal.querySelectorAll('button:not([disabled]):not([tabindex="-1"]), input, textarea, select'),
        function (el) { return getComputedStyle(el).display !== 'none'; }
      );
    };

    modal.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeModal(); return; }
      if (e.key !== 'Tab') return;
      var focusable = getFocusable();
      if (!focusable.length) return;
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  };

  var openModal = function (targetIdx) {
    if (!mounted) {
      var root = document.getElementById('compose-root');
      if (!root) return;
      root.innerHTML = getHTML();
      mounted = true;
      bindEvents();
    }
    var bd = document.getElementById('compose-backdrop');
    if (!bd) return;
    bd.removeAttribute('aria-hidden');
    bd.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    if (typeof targetIdx === 'number' && selectIntent) selectIntent(targetIdx);
    var checked = bd.querySelector('.intent-btn[aria-checked="true"]');
    if (checked) checked.focus();
    /* Track modal-open with the resulting intent so the dashboard can
       break down opens by which CTA pre-selected the tab (Start
       project pre-picks "project", Get in touch pre-picks "chat",
       etc.). Fires every time the modal opens. */
    if (window.umami && typeof window.umami.track === 'function') {
      var openIntent = ['chat', 'project', 'book-call'][typeof targetIdx === 'number' ? targetIdx : intentIdx] || 'chat';
      window.umami.track('compose-modal-open', { intent: openIntent });
    }
  };

  window.openComposeModal = openModal;
  var composeOpen = document.getElementById('compose-open');
  if (composeOpen) composeOpen.addEventListener('click', function (e) { e.preventDefault(); openModal(); });
}());

/* Portugal status indicator */
(function () {
  var BOLT = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M9 1L3 10h5L7 15l7-9h-5L9 1z"/></svg>';
  var NOTE = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4.5 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM4.5 10.5V4l8-1.5V5l-8 1.5V10.5z"/></svg>';

  function updateStatus() {
    var now      = new Date();
    var lisbonStr = now.toLocaleString('en-US', { timeZone: 'Europe/Lisbon', hour: 'numeric', hour12: false });
    var hour     = parseInt(lisbonStr, 10);
    var timeStr  = now.toLocaleString('en-US', { timeZone: 'Europe/Lisbon', hour: '2-digit', minute: '2-digit', hour12: false });
    var dot      = document.getElementById('footer-status-dot');
    var label    = document.getElementById('footer-status-label');
    if (!dot || !label) return;
    var color, text, icon, state;
    if (hour >= 9 && hour < 20) {
      color = '#22c55e'; text = 'Available · Working hours'; icon = ''; state = 'available';
    } else if (hour >= 1 && hour < 9) {
      color = '#4b5563'; text = 'Sleeping';                       icon = BOLT; state = 'sleeping';
    } else {
      color = '#f59e0b'; text = 'Outside working hours';          icon = ''; state = 'offhours';
    }
    dot.className = 'footer-status-dot state-' + state;
    dot.style.background = color;
    dot.innerHTML = icon;
    var tp = timeStr.split(':');
    label.innerHTML = text + ' · ' + tp[0] + '<span class="clock-blink">:</span>' + tp[1] + ' Aveiro';
  }

  updateStatus();
  setInterval(updateStatus, 60000);

  var emailBtn = document.getElementById('footer-email-btn');
  if (emailBtn) {
    var origHTML = emailBtn.innerHTML;
    emailBtn.addEventListener('click', function () {
      navigator.clipboard && navigator.clipboard.writeText('contact@joaojacinto.com').then(function () {
        emailBtn.innerHTML = 'Copied ✓';
        emailBtn.classList.add('copied');
        setTimeout(function () {
          emailBtn.innerHTML = origHTML;
          emailBtn.classList.remove('copied');
        }, 2000);
      });
    });
  }
})();

/* Animated dot field for global-CTA cards. */
(function () {
  var wraps = document.querySelectorAll('.cta-footer-wrap, .page-particles, .hero-particles');
  if (!wraps.length) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─── Parallax shared state ──────────────────────────────────────────
     One window-level scroll listener and one window-level mousemove
     listener feed every active wrap. The eased cursor value is computed
     per-wrap inside its own frame loop (cheap math, no race condition
     of practical consequence — all wraps converge to the same target).
     - Scroll listener: passive, just stashes window.scrollY.
     - Mousemove listener: only attached on devices with hover capability
       AND when reduced-motion is off. clientX/Y is normalised to [-1, 1]
       from viewport center so the cursor parallax magnitudes feel
       symmetric regardless of viewport width.
     - Mobile (max-width 720px) halves the scroll factors so the effect
       reads as depth rather than excessive drift on small screens.
     - Per-layer factors:
         depth 1 (far):  scroll 0.10 · cursor 3px
         depth 2 (mid):  scroll 0.25 · cursor 8px
         depth 3 (near): scroll 0.50 · cursor 20px
       Stars on the "near" layer move ~5× as much as "far" stars,
       which is what reads as depth when scrolling through the hero. */
  var pxState = {
    scrollY:    window.scrollY || window.pageYOffset || 0,
    cursorTX:   0,
    cursorTY:   0,
    isMobile:   window.matchMedia('(max-width: 720px)').matches,
    canHover:   !window.matchMedia('(hover: none)').matches,
    scrollMul: [0.10, 0.25, 0.50],
    cursorMul: [3, 8, 20]
  };
  if (!reduced) {
    window.addEventListener('scroll', function () {
      pxState.scrollY = window.scrollY || window.pageYOffset || 0;
    }, { passive: true });
    if (pxState.canHover) {
      window.addEventListener('mousemove', function (e) {
        pxState.cursorTX = (e.clientX / window.innerWidth)  * 2 - 1;
        pxState.cursorTY = (e.clientY / window.innerHeight) * 2 - 1;
      }, { passive: true });
    }
  }
  var pxResizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(pxResizeTimer);
    pxResizeTimer = setTimeout(function () {
      pxState.isMobile = window.matchMedia('(max-width: 720px)').matches;
      pxState.canHover = !window.matchMedia('(hover: none)').matches;
    }, 120);
  }, { passive: true });

  wraps.forEach(initCta);

  function initCta(wrap) {
    var canvas = wrap.querySelector('.cta-footer-bg');
    var card   = wrap.querySelector('.about-cta, .contact-inner');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) { canvas.style.display = 'none'; return; }

    var W = 0, H = 0, dpr = 1;
    var pts = [];
    var btnZone = null;
    var mouseX = -999, mouseY = -999, prevMX = 0, prevMY = 0, velX = 0, velY = 0;
    var mouseInside = false;
    var raf = 0, inView = true, tabVisible = true;
    var bgImage = null;
    /* Per-wrap parallax state. wrapAbsTop is the wrap's document-
       absolute top, cached so frame() can compute the wrap-relative
       scroll progress without calling getBoundingClientRect every
       tick. cursorEX/EY are the locally-eased cursor coords — each
       wrap eases independently toward the shared target, so multiple
       wraps remain in sync without any global rAF coordinator. */
    var wrapAbsTop = 0;
    var cursorEX = 0, cursorEY = 0;
    function recalcWrapTop() {
      var r = wrap.getBoundingClientRect();
      wrapAbsTop = r.top + (window.scrollY || window.pageYOffset || 0);
    }

    function probeRGB(str) {
      var p = document.createElement('div');
      p.style.color = str;
      document.body.appendChild(p);
      var m = getComputedStyle(p).color.match(/[\d.]+/g);
      document.body.removeChild(p);
      return m ? [+m[0], +m[1], +m[2]] : [0, 0, 0];
    }
    /* Read the theme-aware tokens so the particle gradient AND
       particle color flip with data-theme=dark. Reading from the
       wrap (not documentElement) respects always-dark surface
       scoping — inside .cta-footer-wrap, --text-primary stays
       light regardless of page theme; on .contact, it follows the
       page. Recomputed each resize() / theme change. */
    var isContactPage = wrap.classList.contains('contact');
    /* page-particles wraps are the global above-the-fold overlay added
       in Base.astro — paints a subtle gradient (lighter shade fading
       to page bg) over the top half of the viewport, then mask-image
       fades everything out at the 50% mark. */
    var isPageParticles = wrap.classList.contains('page-particles');
    /* hero-particles is the home-page variant: same drifting dot
       field as page-particles, but paired with the WebGL fractal
       behind it. We skip the gradient bgImage entirely so the
       fractal underneath remains visible and only the particles
       are layered on top. */
    var isHeroParticles = wrap.classList.contains('hero-particles');

    var readPalette = function () {
      var rs = getComputedStyle(document.documentElement);
      var ws = getComputedStyle(wrap);
      var pageBg = probeRGB(rs.getPropertyValue('--background-page').trim() || '#ECEAE5');
      return {
        /* Gradient endpoint:
           - page-particles: the page bg, so the gradient ends seamlessly
             matching the surrounding page color
           - cta-footer-wrap variants: the wrap's own computed bg (dark
             band on home/about/work, page bg on contact) */
        dark:     isPageParticles ? pageBg : probeRGB(ws.backgroundColor),
        /* Page bg fallback — used when detectAboveColor finds no opaque
           sibling above the wrap. */
        bg:       pageBg,
        /* Particle base — derives from --text-primary IN the wrap's
           scope. Inside cta-footer-wrap (always-dark scoping) this
           stays light cream; on .contact it flips with the page. For
           page-particles (no scoping override), follows page theme. */
        particle: probeRGB(ws.getPropertyValue('--text-primary').trim() || '#F0EDE8')
      };
    };
    var palette = readPalette();
    var DARK    = palette.dark;
    var BG_FALLBACK = palette.bg;
    var PARTICLE_BASE = palette.particle;

    function detectAboveColor() {
      if (isPageParticles) {
        /* Page-particles overlay: subtle lighter tint at top, fading
           to page bg. --surface-default is one shade lighter than
           page bg in BOTH themes (neutral.20 light, neutral.90 dark)
           — gives a soft glow that blends seamlessly. */
        return probeRGB(getComputedStyle(document.documentElement).getPropertyValue('--surface-default').trim() || '#F7F5F1');
      }
      if (isContactPage) {
        /* Contact page: bg is --background-page (theme-aware). For a
           subtle visible gradient at the top, start from the next
           neutral stop (section-muted = neutral.50 light / neutral.90
           dark) — one shade off page bg in both themes. */
        return probeRGB(getComputedStyle(document.documentElement).getPropertyValue('--background-section-muted').trim() || '#E4E1DB');
      }
      var prev = wrap.previousElementSibling;
      while (prev) {
        var styles = getComputedStyle(prev);
        var pos = styles.position;
        var disp = styles.display;
        if (pos === 'fixed' || pos === 'absolute' || disp === 'none') {
          prev = prev.previousElementSibling;
          continue;
        }
        var bg = styles.backgroundColor;
        if (bg && bg !== 'transparent' && bg.indexOf('rgba(0, 0, 0, 0)') === -1) {
          var rgba = bg.match(/[\d.]+/g);
          if (rgba && rgba.length >= 3) {
            var alpha = rgba.length === 4 ? +rgba[3] : 1;
            if (alpha > 0.5) return [+rgba[0], +rgba[1], +rgba[2]];
          }
        }
        prev = prev.previousElementSibling;
      }
      var bodyBg = getComputedStyle(document.body).backgroundColor;
      var b = bodyBg.match(/[\d.]+/g);
      if (b && b.length >= 3) return [+b[0], +b[1], +b[2]];
      return BG_FALLBACK;
    }

    function hash2(ix, iy) {
      var s = Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453;
      return s - Math.floor(s);
    }
    function vnoise2(x, y) {
      var ix = Math.floor(x), iy = Math.floor(y);
      var fx = x - ix, fy = y - iy;
      var u = fx * fx * (3 - 2 * fx);
      var v = fy * fy * (3 - 2 * fy);
      var a = hash2(ix,     iy);
      var b = hash2(ix + 1, iy);
      var c = hash2(ix,     iy + 1);
      var d = hash2(ix + 1, iy + 1);
      return (1 - u) * (1 - v) * a + u * (1 - v) * b
           + (1 - u) * v       * c + u * v       * d;
    }
    function fbm2(x, y) {
      var v = 0, amp = 0.5;
      var c = 0.8660254, s = 0.5;
      for (var i = 0; i < 3; i++) {
        v += amp * vnoise2(x, y);
        var nx = (c * x - s * y) * 2.07;
        var ny = (s * x + c * y) * 2.07;
        x = nx; y = ny;
        amp *= 0.5;
      }
      return v;
    }

    function buildBackground(w, h, dprIn) {
      var oc = document.createElement('canvas');
      var cw = Math.max(1, Math.floor(w * dprIn));
      var ch = Math.max(1, Math.floor(h * dprIn));
      oc.width = cw; oc.height = ch;
      var octx = oc.getContext('2d');
      var img = octx.createImageData(cw, ch);
      var data = img.data;
      /* Gradient transition height — how much of the canvas the
         smoothstep ramp spans before settling into DARK.
         - page-particles: 50% so the gradient fully resolves to
           page bg by the mask fade point (50% of viewport)
         - contact: 32% — quick transition, wrap is full-fold
         - everything else: full canvas */
      var transition = isPageParticles ? ch * 0.50
                     : isContactPage   ? ch * 0.32
                                       : ch;
      var nScale = 0.018 / dprIn;
      var ABOVE = detectAboveColor();
      var dr = DARK[0] - ABOVE[0], dg = DARK[1] - ABOVE[1], db = DARK[2] - ABOVE[2];
      var noiseFadeEnd = 100 * dprIn;
      for (var y = 0; y < ch; y++) {
        var t  = Math.min(1, y / transition);
        var tt = t * t * (3 - 2 * t);
        var rb = ABOVE[0] + dr * tt;
        var gb = ABOVE[1] + dg * tt;
        var bb = ABOVE[2] + db * tt;
        var nAtt = Math.min(1, y / noiseFadeEnd);
        var nAtt2 = nAtt * nAtt * (3 - 2 * nAtt);
        for (var x = 0; x < cw; x++) {
          var n = (fbm2(x * nScale, y * nScale) - 0.45) * 3.2 * nAtt2;
          var jitter = (Math.random() - 0.5) * 3.5 * nAtt2;
          var off = n + jitter;
          var idx = (y * cw + x) * 4;
          data[idx]     = rb + off;
          data[idx + 1] = gb + off;
          data[idx + 2] = bb + off;
          data[idx + 3] = 255;
        }
      }
      octx.putImageData(img, 0, 0);
      return oc;
    }

    function measureButton(which) {
      var sel = which === 'video' ? '.btn-dark-outline'
              : which === 'chat'  ? '.btn-accent'
              : '.btn';
      var btn = card && card.querySelector(sel);
      if (!btn) return null;
      var wrapR = wrap.getBoundingClientRect();
      var btnR  = btn.getBoundingClientRect();
      var pad = 14;
      return {
        cx: btnR.left - wrapR.left + btnR.width  / 2,
        cy: btnR.top  - wrapR.top  + btnR.height / 2,
        hw: btnR.width  / 2 + pad,
        hh: btnR.height / 2 + pad
      };
    }

    function inButton(x, y, b) {
      return Math.abs(x - b.cx) < b.hw && Math.abs(y - b.cy) < b.hh;
    }

    var MAT_CHAT = 'M80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Zm126-240h594v-480H160v525l46-45Zm-46 0v-480 480Z';
    var MAT_VIDEO = 'M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h480q33 0 56.5 23.5T720-720v180l160-160v440L720-420v180q0 33-23.5 56.5T640-160H160Zm0-80h480v-480H160v480Zm0 0v-480 480Z';
    function samplePath(pathData, size) {
      var oc = document.createElement('canvas');
      oc.width = oc.height = Math.ceil(size);
      var octx = oc.getContext('2d');
      octx.save();
      octx.fillStyle = '#fff';
      octx.translate(0, size);
      octx.scale(size / 960, size / 960);
      octx.fill(new Path2D(pathData), 'evenodd');
      octx.restore();
      var data = octx.getImageData(0, 0, oc.width, oc.height).data;
      var out = [];
      for (var y = 0; y < oc.height; y += 2) {
        for (var x = 0; x < oc.width; x += 2) {
          if (data[(y * oc.width + x) * 4 + 3] > 60) {
            out.push([x - oc.width / 2, y - oc.height / 2]);
          }
        }
      }
      return out;
    }

    function generate() {
      pts = [];
      var w = canvas.offsetWidth, h = canvas.offsetHeight;
      if (w === 0 || h === 0) return;
      btnZone = measureButton();
      var diag = Math.sqrt(w * w + h * h);
      var target = Math.round((w * h) / 4200);
      var cardH = card ? card.getBoundingClientRect().height : h;
      var iconSize = Math.min(w * 0.30, cardH * 0.95);
      var chatPts  = samplePath(MAT_CHAT,  iconSize);
      var videoPts = samplePath(MAT_VIDEO, iconSize);
      var wcx = w / 2, wcy = h / 2;
      if (card) {
        var wrapR = wrap.getBoundingClientRect();
        var cardR = card.getBoundingClientRect();
        wcx = cardR.left - wrapR.left + cardR.width  / 2;
        wcy = cardR.top  - wrapR.top  + cardR.height / 2;
      }
      var attempts = 0, maxAttempts = target * 25;
      while (pts.length < target && attempts < maxAttempts) {
        attempts++;
        var x = Math.random() * w;
        var y = Math.random() * h;
        if (btnZone && inButton(x, y, btnZone)) continue;
        if (btnZone) {
          var dx = x - btnZone.cx, dy = y - btnZone.cy;
          var d  = Math.sqrt(dx * dx + dy * dy);
          var p  = 1 - (d / diag);
          if (Math.random() > p * 1.4) continue;
        }
        var cp = chatPts.length  ? chatPts[Math.floor(Math.random()  * chatPts.length)]  : null;
        var vp = videoPts.length ? videoPts[Math.floor(Math.random() * videoPts.length)] : null;
        /* Depth tier (1 = far, 2 = mid, 3 = near). Weighted random:
           50% / 30% / 20% so far stars dominate the field and near
           stars are sparse — reads as natural depth.
           - depthScale modulates particle radius:
               far  0.6×  · mid 1.0× · near 1.4×
           - depthAlpha modulates the final alpha (atmospheric perspective
             — distant stars dim, close stars bright):
               far 0.55  · mid 0.85 · near 1.0
           Looked up by depth index in frame() to compute the parallax
           offset against pxState.scrollMul / cursorMul. */
        var rnd = Math.random();
        var depth = rnd < 0.5 ? 1 : (rnd < 0.8 ? 2 : 3);
        var depthScale = depth === 1 ? 0.6 : depth === 2 ? 1.0 : 1.4;
        var depthAlpha = depth === 1 ? 0.55 : depth === 2 ? 0.85 : 1.0;
        pts.push({
          x: x, y: y, ox: x, oy: y, vx: 0, vy: 0,
          tw: Math.random() * Math.PI * 2,
          ts: 0.012 + Math.random() * 0.022,
          dPhX: Math.random() * Math.PI * 2,
          dPhY: Math.random() * Math.PI * 2,
          dSpX: 0.0005 + Math.random() * 0.0012,
          dSpY: 0.0005 + Math.random() * 0.0012,
          dAmp: 10 + Math.random() * 22,
          chatX:  cp ? wcx + cp[0] : null, chatY:  cp ? wcy + cp[1] : null,
          videoX: vp ? wcx + vp[0] : null, videoY: vp ? wcy + vp[1] : null,
          r:  0.7 + Math.random() * 1.2,
          depth: depth, depthScale: depthScale, depthAlpha: depthAlpha
        });
      }
    }

    function resize() {
      /* Re-read the palette so dark mode toggle picks up the new
         background colors before the offscreen canvas is rebuilt. */
      palette = readPalette();
      DARK = palette.dark;
      BG_FALLBACK = palette.bg;
      PARTICLE_BASE = palette.particle;
      /* Document-absolute wrap top changes when the document above
         the wrap reflows — recompute alongside the canvas resize. */
      recalcWrapTop();
      /* Avatar's wrap-local centre also shifts if the wrap reflows. */
      if (avatarEl) avatarZone = measureAvatar();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      var w = wrap.clientWidth, h = wrap.clientHeight;
      W = Math.max(1, Math.floor(w * dpr));
      H = Math.max(1, Math.floor(h * dpr));
      canvas.width = W; canvas.height = H;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      /* Hero-particles intentionally skips buildBackground — the
         WebGL fractal beneath is already painting the gradient.
         Leaving bgImage null makes frame() clearRect each tick so
         the canvas stays transparent and the fractal shows through. */
      bgImage = isHeroParticles ? null : buildBackground(w, h, dpr);
      generate();
    }

    /* Theme switches mutate <html data-theme="...">. Repaint the
       gradient + particles when that happens. We call frame()
       DIRECTLY (not just loop()) so the new bgImage paints
       synchronously even when the wrap is off-screen (rAF paused
       by IntersectionObserver) or prefers-reduced-motion is set
       (rAF loop disabled). Without the direct call the canvas
       would retain its old-theme gradient until the user scrolled
       back into the section, producing the "footer stayed in the
       opposite color" bug after toggling themes. */
    if (window.MutationObserver) {
      new MutationObserver(function () {
        resize();
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        frame();
      }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    }

    /* page-particles + hero-particles wraps carry pointer-events:none
       so they don't block clicks on the content layered above. That
       also kills mousemove on the wrap itself, so the particles
       wouldn't react to the cursor (which is the same reach-to-mouse
       behaviour the footer/contact fields have). For those wraps,
       hook the listener on the window instead and translate the
       coordinates into wrap-local space, gating "inside" by the
       wrap's bounding rect. */
    var passThrough = isPageParticles || isHeroParticles;
    if (passThrough) {
      window.addEventListener('mousemove', function (e) {
        var r = wrap.getBoundingClientRect();
        var nx = e.clientX - r.left, ny = e.clientY - r.top;
        var inside = nx >= 0 && ny >= 0 && nx <= r.width && ny <= r.height;
        if (inside) {
          if (!mouseInside) { prevMX = nx; prevMY = ny; }
          mouseInside = true;
          velX = nx - prevMX; velY = ny - prevMY;
          prevMX = nx; prevMY = ny;
          mouseX = nx; mouseY = ny;
        } else if (mouseInside) {
          mouseInside = false;
          mouseX = mouseY = -999;
          velX = velY = 0;
        }
      }, { passive: true });
    } else {
      wrap.addEventListener('mouseenter', function () { mouseInside = true; });
      wrap.addEventListener('mouseleave', function () {
        mouseInside = false;
        mouseX = mouseY = -999;
        velX = velY = 0;
      });
      wrap.addEventListener('mousemove', function (e) {
        var r = wrap.getBoundingClientRect();
        var nx = e.clientX - r.left, ny = e.clientY - r.top;
        velX = nx - prevMX; velY = ny - prevMY;
        prevMX = nx; prevMY = ny;
        mouseX = nx; mouseY = ny;
      });
    }

    var btnHover = false;
    var activeShape = 'chat';
    var hoverProg = 0;
    var primaryBtn   = card && card.querySelector('.btn-accent');
    /* Secondary CTA: the about-cta variant uses .btn-dark-outline,
       the contact page's .contact-ctas uses .btn-ghost. Both are
       the "Book a call" action — particles should be drawn toward
       either one on hover. Scoping the .btn-ghost match to
       .contact-ctas avoids accidentally targeting the contact-card
       email/map/social .btn-ghost buttons that live inside the
       same .contact-inner card. */
    var secondaryBtn = card && card.querySelector('.btn-dark-outline, .contact-ctas .btn-ghost');
    var hoverStart = 0;
    if (primaryBtn) {
      primaryBtn.addEventListener('mouseenter', function () {
        btnHover = true; activeShape = 'chat';
        hoverStart = performance.now();
        loop();
      });
      primaryBtn.addEventListener('mouseleave', function () { btnHover = false; hoverStart = 0; loop(); });
    }
    if (secondaryBtn) {
      secondaryBtn.addEventListener('mouseenter', function () {
        btnHover = true; activeShape = 'video';
        hoverStart = performance.now();
        loop();
      });
      secondaryBtn.addEventListener('mouseleave', function () { btnHover = false; hoverStart = 0; loop(); });
    }

    /* Avatar orbit — when the user hovers .about-cta-avatar-stack
       the particles get pulled into rotating bands around the
       avatar's centre. avatarHoverStart marks the moment of
       hover-in; per-particle adoption probability grows with
       elapsed hover time so the orbit fills out gradually rather
       than snapping all particles into place at once. avatarZone
       caches the avatar's wrap-local centre + radius, recomputed
       on hover-in and on resize (mounted alongside the existing
       ResizeObserver). */
    var avatarEl = card && card.querySelector('.about-cta-avatar-stack');
    var avatarHover = false;
    var avatarHoverStart = 0;
    var avatarZone = null;
    /* Pulse state — set to a timestamp on avatar click/tap. While
       (now - pulseStart) < pulseDuration, orbiting particles get a
       temporary outward radius boost that traces a half-sine wave:
       0 at start → peak (pulseAmplitude) at midpoint → 0 at end.
       Underlying spiral-in continues uninterrupted, so once the
       pulse decays the particles resume moving toward the avatar. */
    var pulseStart = 0;
    var pulseDuration = 1.6;
    var pulseAmplitude = 70;
    /* Freeze state — set by clicking the avatar. Lifecycle:
       1. Click → .is-frozen on the stack + .is-current on the
          visible frame. Tooltip + 4s progress ring fade in.
       2. After 4s → settleToBase(): swap .is-current to the FIRST
          frame, replace .is-frozen with .is-resting. The avatar
          now holds the base headshot, no tooltip, no progress —
          the freeze has resolved. Persists even if the cursor
          left mid-timer.
       3. Mouseleave AFTER the timer settled → fullReset(): clears
          .is-resting + .is-current so the next hover starts a
          fresh roulette.
       Hover-out DURING the 4s timer is a no-op (the freeze keeps
       running) per the explicit "should continue even if the
       avatar is unhovered" requirement. */
    var freezeTimer = null;
    var avatarTooltipEl = avatarEl && avatarEl.querySelector('.about-cta-avatar-tooltip');
    var avatarProgressCircle = avatarEl && avatarEl.querySelector('.about-cta-avatar-progress circle');
    function settleToBase() {
      if (!avatarEl) return;
      if (freezeTimer) { clearTimeout(freezeTimer); freezeTimer = null; }
      var frames = avatarEl.querySelectorAll('.about-cta-avatar-frame');
      for (var k = 0; k < frames.length; k++) frames[k].classList.remove('is-current');
      if (frames[0]) frames[0].classList.add('is-current');
      avatarEl.classList.remove('is-frozen');
      avatarEl.classList.add('is-resting');
      if (avatarTooltipEl) avatarTooltipEl.textContent = '';
    }
    function fullResetAvatar() {
      if (!avatarEl) return;
      if (freezeTimer) { clearTimeout(freezeTimer); freezeTimer = null; }
      avatarEl.classList.remove('is-frozen');
      avatarEl.classList.remove('is-resting');
      var frames = avatarEl.querySelectorAll('.about-cta-avatar-frame');
      for (var m = 0; m < frames.length; m++) frames[m].classList.remove('is-current');
      if (avatarTooltipEl) avatarTooltipEl.textContent = '';
    }
    function freezeAvatar() {
      if (!avatarEl) return;
      var frames = avatarEl.querySelectorAll('.about-cta-avatar-frame');
      if (!frames.length) return;
      /* Find the currently-visible frame by reading computed opacity —
         getComputedStyle returns the live animated value during a
         running CSS animation, so this catches whichever frame the
         page-flip happens to be holding at "flat" right now. Falls
         back to the first frame on a static state (no animation
         running, mobile tap without hover). */
      var visibleFrame = frames[0];
      var maxOp = -1;
      for (var i = 0; i < frames.length; i++) {
        var op = parseFloat(getComputedStyle(frames[i]).opacity);
        if (op > maxOp) { maxOp = op; visibleFrame = frames[i]; }
      }
      /* Reset prior freeze without leaving stale .is-current. Also
         drop .is-resting in case we're transitioning from a settled
         state into a fresh freeze. */
      if (freezeTimer) { clearTimeout(freezeTimer); freezeTimer = null; }
      for (var j = 0; j < frames.length; j++) frames[j].classList.remove('is-current');
      avatarEl.classList.remove('is-resting');
      visibleFrame.classList.add('is-current');
      if (avatarTooltipEl) avatarTooltipEl.textContent = visibleFrame.dataset.tooltip || '';
      /* Restart the progress-fill keyframe: toggling animation
         doesn't replay on its own once it's reached end state, so
         we reflow to force a fresh run. */
      if (avatarProgressCircle) {
        avatarProgressCircle.style.animation = 'none';
        // eslint-disable-next-line no-unused-expressions
        avatarProgressCircle.offsetWidth;
        avatarProgressCircle.style.animation = '';
      }
      avatarEl.classList.add('is-frozen');
      freezeTimer = setTimeout(settleToBase, 4000);
    }
    function measureAvatar() {
      if (!avatarEl) return null;
      var wrapR = wrap.getBoundingClientRect();
      var avR   = avatarEl.getBoundingClientRect();
      return {
        cx: avR.left - wrapR.left + avR.width  / 2,
        cy: avR.top  - wrapR.top  + avR.height / 2,
        r:  Math.min(avR.width, avR.height) / 2
      };
    }
    if (avatarEl) {
      avatarEl.addEventListener('mouseenter', function () {
        avatarHover = true;
        avatarHoverStart = performance.now();
        avatarZone = measureAvatar();
        loop();
      });
      avatarEl.addEventListener('mouseleave', function () {
        avatarHover = false;
        avatarHoverStart = 0;
        /* Don't null avatarZone — particles still need a target to
           release from. They drop out of orbit via the !avatarHover
           branch in the frame loop, which clears p.orbitT and lets
           the normal drift physics pull them back to ox/oy. */
        /* Two-stage freeze: while .is-frozen is active (the 4s
           viewing window), un-hover is a no-op — the photo and
           tooltip remain visible until the timer settles to the
           base photo. Once settled (.is-resting), mousing out
           clears that resting state so the next hover starts a
           fresh roulette. */
        if (avatarEl.classList.contains('is-resting')) {
          fullResetAvatar();
        }
      });
      /* Tap/click on the avatar:
         - If currently mid-freeze (.is-frozen, 4s timer running),
           cancel the freeze and return to the roulette — the
           default-photo tooltip "Click again. I dare you." reads
           as the call-to-action for this second click.
         - Otherwise (default, hovering, or settled in .is-resting),
           start a new freeze on the currently-visible frame.
         Either branch fires the particle pulse + ensures the rAF
         loop is alive so the pulse renders.
         pointerdown (not click) is used so the handler fires
         reliably on iOS Safari: on a <div> with cursor:pointer,
         the synthesized click event can be suppressed after the
         first tap (which iOS interprets as "show hover state"),
         leaving subsequent taps unresponsive. pointerdown fires
         on every press regardless of hover-simulation state.
         lastTap debounce guards against the rare desktop case
         where pointerdown + the now-unused click event both
         dispatch — same handler, fires twice, undesirable. */
      var lastTap = 0;
      avatarEl.addEventListener('pointerdown', function () {
        var nowT = performance.now();
        if (nowT - lastTap < 250) return;
        lastTap = nowT;
        if (avatarEl.classList.contains('is-frozen')) {
          fullResetAvatar();
        } else {
          freezeAvatar();
        }
        pulseStart = performance.now();
        loop();
      });
    }

    var IR = 130;
    function frame() {
      raf = 0;
      var w = canvas.offsetWidth, h = canvas.offsetHeight;
      if (bgImage) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(bgImage, 0, 0);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      } else {
        ctx.clearRect(0, 0, w, h);
      }

      var spd = mouseInside ? Math.min(Math.sqrt(velX * velX + velY * velY), 30) : 0;

      hoverProg += ((btnHover ? 1 : 0) - hoverProg) * 0.005;

      var now = performance.now();
      var agitationActive = btnHover && hoverStart && (now - hoverStart) > 10000;

      if (btnHover && hoverProg > 0.01) btnZone = measureButton(activeShape);

      /* Parallax setup — computed once per frame, applied per particle
         in the draw loop by indexing depthDX/depthDY by p.depth.
         - wrapScroll: how far the wrap has scrolled past its origin
           (positive while the user scrolls down past the wrap top).
           Using wrap-relative scroll instead of raw window.scrollY keeps
           the parallax neutral when the wrap first enters the viewport,
           which is what reads as "the stars are at rest, then drift as
           the user scrolls past."
         - cursorEX/EY: lerped toward the shared cursor target each
           frame. 0.10 ease factor matches the brief's 0.08-0.12 range.
           Skipped on touch (canHover false) — cursorEX/EY stay at 0,
           so no cursor offset is applied.
         - scrollMul is halved on mobile so the effect reads as
           atmospheric rather than excessive on small viewports. */
      var wrapScroll = pxState.scrollY - wrapAbsTop;
      if (pxState.canHover) {
        cursorEX += (pxState.cursorTX - cursorEX) * 0.10;
        cursorEY += (pxState.cursorTY - cursorEY) * 0.10;
      }
      var mobileScrollDamp = pxState.isMobile ? 0.5 : 1;
      var sm0 = pxState.scrollMul[0] * mobileScrollDamp;
      var sm1 = pxState.scrollMul[1] * mobileScrollDamp;
      var sm2 = pxState.scrollMul[2] * mobileScrollDamp;
      var cm0 = pxState.cursorMul[0];
      var cm1 = pxState.cursorMul[1];
      var cm2 = pxState.cursorMul[2];
      /* Negative scroll term → particles translate UP as page scrolls
         down. Negative cursor term → layers "look at" the cursor (they
         translate opposite to cursor movement, like depth parallax in
         a 3D scene). */
      var depthDX = [
        -cursorEX * cm0,
        -cursorEX * cm1,
        -cursorEX * cm2
      ];
      var depthDY = [
        -wrapScroll * sm0 - cursorEY * cm0,
        -wrapScroll * sm1 - cursorEY * cm1,
        -wrapScroll * sm2 - cursorEY * cm2
      ];

      /* Avatar orbit — per-frame state. avatarElapsed is the number of
         seconds the avatar has been continuously hovered, used to
         ramp up the per-particle adoption probability so the orbit
         fills out gradually rather than all-at-once. */
      var avatarElapsed = avatarHover && avatarHoverStart ? (now - avatarHoverStart) * 0.001 : 0;

      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];

        p.dPhX += p.dSpX; p.dPhY += p.dSpY;
        var driftX = Math.cos(p.dPhX) * p.dAmp;
        var driftY = Math.sin(p.dPhY) * p.dAmp;

        var tx = p.ox + driftX;
        var ty = p.oy + driftY;
        var pull = 0;

        /* ─── Avatar orbit branch ───────────────────────────────────
           When hovering the avatar, particles get adopted into
           orbits and SPIRAL INWARD toward a tight target radius.
           The longer the user hovers, the more particles join the
           swirl AND the closer the existing ones have moved.

           Smoothness rules:
           - At adoption, orbitR0 + orbitAngle0 are computed from
             the particle's CURRENT (drift-modulated) position, so
             the orbit's t=0 sample coincides exactly with where the
             particle already is. No "snap toward the ring" at
             adoption — the motion just bends from linear drift
             into a slow inward spiral.
           - Lerp ramps gently from 0.05 → 0.15 (was 0.18 → 0.40):
             follow rate is just enough to track the orbit target
             without ever yanking the particle. The "snap toward
             the ring" complaint was at the 0.40 cap.
           - orbitW slowed to ±0.25-0.65 rad/s (was up to ±1.0) so
             each orbit traces a noticeable curve over several
             seconds rather than racing around.
           - orbitTransit lengthened to 5-7s (was 3.5-5s) so the
             spiral-in is slow, steady, gradual.
           - Adoption rate halved: 0.0025 base + 0.009 ramp,
             ramped over 5s instead of 3s. Particles join one or
             two at a time instead of in bursts. */
        var inOrbit = false;
        if (avatarHover && avatarZone) {
          if (!p.orbitT) {
            var adoptionPerFrame = 0.0025 + 0.009 * Math.min(1, avatarElapsed / 5);
            if (Math.random() < adoptionPerFrame) {
              /* Seed orbit so its t=0 position matches the particle's
                 current position — orbit appears to grow OUT of the
                 particle's drift, not warp it across the canvas. */
              var seedDX = p.x - avatarZone.cx;
              var seedDY = p.y - avatarZone.cy;
              var seedR  = Math.max(20, Math.sqrt(seedDX * seedDX + seedDY * seedDY));
              p.orbitT       = now;
              p.orbitAngle0  = Math.atan2(seedDY, seedDX);
              p.orbitR0      = seedR;
              p.orbitRTarget = 55 + Math.random() * 25;
              p.orbitW       = (Math.random() < 0.5 ? 1 : -1) * (0.25 + Math.random() * 0.40);
              p.orbitTransit = 5 + Math.random() * 2;
            }
          }
          if (p.orbitT) {
            inOrbit = true;
            var orbitAge = (now - p.orbitT) * 0.001;
            /* Ease-out quad on radius transit — slow steady inward
               motion that settles at the target ring. */
            var rT = Math.min(1, orbitAge / p.orbitTransit);
            var rEase = 1 - (1 - rT) * (1 - rT);
            var currentR = p.orbitR0 + (p.orbitRTarget - p.orbitR0) * rEase;
            /* Pulse offset — additive outward push on top of the
               spiral-in radius. Half-sine wave: 0 → +amplitude → 0
               over pulseDuration. After the wave decays the
               underlying spiral-in math resumes unchanged, so the
               particle continues moving toward the avatar. */
            if (pulseStart) {
              var pulseAge = (now - pulseStart) * 0.001;
              if (pulseAge < pulseDuration) {
                currentR += Math.sin((pulseAge / pulseDuration) * Math.PI) * pulseAmplitude;
              }
            }
            var theta = p.orbitAngle0 + orbitAge * p.orbitW;
            var orbitX = avatarZone.cx + Math.cos(theta) * currentR;
            var orbitY = avatarZone.cy + Math.sin(theta) * currentR;
            /* Gentle follow: 0.05 base, ramping to 0.15 over ~2s.
               Low enough to never read as a "push" — the particle
               just glides along the orbit curve. */
            var lerp = Math.min(0.15, 0.05 + orbitAge * 0.05);
            p.x += (orbitX - p.x) * lerp;
            p.y += (orbitY - p.y) * lerp;
            p.vx = 0; p.vy = 0;
            /* Pull = 0 keeps particles at their original colour,
               radius, and twinkle alpha — the orbit is conveyed by
               motion alone, no brand-tint blend or size boost. */
            pull = 0;
          }
        } else if (p.orbitT) {
          /* Hover ended — release the particle. The default drift +
             velocity-damping physics below will pull it home to
             (ox, oy) smoothly. */
          p.orbitT = 0;
        }

        if (!inOrbit) {
          if (hoverProg > 0.001 && btnZone) {
            var ddx = p.ox - btnZone.cx, ddy = p.oy - btnZone.cy;
            var dToBtn = Math.sqrt(ddx * ddx + ddy * ddy);
            if (dToBtn < 1000) {
              pull = (1 - dToBtn / 1000) * hoverProg;
              tx = (p.ox + driftX) + (btnZone.cx - (p.ox + driftX)) * pull;
              ty = (p.oy + driftY) + (btnZone.cy - (p.oy + driftY)) * pull;
            }
          }

          p.vx = (p.vx + (tx - p.x) * 0.0035) * 0.94;
          p.vy = (p.vy + (ty - p.y) * 0.0035) * 0.94;

          if (agitationActive && pull > 0.4 && btnZone) {
            if (!p.agitAt || (now - p.agitAt) > 1600) {
              p.agitMode = Math.random() < 0.5 ? 1 : 0;
              p.agitAt = now;
            }
            if (p.agitMode === 1) {
              p.vx += (btnZone.cx - p.x) * 0.012;
              p.vy += (btnZone.cy - p.y) * 0.012;
            } else {
              p.vx += (Math.random() - 0.5) * 1.4 * pull;
              p.vy += (Math.random() - 0.5) * 1.4 * pull;
            }
          }

          if (mouseInside && spd > 1 && hoverProg < 0.5) {
            var dx = p.x - mouseX, dy = p.y - mouseY;
            var d2 = dx * dx + dy * dy;
            if (d2 < IR * IR && d2 > 0.1) {
              var d  = Math.sqrt(d2);
              var fo = 1 - d / IR;
              p.vx += (dx / d) * fo * fo * spd * 0.06;
              p.vy += (dy / d) * fo * fo * spd * 0.06;
            }
          }
          p.x += p.vx; p.y += p.vy;
        }
        if (!inOrbit && btnZone) {
          var bdx = p.x - btnZone.cx, bdy = p.y - btnZone.cy;
          if (Math.abs(bdx) < btnZone.hw && Math.abs(bdy) < btnZone.hh) {
            var overX = btnZone.hw - Math.abs(bdx);
            var overY = btnZone.hh - Math.abs(bdy);
            if (overX < overY) {
              p.x += (bdx >= 0 ? overX : -overX);
              p.vx *= -0.3;
            } else {
              p.y += (bdy >= 0 ? overY : -overY);
              p.vy *= -0.3;
            }
          }
        }
        if (!inOrbit && btnZone && pull > 0.85) {
          var edge = Math.floor(Math.random() * 4);
          if (edge === 0)      { p.ox = Math.random() * w; p.oy = -10; }
          else if (edge === 1) { p.ox = w + 10;            p.oy = Math.random() * h; }
          else if (edge === 2) { p.ox = Math.random() * w; p.oy = h + 10; }
          else                 { p.ox = -10;               p.oy = Math.random() * h; }
          p.x = p.ox; p.y = p.oy;
          p.vx = p.vy = 0;
        }
        p.tw += p.ts;
        /* depthAlpha gives the atmospheric-perspective falloff — far
           stars dim, near stars bright — while leaving the existing
           twinkle + button-pull alpha math intact. */
        var a = (0.18 + 0.16 * (Math.sin(p.tw) * 0.5 + 0.5) + pull * 0.30) * p.depthAlpha;
        if (a > 1) a = 1;
        var tcr, tcg, tcb;
        if (activeShape === 'video') { tcr = 200; tcg = 195; tcb = 188; }
        else                          { tcr =  61; tcg =  61; tcb = 181; }
        /* Particle base derives from --text-primary in the wrap's
           scope, so on the contact page (light in light mode) this
           is dark text rgb(28,26,23) and particles are dark on light;
           on cta-footer-wrap (always-dark scoping) it stays light
           cream rgb(240,237,232). Indexed access avoids shadowing
           an outer `bg` var. */
        var cr = Math.round(PARTICLE_BASE[0] + (tcr - PARTICLE_BASE[0]) * pull);
        var cg = Math.round(PARTICLE_BASE[1] + (tcg - PARTICLE_BASE[1]) * pull);
        var cb = Math.round(PARTICLE_BASE[2] + (tcb - PARTICLE_BASE[2]) * pull);
        /* depthScale multiplies the radius — far stars smaller, near
           stars larger. Layered on top of the existing button-pull
           radius bump so cursor-near particles still grow. */
        var rr = p.r * p.depthScale * (1 + pull * 0.4);
        ctx.fillStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',' + a + ')';
        /* Per-depth parallax offset added at DRAW time (not stored on
           the particle) so the physics (drift, button-pull, velocity)
           still works against the un-offset origin. The visual layers
           just slide; the simulation stays in place. */
        var di = p.depth - 1;
        var px = p.x + depthDX[di];
        var py = p.y + depthDY[di];
        if (pull > 0.02 && btnZone) {
          var pdx = btnZone.cx - p.x, pdy = btnZone.cy - p.y;
          var ang = Math.atan2(pdy, pdx);
          var stretch = 1 + pull * 1.3;
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(ang);
          ctx.beginPath();
          ctx.ellipse(0, 0, rr * stretch, rr, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(px, py, rr, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      velX *= 0.7; velY *= 0.7;
      if (inView && tabVisible && !reduced) raf = requestAnimationFrame(frame);
    }

    function loop() { if (!raf && !reduced) raf = requestAnimationFrame(frame); }

    var resizeTimer;
    var ro = window.ResizeObserver
      ? new ResizeObserver(function () {
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(resize, 80);
        })
      : null;
    if (ro) ro.observe(wrap);
    else window.addEventListener('resize', function () {
      clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 80);
    });

    document.addEventListener('visibilitychange', function () {
      tabVisible = document.visibilityState === 'visible';
      if (tabVisible) loop();
    });
    /* Defer the first paint past the pill-nav cross-page slide (~320ms).
       buildBackground() is a per-pixel canvas paint with FBM noise that
       can block the main thread for 100-300ms — running it during the
       nav transition makes the slide stutter visibly.
       But: if the user scrolls quickly enough that the wrap enters view
       BEFORE the idle callback fires, the un-painted canvas reveals the
       wrap's CSS background-color (a dark grey on cta-footer-wrap),
       flashing for a frame or two before the deferred paint runs.
       The IntersectionObserver below force-runs firstPaint synchronously
       in that case, so a fast scroll always sees a painted canvas. */
    var firstPaintDone = false;
    var firstPaint = function () {
      if (firstPaintDone) return;
      firstPaintDone = true;
      resize();
      loop();
    };
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (es) {
        inView = es[0].isIntersecting;
        if (inView) {
          firstPaint(); // synchronously paint if the deferred call hasn't run yet
          loop();
        }
      }, { threshold: 0 }).observe(wrap);
    }
    if (window.requestIdleCallback) {
      window.requestIdleCallback(firstPaint, { timeout: 800 });
    } else {
      setTimeout(firstPaint, 380);
    }
  }
})();
