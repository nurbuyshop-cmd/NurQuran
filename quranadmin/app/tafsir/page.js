"use client";
// Tafsir: which tafsir books visitors can choose, the default language and the default book for each language.
// The tafsir text itself comes from Quran.com, so there is nothing to upload.
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { api } from "@/lib/api";
import { useUi } from "@/components/ui";

const LANGS = [["bn", "বাংলা (Bangla)"], ["ur", "اردو (Urdu)"], ["en", "English"], ["ar", "العربية (Arabic)"], ["ru", "Русский (Russian)"], ["ku", "کوردی (Kurdish)"]];
const BOOKS = [
  [164, "bn", "তাফসীর ইবনে কাসীর", "Tafseer Ibn Kathir — Tawheed Publication"],
  [165, "bn", "তাফসীরে আহসানুল বায়ান", "Tafsir Ahsanul Bayaan"],
  [166, "bn", "তাফসীরে জাকারিয়া", "Tafsir Abu Bakr Zakaria"],
  [381, "bn", "তাফসীর ফাতহুল মাজীদ", "Tafsir Fathul Majid"],
  [160, "ur", "تفسیر ابن کثیر", "Tafsir Ibn Kathir (Urdu)"],
  [159, "ur", "بیان القرآن", "Bayan ul Quran — Dr. Israr Ahmad"],
  [157, "ur", "فی ظلال القرآن", "Fi Zilal al-Quran — Sayyid Qutb"],
  [818, "ur", "تذکیر القرآن", "Tazkir ul Quran — Wahiduddin Khan"],
  [169, "en", "Tafsir Ibn Kathir (Abridged)", "Hafiz Ibn Kathir"],
  [168, "en", "Ma'arif al-Qur'an", "Mufti Muhammad Shafi"],
  [817, "en", "Tazkirul Quran", "Maulana Wahiduddin Khan"],
  [16, "ar", "التفسير الميسر", "Tafsir Muyassar"],
  [14, "ar", "تفسير ابن كثير", "Tafsir Ibn Kathir"],
  [91, "ar", "تفسير السعدي", "Tafsir al-Sa'di"],
  [15, "ar", "تفسير الطبري", "Tafsir al-Tabari"],
  [90, "ar", "تفسير القرطبي", "Tafsir al-Qurtubi"],
  [94, "ar", "تفسير البغوي", "Tafsir al-Baghawi"],
  [93, "ar", "التفسير الوسيط", "Al-Tafsir al-Wasit (Tantawi)"],
  [170, "ru", "Тафсир ас-Саади", "Tafsir al-Sa'di (Russian)"],
  [804, "ku", "تەفسیری ڕێبەر", "Rebar Kurdish Tafsir"],
];

function TafsirBody() {
  const { notify } = useUi();
  const [t, setT] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { api("/v1/admin/tafsir").then((r) => setT(r.tafsir)).catch((e) => notify(e.message, "err")); }, [notify]);
  if (!t) return <div className="qa-skel" />;
  const hidden = new Set(t.hidden.map(Number));
  const toggle = (id) => setT({ ...t, hidden: hidden.has(id) ? t.hidden.filter((x) => +x !== id) : [...t.hidden, id] });
  const defOf = (l) => { const shown = BOOKS.filter((b) => b[1] === l && !hidden.has(b[0])); return (shown.find((b) => b[0] === +t.defaults[l]) || shown[0] || [])[0]; };
  const save = async () => {
    setBusy(true);
    try { const r = await api("/v1/admin/tafsir", { method: "PUT", body: t }); setT(r.tafsir); notify("Saved — the website uses it now"); }
    catch (e) { notify(e.message, "err"); }
    setBusy(false);
  };
  return (
    <div className="qa-card qa-form">
      <h2>Tafsir books</h2>
      <p className="qa-muted small">Visitors choose a language and a tafsir book on the home page, then read it under every ayah. The tafsir text comes from Quran.com. Untick a book to hide it; choose which book opens first in each language.</p>
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
