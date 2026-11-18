"use client";
// Shared prayer settings (location, method, alarms...) saved in the browser and synced across components.
import { useEffect, useState, useCallback } from "react";

const KEY = "prayerSettings";
const EVT = "prayer-settings-change";

const DEFAULT_LOCS = {
  "Asia/Dubai": { name: "Abu Dhabi", cc: "AE", lat: 24.4539, lng: 54.3773, tz: "Asia/Dubai" },
  "Asia/Dhaka": { name: "Dhaka", cc: "BD", lat: 23.8103, lng: 90.4125, tz: "Asia/Dhaka" },
  "Asia/Riyadh": { name: "Mecca", cc: "SA", lat: 21.3891, lng: 39.8579, tz: "Asia/Riyadh" },
  "Asia/Karachi": { name: "Karachi", cc: "PK", lat: 24.8607, lng: 67.0011, tz: "Asia/Karachi" },
  "Asia/Kolkata": { name: "Kolkata", cc: "IN", lat: 22.5726, lng: 88.3639, tz: "Asia/Kolkata" },
  "Asia/Kuala_Lumpur": { name: "Kuala Lumpur", cc: "MY", lat: 3.139, lng: 101.6869, tz: "Asia/Kuala_Lumpur" },
  "Europe/London": { name: "London", cc: "GB", lat: 51.5074, lng: -0.1278, tz: "Europe/London" },
};

export const SOUNDS = [
  { id: "none", name: "None", icon: "none" },
  { id: "silent", name: "Silent Notification", icon: "silent" },
  { id: "default", name: "Default Sound", icon: "bell" },
  { id: "beep", name: "Long Beep", icon: "bell" },
  { id: "mishari", name: "Mishari Alafasy", icon: "mosque" },
  { id: "mishari_full", name: "Mishari Alafasy (Full Adhan)", icon: "mosque" },
  { id: "madinah", name: "Madinah", icon: "mosque" },
  { id: "madinah_full", name: "Madinah (Full Adhan)", icon: "mosque" },
  { id: "makkah", name: "Makkah", icon: "mosque" },
  { id: "makkah_full", name: "Makkah (Full Adhan)", icon: "mosque", premium: true },
  { id: "istanbul", name: "Istanbul", icon: "mosque" },
  { id: "istanbul_full", name: "Istanbul (Full Adhan)", icon: "mosque", premium: true },
  { id: "aqsa", name: "Alaqsa Masjid", icon: "mosque" },
  { id: "aqsa_full", name: "Alaqsa Masjid (Full Adhan)", icon: "mosque", premium: true },
];
export const soundById = (id) => SOUNDS.find((s) => s.id === id) || SOUNDS[0];

export function defaultSettings() {
  let tz = "Asia/Dhaka";
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || tz; } catch (e) {}
  const loc = DEFAULT_LOCS[tz] || DEFAULT_LOCS["Asia/Dhaka"];
  return {
    loc: { ...loc, src: "gps" },
    method: "auto",
    asr: "auto",
    hijriAdj: 0,
    alarmMode: false,
    volume: 90,
    advanced: false,
    alarms: { Fajr: "mishari", Sunrise: "none", Zohr: "none", Asr: "default", Maghrib: "none", Isha: "none" },
    custom: [],
  };
}

export function loadSettings() {
  const base = defaultSettings();
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "null");
    if (s && s.loc && isFinite(s.loc.lat)) return { ...base, ...s, alarms: { ...base.alarms, ...(s.alarms || {}) } };
  } catch (e) {}
  return base;
}

export function saveSettings(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
  try { window.dispatchEvent(new CustomEvent(EVT, { detail: s })); } catch (e) {}
}

// React hook: [settings | null (before load), update(patch | fn)]
export function usePrayerSettings() {
  const [settings, setSettings] = useState(null);
  useEffect(() => {
    setSettings(loadSettings());
    const on = (e) => setSettings(e.detail || loadSettings());
    const onStorage = (e) => { if (e.key === KEY) setSettings(loadSettings()); };
    window.addEventListener(EVT, on);
    window.addEventListener("storage", onStorage);
    return () => { window.removeEventListener(EVT, on); window.removeEventListener("storage", onStorage); };
  }, []);
  const update = useCallback((patch) => {
    setSettings((cur) => {
      const base = cur || loadSettings();
      const next = typeof patch === "function" ? patch(base) : { ...base, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);
  return [settings, update];
}

/* ---------- location data (served from /data) ---------- */
const cache = {};
async function getJSON(path) {
  if (cache[path]) return cache[path];
  const base = typeof window !== "undefined" && window.__DATA_BASE__ ? window.__DATA_BASE__ : "/data/";
  const r = await fetch(base + path);
  if (!r.ok) throw new Error("load failed");
  cache[path] = await r.json();
  return cache[path];
}
export const loadCountries = () => getJSON("countries.json");
export async function loadCities(cc) {
  const d = await getJSON(`cities/${cc}.json`);
  return d.c.map(([name, lat, lng, t]) => ({ name, cc, lat, lng, tz: d.tz[t] }));
}
export async function nearestCity(lat, lng) {
  const list = await getJSON("nearest.json");
  let best = null, bd = Infinity;
  for (const [, cc, a, b] of list) {
    const dd = (a - lat) ** 2 + ((b - lng) * Math.cos((lat * Math.PI) / 180)) ** 2;
    if (dd < bd) { bd = dd; best = cc; }
  }
  const cities = await loadCities(best);
  let pick = cities[0], pd = Infinity;
  for (const c of cities) {
    const dd = (c.lat - lat) ** 2 + ((c.lng - lng) * Math.cos((lat * Math.PI) / 180)) ** 2;
    if (dd < pd) { pd = dd; pick = c; }
  }
  return pick;
}
export async function searchAllCities(q) {
  const list = await getJSON("nearest.json");
  const s = q.trim().toLowerCase();
  return list.filter(([n]) => n.toLowerCase().includes(s)).slice(0, 300).map(([name, cc, lat, lng]) => ({ name, cc, lat, lng }));
}
