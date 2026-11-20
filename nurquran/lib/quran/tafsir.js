"use client";
// Tafsir books by language. Text is read ayah-by-ayah from the Quran.com API (free, open to websites) when a visitor
// opens it, and kept in this browser so it opens instantly next time. The admin panel can hide books and choose the
// default language / book (settings.tafsir from /v1/site).
import { useEffect, useState } from "react";

export const TAFSIR_API = "https://api.quran.com/api/v4";

export const TAFSIR_LANGS = [
  { id: "bn", name: "বাংলা", en: "Bangla" },
  { id: "ur", name: "اردو", en: "Urdu", rtl: true },
  { id: "en", name: "English", en: "English" },
  { id: "ar", name: "العربية", en: "Arabic", rtl: true },
  { id: "ru", name: "Русский", en: "Russian" },
  { id: "ku", name: "کوردی", en: "Kurdish", rtl: true },
];

// id = Quran.com tafsir id
export const TAFSIRS = [
  { id: 164, lang: "bn", name: "তাফসীর ইবনে কাসীর", by: "হাফিজ ইবনে কাসীর (রহ.) · তাওহীদ পাবলিকেশন্স", en: "Tafseer Ibn Kathir" },
  { id: 165, lang: "bn", name: "তাফসীরে আহসানুল বায়ান", by: "শাইখ সালাহুদ্দীন ইউসুফ · বায়ান ফাউন্ডেশন", en: "Tafsir Ahsanul Bayaan" },
  { id: 166, lang: "bn", name: "তাফসীরে জাকারিয়া", by: "ড. আবু বকর মুহাম্মাদ যাকারিয়া", en: "Tafsir Abu Bakr Zakaria" },
  { id: 381, lang: "bn", name: "তাফসীর ফাতহুল মাজীদ", by: "আব্দুর রহমান বিন হাসান আলুশ শাইখ", en: "Tafsir Fathul Majid" },
  { id: 160, lang: "ur", name: "تفسیر ابن کثیر", by: "حافظ ابن کثیر", en: "Tafsir Ibn Kathir (Urdu)" },
  { id: 159, lang: "ur", name: "بیان القرآن", by: "ڈاکٹر اسرار احمد", en: "Bayan ul Quran" },
  { id: 157, lang: "ur", name: "فی ظلال القرآن", by: "سید قطب", en: "Fi Zilal al-Quran" },
  { id: 818, lang: "ur", name: "تذکیر القرآن", by: "مولانا وحید الدین خان", en: "Tazkir ul Quran" },
  { id: 169, lang: "en", name: "Tafsir Ibn Kathir (Abridged)", by: "Hafiz Ibn Kathir", en: "Ibn Kathir (Abridged)" },
  { id: 168, lang: "en", name: "Ma'arif al-Qur'an", by: "Mufti Muhammad Shafi", en: "Ma'arif al-Qur'an" },
  { id: 817, lang: "en", name: "Tazkirul Quran", by: "Maulana Wahiduddin Khan", en: "Tazkirul Quran" },
  { id: 16, lang: "ar", name: "التفسير الميسر", by: "مجمع الملك فهد", en: "Tafsir Muyassar" },
  { id: 14, lang: "ar", name: "تفسير ابن كثير", by: "الحافظ ابن كثير", en: "Tafsir Ibn Kathir" },
  { id: 91, lang: "ar", name: "تفسير السعدي", by: "عبد الرحمن السعدي", en: "Tafsir al-Sa'di" },
  { id: 15, lang: "ar", name: "تفسير الطبري", by: "ابن جرير الطبري", en: "Tafsir al-Tabari" },
  { id: 90, lang: "ar", name: "تفسير القرطبي", by: "الإمام القرطبي", en: "Tafsir al-Qurtubi" },
  { id: 94, lang: "ar", name: "تفسير البغوي", by: "الإمام البغوي", en: "Tafsir al-Baghawi" },
  { id: 93, lang: "ar", name: "التفسير الوسيط", by: "محمد سيد طنطاوي", en: "Al-Tafsir al-Wasit" },
  { id: 170, lang: "ru", name: "Тафсир ас-Саади", by: "Абдуррахман ас-Саади", en: "Tafsir al-Sa'di (Russian)" },
  { id: 804, lang: "ku", name: "تەفسیری ڕێبەر", by: "Rebar", en: "Rebar Kurdish Tafsir" },
];
export const tafsirById = (id) => TAFSIRS.find((t) => t.id === +id) || null;
export const langById = (id) => TAFSIR_LANGS.find((l) => l.id === id) || TAFSIR_LANGS[0];

// what the visitor can choose, after the admin panel's choices
export function tafsirSetup(cfg) {
  const t = (cfg && cfg.tafsir) || {};
  const hidden = new Set((t.hidden || []).map(Number));
  const books = TAFSIRS.filter((b) => !hidden.has(b.id));
  const langs = TAFSIR_LANGS.filter((l) => books.some((b) => b.lang === l.id));
  const defLang = langs.some((l) => l.id === t.defaultLang) ? t.defaultLang : langs.some((l) => l.id === "bn") ? "bn" : (langs[0] || {}).id;
  const defBook = (lang) => {
    const want = t.defaults && +t.defaults[lang];
    const list = books.filter((b) => b.lang === lang);
    return (list.find((b) => b.id === want) || list[0] || {}).id || null;
  };
  return { books, langs, defLang, defBook };
}
// the visitor's choice (prefs.tafsirLang / prefs.tafsirBook) checked against what is available
export function chosenTafsir(prefs, setup) {
  const lang = setup.langs.some((l) => l.id === prefs.tafsirLang) ? prefs.tafsirLang : setup.defLang;
  const book = setup.books.find((b) => b.id === +prefs.tafsirBook && b.lang === lang);
  return { lang, book: book ? book.id : setup.defBook(lang) };
}

/* ---------- reading ---------- */
const CACHE = "nq_tafsir_v1";
const mem = new Map();
const store = {
  get(k) {
    if (mem.has(k)) return mem.get(k);
    try { const v = sessionStorage.getItem(`${CACHE}:${k}`); if (v) { const d = JSON.parse(v); mem.set(k, d); return d; } } catch (e) {}
    return null;
  },
  set(k, d) { mem.set(k, d); try { sessionStorage.setItem(`${CACHE}:${k}`, JSON.stringify(d)); } catch (e) {} },
};

// one page (up to 50 entries) of a surah. Entries: [{ key: "2:6", s, a, text }]. Some books explain several ayahs
// together; then only the first ayah of the group has an entry.
export async function loadTafsirPage(book, s, page = 1) {
  const k = `${book}:${s}:${page}`;
  const c = store.get(k);
  if (c) return c;
  const r = await fetch(`${TAFSIR_API}/tafsirs/${book}/by_chapter/${s}?per_page=50&page=${page}`);
  if (!r.ok) throw new Error("Could not load the tafsir. Check your internet connection.");
  const d = await r.json();
  const out = {
    entries: (d.tafsirs || []).map((x) => { const [ss, aa] = String(x.verse_key).split(":").map(Number); return { key: x.verse_key, s: ss, a: aa, text: x.text || "" }; })
      .filter((x) => x.a).sort((x, y) => x.a - y.a),
    next: d.pagination && d.pagination.next_page ? d.pagination.next_page : null,
  };
  store.set(k, out);
  return out;
}

// tafsir HTML from the API, cleaned: only simple text tags, no attributes, no scripts or links
const KEEP = new Set(["P", "B", "STRONG", "I", "EM", "BR", "H1", "H2", "H3", "H4", "H5", "SPAN", "DIV", "SUP", "SUB", "OL", "UL", "LI", "BLOCKQUOTE", "SMALL"]);
export function cleanTafsirHtml(html) {
  if (typeof DOMParser === "undefined") return "";
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const walk = (el) => {
    [...el.children].forEach((c) => {
      if (!KEEP.has(c.tagName)) {
        if (["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "IMG", "SVG", "LINK", "META", "FORM", "INPUT", "BUTTON"].includes(c.tagName)) { c.remove(); return; }
        walk(c);
        c.replaceWith(...c.childNodes);
        return;
      }
      [...c.attributes].forEach((a) => c.removeAttribute(a.name));
      if (/^H[1-5]$/.test(c.tagName)) {
        const h = doc.createElement("h4"); h.append(...c.childNodes); c.replaceWith(h); walk(h); return;
      }
      walk(c);
    });
  };
  const root = doc.body.firstElementChild;
  walk(root);
  return root.innerHTML;
}

export function useTafsirPage(book, s, page) {
  const [st, setSt] = useState({ loading: true, data: null, error: "" });
  useEffect(() => {
    if (!book || !s) return;
    let live = true;
    setSt({ loading: true, data: null, error: "" });
    loadTafsirPage(book, s, page).then((d) => live && setSt({ loading: false, data: d, error: "" }))
      .catch((e) => live && setSt({ loading: false, data: null, error: e.message }));
    return () => { live = false; };
  }, [book, s, page]);
  return st;
}
