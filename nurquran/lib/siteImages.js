"use client";
// Pictures uploaded in the admin panel (reciter photos, home-page icons, theme pictures).
// Shows the last known set straight away (saved in this browser), then checks the API for changes.
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/quran/data";

const CACHE = "nq_images";
let mem = null;
let inflight = null;
const subs = new Set();

function readCache() {
  try { const c = JSON.parse(localStorage.getItem(CACHE) || "null"); if (c && c.images) return c.images; } catch (e) {}
  return {};
}
function refresh() {
  if (inflight || !API_URL || (typeof window !== "undefined" && window.__QURAN_BUNDLE__)) return;
  inflight = fetch(`${API_URL}/v1/images`, { cache: "no-store" })
    .then((r) => r.json())
    .then((d) => {
      if (!d || !d.ok) return;
      mem = d.images || {};
      try { localStorage.setItem(CACHE, JSON.stringify({ images: mem })); } catch (e) {}
      subs.forEach((f) => f(mem));
    })
    .catch(() => {});
}

export function useSiteImages() {
  const [imgs, setImgs] = useState(mem || {});
  useEffect(() => {
    if (!mem) { mem = readCache(); setImgs(mem); }
    subs.add(setImgs);
    refresh();
    return () => subs.delete(setImgs);
  }, []);
  return imgs;
}
