"use client";
// Fires prayer + custom alarms while any page of the site is open.
import { useEffect, useState } from "react";
import { loadSettings } from "@/lib/prayerStore";
import { getTimes, nowIn, fmtTime } from "@/lib/prayerEngine";
import { playSound, stopSound } from "@/lib/sounds";

export default function AlarmRunner() {
  const [alert, setAlert] = useState(null);
  useEffect(() => {
    const fired = new Set();
    const check = () => {
      let s;
      try { s = loadSettings(); } catch (e) { return; }
      const now = nowIn(s.loc.tz);
      const t = getTimes(now, s);
      const minute = Math.floor(now.h * 60);
      const due = [];
      Object.entries(s.alarms || {}).forEach(([p, snd]) => {
        if (snd !== "none" && Math.floor(t[p] * 60) === minute) due.push({ key: `p-${p}`, title: p, body: `It's time for ${p} (${fmtTime(t[p])})`, snd });
      });
      (s.custom || []).forEach((a) => {
        if (a.sound === "none" || !(a.repeat || []).includes(now.dow)) return;
        const at = a.ref === "custom" ? a.time : t[a.ref] + (a.off || 0) / 60;
        if (Math.floor(at * 60) === minute) due.push({ key: `c-${a.id}`, title: a.title, body: `${a.title} · ${fmtTime(at)}`, snd: a.sound });
      });
      due.forEach((d) => {
        const k = `${d.key}-${now.y}-${now.m}-${now.d}`;
        if (fired.has(k)) return;
        fired.add(k);
        if (d.snd !== "silent") playSound(d.snd, s.volume, false);
        setAlert(d);
        try {
          if ("Notification" in window && Notification.permission === "granted") new Notification(d.title, { body: d.body });
        } catch (e) {}
      });
    };
    check();
    const id = setInterval(check, 15000);
    return () => clearInterval(id);
  }, []);
  if (!alert) return null;
  return (
    <div className="alarm-pop" role="alert">
      <b>{alert.title}</b>
      <span>{alert.body}</span>
      <button onClick={() => { stopSound(); setAlert(null); }}>Dismiss</button>
    </div>
  );
}
