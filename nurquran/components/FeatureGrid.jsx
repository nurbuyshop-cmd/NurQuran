import Link from "next/link";
import {
  QuranIcon, TasbeehIcon, TajweedIcon, QiblaIcon, ECardIcon,
  PrayerTimesIcon, InflightIcon, HifzIcon, HijriIcon, AllahNamesIcon,
} from "./FeatureIcons";

// Change href values as each page gets built.
const FEATURES = [
  { label: "Read Quran", href: "/quran", Icon: QuranIcon },
  { label: "Tasbeeh", href: "/tasbeeh", Icon: TasbeehIcon },
  { label: "Learn Tajweed", href: "#", Icon: TajweedIcon },
  { label: "Qibla", href: "/qibla", Icon: QiblaIcon },
  { label: "E-Card", href: "#", Icon: ECardIcon },
  { label: "Prayers Times", href: "/prayer-times", Icon: PrayerTimesIcon },
  { label: "Inflight Prayer Times", href: "#", Icon: InflightIcon },
  { label: "Hifz", href: "#", Icon: HifzIcon },
  { label: "Hijri", href: "#", Icon: HijriIcon },
  { label: "Allah Name", href: "#", Icon: AllahNamesIcon },
];

export default function FeatureGrid() {
  return (
    <section className="features">
      {FEATURES.map(({ label, href, Icon }) => (
        <Link key={label} href={href} className="feat">
          <div className="icon"><Icon /></div>
          <span>{label}</span>
        </Link>
      ))}
    </section>
  );
}
