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

/* Wonder Label settings center. Preferences intentionally remain local to this browser for now. */
(function () {
  const KEY = 'wonderLabelSettingsV2';
  const DEFAULTS = {
    printConfirmation: true,
    confirmDelete: true,
    keepPrintedCollapsed: true,
    compactTables: false,
    rememberLastCity: true,
    focusNameOnAdd: true,
    defaultCity: '',
    lastCity: ''
  };

  function readSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
      return { ...DEFAULTS, ...(saved && typeof saved === 'object' ? saved : {}) };
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
      .settings-wrap{max-width:1000px}
      .settings-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
      .settings-card{padding:21px;background:linear-gradient(180deg,#fff 0%,#fbfdff 100%);border:1px solid var(--line);border-radius:15px;box-shadow:0 10px 28px rgba(24,42,72,.055)}
      .settings-card h2{margin:0;color:var(--navy);font-size:17px;letter-spacing:-.25px}
      .settings-card > p{margin:6px 0 16px;color:var(--muted);font-size:12px;line-height:1.5}
      .wl-setting-row{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:14px 0;border-top:1px solid var(--line-soft);cursor:pointer}
      .wl-setting-row:first-of-type{border-top:0;padding-top:0}
      .wl-setting-copy{min-width:0;flex:1}
      .wl-setting-name{display:block;color:var(--ink);font-size:13px;font-weight:780;line-height:1.3}
      .wl-setting-desc{display:block;margin-top:4px;color:var(--muted);font-size:11px;line-height:1.45}
      .wl-setting-row:hover .wl-setting-name{color:var(--navy)}
      .wm-switch{position:relative;display:inline-flex;flex:0 0 auto}
      .wm-switch input{position:absolute;opacity:0;pointer-events:none}
      .wm-switch span{width:44px;height:25px;border-radius:99px;background:#cfd8e6;box-shadow:inset 0 0 0 1px #bcc8d9;position:relative;transition:background .18s ease,box-shadow .18s ease}
      .wm-switch span:after{content:"";position:absolute;width:19px;height:19px;top:3px;left:3px;border-radius:50%;background:#fff;box-shadow:0 2px 5px rgba(18,33,61,.18);transition:transform .18s ease}
      .wm-switch input:checked + span{background:var(--blue);box-shadow:inset 0 0 0 1px var(--blue)}
      .wm-switch input:checked + span:after{transform:translateX(19px)}
      .wm-switch input:focus-visible + span{outline:3px solid rgba(69,135,234,.22);outline-offset:2px}
      .wm-select{width:100%;padding:11px 12px;border:1px solid #ced9e8;border-radius:9px;background:#fff;color:var(--ink);font:inherit;font-size:13px;transition:border-color .18s ease,box-shadow .18s ease}
      .wm-select:focus{border-color:#4d83d8;box-shadow:0 0 0 3px rgba(77,131,216,.12);outline:0}
      .settings-note{display:flex;align-items:flex-start;gap:10px;margin-top:9px;padding:10px 12px;border:1px solid #d9e6f3;border-radius:10px;background:#f7fbff;color:#5d7088;font-size:11px;line-height:1.45}
      .settings-note strong{color:var(--navy);flex:0 0 auto}
      .settings-status{display:inline-flex;align-items:center;gap:6px;flex:0 0 auto;padding:4px 8px;border:1px solid #ccead8;border-radius:99px;background:var(--green-soft);color:var(--green);font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em}
      .settings-footer{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-top:18px;padding:14px 16px;border:1px dashed #cbd8e7;border-radius:12px;background:#f8fbff;color:var(--muted);font-size:12px;line-height:1.45}
      .settings-footer b{color:var(--navy)}
      .settings-reset{font:inherit;border:1px solid #d5e0ec;border-radius:8px;background:#fff;color:#36506f;padding:8px 11px;font-weight:750;cursor:pointer;white-space:nowrap;transition:background .18s ease,border-color .18s ease,transform .18s ease}
      .settings-reset:hover{background:#f8fbff;border-color:#b9c9dc;transform:translateY(-1px)}
      .wm-compact .panel-table th,.wm-compact .panel-table td{padding-top:8px;padding-bottom:8px;font-size:12px}
      .wm-compact .recipient-panel .panel-head{padding-top:15px;padding-bottom:11px}
      .wm-compact .panel-actions{padding-top:9px;padding-bottom:9px}
      .wm-compact .printed-toggle{padding-top:12px;padding-bottom:12px}
      @media(max-width:760px){.settings-grid{grid-template-columns:1fr}.settings-footer{align-items:flex-start;flex-direction:column}.settings-reset{align-self:flex-start}}
    `;
    document.head.appendChild(style);
  }

  function toggleMarkup(id, checked, label, description) {
    return `<label class="wl-setting-row"><span class="wl-setting-copy"><span class="wl-setting-name">${label}</span><span class="wl-setting-desc">${description}</span></span><span class="wm-switch"><input id="${id}" type="checkbox" ${checked ? 'checked' : ''}><span aria-hidden="true"></span></span></label>`;
  }

  const cityOptions = [
    ['', 'No default city'], ['בית שמש', 'בית שמש'], ['ירושלים', 'ירושלים'], ['ביתר עילית', 'ביתר עילית'],
    ['בני ברק', 'בני ברק'], ['מודיעין עילית', 'מודיעין עילית'], ['רמת גן', 'רמת גן'], ['פתח תקווה', 'פתח תקווה'],
    ['אשדוד', 'אשדוד'], ['חיפה', 'חיפה'], ['נתניה', 'נתניה'], ['אלעד', 'אלעד'], ['טבריה', 'טבריה'],
    ['צפת', 'צפת'], ['באר שבע', 'באר שבע'], ['תל אביב-יפו', 'תל אביב-יפו']
  ];

  function renderSettingsSection() {
    const main = document.querySelector('main.main');
    const nav = document.querySelector('.nav');
    if (!main || !nav) return;

    let button = nav.querySelector('.settings-nav-btn');
    if (!button) {
      button = document.createElement('button');
      button.className = 'settings-nav-btn';
      button.type = 'button';
      button.textContent = '⚙ Settings';
      button.onclick = () => window.show('settings', button);
      nav.appendChild(button);
    }

    let section = document.getElementById('settings');
    if (!section) {
      section = document.createElement('section');
      section.id = 'settings';
      section.style.display = 'none';
      main.appendChild(section);
    }

    const selectedOptions = cityOptions.map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
    section.innerHTML = `
      <div class="top"><div><h1>Settings</h1><div class="muted">Personal preferences for how Wonder Label works.</div></div></div>
      <div class="settings-wrap">
        <div class="settings-grid">
          <div class="settings-card">
            <h2>Printing</h2>
            <p>Choose how much control you want after sending labels to the printer.</p>
            ${toggleMarkup('settingPrintConfirmation', true, 'Confirm successful printing', 'After the print dialog closes, ask whether the labels really printed before moving them to Printed.')}
            <div class="settings-note"><strong>Recommended</strong><span>Keep this on when working with physical label sheets. Turn it off when you prefer a faster hands-off workflow.</span></div>
          </div>

          <div class="settings-card">
            <h2>Daily workflow</h2>
            <p>Small conveniences that make repeated mailing work faster and safer.</p>
            ${toggleMarkup('settingConfirmDelete', true, 'Confirm before deleting', 'Protect against accidentally deleting recipients from either queue.')}
            ${toggleMarkup('settingRememberLastCity', true, 'Remember last city', 'Reuse the most recently entered city when starting another recipient.')}
            ${toggleMarkup('settingKeepPrintedCollapsed', true, 'Keep Printed collapsed', 'Keep completed history tucked away when you return to Home.')}
            ${toggleMarkup('settingCompactTables', false, 'Compact tables', 'Tighten table rows so more recipients fit on screen at once.')}
            ${toggleMarkup('settingFocusNameOnAdd', true, 'Focus the Name field', 'Put the cursor in the Name field automatically when Add Recipient opens.')}
          </div>

          <div class="settings-card">
            <h2>New recipient</h2>
            <p>Choose what happens when you start entering a new envelope address.</p>
            <div class="wl-setting-copy" style="padding-bottom:10px"><span class="wl-setting-name">Default city</span><span class="wl-setting-desc">Pre-fill this city for new recipients. Leave it empty if you do not want a fixed default.</span></div>
            <select id="settingDefaultCity" class="wm-select rtl" aria-label="Default city">${selectedOptions}</select>
            <div class="settings-note"><strong>Smart entry</strong><span>Your saved customer-history suggestions and city-based street suggestions continue to work automatically.</span></div>
          </div>

          <div class="settings-card">
            <h2>Smart features</h2>
            <p>These features are already built into Wonder Label and need no setup.</p>
            <div class="wl-setting-row" style="cursor:default"><span class="wl-setting-copy"><span class="wl-setting-name">Customer history autocomplete</span><span class="wl-setting-desc">Start typing a saved customer's name and reuse the address already in your account.</span></span><span class="settings-status">Active</span></div>
            <div class="wl-setting-row" style="cursor:default"><span class="wl-setting-copy"><span class="wl-setting-name">Israeli street suggestions</span><span class="wl-setting-desc">Street suggestions follow the selected city, with manual entry available when the data service is unavailable.</span></span><span class="settings-status">Active</span></div>
            <div class="settings-note"><strong>Next</strong><span>Label calibration, printer defaults, CSV import/export, keyboard shortcuts, and other power-user tools can live here later.</span></div>
          </div>
        </div>
        <div class="settings-footer"><span><b>Preferences are saved on this browser.</b> They currently stay with this browser/device. Later we can move account-level preferences into Supabase so they follow you between computers.</span><button class="settings-reset" type="button" id="resetSettings">Reset preferences</button></div>
      </div>`;

    bindSettings();
  }

  function bindSettings() {
    const s = readSettings();
    const controls = {
      printConfirmation: document.getElementById('settingPrintConfirmation'),
      confirmDelete: document.getElementById('settingConfirmDelete'),
      keepPrintedCollapsed: document.getElementById('settingKeepPrintedCollapsed'),
      compactTables: document.getElementById('settingCompactTables'),
      rememberLastCity: document.getElementById('settingRememberLastCity'),
      focusNameOnAdd: document.getElementById('settingFocusNameOnAdd'),
      defaultCity: document.getElementById('settingDefaultCity')
    };

    controls.printConfirmation.checked = s.printConfirmation;
    controls.confirmDelete.checked = s.confirmDelete;
    controls.keepPrintedCollapsed.checked = s.keepPrintedCollapsed;
    controls.compactTables.checked = s.compactTables;
    controls.rememberLastCity.checked = s.rememberLastCity;
    controls.focusNameOnAdd.checked = s.focusNameOnAdd;
    controls.defaultCity.value = s.defaultCity || '';
    setCompact(s.compactTables);

    Object.entries(controls).forEach(([key, control]) => {
      control.addEventListener('change', () => {
        const next = writeSettings({ ...readSettings(), [key]: control.type === 'checkbox' ? control.checked : control.value });
        setCompact(next.compactTables);
      });
    });

    document.getElementById('resetSettings').onclick = () => {
      const next = writeSettings(DEFAULTS);
      controls.printConfirmation.checked = next.printConfirmation;
      controls.confirmDelete.checked = next.confirmDelete;
      controls.keepPrintedCollapsed.checked = next.keepPrintedCollapsed;
      controls.compactTables.checked = next.compactTables;
      controls.rememberLastCity.checked = next.rememberLastCity;
      controls.focusNameOnAdd.checked = next.focusNameOnAdd;
      controls.defaultCity.value = next.defaultCity;
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
        const cityInput = document.getElementById('city');
        if (city && cityInput) {
          cityInput.value = city;
          if (typeof window.loadStreetsForCity === 'function') window.loadStreetsForCity(city).catch(() => {});
        }
        if (s.focusNameOnAdd) setTimeout(() => document.getElementById('name')?.focus(), 0);
      };
    }

    const originalDoPrint = window.doPrint;
    if (typeof originalDoPrint === 'function') {
      window.doPrint = function () {
        if (readSettings().printConfirmation) return originalDoPrint();
        originalDoPrint();
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
          renderSettingsSection();
          document.querySelectorAll('.nav button').forEach(x => x.classList.remove('active'));
          document.querySelector('.settings-nav-btn')?.classList.add('active');
        }
      };
    }

    const originalDelete = window.deleteSectionSelected;
    if (typeof originalDelete === 'function') {
      window.deleteSectionSelected = function (section) {
        if (readSettings().confirmDelete) return originalDelete(section);
        const selectedIds = typeof window.ids === 'function' ? window.ids(section) : [];
        if (!selectedIds.length) return alert('Select recipients first.');
        if (typeof window.runBulk === 'function') return window.runBulk(section, 'DELETE', null, n => `${n} recipient${n === 1 ? '' : 's'} deleted.`);
        return originalDelete(section);
      };
    }

    const cityInput = document.getElementById('city');
    if (cityInput) {
      cityInput.addEventListener('change', () => {
        const s = readSettings();
        if (s.rememberLastCity) writeSettings({ ...s, lastCity: cityInput.value.trim() });
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    injectStyles();
    renderSettingsSection();
    setCompact(readSettings().compactTables);
    installBehaviorHooks();
  });
})();
