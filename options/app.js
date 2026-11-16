"use strict";
/* global BK, t, Status, safeIconUrl */

// Central state for the options page. Tabs register a view with render()
// and optionally applyIssues(); all edits go through App.changed().
const App = {
  state: { engines: new Map(), custom: [], sites: [], bundles: [] },
  ff: [],                 // Firefox engines: { name, alias, isDefault, icon }
  granted: new Set(),     // SOURCE_ENGINES ids with host permission
  issues: new Map(),      // entry key -> { errors: [], warnings: [] }
  views: [],
  saveTimer: null,
  writing: false,

  register(view) { this.views.push(view); },

  renderAll() {
    this.validate();
    for (const v of this.views) v.render();
    this.refreshIssues();
  },

  refreshIssues() {
    for (const v of this.views) if (v.applyIssues) v.applyIssues();
    this.updateBadges();
  },

  // ---------- Loading ----------

  async loadState() {
    await BK.Store.migrate();
    this.state = await BK.Store.load();
  },

  async loadFirefoxEngines() {
    try {
      this.ff = (await browser.search.get()).map(e => {
        const alias = (e.alias || "").trim();
        const builtin = (BK.BUILTIN_ALIASES[e.name] || []).filter(a => BK.normAlias(a) !== BK.normAlias(alias));
        return {
          name: e.name,
          alias,
          builtin,                              // Firefox's own keywords for built-in engines
          mains: [alias, ...builtin].filter(Boolean),
          isDefault: !!e.isDefault,
          icon: safeIconUrl(e.favIconUrl)
        };
      });
    } catch {
      this.ff = [];
    }
  },

  async refreshPrivate() {
    try {
      this.privateAllowed = await browser.extension.isAllowedIncognitoAccess();
    } catch {
      this.privateAllowed = null;   // unknown – don't show the hint
    }
  },

  async refreshGranted() {
    const granted = new Set();
    for (const s of BK.SOURCE_ENGINES) {
      if (await browser.permissions.contains({ origins: s.patterns })) granted.add(s.id);
    }
    this.granted = granted;
  },

  defaultSource() {
    const def = this.ff.find(e => e.isDefault);
    return { def, source: def ? BK.SOURCE_ENGINES.find(s => s.match.test(def.name)) : null };
  },

  // Must be called directly from a click handler (user gesture).
  requestSource(source) {
    return browser.permissions.request({ origins: source.patterns });
  },

  orphans() {
    const names = new Set(this.ff.map(e => e.name));
    return [...this.state.engines].filter(([name, e]) => !names.has(name) && (e.a.length || e.u));
  },

  engineEntry(name) {
    if (!this.state.engines.has(name)) this.state.engines.set(name, { a: [], u: "" });
    return this.state.engines.get(name);
  },

  // ---------- Validation ----------

  // Errors are { f: field, m: message } so each one shows under its field.
  validate() {
    const issues = new Map();
    const owners = new Map();
    for (const e of this.ff) {
      for (const a of e.mains) owners.set(BK.normAlias(a), { label: e.name, firefox: true });
    }
    const E = (f, m) => ({ f, m });

    const check = (key, label, aliases, errors) => {
      const warnings = [];
      if (aliases.length > BK.LIMITS.aliasesPerEntry) errors.push(E("keywords", t("errTooMany", String(BK.LIMITS.aliasesPerEntry))));
      for (const a of aliases) {
        if (!BK.validAlias(a)) { errors.push(E("keywords", t("errInvalidAlias", a))); continue; }
        const k = BK.normAlias(a);
        const owner = owners.get(k);
        if (owner) errors.push(E("keywords", owner.firefox ? t("errFirefoxAlias", [a, owner.label]) : t("errDuplicate", [a, owner.label])));
        else owners.set(k, { label });
        if (BK.isPlainWord(a)) warnings.push(t("warnPlainWord", [a, "@" + a]));
      }
      issues.set(key, { errors, warnings });
    };
    const isBlank = x => !x.n && !x.a.length && !(Array.isArray(x.u) ? x.u.length : x.u);
    const entries = (list, prefix, urlCheck) => {
      for (const x of list) {
        if (isBlank(x)) { issues.set(prefix + x.id, { errors: [], warnings: [] }); continue; }
        const errors = [];
        if (!x.a.length) errors.push(E("keywords", t("errNoAlias")));
        const urlError = urlCheck(x);
        if (urlError) errors.push(E("url", urlError));
        check(prefix + x.id, x.n || String(x.u), x.a, errors);
      }
    };

    for (const [name, e] of this.state.engines) {
      const errors = [];
      if (e.u && !BK.validUrlTemplate(e.u)) errors.push(E("url", t("errUrl")));
      check("e:" + name, name, e.a, errors);
    }
    entries(this.state.custom, "c:", x => BK.validUrlTemplate(x.u) ? "" : t("errUrl"));
    entries(this.state.sites, "s:", x => BK.validSiteUrl(x.u) ? "" : t("errSiteUrl"));
    entries(this.state.bundles, "b:", x => {
      if (!x.u.length) return t("errBundleEmpty");
      if (x.u.length > BK.LIMITS.bundleUrls) return t("errBundleTooMany", String(BK.LIMITS.bundleUrls));
      const bad = x.u.find(u => !BK.validSiteUrl(u));
      return bad ? t("errBundleUrl", bad) : "";
    });
    this.issues = issues;
  },

  hasErrors(prefix = "") {
    for (const [k, v] of this.issues) if (k.startsWith(prefix) && v.errors.length) return true;
    return false;
  },

  // ---------- Saving ----------

  changed() {
    this.validate();
    this.refreshIssues();
    Status.show(t("statusSaving"));
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.saveNow(), 450);
  },

  async saveNow() {
    clearTimeout(this.saveTimer);
    this.saveTimer = null;
    if (this.hasErrors()) { Status.show(t("statusInvalid"), "error"); return false; }
    this.writing = true;
    try {
      await BK.Store.save(this.state);
      Status.show(t("statusSaved"), "ok", 1800);
      for (const v of this.views) if (v.afterSave) v.afterSave();
      return true;
    } catch (err) {
      const key = { itemTooLarge: "errTooLarge", tooManyEntries: "errMaxEntries", quota: "errQuota" }[err && err.code];
      Status.show(t("statusError", key ? t(key) : String(err && err.message || err)), "error");
      return false;
    } finally {
      setTimeout(() => { this.writing = false; }, 400);
    }
  },

  // ---------- Tab badges ----------

  updateBadges() {
    const setBadge = (tab, text) => {
      const btn = document.querySelector(`[data-tab="${tab}"]`);
      let b = btn.querySelector(".badge");
      if (!text) { if (b) b.remove(); return; }
      if (!b) { b = document.createElement("span"); b.className = "badge"; btn.append(b); }
      b.textContent = text;
    };
    const { source } = this.defaultSource();
    const todo = (!source || !this.granted.has(source.id) ? 1 : 0) + (this.ff.some(e => e.mains.length) ? 0 : 1);
    setBadge("welcome", todo ? String(todo) : "");
    setBadge("engines", this.hasErrors("e:") || this.orphans().length ? "!" : "");
    setBadge("custom", this.hasErrors("c:") ? "!" : "");
    setBadge("sites", this.hasErrors("s:") || this.hasErrors("b:") ? "!" : "");
  }
};
