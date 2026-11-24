import Link from "next/link";
import SiteLogo from "./SiteLogo";

const LINKS = [
  ["Home", "/"],
  ["Read Quran", "/quran"],
  ["Prayer Times", "/prayer-times"],
  ["Qibla", "/qibla"],
  ["Tasbeeh", "/tasbeeh"],
  ["99 Names", "/allah-names"],
  ["Hifz", "#"],
  ["Duas", "#"],
];

// Top navigation used on desktop inner pages.
export default function DesktopNav({ active }) {
  return (
    <header className="dnav">
      <div className="dnav-in">
        <Link href="/" className="dnav-brand">
          <SiteLogo />
          Quran
        </Link>
        <nav>
          {LINKS.map(([l, h]) => (
            <Link key={l} href={h} className={l === active ? "active" : ""}>{l}</Link>
          ))}
        </nav>
        <button className="dnav-premium">Premium</button>
      </div>
    </header>
  );
}
