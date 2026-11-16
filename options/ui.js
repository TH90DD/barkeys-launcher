"use strict";
// Small DOM helpers. Text is always set via textContent – never innerHTML.

// Firefox picks the UI language automatically. Users can override it; then
// the chosen _locales/<lang>/messages.json is loaded and used instead.
let MESSAGES = null;

function formatMessage(entry, subs) {
  const list = [].concat(subs == null ? [] : subs).map(String);
  let text = entry.message;
  for (const [name, p] of Object.entries(entry.placeholders || {})) {
    const value = p.content.replace(/\$(\d)/g, (_, n) => list[n - 1] ?? "");
    text = text.split("$" + name + "$").join(value);
  }
  return text;
}

function t(key, subs) {
  if (MESSAGES && MESSAGES[key]) return formatMessage(MESSAGES[key], subs);
  return browser.i18n.getMessage(key, subs) || key;
}

// Effective UI language ("de", "en", …).
function uiLang() {
  return (UI_LANG || browser.i18n.getUILanguage()).split("-")[0];
}
let UI_LANG = null;

async function loadLanguage() {
  const { uiLang: chosen } = await browser.storage.local.get("uiLang");
  if (!chosen || !BK.LOCALES.some(l => l.code === chosen)) return;
  try {
    const res = await fetch(browser.runtime.getURL(`_locales/${chosen}/messages.json`));
    MESSAGES = await res.json();
    UI_LANG = chosen;
  } catch {
    MESSAGES = null;
  }
}
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
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

// Icons from Lucide (https://lucide.dev) v1.73.0, ISC License – see THIRD_PARTY_NOTICES.md
const ICONS = {"info":[["circle",{"cx":"12","cy":"12","r":"10"}],["path",{"d":"M12 16v-4"}],["path",{"d":"M12 8h.01"}]],"menu":[["path",{"d":"M4 5h16"}],["path",{"d":"M4 12h16"}],["path",{"d":"M4 19h16"}]],"close":[["path",{"d":"M18 6 6 18"}],["path",{"d":"m6 6 12 12"}]],"save":[["path",{"d":"M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"}],["path",{"d":"M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"}],["path",{"d":"M7 3v4a1 1 0 0 0 1 1h7"}]],"presets":[["rect",{"width":"8","height":"18","x":"3","y":"3","rx":"1"}],["path",{"d":"M7 3v18"}],["path",{"d":"M20.4 18.9c.2.5-.1 1.1-.6 1.3l-1.9.7c-.5.2-1.1-.1-1.3-.6L11.1 5.1c-.2-.5.1-1.1.6-1.3l1.9-.7c.5-.2 1.1.1 1.3.6Z"}]],"plus":[["path",{"d":"M5 12h14"}],["path",{"d":"M12 5v14"}]],"home":[["path",{"d":"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"}],["path",{"d":"M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"}]],"search":[["path",{"d":"m21 21-4.34-4.34"}],["circle",{"cx":"11","cy":"11","r":"8"}]],"link":[["path",{"d":"M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"}],["path",{"d":"M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"}]],"database":[["ellipse",{"cx":"12","cy":"5","rx":"9","ry":"3"}],["path",{"d":"M3 5V19A9 3 0 0 0 21 19V5"}],["path",{"d":"M3 12A9 3 0 0 0 21 12"}]],"book":[["path",{"d":"M12 5v16"}],["path",{"d":"M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z"}]],"shield":[["path",{"d":"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"}],["path",{"d":"m9 12 2 2 4-4"}]],"trash":[["path",{"d":"M10 11v6"}],["path",{"d":"M14 11v6"}],["path",{"d":"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"}],["path",{"d":"M3 6h18"}],["path",{"d":"M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"}]],"chevron":[["path",{"d":"m6 9 6 6 6-6"}]],"check":[["path",{"d":"M20 6 9 17l-5-5"}]],"copy":[["rect",{"width":"14","height":"14","x":"8","y":"8","rx":"2","ry":"2"}],["path",{"d":"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"}]],"download":[["path",{"d":"M12 15V3"}],["path",{"d":"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"}],["path",{"d":"m7 10 5 5 5-5"}]],"bookmark":[["path",{"d":"M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z"}]],"upload":[["path",{"d":"M12 3v12"}],["path",{"d":"m17 8-5-5-5 5"}],["path",{"d":"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"}]]};

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
  for (const [tag, attrs] of ICONS[name] || []) {
    const el = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    svg.append(el);
  }
  return svg;
}

function applyI18n(root = document) {
  for (const el of root.querySelectorAll("[data-i18n]")) el.textContent = t(el.dataset.i18n);
  for (const el of root.querySelectorAll("[data-i18n-placeholder]")) el.placeholder = t(el.dataset.i18nPlaceholder);
  for (const el of root.querySelectorAll("[data-i18n-title]")) el.title = el.ariaLabel = t(el.dataset.i18nTitle);
  for (const el of root.querySelectorAll("[data-icon]")) el.prepend(icon(el.dataset.icon));
  for (const sum of root.querySelectorAll("details > summary")) {
    sum.prepend(h("span", { class: "toggle" }, icon("chevron")));
  }
  document.documentElement.lang = uiLang();
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
    const label = btn.querySelector("span") || btn;
    const old = label.textContent;
    label.textContent = t("copied");
    setTimeout(() => { label.textContent = old; }, 1400);
  } catch { /* clipboard blocked – nothing to do */ }
}

// Shows errors under the field they belong to (.msg.error[data-for]) and
// warnings under the keywords. Falls back to the first error slot.
function showRowIssues(row, issue) {
  const errors = issue ? issue.errors : [];
  const warnings = issue ? issue.warnings : [];
  row.classList.toggle("invalid", errors.length > 0);
  const slots = [...row.querySelectorAll(".msg.error")];
  for (const slot of slots) slot.textContent = "";
  const byField = new Map();
  for (const e of errors) {
    const slot = row.querySelector(`.msg.error[data-for="${e.f}"]`) || slots[0];
    if (!slot) continue;
    byField.set(slot, [...(byField.get(slot) || []), e.m]);
    const input = slot.parentElement.querySelector("input, textarea");
    if (input) input.classList.add("bad");
  }
  for (const [slot, msgs] of byField) slot.textContent = msgs.join(" · ");
  for (const input of row.querySelectorAll("input.bad, textarea.bad")) {
    if (![...byField.keys()].some(slot => slot.parentElement.contains(input))) input.classList.remove("bad");
  }
  const warn = row.querySelector(".msg.warn");
  if (warn) warn.textContent = errors.length ? "" : warnings.join(" · ");
}

// Save + delete buttons at the end of a row. Saving is automatic anyway; the
// save button flushes right away and confirms with a check mark.
function rowActions(onDelete) {
  const save = h("button", {
    class: "icon-btn save", title: t("btnSaveNow"), "aria-label": t("btnSaveNow"),
    onclick: async () => {
      const ok = await App.saveNow();
      if (!ok) return;
      save.replaceChildren(icon("check"));
      save.classList.add("done");
      setTimeout(() => { save.replaceChildren(icon("save")); save.classList.remove("done"); }, 1400);
    }
  }, icon("save"));
  const del = h("button", { class: "icon-btn delete", title: t("btnDelete"), "aria-label": t("btnDelete"), onclick: onDelete }, icon("trash"));
  return h("div", { class: "row-actions" }, save, del);
}
