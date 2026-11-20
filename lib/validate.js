"use strict";
// Input validation. Everything that comes from the UI, from storage.sync or
// from an import file goes through these checks.

BK.normAlias = a => String(a).trim().toLowerCase();

BK.splitAliases = text =>
  String(text || "").split(/[,\s]+/).map(a => a.trim()).filter(Boolean);

BK.validAlias = a =>
  typeof a === "string" && a.length >= 1 && a.length <= BK.LIMITS.aliasLen && !/[\s,]/.test(a);

// Plain words (letters/digits only) would swallow normal searches.
BK.isPlainWord = a => /^[\p{L}\p{N}]+$/u.test(a);

BK.validEngineName = n =>
  typeof n === "string" && n.trim().length > 0 && n.length <= BK.LIMITS.engineNameLen;

BK.cleanName = n => (typeof n === "string" ? n.trim().slice(0, BK.LIMITS.nameLen) : "");

// Unique, valid aliases only (used for data coming from storage or imports).
BK.cleanAliases = list => {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const out = [];
  for (const a of list) {
    if (!BK.validAlias(a)) continue;
    const k = BK.normAlias(a);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(a.trim());
    if (out.length >= BK.LIMITS.aliasesPerEntry) break;
  }
  return out;
};

// A search URL template: http(s) only, must contain %s – and the %s must sit
// in the path, query or hash, never in the host or user info (a template like
// https://%s.example.com/ would let a keyword pick the domain).
BK.validUrlTemplate = u => {
  if (typeof u !== "string" || u.length > BK.LIMITS.urlLen || !u.includes("%s")) return false;
  try {
    const a = new URL(u.split("%s").join("x"));
    const b = new URL(u.split("%s").join("y"));
    if (a.host !== b.host || a.username !== b.username || a.password !== b.password) return false;
    return a.protocol === "https:" || a.protocol === "http:";
  } catch {
    return false;
  }
};

BK.randomId = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, b => b.toString(36).padStart(2, "0")).join("").slice(0, 10);
};

// A plain site URL (no placeholder): http(s) only.
BK.validSiteUrl = u => {
  if (typeof u !== "string" || u.length > BK.LIMITS.urlLen) return false;
  try {
    const url = new URL(u);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
};
