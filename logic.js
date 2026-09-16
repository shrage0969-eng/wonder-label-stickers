(function (root) {
  function normalize(value) {
    return String(value || '').trim().toLowerCase().replace(/[\s\-׳׳']/g, '');
  }

  function filterRecipients(recipients, section, filter) {
    const query = normalize(filter);
    return recipients.filter((recipient) => {
      if (section === 'printed' ? !recipient.printed : recipient.printed) return false;
      return !query || [recipient.name, recipient.city, recipient.street, recipient.num, recipient.apt]
        .some((value) => normalize(value).includes(query));
    });
  }

  function updateSelection(selected, rows, checked) {
    const next = new Set(selected);
    rows.forEach((row) => {
      if (checked) next.add(String(row.id));
      else next.delete(String(row.id));
    });
    return next;
  }

  function paginate(items, pageSize) {
    const pages = [];
    for (let index = 0; index < items.length; index += pageSize) pages.push(items.slice(index, index + pageSize));
    return pages;
  }

  function buildRecipientPayload(values, userId, isEdit) {
    const payload = {
      full_name: String(values.name || '').trim(), city: String(values.city || '').trim(),
      street: String(values.street || '').trim(), house_number: String(values.num || '').trim(),
      apartment: String(values.apt || '').trim()
    };
    if (!isEdit) {
      payload.printed = false;
      payload.user_id = userId;
    }
    return payload;
  }

  root.StickerLogic = { normalize, filterRecipients, updateSelection, paginate, buildRecipientPayload };
  if (typeof module !== 'undefined') module.exports = root.StickerLogic;
})(typeof window !== 'undefined' ? window : globalThis);

/* Wonder Label preferences — intentionally local to this browser for now. */
(function () {
  const KEY = 'wonderLabelSettingsV1';
  const DEFAULTS = {
    printConfirmation: true,
    confirmDelete: true,
    keepPrintedCollapsed: true,
    compactTables: false,
    rememberLastCity: true,
    defaultCity: 'בית שמש',
    lastCity: ''
  };

  function readSettings() {
    try {
      return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(KEY) || '{}') || {}) };
    } catch {
      return { ...DEFAULTS };
    }
  }

  function writeSettings(next) {
    const merged = { ...DEFAULTS, ...next };
    localStorage.setItem(KEY, JSON.stringify(merged));
    return merged;
  }

  function setCompact(on) {
    document.body.classList.toggle('wm-compact', !!on);
  }

  function injectStyles() {
    if (document.getElementById('wmSettingsStyles')) return;
    const style = document.createElement('style');
    style.id = 'wmSettingsStyles';
    style.textContent = `
      .settings-nav{margin-top:5px}
      .nav button.settings-nav-btn{color:#a9bddb}
      .nav button.settings-nav-btn.active{background:rgba(112,164,241,.20);color:#fff}
      .settings-wrap{max-width:920px}
      .settings-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
      .settings-card{padding:18px 19px;background:#fff;border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow)}
      .settings-card h2{margin:0;color:var(--navy);font-size:16px;letter-spacing:-.2px}
      .settings-card p{margin:5px 0 14px;color:var(--muted);font-size:12px}
      .setting-row{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:13px 0;border-top:1px solid var(--line-soft)}
      .setting-row:first-child{border-top:0;padding-top:0}
      .setting-copy{min-width:0}.setting-name{display:block;color:var(--ink);font-size:13px;font-weight:750}.setting-desc{display:block;margin-top:3px;color:var(--muted);font-size:11px;line-height:1.4}
      .wm-switch{position:relative;display:inline-flex;flex:0 0 auto}
      .wm-switch input{position:absolute;opacity:0;pointer-events:none}
      .wm-switch span{width:42px;height:24px;border-radius:99px;background:#cfd8e6;box-shadow:inset 0 0 0 1px #bcc8d9;cursor:pointer;transition:.18s ease;position:relative}
      .wm-switch span:after{content:"";position:absolute;width:18px;height:18px;top:3px;left:3px;border-radius:50%;background:#fff;box-shadow:0 2px 5px rgba(18,33,61,.18);transition:.18s ease}
      .wm-switch input:checked + span{background:var(--blue);box-shadow:inset 0 0 0 1px var(--blue)}
      .wm-switch input:checked + span:after{transform:translateX(18px)}
      .wm-select{width:100%;padding:10px 12px;border:1px solid #ced9e8;border-radius:9px;background:#fff;color:var(--ink);font:inherit;font-size:13px}
      .settings-footer{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:16px;padding:14px 16px;border:1px dashed #cad7e8;border-radius:12px;background:#f8fbff;color:var(--muted);font-size:12px}
      .settings-footer b{color:var(--navy)}
      .settings-reset{font:inherit;border:0;background:transparent;color:var(--blue);font-weight:750;cursor:pointer}
      .wm-compact .panel-table th,.wm-compact .panel-table td{padding-top:8px;padding-bottom:8px;font-size:12px}
      .wm-compact .recipient-panel .panel-head{padding-top:15px;padding-bottom:11px}
      .wm-compact .panel-actions{padding-top:9px;padding-bottom:9px}
      .wm-compact .printed-toggle{padding-top:12px;padding-bottom:12px}
      @media(max-width:720px){.settings-grid{grid-template-columns:1fr}.settings-footer{align-items:flex-start;flex-direction:column}}
    `;
    document.head.appendChild(style);
  }

  function makeToggle(id, checked, label, description) {
    return `<div class="setting-row"><div class="setting-copy"><span class="setting-name">${label}</span><span class="setting-desc">${description}</span></div><label class="wm-switch"><input id="${id}" type="checkbox" ${checked ? 'checked' : ''}><span></span></label></div>`;
  }

  function ensureSettingsUi() {
    if (document.getElementById('settings')) return;
    const nav = document.querySelector('.nav');
    const main = document.querySelector('main.main');
    if (!nav || !main) return;

    const button = document.createElement('button');
    button.className = 'settings-nav-btn';
    button.textContent = '⚙ Settings';
    button.type = 'button';
    button.onclick = () => window.show('settings', button);
    nav.appendChild(button);

    const section = document.createElement('section');
    section.id = 'settings';
    section.style.display = 'none';
    section.innerHTML = `
      <div class="top"><div><h1>Settings</h1><div class="muted">Personal preferences for how Wonder Label works.</div></div></div>
      <div class="settings-wrap">
        <div class="settings-grid">
          <div class="settings-card">
            <h2>Printing</h2>
            <p>Choose how hands-on you want the print workflow to be.</p>
            ${makeToggle('settingPrintConfirmation', true, 'Confirm successful printing', 'After the print dialog closes, ask whether the labels really printed before moving them to Printed.')}
          </div>
          <div class="settings-card">
            <h2>Daily workflow</h2>
            <p>Small preferences that make routine mailing faster.</p>
            ${makeToggle('settingRememberLastCity', true, 'Remember last city', 'Use the most recently entered city the next time you add a recipient.')}
            ${makeToggle('settingKeepPrintedCollapsed', true, 'Keep Printed collapsed', 'Return to Home with the completed history section closed.')}
            ${makeToggle('settingCompactTables', false, 'Compact tables', 'Use tighter rows so more recipients fit on screen.')}
            ${makeToggle('settingConfirmDelete', true, 'Confirm before deleting', 'Ask for confirmation before deleting recipients.')}
          </div>
          <div class="settings-card">
            <h2>Default city</h2>
            <p>Choose the city shown when you start a new recipient.</p>
            <select id="settingDefaultCity" class="wm-select rtl">
              <option value="">No default city</option>
              <option value="בית שמש">בית שמש</option>
              <option value="ירושלים">ירושלים</option>
              <option value="ביתר עילית">ביתר עילית</option>
              <option value="בני ברק">בני ברק</option>
              <option value="מודיעין עילית">מודיעין עילית</option>
              <option value="רמת גן">רמת גן</option>
              <option value="פתח תקווה">פתח תקווה</option>
              <option value="אשדוד">אשדוד</option>
              <option value="חיפה">חיפה</option>
              <option value="נתניה">נתניה</option>
              <option value="אלעד">אלעד</option>
              <option value="טבריה">טבריה</option>
              <option value="צפת">צפת</option>
              <option value="באר שבע">באר שבע</option>
            </select>
          </div>
          <div class="settings-card">
            <h2>Smart ideas</h2>
            <p>Useful preferences we can expand later without cluttering the main screen.</p>
            <div class="setting-row"><div class="setting-copy"><span class="setting-name">Customer history autocomplete</span><span class="setting-desc">Already active: names from your own saved recipients can fill their address automatically.</span></div><span class="status printed">Active</span></div>
            <div class="setting-row"><div class="setting-copy"><span class="setting-name">Israeli street suggestions</span><span class="setting-desc">Already active: city-based government street data with manual entry fallback.</span></div><span class="status printed">Active</span></div>
          </div>
        </div>
        <div class="settings-footer"><span><b>Preferences are saved on this browser.</b> We can later move account-level settings into your online profile so they follow you to another computer.</span><button class="settings-reset" type="button" id="resetSettings">Reset preferences</button></div>
      </div>`;
    main.appendChild(section);

    const settings = readSettings();
    document.getElementById('settingPrintConfirmation').checked = settings.printConfirmation;
    document.getElementById('settingConfirmDelete').checked = settings.confirmDelete;
    document.getElementById('settingKeepPrintedCollapsed').checked = settings.keepPrintedCollapsed;
    document.getElementById('settingCompactTables').checked = settings.compactTables;
    document.getElementById('settingRememberLastCity').checked = settings.rememberLastCity;
    document.getElementById('settingDefaultCity').value = settings.defaultCity || '';
    setCompact(settings.compactTables);

    function update(key, value) {
      const next = writeSettings({ ...readSettings(), [key]: value });
      setCompact(next.compactTables);
    }

    document.getElementById('settingPrintConfirmation').onchange = e => update('printConfirmation', e.target.checked);
    document.getElementById('settingConfirmDelete').onchange = e => update('confirmDelete', e.target.checked);
    document.getElementById('settingKeepPrintedCollapsed').onchange = e => update('keepPrintedCollapsed', e.target.checked);
    document.getElementById('settingCompactTables').onchange = e => update('compactTables', e.target.checked);
    document.getElementById('settingRememberLastCity').onchange = e => update('rememberLastCity', e.target.checked);
    document.getElementById('settingDefaultCity').onchange = e => update('defaultCity', e.target.value);
    document.getElementById('resetSettings').onclick = () => {
      const next = writeSettings(DEFAULTS);
      document.getElementById('settingPrintConfirmation').checked = next.printConfirmation;
      document.getElementById('settingConfirmDelete').checked = next.confirmDelete;
      document.getElementById('settingKeepPrintedCollapsed').checked = next.keepPrintedCollapsed;
      document.getElementById('settingCompactTables').checked = next.compactTables;
      document.getElementById('settingRememberLastCity').checked = next.rememberLastCity;
      document.getElementById('settingDefaultCity').value = next.defaultCity;
      setCompact(next.compactTables);
    };
  }

  function installBehaviorHooks() {
    if (window.__wonderLabelSettingsInstalled) return;
    window.__wonderLabelSettingsInstalled = true;

    const originalStartNew = window.startNew;
    if (typeof originalStartNew === 'function') {
      window.startNew = function () {
        originalStartNew();
        const s = readSettings();
        const city = s.rememberLastCity && s.lastCity ? s.lastCity : s.defaultCity;
        if (city && document.getElementById('city')) {
          document.getElementById('city').value = city;
          if (typeof window.loadStreetsForCity === 'function') window.loadStreetsForCity(city).catch(() => {});
        }
      };
    }

    const originalDoPrint = window.doPrint;
    if (typeof originalDoPrint === 'function') {
      window.doPrint = function () {
        if (readSettings().printConfirmation) return originalDoPrint();
        if (!Array.isArray(window.__wonderLabelPendingPrint)) return originalDoPrint();
        window.print();
        setTimeout(() => {
          if (typeof window.confirmPrinted === 'function') window.confirmPrinted();
        }, 50);
      };
    }

    const originalShow = window.show;
    if (typeof originalShow === 'function') {
      window.show = function (id, btn) {
        originalShow(id, btn);
        const s = readSettings();
        if (id === 'home' && s.keepPrintedCollapsed) document.getElementById('printedPanel')?.classList.remove('open');
        if (id === 'settings') {
          ensureSettingsUi();
          document.querySelectorAll('.nav button').forEach(x => x.classList.remove('active'));
          document.querySelector('.settings-nav-btn')?.classList.add('active');
        }
      };
    }

    const originalDelete = window.deleteSectionSelected;
    if (typeof originalDelete === 'function') {
      window.deleteSectionSelected = function (section) {
        const s = readSettings();
        if (s.confirmDelete) return originalDelete(section);
        const selectedIds = typeof window.ids === 'function' ? window.ids(section) : [];
        if (!selectedIds.length) return alert('Select recipients first.');
        if (typeof window.runBulk === 'function') return window.runBulk(section, 'DELETE', null, n => `${n} recipient${n === 1 ? '' : 's'} deleted.`);
        return originalDelete(section);
      };
    }

    const city = document.getElementById('city');
    if (city) {
      city.addEventListener('change', () => {
        const s = readSettings();
        if (s.rememberLastCity) writeSettings({ ...s, lastCity: city.value.trim() });
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    injectStyles();
    ensureSettingsUi();
    installBehaviorHooks();
  });
})();
