// Run with: node --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

// Values from the sandbox live in another realm; compare their JSON form.
const eq = (actual, expected, msg) => assert.deepEqual(JSON.parse(JSON.stringify(actual)), expected, msg);

// Load the classic lib scripts into one sandbox with a fake storage.sync.
function sandbox(initial = {}) {
  const data = structuredClone(initial);
  const calls = { set: 0, remove: 0 };
  const sync = {
    async get(keys) {
      if (keys === null) return structuredClone(data);
      const list = Array.isArray(keys) ? keys : [keys];
      return Object.fromEntries(list.filter(k => k in data).map(k => [k, structuredClone(data[k])]));
    },
    async set(obj) { calls.set++; Object.assign(data, structuredClone(obj)); },
    async remove(keys) { calls.remove++; for (const k of [].concat(keys)) delete data[k]; }
  };
  const ctx = vm.createContext({ browser: { storage: { sync } }, crypto: globalThis.crypto, TextEncoder, URL, console });
  ctx.globalThis = ctx;
  for (const f of ["constants", "validate", "store", "resolve"]) {
    vm.runInContext(readFileSync(new URL(`../lib/${f}.js`, import.meta.url), "utf8"), ctx);
  }
  return { BK: ctx.BK, data, calls };
}

test("migrates v1 data and drops invalid entries", async () => {
  const { BK, data } = sandbox({
    engineAliases: { YouTube: ["@yt", "@youtube", "bad alias"], "": ["@x"] },
    shortcuts: [
      { name: "dict", aliases: ["@dict"], url: "https://www.dict.cc/?s=%s" },
      { name: "evil", aliases: ["@evil"], url: "javascript:alert(1)//%s" }
    ]
  });
  await BK.Store.migrate();
  assert.equal(data.v, 2);
  eq(data["e:YouTube"], { a: ["@yt", "@youtube"] });
  assert.equal(data.engineAliases, undefined);
  assert.equal(data.shortcuts, undefined);
  const custom = Object.keys(data).filter(k => k.startsWith("c:"));
  assert.equal(custom.length, 1, "javascript: URL must be dropped");
});

test("fresh install seeds examples exactly once, even when racing", async () => {
  const { BK, data } = sandbox({});
  await Promise.all([BK.Store.migrate(), BK.Store.migrate()]);
  await BK.Store.migrate();
  assert.equal(Object.keys(data).filter(k => k.startsWith("c:")).length, BK.EXAMPLES.length);
});

test("save writes only changes and removes deleted entries", async () => {
  const { BK, data, calls } = sandbox({ v: 2, "e:A": { a: ["@a"] }, "c:x1": { n: "X", a: ["@x"], u: "https://x.org/?q=%s", o: 0 } });
  const state = await BK.Store.load();
  calls.set = 0;
  await BK.Store.save(state);
  assert.equal(calls.set, 0, "nothing changed -> no write");

  state.engines.get("A").a.push("@aa");
  state.custom = [];
  await BK.Store.save(state);
  eq(data["e:A"].a, ["@a", "@aa"]);
  assert.equal(data["c:x1"], undefined);
});

test("oversized entries are rejected before writing", async () => {
  const { BK } = sandbox({ v: 2 });
  const state = { engines: new Map([["A", { a: [], u: "https://x.org/?q=%s&" + "p".repeat(8000) }]]), custom: [] };
  await assert.rejects(BK.Store.save(state), e => e.code === "itemTooLarge");
});

test("parse() sanitises tampered storage", () => {
  const { BK } = sandbox();
  const s = BK.Store.parse({
    "e:A": { a: ["@ok", 42, "has space", "@ok"], u: "data:text/html,%s" },
    "c:../../x": { n: "bad id", a: ["@b"], u: "https://b.org/%s" },
    "c:good": { n: "G".repeat(500), a: ["@g"], u: "https://g.org/%s", o: 1 }
  });
  eq(s.engines.get("A"), { a: ["@ok"], u: "" });
  assert.equal(s.custom.length, 1);
  assert.equal(s.custom[0].n.length, BK.LIMITS.nameLen);
});

test("import rejects foreign or broken files", () => {
  const { BK } = sandbox();
  for (const bad of ["not json", "{}", JSON.stringify({ format: "other", version: 1 }), "x".repeat(300 * 1024)]) {
    assert.throws(() => BK.Store.parseImport(bad));
  }
});

test("import keeps only safe values", () => {
  const { BK } = sandbox();
  const imp = BK.Store.parseImport(JSON.stringify({
    format: "barkeys-launcher", version: 1,
    engines: [{ name: "YouTube", extraKeywords: ["@yt", "<script>"], url: "https://www.youtube.com/results?search_query=%s" }],
    custom: [
      { name: "ok", keywords: ["@ok"], url: "https://ok.org/?q=%s" },
      { name: "js", keywords: ["@js"], url: "javascript:alert(1)//%s" },
      { name: "file", keywords: ["@f"], url: "file:///etc/passwd?%s" }
    ]
  }));
  assert.equal(imp.custom.length, 1);
  assert.equal(imp.skipped, 2);
  eq(imp.engines[0].a, ["@yt", "<script>"]); // harmless text, rendered via textContent
});

test("merge import skips keywords already in use (incl. Firefox's own)", () => {
  const { BK } = sandbox();
  const state = { engines: new Map([["Wiki", { a: ["@wiki"], u: "" }]]), custom: [] };
  const imp = { engines: [{ name: "Wiki", a: ["@wiki", "@wp"], u: "", main: "" }, { name: "Missing", a: ["@y"], u: "https://m.org/%s", main: "@m" }], custom: [], skipped: 0, keywords: 3 };
  const ff = [{ name: "Wiki", alias: "@w" }, { name: "YouTube", alias: "@y" }];
  const res = BK.Store.applyImport(state, imp, "merge", ff);
  eq(res.state.engines.get("Wiki").a, ["@wiki", "@wp"]);
  assert.equal(res.skipped, 2); // @wiki (exists) and @y (Firefox main keyword)
  eq(res.missing.map(m => m.name), ["Missing"]);
  eq(state.engines.get("Wiki").a, ["@wiki"], "original state untouched");
});

test("resolve: engines, URLs, encoding and safety", () => {
  const { BK } = sandbox();
  const index = BK.buildIndex({
    engines: new Map([["YouTube", { a: ["@yt"], u: "" }]]),
    custom: [{ n: "OSM", a: ["@OSM"], u: "https://www.openstreetmap.org/search?query=%s" }]
  });
  eq({ ...BK.resolve("@YT  cat videos ", index) }, { engine: "YouTube", terms: "cat videos" });
  assert.equal(BK.resolve("@yt", index), null, "engine keyword alone falls through");
  assert.equal(BK.resolve("@osm Köln & Bonn", index).url, "https://www.openstreetmap.org/search?query=K%C3%B6ln%20%26%20Bonn");
  assert.equal(BK.resolve("@osm", index).url, "https://www.openstreetmap.org/");
  assert.equal(BK.resolve("plain search", index), null);
  assert.equal(BK.resolve("", index), null);
});

test("site keywords open the site, only http(s)", () => {
  const { BK } = sandbox();
  const state = BK.Store.parse({
    "s:a1": { n: "News", a: ["@news"], u: "https://www.tagesschau.de/", o: 0 },
    "s:a2": { n: "Evil", a: ["@evil"], u: "javascript:alert(1)", o: 1 }
  });
  eq(state.sites.map(s => s.u), ["https://www.tagesschau.de/", ""], "javascript: URL is dropped on read");
  const index = BK.buildIndex(state);
  eq({ ...BK.resolve("@news", index) }, { url: "https://www.tagesschau.de/" });
  eq({ ...BK.resolve("@NEWS extra words", index) }, { url: "https://www.tagesschau.de/" });
  assert.equal(BK.resolve("@evil", index), null);
});

test("sites survive export -> import round trip", () => {
  const { BK } = sandbox();
  const state = { engines: new Map(), custom: [], sites: [{ id: "a", n: "News", a: ["@news"], u: "https://news.example/" }] };
  const file = JSON.stringify(BK.Store.exportData(state, []));
  const imp = BK.Store.parseImport(file);
  const res = BK.Store.applyImport({ engines: new Map(), custom: [], sites: [] }, imp, "merge", []);
  eq(res.state.sites.map(s => [s.n, s.a, s.u]), [["News", ["@news"], "https://news.example/"]]);
});
