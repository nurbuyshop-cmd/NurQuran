"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePrayerSettings } from "@/lib/prayerStore";
import { qiblaBearing, bearingText, distanceToKaaba } from "@/lib/prayerEngine";
import { Back, PrayersBtnIco } from "./PtIcons";
import DesktopNav from "@/components/DesktopNav";

function Rug() {
  return (
    <svg viewBox="0 0 80 130" className="qb-rug" aria-hidden="true">
      <g stroke="#e8d7b0" strokeWidth="1" opacity=".9">
        {Array.from({ length: 9 }).map((_, i) => <path key={i} d={`M${12 + i * 7} 123v6M${12 + i * 7} 1v6`} />)}
      </g>
      <rect x="6" y="6" width="68" height="118" rx="3" fill="#6b2f1f" />
      <rect x="9" y="9" width="62" height="112" rx="2" fill="none" stroke="#d9b56b" strokeWidth="2" />
      <rect x="13" y="13" width="54" height="104" fill="#3d4a2c" />
      <rect x="13" y="13" width="54" height="104" fill="none" stroke="#a5703c" strokeWidth="3" strokeDasharray="4 3" />
      <path d="M20 112V50c0-14 10-24 20-30 10 6 20 16 20 30v62z" fill="#7a2e22" stroke="#d9b56b" strokeWidth="1.6" />
      <path d="M26 106V54c0-9 6-16 14-21 8 5 14 12 14 21v52z" fill="#2f3f2a" stroke="#c4974f" strokeWidth="1" />
      <circle cx="40" cy="62" r="6" fill="none" stroke="#d9b56b" strokeWidth="1.4" />
      <path d="M40 72v26M33 85h14" stroke="#c4974f" strokeWidth="1.2" />
      <path d="M40 20l3 4-3 4-3-4z" fill="#d9b56b" />
    </svg>
  );
}
function Kaaba() {
  return (
    <svg viewBox="0 0 30 30" className="qb-kaaba" aria-hidden="true">
      <path d="M4 10l11-5 11 5v12l-11 5-11-5z" fill="#141414" />
      <path d="M4 10l11 5 11-5" fill="none" stroke="#3a3a3a" strokeWidth="1" />
      <path d="M4 13l11 5 11-5" fill="none" stroke="#e1b23a" strokeWidth="2" />
      <path d="M15 15v12" stroke="#3a3a3a" strokeWidth=".8" />
    </svg>
  );
}

export function Compass({ bearing, heading }) {
  const rot = -(heading || 0);
  return (
    <div className="qb-compass" style={{ "--rot": `${rot}deg`, "--b": `${bearing}deg` }}>
      <div className="qb-dial">
        {["N", "E", "S", "W"].map((l, i) => (
          <span key={l} className="qb-dir" style={{ transform: `rotate(${i * 90}deg) translateY(calc(-1 * var(--r) - 22px))` }}>{l}</span>
        ))}
        <div className="qb-disc">
          {Array.from({ length: 36 }).map((_, i) => (
            <i key={i} className={i % 3 === 0 ? "maj" : ""} style={{ transform: `rotate(${i * 10}deg)` }} />
          ))}
        </div>
        <div className="qb-point">
          <Rug />
          <span className="qb-kaaba-wrap"><Kaaba /></span>
        </div>
      </div>
    </div>
  );
}

export default function Qibla() {
  const router = useRouter();
  const [settings] = usePrayerSettings();
  const [useCompass, setUseCompass] = useState(false);
  const [heading, setHeading] = useState(null);
  const [msg, setMsg] = useState("");
  const handler = useRef(null);

  useEffect(() => () => stop(), []);
  function stop() {
    if (handler.current) {
      window.removeEventListener("deviceorientationabsolute", handler.current);
      window.removeEventListener("deviceorientation", handler.current);
      handler.current = null;
    }
  }
  async function toggleCompass(on) {
    setUseCompass(on);
    setMsg("");
    if (!on) { stop(); setHeading(null); return; }
    try {
      if (typeof DeviceOrientationEvent !== "undefined" && DeviceOrientationEvent.requestPermission) {
        const p = await DeviceOrientationEvent.requestPermission();
        if (p !== "granted") throw new Error("denied");
      }
    } catch (e) { setUseCompass(false); setMsg("Compass permission was denied."); return; }
    let got = false;
    handler.current = (e) => {
      let h = null;
      if (typeof e.webkitCompassHeading === "number") h = e.webkitCompassHeading;
      else if (e.absolute && typeof e.alpha === "number") h = 360 - e.alpha;
      if (h != null) { got = true; setHeading(h); }
    };
    window.addEventListener("deviceorientationabsolute", handler.current);
    window.addEventListener("deviceorientation", handler.current);
    setTimeout(() => { if (!got) setMsg("No compass found on this device. Point the top of your screen to North."); }, 2500);
  }

  if (!settings) return <div className="qb-root" />;
  const { lat, lng, name, cc } = settings.loc;
  const b = qiblaBearing(lat, lng);
  const dist = distanceToKaaba(lat, lng);
  const h = useCompass ? heading : 0;

  return (
    <div className="qb-root">
      {/* mobile */}
      <div className="qb-m">
        <div className="pt-bar">
          <button className="pt-back" aria-label="Back" onClick={() => (history.length > 1 ? router.back() : router.push("/"))}><Back /></button>
          <span className="pt-sep" />
          <h1>Qibla Direction</h1>
          <div className="pt-bar-r" />
        </div>
        <div className="qb-info">
          <Link href="/prayer-times" className="qb-ib"><span className="i"><PrayersBtnIco /></span>Prayers Times</Link>
          <div className="qb-mid"><b>{name}, {cc}</b><span>{bearingText(b)}</span></div>
          <label className="qb-ib">
            <button role="switch" aria-checked={useCompass} className={`pt-tg sm${useCompass ? " on" : ""}`} onClick={() => toggleCompass(!useCompass)}><i /></button>
            Use Compass
          </label>
        </div>
        <div className="qb-stage">
          <Compass bearing={b} heading={h} />
          {msg && <p className="qb-msg">{msg}</p>}
        </div>
      </div>

      {/* desktop */}
      <div className="qb-d">
        <DesktopNav active="Qibla" />
        <section className="ptd-band qb-band">
          <div className="ptd-wrap">
            <div className="ptd-crumb"><Link href="/">Home</Link><span>/</span>Qibla</div>
            <h1>Qibla Direction</h1>
            <p className="qb-sub">The direction of the Kaaba in Makkah from {name}, {cc}.</p>
          </div>
        </section>
        <div className="ptd-wrap qb-dgrid">
          <div className="ptd-card qb-dcomp"><Compass bearing={b} heading={0} /></div>
          <div className="qb-dside">
            <div className="ptd-card qb-stat">
              <div className="lbl">Qibla bearing</div>
              <div className="big">{b.toFixed(1)}°</div>
              <div className="sub">{bearingText(b)}</div>
            </div>
            <div className="ptd-card qb-stat">
              <div className="lbl">Distance to the Kaaba</div>
              <div className="big">{Math.round(dist).toLocaleString()} km</div>
              <div className="sub">Great-circle distance</div>
            </div>
            <div className="ptd-card qb-how">
              <h3>How to use</h3>
              <ol>
                <li>Hold your phone flat, or face North if you are on a computer.</li>
                <li>The prayer mat points toward the Kaaba from your location.</li>
                <li>On a phone, turn on <b>Use Compass</b> for live direction.</li>
              </ol>
              <Link href="/prayer-times" className="ptd-more">Change location in Prayer Times</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
