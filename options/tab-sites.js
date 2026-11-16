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
  render() {
    const box = $("siteRows");
    box.textContent = "";
    for (const x of App.state.sites) box.append(this.row(x));
    $("sitesEmpty").hidden = App.state.sites.length > 0;
  },

  row(x) {
    const field = (value, placeholder, cls, label, apply) => h("input", {
      type: "text",
      class: cls,
      value,
      placeholder,
      "aria-label": label,
      spellcheck: "false",
      oninput: e => { apply(e.target.value); App.changed(); }
    });
    return h("div", { class: "row grid-custom", dataset: { key: "s:" + x.id } },
      h("div", { class: "field" }, field(x.n, "Tagesschau", "", t("colName"), v => { x.n = BK.cleanName(v); })),
      h("div", { class: "field" },
        field(x.a.join(", "), "@news", "mono keywords", t("colKeywords"), v => { x.a = BK.splitAliases(v); }),
        h("div", { class: "msg error" }), h("div", { class: "msg warn" })),
      h("div", { class: "field" },
        field(x.u, "https://www.tagesschau.de/", "mono", t("colSiteUrl"), v => { x.u = withScheme(v); })),
      h("div", null, h("button", {
        class: "icon-btn", title: t("btnDelete"), "aria-label": t("btnDelete"),
        onclick: () => {
          App.state.sites = App.state.sites.filter(s => s !== x);
          App.changed();
          this.render();
          App.refreshIssues();
        }
      }, icon("trash")))
    );
  },

  add(n = "", u = "") {
    const site = { id: BK.randomId(), n, a: [], u };
    App.state.sites.push(site);
    this.render();
    App.refreshIssues();
    // Jump straight to the keyword field of the new row.
    const row = $("siteRows").lastElementChild;
    row.querySelectorAll("input")[n ? 1 : 0].focus();
    if (n || u) App.changed();
  },

  applyIssues() {
    for (const row of document.querySelectorAll("#panel-sites [data-key]")) {
      showRowIssues(row, App.issues.get(row.dataset.key));
    }
  }
};
App.register(SitesView);

$("addSite").addEventListener("click", () => SitesView.add());

// ---------- Pick from bookmarks (optional permission) ----------
let bookmarkTimer = null;

async function searchBookmarks(query) {
  const list = $("bookmarkResults");
  list.textContent = "";
  if (!query.trim()) return;
  let results = [];
  try {
    results = await browser.bookmarks.search(query.trim());
  } catch {
    return;
  }
  const known = new Set(App.state.sites.map(s => s.u));
  const hits = results.filter(b => b.url && BK.validSiteUrl(b.url)).slice(0, 8);
  if (!hits.length) {
    list.append(h("p", { class: "muted small", text: t("bookmarksNone") }));
    return;
  }
  for (const b of hits) {
    const used = known.has(b.url);
    list.append(h("button", {
      class: "bookmark-hit",
      disabled: used,
      onclick: () => {
        SitesView.add(BK.cleanName(b.title) || new URL(b.url).hostname, b.url);
        $("bookmarkPicker").hidden = true;
      }
    },
      icon("bookmark"),
      h("span", { class: "bm-title", text: b.title || new URL(b.url).hostname }),
      h("span", { class: "bm-url", text: b.url }),
      used ? h("span", { class: "default-tag", text: t("bookmarksAdded") }) : null));
  }
}

$("pickBookmark").addEventListener("click", () => {
  // permissions.request must be the first thing in the click handler.
  browser.permissions.request({ permissions: ["bookmarks"] }).then(ok => {
    if (!ok) return;
    $("bookmarkPicker").hidden = false;
    $("bookmarkSearch").focus();
  });
});

$("bookmarkSearch").addEventListener("input", e => {
  clearTimeout(bookmarkTimer);
  bookmarkTimer = setTimeout(() => searchBookmarks(e.target.value), 150);
});
$("bookmarkClose").addEventListener("click", () => { $("bookmarkPicker").hidden = true; });
