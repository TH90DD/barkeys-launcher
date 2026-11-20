// Redirect behaviour of background.js, with a mocked browser API.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

// Cross-realm objects don't deep-equal plain ones; compare their JSON form.
const plain = value => JSON.parse(JSON.stringify(value));
const tick = () => new Promise(resolve => setTimeout(resolve, 0));

// Google search request as Firefox sees it for an unknown keyword.
const google = query => ({
  type: "main_frame",
  tabId: 7,
  url: "https://www.google.com/search?q=" + encodeURIComponent(query)
});

async function loadBackground(initial = {}, { engines = [], tabs = {} } = {}) {
  const data = structuredClone(initial);
  const listeners = {};
  const calls = { create: [], search: [] };
  const sync = {
    async get(keys) {
      if (keys === null) return structuredClone(data);
      const list = Array.isArray(keys) ? keys : [keys];
      return Object.fromEntries(list.filter(k => k in data).map(k => [k, structuredClone(data[k])]));
    },
    async set(obj) { Object.assign(data, structuredClone(obj)); },
    async remove(keys) { for (const k of [].concat(keys)) delete data[k]; }
  };
  const browser = {
    storage: { sync, onChanged: { addListener() {} } },
    webRequest: {
      onBeforeRequest: { addListener(fn) { listeners.request = fn; } }
    },
    search: {
      get: async () => engines,
      search: async args => { calls.search.push(args); }
    },
    tabs: {
      get: async id => {
        if (!(id in tabs)) throw new Error("no such tab");
        return tabs[id];
      },
      create: async opts => { calls.create.push(opts); }
    },
    action: { onClicked: { addListener() {} } },
    runtime: { onInstalled: { addListener() {} }, openOptionsPage() {} }
  };
  const ctx = vm.createContext({
    browser, crypto: globalThis.crypto, TextEncoder, URL, console, setTimeout, clearTimeout
  });
  ctx.globalThis = ctx;
  for (const f of ["constants", "validate", "store", "resolve"]) {
    vm.runInContext(readFileSync(new URL(`../lib/${f}.js`, import.meta.url), "utf8"), ctx);
  }
  vm.runInContext(readFileSync(new URL("../background.js", import.meta.url), "utf8"), ctx);
  await vm.runInContext("ready", ctx); // initial settings load finished
  return { calls, request: details => listeners.request(details) };
}

test("a keyword redirects to its custom target, query encoded", async () => {
  const { request } = await loadBackground({
    "c:t1": { n: "Test", a: ["@tt"], u: "https://tt.example/?q=%s", o: 0 }
  });
  const res = plain(await request(google("@tt hello world")));
  assert.deepEqual(res, { redirectUrl: "https://tt.example/?q=hello%20world" });
});

test("a bundle opens the first site in place and the rest as background tabs", async () => {
  const { request, calls } = await loadBackground({
    "b:w1": { n: "Work", a: ["@work"], u: ["https://mail.example/", "https://cal.example/", "https://docs.example/"], o: 0 }
  }, { tabs: { 7: { index: 2 } } });

  const res = plain(await request(google("@work")));
  assert.deepEqual(res, { redirectUrl: "https://mail.example/" });

  await tick();
  assert.deepEqual(
    calls.create.map(c => [c.url, c.index, c.active]),
    [["https://cal.example/", 3, false], ["https://docs.example/", 4, false]]
  );
});

test("an unknown keyword is left alone", async () => {
  const { request, calls } = await loadBackground({
    "c:t1": { n: "Test", a: ["@tt"], u: "https://tt.example/?q=%s", o: 0 }
  });
  assert.deepEqual(plain(await request(google("hello world"))), {});
  assert.deepEqual(plain(await request(google("@unknown thing"))), {});
  await tick();
  assert.equal(calls.create.length, 0);
  assert.equal(calls.search.length, 0);
});

test("an engine keyword hands the search to Firefox and cancels the page", async () => {
  const { request, calls } = await loadBackground(
    { "e:YouTube": { a: ["@yt"] } },
    { engines: [{ name: "YouTube" }] }
  );
  const res = plain(await request(google("@yt cats")));
  assert.deepEqual(res, { cancel: true });

  await tick();
  assert.deepEqual(
    calls.search.map(s => ({ query: s.query, engine: s.engine, tabId: s.tabId })),
    [{ query: "cats", engine: "YouTube", tabId: 7 }]
  );
});

test("sub-frames and other pages are never touched", async () => {
  const { request } = await loadBackground({
    "c:t1": { n: "Test", a: ["@tt"], u: "https://tt.example/?q=%s", o: 0 }
  });
  const sub = { ...google("@tt hello"), type: "sub_frame" };
  assert.deepEqual(plain(await request(sub)), {});
  const other = { type: "main_frame", tabId: 7, url: "https://example.org/?q=%40tt+hello" };
  assert.deepEqual(plain(await request(other)), {});
});
