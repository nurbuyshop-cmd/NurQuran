// Validation for Quran pages sent from the admin panel.
const { SURAHS, TOTAL_PAGES } = require("./meta");

const ARABIC = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;
const LATIN = /[A-Za-z]/;

function int(v) {
  const n = Number(v);
  return Number.isInteger(n) ? n : NaN;
}

// Returns { page } (cleaned) or { errors: [...] }
function validatePage(input, allPages, langs, editingPage) {
  const errors = [];
  const page = int(input.page);
  const juz = int(input.juz);
  const hizb = input.hizb === "" || input.hizb == null ? null : int(input.hizb);
  if (!(page >= 1 && page <= TOTAL_PAGES)) errors.push(`Page number must be between 1 and ${TOTAL_PAGES}.`);
  if (!(juz >= 1 && juz <= 30)) errors.push("Juz must be between 1 and 30.");
  if (hizb !== null && !(hizb >= 1 && hizb <= 60)) errors.push("Hizb must be between 1 and 60.");
  if (allPages.some((p) => p.page === page && p.page !== editingPage)) errors.push(`Page ${page} already exists. Edit that page instead.`);
  if (!Array.isArray(input.blocks) || !input.blocks.length) errors.push("Add at least one block (surah title, bismillah or ayah).");

  const blocks = [];
  const seen = new Set();
  // ayahs already used on other pages
  const used = new Map();
  allPages.forEach((p) => {
    if (p.page === editingPage) return;
    p.blocks.forEach((b) => b.t === "ayah" && used.set(`${b.s}:${b.a}`, p.page));
  });

  (input.blocks || []).forEach((b, i) => {
    const where = `Block ${i + 1}`;
    if (b.t === "surah") {
      const s = int(b.s);
      if (!(s >= 1 && s <= 114)) errors.push(`${where}: choose a surah.`);
      blocks.push({ t: "surah", s });
    } else if (b.t === "bismillah") {
      blocks.push({ t: "bismillah" });
    } else if (b.t === "ayah") {
      const s = int(b.s), a = int(b.a);
      const text = String(b.text || "").trim().replace(/\s+/g, " ");
      if (!(s >= 1 && s <= 114)) { errors.push(`${where}: choose a surah.`); return; }
      const max = SURAHS[s - 1].ayahs;
      if (!(a >= 1 && a <= max)) errors.push(`${where}: Surah ${SURAHS[s - 1].en} has ayahs 1–${max}.`);
      if (!text) errors.push(`${where} (${s}:${a}): Arabic text is empty.`);
      else if (!ARABIC.test(text)) errors.push(`${where} (${s}:${a}): text must be Arabic.`);
      else if (LATIN.test(text)) errors.push(`${where} (${s}:${a}): Arabic text contains English letters.`);
      const k = `${s}:${a}`;
      if (seen.has(k)) errors.push(`${where}: ayah ${k} appears twice on this page.`);
      if (used.has(k)) errors.push(`${where}: ayah ${k} is already on page ${used.get(k)}.`);
      seen.add(k);
      const tr = {};
      if (b.tr && typeof b.tr === "object") {
        Object.entries(b.tr).forEach(([lang, v]) => {
          const t = String(v || "").trim();
          if (t && langs.includes(lang)) tr[lang] = t;
        });
      }
      const out = { t: "ayah", s, a, text };
      if (Object.keys(tr).length) out.tr = tr;
      if (b.audio && typeof b.audio === "string") out.audio = b.audio.trim();
      blocks.push(out);
    } else {
      errors.push(`${where}: unknown block type.`);
    }
  });

  if (errors.length) return { errors };
  return { page: { page, juz, ...(hizb ? { hizb } : {}), blocks } };
}

module.exports = { validatePage };
