"use strict";
/* global App, BK, t, h, $, copyText, Status */

const DataView = {
  render() {
    this.renderSources();
    this.renderUsage();
    this.renderUrls();
  },
  afterSave() { this.renderUsage(); },

  renderSources() {
    const box = $("sources");
    box.textContent = "";
    const { source: def } = App.defaultSource();
    for (const s of BK.SOURCE_ENGINES) {
      const granted = App.granted.has(s.id);
      const cb = h("input", {
        type: "checkbox",
        checked: granted,
        onchange: () => {
          // permissions.request must run directly in the user gesture.
          const p = cb.checked
            ? browser.permissions.request({ origins: s.patterns })
            : browser.permissions.remove({ origins: s.patterns });
          p.then(ok => { if (!ok) cb.checked = !cb.checked; });
        }
      });
      box.append(h("label", { class: "pill" + (granted ? " on" : "") },
        cb, s.name,
        def && def.id === s.id ? h("span", { class: "default-tag", text: t("sourceDefaultBadge") }) : null));
    }
  },

  renderUsage() {
    const { bytes, count } = BK.Store.usage(BK.Store.serialize(App.state));
    const pct = Math.min(100, (bytes / BK.LIMITS.totalBytes) * 100);
    $("syncMeter").style.width = Math.max(pct, 1.5) + "%";
    $("syncUsage").textContent = t("syncUsage", [(bytes / 1024).toFixed(1) + " KB", "100 KB", String(count)]);
  },

  renderUrls() {
    const box = $("urlRows");
    box.textContent = "";
    for (const e of App.ff) {
      const entry = App.state.engines.get(e.name);
      const input = h("input", {
        type: "text",
        class: "mono",
        value: entry ? entry.u : "",
        placeholder: "https://…%s",
        "aria-label": e.name,
        spellcheck: "false",
        oninput: () => { App.engineEntry(e.name).u = input.value.trim(); App.changed(); }
      });
      box.append(h("div", { class: "url-row" }, h("span", { text: e.name }), input));
    }
  }
};
App.register(DataView);

// ---------- Export ----------
$("export").addEventListener("click", async () => {
  if (App.saveTimer && !(await App.saveNow())) return;
  const data = BK.Store.exportData(App.state, App.ff);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = h("a", { href: url, download: `barkeys-launcher-${new Date().toISOString().slice(0, 10)}.json` });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

// ---------- Import ----------
$("importBtn").addEventListener("click", () => $("importFile").click());

$("importFile").addEventListener("change", async e => {
  const file = e.target.files[0];
  e.target.value = "";
  const box = $("importBox");
  box.hidden = false;
  box.textContent = "";
  if (!file) return;

  let imp;
  try {
    if (file.size > BK.LIMITS.importBytes) throw new BK.StoreError("importSize");
    imp = BK.Store.parseImport(await file.text());
  } catch (err) {
    box.append(h("div", { class: "import-preview" },
      h("p", { class: "msg error", text: t(err && err.code === "importSize" ? "errImportSize" : "errImportFile") })));
    return;
  }

  const merge = h("input", { type: "radio", name: "importMode", value: "merge", checked: true });
  const replace = h("input", { type: "radio", name: "importMode", value: "replace" });
  box.append(h("div", { class: "import-preview" },
    h("strong", { text: t("importPreviewTitle") }),
    h("p", { text: t("importSummary", [String(imp.engines.length), String(imp.custom.length), String(imp.keywords)]) }),
    imp.skipped ? h("p", { class: "msg warn", text: t("importSkipped", String(imp.skipped)) }) : null,
    h("label", null, merge, t("importModeMerge")),
    h("label", null, replace, t("importModeReplace")),
    h("div", { class: "actions" },
      h("button", {
        class: "btn primary",
        text: t("btnImportConfirm"),
        onclick: async () => {
          const mode = replace.checked ? "replace" : "merge";
          const res = BK.Store.applyImport(App.state, imp, mode, App.ff);
          const previous = App.state;
          App.state = res.state;
          App.validate();
          if (!(await App.saveNow())) { App.state = previous; App.renderAll(); return; }
          App.renderAll();
          showImportResult(res);
        }
      }),
      h("button", { class: "btn ghost", text: t("btnCancel"), onclick: () => { box.hidden = true; } }))
  ));
});

function showImportResult(res) {
  const box = $("importBox");
  box.textContent = "";
  const done = h("div", { class: "import-preview" },
    h("p", { text: t("importDone", [String(res.added), String(res.skipped)]) }));
  if (res.missing.length) {
    done.append(h("strong", { text: t("importMissingTitle") }), h("p", { class: "muted small", text: t("importMissingHint") }));
    for (const m of res.missing) {
      const copy = h("button", { class: "btn small", text: t("btnCopyUrl"), disabled: !m.u });
      copy.addEventListener("click", () => copyText(copy, m.u));
      done.append(h("div", { class: "missing-row" },
        h("span", { text: m.name }),
        m.main ? h("span", { class: "kbd", text: m.main }) : h("span", { class: "muted", text: "–" }),
        h("code", { text: m.u || "–", title: m.u || "" }),
        copy));
    }
  }
  box.append(done);
  Status.show(t("statusSaved"), "ok", 1800);
}

// ---------- Reset ----------
$("resetAll").addEventListener("click", async () => {
  if (!confirm(t("confirmReset"))) return;
  await BK.Store.clearAll();
  App.state = await BK.Store.load();
  App.renderAll();
  Status.show(t("statusSaved"), "ok", 1800);
});
