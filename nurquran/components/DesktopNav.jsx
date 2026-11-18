import Link from "next/link";

const LINKS = [
  ["Home", "/"],
  ["Read Quran", "/quran"],
  ["Prayer Times", "/prayer-times"],
  ["Qibla", "/qibla"],
  ["Tasbeeh", "/tasbeeh"],
  ["Hifz", "#"],
  ["Duas", "#"],
];

// Top navigation used on desktop inner pages.
export default function DesktopNav({ active }) {
  return (
    <header className="dnav">
      <div className="dnav-in">
        <Link href="/" className="dnav-brand">
          <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="19" fill="#1f8a3b" /><circle cx="18" cy="20" r="11" fill="#f3c74b" /><circle cx="22" cy="17.5" r="9.5" fill="#1f8a3b" /><path d="M28 12l1 2.6 2.7.2-2.1 1.7.7 2.6-2.3-1.5-2.3 1.5.7-2.6-2.1-1.7 2.7-.2z" fill="#f3c74b" /></svg>
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
