"use client";
import { useEffect, useMemo, useState } from "react";
import Shell from "@/components/Shell";
import { api } from "@/lib/api";
import { SURAHS } from "@/lib/meta";

// "1–3, 7, 9–12"
function ranges(nums) {
  const out = [];
  nums.forEach((n) => { const l = out[out.length - 1]; if (l && n === l[1] + 1) l[1] = n; else out.push([n, n]); });
  return out.map(([a, b]) => (a === b ? `${a}` : `${a}–${b}`)).join(", ");
}

export default function Surahs() {
  const [pages, setPages] = useState(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(null);
  const [filter, setFilter] = useState("all");
  useEffect(() => { api("/v1/admin/pages").then((r) => setPages(r.pages)).catch(() => setPages([])); }, []);
  const have = useMemo(() => {
    const m = {};
    (pages || []).forEach((p) => p.blocks.forEach((b) => { if (b.t === "ayah") (m[b.s] = m[b.s] || {})[b.a] = p.page; }));
    return m;
  }, [pages]);
  const list = SURAHS.filter((s) => {
    const c = Object.keys(have[s.n] || {}).length;
    if (filter === "done" && c !== s.ayahs) return false;
    if (filter === "partial" && !(c > 0 && c < s.ayahs)) return false;
    if (filter === "none" && c > 0) return false;
    return !q || s.en.toLowerCase().includes(q.toLowerCase()) || s.ar.includes(q) || String(s.n) === q;
  });
  return (
    <Shell title="Surahs">
      <div className="qa-toolbar">
        <input className="qa-input" placeholder="Search surah…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="qa-seg">
          {[["all", "All"], ["done", "Complete"], ["partial", "In progress"], ["none", "Not started"]].map(([k, l]) => (
            <button key={k} className={filter === k ? "on" : ""} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>
      </div>
      {!pages ? <div className="qa-skel" /> : (
        <div className="qa-surahs">
          {list.map((s) => {
            const got = have[s.n] || {};
            const c = Object.keys(got).length;
            const pct = (c / s.ayahs) * 100;
            const missing = [];
            for (let a = 1; a <= s.ayahs; a++) if (!got[a]) missing.push(a);
            const pagesOf = [...new Set(Object.values(got))].sort((a, b) => a - b);
            return (
              <button key={s.n} className={`qa-card qa-surah${c === s.ayahs ? " done" : c ? " part" : ""}`} onClick={() => setOpen(open === s.n ? null : s.n)}>
                <div className="t"><span className="n">{s.n}</span><b>{s.en}</b><span className="ar" dir="rtl">{s.ar}</span></div>
                <div className="bar"><i style={{ width: `${pct}%` }} /></div>
                <small>{c} / {s.ayahs} ayahs</small>
                {open === s.n && (
                  <div className="more">
                    {pagesOf.length > 0 && <p><b>On pages:</b> {pagesOf.join(", ")}</p>}
                    {missing.length > 0 ? <p><b>Missing ayahs:</b> {ranges(missing)}</p> : <p className="ok">All ayahs added ✓</p>}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </Shell>
  );
}
