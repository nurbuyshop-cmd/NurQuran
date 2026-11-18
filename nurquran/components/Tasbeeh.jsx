"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DHIKR, GOALS } from "@/lib/dhikr";
import { QuranIcon } from "./FeatureIcons";

const STORE = "tasbeehState";
const SPACING = 70; // px between numbers on the goal arc
const MODES = ["mute", "sound", "vibrate"];

/* ---------------- small icons ---------------- */
const Back = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#1f1f1f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
);
const ResetIco = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 12a8 8 0 11-2.34-5.66" /><path d="M20 4v5h-5" />
  </svg>
);
const MuteIco = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 4.6A6 6 0 0118 10v4l1.5 2.5M6 9.8V14l-1.5 2.5h11" /><path d="M10 20a2 2 0 004 0" /><path d="M3 3l18 18" />
  </svg>
);
const SoundIco = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l11-2v13" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="17.5" cy="16" r="2.5" />
  </svg>
);
const VibrateIco = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="3" width="8" height="18" rx="1.5" /><path d="M4.5 8v8M2 10v4M19.5 8v8M22 10v4" />
  </svg>
);
const LockIco = ({ locked }) => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    {locked ? (
      <path d="M12 2a5 5 0 00-5 5v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7a5 5 0 00-5-5zm-3 8V7a3 3 0 016 0v3z" />
    ) : (
      <path d="M12 2a5 5 0 00-5 5v.5h2V7a3 3 0 016 0v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7a5 5 0 00-5-5zm0 12.5a1.8 1.8 0 01.9 3.35V19h-1.8v-1.15A1.8 1.8 0 0112 14.5z" />
    )}
  </svg>
);
const Fingerprint = () => (
  <svg viewBox="0 0 100 120" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="3.2" strokeLinecap="round">
    <path d="M22 30a40 40 0 0156 0" />
    <path d="M15 50a37 37 0 0170 0" />
    <path d="M24 62c0-15 12-27 26-27s26 12 26 27c0 9-1 16-3 23" />
    <path d="M33 92c-3-8-4-17-4-28a21 21 0 0142 0" />
    <path d="M42 100c-3-9-5-20-5-34a13 13 0 0126 0c0 13-1 25-5 36" />
    <path d="M50 66c0 15 2 30 7 44" />
    <path d="M18 78c1 6 3 12 5 17" />
    <path d="M82 72c-1 9-2 18-6 27" />
  </svg>
);

/* ---------------- helpers ---------------- */
function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE) || "null");
    if (s && typeof s === "object") return s;
  } catch (e) {}
  return null;
}

let audioCtx = null;
function click(long = false) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = "sine";
    o.frequency.value = long ? 660 : 1200;
    g.gain.setValueAtTime(0.25, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (long ? 0.6 : 0.06));
    o.connect(g).connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + (long ? 0.6 : 0.07));
  } catch (e) {}
}
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
function buzz(ms) {
  try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {}
}

/* ---------------- component ---------------- */
export default function Tasbeeh() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [dhikr, setDhikr] = useState(0);
  const [count, setCount] = useState(0);
  const [goalIdx, setGoalIdx] = useState(0);
  const [custom, setCustom] = useState({ c1: 0, c2: 0 });
  const [mode, setMode] = useState("mute");
  const [locked, setLocked] = useState(false);
  const [stats, setStats] = useState({ date: "", total: 0, rounds: 0 }); // today's totals (desktop panel)

  const [pos, setPos] = useState(0);         // live wheel position (float while dragging)
  const [dragging, setDragging] = useState(false);
  const [dialog, setDialog] = useState(null); // {type:'reset'|'exceed'|'custom', ...}
  const [customInput, setCustomInput] = useState("");
  const [toast, setToast] = useState(false);
  const [bump, setBump] = useState(0);

  const chipsRef = useRef(null);
  const drag = useRef(null);
  const toastTimer = useRef(null);

  /* load + save */
  useEffect(() => {
    const s = loadState();
    if (s) {
      if (Number.isInteger(s.dhikr) && DHIKR[s.dhikr]) setDhikr(s.dhikr);
      if (Number.isInteger(s.count)) setCount(s.count);
      if (Number.isInteger(s.goalIdx) && GOALS[s.goalIdx] !== undefined) { setGoalIdx(s.goalIdx); setPos(s.goalIdx); }
      if (s.custom) setCustom({ c1: s.custom.c1 || 0, c2: s.custom.c2 || 0 });
      if (MODES.includes(s.mode)) setMode(s.mode);
      if (typeof s.locked === "boolean") setLocked(s.locked);
      if (s.stats && s.stats.date === todayKey()) setStats(s.stats);
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(STORE, JSON.stringify({ dhikr, count, goalIdx, custom, mode, locked, stats })); } catch (e) {}
  }, [ready, dhikr, count, goalIdx, custom, mode, locked, stats]);

  /* keep selected chip visible */
  useEffect(() => {
    const el = chipsRef.current?.children[dhikr];
    if (el) el.scrollIntoView({ behavior: ready ? "smooth" : "auto", inline: "nearest", block: "nearest" });
  }, [dhikr, ready, locked]);

  const goalValue = (i) => {
    const g = GOALS[i];
    return typeof g === "number" ? g : custom[g] || 0;
  };
  const goal = goalValue(goalIdx);

  /* counting */
  const showToast = () => {
    setToast(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(false), 2800);
  };
  const increment = () => {
    if (dialog) return;
    const next = count + 1;
    const done = goal > 0 && next >= goal;
    setBump((b) => b + 1);
    setStats((st) => {
      const base = st.date === todayKey() ? st : { date: todayKey(), total: 0, rounds: 0 };
      return { ...base, total: base.total + 1, rounds: base.rounds + (done ? 1 : 0) };
    });
    if (done) {
      if (mode === "sound") click(true);
      if (mode === "vibrate") buzz([120, 80, 220]);
      setCount(0);
      showToast();
    } else {
      if (mode === "sound") click();
      if (mode === "vibrate") buzz(30);
      setCount(next);
    }
  };

  /* keyboard counting on desktop: Space or Enter */
  const incRef = useRef(increment);
  incRef.current = increment;
  useEffect(() => {
    const onKey = (e) => {
      if (e.repeat || window.innerWidth < 900) return;
      const tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (e.code === "Space" || e.key === "Enter") { e.preventDefault(); incRef.current(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* goal selection */
  const selectGoal = useCallback((i, fromTap) => {
    setPos(i);
    const g = GOALS[i];
    if (fromTap && typeof g === "string") {
      setGoalIdx(i);
      setCustomInput(String(custom[g] || 0));
      setDialog({ type: "custom", key: g });
      return;
    }
    if (i === goalIdx) return;
    setGoalIdx(i);
    const v = typeof g === "number" ? g : custom[g] || 0;
    if (v > 0 && count >= v) setDialog({ type: "exceed" });
  }, [custom, count, goalIdx]);

  /* wheel drag */
  const onDown = (e) => {
    if (locked) return;
    drag.current = { x: e.clientX, start: pos, moved: false, target: e.target.closest("[data-idx]") };
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 6) d.moved = true;
    if (d.moved) setPos(Math.max(0, Math.min(GOALS.length - 1, d.start - dx / SPACING)));
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    setDragging(false);
    if (!d) return;
    if (!d.moved) {
      if (d.target) selectGoal(Number(d.target.dataset.idx), true);
      return;
    }
    selectGoal(Math.round(pos), false);
  };

  /* dialogs */
  const closeDialog = () => setDialog(null);
  const okDialog = () => {
    if (!dialog) return;
    if (dialog.type === "reset" || dialog.type === "exceed") setCount(0);
    if (dialog.type === "custom") {
      const n = Math.max(0, Math.min(99999, parseInt(customInput || "0", 10) || 0));
      setCustom((c) => ({ ...c, [dialog.key]: n }));
      setDialog(n > 0 && count >= n ? { type: "exceed" } : null);
      return;
    }
    setDialog(null);
  };

  const cycleMode = () => {
    const m = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
    setMode(m);
    if (m === "vibrate") buzz(40);
    if (m === "sound") click();
  };

  const cur = DHIKR[dhikr];
  const longText = cur.ar.length > 30;

  const modeLabel = { mute: "Silent", sound: "Sound", vibrate: "Vibrate" };
  const progress = goal > 0 ? Math.min(1, count / goal) : 0;
  const R = 130, C = 2 * Math.PI * R;

  return (
    <div className="tsb-root">
    {/* ================= MOBILE ================= */}
    <div className="tsb">
      {/* top bar */}
      <div className="tsb-bar">
        <button className="tsb-back" aria-label="Back" onClick={() => (history.length > 1 ? router.back() : router.push("/"))}><Back /></button>
        <span className="tsb-sep" />
        <h1>Tasbeeh</h1>
        <div className="tsb-actions">
          <button aria-label="Reset counter" onClick={() => setDialog({ type: "reset" })}><ResetIco /></button>
          <button aria-label={`Feedback: ${mode}`} onClick={cycleMode}>
            {mode === "mute" ? <MuteIco /> : mode === "sound" ? <SoundIco /> : <VibrateIco />}
          </button>
          <button aria-label={locked ? "Unlock" : "Lock"} className={locked ? "on" : ""} onClick={() => setLocked((l) => !l)}>
            <LockIco locked={locked} />
          </button>
        </div>
      </div>

      <div className="tsb-body">
        {/* dhikr card */}
        <div className="tsb-card">
          <div className={`tsb-ar ar${longText ? " long" : ""}`} dir="rtl">{cur.ar}</div>
          <div className="tsb-tr">{cur.tr}</div>
        </div>

        {/* chips or virtue */}
        {locked ? (
          <div className="tsb-virtue">{cur.virtue}</div>
        ) : (
          <div className="tsb-chips" ref={chipsRef}>
            {DHIKR.map((d, i) => (
              <button key={i} className={`tsb-chip ar${i === dhikr ? " sel" : ""}`} onClick={() => setDhikr(i)} dir="rtl">
                {d.ar}
              </button>
            ))}
          </div>
        )}

        <div className="tsb-goals-title">Set Goals</div>

        {/* goal arc wheel */}
        <div
          className={`tsb-wheel${locked ? " disabled" : ""}`}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          {GOALS.map((g, i) => {
            const d = i - pos;
            if (Math.abs(d) > 3.6) return null;
            const sel = !dragging && i === goalIdx;
            const isCustom = typeof g === "string";
            return (
              <div
                key={i}
                data-idx={i}
                className={`tsb-num${sel ? " sel" : ""}`}
                style={{
                  transform: `translate(-50%, 0) translate(${d * SPACING}px, ${d * d * 7}px) rotate(${d * 9}deg)`,
                  opacity: Math.max(0, 1 - Math.abs(d) * 0.18),
                  transition: dragging ? "none" : "transform .25s ease, opacity .25s",
                }}
              >
                {isCustom && <small>{g === "c1" ? "Custom 1" : "Custom 2"}</small>}
                {goalValue(i)}
              </div>
            );
          })}
          <span className="tsb-tick" />
        </div>

        {/* counter tap area */}
        <button className="tsb-counter" onClick={increment} aria-label="Count">
          <svg className="tsb-hill" viewBox="0 0 432 400" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="hillG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#8fe1a6" />
                <stop offset=".45" stopColor="#62d49c" />
                <stop offset="1" stopColor="#45c99a" />
              </linearGradient>
            </defs>
            <path d="M0 40 Q216 -28 432 40 V400 H0Z" fill="url(#hillG)" />
          </svg>
          <span className="tsb-count-wrap">
            <Fingerprint />
            <span key={bump} className="tsb-count">{count}</span>
          </span>
        </button>
      </div>

    </div>

    {/* ================= DESKTOP ================= */}
    <div className="tsd">
      <header className="tsd-nav">
        <div className="tsd-wrap tsd-nav-in">
          <Link href="/" className="tsd-brand">
            <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="19" fill="#1f8a3b" /><circle cx="18" cy="20" r="11" fill="#f3c74b" /><circle cx="22" cy="17.5" r="9.5" fill="#1f8a3b" /><path d="M28 12l1 2.6 2.7.2-2.1 1.7.7 2.6-2.3-1.5-2.3 1.5.7-2.6-2.1-1.7 2.7-.2z" fill="#f3c74b" /></svg>
            Quran
          </Link>
          <nav>
            <Link href="/">Home</Link>
            <Link href="/quran">Read Quran</Link>
            <Link href="#">Prayer Times</Link>
            <Link href="/tasbeeh" className="active">Tasbeeh</Link>
            <Link href="#">Hifz</Link>
            <Link href="#">Duas</Link>
          </nav>
          <button className="tsd-premium">Premium</button>
        </div>
      </header>

      <section className="tsd-band">
        <div className="tsd-wrap">
          <div className="tsd-crumb"><Link href="/">Home</Link><span>/</span>Tasbeeh</div>
          <h1>Digital Tasbeeh</h1>
          <p>Choose a dhikr, set your goal and keep counting. Click the circle or press <kbd>Space</kbd>.</p>
        </div>
      </section>

      <div className="tsd-wrap tsd-grid">
        {/* left: dhikr list */}
        <aside className={`tsd-card tsd-list${locked ? " is-locked" : ""}`}>
          <div className="tsd-card-h">
            <h2>Dhikr</h2>
            <span className="tsd-muted">{DHIKR.length} adhkar</span>
          </div>
          <ul>
            {DHIKR.map((d, i) => (
              <li key={i}>
                <button className={i === dhikr ? "sel" : ""} onClick={() => !locked && setDhikr(i)} disabled={locked && i !== dhikr}>
                  <span className="n">{i + 1}</span>
                  <span className="txt">
                    <span className="a ar" dir="rtl">{d.ar}</span>
                    <span className="t">{d.tr}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* center: counter */}
        <main className="tsd-card tsd-main">
          <div className="tsd-dhikr">
            <div className={`tsd-ar ar${longText ? " long" : ""}`} dir="rtl">{cur.ar}</div>
            <div className="tsd-tr">{cur.tr}</div>
          </div>

          <button className="tsd-ring" onClick={increment} aria-label="Count">
            <svg viewBox="0 0 300 300">
              <defs>
                <linearGradient id="ringG" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#2fbf86" />
                  <stop offset="1" stopColor="#1f8a3b" />
                </linearGradient>
              </defs>
              <circle cx="150" cy="150" r={R} className="track" />
              <circle cx="150" cy="150" r={R} className="bar" stroke="url(#ringG)"
                strokeDasharray={C} strokeDashoffset={C * (1 - progress)} />
            </svg>
            <span className="tsd-ring-in">
              <span key={bump} className="tsd-count">{count}</span>
              <span className="tsd-of">{goal > 0 ? `of ${goal}` : "no limit"}</span>
            </span>
          </button>

          <div className="tsd-controls">
            <button onClick={() => setDialog({ type: "reset" })}><ResetIco /> Reset</button>
            <button onClick={cycleMode}>
              {mode === "mute" ? <MuteIco /> : mode === "sound" ? <SoundIco /> : <VibrateIco />} {modeLabel[mode]}
            </button>
            <button className={locked ? "on" : ""} onClick={() => setLocked((l) => !l)}>
              <LockIco locked={locked} /> {locked ? "Locked" : "Lock"}
            </button>
          </div>

          <div className="tsd-goals">
            <div className="tsd-goals-h">Set Goal</div>
            <div className="tsd-pills">
              {GOALS.map((g, i) => {
                const isCustom = typeof g === "string";
                return (
                  <button key={i} disabled={locked} className={i === goalIdx ? "sel" : ""} onClick={() => selectGoal(i, true)}>
                    {isCustom ? (
                      <><small>{g === "c1" ? "Custom 1" : "Custom 2"}</small>{goalValue(i) || "Set"}</>
                    ) : g}
                  </button>
                );
              })}
            </div>
          </div>
        </main>

        {/* right: virtue + stats */}
        <aside className="tsd-side">
          <div className="tsd-card tsd-virtue">
            <svg className="q" viewBox="0 0 24 24"><path d="M7 7h4v4c0 3-1.5 5-4 6l-.8-1.4C7.7 14.8 8.4 13.6 8.5 12H7zm8 0h4v4c0 3-1.5 5-4 6l-.8-1.4c1.5-.8 2.2-2 2.3-3.6H15z" /></svg>
            <h3>Virtue</h3>
            <p>{cur.virtue}</p>
          </div>
          <div className="tsd-card tsd-stats">
            <h3>Today</h3>
            <div className="row"><span>Total count</span><b>{stats.date === todayKey() ? stats.total : 0}</b></div>
            <div className="row"><span>Goals completed</span><b>{stats.date === todayKey() ? stats.rounds : 0}</b></div>
            <div className="row"><span>Current goal</span><b>{goal > 0 ? goal : "—"}</b></div>
          </div>
          <div className="tsd-card tsd-keys">
            <h3>Shortcuts</h3>
            <div className="row"><kbd>Space</kbd><span>Count</span></div>
            <div className="row"><kbd>Enter</kbd><span>Count</span></div>
          </div>
        </aside>
      </div>
    </div>

      {/* toast */}
      <div className={`tsb-toast${toast ? " show" : ""}`} role="status">
        <span className="tsb-toast-ico"><QuranIcon /></span>
        <span>Goal Reached! Masha Allah, you have achieved your goal. The counter will now be reset.</span>
      </div>

      {/* dialogs */}
      {dialog && (
        <div className="tsb-overlay" onClick={closeDialog}>
          <div className={`tsb-dialog${dialog.type === "exceed" ? " bottom" : ""}`} onClick={(e) => e.stopPropagation()}>
            {dialog.type === "reset" && (
              <>
                <h3>Reset Counter</h3>
                <p className="c">Do you want to reset the counter?</p>
              </>
            )}
            {dialog.type === "exceed" && (
              <>
                <h3>Reset Counter?</h3>
                <p className="c">The current count exceeds or equals the new limit. Do you want to reset the counter?</p>
              </>
            )}
            {dialog.type === "custom" && (
              <>
                <h3>Custom Tasbeeh Limit</h3>
                <label className="tsb-field">
                  <span>Enter Custom Number</span>
                  <div className="tsb-input">
                    <input
                      type="number"
                      inputMode="numeric"
                      autoFocus
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value.replace(/\D/g, "").slice(0, 5))}
                      onKeyDown={(e) => e.key === "Enter" && okDialog()}
                    />
                    {customInput !== "" && (
                      <button type="button" aria-label="Clear" onClick={() => setCustomInput("")}>×</button>
                    )}
                  </div>
                </label>
              </>
            )}
            <div className="tsb-btns">
              <button className="ok" onClick={okDialog}>OK</button>
              <button className="cancel" onClick={closeDialog}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
