"use client";
// Quran font, lines, size, theme and reciter — right on the home page, below the feature icons.
// Uses the same saved settings as the Quran reader, so a change here shows when the Quran is opened.
import { useEffect, useState } from "react";
import { usePrefs } from "@/lib/quran/prefs";
import { supportsColorFont } from "@/lib/quran/mushaf";
import { SettingsCards } from "@/components/quran/SettingsScreen";
import TafsirSection from "@/components/tafsir/TafsirSection";
import GeneralSection from "@/components/GeneralSection";

export default function HomeQuranSettings() {
  const [prefs, save] = usePrefs();
  const [colorOk, setColorOk] = useState(true);
  useEffect(() => { setColorOk(supportsColorFont()); }, []);
  if (!prefs) return <div className="home-qset" />;
  return (
    <div className="home-qset qset">
      <h2 className="sec-title desk-only">Quran settings</h2>
      <SettingsCards prefs={prefs} save={save} colorOk={colorOk} />
      <div className="qset-body tfs-wrap"><TafsirSection prefs={prefs} save={save} /></div>
      <div className="qset-body gen-wrap"><GeneralSection /></div>
    </div>
  );
}
