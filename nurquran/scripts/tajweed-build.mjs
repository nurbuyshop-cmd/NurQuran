// Learn Tajweed (Qaida) lessons → public/tajweed/lessons.json (and a copy for the admin panel).
// Letter lessons are built letter by letter; word lessons take real words from the Quran text (KFGQPC Hafs, from
// scripts/.quran-cache) so every word is exact, and each comes with its word-by-word recitation from Quran.com.
// Run after quran-download.mjs:  node scripts/tajweed-build.mjs
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";

const SRC = path.resolve("scripts/.quran-cache");
const verses = readdirSync(SRC).filter((f) => f.startsWith("page-")).sort().flatMap((f) => JSON.parse(readFileSync(path.join(SRC, f), "utf8")));

// marks used by the KFGQPC Hafs text
const FATHA = "َ", DAMMA = "ُ", KASRA = "ِ", SUKUN = "ۡ", SHADDA = "ّ", MADD = "ٓ";
const TANWEEN = /[ً-ࣰٍ-ࣲ]/;
const HARAKA = /[َ-ِ]/;
const LETTER = /[ء-غف-يٱ]/g;
const OTHER_MARKS = /[ۖ-ۜ۟۠ۢ-ۤۧ-ۭٕٜٔ]/; // pause signs, silent letters, special marks
const letters = (t) => (t.match(LETTER) || []).length;

// every distinct Quran word with its first place in the Quran
const words = new Map();
for (const v of verses) {
  const [s, a] = v.verse_key.split(":").map(Number);
  for (const w of v.words) {
    if (w.char_type_name !== "word") continue;
    const t = w.text_qpc_hafs.trim();
    if (/\s/.test(t)) continue;
    const cur = words.get(t);
    if (cur) cur.n++;
    else words.set(t, { t, s, a, p: w.position, audio: w.audio_url, tr: (w.transliteration && w.transliteration.text) || "", n: 1 });
  }
}
const all = [...words.values()];
const clean = (w) => !OTHER_MARKS.test(w.t) && !/[ٱ]/.test(w.t);
function pick(test, { max = 30, minL = 2, maxL = 6 } = {}) {
  return all
    .filter((w) => clean(w) && letters(w.t) >= minL && letters(w.t) <= maxL && test(w.t))
    .sort((x, y) => letters(x.t) - letters(y.t) || y.n - x.n)
    .slice(0, max)
    .map((w) => ({ t: w.t, sp: w.tr, audio: w.audio, ref: `${w.s}:${w.a}` }));
}
// every letter has exactly one short vowel (no sukun, shadda, tanween, madd)
const onlyHarakat = (t) => {
  if (/[ّٰۡٓۥۦ]/.test(t) || TANWEEN.test(t)) return false;
  const parts = t.match(/[ء-ي][ً-ْٰۡۥۦٓ]*/g) || [];
  return parts.length > 1 && parts.every((p) => (p.match(HARAKA) || []).length === 1);
};

/* ---------- letter lessons ---------- */
const ABJAD = "ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن و ه ء ي".split(" ");
const NAMES = {
  "ا": "أَلِف", "ب": "بَاء", "ت": "تَاء", "ث": "ثَاء", "ج": "جِيم", "ح": "حَاء", "خ": "خَاء", "د": "دَال", "ذ": "ذَال", "ر": "رَاء",
  "ز": "زَاي", "س": "سِين", "ش": "شِين", "ص": "صَاد", "ض": "ضَاد", "ط": "طَاء", "ظ": "ظَاء", "ع": "عَيْن", "غ": "غَيْن", "ف": "فَاء",
  "ق": "قَاف", "ك": "كَاف", "ل": "لَام", "م": "مِيم", "ن": "نُون", "و": "وَاو", "ه": "هَاء", "ء": "هَمْزَة", "ي": "يَاء",
};
const NO_JOIN_AFTER = new Set(["ا", "د", "ذ", "ر", "ز", "و", "ء"]); // these never join to the next letter
const BASE = ABJAD.filter((l) => l !== "ا" && l !== "ء"); // letters that take a vowel in the drills ("ا" carries hamza: أ)

const L = [];
let n = 0;
const lesson = (title, items, extra = {}) => { n++; L.push({ n, title, items: items.map((x, i) => ({ id: `${n}-${i + 1}`, ...x })), ...extra }); };

// 1 single letters
lesson("المفردات", ABJAD.map((l) => ({ t: l, sp: NAMES[l], kind: "letter" })), { en: "Single letters" });
// 2 joined letters: each joining letter with alif, then the three shapes of the letter in a word
lesson("المركبات", [
  { t: "لا", sp: "لَام أَلِف" },
  ...ABJAD.filter((l) => !NO_JOIN_AFTER.has(l) && l !== "ل").map((l) => ({ t: `${l}ا`, sp: `${NAMES[l]} أَلِف` })),
  ...ABJAD.filter((l) => !NO_JOIN_AFTER.has(l)).map((l) => ({ t: `${l}ـ ـ${l}ـ ـ${l}`, sp: NAMES[l], wide: 1 })),
], { en: "Joined letters" });
// 3 the disjointed letters that open surahs — the first word of those ayahs, from the Quran text
const MUQ = [[2, 1], [7, 1], [10, 1], [13, 1], [19, 1], [20, 1], [26, 1], [27, 1], [36, 1], [38, 1], [40, 1], [42, 2], [50, 1], [68, 1]];
lesson("المقطعات", MUQ.map(([s, a]) => {
  const v = verses.find((x) => x.verse_key === `${s}:${a}`);
  const w = v.words.find((x) => x.position === 1);
  const sp = (w.text_qpc_hafs.match(/[ء-ي]/g) || []).map((c) => NAMES[c === "أ" ? "ا" : c] || c).join(" ");
  return { t: w.text_qpc_hafs, sp, audio: w.audio_url, ref: `${s}:${a}` };
}), { en: "Disjointed letters (Muqatta'at)" });
// 4 short vowels
const VOWELS = [["fatha", FATHA], ["kasra", KASRA], ["damma", DAMMA]];
// alif takes its vowel on a hamza: أَ إِ أُ
lesson("الحركات", ["ا", ...BASE].flatMap((l) => VOWELS.map(([k, m]) => ({ t: (l === "ا" ? (k === "kasra" ? "إ" : "أ") : l) + m, letter: l, v: k }))), { en: "Short vowels", cols: 3 });
// 5 tanween (fathatan is written with an alif after it)
const TAN = [["fathatan", "ً"], ["kasratan", "ٍ"], ["dammatan", "ٌ"]];
lesson("التنوين", BASE.flatMap((l) => TAN.map(([k, m]) => ({ t: l + m + (k === "fathatan" && l !== "ة" ? "ا" : ""), letter: l, v: k }))), { en: "Tanween", cols: 3 });
// 6 words with short vowels and tanween (Quran words)
lesson("الحركات مع التنوين", pick((t) => TANWEEN.test(t.slice(-2)) && onlyHarakat(t.replace(TANWEEN, FATHA).replace(/ا$/, "")), { minL: 2, maxL: 4 }), { en: "Vowels with tanween" });
// 7 standing fatha, standing kasra, inverted damma (Quran words)
lesson("الألف المقصورة - الياء المقصورة - الواو المقصورة", pick((t) => /[ٰۥۦ]/.test(t) && !/[ّٓ]/.test(t), { maxL: 5 }), { en: "Small alif, yaa and waw" });
// 8 long vowels and leen (Quran words)
lesson("المد واللين", pick((t) => (/َا|ِي|ُو/.test(t) || /َ[وي]ۡ/.test(t)) && !/[ّٰٓ]/.test(t) && !TANWEEN.test(t), { maxL: 4 }), { en: "Long vowels and leen" });
// 9 practice: short vowels only (Quran words)
lesson("تدريب الحركات", pick(onlyHarakat, { minL: 3, maxL: 5 }), { en: "Practice: short vowels" });
// 10 sukoon
lesson("السكون", pick((t) => t.includes(SUKUN) && !/[ّٰٓ]/.test(t) && !TANWEEN.test(t) && (t.match(/ۡ/g) || []).length === 1, { maxL: 4 }), { en: "Sukoon" });
// 11 practice: sukoon (two or more)
lesson("تدريب الجزم", pick((t) => (t.match(/ۡ/g) || []).length >= 2 && !/[ّٓ]/.test(t), { minL: 4, maxL: 7 }), { en: "Practice: sukoon" });
// 12 shadda
lesson("الشدة", pick((t) => (t.match(/ّ/g) || []).length === 1 && !/[ٰۡٓ]/.test(t) && !TANWEEN.test(t), { maxL: 4 }), { en: "Shadda" });
// 13 practice: shadda with sukoon
lesson("تدريب الشدة", pick((t) => t.includes(SHADDA) && t.includes(SUKUN) && !t.includes(MADD), { minL: 4, maxL: 7 }), { en: "Practice: shadda" });
// 14 shadda after shadda
lesson("تدريب الشدة بعد الشدة", pick((t) => (t.match(/ّ/g) || []).length >= 2 && !t.includes(MADD), { minL: 3, maxL: 8 }), { en: "Shadda after shadda" });
// 15 shadda with tanween
lesson("الشدة مع التنوين", pick((t) => t.includes(SHADDA) && TANWEEN.test(t) && !t.includes(MADD), { minL: 2, maxL: 6 }), { en: "Shadda with tanween" });
// 16 shadda after madd
lesson("الشدة بعد المد", pick((t) => /ٓ.*ّ|ّ.*ٓ/.test(t) && /ٓ[^ء-ي]*[ء-ي][^ء-ي]*ّ|ّٓ|ّٓ/.test(t), { minL: 3, maxL: 9 }), { en: "Shadda after madd" });

// stable ids and sanity checks
for (const l of L) {
  if (!l.items.length) throw new Error(`lesson ${l.n} is empty`);
  l.items.forEach((x) => { if (x.audio) x.audio = x.audio.replace(/^\/+/, ""); });
}
const out = { built: new Date().toISOString().slice(0, 10), audioBase: "https://audio.qurancdn.com/", source: "Words: Quran.com API (KFGQPC Hafs text, word-by-word audio)", lessons: L };
for (const dir of ["public/tajweed", "../quranadmin/public/tajweed"]) {
  mkdirSync(path.resolve(dir), { recursive: true });
  writeFileSync(path.resolve(dir, "lessons.json"), JSON.stringify(out));
}
L.forEach((l) => console.log(String(l.n).padStart(2), l.items.length.toString().padStart(3), l.title, "|", l.items.slice(0, 6).map((x) => x.t).join(" ")));
