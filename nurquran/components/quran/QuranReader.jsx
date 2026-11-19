"use client";

import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuranContent } from "@/lib/quran/data";
import { SURAHS, JUZ_NAMES, surah } from "@/lib/quran/meta";
import {
  FONTS, fontInfo, TOTAL_PAGES, ALL_AYAHS, supportsColorFont, addStaticFonts, loadPageFont, pageFontFamily,
  loadIndex, loadPage, loadSearch, pageOfAyah, surahOfPage, juzOfPage,
} from "@/lib/quran/mushaf";
import { Ico, ACTION_LABEL, SHORT_LABEL, DEFAULT_ORDER, G } from "./QIcons";
import SettingsScreen from "./SettingsScreen";
import { usePrefs, sizeScale } from "@/lib/quran/prefs";
import { RECITERS, reciter as reciterInfo, ayahAudioUrl, effectiveReciter } from "@/lib/quran/reciters";
import { useSiteConfig } from "@/lib/siteImages";
import { usePrayerSettings } from "@/lib/prayerStore";
import { getPrayerState, fmtTime } from "@/lib/prayerEngine";
import DesktopNav from "@/components/DesktopNav";

const TOOLBAR_SLOTS = 6;
const SPEEDS = [0.75, 1, 1.1, 1.25, 1.5];
const REPEATS = [1, 2, 3, 5, 6, 10];
const PAGE_NUMS = Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1);
const AYAHS = ALL_AYAHS;
// translations / audio added from the admin panel (API), by "s:a"
let EXTRA = {};
let LANGS = {};
function setExtra(pages, settings) {
  EXTRA = {};
  (pages || []).forEach((p) => p.blocks.forEach((b) => { if (b.t === "ayah") EXTRA[`${b.s}:${b.a}`] = { tr: b.tr, audio: b.audio }; }));
  LANGS = Object.fromEntries(((settings && settings.languages) || []).map((l) => [l.code, l.name]));
}
const key = (s, a) => `${s}:${a}`;
const strip = (t) => (t || "").replace(/[ً-ٰٟۖ-ۭـ]/g, "").replace(/[ٱأإآ]/g, "ا").replace(/ى/g, "ي");
const pad = (n) => String(n).padStart(2, "0");
const hms = (s) => `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(Math.floor(s % 60))}`;
const ms = (s) => `${pad(Math.floor(s / 60))}:${pad(Math.floor(s % 60))}`;
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
function useDarkSystem() {
  const [d, setD] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const on = () => setD(mq.matches);
    on();
    mq.addEventListener ? mq.addEventListener("change", on) : mq.addListener(on);
    return () => (mq.removeEventListener ? mq.removeEventListener("change", on) : mq.removeListener(on));
  }, []);
  return d;
}

// keep the screen on while reading (needs https; silently does nothing on http)
function useWakeLock(on) {
  useEffect(() => {
    if (!on || typeof navigator === "undefined" || !navigator.wakeLock) return;
    let lock = null, stop = false;
    const get = async () => { try { if (document.visibilityState === "visible") lock = await navigator.wakeLock.request("screen"); } catch (e) {} };
    const vis = () => { if (!stop && document.visibilityState === "visible") get(); };
    get();
    document.addEventListener("visibilitychange", vis);
    return () => { stop = true; document.removeEventListener("visibilitychange", vis); try { lock && lock.release(); } catch (e) {} };
  }, [on]);
}

/* ===================================================================== */
export default function QuranReader() {
  const router = useRouter();
  const content = useQuranContent();
  setExtra(content.pages, content.settings);
  const isDesk = useIsDesktop();
  const sysDark = useDarkSystem();
  const [index, setIndex] = useState(null);
  const [prefs, save] = usePrefs();
  const [colorOk, setColorOk] = useState(true);
  const [chrome, setChrome] = useState(true);
  const [sel, setSel] = useState(null);           // {s,a,x,y} tapped ayah + popup position
  const [menu, setMenu] = useState(false);
  const [screen, setScreen] = useState(null);     // index | customize | bookmarks | search | settings
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
  const site = useSiteConfig();
  const reciterRef = useRef(null);
  const idxRef = useRef(0);
  const resumed = useRef(false);
  prefsRef.current = prefs;
  const reciterId = prefs ? effectiveReciter(prefs, site.reciters) : null;
  reciterRef.current = reciterId;

  useEffect(() => {
    setColorOk(supportsColorFont());
    addStaticFonts();
    loadIndex().then(setIndex).catch(() => setToast("Could not load the Quran. Check your connection."));
  }, []);
  const showToast = (t) => {
    setToast(t);
    clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(""), 2400);
  };
  useWakeLock(!!(prefs && prefs.screenOn));

  // which font is really drawn: colour tajweed falls back to Uthmanic where colour fonts are not supported
  const font = prefs ? (prefs.qfont === "tajweed" && !colorOk ? "uthmanic" : prefs.qfont) : "indopak";
  const layout = fontInfo(font).layout;
  const lines15 = !!(prefs && prefs.lines15 && !prefs.showTr);

  /* ---------- track current page in view ---------- */
  useEffect(() => {
    if (!prefs || !index) return;
    const els = [...document.querySelectorAll("section[data-page]")];
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (!vis) return;
        const p = Number(vis.target.dataset.page);
        const fk = vis.target.querySelector("[data-k]");
        if (fk) { const [s, a] = fk.dataset.k.split(":").map(Number); firstKeyRef.current = { s, a }; }
        setView({ page: p, juz: juzOfPage(index, layout, p), s: surahOfPage(index, layout, p) });
        if (resumed.current) save({ lastPos: { page: p, layout } });
      },
      { rootMargin: "-100px 0px -70% 0px" }
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!prefs, !!index, layout, isDesk]);

  /* ---------- navigation ---------- */
  const scrollToEl = (el, smooth = true) => {
    if (!el) return false;
    const y = el.getBoundingClientRect().top + window.scrollY - (isDesk ? 150 : 110);
    window.scrollTo({ top: Math.max(0, y), behavior: smooth ? "smooth" : "auto" });
    return true;
  };
  // Jump to an element that may still be loading. Pages above it load and change height while we
  // arrive, so keep re-aligning for a moment (stops as soon as the reader scrolls by hand).
  const jumpT = useRef(null);
  const settle = (find, smooth) => {
    clearInterval(jumpT.current);
    let n = 0, ok = 0, lastY = null;
    const stopOnTouch = () => { clearInterval(jumpT.current); off(); };
    const off = () => { window.removeEventListener("wheel", stopOnTouch); window.removeEventListener("touchstart", stopOnTouch); };
    window.addEventListener("wheel", stopOnTouch, { passive: true });
    window.addEventListener("touchstart", stopOnTouch, { passive: true });
    jumpT.current = setInterval(() => {
      n++;
      const el = find();
      if (el) {
        const want = isDesk ? 150 : 110;
        const top = el.getBoundingClientRect().top;
        if (Math.abs(top - want) > 3) { scrollToEl(el, smooth && ok === 0 && lastY === null); lastY = window.scrollY; }
        else ok++;
      }
      if (ok > 6 || n > 60) { clearInterval(jumpT.current); off(); }
    }, 80);
  };
  const scrollToPage = (p) => {
    const sec = () => document.querySelector(`section[data-page="${p}"]`);
    scrollToEl(sec(), false);
    settle(sec, false);
  };
  // scroll to a page, then (once it has loaded) to the ayah
  const scrollToAyah = (s, a, smooth) => {
    if (!index) return;
    const p = pageOfAyah(index, layout, s, a);
    scrollToEl(document.querySelector(`section[data-page="${p}"]`), false);
    settle(() => { const el = document.querySelector(`[data-k="${key(s, a)}"]`); return el ? el.closest(".ml") || el : null; }, smooth);
  };
  const goTo = ({ s, a, page, juz }) => {
    setScreen(null);
    setMenu(false);
    if (!index) return;
    if (s) { scrollToAyah(s, a || 1, false); return; }
    const p = page ? Math.min(TOTAL_PAGES, Math.max(1, page)) : index[layout].juz[(juz || 1) - 1];
    setTimeout(() => scrollToPage(p), 30);
  };
  // reopen where the reader stopped last time
  useEffect(() => {
    if (!prefs || !index || resumed.current) return;
    const lp = prefs.lastPos;
    const p = lp && lp.page ? lp.page : 1;
    if (p > 1) setTimeout(() => { scrollToPage(p); setTimeout(() => (resumed.current = true), 1500); }, 50);
    else resumed.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!prefs, !!index]);
  // keep the same place when the font (and so the page layout) changes
  const prevLayout = useRef(null);
  const firstKeyRef = useRef(null);
  useEffect(() => {
    if (!index || !prefs) return;
    if (prevLayout.current === null || prevLayout.current === layout) { prevLayout.current = layout; return; }
    prevLayout.current = layout;
    const k = firstKeyRef.current;
    if (k) scrollToAyah(k.s, k.a, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, !!index, !!prefs]);

  /* ---------- audio (ayah by ayah) ---------- */
  // src for one ayah in the chosen reciter's voice ("admin" = recordings uploaded in the admin panel)
  const srcFor = (s, a) => {
    const r = reciterRef.current;
    if (r === "admin") return EXTRA[key(s, a)]?.audio || null;
    return ayahAudioUrl(r, s, a);
  };
  const bismRef = useRef(false);       // true while the bismillah before a surah is playing
  const preloadEl = useRef(null);
  const stopAudio = () => {
    const el = audioEl.current;
    if (el) { el.pause(); el.removeAttribute("src"); el.load(); }
    bismRef.current = false;
    setAudio({ on: false, playing: false, idx: 0, cur: 0, dur: 0 });
  };
  // keep the ayah being recited on screen: scroll only when it is not already comfortably visible,
  // so the reader may scroll away and the screen comes back when the next ayah starts
  const followAyah = (s, a) => {
    const els = document.querySelectorAll(`[data-k="${key(s, a)}"]`);
    if (els.length) {
      const first = els[0].getBoundingClientRect(), last = els[els.length - 1].getBoundingClientRect();
      const top = isDesk ? 150 : 110, bottom = window.innerHeight - (isDesk ? 140 : 190);
      const tall = last.bottom - first.top > bottom - top;
      if (first.top >= top && (last.bottom <= bottom || (tall && first.top <= top + 120))) return;
    }
    scrollToAyah(s, a, true);
  };
  const playSrc = (src, idx) => {
    const el = audioEl.current;
    el.src = src;
    el.playbackRate = prefsRef.current.speed;
    el.play().then(() => setAudio((x) => ({ ...x, on: true, playing: true, idx }))).catch((e) => {
      if (e && e.name === "NotAllowedError") { setAudio((x) => ({ ...x, on: true, playing: false, idx })); return; }
      showToast("Could not play the recitation. Check your internet connection.");
      setAudio((x) => ({ ...x, playing: false }));
    });
  };
  const playIdx = (idx, withBism = true) => {
    idxRef.current = idx;
    const ay = AYAHS[idx];
    if (!ay) { stopAudio(); showToast("صَدَقَ ٱللَّهُ ٱلْعَظِيمُ — end of the Quran"); return; }
    const src = srcFor(ay.s, ay.a);
    setAudio((x) => ({ ...x, on: true, idx, cur: 0, dur: 0 }));
    followAyah(ay.s, ay.a);
    if (!src) { setAudio((x) => ({ ...x, playing: false })); showToast("No uploaded recording for this ayah. Choose a reciter in Settings."); return; }
    // a new surah (not Al-Fatiha or At-Tawbah) starts with the bismillah
    if (withBism && ay.a === 1 && ay.s !== 1 && ay.s !== 9 && prefsRef.current.bismillah && reciterRef.current !== "admin") {
      bismRef.current = true;
      playSrc(srcFor(1, 1), idx);
    } else {
      bismRef.current = false;
      playSrc(src, idx);
    }
    // fetch the next ayah in the background so it starts without a gap
    const nx = AYAHS[idx + 1];
    const nsrc = nx && srcFor(nx.s, nx.a);
    if (nsrc) {
      if (!preloadEl.current) { preloadEl.current = new Audio(); preloadEl.current.preload = "auto"; }
      preloadEl.current.src = nsrc;
    }
    if ("mediaSession" in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({ title: `${surah(ay.s).en} ${ay.s}:${ay.a}`, artist: reciterInfo(reciterRef.current).name, album: "Nur Quran" });
      } catch (e) {}
    }
  };
  const playRef = useRef(playIdx);
  playRef.current = playIdx;
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
      if (bismRef.current) {        // bismillah finished: now the ayah itself
        bismRef.current = false;
        const ay = AYAHS[idxRef.current];
        playSrc(srcFor(ay.s, ay.a), idxRef.current);
        return;
      }
      repeatLeft.current -= 1;
      if (repeatLeft.current > 0) { el.currentTime = 0; el.play(); return; }
      repeatLeft.current = prefsRef.current ? prefsRef.current.repeat : 1;
      playRef.current(idxRef.current + 1);
    };
    const err = () => { if (el.getAttribute("src")) { showToast("Could not load the recitation. Check your internet connection."); setAudio((x) => ({ ...x, playing: false })); } };
    el.addEventListener("timeupdate", t);
    el.addEventListener("ended", end);
    el.addEventListener("error", err);
    if ("mediaSession" in navigator) {
      try {
        navigator.mediaSession.setActionHandler("nexttrack", () => playRef.current(idxRef.current + 1, true));
        navigator.mediaSession.setActionHandler("previoustrack", () => playRef.current(Math.max(0, idxRef.current - 1), true));
      } catch (e) {}
    }
    return () => { el.removeEventListener("timeupdate", t); el.removeEventListener("ended", end); el.removeEventListener("error", err); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!prefs]);
  // another reciter chosen while playing: continue the same ayah in the new voice
  const lastReciter = useRef(null);
  useEffect(() => {
    if (!prefs) return;
    if (lastReciter.current && lastReciter.current !== reciterId && audio.on) playIdx(audio.idx, false);
    lastReciter.current = reciterId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reciterId]);
  const firstAyahInView = () => {
    const el = document.querySelector(`section[data-page="${view.page}"] [data-k]`);
    if (el) { const [s, a] = el.dataset.k.split(":").map(Number); return { s, a }; }
    return { s: view.s, a: 1 };
  };
  const togglePlay = () => {
    const el = audioEl.current;
    if (!audio.on) { const p = firstAyahInView(); startAudioAt(p.s, p.a); return; }
    if (!el.getAttribute("src")) { playIdx(audio.idx); return; }
    if (el.paused) { el.play(); setAudio((x) => ({ ...x, playing: true })); }
    else { el.pause(); setAudio((x) => ({ ...x, playing: false })); }
  };

  /* ---------- autoscroll ---------- */
  useEffect(() => {
    if (!auto.on || !auto.playing || !prefs) return;
    let raf, last = performance.now(), acc = 0, secAcc = 0;
    const page = document.querySelector(`section[data-page="${view.page}"]`);
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
        showToast("Reached the end of the Quran");
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
  const ayahShare = async (s, a) => {
    try {
      const all = await loadSearch();
      const row = all.find((x) => x[0] === s && x[1] === a);
      if (row) shareText(`${row[2]}\n(${surah(s).en} ${s}:${a})`);
    } catch (e) { showToast("Sharing is not available here"); }
  };
  const hasTr = Object.values(EXTRA).some((x) => x.tr && Object.values(x.tr).some(Boolean));

  const run = (id) => {
    setMenu(false);
    const pos = firstAyahInView();
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
      case "tajweed": save({ qfont: "tajweed" }); showToast(colorOk ? "Mushaf Tajweed font" : "Colour tajweed is not supported on this browser"); break;
      case "search": setScreen("search"); break;
      case "goto": setIndexTab("juz"); setScreen("index"); break;
      case "addbookmark": addBookmark(pos.s, pos.a); break;
      case "readingbookmark":
        if (prefs.reading) goTo(prefs.reading); else showToast("No reading bookmark yet");
        break;
      case "customize": setScreen("customize"); break;
      case "settings": setScreen("settings"); break;
      case "exit": history.length > 1 ? router.back() : router.push("/"); break;
      default: showToast(`${ACTION_LABEL[id]} — coming soon`);
    }
  };

  if (!prefs) return <div className="qr-root" />;

  const toolbar = prefs.order.slice(0, TOOLBAR_SLOTS);
  const moreItems = [...prefs.order.slice(TOOLBAR_SLOTS)].reverse();
  const curS = surah(view.s);
  const playingKey = audio.on && AYAHS[audio.idx] ? key(AYAHS[audio.idx].s, AYAHS[audio.idx].a) : null;
  const selKey = sel ? key(sel.s, sel.a) : null;
  const dark = prefs.appearance === "dark" || (prefs.appearance === "system" && sysDark);
  const theme = prefs.theme;

  const onPageClick = (e) => {
    const ayEl = e.target.closest("[data-k]");
    if (ayEl) {
      const [s, a] = ayEl.dataset.k.split(":").map(Number);
      if (hifz && !revealed[key(s, a)]) { setRevealed((r) => ({ ...r, [key(s, a)]: true })); return; }
      const r = ayEl.getBoundingClientRect();
      setSel({ s, a, x: Math.min(Math.max(e.clientX, 120), window.innerWidth - 120), y: r.bottom });
      return;
    }
    if (sel) { setSel(null); return; }
    if (!isDesk && !auto.on && !audio.on) setChrome((c) => !c);
  };

  const ctx = {
    prefs, save, goTo, run, setScreen, indexTab, setIndexTab, showToast, addBookmark, setReading, ayahShare,
    startAudioAt, setSel, sel, hifz, revealed, playingKey, index, layout, font, colorOk,
  };

  const mode = { font, layout, lines15, showTr: !!prefs.showTr, scale: sizeScale(prefs.size), desk: isDesk };
  const pagesEl = (
    <div className={`qr-pages f-${font}${lines15 ? " m15" : ""}${prefs.pageLines ? " ruled" : ""}`} style={{ "--fs": mode.scale }} onClick={onPageClick}>
      {index ? PAGE_NUMS.map((p) => (
        <PageView key={`${layout}-${p}`} p={p} mode={mode} bism={index.bism}
          hl={[selKey, playingKey].filter(Boolean).join(",")} hifz={hifz} revealed={hifz ? revealed : null} />
      )) : <div className="qr-loading">Loading the Quran…</div>}
      {index && <div className="qr-end"><p>صَدَقَ ٱللَّهُ ٱلْعَظِيمُ</p></div>}
    </div>
  );

  return (
    <div className={`qr-root${isDesk ? " desk" : ""}${chrome ? "" : " immersive"}`} data-theme={theme} data-ui={dark ? "dark" : "light"}>
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
        <AudioBar reciter={reciterId === "admin" ? "Uploaded recordings" : reciterInfo(reciterId).name} onSettings={() => setScreen("settings")}
          now={AYAHS[audio.idx]} prefs={prefs} save={save} audio={audio} onToggle={togglePlay} onClose={stopAudio}
          onStar={() => { const ay = AYAHS[audio.idx]; ay && addBookmark(ay.s, ay.a); }}
          onTr={() => run("translations")} audioEl={audioEl} repeatLeft={repeatLeft} />
      )}

      {screen && (
        <div className={isDesk ? "qr-modal" : "qr-screen-wrap"} onClick={isDesk ? () => setScreen(null) : undefined}>
          <div className={`qr-screen${screen === "settings" ? " wide" : ""}`} onClick={(e) => e.stopPropagation()}>
            {screen === "index" && <IndexScreen ctx={ctx} />}
            {screen === "customize" && <CustomizeScreen ctx={ctx} />}
            {screen === "bookmarks" && <BookmarksScreen ctx={ctx} />}
            {screen === "search" && <SearchScreen ctx={ctx} />}
            {screen === "settings" && <SettingsScreen prefs={prefs} save={save} colorOk={colorOk}
              hasAdminAudio={Object.values(EXTRA).some((x) => x.audio)}
              onBack={() => setScreen(null)} onSearch={() => setScreen("search")} />}
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
/* One mushaf page. Loads its data (and page font) when it comes near the screen. */
const PageView = memo(function PageView({ p, mode, bism, hl, hifz, revealed }) {
  const ref = useRef(null);
  const [data, setData] = useState(null);
  const [fam, setFam] = useState(null);
  const [want, setWant] = useState(false);
  const { font, layout, lines15, showTr } = mode;

  useEffect(() => {
    const el = ref.current;
    const io = new IntersectionObserver((en) => { if (en[0].isIntersecting) { setWant(true); io.disconnect(); } }, { rootMargin: "1600px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!want) return;
    let stop = false;
    const kind = font === "mushaf" ? "v1" : font === "tajweed" ? "v4" : null;
    // if a page font cannot be loaded (offline), Mushaf Tajweed falls back to the Uthmanic font
    const fontReady = kind ? loadPageFont(kind, p).catch(() => "")
      : document.fonts.load(`20px "${font === "indopak" ? "NQ IndoPak" : "NQ Uthmanic"}"`).then(() => null);
    Promise.all([loadPage(layout, p), fontReady]).then(([d, f]) => { if (!stop) { setFam(f); setData(d); } }).catch(() => {});
    return () => { stop = true; };
  }, [want, font, layout, p]);

  const hlSet = hl ? hl.split(",") : [];
  const cls = (k) => `${hlSet.includes(k) ? " hl" : ""}${hifz && !revealed[k] ? " hide" : ""}`;
  const noFont = fam === "" ; // page font failed to load
  if (noFont && font === "tajweed") return <PageView p={p} mode={{ ...mode, font: "uthmanic" }} bism={bism} hl={hl} hifz={hifz} revealed={revealed} />;
  const glyph = font === "mushaf" || font === "tajweed";
  const E = layout === "v1" ? 3 : 5; // where the "ayah end" flag sits in a word entry
  const wtext = (w) => (glyph ? w[2] : font === "indopak" ? w[4] : w[3]);
  const bismText = font === "indopak" ? bism.i : bism.q;
  const style = fam ? { fontFamily: `"${fam}"` } : { fontFamily: font === "indopak" ? '"NQ IndoPak"' : '"NQ Uthmanic"' };

  if (data && noFont) {
    return <section ref={ref} className="qr-page" data-page={p}><p className="qr-loading">The Mushaf font for page {p} could not be loaded. Check the connection, or choose another font in Settings.</p><div className="qr-pno">{p}</div></section>;
  }
  if (!data) {
    return <section ref={ref} className={`qr-page ph${lines15 ? " m15" : ""}`} data-page={p}><div className="qr-pno">{p}</div></section>;
  }

  const Header = ({ s }) => (
    <div className="qr-surah" data-surah={s}>
      <span className="orn" aria-hidden="true">۞</span>
      <h2 lang="ar">سُورَةُ {surah(s).ar}</h2>
      <span className="orn" aria-hidden="true">۞</span>
    </div>
  );
  const Bism = () => <div className="qr-bism" dir="rtl">{bismText}</div>;

  if (lines15) {
    return (
      <section ref={ref} className={`qr-page m15${p <= 2 ? " opening" : ""}`} data-page={p}>
        <FitLines p={p} fam={fam} font={font}>
          {data.lines.map((l, i) => {
            if (l.h) return <div key={i} className="ml mh"><Header s={l.h} /></div>;
            if (l.b) return <div key={i} className="ml mb"><Bism /></div>;
            return (
              <div key={i} className="ml mw" dir="rtl" style={style}>
                {l.w.map((w, j) => {
                  const k = `${w[0]}:${w[1]}`;
                  const end = w[E];
                  return <span key={j} data-k={k} className={`qw${end ? " qe" : ""}${cls(k)}`}>{wtext(w)}</span>;
                })}
              </div>
            );
          })}
        </FitLines>
        <div className="qr-pno">{p}</div>
      </section>
    );
  }

  // flowing text: surah headers, bismillah, then ayahs one after another
  const groups = [];
  data.lines.forEach((l) => {
    if (l.h) groups.push({ t: "h", s: l.h });
    else if (l.b) groups.push({ t: "b" });
    else l.w.forEach((w) => {
      let g = groups[groups.length - 1];
      if (!g || g.t !== "run") { g = { t: "run", ayahs: [] }; groups.push(g); }
      const k = `${w[0]}:${w[1]}`;
      let ay = g.ayahs[g.ayahs.length - 1];
      if (!ay || ay.k !== k) { ay = { k, s: w[0], a: w[1], w: [] }; g.ayahs.push(ay); }
      ay.w.push(w);
    });
  });
  // the ayah-end marker always stays on the same line as the word before it
  const Ayah = ({ ay }) => {
    const ws = ay.w;
    const endIdx = ws.findIndex((w) => w[E]);
    const cut = endIdx < 0 ? ws.length : Math.max(0, endIdx - 1);
    const head = ws.slice(0, cut);
    const tail = ws.slice(cut);
    const W = (w, j) => <span key={j} className={w[E] ? "qw qe" : "qw"}>{wtext(w)}</span>;
    return (
      <span className={`qa${cls(ay.k)}`} data-k={ay.k}>
        {head.map((w, j) => [W(w, j), " "])}
        {tail.length > 0 && <span className="qnw">{tail.map((w, j) => (j ? [" ", W(w, `t${j}`)] : W(w, `t${j}`)))}</span>}{" "}
      </span>
    );
  };
  return (
    <section ref={ref} className="qr-page" data-page={p}>
      {groups.map((g, i) => {
        if (g.t === "h") return <Header key={i} s={g.s} />;
        if (g.t === "b") return <Bism key={i} />;
        if (showTr) {
          return g.ayahs.map((ay) => {
            const tr = EXTRA[ay.k]?.tr ? Object.entries(EXTRA[ay.k].tr).filter(([, v]) => v) : [];
            return (
              <div key={ay.k} className="qr-single">
                <p className="qr-lines" dir="rtl" style={style}><Ayah ay={ay} /></p>
                {tr.map(([lang, text]) => (
                  <div key={lang} className="qr-tr"><span className="tag">{LANGS[lang] || lang}</span><p lang={lang}>{text}</p></div>
                ))}
              </div>
            );
          });
        }
        const center = p <= 2;
        return (
          <p key={i} className={`qr-lines${center ? " center" : ""}`} dir="rtl" style={style}>
            {g.ayahs.map((ay) => <Ayah key={ay.k} ay={ay} />)}
          </p>
        );
      })}
      <div className="qr-pno">{p}</div>
    </section>
  );
});

// 15-line page: pick one font size so the widest line fits the page width, then justify each line
function FitLines({ children, p, fam, font }) {
  const ref = useRef(null);
  const [fs, setFs] = useState(null);
  const fit = useCallback(() => {
    const box = ref.current;
    if (!box) return;
    const cs = getComputedStyle(box);
    const W = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    if (!(W > 0)) return;
    const BASE = 20;
    box.style.setProperty("--mfs", `${BASE}px`);
    box.classList.add("measure");
    let widest = 0;
    box.querySelectorAll(".ml.mw").forEach((l) => {
      let sum = 0;
      l.querySelectorAll(".qw").forEach((w) => (sum += w.getBoundingClientRect().width));
      sum += (l.children.length - 1) * BASE * 0.12;
      widest = Math.max(widest, sum);
    });
    box.classList.remove("measure");
    const ref15 = font === "indopak" ? 0.94 : 0.985;
    const size = widest ? Math.min(BASE * ((W * ref15) / widest), 64) : 28;
    setFs(size);
    box.style.setProperty("--mfs", `${size}px`);
    // lines much shorter than the widest (end of a surah, first two pages) are centred, not stretched
    box.querySelectorAll(".ml.mw").forEach((l) => {
      let sum = 0;
      l.querySelectorAll(".qw").forEach((w) => (sum += w.getBoundingClientRect().width));
      l.classList.toggle("short", sum < W * (font === "mushaf" || font === "tajweed" ? 0.8 : 0.55));
    });
  }, [font]);
  useLayoutEffect(() => { fit(); }, [fit, fam, p]);
  useEffect(() => {
    const box = ref.current;
    if (!box || typeof ResizeObserver === "undefined") return;
    let w = box.clientWidth;
    const ro = new ResizeObserver(() => { if (box.clientWidth !== w) { w = box.clientWidth; fit(); } });
    ro.observe(box);
    return () => ro.disconnect();
  }, [fit]);
  return <div ref={ref} className="m15box" style={fs ? { "--mfs": `${fs}px` } : undefined}>{children}</div>;
}

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

function AyahPopup({ ctx }) {
  const { sel, setSel, startAudioAt, addBookmark, setReading, ayahShare } = ctx;
  const ex = EXTRA[key(sel.s, sel.a)];
  const tr = ex?.tr ? Object.entries(ex.tr).filter(([, v]) => v) : [];
  const below = sel.y < window.innerHeight * 0.6;
  const style = { left: sel.x, top: below ? sel.y + 8 : undefined, bottom: below ? undefined : window.innerHeight - sel.y + 60 };
  return (
    <div className="qr-pop" style={style} onClick={(e) => e.stopPropagation()}>
      <div className="btns">
        <button title="Play from this ayah" onClick={() => startAudioAt(sel.s, sel.a)}>{Ico.play()}</button>
        <button title="Play the surah from the beginning" className="from1" onClick={() => startAudioAt(sel.s, 1)}><G.restart /></button>
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

function AudioBar({ reciter, onSettings, now, prefs, save, audio, onToggle, onClose, onStar, onTr, audioEl, repeatLeft }) {
  const left = Math.max(0, (audio.dur || 0) - (audio.cur || 0));
  const pct = audio.dur ? (audio.cur / audio.dur) * 100 : 0;
  return (
    <div className="qr-audiobar">
      <div className="top">
        <button aria-label="Choose reciter" onClick={onSettings}><G.gear /></button>
        <span className="name">{reciter}{now ? <small> · {surah(now.s).en} {now.s}:{now.a}</small> : null}</span>
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
                        <button key={l} onClick={() => goTo({ juz: j })}>{l}</button>
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
  const [all, setAll] = useState(null);
  useEffect(() => {
    loadSearch().then((rows) => setAll(rows.map(([s, a, text]) => ({ s, a, text, plain: strip(text) })))).catch(() => setAll([]));
  }, []);
  const term = q.trim();
  const sur = term ? SURAHS.filter((s) => s.en.toLowerCase().includes(term.toLowerCase()) || strip(s.ar).includes(strip(term)) || String(s.n) === term) : [];
  const ref = term.match(/^(\d{1,3})\s*[:.\s]\s*(\d{1,3})$/);
  const ays = useMemo(() => {
    if (!all || term.length < 2) return [];
    const t = strip(term), tl = term.toLowerCase();
    return all.filter((a) => a.plain.includes(t) || Object.values(EXTRA[key(a.s, a.a)]?.tr || {}).some((x) => (x || "").toLowerCase().includes(tl)));
  }, [all, term]);
  return (
    <div className="qs">
      <ScreenHead title="Search" onBack={() => setScreen(null)} />
      <div className="qs-search"><input autoFocus placeholder="Search surah or ayah text" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="qs-body">
        {sur.length > 0 && <div className="qs-cap">SURAHS</div>}
        {sur.slice(0, 20).map((s) => (
          <button key={s.n} className="qs-sura" onClick={() => goTo({ s: s.n, a: 1 })}><span>{s.n} {s.en}</span><span className="ar" dir="rtl">{s.ar}</span></button>
        ))}
        {ref && SURAHS[+ref[1] - 1] && +ref[2] >= 1 && +ref[2] <= SURAHS[+ref[1] - 1].ayahs && (
          <button className="qs-sura" onClick={() => goTo({ s: +ref[1], a: +ref[2] })}><span>Go to {surah(+ref[1]).en} {ref[1]}:{ref[2]}</span><span className="ar" dir="rtl">{surah(+ref[1]).ar}</span></button>
        )}
        {!all && term.length > 1 && <p className="qs-empty">Loading…</p>}
        {ays.length > 0 && <div className="qs-cap">AYAHS ({ays.length})</div>}
        {ays.slice(0, 200).map((a) => (
          <button key={key(a.s, a.a)} className="qs-res" onClick={() => goTo(a)}>
            <span className="ar" dir="rtl">{a.text}</span><small>{surah(a.s).en} {a.s}:{a.a}</small>
          </button>
        ))}
        {term && !sur.length && !ays.length && <p className="qs-empty">No results.</p>}
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
                  <button key={s.n} className={`qd-item${view.s === s.n ? " cur" : ""}`} onClick={() => goTo({ s: s.n, a: 1 })}>
                    <span className="n"><b>{s.n}</b></span>
                    <span className="t"><b>{s.en}</b><small>{s.ayahs} Ayahs</small></span>
                    <span className="ar" dir="rtl">{s.ar}</span>
                  </button>
                ))
              : JUZ_NAMES.map((n, i) => (
                  <button key={i} className={`qd-item${view.juz === i + 1 ? " cur" : ""}`} onClick={() => goTo({ juz: i + 1 })}>
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
              <Btn id="settings" label="Settings" />
              {!prefs.lines15 && !prefs.sizeLock && (
                <div className="qd-font">
                  <button aria-label="Smaller text" onClick={() => save((p) => ({ size: Math.max(0, p.size - 5) }))}>A−</button>
                  <button aria-label="Larger text" onClick={() => save((p) => ({ size: Math.min(100, p.size + 5) }))}>A+</button>
                </div>
              )}
            </div>
          </div>
          <div className="qd-book">{pagesEl}</div>
        </main>
      </div>
    </div>
  );
}
