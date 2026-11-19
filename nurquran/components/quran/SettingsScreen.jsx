"use client";
// Quran settings — mobile layout follows the reference app screenshot (Quran Font, toggles, Size Adjust, Themes).
import { useEffect, useRef, useState } from "react";
import { FONTS, loadPage, loadPageFont, addStaticFonts } from "@/lib/quran/mushaf";
import { RECITERS, ayahAudioUrl, arrangeReciters, effectiveReciter } from "@/lib/quran/reciters";
import { G } from "./QIcons";
import { useSiteImages, useSiteConfig } from "@/lib/siteImages";
import "./settings.css";

const THEMES = [
  { id: "green", label: "Green" },
  { id: "brown", label: "Brown" },
  { id: "grey", label: "Grey" },
  { id: "night", label: "Night Mode" },
];

// first lines of Surah Al-Fatiha, drawn in each font, for the round previews
function useSamples() {
  const [s, setS] = useState(null);
  useEffect(() => {
    let stop = false;
    Promise.all([loadPage("v2", 1), loadPage("v1", 1), loadPageFont("v1", 1).catch(() => null), loadPageFont("v4", 1).catch(() => null)])
      .then(([v2, v1, f1, f4]) => { if (!stop) setS({ v2, v1, f1, f4 }); })
      .catch(() => {});
    return () => { stop = true; };
  }, []);
  return s;
}

function FontSample({ id, s }) {
  if (!s) return null;
  const glyph = id === "mushaf" || id === "tajweed";
  const src = id === "mushaf" ? s.v1 : s.v2;
  const lines = src.lines.filter((l) => l.w).slice(1, 4); // ayah 2–4 lines
  const fam = id === "mushaf" ? s.f1 : id === "tajweed" ? s.f4 : id === "indopak" ? "NQ IndoPak" : "NQ Uthmanic";
  const txt = (w) => (glyph ? w[2] : id === "indopak" ? w[4] : w[3]);
  return (
    <div className={`qset-sample s-${id}`} dir="rtl" style={{ fontFamily: `"${fam}"` }}>
      {lines.map((l, i) => <div key={i}>{l.w.map((w) => txt(w)).join(" ")}</div>)}
    </div>
  );
}

function Toggle({ on, onChange, label }) {
  return (
    <button className="qset-tg" role="switch" aria-checked={on} onClick={() => onChange(!on)}>
      <span className={`trk${on ? " on" : ""}`}><span className="knob" /></span>
      <span className="lbl">{label}</span>
    </button>
  );
}

function Lock({ locked }) {
  return (
    <svg viewBox="0 0 24 28" aria-hidden="true">
      <path d={locked ? "M6.5 12V8.5a5.5 5.5 0 0111 0V12" : "M6.5 12V8.5a5.5 5.5 0 0110.6-2"} fill="none" stroke="#1faa59" strokeWidth="2.6" strokeLinecap="round" />
      <rect x="3" y="12" width="18" height="14" rx="2.5" fill="#1faa59" />
      <circle cx="12" cy="18" r="2" fill="#fff" /><rect x="11" y="18.5" width="2" height="4" rx="1" fill="#fff" />
    </svg>
  );
}

function ThemeThumb({ id, img }) {
  if (img) return <img className="qset-themeimg" src={img} alt="" />;
  return (
    <span className={`qset-phone t-${id}`} aria-hidden="true">
      <i className="bar" />
      {Array.from({ length: 7 }, (_, i) => <i key={i} className="ln" style={{ width: `${[78, 64, 80, 70, 76, 60, 72][i]}%` }} />)}
    </span>
  );
}

// short listen before choosing: Al-Fatiha 1:2 in that reciter's voice
let sampleAudio = null;
function playSample(id, setPlaying) {
  try {
    if (!sampleAudio) sampleAudio = new Audio();
    if (sampleAudio.dataset.id === id && !sampleAudio.paused) { sampleAudio.pause(); setPlaying(null); return; }
    sampleAudio.dataset.id = id;
    sampleAudio.src = ayahAudioUrl(id, 1, 2);
    sampleAudio.onended = () => setPlaying(null);
    sampleAudio.play().then(() => setPlaying(id)).catch(() => setPlaying(null));
  } catch (e) {}
}

// Round reciter picture: the photo in public/reciters/<id>.jpg when it exists (and Photos is on),
// otherwise a monogram with the reciter's initials.
const initials = (name) => name.replace(/^(Abdur|Abdul|Abu)[- ]/, (m) => m.trim() + " ").split(/[\s-]+/).filter((w) => !/^(Al|As|Ash|Ad|Ar|An|Abdus)$/i.test(w)).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
const HUES = [152, 200, 28, 265, 340, 180, 45, 220, 10, 120, 290, 60, 235, 165];
function Avatar({ r, i, photos, uploaded }) {
  const [bad, setBad] = useState(0); // 1: uploaded photo failed, 2: local photo failed too
  const base = typeof window !== "undefined" ? window.__QURAN_BASE__ || "" : "";
  if (photos && r.id !== "admin") {
    if (uploaded && bad < 1) return <img className="pic" src={uploaded} alt="" loading="lazy" onError={() => setBad(1)} />;
    if (bad < 2) return <img className="pic" src={`${base}/reciters/${r.id}.jpg`} alt="" loading="lazy" onError={() => setBad(2)} />;
  }
  const h = HUES[i % HUES.length];
  return (
    <span className="mono" style={{ background: `linear-gradient(145deg,hsl(${h} 45% 42%),hsl(${h + 25} 55% 28%))` }}>
      {r.id === "admin" ? "↑" : initials(r.name)}
    </span>
  );
}

function ReciterCard({ prefs, save, hasAdminAudio }) {
  const cfg = useSiteConfig();
  const imgs = cfg.images;
  const current = effectiveReciter(prefs, cfg.reciters);
  const pick = (id) => save({ reciter: id, reciterChosen: true });
  const [playing, setPlaying] = useState(null);
  const [all, setAll] = useState(false);
  const rowRef = useRef(null);
  useEffect(() => () => { try { sampleAudio && sampleAudio.pause(); } catch (e) {} }, []);
  const arranged = arrangeReciters(cfg.reciters);
  const list = hasAdminAudio ? [...arranged, { id: "admin", name: "Uploaded recordings", place: "Admin panel" }] : arranged;
  // keep the chosen reciter in view in the sliding row
  useEffect(() => {
    const row = rowRef.current;
    const el = row && row.querySelector(".qset-ri.on");
    if (row && el && !all) row.scrollTo({ left: el.offsetLeft - (row.clientWidth - el.offsetWidth) / 2, behavior: "smooth" });
  }, [current, all]);
  return (
    <section className="qset-card rec">
      <h3><span>Reciter</span></h3>
      <div ref={rowRef} className={`qset-recrow${all ? " all" : ""}`}>
        {list.map((r, i) => {
          const on = current === r.id;
          return (
            <div key={r.id} role="button" tabIndex={0} className={`qset-ri${on ? " on" : ""}`} title={`${r.name} — ${r.place}`}
              onClick={() => pick(r.id)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && pick(r.id)}>
              <span className="circ">
                <Avatar r={r} i={Math.max(0, RECITERS.findIndex((x) => x.id === r.id))} photos={prefs.reciterPhotos !== false} uploaded={imgs[`reciter:${r.id}`]} />
                {r.id !== "admin" && (
                  <button className="pl" aria-label={`Listen to ${r.name}`} onClick={(e) => { e.stopPropagation(); playSample(r.id, setPlaying); }}>
                    {playing === r.id
                      ? <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
                      : <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5l11 7-11 7z" /></svg>}
                  </button>
                )}
              </span>
              <span className="name">{r.name}</span>
            </div>
          );
        })}
      </div>
      <div className="qset-recfoot">
        <label className="ph">
          <span>Photos</span>
          <Toggle label="" on={prefs.reciterPhotos !== false} onChange={(v) => save({ reciterPhotos: v })} />
        </label>
        <button className="all" onClick={() => setAll((x) => !x)}>{all ? "Show Less" : "Show All"}</button>
      </div>
      <div className="qset-row">
        <span>Recite Bismillah before each surah</span>
        <Toggle label="" on={prefs.bismillah} onChange={(v) => save({ bismillah: v })} />
      </div>
    </section>
  );
}

// The cards on their own — used in the reader's Settings screen and on the home page
export function SettingsCards({ prefs, save, colorOk, hasAdminAudio }) {
  const samples = useSamples();
  const imgs = useSiteImages();
  useEffect(() => { addStaticFonts(); }, []);
  const sizeOff = prefs.sizeLock || prefs.lines15;
  const sampleFam = prefs.qfont === "indopak" ? "NQ IndoPak" : "NQ Uthmanic";
  return (
      <div className="qset-body">
        <section className="qset-card">
          <h3><span>Quran Font</span></h3>
          <div className="qset-opts">
            {FONTS.map((f) => {
              const on = prefs.qfont === f.id;
              return (
                <button key={f.id} className={`qset-opt${on ? " on" : ""}`} onClick={() => save({ qfont: f.id })}>
                  <span className="circ"><FontSample id={f.id} s={samples} /></span>
                  <span className="name">{f.label}</span>
                </button>
              );
            })}
          </div>
          {prefs.qfont === "tajweed" && !colorOk && (
            <p className="qset-note">This browser cannot show colour tajweed fonts (Safari / iPhone), so the Uthmanic font is shown instead. Chrome, Edge, Firefox and Android show the colours.</p>
          )}
          <div className="qset-rule" />
          <div className="qset-tgs">
            <Toggle label="15 lines" on={prefs.lines15} onChange={(v) => save({ lines15: v })} />
            <Toggle label="Page Lines" on={prefs.pageLines} onChange={(v) => save({ pageLines: v })} />
            <Toggle label="Screen Timeout" on={prefs.screenOn} onChange={(v) => save({ screenOn: v })} />
          </div>
          <div className="qset-rule" />
          <div className="qset-size">
            <div className={`l${sizeOff ? " off" : ""}`}>
              <div className="top">
                <div className="t"><span>Size Adjust</span><b>{prefs.lines15 ? "Auto" : `${prefs.size}%`}</b></div>
                <button className="lock" aria-label={prefs.sizeLock ? "Unlock size" : "Lock size"} onClick={() => save((p) => ({ sizeLock: !p.sizeLock }))}><Lock locked={prefs.sizeLock} /></button>
              </div>
              <input type="range" min="0" max="100" step="1" value={prefs.size} disabled={sizeOff} style={{ "--p": `${prefs.size}%` }}
                onChange={(e) => save({ size: +e.target.value })} aria-label="Size Adjust" />
              {prefs.lines15 && <small>In 15-line mode the page fits the screen.</small>}
            </div>
            <div className="r" dir="rtl" style={{ fontFamily: `"${sampleFam}"`, fontSize: `${Math.round(18 + prefs.size * 0.36)}px` }}>سُورَةُ</div>
          </div>
        </section>

        <section className="qset-card">
          <h3><span>Themes</span></h3>
          <div className="qset-opts">
            {THEMES.map((t) => {
              const on = prefs.theme === t.id;
              return (
                <button key={t.id} className={`qset-opt${on ? " on" : ""}`} onClick={() => save({ theme: t.id })}>
                  <span className="circ"><ThemeThumb id={t.id} img={imgs[`theme:${t.id}`]} /></span>
                  <span className="name">{t.label}</span>
                </button>
              );
            })}
          </div>
          <label className="qset-app">
            <span>Appearance:</span>
            <select value={prefs.appearance} onChange={(e) => save({ appearance: e.target.value })}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </label>
        </section>

        <ReciterCard prefs={prefs} save={save} hasAdminAudio={hasAdminAudio} />
      </div>
  );
}

export default function SettingsScreen({ prefs, save, colorOk, hasAdminAudio, onBack, onSearch }) {
  return (
    <div className="qset">
      <header className="qset-head">
        <button className="b" onClick={onBack} aria-label="Back"><G.back /><span>Quran</span></button>
        <div className="r">
          <button aria-label="Search" onClick={onSearch}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5L21 21" /><path d="M10.5 7.5v6M7.5 10.5h6" strokeWidth="1.6" /></svg>
          </button>
          <span className="gear" aria-hidden="true"><G.gear /></span>
        </div>
      </header>
      <SettingsCards prefs={prefs} save={save} colorOk={colorOk} hasAdminAudio={hasAdminAudio} />
    </div>
  );
}
