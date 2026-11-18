"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PRAYERS, METHODS, methodFor, asrFor, getTimes, getPrayerState, fmtTime, fmtCountdown,
  nowIn, addDays, fmtGregLong, hijriDate, qiblaBearing, bearingText,
} from "@/lib/prayerEngine";
import {
  usePrayerSettings, SOUNDS, soundById, loadCountries, loadCities, nearestCity, searchAllCities,
} from "@/lib/prayerStore";
import { playSound, stopSound } from "@/lib/sounds";
import {
  Back, ChevL, ChevR, Share, Locate, Check, Plus, Gear, QiblaBtnIco, SoundIco,
} from "./PtIcons";
import DesktopNav from "@/components/DesktopNav";

const TITLES = [
  { t: "Tahajud", ref: "Fajr", off: -60 },
  { t: "Ishraq", ref: "Sunrise", off: 15 },
  { t: "Duha / Chasht", ref: "Sunrise", off: 60 },
  { t: "Zawal", ref: "Zohr", off: -10 },
  { t: "Awabeen", ref: "Maghrib", off: 20 },
  { t: "Suhoor", ref: "Fajr", off: -30 },
  { t: "Suhoor End", ref: "Fajr", off: -5 },
  { t: "Iftar", ref: "Maghrib", off: 0 },
];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HIJRI_ADJ = [-2, -1, 0, 1, 2];

const offsetText = (a) => {
  if (a.ref === "custom") return `At ${fmtTime(a.time)}`;
  if (!a.off) return `At ${a.ref}`;
  return `${Math.abs(a.off)} min ${a.off < 0 ? "before" : "after"} ${a.ref}`;
};
const adjText = (n) => (n === 0 ? "None" : `${n > 0 ? "+" : ""}${n} day${Math.abs(n) > 1 ? "s" : ""}`);

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
export default function PrayerTimes() {
  const router = useRouter();
  const [settings, update] = usePrayerSettings();
  const isDesk = useIsDesktop();
  const [stack, setStack] = useState([{ s: "main" }]);
  const [dayOff, setDayOff] = useState(0);
  const [tick, setTick] = useState(0);
  const [dialog, setDialog] = useState(null);
  const [toast, setToast] = useState("");
  const [draft, setDraft] = useState(null); // custom alarm being edited
  const toastT = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => () => stopSound(), []);

  const push = (scr) => setStack((s) => [...s, scr]);
  const pop = () => {
    stopSound();
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  };
  const showToast = (t) => {
    setToast(t);
    clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(""), 2600);
  };

  const data = useMemo(() => {
    if (!settings) return null;
    const st = getPrayerState(settings);
    const date = addDays(st.now, dayOff);
    const times = dayOff === 0 ? st.times : getTimes(date, settings);
    return { st, date, times };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, dayOff, tick]);

  if (!settings || !data) return <div className="pt-root pt-loading" />;
  const { st, date, times } = data;

  /* ---------- actions ---------- */
  const locLabel = `${settings.loc.name}, ${settings.loc.cc}`;
  const methodKey = methodFor(settings);
  const methodLabel = settings.loc.src === "gps" && settings.method === "auto" ? `${METHODS[methodKey].short} ✓` : "Custom";

  const nextOccurrence = (key) => {
    const today = st.times[key];
    if (today > st.now.h) return `Today at ${fmtTime(today)}`;
    return `Tomorrow at ${fmtTime(getTimes(addDays(st.now, 1), settings)[key])}`;
  };

  const share = async () => {
    const lines = PRAYERS.map((p) => `${p}: ${fmtTime(times[p])}`).join("\n");
    const text = `Prayer Times - ${locLabel}\n${fmtGregLong(date)} / ${hijriDate(date, settings.hijriAdj)}\n\n${lines}`;
    try {
      if (navigator.share) { await navigator.share({ title: "Prayer Times", text }); return; }
    } catch (e) { if (e && e.name === "AbortError") return; }
    try { await navigator.clipboard.writeText(text); showToast("Prayer times copied"); }
    catch (e) { showToast("Sharing is not available here"); }
  };

  const locateMe = () => {
    if (!navigator.geolocation) { showToast("Location is not available on this device"); return; }
    setDialog({ type: "updating" });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const c = await nearestCity(pos.coords.latitude, pos.coords.longitude);
          update({ loc: { name: c.name, cc: c.cc, lat: pos.coords.latitude, lng: pos.coords.longitude, tz: c.tz, src: "gps" }, method: "auto" });
          setDialog(null);
        } catch (e) { setDialog(null); showToast("Could not update location"); }
      },
      () => { setDialog(null); showToast("Location permission denied"); },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 }
    );
  };

  const setCity = (c) => {
    update({ loc: { name: c.name, cc: c.cc, lat: c.lat, lng: c.lng, tz: c.tz, src: "manual" } });
    // back to Prayer Settings
    setStack((s) => {
      const i = s.findIndex((x) => x.s === "settings");
      return i >= 0 ? s.slice(0, i + 1) : [{ s: "main" }];
    });
  };

  const openNewAlarm = () => {
    const t0 = TITLES[0];
    setDraft({ id: null, title: t0.t, sound: "default", ref: t0.ref, off: t0.off, time: 4, repeat: [0, 1, 2, 3, 4, 5, 6] });
    push({ s: "custom" });
  };
  const openEditAlarm = (a) => { setDraft({ ...a }); push({ s: "custom" }); };
  const saveDraft = () => {
    const a = { ...draft, id: draft.id || `a${Date.now()}` };
    update((s) => ({ ...s, custom: draft.id ? s.custom.map((x) => (x.id === a.id ? a : x)) : [...s.custom, a] }));
    pop();
  };

  const ctx = {
    settings, update, st, date, times, dayOff, setDayOff, push, pop, setDialog, showToast,
    locLabel, methodLabel, methodKey, nextOccurrence, share, locateMe, setCity, draft, setDraft,
    openNewAlarm, openEditAlarm, saveDraft, router, isDesk, stackLen: stack.length,
  };

  const top = stack[stack.length - 1];
  const screen = (scr) => {
    switch (scr.s) {
      case "alarm": return <AlarmSoundScreen ctx={ctx} target={scr.target} />;
      case "settings": return <SettingsScreen ctx={ctx} />;
      case "locations": return <LocationsScreen ctx={ctx} />;
      case "cities": return <CitiesScreen ctx={ctx} cc={scr.cc} country={scr.name} />;
      case "custom": return <CustomAlarmScreen ctx={ctx} />;
      case "repeat": return <RepeatScreen ctx={ctx} />;
      default: return <MainScreen ctx={ctx} />;
    }
  };

  return (
    <div className="pt-root">
      {isDesk ? (
        <>
          <DesktopView ctx={ctx} />
          {top.s !== "main" && (
            <div className="ptd-modal" onClick={pop}>
              <div className="ptd-panel" onClick={(e) => e.stopPropagation()}>{screen(top)}</div>
            </div>
          )}
        </>
      ) : (
        <div className="pt-phone">{screen(top)}</div>
      )}

      <Dialogs ctx={ctx} dialog={dialog} />
      <div className={`pt-toast${toast ? " show" : ""}`} role="status">{toast}</div>
    </div>
  );
}

/* ===================================================================== */
/* Shared pieces                                                          */
function Bar({ title, onBack, right }) {
  return (
    <div className="pt-bar">
      <button className="pt-back" aria-label="Back" onClick={onBack}><Back /></button>
      <span className="pt-sep" />
      <h1>{title}</h1>
      <div className="pt-bar-r">{right}</div>
    </div>
  );
}

function PrayerList({ ctx, compact }) {
  const { settings, times, st, dayOff, push } = ctx;
  return (
    <div className="pt-list">
      {PRAYERS.map((p) => {
        const isCur = dayOff === 0 && st.current === p;
        const snd = soundById(settings.alarms[p]);
        return (
          <button key={p} className={`pt-row${isCur ? " cur" : ""}`} onClick={() => push({ s: "alarm", target: { kind: "prayer", key: p } })}>
            <span className="nm">{p}</span>
            {isCur && <span className="end">end in {st.countdown}</span>}
            <span className="tm">{fmtTime(times[p])}</span>
            <span className="ic"><SoundIco kind={snd.icon} size={compact ? 24 : 26} /></span>
          </button>
        );
      })}
    </div>
  );
}

function DateNav({ ctx }) {
  const { date, dayOff, setDayOff, settings } = ctx;
  return (
    <div className="pt-date">
      <button aria-label="Previous day" onClick={() => setDayOff(dayOff - 1)}><ChevL /></button>
      <span>
        {fmtGregLong(date)} &nbsp;/&nbsp; {hijriDate(date, settings.hijriAdj)}{dayOff === 0 ? " *" : ""}
      </span>
      <button aria-label="Next day" onClick={() => setDayOff(dayOff + 1)}><ChevR /></button>
    </div>
  );
}

function CustomAlarmCards({ ctx }) {
  const { settings, openEditAlarm } = ctx;
  if (!settings.custom.length) return <div className="pt-card pt-noalarm">No Custom Alarms</div>;
  return (
    <div className="pt-card pt-alarms">
      {settings.custom.map((a) => (
        <button key={a.id} className="pt-alarm" onClick={() => openEditAlarm(a)}>
          <span className="t">{a.title}</span>
          <span className="o">{offsetText(a)}</span>
          <span className="ic"><SoundIco kind={soundById(a.sound).icon} /></span>
        </button>
      ))}
    </div>
  );
}

/* ===================================================================== */
/* Screens                                                                */
function MainScreen({ ctx }) {
  const { router, push, share, locateMe, locLabel, methodLabel, settings, setDialog, openNewAlarm } = ctx;
  return (
    <div className="pt-screen">
      <Bar
        title="Prayer Times"
        onBack={() => (history.length > 1 ? router.back() : router.push("/"))}
        right={
          <>
            <button aria-label="Share" onClick={share}><Share /></button>
            <button aria-label="Update location" onClick={locateMe}><Locate /></button>
          </>
        }
      />
      <div className="pt-body">
        <div className="pt-info">
          <Link href="/qibla" className="pt-info-btn"><span className="i"><QiblaBtnIco /></span>Qibla</Link>
          <button className="pt-info-mid" onClick={() => push({ s: "settings" })}>
            <b>{locLabel}</b><span>{methodLabel}</span>
          </button>
          <button className="pt-info-btn" onClick={() => push({ s: "settings" })}><span className="i gear"><Gear /></span>Settings</button>
        </div>

        <DateNav ctx={ctx} />
        <p className="pt-hnote">Hijri date is an approximated value. <button className="lnk" onClick={() => setDialog({ type: "hijri" })}>Set the offset</button></p>

        <div className="pt-card"><PrayerList ctx={ctx} /></div>

        <button className="pt-link center" onClick={() => push({ s: "alarm", target: { kind: "prayer", key: ctx.st.next } })}>Alarm Settings</button>

        {settings.loc.src === "gps" && (
          <>
            <div className="pt-widget-btns">
              <button onClick={() => setDialog({ type: "widget" })}>Add Widget</button>
              <button onClick={() => setDialog({ type: "notif" })}>Fix notification delay</button>
            </div>
            <p className="pt-wnote">* Prayer times widget can also be added to home screen</p>
          </>
        )}

        <p className="pt-imp"><button className="lnk" onClick={() => setDialog({ type: "note" })}>Important Note/Contact us</button> regarding prayer times</p>

        <CustomAlarmCards ctx={ctx} />
        <div className="pt-add-wrap"><button className="pt-add" onClick={openNewAlarm}><Plus /> Alarm</button></div>
      </div>
    </div>
  );
}

function AlarmSoundScreen({ ctx, target }) {
  const { settings, update, pop, draft, setDraft, nextOccurrence, setDialog } = ctx;
  const cur = target.kind === "prayer" ? settings.alarms[target.key] : draft?.sound;
  const [flash, setFlash] = useState(null);
  const choose = (s) => {
    if (s.premium) { setDialog({ type: "premium" }); return; }
    setFlash(s.id);
    setTimeout(() => setFlash(null), 350);
    if (target.kind === "prayer") update((st) => ({ ...st, alarms: { ...st.alarms, [target.key]: s.id } }));
    else setDraft((d) => ({ ...d, sound: s.id }));
    playSound(s.id, settings.volume, true);
  };
  return (
    <div className="pt-screen">
      <Bar title="Alarm Settings" onBack={pop} />
      <div className="pt-body flush">
        <div className="pt-card pt-sounds">
          {SOUNDS.map((s) => (
            <button key={s.id} className={`pt-snd${s.premium ? " dim" : ""}${flash === s.id ? " flash" : ""}`} onClick={() => choose(s)}>
              <SoundIco kind={s.icon} size={28} />
              <span>{s.name}</span>
              {cur === s.id && <span className="ck"><Check /></span>}
            </button>
          ))}
        </div>
        {target.kind === "prayer" && (
          <div className="pt-notify-foot">
            <div className="r"><span>Notify At</span><span>{target.key}</span></div>
            <div className="s">{nextOccurrence(target.key)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function Toggle({ on, onChange, label }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} className={`pt-tg${on ? " on" : ""}`} onClick={() => onChange(!on)}>
      <i />
    </button>
  );
}

function SettingsScreen({ ctx }) {
  const { settings, update, pop, push, setDialog, st, locLabel, methodKey } = ctx;
  return (
    <div className="pt-screen">
      <Bar title="Prayer Settings" onBack={pop} />
      <div className="pt-body">
        <div className="pt-card pt-set">
          <button className="pt-set-row" onClick={() => push({ s: "locations" })}>
            <span className="l"><b>Current Location</b><small>{locLabel}</small></span>
            <ChevR />
          </button>
          <button className="pt-set-row" onClick={() => setDialog({ type: "hijri" })}>
            <span className="l"><b>Hijri Date Adjustment</b><small>{hijriDate(st.now, settings.hijriAdj)}</small></span>
            <span className="v">{adjText(settings.hijriAdj)}</span><ChevR />
          </button>
          <div className="pt-set-row in">
            <span className="l"><b>Alarm mode for Adhan</b><small>Alarm can play even in silent mode</small></span>
            <Toggle label="Alarm mode for Adhan" on={settings.alarmMode} onChange={(v) => update({ alarmMode: v })} />
          </div>
          <div className="pt-set-row in col">
            <span className="l"><b>Adhan Alarm Volume</b></span>
            <input type="range" min="0" max="100" value={settings.volume} className="pt-range"
              style={{ "--p": `${settings.volume}%` }}
              onChange={(e) => update({ volume: +e.target.value })}
              onMouseUp={() => playSound("default", settings.volume)} onTouchEnd={() => playSound("default", settings.volume)} />
          </div>
        </div>

        <div className="pt-card pt-set">
          <div className="pt-set-row">
            <span className="l"><b>Advanced Settings</b></span>
            <Toggle label="Advanced Settings" on={settings.advanced} onChange={(v) => update({ advanced: v })} />
          </div>
          {settings.advanced && (
            <>
              <button className="pt-set-row" onClick={() => setDialog({ type: "method" })}>
                <span className="l"><b>Calculation Method</b><small>{settings.method === "auto" ? `Automatic (${METHODS[methodKey].name})` : METHODS[methodKey].name}</small></span>
                <ChevR />
              </button>
              <button className="pt-set-row" onClick={() => setDialog({ type: "asr" })}>
                <span className="l"><b>Asr Calculation</b><small>{settings.asr === "auto" ? "Automatic" : ""}{settings.asr === "auto" ? ` (${asrFor(settings) === 2 ? "Hanafi" : "Standard"})` : asrFor(settings) === 2 ? "Hanafi" : "Standard (Shafi, Maliki, Hanbali)"}</small></span>
                <ChevR />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Letters({ items, render }) {
  const out = [];
  let last = "";
  items.forEach((it, i) => {
    const L = (it.label[0] || "#").toUpperCase();
    if (L !== last) { out.push(<div key={`h${L}${i}`} className="pt-letter">{L}</div>); last = L; }
    out.push(render(it, i));
  });
  return out;
}

function LocationsScreen({ ctx }) {
  const { pop, push, locateMe, setCity } = ctx;
  const [countries, setCountries] = useState(null);
  const [q, setQ] = useState("");
  const [all, setAll] = useState(null); // results from "search all cities"
  useEffect(() => { loadCountries().then(setCountries).catch(() => setCountries([])); }, []);
  const filtered = (countries || []).filter(([, n]) => n.toLowerCase().includes(q.trim().toLowerCase()));
  const searchAll = async () => {
    if (!q.trim()) return;
    setAll("loading");
    try {
      const res = await searchAllCities(q);
      const names = Object.fromEntries(countries || []);
      setAll(res.map((c) => ({ ...c, country: names[c.cc] || c.cc })));
    } catch (e) { setAll([]); }
  };
  const pickGlobal = async (c) => {
    const list = await loadCities(c.cc);
    const hit = list.find((x) => x.name === c.name) || list[0];
    setCity({ ...hit, lat: c.lat, lng: c.lng });
  };
  return (
    <div className="pt-screen">
      <Bar title="Locations" onBack={pop} right={<button aria-label="Use my location" onClick={locateMe}><Locate /></button>} />
      <div className="pt-loc">
        <form onSubmit={(e) => { e.preventDefault(); searchAll(); }}>
          <input className="pt-search" type="search" placeholder="Search" value={q} enterKeyHint="search"
            onChange={(e) => { setQ(e.target.value); setAll(null); }} />
        </form>
        {Array.isArray(all) ? (
          <>
            <div className="pt-cap">{all.length} CITIES FOUND</div>
            <div className="pt-loclist">
              {all.map((c, i) => (
                <button key={i} className="pt-locitem" onClick={() => pickGlobal(c)}>{c.name}, {c.country}</button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="pt-cap">{q ? "TAP SEARCH FOR SEARCHING IN ALL CITIES OR SELECT THE DESIRED COUNTRY" : "SELECT THE DESIRED COUNTRY OR FILTER LIST USING SEARCH"}</div>
            <div className="pt-loclist">
              {all === "loading" && <div className="pt-locitem muted">Searching…</div>}
              {!countries && <div className="pt-locitem muted">Loading…</div>}
              {q ? (
                filtered.map(([cc, n]) => (
                  <button key={cc} className="pt-locitem" onClick={() => push({ s: "cities", cc, name: n })}>{n}</button>
                ))
              ) : (
                <Letters items={filtered.map(([cc, n]) => ({ cc, label: n }))}
                  render={(it) => <button key={it.cc} className="pt-locitem" onClick={() => push({ s: "cities", cc: it.cc, name: it.label })}>{it.label}</button>} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CitiesScreen({ ctx, cc, country }) {
  const { pop, locateMe, setCity } = ctx;
  const [cities, setCities] = useState(null);
  const [q, setQ] = useState("");
  useEffect(() => { loadCities(cc).then(setCities).catch(() => setCities([])); }, [cc]);
  const list = (cities || []).filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <div className="pt-screen">
      <Bar title={country} onBack={pop} right={<button aria-label="Use my location" onClick={locateMe}><Locate /></button>} />
      <div className="pt-loc">
        <input className="pt-search" type="search" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="pt-cap">{cities ? `${list.length} CITIES FOUND` : "LOADING…"}</div>
        <div className="pt-loclist">
          <Letters items={list.map((c) => ({ ...c, label: c.name }))}
            render={(c, i) => <button key={c.name + i} className="pt-locitem" onClick={() => setCity(c)}>{c.name}, {country}</button>} />
        </div>
      </div>
    </div>
  );
}

function CustomAlarmScreen({ ctx }) {
  const { draft, pop, push, saveDraft, setDialog } = ctx;
  if (!draft) return null;
  return (
    <div className="pt-screen">
      <Bar title="Prayer Times" onBack={pop} right={<button className="pt-save" onClick={saveDraft}>SAVE</button>} />
      <div className="pt-body pt-form">
        <h3>Title</h3>
        <button className="pt-field" onClick={() => setDialog({ type: "title" })}><span>{draft.title}</span><ChevR /></button>
        <h3>Sound</h3>
        <button className="pt-field" onClick={() => push({ s: "alarm", target: { kind: "custom" } })}><span>{soundById(draft.sound).name}</span><ChevR /></button>
        <h3>Notify At</h3>
        <div className="pt-field-group">
          <button className="pt-field" onClick={() => setDialog({ type: "notifyAt" })}><span>{draft.ref === "custom" ? "Custom Time" : draft.ref}</span><ChevR /></button>
          <button className="pt-field" onClick={() => setDialog(draft.ref === "custom" ? { type: "customTime" } : { type: "offset" })}><span>{offsetText(draft)}</span><ChevR /></button>
        </div>
        <button className="pt-field mt" onClick={() => push({ s: "repeat" })}>
          <span>Repeat</span><span className="pt-sub">{repeatText(draft.repeat)}</span><ChevR />
        </button>
        {draft.id && <button className="pt-del" onClick={() => setDialog({ type: "delete" })}>Delete Alarm</button>}
      </div>
    </div>
  );
}
const repeatText = (r) => (!r?.length ? "Never" : r.length === 7 ? "Every Day" : r.map((d) => DAYS[d].slice(0, 3)).join(", "));

function RepeatScreen({ ctx }) {
  const { draft, setDraft, pop } = ctx;
  const r = draft?.repeat || [];
  const all = r.length === 7;
  const toggle = (d) => setDraft((x) => ({ ...x, repeat: x.repeat.includes(d) ? x.repeat.filter((y) => y !== d) : [...x.repeat, d].sort() }));
  return (
    <div className="pt-screen">
      <Bar title="Repeat" onBack={pop} />
      <div className="pt-body flush">
        <div className="pt-card pt-repeat">
          <button onClick={() => setDraft((x) => ({ ...x, repeat: all ? [] : [0, 1, 2, 3, 4, 5, 6] }))}>
            <span>Every Day</span>{all && <span className="ck"><Check /></span>}
          </button>
          {DAYS.map((d, i) => (
            <button key={d} onClick={() => toggle(i)}>
              <span>Every {d}</span>{r.includes(i) && <span className="ck"><Check /></span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ===================================================================== */
/* Dialogs                                                                */
function NumberWheel({ value, onChange, max = 180 }) {
  const drag = useRef(null);
  const set = (v) => onChange(Math.max(0, Math.min(max, v)));
  return (
    <div className="pt-wheel"
      onWheel={(e) => set(value + (e.deltaY > 0 ? 1 : -1))}
      onPointerDown={(e) => { drag.current = { y: e.clientY, v: value }; e.currentTarget.setPointerCapture?.(e.pointerId); }}
      onPointerMove={(e) => { if (drag.current) set(drag.current.v - Math.round((e.clientY - drag.current.y) / 22)); }}
      onPointerUp={() => (drag.current = null)}
      onKeyDown={(e) => { if (e.key === "ArrowUp") set(value - 1); if (e.key === "ArrowDown") set(value + 1); }}
      tabIndex={0} role="spinbutton" aria-valuenow={value}>
      <button className="pv" onClick={() => set(value - 1)}>{value > 0 ? value - 1 : ""}</button>
      <div className="cv">{value}</div>
      <button className="pv" onClick={() => set(value + 1)}>{value < max ? value + 1 : ""}</button>
    </div>
  );
}

function Dialogs({ ctx, dialog }) {
  const { setDialog, settings, update, draft, setDraft, st, showToast } = ctx;
  const [sel, setSel] = useState(null);
  const [text, setText] = useState("");
  const [mins, setMins] = useState(0);
  const [dir, setDir] = useState("before");
  useEffect(() => {
    if (!dialog) return;
    if (dialog.type === "hijri") setSel(settings.hijriAdj);
    if (dialog.type === "method") setSel(settings.method);
    if (dialog.type === "asr") setSel(settings.asr);
    if (dialog.type === "title") setSel(TITLES.some((x) => x.t === draft?.title) ? draft.title : "__custom");
    if (dialog.type === "notifyAt") setSel(draft?.ref);
    if (dialog.type === "offset") { setMins(Math.abs(draft?.off || 0)); setDir((draft?.off || 0) > 0 ? "after" : "before"); }
    if (dialog.type === "customTitle") setText(TITLES.some((x) => x.t === draft?.title) ? "" : draft?.title || "");
    if (dialog.type === "customTime") {
      const h = draft?.time ?? 4;
      setText(`${String(Math.floor(h)).padStart(2, "0")}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialog]);
  if (!dialog) return null;
  const close = () => setDialog(null);
  const Btns = ({ onOk, ok = "DONE" }) => (
    <div className="pt-dbtns"><button onClick={close}>CANCEL</button><button onClick={onOk}>{ok}</button></div>
  );
  const List = ({ items }) => (
    <div className="pt-dlist">
      {items.map(([v, label]) => (
        <button key={String(v)} className={sel === v ? "sel" : ""} onClick={() => setSel(v)}>
          {label}{sel === v && <span className="ck"><Check /></span>}
        </button>
      ))}
    </div>
  );
  let body = null;
  switch (dialog.type) {
    case "updating":
      body = <div className="pt-d pt-d-plain"><p className="big">Updating Location...</p></div>;
      break;
    case "hijri":
      body = (
        <div className="pt-d">
          <h3>Hijri Date Adjustment</h3>
          <List items={HIJRI_ADJ.map((n) => [n, `${adjText(n)}  ·  ${hijriDate(st.now, n)}`])} />
          <Btns onOk={() => { update({ hijriAdj: sel }); close(); }} />
        </div>
      );
      break;
    case "method":
      body = (
        <div className="pt-d">
          <h3>Calculation Method</h3>
          <List items={[["auto", "Automatic (by country)"], ...Object.entries(METHODS).map(([k, m]) => [k, m.name])]} />
          <Btns onOk={() => { update({ method: sel }); close(); }} />
        </div>
      );
      break;
    case "asr":
      body = (
        <div className="pt-d">
          <h3>Asr Calculation</h3>
          <List items={[["auto", "Automatic (by country)"], [1, "Standard (Shafi, Maliki, Hanbali)"], [2, "Hanafi"]]} />
          <Btns onOk={() => { update({ asr: sel }); close(); }} />
        </div>
      );
      break;
    case "title":
      body = (
        <div className="pt-d">
          <h3>Title</h3>
          <List items={[...TITLES.map((x) => [x.t, x.t]), ["__custom", "Custom Title"]]} />
          <Btns onOk={() => {
            if (sel === "__custom") { setDialog({ type: "customTitle" }); return; }
            const t = TITLES.find((x) => x.t === sel);
            setDraft((d) => ({ ...d, title: t.t, ref: t.ref, off: t.off }));
            close();
          }} />
        </div>
      );
      break;
    case "customTitle":
      body = (
        <div className="pt-d">
          <h3>Custom Title</h3>
          <label className="pt-in"><span>Enter Title</span>
            <input autoFocus value={text} maxLength={40} onChange={(e) => setText(e.target.value)} />
          </label>
          <Btns onOk={() => { if (text.trim()) setDraft((d) => ({ ...d, title: text.trim() })); close(); }} />
        </div>
      );
      break;
    case "notifyAt":
      body = (
        <div className="pt-d">
          <h3>Notify At</h3>
          <List items={[...PRAYERS.map((p) => [p, p]), ["custom", "Custom Time"]]} />
          <Btns onOk={() => {
            setDraft((d) => ({ ...d, ref: sel }));
            if (sel === "custom") setDialog({ type: "customTime" }); else close();
          }} />
        </div>
      );
      break;
    case "offset": {
      const base = st.times[draft.ref] ?? 0;
      const at = base + ((dir === "before" ? -1 : 1) * mins) / 60;
      body = (
        <div className="pt-d pt-d-off">
          <h3 className="lg">{draft.ref} {fmtTime(at)}</h3>
          <div className="pt-off">
            <NumberWheel value={mins} onChange={setMins} />
            <span className="mn">Minutes</span>
            <div className="pt-ba">
              <button className={dir === "before" ? "on" : ""} onClick={() => setDir("before")}>Before</button>
              <button className={dir === "after" ? "on" : ""} onClick={() => setDir("after")}>After</button>
            </div>
          </div>
          <Btns ok="OK" onOk={() => { setDraft((d) => ({ ...d, off: dir === "before" ? -mins : mins })); close(); }} />
        </div>
      );
      break;
    }
    case "customTime":
      body = (
        <div className="pt-d">
          <h3>Custom Time</h3>
          <label className="pt-in"><span>Select time</span>
            <input type="time" autoFocus value={text} onChange={(e) => setText(e.target.value)} />
          </label>
          <Btns ok="OK" onOk={() => {
            const [h, m] = (text || "04:00").split(":").map(Number);
            setDraft((d) => ({ ...d, ref: "custom", time: h + m / 60, off: 0 }));
            close();
          }} />
        </div>
      );
      break;
    case "delete":
      body = (
        <div className="pt-d">
          <h3>Delete Alarm</h3>
          <p className="msg">Do you want to delete this alarm?</p>
          <div className="pt-dbtns"><button onClick={close}>CANCEL</button><button onClick={() => ctx.draft && ctxDelete(ctx)}>DELETE</button></div>
        </div>
      );
      break;
    case "note":
      body = (
        <div className="pt-d">
          <h3>Important Note</h3>
          <p className="msg left">
            Prayer times are calculated from your location using the selected calculation method. They can differ by a few
            minutes from your local mosque. Please follow your local mosque or official authority timetable where available.
            You can change the method and Asr calculation from Settings → Advanced Settings.
          </p>
          <div className="pt-dbtns"><button onClick={close}>OK</button></div>
        </div>
      );
      break;
    case "widget":
      body = (
        <div className="pt-d">
          <h3>Add Widget</h3>
          <p className="msg left">
            To keep prayer times on your home screen, open your browser menu and choose <b>&quot;Add to Home screen&quot;</b>.
            A full home-screen widget will be available in our mobile app.
          </p>
          <div className="pt-dbtns"><button onClick={close}>OK</button></div>
        </div>
      );
      break;
    case "notif":
      body = (
        <div className="pt-d">
          <h3>Notifications</h3>
          <p className="msg left">
            Allow notifications so alarms can alert you on time while this website is open. Background alarms (when the
            site is closed) will be available in our mobile app.
          </p>
          <div className="pt-dbtns">
            <button onClick={close}>CANCEL</button>
            <button onClick={async () => {
              close();
              try {
                const p = await Notification.requestPermission();
                showToast(p === "granted" ? "Notifications enabled" : "Notifications are blocked");
              } catch (e) { showToast("Notifications are not supported here"); }
            }}>ALLOW</button>
          </div>
        </div>
      );
      break;
    case "premium":
      body = (
        <div className="pt-d">
          <h3>Premium</h3>
          <p className="msg">This adhan is available with Quran Premium.</p>
          <div className="pt-dbtns"><button onClick={close}>OK</button></div>
        </div>
      );
      break;
    default:
      body = null;
  }
  return (
    <div className="pt-overlay" onClick={dialog.type === "updating" ? undefined : close}>
      <div onClick={(e) => e.stopPropagation()}>{body}</div>
    </div>
  );
}
function ctxDelete(ctx) {
  ctx.update((s) => ({ ...s, custom: s.custom.filter((x) => x.id !== ctx.draft.id) }));
  ctx.setDialog(null);
  ctx.pop();
}

/* ===================================================================== */
/* Desktop                                                                */
function DesktopView({ ctx }) {
  const { settings, st, times, dayOff, push, share, locateMe, locLabel, setDialog, openNewAlarm, openEditAlarm } = ctx;
  const bearing = qiblaBearing(settings.loc.lat, settings.loc.lng);
  const nextT = st.nextAt;
  // progress of the current period (prev prayer -> next prayer)
  const order = ["Fajr", "Zohr", "Asr", "Maghrib", "Isha"];
  const idx = order.indexOf(st.next);
  const prevAt = idx > 0 ? st.times[order[idx - 1]] : st.times.Isha - 24;
  const span = Math.max(0.01, nextT - prevAt);
  const prog = Math.min(1, Math.max(0, (st.now.h - (st.now.h < prevAt ? prevAt - 24 : prevAt)) / span));
  return (
    <div className="ptd">
      <DesktopNav active="Prayer Times" />
      <section className="ptd-band">
        <div className="ptd-wrap">
          <div className="ptd-crumb"><Link href="/">Home</Link><span>/</span>Prayer Times</div>
          <div className="ptd-band-row">
            <div>
              <h1>Prayer Times</h1>
              <button className="ptd-loc" onClick={() => push({ s: "locations" })}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0114 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
                {locLabel} <span className="m">· {ctx.methodLabel}</span> <span className="chg">Change</span>
              </button>
            </div>
            <div className="ptd-actions">
              <button onClick={locateMe}><Locate /> Use my location</button>
              <button onClick={share}><Share /> Share</button>
              <button onClick={() => push({ s: "settings" })}><Gear /> Settings</button>
            </div>
          </div>
        </div>
      </section>

      <div className="ptd-wrap ptd-grid">
        <div className="ptd-colmain">
          <div className="ptd-card ptd-next">
            <div>
              <div className="lbl">Next prayer</div>
              <div className="nm">{st.next}</div>
              <div className="tm">{fmtTime(nextT)}</div>
            </div>
            <div className="right">
              <div className="lbl">{st.endsLabel}</div>
              <div className="cd">{st.countdown}</div>
              <div className="bar"><i style={{ width: `${prog * 100}%` }} /></div>
            </div>
          </div>

          <div className="ptd-card ptd-table">
            <div className="ptd-table-h">
              <DateNav ctx={ctx} />
              <p className="pt-hnote">Hijri date is an approximated value. <button className="lnk" onClick={() => setDialog({ type: "hijri" })}>Set the offset</button></p>
            </div>
            <div className="ptd-rows">
              {PRAYERS.map((p) => {
                const isCur = dayOff === 0 && st.current === p;
                const snd = soundById(settings.alarms[p]);
                return (
                  <div key={p} className={`ptd-row${isCur ? " cur" : ""}`}>
                    <span className="nm">{p}{isCur && <em>Now</em>}</span>
                    <span className="tm">{fmtTime(times[p])}</span>
                    <button className="snd" onClick={() => push({ s: "alarm", target: { kind: "prayer", key: p } })}>
                      <SoundIco kind={snd.icon} size={22} /> <span>{snd.name}</span>
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="pt-imp"><button className="lnk" onClick={() => setDialog({ type: "note" })}>Important Note/Contact us</button> regarding prayer times</p>
          </div>
        </div>

        <aside className="ptd-side">
          <Link href="/qibla" className="ptd-card ptd-qibla">
            <div className="dial" style={{ "--b": `${bearing}deg` }}>
              <span className="n">N</span><i className="needle" /><span className="k"><QiblaBtnIco /></span>
            </div>
            <div>
              <div className="lbl">Qibla direction</div>
              <b>{bearing.toFixed(1)}°</b>
              <small>{bearingText(bearing)}</small>
              <span className="go">Open compass →</span>
            </div>
          </Link>

          <div className="ptd-card ptd-alarms">
            <div className="h"><h3>Custom Alarms</h3><button className="pt-add sm" onClick={openNewAlarm}><Plus /> Alarm</button></div>
            {settings.custom.length ? settings.custom.map((a) => (
              <button key={a.id} className="ptd-alarm" onClick={() => openEditAlarm(a)}>
                <SoundIco kind={soundById(a.sound).icon} size={24} />
                <span className="t"><b>{a.title}</b><small>{offsetText(a)} · {repeatText(a.repeat)}</small></span>
              </button>
            )) : <p className="empty">No Custom Alarms</p>}
          </div>

          <div className="ptd-card ptd-info">
            <h3>Calculation</h3>
            <div className="row"><span>Method</span><b>{METHODS[ctx.methodKey].short}</b></div>
            <div className="row"><span>Asr</span><b>{asrFor(settings) === 2 ? "Hanafi" : "Standard"}</b></div>
            <div className="row"><span>Hijri adjustment</span><b>{adjText(settings.hijriAdj)}</b></div>
            <button className="ptd-more" onClick={() => push({ s: "settings" })}>Open Prayer Settings</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
