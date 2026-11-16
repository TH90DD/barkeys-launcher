"use strict";
/* global App, BK, t, h, $, icon, showRowIssues */

// "example.com" -> "https://example.com"; anything with a scheme is kept as is
// (and later rejected by validation unless it's http/https).
function withScheme(v) {
  const s = v.trim();
  if (!s || /^[a-z][a-z0-9+.-]*:/i.test(s)) return s;
  return "https://" + s;
}

const SitesView = {
  mode: "single",          // "single" | "bundles"
  lastBundle: null,        // bundle that bookmarks are added to

  render() {
    this.renderSingle();
    this.renderBundles();
  },

  input(value, placeholder, cls, label, apply) {
    return h("input", {
      type: "text", class: cls, value, placeholder, "aria-label": label, spellcheck: "false",
      oninput: e => { apply(e.target.value); App.changed(); }
    });
  },

  deleteButton(onclick) {
    return h("div", null, h("button", { class: "icon-btn", title: t("btnDelete"), "aria-label": t("btnDelete"), onclick }, icon("trash")));
  },

  // ----- Single sites -----
  renderSingle() {
    const box = $("siteRows");
    box.textContent = "";
    for (const x of App.state.sites) {
      box.append(h("div", { class: "row grid-custom", dataset: { key: "s:" + x.id } },
        h("div", { class: "field" }, this.input(x.n, "Tagesschau", "", t("colName"), v => { x.n = BK.cleanName(v); })),
        h("div", { class: "field" },
          this.input(x.a.join(", "), "@news", "mono keywords", t("colKeywords"), v => { x.a = BK.splitAliases(v); }),
          h("div", { class: "msg error", "data-for": "keywords" }), h("div", { class: "msg warn" })),
        h("div", { class: "field" },
          this.input(x.u, "https://www.tagesschau.de/", "mono", t("colSiteUrl"), v => { x.u = withScheme(v); }),
          h("div", { class: "msg error", "data-for": "url" })),
        this.deleteButton(() => {
          App.state.sites = App.state.sites.filter(s => s !== x);
          App.changed(); this.renderSingle(); App.refreshIssues();
        })
      ));
    }
    $("sitesEmpty").hidden = App.state.sites.length > 0;
  },

  addSite(n = "", u = "") {
    App.state.sites.push({ id: BK.randomId(), n, a: [], u });
    this.renderSingle();
    App.refreshIssues();
    $("siteRows").lastElementChild.querySelectorAll("input")[n ? 1 : 0].focus();
    if (n || u) App.changed();
  },

  // ----- Bundles -----
  renderBundles() {
    const box = $("bundleRows");
    box.textContent = "";
    for (const x of App.state.bundles) {
      const urls = h("textarea", {
        class: "mono urls",
        rows: String(Math.min(8, Math.max(2, x.u.length + 1))),
        placeholder: "https://mail.example.com/\nhttps://calendar.example.com/",
        "aria-label": t("colBundleUrls"),
        spellcheck: "false",
        onfocus: () => { this.lastBundle = x; },
        oninput: e => {
          x.u = e.target.value.split("\n").map(withScheme).filter(Boolean);
          e.target.rows = Math.min(8, Math.max(2, e.target.value.split("\n").length));
          App.changed();
        }
      });
      urls.value = x.u.join("\n");
      box.append(h("div", { class: "row grid-custom", dataset: { key: "b:" + x.id } },
        h("div", { class: "field" }, this.input(x.n, "Workspace", "", t("colName"), v => { x.n = BK.cleanName(v); })),
        h("div", { class: "field" },
          this.input(x.a.join(", "), "@workspace", "mono keywords", t("colKeywords"), v => { x.a = BK.splitAliases(v); }),
          h("div", { class: "msg error", "data-for": "keywords" }), h("div", { class: "msg warn" })),
        h("div", { class: "field" }, urls,
          h("div", { class: "msg muted small", text: t("bundleCount", [String(x.u.length), String(BK.LIMITS.bundleUrls)]) }),
          h("div", { class: "msg error", "data-for": "url" })),
        this.deleteButton(() => {
          App.state.bundles = App.state.bundles.filter(b => b !== x);
          if (this.lastBundle === x) this.lastBundle = null;
          App.changed(); this.renderBundles(); App.refreshIssues();
        })
      ));
    }
    $("bundlesEmpty").hidden = App.state.bundles.length > 0;
  },

  addBundle() {
    const b = { id: BK.randomId(), n: "", a: [], u: [] };
    App.state.bundles.push(b);
    this.lastBundle = b;
    this.renderBundles();
    App.refreshIssues();
    $("bundleRows").lastElementChild.querySelector("input").focus();
  },

  addToBundle(n, u) {
    let b = App.state.bundles.includes(this.lastBundle) ? this.lastBundle : null;
    if (!b) {
      b = { id: BK.randomId(), n: "", a: [], u: [] };
      App.state.bundles.push(b);
      this.lastBundle = b;
    }
    if (!b.u.includes(u)) b.u.push(u);
    this.renderBundles();
    App.changed();
  },

  setMode(mode) {
    this.mode = mode;
    for (const btn of document.querySelectorAll("#sitesMode [data-mode]")) {
      btn.setAttribute("aria-selected", String(btn.dataset.mode === mode));
    }
    $("sitesSingle").hidden = mode !== "single";
    $("sitesBundles").hidden = mode !== "bundles";
    if (!$("bookmarkPicker").hidden) Picker.open();
  },

  applyIssues() {
    for (const row of document.querySelectorAll("#panel-sites [data-key]")) {
      showRowIssues(row, App.issues.get(row.dataset.key));
    }
  }
};
App.register(SitesView);

// ---------- Bookmark picker (optional "bookmarks" permission) ----------
const Picker = {
  granted: false,
  timer: null,

  async refreshGranted() {
    this.granted = await browser.permissions.contains({ permissions: ["bookmarks"] });
  },

  // Only ever shown once the permission is granted.
  open() {
    $("pickerTitle").textContent = t(SitesView.mode === "bundles" ? "pickerTitleBundle" : "pickerTitleSite");
    $("bookmarkPicker").hidden = false;
    $("bookmarkSearch").focus();
    this.search($("bookmarkSearch").value);
  },

  close() {
    $("bookmarkPicker").hidden = true;
  },

  async search(query) {
    const list = $("bookmarkResults");
    list.textContent = "";
    if (!query.trim()) return;
    let results;
    try {
      results = await browser.bookmarks.search(query.trim());
    } catch {
      // Permission was revoked meanwhile.
      this.granted = false;
      this.close();
      return;
    }
    const used = new Set(SitesView.mode === "bundles"
      ? (App.state.bundles.includes(SitesView.lastBundle) ? SitesView.lastBundle.u : [])
      : App.state.sites.map(s => s.u));
    const hits = results.filter(b => b.url && BK.validSiteUrl(b.url)).slice(0, 8);
    if (!hits.length) {
      list.append(h("p", { class: "muted small", text: t("bookmarksNone") }));
      return;
    }
    for (const b of hits) {
      const title = b.title || new URL(b.url).hostname;
      list.append(h("button", {
        class: "bookmark-hit",
        disabled: used.has(b.url),
        onclick: () => {
          if (SitesView.mode === "bundles") {
            SitesView.addToBundle(BK.cleanName(title), b.url);
            this.search($("bookmarkSearch").value);   // stay open to add more
          } else {
            SitesView.addSite(BK.cleanName(title), b.url);
            this.close();
          }
        }
      },
        icon("bookmark"),
        h("span", { class: "bm-title", text: title }),
        h("span", { class: "bm-url", text: b.url }),
        used.has(b.url) ? h("span", { class: "default-tag", text: t("bookmarksAdded") }) : null));
    }
  }
};

for (const btn of document.querySelectorAll(".pick-bookmark")) {
  btn.addEventListener("click", () => {
    if (Picker.granted) { Picker.open(); return; }
    // permissions.request must be the first call in the click handler.
    browser.permissions.request({ permissions: ["bookmarks"] }).then(ok => {
      Picker.granted = ok;
      if (ok) Picker.open();
    });
  });
}
$("bookmarkSearch").addEventListener("input", e => {
  clearTimeout(Picker.timer);
  Picker.timer = setTimeout(() => Picker.search(e.target.value), 150);
});
$("bookmarkClose").addEventListener("click", () => Picker.close());
$("addSite").addEventListener("click", () => SitesView.addSite());
$("addBundle").addEventListener("click", () => SitesView.addBundle());
for (const btn of document.querySelectorAll("#sitesMode [data-mode]")) {
  btn.addEventListener("click", () => SitesView.setMode(btn.dataset.mode));
}
Picker.refreshGranted();
browser.permissions.onRemoved.addListener(() => Picker.refreshGranted().then(() => { if (!Picker.granted) Picker.close(); }));
browser.permissions.onAdded.addListener(() => Picker.refreshGranted());
