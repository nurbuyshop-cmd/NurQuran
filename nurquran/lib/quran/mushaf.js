"use client";
// Full Quran, loaded page by page from the site's own static files (public/quran, built by
// scripts/quran-build.mjs from the Quran.com API). Fonts live in public/fonts/quran.
import { SURAHS } from "./meta";

// where /quran and /fonts are served from ("" = this website)
export const BASE = (typeof window !== "undefined" && window.__QURAN_BASE__) || process.env.NEXT_PUBLIC_QURAN_BASE || "";

// The four Quran fonts. layout: which page layout the words follow.
export const FONTS = [
  { id: "indopak", label: "Indopak", layout: "v2" },
  { id: "tajweed", label: "Mushaf Tajweed", layout: "v2" },
  { id: "mushaf", label: "Mushaf", layout: "v1" },
  { id: "uthmanic", label: "Uthmanic", layout: "v2" },
];
export const fontInfo = (id) => FONTS.find((f) => f.id === id) || FONTS[0];
export const TOTAL_PAGES = 604;

// colour tajweed fonts (COLRv1) work in Chrome, Edge, Firefox, Android; not in Safari / iPhone
export function supportsColorFont() {
  try { return typeof CSS !== "undefined" && CSS.supports("font-tech(color-COLRv1)"); } catch (e) { return false; }
}

/* ---------- static fonts (one file each) ---------- */
let staticFontsAdded = false;
export function addStaticFonts() {
  if (staticFontsAdded || typeof document === "undefined") return;
  staticFontsAdded = true;
  const css = `
@font-face{font-family:"NQ Uthmanic";src:url("${BASE}/fonts/quran/UthmanicHafs.woff2") format("woff2");font-display:block}
@font-face{font-family:"NQ IndoPak";src:url("${BASE}/fonts/quran/IndoPak.woff2") format("woff2");font-display:block}`;
  const st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);
}

/* ---------- per-page fonts (Mushaf = v1, Mushaf Tajweed = v4) ---------- */
const pageFonts = new Map();
export function pageFontFamily(kind, p) { return `nq${kind}p${p}`; }
export function loadPageFont(kind, p) {
  const k = `${kind}:${p}`;
  if (pageFonts.has(k)) return pageFonts.get(k);
  const fam = pageFontFamily(kind, p);
  const pr = (async () => {
    const ff = new FontFace(fam, `url("${BASE}/fonts/quran/${kind}/p${p}.woff2") format("woff2")`, { display: "block" });
    await ff.load();
    document.fonts.add(ff);
    return fam;
  })();
  pr.catch(() => pageFonts.delete(k));
  pageFonts.set(k, pr);
  return pr;
}

/* ---------- data ---------- */
const cache = new Map();
function getJSON(url) {
  if (cache.has(url)) return cache.get(url);
  const pr = fetch(url).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); });
  pr.catch(() => cache.delete(url));
  cache.set(url, pr);
  return pr;
}
export const loadIndex = () => getJSON(`${BASE}/quran/index.json`);
// previews can ship one file per layout instead of 604 (window.__QURAN_BUNDLE__)
export const loadPage = (layout, p) =>
  typeof window !== "undefined" && window.__QURAN_BUNDLE__
    ? getJSON(`${BASE}/quran/${layout}.all.json`).then((all) => all[p - 1])
    : getJSON(`${BASE}/quran/${layout}/${String(p).padStart(3, "0")}.json`);
export const loadSearch = () => getJSON(`${BASE}/quran/search.json`);

// every ayah in order — used by the audio player and bookmarks
export const ALL_AYAHS = SURAHS.flatMap((s) => Array.from({ length: s.ayahs }, (_, i) => ({ s: s.n, a: i + 1 })));

// index helpers
export function pageOfAyah(index, layout, s, a) {
  const arr = index && index[layout] && index[layout].ayah[s - 1];
  return arr ? arr[Math.min(arr.length, Math.max(1, a)) - 1] : 1;
}
export function surahOfPage(index, layout, p) {
  if (!index) return 1;
  const st = index[layout].surah;
  let s = 1;
  for (let i = 0; i < 114; i++) if (st[i] <= p) s = i + 1;
  return s;
}
export function juzOfPage(index, layout, p) {
  if (!index) return 1;
  const st = index[layout].juz;
  let j = 1;
  for (let i = 0; i < 30; i++) if (st[i] <= p) j = i + 1;
  return j;
}
