"use strict";
/* global BK */

let index = new Map();
let ready = null;

function reload() {
  ready = BK.Store.migrate()
    .catch(err => console.error("Barkeys: migration failed", err))
    .then(() => BK.Store.load())
    .then(state => { index = BK.buildIndex(state); })
    .catch(err => console.error("Barkeys: loading settings failed", err));
  return ready;
}

// Firefox engine names, cached briefly so bursts of searches don't re-query.
let engineCache = { at: 0, names: new Set() };
async function engineExists(name) {
  if (Date.now() - engineCache.at > 5000) {
    const engines = await browser.search.get();
    engineCache = { at: Date.now(), names: new Set(engines.map(e => e.name)) };
  }
  return engineCache.names.has(name);
}

function matchPattern(pattern, url) {
  const m = pattern.match(/^\*:\/\/([^/]+)(\/.*)$/);
  if (!m) return false;
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  if (url.hostname !== m[1]) return false;
  return url.pathname.startsWith(m[2].replace(/\*$/, ""));
}

async function onBeforeRequest(details) {
  await ready;
  if (details.type !== "main_frame" || index.size === 0) return {};
  let url;
  try { url = new URL(details.url); } catch { return {}; }

  const source = BK.SOURCE_ENGINES.find(e => e.patterns.some(p => matchPattern(p, url)));
  if (!source) return {};

  for (const param of source.params) {
    const hit = BK.resolve(url.searchParams.get(param), index);
    if (!hit) continue;
    if (hit.url) return { redirectUrl: hit.url };

    // Hand the search to the Firefox engine (we never learn its URL).
    if (!(await engineExists(hit.engine))) return {};
    setTimeout(() => {
      browser.search.search({ query: hit.terms, engine: hit.engine, tabId: details.tabId })
        .catch(err => console.error("Barkeys: search failed", err));
    }, 0);
    return { cancel: true };
  }
  return {};
}

// Registered synchronously so the event page wakes up for it. Firefox only
// delivers requests for hosts the user has granted.
browser.webRequest.onBeforeRequest.addListener(
  onBeforeRequest,
  { urls: BK.SOURCE_ENGINES.flatMap(e => e.patterns), types: ["main_frame"] },
  ["blocking"]
);

let reloadTimer = null;
browser.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return;
  clearTimeout(reloadTimer);
  reloadTimer = setTimeout(reload, 150);
});

browser.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install") browser.runtime.openOptionsPage();
});

reload();
