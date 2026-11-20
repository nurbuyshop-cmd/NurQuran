"use client";
// Tafsir: which tafsir books visitors can choose, the default language and the default book for each language.
// The tafsir text itself comes from Quran.com, so there is nothing to upload.
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { api } from "@/lib/api";
import { useUi } from "@/components/ui";

const LANGS = [["bn", "বাংলা (Bangla)"], ["ur", "اردو (Urdu)"], ["en", "English"], ["ar", "العربية (Arabic)"], ["id", "Bahasa Indonesia (Indonesian)"], ["hi", "हिन्दी (Hindi)"], ["tr", "Türkçe (Turkish)"], ["fa", "فارسی (Persian)"], ["ps", "پښتو (Pashto)"], ["uz", "Oʻzbek (Uzbek)"], ["az", "Azərbaycan (Azerbaijani)"], ["ky", "Кыргызча (Kyrgyz)"], ["ug", "ئۇيغۇرچە (Uyghur)"], ["fr", "Français (French)"], ["ff", "Fulfulde (Fulani)"], ["sq", "Shqip (Albanian)"], ["bs", "Bosanski (Bosnian)"], ["ml", "മലയാളം (Malayalam)"], ["ta", "தமிழ் (Tamil)"], ["as", "অসমীয়া (Assamese)"], ["ru", "Русский (Russian)"], ["ku", "کوردی (Kurdish)"]];
// [id, language, name, English name] — same list as the website (nurquran/lib/quran/tafsir.js)
const BOOKS = [
  ["164", "bn", "তাফসীর ইবনে কাসীর", "Tafseer Ibn Kathir"],
  ["165", "bn", "তাফসীরে আহসানুল বায়ান", "Tafsir Ahsanul Bayaan"],
  ["166", "bn", "তাফসীরে জাকারিয়া", "Tafsir Abu Bakr Zakaria"],
  ["381", "bn", "তাফসীর ফাতহুল মাজীদ", "Tafsir Fathul Majid"],
  ["gh-bengali-mokhtasar", "bn", "আল-মুখতাসার (সংক্ষিপ্ত তাফসীর)", "Al-Mukhtasar (Bangla)"],
  ["160", "ur", "تفسیر ابن کثیر", "Tafsir Ibn Kathir (Urdu)"],
  ["159", "ur", "بیان القرآن", "Bayan ul Quran"],
  ["157", "ur", "فی ظلال القرآن", "Fi Zilal al-Quran"],
  ["818", "ur", "تذکیر القرآن", "Tazkir ul Quran"],
  ["gh-ur-tafsir-as-saadi-urdu", "ur", "تفسیر السعدی", "Tafsir As-Saadi (Urdu)"],
  ["169", "en", "Tafsir Ibn Kathir (Abridged)", "Ibn Kathir (Abridged)"],
  ["168", "en", "Ma'arif al-Qur'an", "Ma'arif al-Qur'an"],
  ["817", "en", "Tazkirul Quran", "Tazkirul Quran"],
  ["gh-en-tafsir-al-mukhtasar", "en", "Al-Mukhtasar", "Al-Mukhtasar (English)"],
  ["gh-tafsir-al-jalalayn", "en", "Tafsir al-Jalalayn", "Tafsir al-Jalalayn (English)"],
  ["16", "ar", "التفسير الميسر", "Tafsir Muyassar"],
  ["gh-ar-tafsir-al-mukhtasar", "ar", "المختصر في التفسير", "Al-Mukhtasar (Arabic)"],
  ["gh-ar-tafsir-al-jalalayn", "ar", "تفسير الجلالين", "Tafsir al-Jalalayn"],
  ["14", "ar", "تفسير ابن كثير", "Tafsir Ibn Kathir"],
  ["91", "ar", "تفسير السعدي", "Tafsir al-Sa'di"],
  ["15", "ar", "تفسير الطبري", "Tafsir al-Tabari"],
  ["90", "ar", "تفسير القرطبي", "Tafsir al-Qurtubi"],
  ["94", "ar", "تفسير البغوي", "Tafsir al-Baghawi"],
  ["93", "ar", "التفسير الوسيط", "Al-Tafsir al-Wasit"],
  ["gh-indonesian-mokhtasar", "id", "Al-Mukhtashar", "Al-Mukhtasar (Indonesian)"],
  ["gh-id-tafsir-as-saadi", "id", "Tafsir As-Sa'di", "Tafsir As-Saadi (Indonesian)"],
  ["gh-hindi-mokhtasar", "hi", "अल-मुख़्तसर फ़ी तफ़सीर", "Al-Mukhtasar (Hindi)"],
  ["gh-tr-tafsir-ibne-kathir", "tr", "İbn Kesir Tefsiri", "Tafsir Ibn Kathir (Turkish)"],
  ["gh-turkish-mokhtasar", "tr", "Muhtasar Tefsir", "Al-Mukhtasar (Turkish)"],
  ["gh-turkish-tafsir-as-saadi-turkish", "tr", "Sa'dî Tefsiri", "Tafsir As-Saadi (Turkish)"],
  ["gh-persian-mokhtasar", "fa", "المختصر فی تفسیر", "Al-Mukhtasar (Persian)"],
  ["gh-pashto-mokhtasar", "ps", "المختصر په تفسیر کې", "Al-Mukhtasar (Pashto)"],
  ["gh-uzbek-mokhtasar", "uz", "Мухтасар тафсир", "Al-Mukhtasar (Uzbek)"],
  ["gh-azeri-mokhtasar", "az", "Müxtəsər təfsir", "Al-Mukhtasar (Azerbaijani)"],
  ["gh-kyrgyz-mokhtasar", "ky", "Мухтасар тафсир", "Al-Mukhtasar (Kyrgyz)"],
  ["gh-uyghur-mokhtasar", "ug", "قىسقىچە تەپسىر", "Al-Mukhtasar (Uyghur)"],
  ["gh-french-mokhtasar", "fr", "Al-Mukhtasar (Exégèse abrégée)", "Al-Mukhtasar (French)"],
  ["gh-fulani-mokhtasar", "ff", "Al-Mukhtasar", "Al-Mukhtasar (Fulani)"],
  ["gh-sq-saadi", "sq", "Tefsiri i Sa'diut", "Tafsir As-Saadi (Albanian)"],
  ["gh-bosnian-mokhtasar", "bs", "Skraćeni tefsir (El-Muhtesar)", "Al-Mukhtasar (Bosnian)"],
  ["gh-malayalam-mokhtasar", "ml", "അൽ-മുഖ്തസർ", "Al-Mukhtasar (Malayalam)"],
  ["gh-tamil-mokhtasar", "ta", "அல்-முக்தஸர்", "Al-Mukhtasar (Tamil)"],
  ["gh-assamese-mokhtasar", "as", "আল-মুখতাছাৰ", "Al-Mukhtasar (Assamese)"],
  ["170", "ru", "Тафсир ас-Саади", "Tafsir al-Sa'di (Russian)"],
  ["gh-russian-mokhtasar", "ru", "Аль-Мухтасар", "Al-Mukhtasar (Russian)"],
  ["gh-ru-tafsir-ibne-kahtir", "ru", "Тафсир Ибн Касира", "Tafsir Ibn Kathir (Russian)"],
  ["804", "ku", "تەفسیری ڕێبەر", "Rebar Kurdish Tafsir"],
  ["gh-kurdish-mokhtasar", "ku", "کورتەی تەفسیر (المختصر)", "Al-Mukhtasar (Kurdish)"],
];

function TafsirBody() {
  const { notify } = useUi();
  const [t, setT] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { api("/v1/admin/tafsir").then((r) => setT(r.tafsir)).catch((e) => notify(e.message, "err")); }, [notify]);
  if (!t) return <div className="qa-skel" />;
  const hidden = new Set(t.hidden.map(String));
  const toggle = (id) => setT({ ...t, hidden: hidden.has(id) ? t.hidden.filter((x) => String(x) !== id) : [...t.hidden, id] });
  const defOf = (l) => { const shown = BOOKS.filter((b) => b[1] === l && !hidden.has(b[0])); return (shown.find((b) => b[0] === String(t.defaults[l])) || shown[0] || [])[0]; };
  const save = async () => {
    setBusy(true);
    try { const r = await api("/v1/admin/tafsir", { method: "PUT", body: t }); setT(r.tafsir); notify("Saved — the website uses it now"); }
    catch (e) { notify(e.message, "err"); }
    setBusy(false);
  };
  return (
    <div className="qa-card qa-form">
      <h2>Tafsir books</h2>
      <p className="qa-muted small">Visitors choose a language and a tafsir book on the home page, then read it under every ayah. The tafsir text comes from Quran.com and the open tafsir_api collection (Al-Mukhtasar etc.). Untick a book to hide it; choose which book opens first in each language.</p>
      <label>Default language for new visitors
        <select className="qa-input" style={{ maxWidth: 280 }} value={t.defaultLang} onChange={(e) => setT({ ...t, defaultLang: e.target.value })}>
          {LANGS.map(([id, n]) => <option key={id} value={id}>{n}</option>)}
        </select>
      </label>
      {LANGS.map(([l, ln]) => (
        <div key={l} className="qa-tafsir-lang">
          <h3>{ln}</h3>
          <div className="qa-adhan">
            {BOOKS.filter((b) => b[1] === l).map(([id, , name, en]) => (
              <div key={id} className="row">
                <span className="nm"><b dir="auto">{name}</b><small>{en}</small></span>
                <label className="prem"><input type="radio" name={`def-${l}`} disabled={hidden.has(id)} checked={defOf(l) === id}
                  onChange={() => setT({ ...t, defaults: { ...t.defaults, [l]: id } })} />Default</label>
                <label className="prem show"><input type="checkbox" checked={!hidden.has(id)} onChange={() => toggle(id)} />Show</label>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="qa-form-foot"><button className="qa-btn" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save"}</button></div>
    </div>
  );
}

export default function Tafsir() {
  return <Shell title="Tafsir"><TafsirBody /></Shell>;
}
