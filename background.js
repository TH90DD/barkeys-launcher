/* global SOURCE_ENGINES, DEFAULT_SHORTCUTS, resolveQuery */
"use strict";

let engineAliases = {};
let shortcuts = DEFAULT_SHORTCUTS;
let ready = null;

function loadSettings() {
  ready = browser.storage.sync.get(["engineAliases", "shortcuts"]).then(data => {
    engineAliases = data.engineAliases && typeof data.engineAliases === "object" ? data.engineAliases : {};
    shortcuts = Array.isArray(data.shortcuts) ? data.shortcuts : DEFAULT_SHORTCUTS;
  });
  return ready;
}

// Minimal match for our own "*://host/path*" patterns.
function matchPattern(pattern, url) {
  const m = pattern.match(/^\*:\/\/([^/]+)(\/.*)$/);
  if (!m) return false;
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  if (url.hostname !== m[1]) return false;
  return url.pathname.startsWith(m[2].replace(/\*$/, ""));
}

// Async so a freshly woken event page waits for the stored settings.
async function onBeforeRequest(details) {
  await ready;
  if (details.type !== "main_frame") return {};
  let url;
  try { url = new URL(details.url); } catch { return {}; }

  const source = SOURCE_ENGINES.find(e => e.patterns.some(p => matchPattern(p, url)));
  if (!source) return {};

  for (const param of source.params) {
    const hit = resolveQuery(url.searchParams.get(param), engineAliases, shortcuts);
    if (!hit) continue;

    if (hit.url) return { redirectUrl: hit.url };

    // Hand the search to the Firefox engine itself (we never see its URL).
    // Only intercept if that engine still exists, e.g. it wasn't renamed.
    const engines = await browser.search.get();
    if (!engines.some(e => e.name === hit.engine)) return {};
    setTimeout(() => {
      browser.search.search({ query: hit.terms, engine: hit.engine, tabId: details.tabId })
        .catch(err => console.error("search failed", err));
    }, 0);
    return { cancel: true };
  }
  return {};
}

// Registered synchronously at top level so the event page wakes up for it.
// Firefox only delivers events for hosts the user has granted.
browser.webRequest.onBeforeRequest.addListener(
  onBeforeRequest,
  { urls: SOURCE_ENGINES.flatMap(e => e.patterns), types: ["main_frame"] },
  ["blocking"]
);

browser.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && (changes.engineAliases || changes.shortcuts)) loadSettings();
});

browser.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install") browser.runtime.openOptionsPage();
});

loadSettings();
