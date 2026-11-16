"use strict";
/* global App, BK, t, h, $ */

App.register({
  render() {
    const list = $("setup");
    list.textContent = "";
    const item = (ok, title, text, action) => list.append(
      h("li", { class: "check " + (ok ? "ok" : "todo") },
        h("span", { class: "state", text: ok ? "✓" : "!" }),
        h("div", null, h("strong", { text: title }), text ? h("p", { text }) : null),
        action || h("span"))
    );

    // 1. Default search engine allowed?
    const { def, source } = App.defaultSource();
    if (source) {
      const ok = App.granted.has(source.id);
      item(ok,
        t(ok ? "setupDefaultOk" : "setupDefaultTodo", def.name),
        ok ? "" : t("setupDefaultTodoText"),
        ok ? null : h("button", {
          class: "btn primary small",
          text: t("btnAllow"),
          onclick: () => App.requestSource(source)
        }));
    } else {
      item(false,
        t("setupDefaultUnsupported", def ? def.name : "–"),
        t("setupDefaultUnsupportedText", BK.SOURCE_ENGINES.map(s => s.name).join(", ")));
    }

    // 2. Main keywords in Firefox
    const mains = App.ff.filter(e => e.mains.length).length;
    item(mains > 0,
      mains ? t("setupMainOk", String(mains)) : t("setupMainTodo"),
      mains ? "" : t("setupMainTodoText"),
      mains ? null : h("button", { class: "btn small", text: t("btnHowTo"), onclick: () => Tabs.show("guide") }));

    // 3. Extra keywords in Barkeys
    const extras = [...App.state.engines.values()].reduce((s, e) => s + e.a.length, 0)
      + App.state.custom.reduce((s, c) => s + c.a.length, 0)
      + App.state.sites.reduce((s, x) => s + x.a.length, 0);
    item(extras > 0,
      extras ? t("setupExtraOk", String(extras)) : t("setupExtraTodo"),
      extras ? "" : t("setupExtraTodoText"),
      extras ? null : h("button", { class: "btn small", text: t("btnGoEngines"), onclick: () => Tabs.show("engines") }));
  },
  afterSave() { this.render(); }
});
