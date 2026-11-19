"use client";
// "Continue Reading" — the page the visitor was last reading, one tap to open it again.
// The reader saves the position (lastPos) in this browser; /quran reopens at that page.
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePrefs } from "@/lib/quran/prefs";
import { loadIndex, surahOfPage, juzOfPage, TOTAL_PAGES } from "@/lib/quran/mushaf";
import { surah } from "@/lib/quran/meta";

export default function ContinueReading({ className = "" }) {
  const [prefs] = usePrefs();
  const [index, setIndex] = useState(null);
  useEffect(() => { loadIndex().then(setIndex).catch(() => {}); }, []);
  const lp = prefs && prefs.lastPos && prefs.lastPos.page ? prefs.lastPos : null;
  const layout = (lp && lp.layout) || "v2";
  const page = lp ? lp.page : 1;
  const s = index ? surah(surahOfPage(index, layout, page)) : surah(1);
  const juz = index ? juzOfPage(index, layout, page) : 1;
  const pct = lp ? Math.max(1, Math.round((page / TOTAL_PAGES) * 100)) : 0;
  return (
    <div className={`continue ${className}`}>
      <div className="tag">{lp ? "Continue Reading" : "Start Reading"}</div>
      <h3>Surah {s.en} <span className="ar">{s.ar}</span></h3>
      <div className="sub">Page {page} · Juz {juz} · {s.ayahs} Ayahs</div>
      <div className="bar"><i style={{ width: `${pct}%` }} /></div>
      <div className="pct">{lp ? `${pct}% of the Quran · page ${page} of ${TOTAL_PAGES}` : "Begin from Surah Al-Fatiha"}</div>
      <Link href="/quran" className="btn">{lp ? `Continue from page ${page} →` : "Open Quran →"}</Link>
    </div>
  );
}
