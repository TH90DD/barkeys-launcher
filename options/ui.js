"use strict";
// Small DOM helpers. Text is always set via textContent – never innerHTML.

const t = (key, subs) => browser.i18n.getMessage(key, subs) || key;
const $ = id => document.getElementById(id);

function h(tag, props, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "text") el.textContent = v;
    else if (k === "value") el.value = v;
    else if (k === "checked") el.checked = v;
    else if (k === "dataset") Object.assign(el.dataset, v);
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

const ICON_PATHS = {
  home: ["M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"],
  search: ["M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z", "M21 21l-4.3-4.3"],
  link: ["M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5", "M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5"],
  database: ["M4 6c0-1.66 3.58-3 8-3s8 1.34 8 3-3.58 3-8 3-8-1.34-8-3z", "M4 6v12c0 1.66 3.58 3 8 3s8-1.34 8-3V6", "M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3"],
  book: ["M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z", "M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"],
  shield: ["M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6z", "m9 12 2 2 4-4"],
  trash: ["M4 7h16", "M10 11v6M14 11v6", "M6 7l1 13h10l1-13", "M9 7V4h6v3"]
};

function icon(name) {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("class", "icon");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  for (const d of ICON_PATHS[name] || []) {
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", d);
    svg.append(p);
  }
  return svg;
}

function applyI18n(root = document) {
  for (const el of root.querySelectorAll("[data-i18n]")) el.textContent = t(el.dataset.i18n);
  for (const el of root.querySelectorAll("[data-icon]")) el.prepend(icon(el.dataset.icon));
  document.documentElement.lang = browser.i18n.getUILanguage();
}

// Only show icons that don't trigger a network request (privacy).
function safeIconUrl(u) {
  return typeof u === "string" && /^(data:image\/|moz-extension:|resource:|chrome:)/.test(u) ? u : null;
}

const Status = {
  timer: null,
  show(text, kind = "", hideAfter = 0) {
    const el = $("status");
    el.textContent = text;
    el.className = "status show " + kind;
    clearTimeout(this.timer);
    if (hideAfter) this.timer = setTimeout(() => el.classList.remove("show"), hideAfter);
  }
};

async function copyText(btn, text) {
  try {
    await navigator.clipboard.writeText(text);
    const old = btn.textContent;
    btn.textContent = t("copied");
    setTimeout(() => { btn.textContent = old; }, 1400);
  } catch { /* clipboard blocked – nothing to do */ }
}

// Fills the .msg.error / .msg.warn elements of a row from App.issues.
function showRowIssues(row, issue) {
  const errors = issue ? issue.errors : [];
  const warnings = issue ? issue.warnings : [];
  row.classList.toggle("invalid", errors.length > 0);
  const err = row.querySelector(".msg.error");
  const warn = row.querySelector(".msg.warn");
  if (err) err.textContent = errors.join(" · ");
  if (warn) warn.textContent = errors.length ? "" : warnings.join(" · ");
}
