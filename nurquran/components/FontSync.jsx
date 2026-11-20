"use client";
// The Quran font chosen in Settings (Indopak, Mushaf Tajweed, Mushaf, Uthmanic) is used for Arabic text on every page:
// Tasbeeh, Learn Tajweed, search results, home page, the reader's headings... It sets --font-ar and --font-quran on <html>.
// Mushaf and Mushaf Tajweed are page-by-page fonts that only work inside the Mushaf pages, so outside the reader they use
// the closest full font (Amiri Quran for Mushaf, Uthmanic Hafs for Mushaf Tajweed).
import { useEffect } from "react";
import { addStaticFonts } from "@/lib/quran/mushaf";
import { loadPrefs, PREF_KEY } from "@/lib/quran/prefs";

const TAIL = "'Al Majeed Quranic','Amiri Quran','Amiri',serif";
export const TEXT_FONT = {
  indopak: `"NQ IndoPak",${TAIL}`,
  tajweed: `"NQ Uthmanic",${TAIL}`,
  mushaf: `'Amiri Quran',"NQ Uthmanic",${TAIL}`,
  uthmanic: `"NQ Uthmanic",${TAIL}`,
};

export function applyQuranFont(id) {
  if (typeof document === "undefined") return;
  addStaticFonts();
  const f = TEXT_FONT[id] || TEXT_FONT.indopak;
  const r = document.documentElement;
  r.style.setProperty("--font-ar", f);
  r.style.setProperty("--font-quran", f);
  r.dataset.qfont = id in TEXT_FONT ? id : "indopak";
}

export default function FontSync() {
  useEffect(() => {
    const sync = () => { try { applyQuranFont(loadPrefs().qfont); } catch (e) {} };
    sync();
    const onStorage = (e) => { if (!e.key || e.key === PREF_KEY) sync(); };
    window.addEventListener("storage", onStorage);
    window.addEventListener("nq-prefs", sync);
    window.addEventListener("nq-font", sync);
    // settings are saved in this tab without an event in some screens: check again when the page is shown
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      window.removeEventListener("storage", onStorage); window.removeEventListener("nq-prefs", sync); window.removeEventListener("nq-font", sync);
      window.removeEventListener("focus", sync); document.removeEventListener("visibilitychange", sync);
    };
  }, []);
  return null;
}
