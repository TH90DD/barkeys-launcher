"use strict";
/*
 * Storage layout (storage.sync, schema v2):
 *   "v"            -> 2
 *   "e:<engine>"   -> { a: [extra keywords], u?: "search URL hint for export" }
 *   "c:<id>"       -> { n: name, a: [keywords], u: "https://…%s", o: order }
 *   "s:<id>"       -> { n: name, a: [keywords], u: "https://site/", o: order }
 *   "b:<id>"       -> { n: name, a: [keywords], u: ["https://…", …], o: order }
 * One small item per entry keeps us far below the 8 KB per-item quota and
 * means a sync only touches what actually changed.
 */

// Host of a URL or URL template ("" if none) – for the import preview.
BK.hostOf = u => {
  try { return new URL(String(u).split("%s").join("x")).hostname; } catch { return ""; }
};

BK.StoreError = class extends Error {
  constructor(code, detail) {
    super(code);
    this.code = code;
    this.detail = detail;
  }
};

BK.Store = {
  isEntryKey: k => /^[ecsb]:/.test(k),

  itemBytes(key, value) {
    return new TextEncoder().encode(key + JSON.stringify(value)).length;
  },

  // v1 -> v2, and examples for brand-new installs. Idempotent.
  async migrate() {
    const all = await browser.storage.sync.get(null);
    if (all.v === 2) return;
    const out = { v: 2 };
    const remove = [];

    if (all.engineAliases && typeof all.engineAliases === "object") {
      for (const [name, aliases] of Object.entries(all.engineAliases)) {
        const a = BK.cleanAliases(aliases);
        if (a.length && BK.validEngineName(name)) out["e:" + name] = { a };
      }
      remove.push("engineAliases");
    }
    if (Array.isArray(all.shortcuts)) {
      all.shortcuts.forEach((s, i) => {
        const a = BK.cleanAliases(s && s.aliases);
        if (!a.length || !BK.validUrlTemplate(s.url)) return;
        out["c:m" + i] = { n: BK.cleanName(s.name), a, u: s.url, o: i };
      });
      remove.push("shortcuts");
    }
    if (!remove.length && !Object.keys(all).some(BK.Store.isEntryKey)) {
      BK.EXAMPLES.forEach((ex, i) => { out["c:" + ex.id] = { n: ex.n, a: ex.a, u: ex.u, o: i }; });
    }
    await browser.storage.sync.set(out);
    if (remove.length) await browser.storage.sync.remove(remove);
  },

  // Raw storage object -> sanitised state. Never trusts what it reads.
  parse(all) {
    const engines = new Map();
    const custom = [];
    const sites = [];
    const bundles = [];
    const cleanUrls = list => (Array.isArray(list) ? list : []).filter(BK.validSiteUrl).slice(0, BK.LIMITS.bundleUrls);
    for (const [k, v] of Object.entries(all || {})) {
      if (!v || typeof v !== "object") continue;
      if (k.startsWith("e:")) {
        const name = k.slice(2);
        if (!BK.validEngineName(name)) continue;
        engines.set(name, { a: BK.cleanAliases(v.a), u: BK.validUrlTemplate(v.u) ? v.u : "" });
      } else if (k.startsWith("c:")) {
        const id = k.slice(2);
        if (!/^[a-z0-9]{1,16}$/i.test(id)) continue;
        custom.push({
          id,
          n: BK.cleanName(v.n),
          a: BK.cleanAliases(v.a),
          u: typeof v.u === "string" ? v.u.slice(0, BK.LIMITS.urlLen) : "",
          o: Number.isFinite(v.o) ? v.o : 0
        });
      } else if (k.startsWith("s:")) {
        const id = k.slice(2);
        if (!/^[a-z0-9]{1,16}$/i.test(id)) continue;
        sites.push({
          id,
          n: BK.cleanName(v.n),
          a: BK.cleanAliases(v.a),
          u: BK.validSiteUrl(v.u) ? v.u : "",
          o: Number.isFinite(v.o) ? v.o : 0
        });
      } else if (k.startsWith("b:")) {
        const id = k.slice(2);
        if (!/^[a-z0-9]{1,16}$/i.test(id)) continue;
        bundles.push({
          id,
          n: BK.cleanName(v.n),
          a: BK.cleanAliases(v.a),
          u: cleanUrls(v.u),
          o: Number.isFinite(v.o) ? v.o : 0
        });
      }
    }
    custom.sort((x, y) => x.o - y.o);
    sites.sort((x, y) => x.o - y.o);
    bundles.sort((x, y) => x.o - y.o);
    return { engines, custom, sites, bundles };
  },

  async load() {
    return BK.Store.parse(await browser.storage.sync.get(null));
  },

  serialize(state) {
    const out = { v: 2 };
    for (const [name, e] of state.engines) {
      if (!e.a.length && !e.u) continue;
      const item = { a: e.a };
      if (e.u) item.u = e.u;
      out["e:" + name] = item;
    }
    state.custom.forEach((c, i) => {
      if (!c.n && !c.a.length && !c.u) return; // blank row still being edited
      out["c:" + c.id] = { n: c.n, a: c.a, u: c.u, o: i };
    });
    (state.sites || []).forEach((x, i) => {
      if (!x.n && !x.a.length && !x.u) return;
      out["s:" + x.id] = { n: x.n, a: x.a, u: x.u, o: i };
    });
    (state.bundles || []).forEach((x, i) => {
      if (!x.n && !x.a.length && !x.u.length) return;
      out["b:" + x.id] = { n: x.n, a: x.a, u: x.u, o: i };
    });
    return out;
  },

  usage(items) {
    let bytes = 0;
    let count = 0;
    for (const [k, v] of Object.entries(items)) {
      bytes += BK.Store.itemBytes(k, v);
      if (BK.Store.isEntryKey(k)) count++;
    }
    return { bytes, count };
  },

  // Writes only changed items and removes deleted ones.
  async save(state) {
    const next = BK.Store.serialize(state);
    for (const [k, v] of Object.entries(next)) {
      if (BK.Store.itemBytes(k, v) > BK.LIMITS.itemBytes) throw new BK.StoreError("itemTooLarge", k);
    }
    const { bytes, count } = BK.Store.usage(next);
    if (count > BK.LIMITS.maxEntries) throw new BK.StoreError("tooManyEntries");
    if (bytes > BK.LIMITS.totalBytes) throw new BK.StoreError("quota");

    const cur = await browser.storage.sync.get(null);
    const changed = {};
    for (const [k, v] of Object.entries(next)) {
      if (JSON.stringify(cur[k]) !== JSON.stringify(v)) changed[k] = v;
    }
    const removed = Object.keys(cur).filter(k => BK.Store.isEntryKey(k) && !(k in next));
    if (Object.keys(changed).length) await browser.storage.sync.set(changed);
    if (removed.length) await browser.storage.sync.remove(removed);
    return next;
  },

  async clearAll() {
    const cur = await browser.storage.sync.get(null);
    const keys = Object.keys(cur).filter(BK.Store.isEntryKey);
    if (keys.length) await browser.storage.sync.remove(keys);
    await browser.storage.sync.set({ v: 2 });
  },

  // ---------- Export / import ----------

  exportData(state, firefoxEngines) {
    const mainOf = new Map(firefoxEngines.map(e => [e.name, e.alias || (e.mains || [])[0] || ""]));
    const engines = [];
    for (const [name, e] of state.engines) {
      if (!e.a.length && !e.u) continue;
      const item = { name, extraKeywords: e.a };
      if (mainOf.get(name)) item.mainKeyword = mainOf.get(name);
      if (e.u) item.url = e.u;
      engines.push(item);
    }
    const custom = state.custom
      .filter(c => c.a.length && BK.validUrlTemplate(c.u))
      .map(c => ({ name: c.n, keywords: c.a, url: c.u }));
    const sites = (state.sites || [])
      .filter(x => x.a.length && BK.validSiteUrl(x.u))
      .map(x => ({ name: x.n, keywords: x.a, url: x.u }));
    return {
      format: "barkeys-launcher",
      version: 1,
      exported: new Date().toISOString(),
      engines,
      custom,
      sites,
      bundles: (state.bundles || [])
        .filter(x => x.a.length && x.u.length && x.u.every(BK.validSiteUrl))
        .map(x => ({ name: x.n, keywords: x.a, urls: x.u }))
    };
  },

  // Text of an import file -> sanitised data + stats. Throws on bad files.
  parseImport(text) {
    if (typeof text !== "string" || text.length > BK.LIMITS.importBytes) throw new BK.StoreError("importSize");
    let data;
    try { data = JSON.parse(text); } catch { throw new BK.StoreError("importFile"); }
    if (!data || data.format !== "barkeys-launcher" || data.version !== 1) throw new BK.StoreError("importFile");

    const engines = [];
    const custom = [];
    let skipped = 0;
    // Plain words ("login", "google") would hijack normal searches, and a
    // shared file could use them to send those searches to a foreign domain.
    // Imports accept only keywords with a non-letter in them (e.g. "@login").
    let rejected = 0;
    const keywords = list => {
      const all = BK.cleanAliases(list);
      const kept = all.filter(a => !BK.isPlainWord(a));
      rejected += all.length - kept.length;
      return kept;
    };
    for (const e of Array.isArray(data.engines) ? data.engines.slice(0, BK.LIMITS.maxEntries) : []) {
      const a = keywords(e && e.extraKeywords);
      if (!e || !BK.validEngineName(e.name) || (!a.length && !BK.validUrlTemplate(e.url))) { skipped++; continue; }
      engines.push({
        name: e.name.trim(),
        a,
        u: BK.validUrlTemplate(e.url) ? e.url : "",
        main: BK.validAlias(e.mainKeyword) ? e.mainKeyword : ""
      });
    }
    for (const c of Array.isArray(data.custom) ? data.custom.slice(0, BK.LIMITS.maxEntries) : []) {
      const a = keywords(c && c.keywords);
      if (!c || !a.length || !BK.validUrlTemplate(c.url)) { skipped++; continue; }
      custom.push({ n: BK.cleanName(c.name), a, u: c.url });
    }
    const sites = [];
    for (const x of Array.isArray(data.sites) ? data.sites.slice(0, BK.LIMITS.maxEntries) : []) {
      const a = keywords(x && x.keywords);
      if (!x || !a.length || !BK.validSiteUrl(x.url)) { skipped++; continue; }
      sites.push({ n: BK.cleanName(x.name), a, u: x.url });
    }
    const bundles = [];
    for (const x of Array.isArray(data.bundles) ? data.bundles.slice(0, BK.LIMITS.maxEntries) : []) {
      const a = keywords(x && x.keywords);
      const urls = Array.isArray(x && x.urls) ? x.urls.filter(BK.validSiteUrl).slice(0, BK.LIMITS.bundleUrls) : [];
      if (!a.length || !urls.length) { skipped++; continue; }
      bundles.push({ n: BK.cleanName(x.name), a, u: urls });
    }
    const count = list => list.reduce((s, x) => s + x.a.length, 0);
    // Every domain the kept entries can send you to, for the preview.
    const urls = [
      ...engines.map(e => e.u),
      ...custom.map(c => c.u),
      ...sites.map(x => x.u),
      ...bundles.flatMap(x => x.u)
    ].filter(Boolean);
    const hosts = [...new Set(urls.map(BK.hostOf).filter(Boolean))].sort();
    return {
      engines, custom, sites, bundles,
      skipped: skipped + rejected,
      keywords: count(engines) + count(custom) + count(sites) + count(bundles),
      hosts
    };
  },

  // Applies parsed import data to a state. Returns a new state + counters.
  applyImport(state, imp, mode, firefoxEngines) {
    const next = mode === "replace"
      ? { engines: new Map(), custom: [], sites: [], bundles: [] }
      : {
          engines: new Map([...state.engines].map(([k, v]) => [k, { a: [...v.a], u: v.u }])),
          custom: state.custom.map(c => ({ ...c, a: [...c.a] })),
          sites: (state.sites || []).map(x => ({ ...x, a: [...x.a] })),
          bundles: (state.bundles || []).map(x => ({ ...x, a: [...x.a], u: [...x.u] }))
        };

    const taken = new Set(firefoxEngines.flatMap(e => e.mains || [e.alias]).filter(Boolean).map(BK.normAlias));
    for (const e of next.engines.values()) e.a.forEach(a => taken.add(BK.normAlias(a)));
    for (const c of next.custom) c.a.forEach(a => taken.add(BK.normAlias(a)));
    for (const x of [...next.sites, ...next.bundles]) x.a.forEach(a => taken.add(BK.normAlias(a)));

    let added = 0;
    let skipped = 0;
    const take = list => list.filter(a => {
      const k = BK.normAlias(a);
      if (taken.has(k)) { skipped++; return false; }
      taken.add(k);
      added++;
      return true;
    });

    for (const e of imp.engines) {
      const cur = next.engines.get(e.name) || { a: [], u: "" };
      cur.a = [...cur.a, ...take(e.a)].slice(0, BK.LIMITS.aliasesPerEntry);
      if (!cur.u && e.u) cur.u = e.u;
      next.engines.set(e.name, cur);
    }
    for (const c of imp.custom) {
      const a = take(c.a);
      if (!a.length) continue;
      next.custom.push({ id: BK.randomId(), n: c.n, a, u: c.u, o: next.custom.length });
    }
    for (const x of imp.sites || []) {
      const a = take(x.a);
      if (!a.length) continue;
      next.sites.push({ id: BK.randomId(), n: x.n, a, u: x.u, o: next.sites.length });
    }
    for (const x of imp.bundles || []) {
      const a = take(x.a);
      if (!a.length) continue;
      next.bundles.push({ id: BK.randomId(), n: x.n, a, u: [...x.u], o: next.bundles.length });
    }
    const ffNames = new Set(firefoxEngines.map(e => e.name));
    const missing = imp.engines.filter(e => !ffNames.has(e.name));
    return { state: next, added, skipped, missing };
  }
};
