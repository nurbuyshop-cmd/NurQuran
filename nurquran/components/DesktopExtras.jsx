import Link from "next/link";
import ContinueReading from "./ContinueReading";

const POPULAR = [
  { n: 1, en: "Al-Fatiha", meaning: "The Opener", ayahs: 7, ar: "الفاتحة" },
  { n: 18, en: "Al-Kahf", meaning: "The Cave", ayahs: 110, ar: "الكهف" },
  { n: 36, en: "Ya-Sin", meaning: "Ya Sin", ayahs: 83, ar: "يس" },
  { n: 55, en: "Ar-Rahman", meaning: "The Beneficent", ayahs: 78, ar: "الرحمن" },
  { n: 56, en: "Al-Waqi'ah", meaning: "The Inevitable", ayahs: 96, ar: "الواقعة" },
  { n: 67, en: "Al-Mulk", meaning: "The Sovereignty", ayahs: 30, ar: "الملك" },
];

export default function DesktopExtras() {
  return (
    <div className="desk-only">
      <h2 className="sec-title">Today</h2>
      <div className="two-col">
        <div className="ayah">
          <svg className="pattern" viewBox="0 0 100 100">
            <g fill="none" stroke="#fff" strokeWidth="2">
              <rect x="20" y="20" width="60" height="60" />
              <rect x="20" y="20" width="60" height="60" transform="rotate(45 50 50)" />
              <circle cx="50" cy="50" r="18" />
            </g>
          </svg>
          <div className="tag">Ayah of the Day</div>
          <div className="arabic ar">فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا ﴿٥﴾ إِنَّ مَعَ ٱلْعُسْرِ يُسْرًا ﴿٦﴾</div>
          <div className="tr">So, surely with hardship comes ease. Surely with that hardship comes more ease.</div>
          <div className="ref">Surah Ash-Sharh · 94:5–6</div>
        </div>
        <ContinueReading />
      </div>

      <h2 className="sec-title">
        Popular Surahs <Link href="/quran">View all 114</Link>
      </h2>
      <div className="surahs">
        {POPULAR.map((s) => (
          <Link key={s.n} href="/quran" className="surah">
            <div className="num"><b>{s.n}</b></div>
            <div className="info">
              <div className="e">{s.en}</div>
              <div className="m">{s.meaning} · {s.ayahs} Ayahs</div>
            </div>
            <div className="a ar">{s.ar}</div>
          </Link>
        ))}
      </div>
      <footer className="site-footer">© {new Date().getFullYear()} Quran · All rights reserved</footer>
    </div>
  );
}
