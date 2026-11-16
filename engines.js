// Shared between background and options page.
// "Source" engines: the default search engine Firefox falls back to when the
// typed keyword is unknown to Firefox. We intercept those result pages.

const SOURCE_ENGINES = [
  {
    id: "google",
    name: "Google",
    patterns: [
      "*://www.google.com/search*",
      "*://www.google.de/search*",
      "*://www.google.at/search*",
      "*://www.google.ch/search*"
    ],
    params: ["q"]
  },
  { id: "bing", name: "Bing", patterns: ["*://www.bing.com/search*"], params: ["q"] },
  { id: "duckduckgo", name: "DuckDuckGo", patterns: ["*://duckduckgo.com/*"], params: ["q"] },
  { id: "ecosia", name: "Ecosia", patterns: ["*://www.ecosia.org/search*"], params: ["q"] },
  { id: "startpage", name: "Startpage", patterns: ["*://www.startpage.com/*"], params: ["query", "q"] },
  { id: "qwant", name: "Qwant", patterns: ["*://www.qwant.com/*"], params: ["q"] },
  { id: "brave", name: "Brave Search", patterns: ["*://search.brave.com/search*"], params: ["q"] },
  { id: "perplexity", name: "Perplexity", patterns: ["*://www.perplexity.ai/search*"], params: ["q"] }
];

// Targets without a Firefox search engine (URL with %s).
const DEFAULT_SHORTCUTS = [
  { name: "YouTube", aliases: ["@yt", "@youtube"], url: "https://www.youtube.com/results?search_query=%s" },
  { name: "Wikipedia (de)", aliases: ["@wiki"], url: "https://de.wikipedia.org/w/index.php?search=%s" }
];

function splitAliases(text) {
  return String(text || "").split(/[,\s]+/).map(a => a.trim()).filter(Boolean);
}

// Resolve a query like "@y cat videos".
//   engineAliases: { "<Firefox engine name>": ["@yt", ...] }
//   shortcuts:     [{ name, aliases: [...], url: "...%s..." }]
// Returns { engine, terms } | { url } | null.
function resolveQuery(query, engineAliases, shortcuts) {
  if (!query) return null;
  const m = query.trim().match(/^(\S+)(?:\s+([\s\S]*))?$/);
  if (!m) return null;
  const token = m[1].toLowerCase();
  const terms = (m[2] || "").trim();
  const has = list => Array.isArray(list) && list.some(a => a.toLowerCase() === token);

  for (const [engine, aliases] of Object.entries(engineAliases || {})) {
    if (has(aliases)) return terms ? { engine, terms } : null;
  }
  for (const s of shortcuts || []) {
    if (!s.url || !has(s.aliases)) continue;
    if (!terms) {
      // Keyword alone: open the site's start page.
      try { return { url: new URL(s.url.replace("%s", "")).origin + "/" }; } catch { return null; }
    }
    return { url: s.url.split("%s").join(encodeURIComponent(terms)) };
  }
  return null;
}

if (typeof module !== "undefined") module.exports = { resolveQuery, splitAliases, DEFAULT_SHORTCUTS, SOURCE_ENGINES };
