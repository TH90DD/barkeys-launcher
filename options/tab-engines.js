"use strict";
/* global App, BK, t, h, $, icon, showRowIssues, copyText */

App.register({
  render() {
    // ----- Firefox engines -----
    const box = $("engineRows");
    box.textContent = "";
    if (!App.ff.length) box.append(h("p", { class: "empty", text: t("enginesEmpty") }));

    for (const engine of App.ff) {
      const key = "e:" + engine.name;
      const entry = App.state.engines.get(engine.name);
      const input = h("input", {
        type: "text",
        class: "mono keywords",
        value: entry ? entry.a.join(", ") : "",
        placeholder: t("extraPlaceholder"),
        "aria-label": t("colExtra") + " – " + engine.name,
        spellcheck: "false",
        oninput: () => {
          App.engineEntry(engine.name).a = BK.splitAliases(input.value);
          App.changed();
        }
      });
      box.append(h("div", { class: "row grid-engines", dataset: { key } },
        h("div", { class: "engine-name" },
          engine.icon ? h("img", { src: engine.icon, alt: "" }) : h("span", { class: "fallback", text: engine.name.charAt(0) }),
          h("span", { text: engine.name }),
          engine.isDefault ? h("span", { class: "default-tag", text: t("sourceDefaultBadge") }) : null),
        h("div", { class: "mains" }, engine.mains.length
          ? engine.mains.map(a => h("span", { class: "kbd", text: a, title: t("mainActiveTip", [a, engine.name]) }))
          : h("span", { class: "none", text: t("mainNone"), title: t("mainNoneTip") })),
        h("div", { class: "field" }, input, h("div", { class: "msg error", "data-for": "keywords" }), h("div", { class: "msg warn" }))
      ));
    }

    // ----- Orphans -----
    const orphans = App.orphans();
    $("orphansCard").hidden = orphans.length === 0;
    const rows = $("orphanRows");
    rows.textContent = "";
    for (const [name, entry] of orphans) {
      const select = h("select", {
        "aria-label": t("orphanAssign"),
        onchange: () => {
          if (!select.value) return;
          const target = App.engineEntry(select.value);
          const have = new Set(target.a.map(BK.normAlias));
          for (const a of entry.a) if (!have.has(BK.normAlias(a))) target.a.push(a);
          if (!target.u && entry.u) target.u = entry.u;
          App.state.engines.delete(name);
          App.changed();
          this.render();
          App.refreshIssues();
        }
      }, h("option", { value: "", text: t("orphanAssign") }), App.ff.map(e => h("option", { value: e.name, text: e.name })));

      rows.append(h("div", { class: "row grid-engines", dataset: { key: "e:" + name } },
        h("div", { class: "engine-name" }, h("span", { text: name })),
        h("div", null, entry.a.map(a => h("span", { class: "kbd dashed", text: a })), entry.a.length ? null : h("span", { class: "muted small", text: "–" })),
        h("div", { class: "field" },
          h("div", { style: "display:flex;gap:8px;align-items:center" },
            select,
            h("button", {
              class: "icon-btn", title: t("btnDelete"), "aria-label": t("btnDelete"),
              onclick: () => { App.state.engines.delete(name); App.changed(); this.render(); App.refreshIssues(); }
            }, icon("trash"))),
          entry.u ? h("div", { class: "muted small", text: t("orphanUrl", entry.u) }) : null,
          h("div", { class: "msg error" }), h("div", { class: "msg warn" }))
      ));
    }
  },

  applyIssues() {
    for (const row of document.querySelectorAll("#panel-engines [data-key]")) {
      showRowIssues(row, App.issues.get(row.dataset.key));
    }
  }
});

// Firefox doesn't let add-ons open about:preferences, so we offer to copy it.
$("newEngine").addEventListener("click", () => { $("newEngineHelp").hidden = !$("newEngineHelp").hidden; });
$("copyPrefsUrl").addEventListener("click", e => copyText(e.currentTarget, "about:preferences#search"));
