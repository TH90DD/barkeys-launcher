"use strict";
/* global App, BK, t, h, $, Tabs, CustomView */

// Preset list in the guide: one click adds a search target to "Custom targets".
const GuideView = {
  takenKeywords() {
    const taken = new Set(App.ff.flatMap(e => e.mains).map(BK.normAlias));
    for (const e of App.state.engines.values()) e.a.forEach(a => taken.add(BK.normAlias(a)));
    for (const x of [...App.state.custom, ...App.state.sites, ...App.state.bundles]) x.a.forEach(a => taken.add(BK.normAlias(a)));
    return taken;
  },

  render() {
    const box = $("presetList");
    box.textContent = "";
    const filter = $("presetFilter").value.trim().toLowerCase();
    const urls = new Set(App.state.custom.map(c => c.u));
    const taken = this.takenKeywords();

    for (const group of BK.PRESETS) {
      const label = t("preset_" + group.id);
      const items = group.items.filter(p => !filter
        || p.n.toLowerCase().includes(filter) || p.u.toLowerCase().includes(filter) || label.toLowerCase().includes(filter));
      if (!items.length) continue;

      box.append(h("h4", { text: label }));
      for (const p of items) {
        const added = urls.has(p.u);
        const keywordFree = !taken.has(BK.normAlias(p.a));
        box.append(h("div", { class: "preset" },
          h("span", { class: "preset-name", text: p.n }),
          h("span", { class: keywordFree ? "kbd dashed" : "kbd dashed taken", text: p.a, title: keywordFree ? "" : t("presetKeywordTaken") }),
          h("code", { class: "preset-url", text: p.u, title: p.u }),
          h("button", {
            class: "btn small" + (added ? " ghost" : ""),
            disabled: added,
            text: t(added ? "presetAdded" : "presetAdd"),
            onclick: () => this.add(p, keywordFree)
          })));
      }
    }
    if (!box.childElementCount) box.append(h("p", { class: "empty", text: t("presetsNone") }));
  },

  add(p, keywordFree) {
    const entry = { id: BK.randomId(), n: p.n, a: keywordFree ? [p.a] : [], u: p.u };
    App.state.custom.push(entry);
    App.changed();
    if (keywordFree) {
      this.render();
      return;
    }
    // Suggested keyword is taken: let the user pick one right away.
    Tabs.show("custom");
    CustomView.render();
    App.refreshIssues();
    const row = document.querySelector(`#customRows [data-key="c:${entry.id}"]`);
    if (row) row.querySelectorAll("input")[1].focus();
  }
};
App.register(GuideView);

$("presetFilter").addEventListener("input", () => GuideView.render());
