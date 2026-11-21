"use client";
// Things set in the admin panel that the website shows: uploaded pictures (reciter photos, home-page icons,
// theme pictures) and the reciter list (order, hidden reciters, default reciter).
// Shows the last known copy straight away (saved in this browser), then checks the API for changes.
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/quran/data";
import { setSoundOverrides } from "@/lib/sounds";

const CACHE = "nq_site";
const EMPTY = { siteName: "", images: {}, reciters: null, tajweed: null, tajweedAudio: {}, tajweedLessons: null, adhan: null, tafsir: null, general: null };
let mem = null;
let inflight = null;
const subs = new Set();

function readCache() {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE) || "null");
    if (c && c.images) return { ...EMPTY, ...c };
    const old = JSON.parse(localStorage.getItem("nq_images") || "null"); // earlier version
    if (old && old.images) return { ...EMPTY, images: old.images };
  } catch (e) {}
  return EMPTY;
}
function refresh() {
  if (inflight || !API_URL || (typeof window !== "undefined" && window.__QURAN_BUNDLE__)) return;
  inflight = fetch(`${API_URL}/v1/site`, { cache: "no-store" })
    .then((r) => r.json())
    .then((d) => {
      if (!d || !d.ok) return;
      mem = { siteName: d.siteName || "", images: d.images || {}, reciters: d.reciters || null, tajweed: d.tajweed || null, tajweedAudio: d.tajweedAudio || {},
        tajweedLessons: d.tajweedLessons || null, adhan: d.adhan || null, tafsir: d.tafsir || null, general: d.general || null };
      setSoundOverrides(mem.adhan && mem.adhan.audio);
      try { localStorage.setItem(CACHE, JSON.stringify(mem)); } catch (e) {}
      subs.forEach((f) => f(mem));
    })
    .catch(() => {});
}

export function useSiteConfig() {
  const [cfg, setCfg] = useState(mem || EMPTY);
  useEffect(() => {
    if (!mem) { mem = readCache(); setSoundOverrides(mem.adhan && mem.adhan.audio); setCfg(mem); }
    subs.add(setCfg);
    refresh();
    return () => subs.delete(setCfg);
  }, []);
  return cfg;
}
export const useSiteImages = () => useSiteConfig().images;
