// Extra Quran data for Search (run after quran-download.mjs; part of `npm run quran`):
//   public/quran/tr/<id>.json   translations, one [surah, ayah, text] row per ayah (Quran.com API v4)
//   public/quran/roots.json     Arabic roots: which ayahs use each root, and the root(s) of every word form
//                               (Quranic Arabic Corpus morphology, via github.com/mustafa0x/quran-morphology, GPL)
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "fs";
import path from "path";

const OUT = path.resolve("public/quran");
const CACHE = path.resolve("scripts/.quran-cache");
mkdirSync(path.join(OUT, "tr"), { recursive: true });
mkdirSync(CACHE, { recursive: true });

// id = file name on the website; qc = Quran.com translation id
export const TRANSLATIONS = [
  { id: "en-sahih", qc: 20, label: "English (Saheeh International)" },
  { id: "en-pickthall", qc: 19, label: "English (Pickthall)" },
  { id: "bn-taisirul", qc: 161, label: "Bengali (Taisirul Quran)" },
  { id: "bn-zakaria", qc: 213, label: "Bengali (Dr. Abu Bakr Zakaria)" },
  { id: "id-kemenag", qc: 33, label: "Indonesian (Islamic Affairs Ministry)" },
  { id: "ur-junagarhi", qc: 54, label: "Urdu (Muhammad Junagarhi)" },
];

const get = async (url, as = "json") => {
  for (let i = 0; i < 5; i++) {
    try { const r = await fetch(url); if (r.ok) return as === "json" ? r.json() : r.text(); } catch (e) {}
    await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
  }
  throw new Error(`failed ${url}`);
};
const clean = (t) => String(t || "").replace(/<sup[^>]*>.*?<\/sup>/g, "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

for (const t of TRANSLATIONS) {
  const d = await get(`https://api.quran.com/api/v4/quran/translations/${t.qc}`);
  const rows = d.translations;
  if (rows.length !== 6236) throw new Error(`${t.id}: expected 6236 ayahs, got ${rows.length}`);
  // rows come in Quran order; pair them with surah/ayah numbers from the Arabic text file
  const keys = JSON.parse(readFileSync(path.join(OUT, "search.json"), "utf8")).map(([s, a]) => [s, a]);
  writeFileSync(path.join(OUT, "tr", `${t.id}.json`), JSON.stringify(rows.map((r, i) => [keys[i][0], keys[i][1], clean(r.text)])));
  console.log(t.id, "ok");
}
writeFileSync(path.join(OUT, "tr", "index.json"), JSON.stringify(TRANSLATIONS.map(({ id, label }) => ({ id, label }))));

// ---- roots ----
const mf = path.join(CACHE, "quran-morphology.txt");
if (!existsSync(mf)) writeFileSync(mf, await get("https://raw.githubusercontent.com/mustafa0x/quran-morphology/master/quran-morphology.txt", "text"));
export const norm = (t) => String(t || "")
  .replace(/[ً-ٰٟۖ-ۭـ]/g, "")
  .replace(/[ٱأإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/ؤ/g, "و").replace(/ئ/g, "ي");
const words = new Map(); // s:a:w -> { text, roots:Set }
for (const line of readFileSync(mf, "utf8").split("\n")) {
  const [loc, seg, , tags] = line.split("\t");
  if (!loc || !tags) continue;
  const [s, a, w] = loc.split(":");
  const k = `${s}:${a}:${w}`;
  if (!words.has(k)) words.set(k, { s: +s, a: +a, text: "", roots: new Set() });
  const x = words.get(k);
  x.text += seg;
  const m = /ROOT:([^|]+)/.exec(tags);
  if (m) x.roots.add(m[1]);
}
const rootAyahs = {}; // root -> "s:a" list
const formRoots = {}; // normalized word -> roots
for (const x of words.values()) {
  const f = norm(x.text);
  for (const r of x.roots) {
    const nr = norm(r);
    (rootAyahs[nr] = rootAyahs[nr] || new Set()).add(`${x.s}:${x.a}`);
    (formRoots[f] = formRoots[f] || new Set()).add(nr);
  }
}
const out = {
  source: "Quranic Arabic Corpus morphology (corpus.quran.com), via github.com/mustafa0x/quran-morphology — GNU GPL",
  roots: Object.fromEntries(Object.entries(rootAyahs).map(([r, set]) => [r, [...set].join(",")])),
  forms: Object.fromEntries(Object.entries(formRoots).map(([f, set]) => [f, [...set].join(",")])),
};
writeFileSync(path.join(OUT, "roots.json"), JSON.stringify(out));
console.log(`roots: ${Object.keys(out.roots).length} roots, ${Object.keys(out.forms).length} word forms`);
