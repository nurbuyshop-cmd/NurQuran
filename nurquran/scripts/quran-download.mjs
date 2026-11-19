// Step 1 of 2: downloads the full Quran (all 604 Madani pages) from the Quran.com API
// into scripts/.quran-cache/ (raw responses, not committed).
// Run: node scripts/quran-download.mjs   then: node scripts/quran-build.mjs
//
// Source: Quran.com API v4 (Quran Foundation). Text is the verified Uthmani / KFGQPC Hafs /
// IndoPak text used by Quran.com; we never type or edit Quran text by hand.
import { mkdirSync, existsSync, writeFileSync } from "fs";
import path from "path";

const API = "https://api.quran.com/api/v4";
const OUT = path.resolve("scripts/.quran-cache");
mkdirSync(OUT, { recursive: true });

const VERSE_FIELDS = [
  "text_uthmani", "text_qpc_hafs", "text_indopak_nastaleeq",
  "juz_number", "hizb_number", "rub_el_hizb_number", "page_number", "v1_page", "v2_page", "sajdah_number",
].join(",");
const WORD_FIELDS = ["code_v1", "code_v2", "line_v1", "line_v2", "v1_page", "v2_page", "text_qpc_hafs", "text_indopak", "char_type_name", "position"].join(",");

async function get(url, tries = 5) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": "NurQuran-importer" } });
      if (r.ok) return await r.json();
      if (r.status === 404) throw new Error(`404 ${url}`);
    } catch (e) {
      if (i === tries - 1) throw e;
    }
    await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
  }
  throw new Error(`failed ${url}`);
}

async function page(n) {
  const f = path.join(OUT, `page-${String(n).padStart(3, "0")}.json`);
  if (existsSync(f)) return;
  const d = await get(`${API}/verses/by_page/${n}?words=true&per_page=300&fields=${VERSE_FIELDS}&word_fields=${WORD_FIELDS}`);
  if (d.pagination && d.pagination.total_pages > 1) throw new Error(`page ${n} has more than one result page`);
  writeFileSync(f, JSON.stringify(d.verses));
}

const chapters = await get(`${API}/chapters?language=en`);
writeFileSync(path.join(OUT, "chapters.json"), JSON.stringify(chapters.chapters));

const todo = Array.from({ length: 604 }, (_, i) => i + 1);
let done = 0;
async function worker() {
  while (todo.length) {
    const n = todo.shift();
    await page(n);
    if (++done % 50 === 0) console.log(`${done}/604`);
  }
}
await Promise.all([worker(), worker(), worker(), worker()]);
console.log("downloaded 604 pages to", OUT);
