"use client";
// Advanced Settings — same list as the reference app: display options, audio, settings backup, about.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePrefs, PREF_DEFAULTS, PREF_KEY } from "@/lib/quran/prefs";
import "./pages.css";

const BACKUP_KEYS = [PREF_KEY, "prayerSettings", "nq_search", "tasbeeh", "nq_notifs_dismissed"];
const AUTO = "nq_settings_autobackup";
const VERSION = "1.0";

function snapshot() {
  const data = {};
  BACKUP_KEYS.forEach((k) => { try { const v = localStorage.getItem(k); if (v != null) data[k] = JSON.parse(v); } catch (e) {} });
  return { app: "Nur Quran", version: VERSION, savedAt: new Date().toISOString(), data };
}
function applySnapshot(snap) {
  if (!snap || snap.app !== "Nur Quran" || !snap.data) throw new Error("This file is not a Nur Quran settings backup.");
  Object.entries(snap.data).forEach(([k, v]) => { if (BACKUP_KEYS.includes(k)) localStorage.setItem(k, JSON.stringify(v)); });
}

function Row({ title, sub, on, onChange, disabled }) {
  return (
    <button className={`as-row${disabled ? " dis" : ""}`} role="switch" aria-checked={!!on} onClick={() => !disabled && onChange(!on)}>
      <span className="t"><b>{title}</b>{sub && <small>{sub}</small>}</span>
      <span className={`as-sw${on ? " on" : ""}`}><i /></span>
    </button>
  );
}
function Item({ title, sub, onClick }) {
  return <button className="as-row" onClick={onClick}><span className="t"><b>{title}</b>{sub && <small>{sub}</small>}</span></button>;
}

export default function AdvancedSettings() {
  const router = useRouter();
  const [prefs, save] = usePrefs();
  const [info, setInfo] = useState(false);
  const [msg, setMsg] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [auto, setAuto] = useState(null);
  const file = useRef(null);
  const toast = (t) => { setMsg(t); setTimeout(() => setMsg(""), 2600); };

  useEffect(() => { try { setAuto(JSON.parse(localStorage.getItem(AUTO) || "null")); } catch (e) {} }, []);
  // automatic backup: keep a copy of all settings in this browser every time they change
  useEffect(() => {
    if (!prefs || !prefs.autoBackup) return;
    const s = snapshot();
    try { localStorage.setItem(AUTO, JSON.stringify(s)); } catch (e) {}
    setAuto(s);
  }, [prefs]);

  if (!prefs) return <div className="np" />;
  const set = (k) => (v) => save({ [k]: v });

  const backup = async () => {
    const s = snapshot();
    const text = JSON.stringify(s, null, 1);
    const name = `nur-quran-settings-${s.savedAt.slice(0, 10)}.json`;
    try {
      const blob = new Blob([text], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      toast("Backup file saved");
    } catch (e) {
      try { await navigator.clipboard.writeText(text); toast("Backup copied to the clipboard"); } catch (e2) { toast("Could not save the backup"); }
    }
  };
  const restoreFile = async (f) => {
    if (!f) return;
    try {
      applySnapshot(JSON.parse(await f.text()));
      toast("Settings restored");
      setTimeout(() => location.reload(), 700);
    } catch (e) { toast(e.message || "This file could not be read"); }
  };
  const doReset = () => {
    // bookmarks, reading bookmark and the last page stay; every setting goes back to the default
    const keep = { bookmarks: prefs.bookmarks, reading: prefs.reading, lastPos: prefs.lastPos };
    localStorage.setItem(PREF_KEY, JSON.stringify({ ...PREF_DEFAULTS, ...keep }));
    ["nq_search"].forEach((k) => localStorage.removeItem(k));
    toast("Default settings restored");
    setTimeout(() => location.reload(), 700);
  };

  return (
    <div className="np as">
      <header className="as-head">
        <button className="b" aria-label="Back" onClick={() => (history.length > 1 ? router.back() : router.push("/"))}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4l-8 8 8 8" /></svg>
        </button>
        <h1>Advanced Settings</h1>
        <button className="i" aria-label="About these settings" onClick={() => setInfo(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><path d="M12 10.5v6.5M12 7.2v.1" strokeLinecap="round" strokeWidth="2.4" /></svg>
        </button>
      </header>

      <div className="as-body">
        <Row title="New Toolbar" on={prefs.newToolbar !== false} onChange={set("newToolbar")} />
        <Row title="Text Effects" on={!!prefs.textEffects} onChange={set("textEffects")} />
        <Row title="Arabic Sura/Juz Index" sub="Show sura/juz in Arabic" on={!!prefs.arabicIndex} onChange={set("arabicIndex")} />
        <Row title="Page Index" sub="Show Page Number on Top Bar" on={prefs.pageIndex !== false} onChange={set("pageIndex")} />

        <h2>Audio</h2>
        <Row title="Audio Smoother" sub="Works with Recitation and Translation" on={prefs.audioSmoother !== false} onChange={set("audioSmoother")} />
        <Row title="Echo" on={!!prefs.echo} onChange={set("echo")} />

        <h2>User Settings Backup</h2>
        <Row title="Auto" sub={prefs.autoBackup && auto ? `Last copy: ${new Date(auto.savedAt).toLocaleString()}` : undefined} on={!!prefs.autoBackup} onChange={set("autoBackup")} />
        <Item title="Backup" onClick={backup} />
        <Item title="Restore" sub={auto ? "From a backup file, or from the automatic copy" : undefined} onClick={() => setConfirm("restore")} />
        <Item title="Reset Default Settings" onClick={() => setConfirm("reset")} />

        <h2>About</h2>
        <div className="as-about">
          <b>Nur Quran (Web version)</b>
          <small>Version: {VERSION}</small>
          <small>Quran text and translations: Quran.com (Quran Foundation) · Recitation: EveryAyah.com · Word roots: Quranic Arabic Corpus</small>
        </div>
      </div>

      <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => { restoreFile(e.target.files[0]); e.target.value = ""; }} />

      {confirm === "restore" && (
        <div className="nt-modal-bg" onClick={() => setConfirm(null)}>
          <div className="nt-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Restore settings</h3>
            <p>Your current settings will be replaced.</p>
            <div className="as-btns">
              <button onClick={() => { setConfirm(null); file.current && file.current.click(); }}>Choose backup file</button>
              {auto && <button onClick={() => { try { applySnapshot(auto); toast("Settings restored"); setTimeout(() => location.reload(), 700); } catch (e) { toast(e.message); } setConfirm(null); }}>Automatic copy ({new Date(auto.savedAt).toLocaleDateString()})</button>}
              <button className="ghost" onClick={() => setConfirm(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {confirm === "reset" && (
        <div className="nt-modal-bg" onClick={() => setConfirm(null)}>
          <div className="nt-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Reset default settings?</h3>
            <p>Font, theme, reciter and all other settings go back to the default. Your bookmarks and last reading page are kept.</p>
            <div className="as-btns">
              <button className="red" onClick={() => { setConfirm(null); doReset(); }}>Reset</button>
              <button className="ghost" onClick={() => setConfirm(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {info && (
        <div className="nt-modal-bg" onClick={() => setInfo(false)}>
          <div className="nt-modal info" onClick={(e) => e.stopPropagation()}>
            <h3>About these settings</h3>
            <dl>
              <dt>New Toolbar</dt><dd>Bottom toolbar of the Quran page with names under the icons. Off: a smaller bar with icons only.</dd>
              <dt>Text Effects</dt><dd>A soft shadow under the Quran text and a glow on the ayah you tap.</dd>
              <dt>Arabic Sura/Juz Index</dt><dd>Surah and Juz names in Arabic in the top bar and in the index.</dd>
              <dt>Page Index</dt><dd>The page number in the middle of the top bar.</dd>
              <dt>Audio Smoother</dt><dd>Each ayah fades in and out gently, so the jump to the next ayah is smooth.</dd>
              <dt>Echo</dt><dd>Adds a light masjid-like echo to the recitation.</dd>
              <dt>User Settings Backup</dt><dd>Auto keeps a copy of your settings in this browser. Backup saves them to a file; Restore loads that file (or the automatic copy) — useful on a new phone.</dd>
            </dl>
            <button onClick={() => setInfo(false)}>OK</button>
          </div>
        </div>
      )}
      <div className={`as-toast${msg ? " show" : ""}`}>{msg}</div>
    </div>
  );
}
