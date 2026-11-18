"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { api } from "@/lib/api";
import { timeAgo } from "@/components/ui";

export default function Activity() {
  const [log, setLog] = useState(null);
  useEffect(() => { api("/v1/admin/log").then((r) => setLog(r.log)).catch(() => setLog([])); }, []);
  return (
    <Shell title="Activity">
      <div className="qa-card">
        {!log ? <div className="qa-skel" /> : (
          <ul className="qa-log">
            {log.length ? log.map((l, i) => (
              <li key={i}><span className="dot" /><div><b>{l.by}</b> {l.action} {l.detail && <span className="d">{l.detail}</span>}<small>{new Date(l.at).toLocaleString()} · {timeAgo(l.at)}</small></div></li>
            )) : <li className="qa-muted">No activity yet.</li>}
          </ul>
        )}
      </div>
    </Shell>
  );
}
