"use client";
// Reader settings, shared by the Quran reader and the home page (saved in this browser).
import { useCallback, useEffect, useState } from "react";
import { ACTION_LABEL, DEFAULT_ORDER } from "@/components/quran/QIcons";
import { FONTS } from "./mushaf";
import { RECITERS, DEFAULT_RECITER } from "./reciters";

export const PREF_KEY = "quranReader";
const EVT = "nq-prefs";
// Size Adjust 0–100 %  →  text scale (47 % = normal size)
export const sizeScale = (pct) => 0.55 + (pct / 100) * 0.96;

export const PREF_DEFAULTS = {
  order: DEFAULT_ORDER, showTr: false, scrollMin: 60, showProgress: true, quickAction: true,
  bookmarks: [], reading: null, speed: 1, repeat: 1, reciter: DEFAULT_RECITER, bismillah: true,
  qfont: "indopak", lines15: false, pageLines: true, screenOn: true, size: 47, sizeLock: false,
  theme: "green", appearance: "light",
};

export function loadPrefs() {
  try {
    const p = JSON.parse(localStorage.getItem(PREF_KEY) || "null");
    if (p) {
      const order = Array.isArray(p.order) ? p.order.filter((x) => ACTION_LABEL[x]) : DEFAULT_ORDER;
      DEFAULT_ORDER.forEach((x) => { if (!order.includes(x)) order.push(x); });
      const out = { ...PREF_DEFAULTS, ...p, order };
      if (p.size == null && typeof p.font === "number") out.size = Math.round(Math.min(100, Math.max(0, (p.font - 0.55) / 0.0096)));
      if (!FONTS.some((f) => f.id === out.qfont)) out.qfont = "indopak";
      if (!RECITERS.some((r) => r.id === out.reciter) && out.reciter !== "admin") out.reciter = DEFAULT_RECITER;
      return out;
    }
  } catch (e) {}
  return { ...PREF_DEFAULTS };
}

export function usePrefs() {
  const [prefs, setPrefs] = useState(null);
  useEffect(() => {
    setPrefs(loadPrefs());
    const on = (e) => { if (e.type === EVT || e.key === PREF_KEY) setPrefs(loadPrefs()); };
    window.addEventListener("storage", on);
    window.addEventListener(EVT, on);
    return () => { window.removeEventListener("storage", on); window.removeEventListener(EVT, on); };
  }, []);
  const save = useCallback((patch) => {
    setPrefs((p) => {
      const n = { ...p, ...(typeof patch === "function" ? patch(p) : patch) };
      try { localStorage.setItem(PREF_KEY, JSON.stringify(n)); } catch (e) {}
      return n;
    });
  }, []);
  return [prefs, save];
}
