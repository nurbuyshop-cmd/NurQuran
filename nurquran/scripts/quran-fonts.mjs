// Downloads the Quran fonts into public/fonts/quran/ (run once; files are committed):
//   v1/p1..p604.woff2   QCF V1 page fonts (King Fahd Complex, 1405H Madani Mushaf)  → "Mushaf"
//   v4/p1..p604.woff2   QCF V4 colour tajweed page fonts (COLRv1, 1421H layout)    → "Mushaf Tajweed"
//   UthmanicHafs.woff2  KFGQPC Uthmanic Script Hafs                                 → "Uthmanic"
//   IndoPak.woff2       IndoPak Nastaleeq (waqf lazim)                              → "Indopak"
import { mkdirSync, existsSync, writeFileSync, statSync } from "fs";
import path from "path";

const OUT = path.resolve("public/fonts/quran");
const CDN = "https://verses.quran.foundation/fonts/quran";
const jobs = [
  [`${CDN}/hafs/uthmanic_hafs/UthmanicHafs1Ver18.woff2`, "UthmanicHafs.woff2"],
  ["https://quran.com/fonts/quran/hafs/nastaleeq/indopak/indopak-nastaleeq-waqf-lazim-v4.2.1.woff2", "IndoPak.woff2"],
];
for (let p = 1; p <= 604; p++) {
  jobs.push([`${CDN}/hafs/v1/woff2/p${p}.woff2`, `v1/p${p}.woff2`]);
  jobs.push([`${CDN}/hafs/v4/colrv1/woff2/p${p}.woff2`, `v4/p${p}.woff2`]);
}
mkdirSync(path.join(OUT, "v1"), { recursive: true });
mkdirSync(path.join(OUT, "v4"), { recursive: true });

async function one([url, name]) {
  const f = path.join(OUT, name);
  if (existsSync(f) && statSync(f).size > 1000) return;
  for (let i = 0; i < 5; i++) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`${r.status} ${url}`);
      const b = Buffer.from(await r.arrayBuffer());
      if (b.slice(0, 4).toString() !== "wOF2") throw new Error(`not a woff2 font: ${url}`);
      writeFileSync(f, b);
      return;
    } catch (e) {
      if (i === 4) throw e;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
}
let done = 0;
async function worker() {
  while (jobs.length) { await one(jobs.shift()); if (++done % 200 === 0) console.log(done); }
}
await Promise.all(Array.from({ length: 6 }, worker));
console.log("fonts ready in", OUT);
