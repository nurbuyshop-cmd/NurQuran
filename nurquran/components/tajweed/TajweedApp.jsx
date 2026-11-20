"use client";
// Learn Tajweed (Qaida) — lesson list, lesson grid (tap to hear), settings. Same flow as the reference app.
// Free / limited access is set in the admin panel; with "limited", only the first items of every lesson are open
// unless this phone has Premium.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addStaticFonts, BASE, loadIndex } from "@/lib/quran/mushaf";
import { useSiteConfig } from "@/lib/siteImages";
import { usePremium } from "@/lib/premium";
import "./tajweed.css";

const PREF = "nq_tajweed";
const DEF = { style: "bn", spell: true, cont: false, size: 50 };
// names of the vowel marks in each spelling style
const STYLES = {
  bn: { label: "যবর, যের, পেশ", fatha: "যবর", kasra: "যের", damma: "পেশ", fathatan: "দুই যবর", kasratan: "দুই যের", dammatan: "দুই পেশ" },
  ur: { label: "زبر، زیر، پیش", fatha: "زبر", kasra: "زیر", damma: "پیش", fathatan: "دو زبر", kasratan: "دو زیر", dammatan: "دو پیش" },
  ar: { label: "فتحة، كسرة، ضمة", fatha: "فَتْحَة", kasra: "كَسْرَة", damma: "ضَمَّة", fathatan: "تَنْوِين فَتْح", kasratan: "تَنْوِين كَسْر", dammatan: "تَنْوِين ضَمّ" },
  en: { label: "Fatha, Kasra, Damma", fatha: "Fatha", kasra: "Kasra", damma: "Damma", fathatan: "Fathatan", kasratan: "Kasratan", dammatan: "Dammatan" },
};
const LETTER_NAME = {
  "ا": "أَلِف", "ب": "بَاء", "ت": "تَاء", "ث": "ثَاء", "ج": "جِيم", "ح": "حَاء", "خ": "خَاء", "د": "دَال", "ذ": "ذَال", "ر": "رَاء",
  "ز": "زَاي", "س": "سِين", "ش": "شِين", "ص": "صَاد", "ض": "ضَاد", "ط": "طَاء", "ظ": "ظَاء", "ع": "عَيْن", "غ": "غَيْن", "ف": "فَاء",
  "ق": "قَاف", "ك": "كَاف", "ل": "لَام", "م": "مِيم", "ن": "نُون", "و": "وَاو", "ه": "هَاء", "ء": "هَمْزَة", "ي": "يَاء",
};
const letterCount = (t) => (t.match(/[ء-يٱ]/g) || []).length;

let lessonsP = null;
const loadLessons = () => (lessonsP = lessonsP || fetch(`${BASE}/tajweed/lessons.json`).then((r) => r.json()));

function usePrefs() {
  const [p, setP] = useState(DEF);
  useEffect(() => { try { setP({ ...DEF, ...(JSON.parse(localStorage.getItem(PREF) || "null") || {}) }); } catch (e) {} }, []);
  const save = useCallback((patch) => setP((cur) => { const n = { ...cur, ...patch }; try { localStorage.setItem(PREF, JSON.stringify(n)); } catch (e) {} return n; }), []);
  return [p, save];
}
const query = () => new URLSearchParams(typeof location === "undefined" ? "" : location.search || (location.hash.split("?")[1] || ""));

function Star({ n }) {
  return (
    <span className="tj-star" aria-hidden="true">
      <svg viewBox="0 0 40 40"><path d="M20 2l4.2 6.3 7.4-1.6-1.6 7.4L36.3 18 30 22.2l1.6 7.4-7.4-1.6L20 34.3 15.8 28l-7.4 1.6 1.6-7.4L3.7 18 10 13.8 8.4 6.4l7.4 1.6z" fill="#fff8d6" stroke="#e2b23a" strokeWidth="1.6" /><circle cx="20" cy="18.2" r="9" fill="none" stroke="#e2b23a" strokeWidth="1.2" /></svg>
      <b>{n}</b>
    </span>
  );
}
const Back = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>;
const Gear = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.4 13a7.6 7.6 0 000-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 00-1.7-1L15 3.3h-4l-.4 2.6a7.4 7.4 0 00-1.7 1l-2.5-1-2 3.5L6.6 11a7.6 7.6 0 000 2l-2.2 1.6 2 3.5 2.5-1a7.4 7.4 0 001.7 1l.4 2.6h4l.4-2.6a7.4 7.4 0 001.7-1l2.5 1 2-3.5zM13 15.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z" transform="translate(-1 0)" /></svg>;

export default function TajweedApp() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [bism, setBism] = useState("");
  const [view, setView] = useState({ l: 0, settings: false });
  const [prefs, save] = usePrefs();
  const cfg = useSiteConfig();
  const { premium } = usePremium();

  useEffect(() => {
    addStaticFonts();
    loadLessons().then(setData).catch(() => setData({ lessons: [] }));
    loadIndex().then((i) => setBism(i.bism.q)).catch(() => {});
    const read = () => setView({ l: +query().get("l") || 0, settings: query().get("s") === "1" });
    read();
    window.addEventListener("popstate", read);
    window.addEventListener("hashchange", read);
    return () => { window.removeEventListener("popstate", read); window.removeEventListener("hashchange", read); };
  }, []);
  const go = (l, settings) => {
    const qs = l ? `?l=${l}${settings ? "&s=1" : ""}` : "";
    if (location.hash.startsWith("#tajweed")) location.hash = `tajweed${qs}`;
    else history.pushState(null, "", `${location.pathname}${qs}`);
    setView({ l, settings: !!settings });
    window.scrollTo(0, 0);
  };
  const back = () => {
    if (view.settings) go(view.l, false);
    else if (view.l) go(0);
    else (history.length > 1 ? router.back() : router.push("/"));
  };

  const t = cfg.tajweed || { mode: "limited", freeCount: 6 };
  const open = t.mode === "free" || !!premium;
  // lessons edited / added in the admin panel replace the built-in ones
  const lessons = useMemo(() => {
    if (!data) return null;
    const edits = cfg.tajweedLessons || {};
    const map = new Map(data.lessons.map((l) => [l.n, l]));
    Object.values(edits).forEach((l) => { if (l && l.n && l.items && l.items.length) map.set(+l.n, { ...map.get(+l.n), ...l, n: +l.n }); });
    return [...map.values()].sort((a, b) => a.n - b.n);
  }, [data, cfg.tajweedLessons]);
  // how many items of lesson n are open: free lesson → all, premium lesson → none, otherwise the first freeCount
  const access = (n) => (open ? "free" : (t.lessonAccess || {})[n] || "limited");
  const freeFor = (n) => { const a = access(n); return a === "free" ? Infinity : a === "premium" ? 0 : (+t.freeCount || 0); };
  const lesson = lessons && view.l ? lessons.find((x) => x.n === view.l) : null;

  if (view.settings) return <Settings prefs={prefs} save={save} onBack={back} />;
  if (lesson) return <Lesson lesson={lesson} audioBase={data.audioBase} uploaded={cfg.tajweedAudio || {}} prefs={prefs}
    freeCount={freeFor(lesson.n)} onBack={back} onSettings={() => go(view.l, true)} onBuy={() => router.push("/premium")} />;

  return (
    <div className="tj">
      <header className="tj-head home">
        <button className="b" aria-label="Back" onClick={back}><Back /></button>
        <span className="t" />
        <Link href="/premium" className={`prem${premium ? " on" : ""}`}>{premium ? "Premium ✓" : t.mode === "free" ? "Free" : "Premium"}</Link>
        <button className="g" aria-label="Settings" onClick={() => go(view.l || 1, true)}><Gear /></button>
      </header>
      <div className="tj-arc"><div className="bism" dir="rtl">{bism}</div></div>
      <ol className="tj-lessons">
        {!lessons && <li className="tj-empty">Loading…</li>}
        {lessons && lessons.map((l) => {
          const a = access(l.n);
          return (
            <li key={l.n}>
              <button onClick={() => go(l.n)}>
                <Star n={l.n} />
                <span className="tx"><b dir="rtl">{l.title}</b><small>Lesson {l.n}{l.en ? ` · ${l.en}` : ""}</small></span>
                {!premium && t.mode !== "free" && (a === "free"
                  ? <span className="tj-badge free">Free</span>
                  : a === "premium" ? <span className="tj-badge lock" aria-label="Premium"><svg viewBox="0 0 24 24"><path d="M7 10V7a5 5 0 0110 0v3h1a1 1 0 011 1v9a1 1 0 01-1 1H6a1 1 0 01-1-1v-9a1 1 0 011-1zm2 0h6V7a3 3 0 00-6 0z" fill="currentColor" /></svg></span> : null)}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ---------------- one lesson ---------------- */
function Lesson({ lesson, audioBase, uploaded, prefs, freeCount, onBack, onSettings, onBuy }) {
  const [cur, setCur] = useState(null);       // item playing / last tapped
  const [playing, setPlaying] = useState(false);
  const [locked, setLocked] = useState(false);
  const [toast, setToast] = useState("");
  const el = useRef(null);
  const chain = useRef(false);
  const items = lesson.items;
  const S = STYLES[prefs.style] || STYLES.bn;
  const src = (x) => uploaded[x.id] || (x.audio ? audioBase + x.audio : null);
  const say = (m) => { setToast(m); clearTimeout(say.t); say.t = setTimeout(() => setToast(""), 2600); };

  const play = (i, auto) => {
    const x = items[i];
    if (!x) { setPlaying(false); chain.current = false; return; }
    if (i >= freeCount) { setPlaying(false); chain.current = false; if (!auto) setLocked(true); return; }
    setCur(i);
    const s = src(x);
    const a = el.current;
    if (!s) {
      if (!auto) say("The recording for this item has not been added yet.");
      if (chain.current) setTimeout(() => play(i + 1, true), 900); else setPlaying(false);
      return;
    }
    a.src = s;
    a.play().then(() => setPlaying(true)).catch(() => { setPlaying(false); say("Could not play the sound. Check your internet connection."); });
    document.querySelector(`[data-i="${i}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };
  useEffect(() => {
    const a = el.current;
    const end = () => { if (chain.current) play((cur ?? -1) + 1, true); else setPlaying(false); };
    a.addEventListener("ended", end);
    return () => a.removeEventListener("ended", end);
  });
  const tap = (i) => { chain.current = !!prefs.cont; play(i, false); };
  const playAll = () => {
    if (playing) { el.current.pause(); chain.current = false; setPlaying(false); return; }
    chain.current = true;
    play(cur != null && cur < freeCount - 1 ? cur : 0, false);
  };

  const spelling = (x) => {
    if (!prefs.spell) return null;
    if (x.v) return `${LETTER_NAME[x.letter] || x.letter} · ${S[x.v]}`;
    return x.sp || null;
  };
  const fs = 20 + prefs.size * 0.36; // px
  const span = (x) => (x.wide ? 3 : lesson.cols === 3 ? 1 : letterCount(x.t) > 7 ? 3 : letterCount(x.t) > 4 ? 2 : 1);

  return (
    <div className="tj">
      <audio ref={el} preload="none" crossOrigin="anonymous" />
      <header className="tj-head">
        <button className="b" aria-label="Back" onClick={onBack}><Back /></button>
        <button className={`pa${playing ? " on" : ""}`} aria-label={playing ? "Stop" : "Play all"} onClick={playAll}>
          {playing ? <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" /><rect x="8.5" y="8.5" width="7" height="7" rx="1" fill="currentColor" /></svg>
            : <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M10 8l6 4-6 4z" fill="currentColor" /></svg>}
        </button>
        <span className="t" dir="rtl">{lesson.title}</span>
        <button className="g" aria-label="Lesson settings" onClick={onSettings}><Gear /></button>
      </header>
      <div className="tj-arc small" />
      <div className="tj-grid" dir="rtl" style={{ "--tfs": `${fs}px` }}>
        {items.map((x, i) => {
          const off = i >= freeCount;
          const sp = spelling(x);
          return (
            <button key={x.id} data-i={i} className={`tj-cell${cur === i ? " on" : ""}${off ? " off" : ""}`} style={{ gridColumn: `span ${span(x)}` }}
              onClick={() => tap(i)} aria-label={off ? `${x.t} (Premium)` : x.t}>
              <span className="w">{x.t}</span>
              {sp && <span className="sp" dir="auto">{sp}</span>}
            </button>
          );
        })}
      </div>
      {freeCount < items.length && (
        <div className="tj-more"><button onClick={onBuy}>{freeCount === 0 ? "This lesson is part of Premium — unlock it" : `Unlock all ${items.length} items with Premium`}</button></div>
      )}
      {locked && (
        <div className="tj-dlg-bg" onClick={() => setLocked(false)}>
          <div className="tj-dlg" onClick={(e) => e.stopPropagation()}>
            <p>Limited content is present in the free version</p>
            <div className="r"><button onClick={() => setLocked(false)}>OK</button><button onClick={onBuy}>BUY FULL</button></div>
          </div>
        </div>
      )}
      <div className={`tj-toast${toast ? " show" : ""}`}>{toast}</div>
    </div>
  );
}

/* ---------------- settings ---------------- */
function Settings({ prefs, save, onBack }) {
  const [menu, setMenu] = useState(false);
  const Sw = ({ k, label }) => (
    <button className="tj-row" role="switch" aria-checked={!!prefs[k]} onClick={() => save({ [k]: !prefs[k] })}>
      <span>{label}</span><span className={`sw${prefs[k] ? " on" : ""}`}><i /></span>
    </button>
  );
  return (
    <div className="tj">
      <header className="tj-head"><button className="b" aria-label="Back" onClick={onBack}><Back /></button><span className="t">Spelling Style</span><span className="g" /></header>
      <div className="tj-arc small" />
      <div className="tj-set">
        <button className="tj-row" onClick={() => setMenu((m) => !m)}><span>Spelling Style</span><span className="v">{(STYLES[prefs.style] || STYLES.bn).label} &gt;</span></button>
        {menu && (
          <div className="tj-menu">
            {Object.entries(STYLES).map(([k, v]) => (
              <button key={k} className={prefs.style === k ? "on" : ""} onClick={() => { save({ style: k }); setMenu(false); }}>{v.label}</button>
            ))}
          </div>
        )}
        <Sw k="spell" label="Spellings" />
        <Sw k="cont" label="Continuous Play" />
        <div className="tj-size">
          <div className="l">
            <span>Size Adjust</span><b>{prefs.size}%</b>
            <input type="range" min="0" max="100" value={prefs.size} style={{ "--p": `${prefs.size}%` }} onChange={(e) => save({ size: +e.target.value })} />
          </div>
          <div className="r" dir="rtl" style={{ fontSize: `${20 + prefs.size * 0.36}px` }}>سُورَةٌ</div>
        </div>
      </div>
    </div>
  );
}
