"use strict";
/* global App, BK, t, h, $, Tabs, CustomView, uiLang */

// Presets tab: one click adds a search target to "Custom targets".
// Entries with variants (country / language) get a dropdown; the choice is
// pre-selected from the UI language and remembered while the page is open.
const GuideView = {
  chosen: new Map(),   // preset name -> variant value

  takenKeywords() {
    const taken = new Set(App.ff.flatMap(e => e.mains).map(BK.normAlias));
    for (const e of App.state.engines.values()) e.a.forEach(a => taken.add(BK.normAlias(a)));
    for (const x of [...App.state.custom, ...App.state.sites, ...App.state.bundles]) x.a.forEach(a => taken.add(BK.normAlias(a)));
    return taken;
  },

  languageName(code) {
    try { return new Intl.DisplayNames([uiLang()], { type: "language" }).of(code); } catch { return code; }
  },

  variantLabel(p, v) {
    if (p.kind === "lang") return `${this.languageName(v.v)} (${v.v})`;
    if (p.kind === "target") return "→ " + this.languageName(v.v);
    return v.v;
  },

  // The variant currently selected for a preset (or the preset itself).
  current(p) {
    if (!p.variants) return { u: p.u, name: p.n };
    const lang = uiLang();
    const value = this.chosen.get(p.n)
      || (p.variants.find(v => v.lang === lang) || p.variants[0]).v;
    const v = p.variants.find(x => x.v === value) || p.variants[0];
    return { u: v.u, name: `${p.n} (${p.kind === "target" ? "→ " + v.v : v.v})`, value: v.v };
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
        || p.n.toLowerCase().includes(filter)
        || label.toLowerCase().includes(filter)
        || (p.u || "").toLowerCase().includes(filter)
        || (p.variants || []).some(v => v.u.toLowerCase().includes(filter) || v.v.toLowerCase().includes(filter)));
      if (!items.length) continue;

      box.append(h("h4", { text: label }));
      for (const p of items) box.append(this.row(p, urls, taken));
    }
    if (!box.childElementCount) box.append(h("p", { class: "empty", text: t("presetsNone") }));
  },

  row(p, urls, taken) {
    const cur = this.current(p);
    const added = urls.has(cur.u);
    const keywordFree = !taken.has(BK.normAlias(p.a));

    const name = p.variants
      ? h("div", { class: "preset-name" },
          h("span", { text: p.n }),
          h("select", {
            class: "variant",
            "aria-label": t("presetVariant", p.n),
            onchange: e => { this.chosen.set(p.n, e.target.value); this.render(); }
          }, p.variants.map(v => {
            const opt = h("option", { value: v.v, text: this.variantLabel(p, v) });
            if (v.v === cur.value) opt.selected = true;
            return opt;
          })))
      : h("span", { class: "preset-name", text: p.n });

    return h("div", { class: "preset" },
      name,
      h("span", { class: keywordFree ? "kbd dashed" : "kbd dashed taken", text: p.a, title: keywordFree ? "" : t("presetKeywordTaken") }),
      h("code", { class: "preset-url", text: cur.u, title: cur.u }),
      h("button", {
        class: "btn small" + (added ? " ghost" : ""),
        disabled: added,
        text: t(added ? "presetAdded" : "presetAdd"),
        onclick: () => this.add({ n: cur.name, a: p.a, u: cur.u }, keywordFree)
      }));
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
