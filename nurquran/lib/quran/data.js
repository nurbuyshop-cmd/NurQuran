"use client";
// Loads Quran content from the API (apiquran). Shows the cached copy instantly, then checks for updates.
// Falls back to the bundled Al-Fatiha if the API cannot be reached.
import { useEffect, useState } from "react";
import BUNDLED from "./content.json";

// "//host" means: same http/https as the website itself
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "//apiquran.toptol.site").replace(/\/$/, "");
const CACHE = "nq_content";

function readCache() {
  try { const c = JSON.parse(localStorage.getItem(CACHE) || "null"); if (c && Array.isArray(c.pages)) return c; } catch (e) {}
  return null;
}

export function useQuranContent() {
  const [data, setData] = useState({ pages: BUNDLED.pages, settings: null, updatedAt: null, source: "bundled" });
  useEffect(() => {
    const cached = readCache();
    if (cached) setData({ ...cached, source: "cache" });
    let stop = false;
    (async () => {
      try {
        const v = await fetch(`${API_URL}/v1/quran/version`, { cache: "no-store" }).then((r) => r.json());
        if (cached && v.updatedAt === cached.updatedAt) return;
        const d = await fetch(`${API_URL}/v1/quran`).then((r) => r.json());
        if (!d.ok || stop) return;
        const next = { pages: d.pages, settings: d.settings, updatedAt: d.updatedAt };
        try { localStorage.setItem(CACHE, JSON.stringify(next)); } catch (e) {}
        setData({ ...next, source: "api" });
      } catch (e) { /* offline or API down: keep what we have */ }
    })();
    return () => { stop = true; };
  }, []);
  return data;
}
