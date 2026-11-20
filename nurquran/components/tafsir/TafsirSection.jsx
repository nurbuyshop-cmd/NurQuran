"use client";
// Home page: "Tafsir" card under the Quran settings. Choose a language (Bangla by default), then a tafsir book;
// tapping a book opens the whole Quran with that book's tafsir under every ayah.
import { useRouter } from "next/navigation";
import { useSiteConfig } from "@/lib/siteImages";
import { tafsirSetup, chosenTafsir } from "@/lib/quran/tafsir";
import "./tafsir.css";

export const BookIco = () => (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <path d="M24 12c-4-3-10-4-17-3v26c7-1 13 0 17 3 4-3 10-4 17-3V9c-7-1-13 0-17 3z" fill="currentColor" opacity=".14" />
    <path d="M24 12c-4-3-10-4-17-3v26c7-1 13 0 17 3m0-26c4-3 10-4 17-3v26c-7-1-13 0-17 3m0-26v26" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
    <path d="M12 16c3-.4 6 0 8 1M12 21c3-.4 6 0 8 1M28 17c2-1 5-1.4 8-1M28 22c2-1 5-1.4 8-1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export default function TafsirSection({ prefs, save }) {
  const router = useRouter();
  const cfg = useSiteConfig();
  const setup = tafsirSetup(cfg);
  if (!setup.books.length) return null;
  const { lang, book } = chosenTafsir(prefs, setup);
  const list = setup.books.filter((b) => b.lang === lang);
  const open = (id) => { save({ tafsirLang: lang, tafsirBook: id }); router.push(`/tafsir?t=${id}`); };
  return (
    <section className="qset-card tfs-card">
      <h3><span>Tafsir</span></h3>
      <div className="tfs-langs" role="tablist" aria-label="Tafsir language">
        {setup.langs.map((l) => (
          <button key={l.id} role="tab" aria-selected={l.id === lang} className={l.id === lang ? "on" : ""}
            onClick={() => save({ tafsirLang: l.id, tafsirBook: setup.defBook(l.id) })}>
            {l.name}{l.name !== l.en && <small>{l.en}</small>}
          </button>
        ))}
      </div>
      <div className="tfs-books">
        {list.map((b) => (
          <button key={b.id} className={`tfs-book${b.id === book ? " on" : ""}`} onClick={() => open(b.id)} dir="auto">
            <span className="ic"><BookIco /></span>
            <span className="tx"><b>{b.name}</b><small>{b.by}</small></span>
            {b.id === book && <span className="ck" aria-label="Selected">✓</span>}
          </button>
        ))}
      </div>
      <p className="tfs-hint">Tap a tafsir to read it with every ayah of the Quran. In the Quran reader, tap any ayah to see its meaning and tafsir.</p>
    </section>
  );
}
