"use strict";
/* global App, BK, applyI18n, $, h, icon */

const TAB_IDS = ["welcome", "engines", "custom", "sites", "presets", "data", "guide"];

const Tabs = {
  current: null,
  show(id, { focus = false } = {}) {
    if (!TAB_IDS.includes(id)) id = "welcome";
    this.current = id;
    for (const btn of document.querySelectorAll("#tabs [data-tab]")) {
      const on = btn.dataset.tab === id;
      btn.setAttribute("aria-selected", String(on));
      btn.tabIndex = on ? 0 : -1;
      if (on && focus) btn.focus();
    }
    for (const tid of TAB_IDS) $("panel-" + tid).hidden = tid !== id;
    Menu.setCurrent(id);
    Menu.close();
    if (App.loaded) App.renderAll();
    if (location.hash !== "#" + id) history.replaceState(null, "", "#" + id);
    browser.storage.local.set({ lastTab: id });
  }
};

// Burger menu for narrow windows (CSS decides when it's visible).
const Menu = {
  setCurrent(id) {
    const btn = document.querySelector(`#tabbar [data-tab="${id}"]`);
    const box = $("menuCurrent");
    box.replaceChildren(icon(btn.dataset.icon), h("span", { text: btn.querySelector("[data-i18n]").textContent }));
  },
  open() {
    $("tabs").classList.add("open");
    $("menuToggle").setAttribute("aria-expanded", "true");
    $("menuIcon").replaceChildren(icon("close"));
  },
  close() {
    $("tabs").classList.remove("open");
    $("menuToggle").setAttribute("aria-expanded", "false");
    $("menuIcon").replaceChildren(icon("menu"));
  },
  toggle() { $("tabs").classList.contains("open") ? this.close() : this.open(); }
};

function setupTabs() {
  $("menuToggle").addEventListener("click", () => Menu.toggle());
  document.addEventListener("keydown", e => { if (e.key === "Escape") Menu.close(); });
  document.addEventListener("click", e => { if (!$("tabs").contains(e.target)) Menu.close(); });
  const buttons = [...document.querySelectorAll("#tabs [data-tab]")];
  for (const btn of buttons) {
    btn.setAttribute("aria-controls", "panel-" + btn.dataset.tab);
    $("panel-" + btn.dataset.tab).setAttribute("aria-labelledby", btn.id = "tab-" + btn.dataset.tab);
    btn.addEventListener("click", () => Tabs.show(btn.dataset.tab));
    btn.addEventListener("keydown", e => {
      const i = buttons.indexOf(btn);
      const next = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : null;
      if (next == null) return;
      e.preventDefault();
      Tabs.show(buttons[(next + buttons.length) % buttons.length].dataset.tab, { focus: true });
    });
  }
  window.addEventListener("hashchange", () => Tabs.show(location.hash.slice(1)));
}

async function refreshFromFirefox() {
  await App.loadFirefoxEngines();
  await App.refreshGranted();
  App.renderAll();
}

(async () => {
  applyI18n();
  setupTabs();
  const { lastTab } = await browser.storage.local.get("lastTab");
  Tabs.show(location.hash.slice(1) || lastTab || "welcome");

  await App.loadState();
  await refreshFromFirefox();
  App.loaded = true;

  // Coming back from Firefox's settings: engines or keywords may have changed.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && !App.saveTimer) refreshFromFirefox();
  });
  browser.permissions.onAdded.addListener(refreshFromFirefox);
  browser.permissions.onRemoved.addListener(refreshFromFirefox);

  // Changes from another device (Sync) or another open options tab.
  let timer = null;
  browser.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync" || App.writing || App.saveTimer) return;
    clearTimeout(timer);
    timer = setTimeout(async () => {
      if (App.writing || App.saveTimer) return;
      App.state = await BK.Store.load();
      App.renderAll();
    }, 300);
  });
})();
