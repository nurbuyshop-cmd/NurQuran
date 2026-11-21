"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteLogo from "./SiteLogo";
import HeroScene from "./HeroScene";
import { getPrayerState, fmtTime, fmtGreg, hijriDate } from "@/lib/prayerEngine";
import { usePrayerSettings } from "@/lib/prayerStore";
import { useNotifications } from "@/lib/notifications";

const STRIP_ICONS = {
  Fajr: <path d="M3 17h18M6 17a6 6 0 0112 0M12 5v3M5 9l2 2M19 9l-2 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
  Sunrise: <path d="M3 18h18M7 18a5 5 0 0110 0M12 3v4M9 6l3-3 3 3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
  Zohr: (
    <>
      <circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  Asr: (
    <>
      <circle cx="10" cy="10" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M8 18h10a3 3 0 000-6h-.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  Maghrib: <path d="M3 17h18M7 17a5 5 0 0110 0M12 4v4M9 7l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
  Isha: <path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
};

const NAV = [
  ["Home", "/"],
  ["Read Quran", "/quran"],
  ["Prayer Times", "/prayer-times"],
  ["Hifz", "#"],
  ["Learn Tajweed", "/tajweed"],
  ["Duas", "#"],
];

export default function PrayerHeader() {
  const [settings] = usePrayerSettings();
  const [state, setState] = useState(null);
  const { unread } = useNotifications();

  useEffect(() => {
    if (!settings) return;
    const tick = () => {
      const st = getPrayerState(settings);
      setState({
        ...st,
        gregorian: fmtGreg(st.now),
        hijri: hijriDate(st.now, settings.hijriAdj),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [settings]);

  const s = state;
  // the header sky follows the sun at the chosen city
  const phase = !s ? "night"
    : s.now.h < s.times.Sunrise || s.now.h >= s.times.Maghrib ? "night"
    : s.now.h < s.times.Sunrise + 1 ? "morning"
    : s.now.h >= s.times.Maghrib - 1 ? "evening" : "day";

  return (
    <>
      <header className={`hero ${phase}`}>
        <HeroScene phase={phase} />
        <div className="hero-inner">
          <div className="topbar">
            <Link href="/" className="brand">
              <svg className="back" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 5l-7 7 7 7" />
              </svg>
              <SiteLogo className="logo" />
              Quran
            </Link>

            <nav className="nav-links">
              {NAV.map(([label, href], i) => (
                <Link key={label} href={href} className={i === 0 ? "active" : ""}>{label}</Link>
              ))}
            </nav>

            <div className="tools">
              <Link href="/premium" className="premium">Premium</Link>
              <Link href="/search" className="ico-btn" aria-label="Search">
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                  <circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5L21 21" />
                  <path d="M10.5 7.5v2M9.5 8.5h2" strokeWidth="1.6" /><path d="M8 12.5l1 .2" strokeWidth="1.4" />
                </svg>
              </Link>
              <Link href="/notifications" className="ico-btn bell" aria-label={unread ? `Notifications (${unread} new)` : "Notifications"}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 16V11a6 6 0 0112 0v5l1.5 2h-15z" /><path d="M10 20.5a2 2 0 004 0" />
                </svg>
                {unread > 0 && <i className="badge">{unread > 9 ? "9+" : unread}</i>}
              </Link>
              <Link href="/settings" className="ico-btn" aria-label="Settings">
                <svg viewBox="0 0 24 24" fill="#fff">
                  <path transform="translate(-1 0)" d="M19.4 13a7.6 7.6 0 000-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 00-1.7-1L15 3.3h-4l-.4 2.6a7.4 7.4 0 00-1.7 1l-2.5-1-2 3.5L6.6 11a7.6 7.6 0 000 2l-2.2 1.6 2 3.5 2.5-1a7.4 7.4 0 001.7 1l.4 2.6h4l.4-2.6a7.4 7.4 0 001.7-1l2.5 1 2-3.5zM13 15.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z" />
                </svg>
              </Link>
            </div>
          </div>

          <div className="now">
            <div className="pname">{s ? s.next : " "}</div>
            <div className="ptime">{s ? s.nextTime : " "}</div>
            <Link href="/prayer-times" className="city-chip">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <path d="M12 21s-7-6.2-7-11.5a7 7 0 0114 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" />
              </svg>
              {settings ? `${settings.loc.name}, ${settings.loc.cc}` : "\u00A0"}
            </Link>
          </div>

          <div className="hero-bottom">
            <div className="l">
              <div className="h">{s ? s.hijri : " "}</div>
              <div className="g">{s ? s.gregorian : " "}</div>
            </div>
            <div className="r">
              <div className="h">{s ? s.endsLabel : " "}</div>
              <div className="c">{s ? s.countdown : " "}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop only: all prayer times */}
      <div className="main-top">
        <section className="prayer-strip">
          {["Fajr", "Sunrise", "Zohr", "Asr", "Maghrib", "Isha"].map((k) => (
            <div key={k} className={`pcard${s && s.current === k ? " active" : ""}`}>
              <svg viewBox="0 0 24 24">{STRIP_ICONS[k]}</svg>
              <div className="n">{k}</div>
              <div className="t">{s ? fmtTime(s.times[k], false) : "--:--"}</div>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
