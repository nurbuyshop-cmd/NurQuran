"use client";
// Tafsir reader: one surah at a time, every ayah (Arabic) followed by the chosen book's tafsir.
// URL: /tafsir?t=<book>&s=<surah>&a=<ayah>. Language and book can be changed at the top; the choice is remembered.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePrefs } from "@/lib/quran/prefs";
import { useSiteConfig } from "@/lib/siteImages";
import { loadSearch, addStaticFonts } from "@/lib/quran/mushaf";
import { SURAHS, surah, toArabicDigits } from "@/lib/quran/meta";
import { tafsirSetup, chosenTafsir, tafsirById, langById, loadTafsirPage, loadMeanings, cleanTafsirHtml } from "@/lib/quran/tafsir";
import { BookIco } from "./TafsirSection";
import "./tafsir.css";

const query = () => new URLSearchParams(typeof location === "undefined" ? "" : location.search);
const SIZE_KEY = "nq_tafsir_size";

export default function TafsirReader() {
  const router = useRouter();
  const [prefs, save] = usePrefs();
  const cfg = useSiteConfig();
  const setup = useMemo(() => tafsirSetup(cfg), [cfg]);
  const [s, setS] = useState(0);
  const [target, setTarget] = useState(0);
  const [urlBook, setUrlBook] = useState("");
  const [ayahs, setAyahs] = useState(null);       // [[s,a,simple,uthmani]...] for this surah
  const [pages, setPages] = useState([]);         // loaded tafsir pages for this surah
  const [next, setNext] = useState(1);            // next page to load (null = all loaded)
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [picker, setPicker] = useState(false);
  const [surahPick, setSurahPick] = useState(false);
  const [size, setSize] = useState(17);
  const sentinel = useRef(null);

  useEffect(() => {
    addStaticFonts();
    const q = query();
    setS(Math.min(114, Math.max(1, +q.get("s") || 1)));
    setTarget(+q.get("a") || 0);
    setUrlBook(q.get("t") || "");
    try { setSize(+localStorage.getItem(SIZE_KEY) || 17); } catch (e) {}
  }, []);

  // book: from the link (?t=) first, then the visitor's saved choice, then the admin default
  const chosen = prefs ? chosenTafsir(prefs, setup) : null;
  const linkBook = urlBook && setup.books.find((b) => b.id === String(urlBook));
  const bookId = linkBook ? linkBook.id : chosen && chosen.book;
  const book = tafsirById(bookId);
  const lang = book ? book.lang : chosen && chosen.lang;
  const rtl = lang && langById(lang).rtl;

  // Arabic text of the surah
  useEffect(() => {
    if (!s) return;
    let live = true;
    loadSearch().then((all) => live && setAyahs(all.filter((x) => x[0] === s))).catch(() => live && setAyahs([]));
    return () => { live = false; };
  }, [s]);

  // meaning (translation) of the surah in the book's language
  const [meanings, setMeanings] = useState(null);
  useEffect(() => {
    setMeanings(null);
    if (!s || !lang) return;
    let live = true;
    loadMeanings(lang, s).then((m) => live && setMeanings(m)).catch(() => {});
    return () => { live = false; };
  }, [s, lang]);

  // reset tafsir when surah or book changes
  useEffect(() => { setPages([]); setNext(1); setError(""); }, [s, bookId]);

  const loadMore = useCallback(async () => {
    if (!bookId || !s || !next || busy) return;
    setBusy(true); setError("");
    try {
      const d = await loadTafsirPage(bookId, s, next);
      setPages((p) => [...p, { ...d, book: bookId, s }]);
      setNext(d.next);
    } catch (e) { setError(e.message); }
    setBusy(false);
  }, [bookId, s, next, busy]);

  useEffect(() => { if (bookId && s && next === 1 && !pages.length && !busy) loadMore(); }, [bookId, s, next, pages.length, busy, loadMore]);
  // load the next page when the end comes into view
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !next) return;
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) loadMore(); }, { rootMargin: "900px" });
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore, next]);

  // groups: an entry explains its ayah and the following ayahs that have no entry of their own
  const entries = useMemo(() => pages.filter((p) => p.book === bookId && p.s === s).flatMap((p) => p.entries), [pages, bookId, s]);
  const groups = useMemo(() => {
    if (!ayahs) return [];
    return entries.map((e, i) => {
      const nextA = entries[i + 1] ? entries[i + 1].a : next ? e.a + 1 : surah(s).ayahs + 1;
      return { ...e, ayahs: ayahs.filter((x) => x[1] >= e.a && x[1] < nextA), html: cleanTafsirHtml(e.text) };
    });
  }, [entries, ayahs, next, s]);

  // jump to the ayah from the link (keeps loading pages until it is there)
  const jumped = useRef(false);
  useEffect(() => {
    const jk = `${bookId}:${s}:${target}`;
    if (!target || jumped.current === jk || !groups.length) return;
    const g = groups.find((x) => x.ayahs.some((y) => y[1] === target));
    if (g) {
      jumped.current = jk;
      setTimeout(() => document.getElementById(`a${target}`)?.scrollIntoView({ block: "start" }), 60);
    } else if (next && !busy) loadMore();
  }, [groups, target, next, busy, loadMore, bookId, s]);

  const goSurah = (n) => {
    if (n < 1 || n > 114) return;
    setS(n); setTarget(0); setSurahPick(false);
    history.replaceState(null, "", `/tafsir?t=${bookId}&s=${n}`);
    window.scrollTo(0, 0);
  };
  const chooseBook = (id) => {
    const b = tafsirById(id);
    save({ tafsirLang: b.lang, tafsirBook: b.id });
    setUrlBook(b.id); setPicker(false);
    // stay at the same ayah in the new book
    const top = [...document.querySelectorAll(".tfr-ayahs p[id]")].find((p) => p.getBoundingClientRect().bottom > 90);
    const a = top ? +top.id.slice(1) : target;
    if (a) setTarget(a);
    history.replaceState(null, "", `/tafsir?t=${b.id}&s=${s}${a ? `&a=${a}` : ""}`);
  };
  const changeSize = (d) => setSize((v) => { const n = Math.min(26, Math.max(13, v + d)); try { localStorage.setItem(SIZE_KEY, n); } catch (e) {} return n; });

  if (!prefs || !s) return <div className="tfr" />;
  const cur = surah(s);
  return (
    <div className="tfr" style={{ "--tfz": `${size}px` }}>
      <header className="tfr-head">
        <button className="b" aria-label="Back" onClick={() => (history.length > 1 ? router.back() : router.push("/"))}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <button className="book" onClick={() => setPicker(true)} dir="auto">
          <span className="ic"><BookIco /></span>
          <span className="tx"><b>{book ? book.name : "Tafsir"}</b><small>{book ? `${langById(book.lang).name} · tap to change` : ""}</small></span>
          <svg className="dd" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z" fill="currentColor" /></svg>
        </button>
        <div className="sz">
          <button aria-label="Smaller text" onClick={() => changeSize(-1)}>A−</button>
          <button aria-label="Bigger text" onClick={() => changeSize(1)}>A+</button>
        </div>
      </header>

      <div className="tfr-surah">
        <button aria-label="Previous surah" disabled={s === 1} onClick={() => goSurah(s - 1)}>‹</button>
        <button className="nm" onClick={() => setSurahPick(true)}>
          <span className="ar" dir="rtl">سُورَةُ {cur.ar}</span>
          <small>{s}. {cur.en} · {cur.ayahs} ayahs ▾</small>
        </button>
        <button aria-label="Next surah" disabled={s === 114} onClick={() => goSurah(s + 1)}>›</button>
      </div>

      <main className="tfr-list">
        {!book && <p className="tfr-msg">No tafsir is available right now.</p>}
        {groups.map((g) => (
          <article key={g.key} className="tfr-item">
            <div className="tfr-ayahs">
              {g.ayahs.map((x) => (
                <div key={x[1]} className="one">
                  <p id={`a${x[1]}`} className={`ar${x[1] === target ? " hit" : ""}`} dir="rtl">
                  {x[3].replace(/\s*[٠-٩]+$/, "")} <span className="no">{toArabicDigits(x[1])}</span>
                  </p>
                  {meanings && meanings[x[1]] && <p className={`mean lang-${lang}`} dir={rtl ? "rtl" : "ltr"} lang={lang}>{meanings[x[1]]}</p>}
                </div>
              ))}
              <span className="ref">{cur.en} {s}:{g.ayahs.length > 1 ? `${g.ayahs[0][1]}–${g.ayahs[g.ayahs.length - 1][1]}` : g.a}</span>
            </div>
            {g.html.trim()
              ? <div className={`tfr-text lang-${lang}`} dir={rtl ? "rtl" : "ltr"} lang={lang} dangerouslySetInnerHTML={{ __html: g.html }} />
              : <p className="tfr-text empty">This book has no separate tafsir for this ayah.</p>}
          </article>
        ))}
        {error && <div className="tfr-msg err">{error} <button onClick={loadMore}>Try again</button></div>}
        {(busy || (!ayahs && !error)) && <div className="tfr-loading"><i /><i /><i /></div>}
        {next ? <div ref={sentinel} className="tfr-sentinel" /> : groups.length > 0 && (
          <div className="tfr-end">
            {s < 114 && <button onClick={() => goSurah(s + 1)}>Next surah: {surah(s + 1).en} ›</button>}
          </div>
        )}
      </main>

      {picker && (
        <div className="tfr-sheet-bg" onClick={() => setPicker(false)}>
          <div className="tfr-sheet" onClick={(e) => e.stopPropagation()}>
            <h3>Choose tafsir</h3>
            <BookPicker setup={setup} lang={lang} bookId={bookId} onPick={chooseBook} />
          </div>
        </div>
      )}
      {surahPick && (
        <div className="tfr-sheet-bg" onClick={() => setSurahPick(false)}>
          <div className="tfr-sheet tall" onClick={(e) => e.stopPropagation()}>
            <h3>Choose surah</h3>
            <div className="tfr-surahs">
              {SURAHS.map((x) => (
                <button key={x.n} className={x.n === s ? "on" : ""} onClick={() => goSurah(x.n)}>
                  <span className="n">{x.n}</span><span className="e">{x.en}<small>{x.ayahs} ayahs</small></span><span className="a ar" dir="rtl">{x.ar}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BookPicker({ setup, lang: lang0, bookId, onPick }) {
  const [lang, setLang] = useState(lang0 || setup.defLang);
  return (
    <>
      <div className="tfs-langs">
        {setup.langs.map((l) => (
          <button key={l.id} className={l.id === lang ? "on" : ""} onClick={() => setLang(l.id)}>{l.name}{l.name !== l.en && <small>{l.en}</small>}</button>
        ))}
      </div>
      <div className="tfs-books col">
        {setup.books.filter((b) => b.lang === lang).map((b) => (
          <button key={b.id} className={`tfs-book${b.id === bookId ? " on" : ""}`} onClick={() => onPick(b.id)} dir="auto">
            <span className="ic"><BookIco /></span>
            <span className="tx"><b>{b.name}</b><small>{b.by}</small></span>
            {b.id === bookId && <span className="ck">✓</span>}
          </button>
        ))}
      </div>
    </>
  );
}
