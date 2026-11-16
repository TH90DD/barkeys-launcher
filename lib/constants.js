"use strict";
// Shared by background script and options page (classic scripts, one namespace).
globalThis.BK = globalThis.BK || {};

// Default search engines whose result pages we may intercept. Firefox sends
// unknown keywords there. `match` is used to recognise Firefox's default
// engine by name.
BK.SOURCE_ENGINES = [
  {
    id: "google", name: "Google", match: /^google$/i,
    patterns: [
      "*://www.google.com/search*",
      "*://www.google.de/search*",
      "*://www.google.at/search*",
      "*://www.google.ch/search*"
    ],
    params: ["q"]
  },
  { id: "bing", name: "Bing", match: /^bing$/i, patterns: ["*://www.bing.com/search*"], params: ["q"] },
  { id: "duckduckgo", name: "DuckDuckGo", match: /^duckduckgo/i, patterns: ["*://duckduckgo.com/*"], params: ["q"] },
  { id: "ecosia", name: "Ecosia", match: /^ecosia/i, patterns: ["*://www.ecosia.org/search*"], params: ["q"] },
  { id: "startpage", name: "Startpage", match: /^startpage/i, patterns: ["*://www.startpage.com/*"], params: ["query", "q"] },
  { id: "qwant", name: "Qwant", match: /^qwant/i, patterns: ["*://www.qwant.com/*"], params: ["q"] },
  { id: "brave", name: "Brave Search", match: /^brave/i, patterns: ["*://search.brave.com/search*"], params: ["q"] },
  { id: "perplexity", name: "Perplexity", match: /^perplexity/i, patterns: ["*://www.perplexity.ai/search*"], params: ["q"] }
];

// Keywords that Firefox's built-in engines ship with. Firefox doesn't expose
// them to add-ons (search.get() only returns user-set keywords), so we keep
// the known ones here to show them and to avoid conflicts.
BK.BUILTIN_ALIASES = {
  "Google": ["@google"],
  "Bing": ["@bing"],
  "DuckDuckGo": ["@duckduckgo", "@ddg"],
  "Ecosia": ["@ecosia"],
  "Qwant": ["@qwant"],
  "Startpage": ["@startpage"],
  "Perplexity": ["@perplexity"],
  "Wikipedia (en)": ["@wikipedia"],
  "Wikipedia (de)": ["@wikipedia"],
  "Amazon.com": ["@amazon"],
  "Amazon.de": ["@amazon"],
  "eBay": ["@ebay"]
};

// Hard limits – keep every item well below storage.sync's 8 KB per item and
// the whole set below 100 KB / 512 items.
BK.LIMITS = {
  aliasLen: 32,
  aliasesPerEntry: 20,
  nameLen: 80,
  engineNameLen: 100,
  urlLen: 2048,
  maxEntries: 400,
  bundleUrls: 20,
  itemBytes: 7900,
  totalBytes: 100 * 1024,
  importBytes: 256 * 1024
};

// Examples for new users. Fixed ids so seeding twice can't create duplicates.
BK.EXAMPLES = [
  { id: "ex1", n: "MDN Web Docs", a: ["@mdn"], u: "https://developer.mozilla.org/search?q=%s" },
  { id: "ex2", n: "OpenStreetMap", a: ["@osm"], u: "https://www.openstreetmap.org/search?query=%s" }
];
