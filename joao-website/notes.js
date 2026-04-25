(function () {
  if (!new URLSearchParams(location.search).has('notes')) return;

  const KEY = `jj-notes:${location.pathname}`;
  let notes = [];
  try { notes = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (_) { notes = []; }

  let addMode = false;
  let openPopupId = null;

  const css = `
    .jjn-toolbar {
      position: fixed; right: 16px; bottom: 16px; z-index: 2147483646;
      display: flex; gap: 6px; padding: 6px;
      background: #1C1A17; color: #F0EDE8;
      border-radius: 999px; box-shadow: 0 8px 24px rgba(0,0,0,.25);
      font: 500 12px/1 'DM Sans', system-ui, sans-serif;
    }
    .jjn-toolbar button {
      appearance: none; border: 0; cursor: pointer;
      background: transparent; color: inherit;
      padding: 8px 12px; border-radius: 999px;
      font: inherit; letter-spacing: .02em;
    }
    .jjn-toolbar button:hover { background: rgba(255,255,255,.1); }
    .jjn-toolbar button.is-active { background: #3D3DB5; color: #fff; }
    .jjn-toolbar .jjn-count {
      align-self: center; padding: 0 8px; opacity: .7; font-variant-numeric: tabular-nums;
    }
    .jjn-pin {
      position: absolute; z-index: 2147483645;
      width: 26px; height: 26px; border-radius: 999px;
      background: #3D3DB5; color: #fff;
      display: grid; place-items: center;
      font: 700 12px/1 'DM Sans', system-ui, sans-serif;
      box-shadow: 0 4px 10px rgba(61,61,181,.4), 0 0 0 3px rgba(255,255,255,.9);
      cursor: pointer; transform: translate(-50%, -50%);
      user-select: none;
    }
    .jjn-pin:hover { transform: translate(-50%, -50%) scale(1.1); }
    .jjn-popup {
      position: absolute; z-index: 2147483647;
      width: 260px; padding: 12px;
      background: #fff; color: #1C1A17;
      border: 1px solid rgba(0,0,0,.08); border-radius: 12px;
      box-shadow: 0 12px 32px rgba(0,0,0,.18);
      font: 14px/1.4 'DM Sans', system-ui, sans-serif;
      transform: translate(16px, -50%);
    }
    .jjn-popup textarea {
      width: 100%; min-height: 80px; resize: vertical;
      padding: 8px; border: 1px solid rgba(0,0,0,.12); border-radius: 8px;
      font: inherit; box-sizing: border-box; outline: none;
    }
    .jjn-popup textarea:focus { border-color: #3D3DB5; }
    .jjn-popup-row { display: flex; gap: 6px; margin-top: 8px; justify-content: flex-end; }
    .jjn-popup button {
      appearance: none; border: 0; cursor: pointer;
      padding: 6px 10px; border-radius: 8px;
      font: 500 12px/1 inherit;
    }
    .jjn-popup .jjn-save { background: #3D3DB5; color: #fff; }
    .jjn-popup .jjn-del { background: transparent; color: #b00; }
    .jjn-popup .jjn-close { background: rgba(0,0,0,.06); color: #1C1A17; }
    body.jjn-adding, body.jjn-adding * { cursor: crosshair !important; }
    body.jjn-hidden .jjn-pin, body.jjn-hidden .jjn-popup { display: none; }
  `;
  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  const toolbar = document.createElement('div');
  toolbar.className = 'jjn-toolbar';
  toolbar.innerHTML = `
    <button data-act="add">+ Pin</button>
    <button data-act="sync" title="Write notes to a local .md file so Claude Code can read them">Sync</button>
    <button data-act="toggle">Hide</button>
    <button data-act="export">Export</button>
    <button data-act="clear">Clear</button>
    <span class="jjn-count"></span>
  `;
  document.body.appendChild(toolbar);

  const IDB_NAME = 'jjn';
  const IDB_STORE = 'handles';
  const HANDLE_KEY = `notes-md:${location.pathname}`;
  let syncHandle = null;

  function idbOpen() {
    return new Promise((res, rej) => {
      const r = indexedDB.open(IDB_NAME, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(IDB_STORE);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  async function idbGet(k) {
    const db = await idbOpen();
    return new Promise(res => {
      const r = db.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).get(k);
      r.onsuccess = () => res(r.result);
      r.onerror = () => res(null);
    });
  }
  async function idbSet(k, v) {
    const db = await idbOpen();
    return new Promise(res => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(v, k);
      tx.oncomplete = () => res();
      tx.onerror = () => res();
    });
  }

  function renderMarkdown() {
    const head = `# Notes for ${location.pathname}\n\n_Updated ${new Date().toISOString()}_\n\n`;
    if (!notes.length) return head + '(no notes)\n';
    const lines = notes.map((n, i) => `${i + 1}. (${Math.round(n.x)}, ${Math.round(n.y)}) — ${n.text || '(empty)'}`);
    return head + lines.join('\n') + '\n';
  }

  function updateSyncBtn() {
    const btn = toolbar.querySelector('[data-act="sync"]');
    if (syncHandle) {
      btn.textContent = '✓ Synced';
      btn.classList.add('is-active');
    } else {
      btn.textContent = 'Sync';
      btn.classList.remove('is-active');
    }
  }

  async function writeToFile() {
    if (!syncHandle) return;
    try {
      const w = await syncHandle.createWritable();
      await w.write(renderMarkdown());
      await w.close();
    } catch (err) {
      console.warn('[notes] write failed', err);
      syncHandle = null;
      updateSyncBtn();
    }
  }

  async function startSync() {
    if (!('showSaveFilePicker' in window)) {
      alert('File sync needs Chrome or Edge (File System Access API).');
      return;
    }
    const stored = await idbGet(HANDLE_KEY);
    if (stored) {
      const perm = await stored.queryPermission({ mode: 'readwrite' });
      if (perm === 'granted' || (await stored.requestPermission({ mode: 'readwrite' })) === 'granted') {
        syncHandle = stored;
        updateSyncBtn();
        await writeToFile();
        return;
      }
    }
    try {
      const h = await window.showSaveFilePicker({
        suggestedName: 'notes.md',
        types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md'] } }],
      });
      await idbSet(HANDLE_KEY, h);
      syncHandle = h;
      updateSyncBtn();
      await writeToFile();
    } catch (_) {}
  }

  async function tryResumeSync() {
    const stored = await idbGet(HANDLE_KEY);
    if (!stored) return;
    if ((await stored.queryPermission({ mode: 'readwrite' })) === 'granted') {
      syncHandle = stored;
      updateSyncBtn();
      await writeToFile();
    }
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(notes));
    render();
    writeToFile();
  }

  function render() {
    document.querySelectorAll('.jjn-pin, .jjn-popup').forEach(n => n.remove());
    notes.forEach((n, i) => {
      const pin = document.createElement('div');
      pin.className = 'jjn-pin';
      pin.style.left = n.x + 'px';
      pin.style.top = n.y + 'px';
      pin.textContent = i + 1;
      pin.dataset.id = n.id;
      pin.title = n.text || '(empty)';
      document.body.appendChild(pin);
    });
    toolbar.querySelector('.jjn-count').textContent = notes.length ? `${notes.length} note${notes.length === 1 ? '' : 's'}` : '';
    if (openPopupId != null) {
      const note = notes.find(n => n.id === openPopupId);
      if (note) openPopup(note);
    }
  }

  function openPopup(note) {
    document.querySelectorAll('.jjn-popup').forEach(n => n.remove());
    const pop = document.createElement('div');
    pop.className = 'jjn-popup';
    pop.style.left = note.x + 'px';
    pop.style.top = note.y + 'px';
    pop.innerHTML = `
      <textarea placeholder="Note..."></textarea>
      <div class="jjn-popup-row">
        <button class="jjn-del" data-act="del">Delete</button>
        <button class="jjn-close" data-act="close">Close</button>
        <button class="jjn-save" data-act="save">Save</button>
      </div>
    `;
    const ta = pop.querySelector('textarea');
    ta.value = note.text || '';
    document.body.appendChild(pop);
    setTimeout(() => ta.focus(), 0);
    openPopupId = note.id;

    pop.addEventListener('click', (e) => {
      const act = e.target.dataset.act;
      if (act === 'save') {
        note.text = ta.value;
        openPopupId = null;
        save();
      } else if (act === 'del') {
        notes = notes.filter(n => n.id !== note.id);
        openPopupId = null;
        save();
      } else if (act === 'close') {
        openPopupId = null;
        pop.remove();
      }
    });
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        note.text = ta.value;
        openPopupId = null;
        save();
      }
    });
  }

  toolbar.addEventListener('click', (e) => {
    const act = e.target.dataset.act;
    if (act === 'add') {
      addMode = !addMode;
      document.body.classList.toggle('jjn-adding', addMode);
      e.target.classList.toggle('is-active', addMode);
    } else if (act === 'toggle') {
      const hidden = document.body.classList.toggle('jjn-hidden');
      e.target.textContent = hidden ? 'Show' : 'Hide';
    } else if (act === 'sync') {
      startSync();
    } else if (act === 'export') {
      navigator.clipboard.writeText(renderMarkdown()).then(() => {
        e.target.textContent = 'Copied!';
        setTimeout(() => { e.target.textContent = 'Export'; }, 1200);
      });
    } else if (act === 'clear') {
      if (notes.length && confirm(`Clear all ${notes.length} notes for this page?`)) {
        notes = [];
        openPopupId = null;
        save();
      }
    }
  });

  document.addEventListener('click', (e) => {
    if (e.target.closest('.jjn-toolbar') || e.target.closest('.jjn-popup')) return;

    const pin = e.target.closest('.jjn-pin');
    if (pin) {
      e.preventDefault();
      e.stopPropagation();
      const note = notes.find(n => String(n.id) === pin.dataset.id);
      if (note) openPopup(note);
      return;
    }

    if (addMode) {
      e.preventDefault();
      e.stopPropagation();
      const note = { id: Date.now(), x: e.pageX, y: e.pageY, text: '' };
      notes.push(note);
      addMode = false;
      document.body.classList.remove('jjn-adding');
      toolbar.querySelector('[data-act="add"]').classList.remove('is-active');
      openPopupId = note.id;
      save();
    } else if (openPopupId != null) {
      openPopupId = null;
      document.querySelectorAll('.jjn-popup').forEach(n => n.remove());
    }
  }, true);

  render();
  tryResumeSync();
})();
