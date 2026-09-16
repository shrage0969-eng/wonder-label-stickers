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

  function enhanceBranding() {
    const sidebarLogo = document.querySelector('.side .logo');
    const authLogo = document.querySelector('.auth-logo');
    const brandMarkup = '<span class="wl-brand-symbol" aria-hidden="true">W</span><span class="wl-brand-copy"><strong>Wonder</strong><span>LABEL</span></span>';
    if (sidebarLogo && !sidebarLogo.querySelector('.wl-brand-symbol')) sidebarLogo.innerHTML = brandMarkup;
    if (authLogo && !authLogo.querySelector('.wl-brand-symbol')) authLogo.innerHTML = brandMarkup;
  }

  function injectStyles() {
    if (document.getElementById('wmSettingsStyles')) return;
    const style = document.createElement('style');
    style.id = 'wmSettingsStyles';
    style.textContent = `
      /* --- Wonder Label premium brand system --- */
      :root{
        --wl-navy:#101d35;
        --wl-navy-2:#172b4d;
        --wl-blue:#2f6fd6;
        --wl-blue-soft:#edf4ff;
        --wl-gold:#c69442;
        --wl-gold-soft:#f7eddc;
        --wl-ink:#1e2d45;
        --wl-muted:#68778d;
        --wl-canvas:#f5f3ef;
        --wl-line:#e3e6eb;
      }
      html,body{background:var(--wl-canvas)}
      body{color:var(--wl-ink)}
      .side{
        width:248px;
        padding:29px 16px;
        background:linear-gradient(170deg,#14233f 0%,#0d182c 72%,#0b1526 100%);
        box-shadow:10px 0 34px rgba(13,25,45,.12);
      }
      .logo{
        display:flex;
        align-items:center;
        gap:11px;
        min-height:48px;
        margin:0 10px 23px;
        color:#fff;
        font-family:Georgia,'Times New Roman',serif;
        letter-spacing:0;
      }
      .wl-brand-symbol{
        position:relative;
        display:grid;
        place-items:center;
        flex:0 0 35px;
        width:35px;
        height:35px;
        border:1.5px solid rgba(225,198,148,.88);
        border-radius:9px 9px 9px 3px;
        color:#f3d49d;
        font-family:Georgia,'Times New Roman',serif;
        font-size:17px;
        font-weight:700;
        line-height:1;
        box-shadow:inset 0 0 0 1px rgba(255,255,255,.05),0 3px 10px rgba(0,0,0,.12);
      }
      .wl-brand-symbol:after{
        content:"";
        position:absolute;
        right:-1px;
        bottom:-1px;
        width:9px;
        height:9px;
        border-right:1.5px solid rgba(225,198,148,.88);
        border-bottom:1.5px solid rgba(225,198,148,.88);
        background:#12223d;
        border-radius:0 0 7px 0;
      }
      .wl-brand-copy{display:flex;flex-direction:column;gap:1px;line-height:1}
      .wl-brand-copy strong{
        color:#fff;
        font-family:Georgia,'Times New Roman',serif;
        font-size:22px;
        font-weight:700;
        letter-spacing:-.55px;
      }
      .wl-brand-copy > span{
        color:#d6b170;
        font-family:Inter,ui-sans-serif,system-ui,sans-serif;
        font-size:8px;
        font-weight:800;
        letter-spacing:.28em;
      }
      .auth-logo{
        display:flex;
        align-items:center;
        gap:12px;
        min-height:48px;
        margin-bottom:28px;
        color:var(--navy);
      }
      .auth-logo .wl-brand-symbol{border-color:#c6974c;color:#a8782f;box-shadow:none}
      .auth-logo .wl-brand-symbol:after{background:#fff}
      .auth-logo .wl-brand-copy strong{color:#14213d;font-size:24px}
      .auth-logo .wl-brand-copy > span{color:#b5823a}
      .account{margin:0 10px 28px;padding:14px 0;border-color:rgba(218,231,248,.15);color:#afbed2}
      .account b{color:#f8fbff}
      .nav{gap:6px}
      .nav button{padding:11px 13px;border-radius:10px;color:#b9c8dc;letter-spacing:.005em}
      .nav button.active{background:linear-gradient(90deg,rgba(83,135,215,.24),rgba(83,135,215,.10));border-color:rgba(143,180,236,.22);box-shadow:inset 2px 0 0 #79a8eb}
      .nav button:hover{background:rgba(91,139,209,.13)}
      .logout{margin-top:28px}
      .main{max-width:none;padding:38px 48px 56px;background:var(--wl-canvas)}
      .top{margin-bottom:24px}
      .top h1{font-family:Georgia,'Times New Roman',serif;font-size:32px;font-weight:700;letter-spacing:-.95px;color:#12213c}
      .top .muted{letter-spacing:.01em}
      .btn{border-radius:10px;padding:10px 16px;box-shadow:0 4px 10px rgba(47,111,214,.16)}
      .btn:hover:not(:disabled){box-shadow:0 8px 18px rgba(47,111,214,.22);transform:translateY(-1px)}
      .btn.gray{box-shadow:0 2px 7px rgba(25,39,63,.05)}
      .card,.recipient-panel,.settings-card{
        border-color:#dee3ea;
        box-shadow:0 12px 32px rgba(25,39,63,.065);
      }
      .card{border-radius:15px}
      .recipient-panel{border-radius:15px}
      .panel-head{padding:19px 20px 15px}
      .panel-title h2{font-family:Georgia,'Times New Roman',serif;font-size:20px}
      .panel-count{background:#f1f3f6}
      th{background:#fafbfc}
      .search-hint{color:#6a778b}
      .search-hint b{color:#9b6a20}
      .printed-toggle{padding:16px 19px}
      .printed-toggle:hover{background:#fcfdfc}
      .settings-wrap{max-width:1040px}
      .settings-grid{gap:20px}
      .settings-card{
        padding:22px;
        background:linear-gradient(180deg,#fff 0%,#fcfbf8 100%);
        border-radius:16px;
      }
      .settings-card h2{font-family:Georgia,'Times New Roman',serif;font-size:18px}
      .settings-card > p{max-width:54ch}
      .wl-setting-row{padding:15px 0}
      .wl-setting-name{font-size:13.5px}
      .wl-setting-desc{font-size:11.5px}
      .settings-note{background:#fbf7ef;border-color:#eee1c9}
      .settings-status{background:#eef8f1;border-color:#d0ead9}
      .settings-footer{background:#fbfaf7;border-color:#ddd5c8}
      .settings-reset{border-color:#d8d3ca}
      .auth-wrap{background:radial-gradient(circle at 78% 12%,#e7d9bc 0,transparent 23%),linear-gradient(135deg,#f2f0eb,#f8f8f6)}
      .auth-card{border-color:#ddd9d1;box-shadow:0 28px 64px rgba(30,40,54,.13);border-radius:20px;padding:31px}
      .auth-card h1{font-family:Georgia,'Times New Roman',serif;color:#12213c}
      /* Settings center */
      .settings-nav{margin-top:5px}
      .nav button.settings-nav-btn{color:#b7c7dc}
      .nav button.settings-nav-btn.active{background:linear-gradient(90deg,rgba(198,148,66,.18),rgba(83,135,215,.10));color:#fff;box-shadow:inset 2px 0 0 #d1a15a}
      .settings-wrap{max-width:1040px}
      .settings-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}
      .settings-card{padding:22px;background:linear-gradient(180deg,#fff 0%,#fcfbf8 100%);border:1px solid var(--line);border-radius:16px;box-shadow:0 12px 32px rgba(25,39,63,.065)}
      .settings-card h2{margin:0;color:var(--navy);font-family:Georgia,'Times New Roman',serif;font-size:18px;letter-spacing:-.25px}
      .settings-card > p{margin:6px 0 17px;max-width:54ch;color:var(--muted);font-size:12px;line-height:1.5}
      .wl-setting-row{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:15px 0;border-top:1px solid var(--line-soft);cursor:pointer}
      .wl-setting-row:first-of-type{border-top:0;padding-top:0}
      .wl-setting-copy{min-width:0;flex:1}
      .wl-setting-name{display:block;color:var(--ink);font-size:13.5px;font-weight:780;line-height:1.3}
      .wl-setting-desc{display:block;margin-top:4px;color:var(--muted);font-size:11.5px;line-height:1.45}
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
      .settings-note{display:flex;align-items:flex-start;gap:10px;margin-top:9px;padding:10px 12px;border:1px solid #eee1c9;border-radius:10px;background:#fbf7ef;color:#5d7088;font-size:11px;line-height:1.45}
      .settings-note strong{color:var(--navy);flex:0 0 auto}
      .settings-status{display:inline-flex;align-items:center;gap:6px;flex:0 0 auto;padding:4px 8px;border:1px solid #d0ead9;border-radius:99px;background:#eef8f1;color:var(--green);font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em}
      .settings-footer{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-top:18px;padding:15px 16px;border:1px dashed #ddd5c8;border-radius:12px;background:#fbfaf7;color:var(--muted);font-size:12px;line-height:1.45}
      .settings-footer b{color:var(--navy)}
      .settings-reset{font:inherit;border:1px solid #d8d3ca;border-radius:8px;background:#fff;color:#36506f;padding:8px 11px;font-weight:750;cursor:pointer;white-space:nowrap;transition:background .18s ease,border-color .18s ease,transform .18s ease}
      .settings-reset:hover{background:#f8fbff;border-color:#b9c9dc;transform:translateY(-1px)}
      .wm-compact .panel-table th,.wm-compact .panel-table td{padding-top:8px;padding-bottom:8px;font-size:12px}
      .wm-compact .recipient-panel .panel-head{padding-top:15px;padding-bottom:11px}
      .wm-compact .panel-actions{padding-top:9px;padding-bottom:9px}
      .wm-compact .printed-toggle{padding-top:12px;padding-bottom:12px}
      @media(max-width:760px){.settings-grid{grid-template-columns:1fr}.settings-footer{align-items:flex-start;flex-direction:column}.settings-reset{align-self:flex-start}.main{padding:28px 20px 40px}.side{width:100%}}
      @media print{.wl-brand-symbol{display:none!important}}
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
    enhanceBranding();
    renderSettingsSection();
    setCompact(readSettings().compactTables);
    installBehaviorHooks();
  });
})();
