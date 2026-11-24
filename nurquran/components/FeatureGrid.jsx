"use client";
import Link from "next/link";
import { useSiteImages } from "@/lib/siteImages";
import {
  QuranIcon, TasbeehIcon, TajweedIcon, QiblaIcon, ECardIcon,
  PrayerTimesIcon, InflightIcon, HifzIcon, HijriIcon, AllahNamesIcon,
} from "./FeatureIcons";

// Change href values as each page gets built.
const FEATURES = [
  { key: "read-quran", label: "Read Quran", href: "/quran", Icon: QuranIcon },
  { key: "tasbeeh", label: "Tasbeeh", href: "/tasbeeh", Icon: TasbeehIcon },
  { key: "learn-tajweed", label: "Learn Tajweed", href: "/tajweed", Icon: TajweedIcon },
  { key: "qibla", label: "Qibla", href: "/qibla", Icon: QiblaIcon },
  { key: "e-card", label: "E-Card", href: "#", Icon: ECardIcon },
  { key: "prayer-times", label: "Prayers Times", href: "/prayer-times", Icon: PrayerTimesIcon },
  { key: "inflight", label: "Inflight Prayer Times", href: "#", Icon: InflightIcon },
  { key: "hifz", label: "Hifz", href: "#", Icon: HifzIcon },
  { key: "hijri", label: "Hijri", href: "#", Icon: HijriIcon },
  { key: "allah-names", label: "Allah Name", href: "/allah-names", Icon: AllahNamesIcon },
];

// The icon pictures can be replaced from the admin panel (Images → Home page icons)
export default function FeatureGrid() {
  const imgs = useSiteImages();
  return (
    <section className="features">
      {FEATURES.map(({ key, label, href, Icon }) => (
        <Link key={label} href={href} className="feat">
          <div className="icon">{imgs[`feature:${key}`] ? <img src={imgs[`feature:${key}`]} alt="" /> : <Icon />}</div>
          <span>{label}</span>
        </Link>
      ))}
    </section>
  );
}
