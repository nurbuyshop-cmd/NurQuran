"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Shell from "@/components/Shell";
import { api, SITE_URL } from "@/lib/api";
import { I, timeAgo, useUi } from "@/components/ui";
import { pageSummary, ayahCount } from "@/lib/pageInfo";

function PagesList() {
  const params = useSearchParams();
  const { notify, ask } = useUi();
  const [pages, setPages] = useState(null);
  const [juz, setJuz] = useState(params.get("juz") || "");
  const [q, setQ] = useState("");
  const load = () => api("/v1/admin/pages").then((r) => setPages(r.pages)).catch((e) => notify(e.message, "err"));
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);
  const nextPage = useMemo(() => { const s = new Set((pages || []).map((p) => p.page)); let n = 1; while (s.has(n)) n++; return n; }, [pages]);
  const list = (pages || []).filter((p) => (!juz || p.juz === +juz) && (!q || String(p.page) === q.trim() || pageSummary(p).toLowerCase().includes(q.toLowerCase())));
  const del = async (p) => {
    if (!(await ask({ title: `Delete page ${p.page}?`, message: `${pageSummary(p)} will be removed from the website. A backup is kept on the server.`, ok: "Delete", danger: true }))) return;
    try { await api(`/v1/admin/pages/${p.page}`, { method: "DELETE" }); notify(`Page ${p.page} deleted`); load(); } catch (e) { notify(e.message, "err"); }
  };
  return (
    <>
      <div className="qa-toolbar">
        <input className="qa-input" placeholder="Search page number or surah…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="qa-input sm" value={juz} onChange={(e) => setJuz(e.target.value)}>
          <option value="">All Juz</option>
          {Array.from({ length: 30 }, (_, i) => <option key={i} value={i + 1}>Juz {i + 1}</option>)}
        </select>
        <Link className="qa-btn" href={`/pages/edit/?new=${nextPage}`}><I.plus />Add page {nextPage}</Link>
      </div>
      <div className="qa-card flush">
        {!pages ? <div className="qa-skel" /> : !list.length ? <p className="qa-empty">No pages found.</p> : (
          <table className="qa-table">
            <thead><tr><th>Page</th><th>Juz</th><th>Contents</th><th>Ayahs</th><th>Last update</th><th /></tr></thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.page}>
                  <td data-l="Page"><b className="qa-pno">{p.page}</b></td>
                  <td data-l="Juz">{p.juz}</td>
                  <td data-l="Contents">{pageSummary(p)}</td>
                  <td data-l="Ayahs">{ayahCount(p)}</td>
                  <td data-l="Updated" className="qa-muted">{timeAgo(p.updatedAt)}{p.updatedBy ? ` · ${p.updatedBy}` : ""}</td>
                  <td className="qa-row-act">
                    <Link className="qa-icon-btn" href={`/pages/edit/?n=${p.page}`} title="Edit"><I.edit /></Link>
                    <a className="qa-icon-btn" href={`${SITE_URL}/quran/`} target="_blank" rel="noreferrer" title="View on website"><I.ext /></a>
                    <button className="qa-icon-btn red" onClick={() => del(p)} title="Delete"><I.trash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

export default function PagesPage() {
  return (
    <Shell title="Quran Pages">
      <Suspense fallback={<div className="qa-skel" />}><PagesList /></Suspense>
    </Shell>
  );
}
