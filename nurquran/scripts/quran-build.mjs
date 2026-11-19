// Step 2 of 2: turns the downloaded Quran.com data (scripts/.quran-cache) into the small static files
// the reader loads page by page:
//   public/quran/index.json          surah / juz start pages for both layouts, bismillah text
//   public/quran/v2/001.json ...     1421H Madani layout (Uthmanic Hafs, Mushaf Tajweed, IndoPak)
//   public/quran/v1/001.json ...     1405H Madani layout (Mushaf, QCF V1 page fonts)
//   public/quran/search.json         plain Uthmani text of every ayah (loaded only when searching)
// Every page has exactly 15 lines (pages 1–2: 8). A line is a surah header, a bismillah, or words.
// Nothing here is typed by hand: all Arabic comes from the source text.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from "fs";
import path from "path";

const SRC = path.resolve("scripts/.quran-cache");
const OUT = path.resolve("public/quran");
const files = readdirSync(SRC).filter((f) => f.startsWith("page-")).sort();
const verses = files.flatMap((f) => JSON.parse(readFileSync(path.join(SRC, f), "utf8")));
const fail = (m) => { console.error("ERROR:", m); process.exit(1); };

if (verses.length !== 6236) fail(`expected 6236 ayahs, got ${verses.length}`);
const keys = new Set(verses.map((v) => v.verse_key));
if (keys.size !== 6236) fail("duplicate ayahs");

const LETTER = /[ء-يٱ-ۓۺ-ۿݐ-ݿ]/;
const PUA = /[-]/g;

// IndoPak (Nastaleeq) text comes per ayah; split it into the same words as the Uthmani word list.
let indoFallback = 0;
let fixedOrder = 0;
function indoWords(v, n) {
  const full = v.text_indopak_nastaleeq || "";
  const end = (full.match(PUA) || []).join("");
  const toks = [];
  full.replace(PUA, "").trim().split(/\s+/).forEach((t) => {
    if (!t) return;
    if (LETTER.test(t) || !toks.length) toks.push(t); else toks[toks.length - 1] += " " + t; // pause marks join the word before
  });
  if (toks.length === n) return { words: toks, end };
  // a few ayahs split differently: spread the tokens evenly over the Uthmani words (only affects line breaks)
  indoFallback++;
  const out = Array.from({ length: n }, () => []);
  toks.forEach((t, i) => out[Math.min(n - 1, Math.floor((i * n) / toks.length))].push(t));
  return { words: out.map((x) => x.join(" ")), end };
}

const meta = {}; // verse key -> {juz, hizb, rub}
const words = []; // flat list with both layouts' positions
for (const v of verses) {
  const [s, a] = v.verse_key.split(":").map(Number);
  meta[v.verse_key] = { j: v.juz_number, h: v.hizb_number, r: v.rub_el_hizb_number, sj: v.sajdah_number ? 1 : 0 };
  const ws = v.words.slice().sort((x, y) => x.position - y.position);
  const real = ws.filter((w) => w.char_type_name === "word");
  const indo = indoWords(v, real.length);
  let wi = 0;
  // the source has one ayah-end marker (84:21) listed one line above its last word: keep words in reading order
  for (let i = 1; i < ws.length; i++) {
    for (const [P, L] of [["v1_page", "line_v1"], ["v2_page", "line_v2"]]) {
      const a = ws[i - 1], c = ws[i];
      if (c[P] < a[P] || (c[P] === a[P] && c[L] < a[L])) { fixedOrder++; ws[i] = { ...c, [P]: a[P], [L]: a[L] }; }
    }
  }
  for (const w of ws) {
    const isEnd = w.char_type_name === "end";
    if (!isEnd && w.char_type_name !== "word") fail(`unknown word type ${w.char_type_name} in ${v.verse_key}`);
    if (!w.code_v1 || !w.code_v2 || !w.text_qpc_hafs) fail(`missing word data in ${v.verse_key}`);
    words.push({
      s, a, e: isEnd,
      p1: w.v1_page, l1: w.line_v1, g1: w.code_v1,
      p2: w.v2_page, l2: w.line_v2, g2: w.code_v2,
      q: w.text_qpc_hafs,
      i: isEnd ? indo.end || w.text_indopak : indo.words[wi++],
    });
  }
}

// Bismillah line text = ayah 1:1 without its end marker (taken from the source, not typed)
const fatiha1 = words.filter((w) => w.s === 1 && w.a === 1 && !w.e);
const bism = { q: fatiha1.map((w) => w.q).join(" "), i: fatiha1.map((w) => w.i).join(" ") };

function buildLayout(id, P, L) {
  const pages = new Map(); // page -> Map(line -> words[])
  for (const w of words) {
    if (!pages.has(w[P])) pages.set(w[P], new Map());
    const lines = pages.get(w[P]);
    if (!lines.has(w[L])) lines.set(w[L], []);
    lines.get(w[L]).push(w);
  }
  if (pages.size !== 604) fail(`${id}: expected 604 pages, got ${pages.size}`);
  const maxLine = (p) => (p <= 2 ? 8 : 15);
  // fill surah headers / bismillah into the empty lines right before each surah's first word
  const special = new Map(); // `${p}:${l}` -> {t, s}
  const surahStart = [];
  for (let s = 1; s <= 114; s++) {
    const first = words.find((w) => w.s === s && w.a === 1);
    surahStart[s - 1] = first[P];
    const need = s === 1 || s === 9 ? ["h"] : ["h", "b"];
    let p = first[P], l = first[L];
    for (let k = need.length - 1; k >= 0; k--) {
      l--;
      if (l < 1) { p--; l = maxLine(p); }
      const lines = pages.get(p);
      if (lines.has(l) || special.has(`${p}:${l}`)) fail(`${id}: no empty line for surah ${s} ${need[k]}`);
      special.set(`${p}:${l}`, { t: need[k], s });
    }
    if (special.get(`${p}:${l}`).t === "h" && p !== first[P]) surahStart[s - 1] = p; // header sits on the previous page
  }
  const dir = path.join(OUT, id);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const juzStart = Array(30).fill(0);
  let bytes = 0;
  for (let p = 1; p <= 604; p++) {
    const lines = pages.get(p);
    const out = [];
    for (let l = 1; l <= maxLine(p); l++) {
      const sp = special.get(`${p}:${l}`);
      const ws = lines.get(l);
      if (sp && ws) fail(`${id}: page ${p} line ${l} is both header and words`);
      if (sp) out.push(sp.t === "h" ? { h: sp.s } : { b: sp.s });
      else if (ws) out.push({ w: ws.map((w) => (id === "v1" ? [w.s, w.a, w.g1, w.e ? 1 : 0] : [w.s, w.a, w.g2, w.q, w.i, w.e ? 1 : 0])) });
      else fail(`${id}: page ${p} line ${l} is empty`);
    }
    const firstW = [...lines.values()].flat().sort((x, y) => x.s - y.s || x.a - y.a)[0];
    const m = meta[`${firstW.s}:${firstW.a}`];
    if (!juzStart[m.j - 1]) juzStart[m.j - 1] = p;
    const json = JSON.stringify({ p, j: m.j, hz: m.h, lines: out });
    bytes += json.length;
    writeFileSync(path.join(dir, `${String(p).padStart(3, "0")}.json`), json);
  }
  // juz that begins mid-page: point to the page holding its first ayah
  for (const [k, m] of Object.entries(meta)) {
    const [s, a] = k.split(":").map(Number);
    const w = words.find((x) => x.s === s && x.a === a);
    if (!juzStart[m.j - 1] || w[P] < juzStart[m.j - 1]) juzStart[m.j - 1] = w[P];
  }
  // where every ayah is (page) — used by "go to ayah", bookmarks and search
  const ayahPage = {};
  for (const w of words) if (!ayahPage[`${w.s}:${w.a}`]) ayahPage[`${w.s}:${w.a}`] = w[P];
  console.log(`${id}: 604 pages, ${(bytes / 1024 / 1024).toFixed(1)} MB`);
  return { surahStart, juzStart, ayahPage };
}

const v2 = buildLayout("v2", "p2", "l2");
const v1 = buildLayout("v1", "p1", "l1");

// compact ayah→page: one array per surah
const pack = (ap) => Array.from({ length: 114 }, (_, i) => { const out = []; for (let a = 1; ap[`${i + 1}:${a}`]; a++) out.push(ap[`${i + 1}:${a}`]); return out; });
writeFileSync(path.join(OUT, "index.json"), JSON.stringify({
  source: "Quran.com API v4 (Quran Foundation) — Uthmani, KFGQPC Hafs and IndoPak Nastaleeq text, QCF V1/V2 word codes",
  built: new Date().toISOString().slice(0, 10),
  ayahs: 6236,
  bism,
  v2: { surah: v2.surahStart, juz: v2.juzStart, ayah: pack(v2.ayahPage) },
  v1: { surah: v1.surahStart, juz: v1.juzStart, ayah: pack(v1.ayahPage) },
}));
// [surah, ayah, Uthmani text (for searching / sharing), KFGQPC Hafs text (for showing, with the ayah number)]
const byKey = new Map(verses.map((v) => [v.verse_key, v]));
const ordered = [];
for (let s = 1; s <= 114; s++) for (let a = 1; byKey.has(`${s}:${a}`); a++) ordered.push(byKey.get(`${s}:${a}`));
writeFileSync(path.join(OUT, "search.json"), JSON.stringify(ordered.map((v) => { const [s, a] = v.verse_key.split(":").map(Number); return [s, a, v.text_uthmani, v.text_qpc_hafs]; })));
console.log(`index.json + search.json written; IndoPak ayahs split by spreading: ${indoFallback}; word positions put back in reading order: ${fixedOrder}`);
