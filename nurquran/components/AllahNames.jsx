"use client";
// The 99 Names of Allah: tap a name to hear it, meaning in the chosen language, and a Tafsir sheet with the
// explanation, virtue, the Quran ayah (with its meaning) and that ayah's tafsir from the tafsir books.
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { NAMES, NAME_LANGS, UI, nameAudio, num, textLang } from "@/lib/names99";
import { useSiteConfig } from "@/lib/siteImages";
import { surah, toArabicDigits } from "@/lib/quran/meta";
import { TAFSIR_API, tafsirSetup, loadAyahTafsir, loadMeanings, cleanTafsirHtml } from "@/lib/quran/tafsir";

const LANG_KEY = "nqNamesLang";
const BOOK_KEY = "nqNamesBook";
const read = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
const fold = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ًͯ-ٰٟ'’ʼ\-\s]/g, "");

/* ---------- icons ---------- */
const Back = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>;
const Play = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 001.5.86l10.4-6.5a1 1 0 000-1.72L9.5 4.64A1 1 0 008 5.5z" /></svg>;
const Stop = () => <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6.5" y="6.5" width="11" height="11" rx="2" /></svg>;
const Speaker = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9.5v5h3.5L12 19V5L7.5 9.5z" fill="currentColor" stroke="none" /><path d="M15.5 9a4 4 0 010 6" /><path d="M18.2 6.5a7.5 7.5 0 010 11" /></svg>;
const Book = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5.5A2.5 2.5 0 016.5 3H20v15H6.5A2.5 2.5 0 004 20.5z" /><path d="M4 20.5A2.5 2.5 0 016.5 23H20v-5" /><path d="M9 8h7M9 11.5h5" /></svg>;
const Search = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg>;
const Close = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>;
const Wave = () => <span className="an-wave" aria-hidden="true"><i /><i /><i /><i /></span>;

// eight-point star with the number (like an ayah marker)
function Badge({ n, lang }) {
  return (
    <span className="an-badge" aria-hidden="true">
      <svg viewBox="0 0 40 40"><path d="M20 2l5.2 6.3 8.1-.6-.6 8.1L39 20l-6.3 5.2.6 8.1-8.1-.6L20 39l-5.2-6.3-8.1.6.6-8.1L1 20l6.3-5.2-.6-8.1 8.1.6z" /></svg>
      <b>{num(n, lang)}</b>
    </span>
  );
}

export default function AllahNames() {
  const router = useRouter();
  const cfg = useSiteConfig();
  const [lang, setLang] = useState("bn");
  const [q, setQ] = useState("");
  const [playing, setPlaying] = useState(0);   // number of the name being heard
  const [all, setAll] = useState(false);       // "listen to all" running
  const [open, setOpen] = useState(null);      // name shown in the Tafsir sheet
  const [intro, setIntro] = useState(true);
  const [toast, setToast] = useState("");
  const audio = useRef(null);
  const allRef = useRef(false);
  const gapT = useRef(0);
  const t = UI[lang];
  const rtl = lang === "ur";

  useEffect(() => {
    const saved = read(LANG_KEY);
    if (NAME_LANGS.some((l) => l.id === saved)) setLang(saved);
    else {
      try { // first visit: the reader's tafsir language, if it is one of ours
        const p = JSON.parse(read("quranReader") || "null");
        if (p && NAME_LANGS.some((l) => l.id === p.tafsirLang)) setLang(p.tafsirLang);
      } catch (e) {}
    }
    if (read("nqNamesIntro") === "0") setIntro(false);
  }, []);
  const pickLang = (id) => { setLang(id); write(LANG_KEY, id); };

  const list = useMemo(() => {
    const k = fold(q);
    if (!k) return NAMES;
    return NAMES.filter((x) => [x.ar, x.tr, x.p.bn, x.p.hi, String(x.n), ...Object.values(x.m)].some((v) => fold(v).includes(k)));
  }, [q]);

  /* ---------- audio ---------- */
  const stopAll = () => {
    allRef.current = false; setAll(false); clearTimeout(gapT.current);
    const el = audio.current; if (el) el.pause();
    setPlaying(0);
  };
  const play = (n, fromAll = false) => {
    const el = audio.current;
    if (!el) return;
    if (!fromAll && allRef.current) { allRef.current = false; setAll(false); clearTimeout(gapT.current); }
    el.src = nameAudio(n);
    el.currentTime = 0;
    setPlaying(n);
    el.play().catch(() => { setPlaying(0); if (!fromAll) flash(t.noAudio); });
    if (fromAll) document.getElementById(`an-${n}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  const playAll = () => {
    if (allRef.current) { stopAll(); return; }
    allRef.current = true; setAll(true);
    const start = playing && list.some((x) => x.n === playing) ? playing : list[0]?.n;
    if (start) play(start, true);
  };
  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    const end = () => {
      if (!allRef.current) { setPlaying(0); return; }
      const cur = Number(el.dataset.n || 0);
      const i = listRef.current.findIndex((x) => x.n === cur);
      const next = listRef.current[i + 1];
      if (!next) { stopAll(); return; }
      gapT.current = setTimeout(() => allRef.current && play(next.n, true), 700);
    };
    el.addEventListener("ended", end);
    return () => el.removeEventListener("ended", end);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const listRef = useRef(list);
  listRef.current = list;
  useEffect(() => { if (audio.current) audio.current.dataset.n = String(playing || ""); }, [playing]);
  useEffect(() => () => { clearTimeout(gapT.current); audio.current && audio.current.pause(); }, []);

  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 2200); };
  const closeIntro = () => { setIntro(false); write("nqNamesIntro", "0"); };

  useEffect(() => { // Esc closes the Tafsir sheet
    if (!open) return;
    const k = (e) => { if (e.key === "Escape") setOpen(null); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);

  return (
    <div className={`an${rtl ? " rtl" : ""}`} lang={lang}>
      <audio ref={audio} preload="none" />
      <header className="an-bar" data-bar-color="#14533a">
        <button className="an-back" aria-label="Back" onClick={() => (history.length > 1 ? router.back() : router.push("/"))}><Back /></button>
        <div className="an-title">
          <h1>{t.title}</h1>
          <span lang="ar" dir="rtl">الأسماء الحسنى</span>
        </div>
        <button className={`an-all${all ? " on" : ""}`} onClick={playAll} aria-pressed={all}>
          {all ? <Stop /> : <Play />}<span>{all ? t.stop : t.playAll}</span>
        </button>
      </header>

      <div className="an-tools">
        <div className="an-langs" role="tablist" aria-label={t.lang}>
          {NAME_LANGS.map((l) => (
            <button key={l.id} role="tab" aria-selected={lang === l.id} className={lang === l.id ? "on" : ""} onClick={() => pickLang(l.id)} lang={l.id}>{l.name}</button>
          ))}
        </div>
        <label className="an-search">
          <Search />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.search} type="search" dir="auto" />
          {q && <button aria-label={t.close} onClick={() => setQ("")}><Close /></button>}
        </label>
      </div>

      <main className="an-main">
        {intro && !q && (
          <section className="an-intro">
            <button className="x" aria-label={t.close} onClick={closeIntro}><Close /></button>
            <h2>{t.introTitle}</h2>
            {t.intro.map((p, i) => <p key={i}>{p}</p>)}
          </section>
        )}

        {list.length === 0 && <p className="an-empty">{t.none}</p>}
        <ol className="an-list">
          {list.map((x) => (
            <li key={x.n} id={`an-${x.n}`} className={`an-card${playing === x.n ? " playing" : ""}`}>
              <button className="an-hit" onClick={() => (playing === x.n ? stopAll() : play(x.n))} aria-label={`${t.listen}: ${x.tr}`}>
                <Badge n={x.n} lang={lang} />
                <span className="an-text">
                  <span className="an-tr">{x.tr}{(lang === "bn" || lang === "hi") && x.p[lang] ? <em> · {x.p[lang]}</em> : null}</span>
                  <span className="an-m">{x.m[lang]}</span>
                </span>
                <span className="an-ar" lang="ar" dir="rtl">{x.ar}</span>
                <span className="an-say">{playing === x.n ? <Wave /> : <Speaker />}</span>
              </button>
              <button className="an-taf" onClick={() => setOpen(x)}><Book /><span>{t.tafsir}</span></button>
            </li>
          ))}
        </ol>
        <p className="an-note">{t.note}</p>
      </main>

      {open && <TafsirSheet x={open} lang={lang} t={t} cfg={cfg} onClose={() => setOpen(null)}
        playing={playing === open.n} onPlay={() => (playing === open.n ? stopAll() : play(open.n))} />}
      {toast && <div className="an-toast" role="status">{toast}</div>}
    </div>
  );
}

/* ---------- Tafsir sheet ---------- */
const ayahCache = new Map();
async function loadAyahText(key) {
  if (ayahCache.has(key)) return ayahCache.get(key);
  try { const v = sessionStorage.getItem(`nq_ayah:${key}`); if (v) { ayahCache.set(key, v); return v; } } catch (e) {}
  const r = await fetch(`${TAFSIR_API}/verses/by_key/${key}?fields=text_uthmani`);
  if (!r.ok) throw new Error("ayah");
  const d = await r.json();
  const txt = (d.verse && d.verse.text_uthmani) || "";
  ayahCache.set(key, txt);
  try { sessionStorage.setItem(`nq_ayah:${key}`, txt); } catch (e) {}
  return txt;
}

function TafsirSheet({ x, lang, t, cfg, onClose, playing, onPlay }) {
  const tl = textLang(lang);
  const setup = useMemo(() => tafsirSetup(cfg), [cfg]);
  const books = setup.books.filter((b) => b.lang === lang);
  const [book, setBook] = useState(null);
  const [ayah, setAyah] = useState({ ar: "", tr: "", err: false });
  const [taf, setTaf] = useState({ loading: false, html: "", err: false });
  const [more, setMore] = useState(false);
  const [s, a] = x.q ? x.q.split(":").map(Number) : [0, 0];
  const sheet = useRef(null);

  useEffect(() => {
    const saved = read(`${BOOK_KEY}:${lang}`);
    setBook(books.some((b) => b.id === saved) ? saved : setup.defBook(lang));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, setup]);
  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);
  useEffect(() => { sheet.current && sheet.current.scrollTo(0, 0); setMore(false); }, [x]);

  useEffect(() => {
    if (!s) return;
    let live = true;
    setAyah({ ar: "", tr: "", err: false });
    loadAyahText(x.q).then((ar) => live && setAyah((v) => ({ ...v, ar }))).catch(() => live && setAyah((v) => ({ ...v, err: true })));
    loadMeanings(lang, s).then((m) => live && m && setAyah((v) => ({ ...v, tr: m[a] || "" }))).catch(() => {});
    return () => { live = false; };
  }, [x, lang, s, a]);

  useEffect(() => {
    if (!s || !book) { setTaf({ loading: false, html: "", err: false }); return; }
    let live = true;
    setTaf({ loading: true, html: "", err: false });
    loadAyahTafsir(book, s, a)
      .then((d) => live && setTaf({ loading: false, html: d && d.html ? cleanTafsirHtml(d.html) : "", err: false }))
      .catch(() => live && setTaf({ loading: false, html: "", err: true }));
    return () => { live = false; };
  }, [book, s, a]);

  const chooseBook = (id) => { setBook(id); write(`${BOOK_KEY}:${lang}`, id); };
  const bookRtl = lang === "ur";

  return (
    <div className="an-sheet-bg" onClick={onClose}>
      <div className="an-sheet" ref={sheet} role="dialog" aria-modal="true" aria-label={`${t.tafsir}: ${x.tr}`} onClick={(e) => e.stopPropagation()}>
        <div className="an-grip" />
        <button className="an-sheet-x" aria-label={t.close} onClick={onClose}><Close /></button>
        <div className="an-sheet-head">
          <Badge n={x.n} lang={lang} />
          <div className="an-ar big" lang="ar" dir="rtl">{x.ar}</div>
          <div className="an-tr">{x.tr}{(lang === "bn" || lang === "hi") && x.p[lang] ? <em> · {x.p[lang]}</em> : null}</div>
          <div className="an-m">{x.m[lang]}</div>
          <button className={`an-listen${playing ? " on" : ""}`} onClick={onPlay}>{playing ? <Wave /> : <Speaker />}<span lang="ar" dir="rtl">{x.ya}</span></button>
        </div>

        <section className="an-sec" lang={tl} dir="ltr">
          <h3>{UI[tl].explain}</h3>
          <p>{x.ex[tl]}</p>
        </section>
        <section className="an-sec virtue" lang={tl} dir="ltr">
          <h3>{UI[tl].virtue}</h3>
          <p>{x.fz[tl]}</p>
        </section>

        {s ? (
          <section className="an-sec quran">
            <h3>{t.inQuran} <small>· {surah(s).en} {num(s, lang)}:{num(a, lang)}</small></h3>
            {ayah.ar ? <p className="an-ayah" lang="ar" dir="rtl">{ayah.ar} <span className="end">﴿{toArabicDigits(a)}﴾</span></p>
              : ayah.err ? <p className="an-muted">{t.offline}</p> : <p className="an-muted">{t.loading}</p>}
            {ayah.tr && <p className="an-ayah-tr" dir={rtl(lang)}><b>{t.ayahMeaning}:</b> {ayah.tr}</p>}
            <Link className="an-read" href={`/quran/?s=${s}&a=${a}`}>{t.readQuran} →</Link>

            {books.length > 0 && (
              <div className="an-book">
                <div className="an-book-head">
                  <h4>{t.bookTafsir}</h4>
                  {books.length > 1 ? (
                    <select value={book || ""} onChange={(e) => chooseBook(e.target.value)} dir={rtl(lang)}>
                      {books.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  ) : <span className="one">{books[0].name}</span>}
                </div>
                {taf.loading ? <p className="an-muted">{t.loading}</p>
                  : taf.err ? <p className="an-muted">{t.offline}</p>
                  : taf.html ? (
                    <>
                      <div className={`an-taftext${more ? " full" : ""}${bookRtl ? " rtl" : ""}`} lang={lang} dir={rtl(lang)} dangerouslySetInnerHTML={{ __html: taf.html }} />
                      <button className="an-more" onClick={() => setMore((m) => !m)}>{more ? t.less : t.more}</button>
                    </>
                  ) : null}
              </div>
            )}
          </section>
        ) : (
          <section className="an-sec quran">
            <h3>{t.source}</h3>
            <p>{x.h === "Muslim 771" ? "Sahih Muslim 771" : "Sunan at-Tirmidhi 3507"}</p>
          </section>
        )}
        <p className="an-sources"><b>{t.source}:</b> {t.sources}</p>
      </div>
    </div>
  );
}
const rtl = (lang) => (lang === "ur" ? "rtl" : "ltr");
