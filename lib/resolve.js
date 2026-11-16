"use strict";

// State -> Map(normalised keyword -> target). Built once per change, so each
// intercepted search is a single Map lookup.
BK.buildIndex = state => {
  const index = new Map();
  for (const [engine, e] of state.engines) {
    for (const a of e.a) {
      const k = BK.normAlias(a);
      if (!index.has(k)) index.set(k, { engine });
    }
  }
  for (const c of state.custom) {
    if (!BK.validUrlTemplate(c.u)) continue;
    for (const a of c.a) {
      const k = BK.normAlias(a);
      if (!index.has(k)) index.set(k, { url: c.u });
    }
  }
  for (const x of state.sites || []) {
    if (!BK.validSiteUrl(x.u)) continue;
    for (const a of x.a) {
      const k = BK.normAlias(a);
      if (!index.has(k)) index.set(k, { site: x.u });
    }
  }
  for (const x of state.bundles || []) {
    const urls = x.u.filter(BK.validSiteUrl);
    if (!urls.length) continue;
    for (const a of x.a) {
      const k = BK.normAlias(a);
      if (!index.has(k)) index.set(k, { bundle: urls });
    }
  }
  return index;
};

// "@y cat videos" -> { engine, terms } | { url } | { urls } (bundle) | null
BK.resolve = (query, index) => {
  if (!query || index.size === 0) return null;
  const m = String(query).trim().match(/^(\S+)(?:\s+([\s\S]*))?$/);
  if (!m) return null;
  const target = index.get(BK.normAlias(m[1]));
  if (!target) return null;
  const terms = (m[2] || "").trim();

  // Bundle: open all sites (extra words are ignored).
  if (target.bundle) {
    const urls = target.bundle.filter(BK.validSiteUrl);
    return urls.length ? { urls } : null;
  }

  // Site keyword: always open the site itself (extra words are ignored).
  if (target.site) return BK.validSiteUrl(target.site) ? { url: target.site } : null;

  if (target.engine) return terms ? { engine: target.engine, terms } : null;

  if (!terms) {
    // Keyword alone: open the site's start page.
    try { return { url: new URL(target.url.split("%s").join("")).origin + "/" }; } catch { return null; }
  }
  const url = target.url.split("%s").join(encodeURIComponent(terms));
  // Defence in depth: only ever redirect to http(s).
  try {
    const p = new URL(url).protocol;
    return p === "https:" || p === "http:" ? { url } : null;
  } catch {
    return null;
  }
};

if (typeof module !== "undefined") module.exports = BK;
