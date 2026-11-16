"use strict";
/* global BK, t, Status, safeIconUrl */

// Central state for the options page. Tabs register a view with render()
// and optionally applyIssues(); all edits go through App.changed().
const App = {
  state: { engines: new Map(), custom: [] },
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
      this.ff = (await browser.search.get()).map(e => ({
        name: e.name,
        alias: (e.alias || "").trim(),
        isDefault: !!e.isDefault,
        icon: safeIconUrl(e.favIconUrl)
      }));
    } catch {
      this.ff = [];
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

  validate() {
    const issues = new Map();
    const owners = new Map();
    for (const e of this.ff) {
      if (e.alias) owners.set(BK.normAlias(e.alias), { label: e.name, firefox: true });
    }

    const check = (key, label, aliases, errors) => {
      const warnings = [];
      if (aliases.length > BK.LIMITS.aliasesPerEntry) errors.push(t("errTooMany", String(BK.LIMITS.aliasesPerEntry)));
      for (const a of aliases) {
        if (!BK.validAlias(a)) { errors.push(t("errInvalidAlias", a)); continue; }
        const k = BK.normAlias(a);
        const owner = owners.get(k);
        if (owner) errors.push(owner.firefox ? t("errFirefoxAlias", [a, owner.label]) : t("errDuplicate", [a, owner.label]));
        else owners.set(k, { label });
        if (BK.isPlainWord(a)) warnings.push(t("warnPlainWord", [a, "@" + a]));
      }
      issues.set(key, { errors, warnings });
    };

    for (const [name, e] of this.state.engines) {
      const errors = [];
      if (e.u && !BK.validUrlTemplate(e.u)) errors.push(t("errUrl"));
      check("e:" + name, name, e.a, errors);
    }
    for (const c of this.state.custom) {
      if (!c.n && !c.a.length && !c.u) { issues.set("c:" + c.id, { errors: [], warnings: [] }); continue; }
      const errors = [];
      if (!c.a.length) errors.push(t("errNoAlias"));
      if (!BK.validUrlTemplate(c.u)) errors.push(t("errUrl"));
      check("c:" + c.id, c.n || c.u, c.a, errors);
    }
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
    const todo = (!source || !this.granted.has(source.id) ? 1 : 0) + (this.ff.some(e => e.alias) ? 0 : 1);
    setBadge("welcome", todo ? String(todo) : "");
    setBadge("engines", this.hasErrors("e:") || this.orphans().length ? "!" : "");
    setBadge("custom", this.hasErrors("c:") ? "!" : "");
  }
};
