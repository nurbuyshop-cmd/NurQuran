"use client";
// Tafsir books by language. Text is read ayah-by-ayah from the Quran.com API (free, open to websites) when a visitor
// opens it, and kept in this browser so it opens instantly next time. The admin panel can hide books and choose the
// default language / book (settings.tafsir from /v1/site).
import { useEffect, useState } from "react";

export const TAFSIR_API = "https://api.quran.com/api/v4";
// second open source (per-surah JSON files, free to use, open to websites)
const GH = "https://raw.githubusercontent.com/spa5k/tafsir_api/main/tafsir";

// tr = Quran.com translation id used for the ayah's meaning in this language (none for Arabic)
export const TAFSIR_LANGS = [
  { id: "bn", name: "বাংলা", en: "Bangla", tr: 161 },
  { id: "ur", name: "اردو", en: "Urdu", rtl: true, tr: 54 },
  { id: "en", name: "English", en: "English", tr: 20 },
  { id: "ar", name: "العربية", en: "Arabic", rtl: true },
  { id: "id", name: "Bahasa Indonesia", en: "Indonesian", tr: 33 },
  { id: "hi", name: "हिन्दी", en: "Hindi", tr: 122 },
  { id: "tr", name: "Türkçe", en: "Turkish", tr: 77 },
  { id: "fa", name: "فارسی", en: "Persian", rtl: true, tr: 135 },
  { id: "ps", name: "پښتو", en: "Pashto", rtl: true, tr: 118 },
  { id: "uz", name: "Oʻzbek", en: "Uzbek", tr: 127 },
  { id: "az", name: "Azərbaycan", en: "Azerbaijani", tr: 75 },
  { id: "ky", name: "Кыргызча", en: "Kyrgyz" },
  { id: "ug", name: "ئۇيغۇرچە", en: "Uyghur", rtl: true },
  { id: "fr", name: "Français", en: "French", tr: 31 },
  { id: "ff", name: "Fulfulde", en: "Fulani" },
  { id: "sq", name: "Shqip", en: "Albanian", tr: 89 },
  { id: "bs", name: "Bosanski", en: "Bosnian", tr: 126 },
  { id: "ml", name: "മലയാളം", en: "Malayalam", tr: 37 },
  { id: "ta", name: "தமிழ்", en: "Tamil", tr: 229 },
  { id: "as", name: "অসমীয়া", en: "Assamese", tr: 120 },
  { id: "ru", name: "Русский", en: "Russian", tr: 45 },
  { id: "ku", name: "کوردی", en: "Kurdish", rtl: true, tr: 81 },
];

// id: Quran.com tafsir id ("164") or "gh-<slug>" for the second source
const Q = (id, lang, name, by, en) => ({ id: String(id), qc: id, lang, name, by, en });
const G = (slug, lang, name, by, en) => ({ id: `gh-${slug}`, gh: slug, lang, name, by, en });
const MUKH = "Tafsir Center for Quranic Studies";
export const TAFSIRS = [
  Q(164, "bn", "তাফসীর ইবনে কাসীর", "হাফিজ ইবনে কাসীর (রহ.) · তাওহীদ পাবলিকেশন্স", "Tafseer Ibn Kathir"),
  Q(165, "bn", "তাফসীরে আহসানুল বায়ান", "শাইখ সালাহুদ্দীন ইউসুফ · বায়ান ফাউন্ডেশন", "Tafsir Ahsanul Bayaan"),
  Q(166, "bn", "তাফসীরে জাকারিয়া", "ড. আবু বকর মুহাম্মাদ যাকারিয়া", "Tafsir Abu Bakr Zakaria"),
  Q(381, "bn", "তাফসীর ফাতহুল মাজীদ", "আব্দুর রহমান বিন হাসান আলুশ শাইখ", "Tafsir Fathul Majid"),
  G("bengali-mokhtasar", "bn", "আল-মুখতাসার (সংক্ষিপ্ত তাফসীর)", "তাফসীর সেন্টার ফর কুরআনিক স্টাডিজ", "Al-Mukhtasar (Bangla)"),
  Q(160, "ur", "تفسیر ابن کثیر", "حافظ ابن کثیر", "Tafsir Ibn Kathir (Urdu)"),
  Q(159, "ur", "بیان القرآن", "ڈاکٹر اسرار احمد", "Bayan ul Quran"),
  Q(157, "ur", "فی ظلال القرآن", "سید قطب", "Fi Zilal al-Quran"),
  Q(818, "ur", "تذکیر القرآن", "مولانا وحید الدین خان", "Tazkir ul Quran"),
  G("ur-tafsir-as-saadi-urdu", "ur", "تفسیر السعدی", "عبد الرحمن السعدی", "Tafsir As-Saadi (Urdu)"),
  Q(169, "en", "Tafsir Ibn Kathir (Abridged)", "Hafiz Ibn Kathir", "Ibn Kathir (Abridged)"),
  Q(168, "en", "Ma'arif al-Qur'an", "Mufti Muhammad Shafi", "Ma'arif al-Qur'an"),
  Q(817, "en", "Tazkirul Quran", "Maulana Wahiduddin Khan", "Tazkirul Quran"),
  G("en-tafsir-al-mukhtasar", "en", "Al-Mukhtasar", MUKH, "Al-Mukhtasar (English)"),
  G("tafsir-al-jalalayn", "en", "Tafsir al-Jalalayn", "Jalal ad-Din al-Mahalli & as-Suyuti", "Tafsir al-Jalalayn (English)"),
  Q(16, "ar", "التفسير الميسر", "مجمع الملك فهد", "Tafsir Muyassar"),
  G("ar-tafsir-al-mukhtasar", "ar", "المختصر في التفسير", "مركز تفسير للدراسات القرآنية", "Al-Mukhtasar (Arabic)"),
  G("ar-tafsir-al-jalalayn", "ar", "تفسير الجلالين", "المحلي والسيوطي", "Tafsir al-Jalalayn"),
  Q(14, "ar", "تفسير ابن كثير", "الحافظ ابن كثير", "Tafsir Ibn Kathir"),
  Q(91, "ar", "تفسير السعدي", "عبد الرحمن السعدي", "Tafsir al-Sa'di"),
  Q(15, "ar", "تفسير الطبري", "ابن جرير الطبري", "Tafsir al-Tabari"),
  Q(90, "ar", "تفسير القرطبي", "الإمام القرطبي", "Tafsir al-Qurtubi"),
  Q(94, "ar", "تفسير البغوي", "الإمام البغوي", "Tafsir al-Baghawi"),
  Q(93, "ar", "التفسير الوسيط", "محمد سيد طنطاوي", "Al-Tafsir al-Wasit"),
  G("indonesian-mokhtasar", "id", "Al-Mukhtashar", "Markaz Tafsir", "Al-Mukhtasar (Indonesian)"),
  G("id-tafsir-as-saadi", "id", "Tafsir As-Sa'di", "Abdurrahman as-Sa'di", "Tafsir As-Saadi (Indonesian)"),
  G("hindi-mokhtasar", "hi", "अल-मुख़्तसर फ़ी तफ़सीर", "तफ़सीर सेंटर", "Al-Mukhtasar (Hindi)"),
  G("tr-tafsir-ibne-kathir", "tr", "İbn Kesir Tefsiri", "Hâfız İbn Kesîr", "Tafsir Ibn Kathir (Turkish)"),
  G("turkish-mokhtasar", "tr", "Muhtasar Tefsir", "Tefsir Merkezi", "Al-Mukhtasar (Turkish)"),
  G("turkish-tafsir-as-saadi-turkish", "tr", "Sa'dî Tefsiri", "Abdurrahman es-Sa'dî", "Tafsir As-Saadi (Turkish)"),
  G("persian-mokhtasar", "fa", "المختصر فی تفسیر", "مرکز تفسیر", "Al-Mukhtasar (Persian)"),
  G("pashto-mokhtasar", "ps", "المختصر په تفسیر کې", "د تفسیر مرکز", "Al-Mukhtasar (Pashto)"),
  G("uzbek-mokhtasar", "uz", "Мухтасар тафсир", "Тафсир маркази", "Al-Mukhtasar (Uzbek)"),
  G("azeri-mokhtasar", "az", "Müxtəsər təfsir", "Təfsir Mərkəzi", "Al-Mukhtasar (Azerbaijani)"),
  G("kyrgyz-mokhtasar", "ky", "Мухтасар тафсир", "Тафсир борбору", "Al-Mukhtasar (Kyrgyz)"),
  G("uyghur-mokhtasar", "ug", "قىسقىچە تەپسىر", "تەپسىر مەركىزى", "Al-Mukhtasar (Uyghur)"),
  G("french-mokhtasar", "fr", "Al-Mukhtasar (Exégèse abrégée)", "Centre de l'exégèse", "Al-Mukhtasar (French)"),
  G("fulani-mokhtasar", "ff", "Al-Mukhtasar", "Tafsir Center", "Al-Mukhtasar (Fulani)"),
  G("sq-saadi", "sq", "Tefsiri i Sa'diut", "Abdurrahman es-Sa'di", "Tafsir As-Saadi (Albanian)"),
  G("bosnian-mokhtasar", "bs", "Skraćeni tefsir (El-Muhtesar)", "Centar za tefsir", "Al-Mukhtasar (Bosnian)"),
  G("malayalam-mokhtasar", "ml", "അൽ-മുഖ്തസർ", "തഫ്സീർ സെൻ്റർ", "Al-Mukhtasar (Malayalam)"),
  G("tamil-mokhtasar", "ta", "அல்-முக்தஸர்", "தஃப்ஸீர் மையம்", "Al-Mukhtasar (Tamil)"),
  G("assamese-mokhtasar", "as", "আল-মুখতাছাৰ", "তাফছীৰ চেণ্টাৰ", "Al-Mukhtasar (Assamese)"),
  Q(170, "ru", "Тафсир ас-Саади", "Абдуррахман ас-Саади", "Tafsir al-Sa'di (Russian)"),
  G("russian-mokhtasar", "ru", "Аль-Мухтасар", "Центр тафсира", "Al-Mukhtasar (Russian)"),
  G("ru-tafsir-ibne-kahtir", "ru", "Тафсир Ибн Касира", "Хафиз Ибн Касир", "Tafsir Ibn Kathir (Russian)"),
  Q(804, "ku", "تەفسیری ڕێبەر", "Rebar", "Rebar Kurdish Tafsir"),
  G("kurdish-mokhtasar", "ku", "کورتەی تەفسیر (المختصر)", "ناوەندی تەفسیر", "Al-Mukhtasar (Kurdish)"),
];
export const tafsirById = (id) => (id == null ? null : TAFSIRS.find((t) => t.id === String(id)) || null);
export const langById = (id) => TAFSIR_LANGS.find((l) => l.id === id) || TAFSIR_LANGS[0];

// what the visitor can choose, after the admin panel's choices
export function tafsirSetup(cfg) {
  const t = (cfg && cfg.tafsir) || {};
  const hidden = new Set((t.hidden || []).map(String));
  const books = TAFSIRS.filter((b) => !hidden.has(b.id));
  const langs = TAFSIR_LANGS.filter((l) => books.some((b) => b.lang === l.id));
  const defLang = langs.some((l) => l.id === t.defaultLang) ? t.defaultLang : langs.some((l) => l.id === "bn") ? "bn" : (langs[0] || {}).id;
  const defBook = (lang) => {
    const want = t.defaults && t.defaults[lang] != null ? String(t.defaults[lang]) : null;
    const list = books.filter((b) => b.lang === lang);
    return (list.find((b) => b.id === want) || list[0] || {}).id || null;
  };
  return { books, langs, defLang, defBook };
}
// the visitor's choice (prefs.tafsirLang / prefs.tafsirBook) checked against what is available
export function chosenTafsir(prefs, setup) {
  const lang = setup.langs.some((l) => l.id === prefs.tafsirLang) ? prefs.tafsirLang : setup.defLang;
  const book = setup.books.find((b) => b.id === String(prefs.tafsirBook) && b.lang === lang);
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

const esc = (t) => t.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
const plainToHtml = (t) => String(t || "").trim().split(/\n{1,}/).map((p) => p.trim()).filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join("");

// one page of a surah's tafsir. Entries: [{ key: "2:6", s, a, text }]. Some books explain several ayahs together;
// then only the first ayah of the group has an entry. Quran.com books come 50 entries per page; the second source
// sends the whole surah at once.
export async function loadTafsirPage(bookId, s, page = 1) {
  const b = tafsirById(bookId);
  if (!b) throw new Error("This tafsir is not available.");
  const k = `${b.id}:${s}:${page}`;
  const c = store.get(k);
  if (c) return c;
  let out;
  if (b.gh) {
    const r = await fetch(`${GH}/${b.gh}/${s}.json`);
    if (!r.ok) throw new Error("Could not load the tafsir. Check your internet connection.");
    const d = await r.json();
    const seen = new Set();
    out = {
      entries: (Array.isArray(d) ? d : d.ayahs || []).map((x) => ({ s, a: +x.ayah, text: plainToHtml(x.text) }))
        .filter((x) => x.a && !seen.has(x.a) && seen.add(x.a)).sort((x, y) => x.a - y.a).map((x) => ({ ...x, key: `${s}:${x.a}` })),
      next: null,
    };
  } else {
    const r = await fetch(`${TAFSIR_API}/tafsirs/${b.qc}/by_chapter/${s}?per_page=50&page=${page}`);
    if (!r.ok) throw new Error("Could not load the tafsir. Check your internet connection.");
    const d = await r.json();
    out = {
      entries: (d.tafsirs || []).map((x) => { const [ss, aa] = String(x.verse_key).split(":").map(Number); return { key: x.verse_key, s: ss, a: aa, text: x.text || "" }; })
        .filter((x) => x.a).sort((x, y) => x.a - y.a),
      next: d.pagination && d.pagination.next_page ? d.pagination.next_page : null,
    };
  }
  store.set(k, out);
  return out;
}

// tafsir of one ayah (for the reader's ayah popup): the entry for this ayah, or the group it belongs to
export async function loadAyahTafsir(bookId, s, a) {
  const b = tafsirById(bookId);
  if (!b) return null;
  if (b.gh) {
    const d = await loadTafsirPage(b.id, s, 1);
    const e = [...d.entries].reverse().find((x) => x.a <= a && x.text);
    return e ? { from: e.a, html: e.text } : null;
  }
  const k = `${b.id}:a:${s}:${a}`;
  const c = store.get(k);
  if (c) return c;
  const r = await fetch(`${TAFSIR_API}/tafsirs/${b.qc}/by_ayah/${s}:${a}`);
  if (!r.ok) throw new Error("Could not load the tafsir. Check your internet connection.");
  const d = await r.json();
  const keys = Object.keys((d.tafsir && d.tafsir.verses) || {});
  const out = { from: keys.length ? +keys[0].split(":")[1] : a, to: keys.length ? +keys[keys.length - 1].split(":")[1] : a, html: (d.tafsir && d.tafsir.text) || "" };
  store.set(k, out);
  return out;
}

// meaning (translation) of the ayahs of a surah in a language: { [ayah]: text }
export async function loadMeanings(lang, s) {
  const L = langById(lang);
  if (!L.tr) return null;
  const k = `tr:${L.tr}:${s}`;
  const c = store.get(k);
  if (c) return c;
  const r = await fetch(`${TAFSIR_API}/quran/translations/${L.tr}?chapter_number=${s}`);
  if (!r.ok) throw new Error("Could not load the meaning.");
  const d = await r.json();
  const out = {};
  (d.translations || []).forEach((x, i) => { out[i + 1] = String(x.text || "").replace(/<sup[^>]*>.*?<\/sup>/g, "").replace(/<[^>]+>/g, "").trim(); });
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
