"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuranContent } from "@/lib/quran/data";
import { SURAHS, JUZ_NAMES, surah } from "@/lib/quran/meta";
import { Ico, ACTION_LABEL, SHORT_LABEL, DEFAULT_ORDER, G, AyahMark } from "./QIcons";
import { usePrayerSettings } from "@/lib/prayerStore";
import { getPrayerState, fmtTime } from "@/lib/prayerEngine";
import DesktopNav from "@/components/DesktopNav";

const PREF_KEY = "quranReader";
const TOOLBAR_SLOTS = 6;
const SPEEDS = [0.75, 1, 1.1, 1.25, 1.5];
const REPEATS = [1, 2, 3, 5, 6, 10];
// current content (updated from the API by the reader component)
let PAGES = [];
let AYAHS = [];
let LANGS = {};
function setContent(pages, settings) {
  PAGES = pages;
  AYAHS = pages.flatMap((p) => p.blocks.filter((b) => b.t === "ayah").map((b) => ({ ...b, page: p.page, juz: p.juz })));
  LANGS = Object.fromEntries(((settings && settings.languages) || []).map((l) => [l.code, l.name]));
}
const key = (s, a) => `${s}:${a}`;
const strip = (t) => (t || "").replace(/[ً-ٰٟۖ-ۭـ]/g, "").replace(/[ٱأإآ]/g, "ا").replace(/ى/g, "ي");
const pad = (n) => String(n).padStart(2, "0");
const hms = (s) => `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(Math.floor(s % 60))}`;
const ms = (s) => `${pad(Math.floor(s / 60))}:${pad(Math.floor(s % 60))}`;

function loadPrefs() {
  const base = {
    order: DEFAULT_ORDER, showTr: false, font: 1, scrollMin: 60, showProgress: true, quickAction: true,
    bookmarks: [], reading: null, speed: 1.1, repeat: 1, reciter: "Yasser-Al-Dosari",
  };
  try {
    const p = JSON.parse(localStorage.getItem(PREF_KEY) || "null");
    if (p) {
      const order = Array.isArray(p.order) ? p.order.filter((x) => ACTION_LABEL[x]) : DEFAULT_ORDER;
      DEFAULT_ORDER.forEach((x) => { if (!order.includes(x)) order.push(x); });
      return { ...base, ...p, order };
    }
  } catch (e) {}
  return base;
}

function useIsDesktop() {
  const [d, setD] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 900px)");
    const on = () => setD(mq.matches);
    on();
    mq.addEventListener ? mq.addEventListener("change", on) : mq.addListener(on);
    return () => (mq.removeEventListener ? mq.removeEventListener("change", on) : mq.removeListener(on));
  }, []);
  return d;
}

/* ===================================================================== */
export default function QuranReader() {
  const router = useRouter();
  const content = useQuranContent();
  setContent(content.pages, content.settings);
  const isDesk = useIsDesktop();
  const [prefs, setPrefs] = useState(null);
  const [chrome, setChrome] = useState(true);
  const [sel, setSel] = useState(null);           // {s,a,x,y} tapped ayah + popup position
  const [menu, setMenu] = useState(false);
  const [screen, setScreen] = useState(null);     // index | customize | bookmarks | search
  const [indexTab, setIndexTab] = useState("juz");
  const [hifz, setHifz] = useState(false);
  const [revealed, setRevealed] = useState({});
  const [toast, setToast] = useState("");
  const [dialog, setDialog] = useState(null);
  const [view, setView] = useState({ page: 1, juz: 1, s: 1 });
  const [auto, setAuto] = useState({ on: false, playing: false, secs: 0 });
  const [audio, setAudio] = useState({ on: false, playing: false, idx: 0, cur: 0, dur: 0 });
  const toastT = useRef(null);
  const audioEl = useRef(null);
  const repeatLeft = useRef(1);
  const prefsRef = useRef(null);
  const idxRef = useRef(0);
  prefsRef.current = prefs;

  useEffect(() => { setPrefs(loadPrefs()); }, []);
  const save = useCallback((patch) => {
    setPrefs((p) => {
      const n = { ...p, ...(typeof patch === "function" ? patch(p) : patch) };
      try { localStorage.setItem(PREF_KEY, JSON.stringify(n)); } catch (e) {}
      return n;
    });
  }, []);
  const showToast = (t) => {
    setToast(t);
    clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(""), 2400);
  };

  /* ---------- track current page / surah in view ---------- */
  useEffect(() => {
    if (!prefs) return;
    const els = [...document.querySelectorAll("[data-ayah]")];
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (!vis) return;
        const [s, a] = vis.target.dataset.ayah.split(":").map(Number);
        const ay = AYAHS.find((x) => x.s === s && x.a === a);
        if (ay) {
          setView({ page: ay.page, juz: ay.juz, s });
          save({ lastPos: { s, a } });
        }
      },
      { rootMargin: "-90px 0px -55% 0px" }
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!prefs, prefs?.showTr, isDesk, content.updatedAt]);

  /* ---------- navigation ---------- */
  const scrollToEl = (el) => {
    if (!el) return false;
    const y = el.getBoundingClientRect().top + window.scrollY - (isDesk ? 150 : 110);
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    return true;
  };
  const goTo = ({ s, a, page, juz }) => {
    setScreen(null);
    setMenu(false);
    let el = null;
    if (s) el = document.querySelector(`[data-ayah="${key(s, a || 1)}"]`) || document.querySelector(`[data-surah="${s}"]`);
    else if (page) el = document.querySelector(`[data-page="${page}"]`);
    else if (juz) el = document.querySelector(`[data-juz-start="${juz}"]`);
    setTimeout(() => { if (!scrollToEl(el)) showToast("This part has not been added yet"); }, 60);
  };

  /* ---------- audio ---------- */
  const stopAudio = () => {
    const el = audioEl.current;
    if (el) { el.pause(); el.src = ""; }
    setAudio({ on: false, playing: false, idx: 0, cur: 0, dur: 0 });
  };
  const playIdx = (idx) => {
    idxRef.current = idx;
    const ay = AYAHS[idx];
    if (!ay) { stopAudio(); return; }
    if (!ay.audio) {
      setAudio({ on: true, playing: false, idx, cur: 0, dur: 0 });
      showToast("Recitation audio has not been added yet");
      return;
    }
    const el = audioEl.current;
    el.src = ay.audio;
    el.playbackRate = prefsRef.current.speed;
    el.play().then(() => setAudio((x) => ({ ...x, on: true, playing: true, idx }))).catch(() => showToast("Could not play audio"));
    setAudio((x) => ({ ...x, on: true, idx }));
    scrollToEl(document.querySelector(`[data-ayah="${key(ay.s, ay.a)}"]`));
  };
  const startAudioAt = (s, a) => {
    const i = Math.max(0, AYAHS.findIndex((x) => x.s === s && x.a === a));
    repeatLeft.current = prefs.repeat;
    setSel(null);
    playIdx(i);
  };
  useEffect(() => {
    const el = audioEl.current;
    if (!el) return;
    const t = () => setAudio((x) => ({ ...x, cur: el.currentTime || 0, dur: el.duration || 0 }));
    const end = () => {
      repeatLeft.current -= 1;
      if (repeatLeft.current > 0) { el.currentTime = 0; el.play(); return; }
      repeatLeft.current = prefsRef.current ? prefsRef.current.repeat : 1;
      playIdx(idxRef.current + 1);
    };
    el.addEventListener("timeupdate", t);
    el.addEventListener("ended", end);
    return () => { el.removeEventListener("timeupdate", t); el.removeEventListener("ended", end); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!prefs]);
  const togglePlay = () => {
    const el = audioEl.current;
    if (!audio.on) { const p = prefs.lastPos || { s: 1, a: 1 }; startAudioAt(p.s, p.a); return; }
    if (!el.src || !AYAHS[audio.idx]?.audio) { playIdx(audio.idx); return; }
    if (el.paused) { el.play(); setAudio((x) => ({ ...x, playing: true })); }
    else { el.pause(); setAudio((x) => ({ ...x, playing: false })); }
  };

  /* ---------- autoscroll ---------- */
  useEffect(() => {
    if (!auto.on || !auto.playing || !prefs) return;
    let raf, last = performance.now(), acc = 0, secAcc = 0;
    const page = document.querySelector("[data-page]");
    const pageH = page ? page.offsetHeight : 900;
    const pxPerSec = (20 * pageH) / (prefs.scrollMin * 60); // ~20 pages per para
    const step = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      acc += pxPerSec * dt;
      if (acc >= 1) { const n = Math.floor(acc); acc -= n; window.scrollBy(0, n); }
      secAcc += dt;
      if (secAcc >= 1) { secAcc -= 1; setAuto((a) => ({ ...a, secs: a.secs + 1 })); }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        setAuto((a) => ({ ...a, playing: false }));
        showToast("Reached the end of the added pages");
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto.on, auto.playing, prefs?.scrollMin]);

  /* ---------- actions ---------- */
  const addBookmark = (s, a) => {
    if (prefs.bookmarks.some((b) => b.s === s && b.a === a)) { showToast("Already bookmarked"); return; }
    save((p) => ({ bookmarks: [{ s, a, at: Date.now() }, ...p.bookmarks] }));
    showToast(`Bookmarked ${surah(s).en} ${s}:${a}`);
  };
  const setReading = (s, a) => { save({ reading: { s, a, at: Date.now() } }); showToast("Reading bookmark saved"); };
  const shareText = async (text) => {
    try { if (navigator.share) { await navigator.share({ text }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
    try { await navigator.clipboard.writeText(text); showToast("Copied"); } catch (e) { showToast("Sharing is not available here"); }
  };
  const ayahShare = (s, a) => {
    const ay = AYAHS.find((x) => x.s === s && x.a === a);
    if (ay) shareText(`${ay.text}\n(${surah(s).en} ${s}:${a})`);
  };
  const hasTr = AYAHS.some((a) => a.tr && Object.values(a.tr).some(Boolean));

  const run = (id) => {
    setMenu(false);
    const pos = prefs.lastPos || { s: 1, a: 1 };
    switch (id) {
      case "play": togglePlay(); break;
      case "bookmarks": setScreen("bookmarks"); break;
      case "autoscroll": setAuto({ on: true, playing: true, secs: 0 }); setChrome(true); break;
      case "share": ayahShare(pos.s, pos.a); break;
      case "translations":
        if (!hasTr) { showToast("Translations have not been added yet"); break; }
        save((p) => ({ showTr: !p.showTr }));
        break;
      case "hifz": setHifz((h) => !h); setRevealed({}); showToast(hifz ? "Hifz mode off" : "Hifz mode: tap an ayah to reveal it"); break;
      case "search": setScreen("search"); break;
      case "goto": setIndexTab("juz"); setScreen("index"); break;
      case "addbookmark": addBookmark(pos.s, pos.a); break;
      case "readingbookmark":
        if (prefs.reading) goTo(prefs.reading); else showToast("No reading bookmark yet");
        break;
      case "customize": setScreen("customize"); break;
      case "exit": history.length > 1 ? router.back() : router.push("/"); break;
      default: showToast(`${ACTION_LABEL[id]} — coming soon`);
    }
  };

  if (!prefs) return <div className="qr-root" />;

  const toolbar = prefs.order.slice(0, TOOLBAR_SLOTS);
  const moreItems = [...prefs.order.slice(TOOLBAR_SLOTS)].reverse();
  const curS = surah(view.s);
  const playingKey = audio.on && AYAHS[audio.idx] ? key(AYAHS[audio.idx].s, AYAHS[audio.idx].a) : null;
  const fontVar = { "--fs": prefs.font };

  const onPageClick = (e) => {
    const ayEl = e.target.closest("[data-ayah]");
    if (ayEl) {
      const [s, a] = ayEl.dataset.ayah.split(":").map(Number);
      if (hifz && !revealed[key(s, a)]) { setRevealed((r) => ({ ...r, [key(s, a)]: true })); return; }
      const r = (e.target.closest(".qr-ay") || ayEl).getBoundingClientRect();
      setSel({ s, a, x: Math.min(Math.max(e.clientX, 120), window.innerWidth - 120), y: r.bottom });
      return;
    }
    if (sel) { setSel(null); return; }
    if (!isDesk && !auto.on && !audio.on) setChrome((c) => !c);
  };

  const ctx = {
    prefs, save, goTo, run, setScreen, indexTab, setIndexTab, showToast, addBookmark, setReading, ayahShare,
    startAudioAt, setSel, sel, hifz, revealed, playingKey, AYAHS,
  };

  const pagesEl = (
    <div className="qr-pages" style={fontVar} onClick={onPageClick}>
      {PAGES.map((p, i) => (
        <MushafPage key={p.page} page={p} first={i === 0 || PAGES[i - 1].juz !== p.juz} ctx={ctx} />
      ))}
      <div className="qr-end">
        <p>More pages will appear here as they are added from the admin panel.</p>
      </div>
    </div>
  );

  return (
    <div className={`qr-root${isDesk ? " desk" : ""}${chrome ? "" : " immersive"}`}>
      <audio ref={audioEl} preload="none" />

      {isDesk ? (
        <DesktopLayout ctx={ctx} view={view} curS={curS} pagesEl={pagesEl} auto={auto} setAuto={setAuto} audio={audio} hifz={hifz} />
      ) : (
        <>
          <MobileHeader view={view} curS={curS} chrome={chrome} onBack={() => run("exit")}
            onJuz={() => { setIndexTab("juz"); setScreen("index"); }} onSura={() => { setIndexTab("sura"); setScreen("index"); }} />
          {pagesEl}
          {chrome && !auto.on && !audio.on && (
            <nav className="qr-toolbar">
              {toolbar.map((id) => (
                <button key={id} className={(id === "hifz" && hifz) || (id === "translations" && prefs.showTr) ? "on" : ""} onClick={() => run(id)}>
                  <span className="i">{Ico[id]()}</span>
                  <span className="l">{SHORT_LABEL[id] || ACTION_LABEL[id]}</span>
                </button>
              ))}
              <button onClick={() => setMenu((m) => !m)} className={menu ? "on" : ""}>
                <span className="i">{Ico.more()}</span><span className="l">More</span>
              </button>
            </nav>
          )}
        </>
      )}

      {menu && (
        <div className="qr-menu-bg" onClick={() => setMenu(false)}>
          <div className="qr-menu" onClick={(e) => e.stopPropagation()}>
            {moreItems.map((id) => (
              <button key={id} onClick={() => run(id)}><span className="i">{Ico[id]()}</span>{ACTION_LABEL[id]}</button>
            ))}
            <button onClick={() => run("exit")}><span className="i">{Ico.exit()}</span>Exit</button>
          </div>
        </div>
      )}

      {sel && <AyahPopup ctx={ctx} />}

      {auto.on && <AutoBar prefs={prefs} save={save} auto={auto} setAuto={setAuto} onOptions={() => setDialog("autoopts")} />}
      {auto.on && prefs.showProgress && <div className="qr-progress">Progress: {hms(auto.secs)}</div>}

      {audio.on && (
        <AudioBar reciter={content.settings?.reciter || prefs.reciter} prefs={prefs} save={save} audio={audio} onToggle={togglePlay} onClose={stopAudio}
          onStar={() => { const ay = AYAHS[audio.idx]; ay && addBookmark(ay.s, ay.a); }}
          onTr={() => run("translations")} audioEl={audioEl} repeatLeft={repeatLeft} />
      )}

      {screen && (
        <div className={isDesk ? "qr-modal" : "qr-screen-wrap"} onClick={isDesk ? () => setScreen(null) : undefined}>
          <div className="qr-screen" onClick={(e) => e.stopPropagation()}>
            {screen === "index" && <IndexScreen ctx={ctx} />}
            {screen === "customize" && <CustomizeScreen ctx={ctx} />}
            {screen === "bookmarks" && <BookmarksScreen ctx={ctx} />}
            {screen === "search" && <SearchScreen ctx={ctx} />}
          </div>
        </div>
      )}

      {dialog === "autoopts" && (
        <div className="qr-dlg-bg" onClick={() => setDialog(null)}>
          <div className="qr-dlg" onClick={(e) => e.stopPropagation()}>
            <h4>AUTO SCROLL OPTIONS</h4>
            <button onClick={() => save((p) => ({ showProgress: !p.showProgress }))}>SHOW PROGRESS {prefs.showProgress ? "✓" : ""}</button>
            <button onClick={() => save((p) => ({ quickAction: !p.quickAction }))}>&quot;AUTO SCROLL&quot; QUICK ACTION {prefs.quickAction ? "✓" : ""}</button>
            <button onClick={() => setDialog(null)}>CANCEL</button>
          </div>
        </div>
      )}

      <div className={`qr-toast${toast ? " show" : ""}`} role="status">{toast}</div>
    </div>
  );
}

/* ===================================================================== */
function PrayerStrip() {
  const [settings] = usePrayerSettings();
  const [st, setSt] = useState(null);
  useEffect(() => {
    if (!settings) return;
    const t = () => setSt(getPrayerState(settings));
    t();
    const id = setInterval(t, 30000);
    return () => clearInterval(id);
  }, [settings]);
  if (!st) return <div className="qr-strip" />;
  const h = Math.floor(st.secondsLeft / 3600), m = Math.floor((st.secondsLeft % 3600) / 60);
  return (
    <div className="qr-strip">
      <span>{st.endsLabel} {h}h {m}m</span>
      <svg viewBox="0 0 60 14" className="mq" aria-hidden="true"><path d="M0 14h60V12H46V8h-2V5h-1v3h-2C41 4 35 2 30 0c-5 2-11 4-11 8h-2V5h-1v3h-2v4H0z" fill="currentColor" /></svg>
      <span>{st.next} {fmtTime(st.nextAt)}</span>
    </div>
  );
}

function MobileHeader({ view, curS, chrome, onBack, onJuz, onSura }) {
  if (!chrome)
    return (
      <header className="qr-head mini">
        <button className="b" onClick={onBack} aria-label="Back"><G.back /></button>
        <span onClick={onJuz}>JUZ {view.juz}</span><span>{view.page}</span><span onClick={onSura}>{curS.en.toUpperCase()}</span>
      </header>
    );
  return (
    <header className="qr-head">
      <PrayerStrip />
      <div className="qr-head-row">
        <button className="b" onClick={onBack} aria-label="Back"><G.back /></button>
        <button className="pill" onClick={onJuz}>JUZ {view.juz}</button>
        <span className="pg">{view.page}</span>
        <button className="pill" onClick={onSura}>{curS.en.toUpperCase()}</button>
      </div>
    </header>
  );
}

function MushafPage({ page, first, ctx }) {
  const { prefs, sel, hifz, revealed, playingKey } = ctx;
  // group blocks into paragraphs: surah header / bismillah / runs of ayahs
  const groups = [];
  page.blocks.forEach((b) => {
    if (b.t === "ayah" && !(b.s === 1 && b.a === 1) && !prefs.showTr) {
      const last = groups[groups.length - 1];
      if (last && last.t === "run") last.items.push(b); else groups.push({ t: "run", items: [b] });
    } else groups.push(b);
  });
  const ayahCls = (b) => {
    const k = key(b.s, b.a);
    return `qr-ay${sel && key(sel.s, sel.a) === k ? " hl" : ""}${playingKey === k ? " hl" : ""}${hifz && !revealed[k] ? " hide" : ""}`;
  };
  const Ay = ({ b }) => {
    // keep the last word and the ayah marker together so the marker never wraps alone
    const i = b.text.lastIndexOf(" ");
    const head = i > 0 ? b.text.slice(0, i) : "";
    const last = i > 0 ? b.text.slice(i + 1) : b.text;
    return (
      <span className="qr-ay-wrap" data-ayah={key(b.s, b.a)}>
        {head && <span className={ayahCls(b)}>{head} </span>}
        <span className="qr-nw"><span className={ayahCls(b)}>{last}</span>{"\u00A0"}<AyahMark n={b.a} /></span>{" "}
      </span>
    );
  };
  return (
    <section className="qr-page" data-page={page.page} {...(first ? { "data-juz-start": page.juz } : {})}>
      {groups.map((g, i) => {
        if (g.t === "surah")
          return (
            <div key={i} className="qr-surah" data-surah={g.s}>
              <span className="orn" aria-hidden="true">۞</span>
              <h2 className="ar" dir="rtl">سُورَةُ {surah(g.s).ar}</h2>
              <span className="orn" aria-hidden="true">۞</span>
            </div>
          );
        if (g.t === "bismillah")
          return <div key={i} className="qr-bism ar" dir="rtl">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>;
        if (g.t === "run")
          return (
            <p key={i} className="qr-lines ar" dir="rtl">
              {g.items.map((b) => <Ay key={key(b.s, b.a)} b={b} />)}
            </p>
          );
        // single ayah (Fatiha 1:1 centered, or translation mode)
        const tr = g.tr ? Object.entries(g.tr).filter(([, v]) => v) : [];
        return (
          <div key={i} className={`qr-single${g.s === 1 && g.a === 1 && !prefs.showTr ? " center" : ""}`}>
            <p className="qr-lines ar" dir="rtl"><Ay b={g} /></p>
            {prefs.showTr && tr.map(([lang, text]) => (
              <div key={lang} className="qr-tr"><span className="tag">{LANGS[lang] || lang}</span><p lang={lang}>{text}</p></div>
            ))}
          </div>
        );
      })}
      <div className="qr-pno">{page.page}</div>
    </section>
  );
}

function AyahPopup({ ctx }) {
  const { sel, setSel, startAudioAt, addBookmark, setReading, ayahShare, AYAHS } = ctx;
  const ay = AYAHS.find((x) => x.s === sel.s && x.a === sel.a);
  const tr = ay?.tr ? Object.entries(ay.tr).filter(([, v]) => v) : [];
  const below = sel.y < window.innerHeight * 0.6;
  const style = { left: sel.x, top: below ? sel.y + 8 : undefined, bottom: below ? undefined : window.innerHeight - sel.y + 60 };
  return (
    <div className="qr-pop" style={style} onClick={(e) => e.stopPropagation()}>
      <div className="btns">
        <button title="Play from here" onClick={() => startAudioAt(sel.s, sel.a)}>{Ico.play()}</button>
        <button title="Add bookmark" onClick={() => { addBookmark(sel.s, sel.a); setSel(null); }}>{Ico.addbookmark()}</button>
        <button title="Reading bookmark" onClick={() => { setReading(sel.s, sel.a); setSel(null); }}>{Ico.readingbookmark()}</button>
        <button title="Share" onClick={() => ayahShare(sel.s, sel.a)}>{Ico.share()}</button>
        <button title="Close" className="c" onClick={() => setSel(null)}><G.chevU /></button>
      </div>
      <div className="ref">{surah(sel.s).en} {sel.s}:{sel.a}</div>
      {tr.length ? tr.map(([l, t]) => <p key={l} className="t" lang={l}>{t}</p>) : <p className="t muted">Translation has not been added yet.</p>}
    </div>
  );
}

function AutoBar({ prefs, save, auto, setAuto, onOptions }) {
  const press = useRef(null);
  return (
    <div className="qr-autobar">
      <button className="pp" aria-label={auto.playing ? "Pause" : "Play"}
        onPointerDown={() => { press.current = setTimeout(() => { press.current = "long"; onOptions(); }, 600); }}
        onPointerUp={() => { if (press.current !== "long") { clearTimeout(press.current); setAuto((a) => ({ ...a, playing: !a.playing })); } press.current = null; }}
        onContextMenu={(e) => { e.preventDefault(); onOptions(); }}>
        {auto.playing ? <G.pause /> : <G.playT />}
      </button>
      <div className="pm">
        <button aria-label="Slower" onClick={() => save((p) => ({ scrollMin: Math.min(240, p.scrollMin + 1) }))}><G.minus /></button>
        <span />
        <button aria-label="Faster" onClick={() => save((p) => ({ scrollMin: Math.max(5, p.scrollMin - 1) }))}><G.plus /></button>
      </div>
      <button className="rate" onClick={onOptions}>{prefs.scrollMin} min/para</button>
      <button className="x" aria-label="Stop autoscroll" onClick={() => setAuto({ on: false, playing: false, secs: 0 })}><G.x /></button>
    </div>
  );
}

function AudioBar({ reciter, prefs, save, audio, onToggle, onClose, onStar, onTr, audioEl, repeatLeft }) {
  const left = Math.max(0, (audio.dur || 0) - (audio.cur || 0));
  const pct = audio.dur ? (audio.cur / audio.dur) * 100 : 0;
  return (
    <div className="qr-audiobar">
      <div className="top">
        <button aria-label="Recitation settings"><G.gear /></button>
        <span className="name">{reciter}</span>
        <button aria-label="Close player" onClick={onClose}><G.xc /></button>
      </div>
      <div className="seek">
        <span>{ms(audio.cur)}</span>
        <input type="range" min="0" max={audio.dur || 1} step="0.1" value={audio.cur || 0} style={{ "--p": `${pct}%` }}
          onChange={(e) => { if (audioEl.current) audioEl.current.currentTime = +e.target.value; }} />
        <span>-{ms(left)}</span>
      </div>
      <div className="ctl">
        <button aria-label="Bookmark ayah" onClick={onStar} className="star"><G.star /></button>
        <button aria-label="Translation" onClick={onTr}><G.trans /></button>
        <button aria-label={audio.playing ? "Pause" : "Play"} className="main" onClick={onToggle}>{audio.playing ? <G.pause /> : <G.playT />}</button>
        <button className="spd" onClick={() => {
          const n = SPEEDS[(SPEEDS.indexOf(prefs.speed) + 1) % SPEEDS.length];
          save({ speed: n });
          if (audioEl.current) audioEl.current.playbackRate = n;
        }}>{prefs.speed}x</button>
        <button aria-label="Repeat each ayah" className="rep" onClick={() => {
          const n = REPEATS[(REPEATS.indexOf(prefs.repeat) + 1) % REPEATS.length];
          save({ repeat: n });
          repeatLeft.current = n;
        }}><G.repeat /><i>{prefs.repeat}</i></button>
      </div>
    </div>
  );
}

/* ===================================================================== */
/* Screens                                                                */
function ScreenHead({ title, onBack, right, children }) {
  return (
    <div className="qs-head">
      <button className="b" onClick={onBack} aria-label="Back"><G.back /></button>
      <span className="sep" />
      {children || <h1>{title}</h1>}
      {right}
    </div>
  );
}

function IndexScreen({ ctx }) {
  const { indexTab, setIndexTab, setScreen, goTo, showToast } = ctx;
  const [open, setOpen] = useState(1);
  const [pg, setPg] = useState("");
  const [gs, setGs] = useState("");
  const [ga, setGa] = useState("");
  const juzHas = (j) => PAGES.some((p) => p.juz === j);
  return (
    <div className="qs">
      <ScreenHead onBack={() => setScreen(null)}>
        <button className="mic" aria-label="Search" onClick={() => setScreen("search")}><G.mic /></button>
        <div className="tabs">
          {[["juz", "JUZ"], ["sura", "SURA"], ["goto", "GO TO"]].map(([k, l]) => (
            <button key={k} className={indexTab === k ? "on" : ""} onClick={() => setIndexTab(k)}>{l}</button>
          ))}
        </div>
      </ScreenHead>
      <div className="qs-body">
        {indexTab === "juz" && JUZ_NAMES.map((name, i) => {
          const j = i + 1, isOpen = open === j;
          return (
            <div key={j} className={`qs-juz${isOpen ? " open" : ""}`}>
              <button className="h" onClick={() => setOpen(isOpen ? 0 : j)}>
                <span>Juz {j}</span><span className="ar" dir="rtl">{name}</span>{isOpen ? <G.chevU /> : <G.chevD />}
              </button>
              {isOpen && (
                <div className="hz">
                  {[2 * j - 1, 2 * j].map((h) => (
                    <div key={h} className="row">
                      {[`Hizb ${h}`, "1/4 Hizb", "1/2 Hizb", "3/4 Hizb"].map((l) => (
                        <button key={l} onClick={() => (juzHas(j) ? goTo({ juz: j }) : showToast("This part has not been added yet"))}>{l}</button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {indexTab === "sura" && SURAHS.map((s) => (
          <button key={s.n} className="qs-sura" onClick={() => goTo({ s: s.n, a: 1 })}>
            <span>{s.n} {s.en}</span><span className="ar" dir="rtl">{s.ar}</span>
          </button>
        ))}
        {indexTab === "goto" && (
          <div className="qs-goto">
            <label>Page number</label>
            <div className="r">
              <input inputMode="numeric" placeholder="1 – 604" value={pg} onChange={(e) => setPg(e.target.value.replace(/\D/g, ""))} />
              <button onClick={() => pg && goTo({ page: +pg })}>GO</button>
            </div>
            <label>Surah and ayah</label>
            <div className="r">
              <select value={gs} onChange={(e) => setGs(e.target.value)}>
                <option value="">Surah</option>
                {SURAHS.map((s) => <option key={s.n} value={s.n}>{s.n}. {s.en}</option>)}
              </select>
              <input inputMode="numeric" placeholder="Ayah" value={ga} onChange={(e) => setGa(e.target.value.replace(/\D/g, ""))} />
              <button onClick={() => {
                if (!gs) return;
                const max = surah(+gs).ayahs;
                const a = Math.min(Math.max(1, +ga || 1), max);
                goTo({ s: +gs, a });
              }}>GO</button>
            </div>
            <label>Juz</label>
            <div className="r">
              <select onChange={(e) => e.target.value && goTo({ juz: +e.target.value })} defaultValue="">
                <option value="">Select Juz</option>
                {JUZ_NAMES.map((n, i) => <option key={i} value={i + 1}>Juz {i + 1}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CustomizeScreen({ ctx }) {
  const { prefs, save, setScreen } = ctx;
  const [order, setOrder] = useState(prefs.order);
  const drag = useRef(null);
  const rowH = 62;
  useEffect(() => { save({ order }); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [order]);
  const down = (e, i) => {
    e.preventDefault();
    drag.current = { y: e.clientY, i };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const move = (e) => {
    const d = drag.current;
    if (!d) return;
    const to = Math.max(0, Math.min(order.length - 1, d.i + Math.round((e.clientY - d.y) / rowH)));
    if (to !== d.i) {
      setOrder((o) => { const n = [...o]; const [x] = n.splice(d.i, 1); n.splice(to, 0, x); return n; });
      drag.current = { y: d.y + (to - d.i) * rowH, i: to };
    }
  };
  const up = () => (drag.current = null);
  return (
    <div className="qs">
      <ScreenHead title="Customize" onBack={() => setScreen(null)}
        right={<button className="qs-default" onClick={() => setOrder(DEFAULT_ORDER)}>DEFAULT</button>} />
      <p className="qs-hint">Drag ☰ to reorder. The first {TOOLBAR_SLOTS} appear on the bottom bar, the rest in More.</p>
      <div className="qs-body flush">
        {order.map((id, i) => (
          <div key={id} className={`qs-cust${drag.current?.i === i ? " drag" : ""}${i === TOOLBAR_SLOTS ? " split" : ""}`}>
            <span className="i">{Ico[id]()}</span>
            <span className="l">{ACTION_LABEL[id]}</span>
            <span className="hd" onPointerDown={(e) => down(e, i)} onPointerMove={move} onPointerUp={up} onPointerCancel={up}><G.handle /></span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BookmarksScreen({ ctx }) {
  const { prefs, save, setScreen, goTo } = ctx;
  return (
    <div className="qs">
      <ScreenHead title="Bookmarks" onBack={() => setScreen(null)} />
      <div className="qs-body">
        {prefs.reading && (
          <button className="qs-bm reading" onClick={() => goTo(prefs.reading)}>
            <span className="i">{Ico.readingbookmark()}</span>
            <span className="t"><b>Reading bookmark</b><small>{surah(prefs.reading.s).en} {prefs.reading.s}:{prefs.reading.a}</small></span>
          </button>
        )}
        {!prefs.bookmarks.length && <p className="qs-empty">No bookmarks yet. Tap an ayah and press the star to add one.</p>}
        {prefs.bookmarks.map((b) => (
          <div key={key(b.s, b.a)} className="qs-bm">
            <button className="go" onClick={() => goTo(b)}>
              <span className="i">{Ico.bookmarks()}</span>
              <span className="t"><b>{surah(b.s).en} <span className="ar">{surah(b.s).ar}</span></b><small>Ayah {b.a} · {new Date(b.at).toLocaleDateString()}</small></span>
            </button>
            <button className="del" aria-label="Delete bookmark" onClick={() => save((p) => ({ bookmarks: p.bookmarks.filter((x) => !(x.s === b.s && x.a === b.a)) }))}><G.trash /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SearchScreen({ ctx }) {
  const { setScreen, goTo } = ctx;
  const [q, setQ] = useState("");
  const term = q.trim();
  const sur = term ? SURAHS.filter((s) => s.en.toLowerCase().includes(term.toLowerCase()) || strip(s.ar).includes(strip(term)) || String(s.n) === term) : [];
  const ays = term.length > 1 ? AYAHS.filter((a) => strip(a.text).includes(strip(term)) || Object.values(a.tr || {}).some((t) => (t || "").toLowerCase().includes(term.toLowerCase()))) : [];
  return (
    <div className="qs">
      <ScreenHead title="Search" onBack={() => setScreen(null)} />
      <div className="qs-search"><input autoFocus placeholder="Search surah or ayah text" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="qs-body">
        {sur.length > 0 && <div className="qs-cap">SURAHS</div>}
        {sur.slice(0, 20).map((s) => (
          <button key={s.n} className="qs-sura" onClick={() => goTo({ s: s.n, a: 1 })}><span>{s.n} {s.en}</span><span className="ar" dir="rtl">{s.ar}</span></button>
        ))}
        {ays.length > 0 && <div className="qs-cap">AYAHS ({ays.length})</div>}
        {ays.map((a) => (
          <button key={key(a.s, a.a)} className="qs-res" onClick={() => goTo(a)}>
            <span className="ar" dir="rtl">{a.text}</span><small>{surah(a.s).en} {a.s}:{a.a}</small>
          </button>
        ))}
        {term && !sur.length && !ays.length && <p className="qs-empty">No results in the pages added so far.</p>}
      </div>
    </div>
  );
}

/* ===================================================================== */
/* Desktop                                                                */
function DesktopLayout({ ctx, view, curS, pagesEl, auto, setAuto, audio, hifz }) {
  const { prefs, save, run, goTo } = ctx;
  const [tab, setTab] = useState("sura");
  const [q, setQ] = useState("");
  const list = SURAHS.filter((s) => !q || s.en.toLowerCase().includes(q.toLowerCase()) || strip(s.ar).includes(strip(q)) || String(s.n) === q);
  const added = new Set(AYAHS.map((a) => a.s));
  const Btn = ({ id, label, on }) => (
    <button className={`qd-act${on ? " on" : ""}`} onClick={() => run(id)} title={label}><span className="i">{Ico[id]()}</span>{label}</button>
  );
  return (
    <div className="qd">
      <DesktopNav active="Read Quran" />
      <div className="qd-grid">
        <aside className="qd-side">
          <div className="qd-tabs">
            <button className={tab === "sura" ? "on" : ""} onClick={() => setTab("sura")}>Surah</button>
            <button className={tab === "juz" ? "on" : ""} onClick={() => setTab("juz")}>Juz</button>
          </div>
          {tab === "sura" && <input className="qd-search" placeholder="Search surah…" value={q} onChange={(e) => setQ(e.target.value)} />}
          <div className="qd-list">
            {tab === "sura"
              ? list.map((s) => (
                  <button key={s.n} className={`qd-item${view.s === s.n ? " cur" : ""}${added.has(s.n) ? "" : " na"}`} onClick={() => goTo({ s: s.n, a: 1 })}>
                    <span className="n"><b>{s.n}</b></span>
                    <span className="t"><b>{s.en}</b><small>{s.ayahs} Ayahs{added.has(s.n) ? "" : " · not added yet"}</small></span>
                    <span className="ar" dir="rtl">{s.ar}</span>
                  </button>
                ))
              : JUZ_NAMES.map((n, i) => (
                  <button key={i} className={`qd-item${view.juz === i + 1 ? " cur" : ""}${PAGES.some((p) => p.juz === i + 1) ? "" : " na"}`} onClick={() => goTo({ juz: i + 1 })}>
                    <span className="n"><b>{i + 1}</b></span>
                    <span className="t"><b>Juz {i + 1}</b></span>
                    <span className="ar" dir="rtl">{n}</span>
                  </button>
                ))}
          </div>
        </aside>

        <main className="qd-main">
          <div className="qd-bar">
            <div className="qd-title">
              <b>{curS.en}</b> <span className="ar" dir="rtl">{curS.ar}</span>
              <small>Juz {view.juz} · Page {view.page}</small>
            </div>
            <div className="qd-acts">
              <Btn id="play" label={audio.on ? "Player" : "Play"} on={audio.on} />
              <Btn id="autoscroll" label="Autoscroll" on={auto.on} />
              <Btn id="translations" label="Translation" on={prefs.showTr} />
              <Btn id="hifz" label="Hifz" on={hifz} />
              <Btn id="bookmarks" label="Bookmarks" />
              <Btn id="search" label="Search" />
              <Btn id="goto" label="Go to" />
              <div className="qd-font">
                <button aria-label="Smaller text" onClick={() => save((p) => ({ font: Math.max(0.7, +(p.font - 0.1).toFixed(2)) }))}>A−</button>
                <button aria-label="Larger text" onClick={() => save((p) => ({ font: Math.min(1.6, +(p.font + 0.1).toFixed(2)) }))}>A+</button>
              </div>
            </div>
          </div>
          <div className="qd-book">{pagesEl}</div>
        </main>
      </div>
    </div>
  );
}
