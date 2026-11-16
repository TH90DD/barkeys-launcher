/* global SOURCE_ENGINES, DEFAULT_SHORTCUTS, splitAliases */
"use strict";

const t = (key, subs) => browser.i18n.getMessage(key, subs) || key;
const $ = id => document.getElementById(id);
const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};

for (const node of document.querySelectorAll("[data-i18n]")) {
  node.textContent = t(node.dataset.i18n);
}

let firefoxEngines = [];   // [{ name, alias, favIconUrl }]
let engineAliases = {};    // engine name -> [extra keywords]

function showStatus(text, isError = false) {
  const s = $("status");
  s.textContent = text;
  s.classList.toggle("error", isError);
}

// ---------- 1. Default search engine (host permissions) ----------

async function renderSources() {
  const box = $("sources");
  box.textContent = "";
  for (const engine of SOURCE_ENGINES) {
    const granted = await browser.permissions.contains({ origins: engine.patterns });
    const label = el("label", "pill" + (granted ? " on" : ""));
    const cb = el("input");
    cb.type = "checkbox";
    cb.checked = granted;
    cb.addEventListener("change", async () => {
      // permissions.request must run directly inside the user gesture.
      const ok = cb.checked
        ? await browser.permissions.request({ origins: engine.patterns })
        : await browser.permissions.remove({ origins: engine.patterns });
      if (!ok) cb.checked = !cb.checked;
      renderSources();
    });
    label.append(cb, document.createTextNode(engine.name));
    box.append(label);
  }
}

// ---------- 2. Firefox search engines + extra keywords ----------

async function loadFirefoxEngines() {
  try {
    firefoxEngines = (await browser.search.get()).map(e => ({
      name: e.name, alias: (e.alias || "").trim(), favIconUrl: e.favIconUrl
    }));
  } catch {
    firefoxEngines = [];
  }
}

function renderFirefoxEngines() {
  const box = $("ffEngines");
  // Keep focus/typing intact: only rebuild if the set of engines changed.
  const sig = JSON.stringify(firefoxEngines.map(e => [e.name, e.alias]));
  if (box.dataset.sig === sig) return validateAll();
  box.dataset.sig = sig;
  box.textContent = "";

  for (const engine of firefoxEngines) {
    const row = el("div", "row ff-row");

    const name = el("div", "engine-name");
    if (engine.favIconUrl) {
      const img = el("img");
      img.src = engine.favIconUrl;
      img.alt = "";
      name.append(img);
    }
    name.append(el("span", null, engine.name));

    const main = el("div", "main-alias");
    if (engine.alias) {
      main.append(el("span", "chip-mini", engine.alias));
      main.title = t("mainActiveTip", [engine.alias, engine.name]);
    } else {
      const none = el("span", "muted", t("mainNone"));
      none.title = t("mainNoneTip");
      main.append(none);
    }

    const input = el("input", "extra");
    input.value = (engineAliases[engine.name] || []).join(", ");
    input.placeholder = t("extraPlaceholder");
    input.dataset.engine = engine.name;
    input.addEventListener("input", scheduleSave);

    const wrap = el("div", "extra-wrap");
    wrap.append(input, el("div", "row-error"));

    row.append(name, main, wrap);
    box.append(row);
  }
  validateAll();
}

// ---------- 3. Custom targets (URL, no Firefox engine) ----------

function addRow(s = { name: "", aliases: [], url: "" }) {
  const row = el("div", "row custom-row");
  const input = (value, placeholder, cls) => {
    const i = el("input", cls);
    i.value = value;
    i.placeholder = placeholder;
    i.addEventListener("input", scheduleSave);
    return i;
  };
  const extraWrap = el("div", "extra-wrap");
  extraWrap.append(input(s.aliases.join(", "), "@yt, @youtube", "aliases"), el("div", "row-error"));
  const del = el("button", "icon", "✕");
  del.title = t("btnDelete");
  del.addEventListener("click", () => { row.remove(); scheduleSave(); });
  row.append(
    input(s.name, "YouTube", "name"),
    extraWrap,
    input(s.url, "https://www.youtube.com/results?search_query=%s", "url"),
    del
  );
  $("rows").append(row);
}

// ---------- Validation + autosave ----------

function collect() {
  const firefoxMain = new Map(
    firefoxEngines.filter(e => e.alias).map(e => [e.alias.toLowerCase(), e.name])
  );
  const seen = new Map();
  let valid = true;

  const check = (input, aliases, label) => {
    const errors = [];
    for (const a of aliases) {
      const k = a.toLowerCase();
      if (firefoxMain.has(k)) errors.push(t("errFirefoxAlias", [a, firefoxMain.get(k)]));
      else if (seen.has(k)) errors.push(t("errDuplicate", [a, seen.get(k)]));
      else seen.set(k, label);
    }
    return errors;
  };
  const mark = (row, errors) => {
    row.querySelector(".row-error").textContent = errors.join(" · ");
    row.classList.toggle("invalid", errors.length > 0);
    if (errors.length) valid = false;
  };

  const newEngineAliases = {};
  for (const input of document.querySelectorAll("#ffEngines input.extra")) {
    const aliases = splitAliases(input.value);
    mark(input.closest(".row"), check(input, aliases, input.dataset.engine));
    if (aliases.length) newEngineAliases[input.dataset.engine] = aliases;
  }
  // Keep keywords of engines that are temporarily missing (e.g. renamed).
  for (const [name, aliases] of Object.entries(engineAliases)) {
    if (!firefoxEngines.some(e => e.name === name)) newEngineAliases[name] = aliases;
  }

  const shortcuts = [];
  for (const row of document.querySelectorAll("#rows .row")) {
    const name = row.querySelector(".name").value.trim();
    const aliases = splitAliases(row.querySelector(".aliases").value);
    const url = row.querySelector(".url").value.trim();
    if (!name && !aliases.length && !url) { mark(row, []); continue; }
    const label = name || url;
    const errors = check(null, aliases, label);
    if (!aliases.length) errors.push(t("errNoAlias"));
    if (url && !/^https?:\/\/.+%s/.test(url)) errors.push(t("errUrl"));
    if (!url) errors.push(t("errUrl"));
    mark(row, errors);
    shortcuts.push({ name, aliases, url });
  }
  return { valid, engineAliases: newEngineAliases, shortcuts };
}

function validateAll() { collect(); }

let saveTimer = null;
function scheduleSave() {
  showStatus(t("statusUnsaved"));
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const data = collect();
    if (!data.valid) return showStatus(t("statusInvalid"), true);
    await browser.storage.sync.set({ engineAliases: data.engineAliases, shortcuts: data.shortcuts });
    engineAliases = data.engineAliases;
    showStatus(t("statusSaved"));
  }, 400);
}

// ---------- Buttons ----------

$("openPrefs").addEventListener("click", async () => {
  $("newEngineHelp").hidden = false;
  try {
    await browser.tabs.create({ url: "about:preferences#search" });
  } catch {
    // Firefox doesn't let add-ons open its settings – the steps are shown instead.
  }
});

$("add").addEventListener("click", () => {
  addRow();
  $("rows").lastElementChild.querySelector("input").focus();
});

$("reset").addEventListener("click", () => {
  if (!confirm(t("confirmReset"))) return;
  $("rows").textContent = "";
  DEFAULT_SHORTCUTS.forEach(addRow);
  scheduleSave();
});

// Re-read Firefox's engines when coming back from its settings.
document.addEventListener("visibilitychange", async () => {
  if (document.visibilityState !== "visible") return;
  await loadFirefoxEngines();
  renderFirefoxEngines();
});

// ---------- Init ----------

$("guide").addEventListener("toggle", () => {
  browser.storage.local.set({ guideOpen: $("guide").open });
});

(async () => {
  const { guideOpen } = await browser.storage.local.get("guideOpen");
  if (guideOpen === false) $("guide").open = false;
  renderSources();
  const data = await browser.storage.sync.get(["engineAliases", "shortcuts"]);
  engineAliases = data.engineAliases && typeof data.engineAliases === "object" ? data.engineAliases : {};
  const shortcuts = Array.isArray(data.shortcuts) ? data.shortcuts : DEFAULT_SHORTCUTS;
  shortcuts.forEach(addRow);
  if (shortcuts.length) $("customSection").open = true;
  await loadFirefoxEngines();
  renderFirefoxEngines();
})();
