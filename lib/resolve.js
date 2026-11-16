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
  return index;
};

// "@y cat videos" -> { engine, terms } | { url } | null
BK.resolve = (query, index) => {
  if (!query || index.size === 0) return null;
  const m = String(query).trim().match(/^(\S+)(?:\s+([\s\S]*))?$/);
  if (!m) return null;
  const target = index.get(BK.normAlias(m[1]));
  if (!target) return null;
  const terms = (m[2] || "").trim();

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
