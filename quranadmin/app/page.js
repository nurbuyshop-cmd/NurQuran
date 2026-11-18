"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Shell from "@/components/Shell";
import { api } from "@/lib/api";
import { I, timeAgo } from "@/components/ui";
import { JUZ_NAMES } from "@/lib/meta";

function Stat({ label, value, total, color }) {
  const pct = total ? Math.min(100, (value / total) * 100) : null;
  return (
    <div className="qa-card qa-stat">
      <span className="l">{label}</span>
      <b>{value.toLocaleString()}{total ? <small> / {total.toLocaleString()}</small> : null}</b>
      {pct !== null && <div className="bar"><i style={{ width: `${pct}%`, background: color }} /></div>}
      {pct !== null && <span className="p">{pct.toFixed(pct < 10 ? 1 : 0)}% done</span>}
    </div>
  );
}

export default function Dashboard() {
  const [s, setS] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => { api("/v1/admin/stats").then(setS).catch((e) => setErr(e.message)); }, []);
  return (
    <Shell title="Dashboard" actions={s && <Link className="qa-btn" href={`/pages/edit/?new=${s.nextPage}`}><I.plus />Add page {s.nextPage}</Link>}>
      {err && <div className="qa-err">{err}</div>}
      {!s ? <div className="qa-skel" /> : (
        <>
          <div className="qa-stats">
            <Stat label="Pages added" value={s.pages} total={s.totalPages} color="#1f8a3b" />
            <Stat label="Ayahs added" value={s.ayahs} total={s.totalAyahs} color="#2e7fd1" />
            <Stat label="Surahs complete" value={s.surahsComplete} total={114} color="#d4b236" />
            <Stat label="Ayahs with translation" value={s.translated} total={s.ayahs || 1} color="#8e24aa" />
            <Stat label="Ayahs with audio" value={s.withAudio} total={s.ayahs || 1} color="#e65100" />
          </div>
          <div className="qa-grid2">
            <div className="qa-card">
              <div className="qa-card-h"><h2>Progress by Juz</h2><span className="qa-muted">pages added (about 20 per Juz)</span></div>
              <div className="qa-juz">
                {JUZ_NAMES.map((n, i) => {
                  const c = s.perJuz[i + 1] || 0;
                  const lvl = c === 0 ? 0 : c < 7 ? 1 : c < 14 ? 2 : c < 20 ? 3 : 4;
                  return (
                    <Link key={i} href={`/pages/?juz=${i + 1}`} className={`qa-juz-c l${lvl}`} title={`Juz ${i + 1}: ${c} pages`}>
                      <b>{i + 1}</b><small>{c} pg</small>
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="qa-card">
              <div className="qa-card-h"><h2>Recent activity</h2><Link href="/activity/" className="qa-link">See all</Link></div>
              <ul className="qa-log">
                {s.log.length ? s.log.map((l, i) => (
                  <li key={i}><span className="dot" /><div><b>{l.by}</b> {l.action} {l.detail && <span className="d">{l.detail}</span>}<small>{timeAgo(l.at)}</small></div></li>
                )) : <li className="qa-muted">No activity yet.</li>}
              </ul>
            </div>
          </div>
        </>
      )}
    </Shell>
  );
}
