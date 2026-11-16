"use strict";
/* global App, BK, t, h, $, icon, showRowIssues */

const CustomView = {
  render() {
    const box = $("customRows");
    box.textContent = "";
    for (const c of App.state.custom) box.append(this.row(c));
    $("customEmpty").hidden = App.state.custom.length > 0;
  },

  row(c) {
    const field = (value, placeholder, cls, label, apply) => h("input", {
      type: "text",
      class: cls,
      value,
      placeholder,
      "aria-label": label,
      spellcheck: "false",
      oninput: e => { apply(e.target.value); App.changed(); }
    });
    return h("div", { class: "row grid-custom", dataset: { key: "c:" + c.id } },
      h("div", { class: "field" }, field(c.n, "OpenStreetMap", "", t("colName"), v => { c.n = BK.cleanName(v); })),
      h("div", { class: "field" },
        field(c.a.join(", "), "@osm", "mono keywords", t("colKeywords"), v => { c.a = BK.splitAliases(v); }),
        h("div", { class: "msg error" }), h("div", { class: "msg warn" })),
      h("div", { class: "field" },
        field(c.u, "https://www.openstreetmap.org/search?query=%s", "mono", t("colUrl"), v => { c.u = v.trim(); })),
      h("div", null, h("button", {
        class: "icon-btn", title: t("btnDelete"), "aria-label": t("btnDelete"),
        onclick: () => {
          App.state.custom = App.state.custom.filter(x => x !== c);
          App.changed();
          this.render();
          App.refreshIssues();
        }
      }, icon("trash")))
    );
  },

  applyIssues() {
    for (const row of document.querySelectorAll("#panel-custom [data-key]")) {
      showRowIssues(row, App.issues.get(row.dataset.key));
    }
  }
};
App.register(CustomView);

$("addCustom").addEventListener("click", () => {
  App.state.custom.push({ id: BK.randomId(), n: "", a: [], u: "" });
  CustomView.render();
  App.refreshIssues();
  $("customRows").lastElementChild.querySelector("input").focus();
});

$("addExamples").addEventListener("click", () => {
  const taken = new Set(App.ff.filter(e => e.alias).map(e => BK.normAlias(e.alias)));
  for (const e of App.state.engines.values()) e.a.forEach(a => taken.add(BK.normAlias(a)));
  for (const c of App.state.custom) c.a.forEach(a => taken.add(BK.normAlias(a)));
  const urls = new Set(App.state.custom.map(c => c.u));
  for (const ex of BK.EXAMPLES) {
    if (urls.has(ex.u)) continue;
    const a = ex.a.filter(x => !taken.has(BK.normAlias(x)));
    if (a.length) App.state.custom.push({ id: BK.randomId(), n: ex.n, a: [...a], u: ex.u });
  }
  CustomView.render();
  App.changed();
});
