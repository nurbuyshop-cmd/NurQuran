"use client";
import { useState } from "react";
import Shell, { useAdmin } from "@/components/Shell";
import { api, downloadBackup } from "@/lib/api";
import { I, useUi } from "@/components/ui";

function Backup() {
  const me = useAdmin();
  const { notify, ask } = useUi();
  const [busy, setBusy] = useState("");
  const dl = async () => {
    setBusy("dl");
    try {
      const blob = await downloadBackup();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `nurquran-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      notify("Backup downloaded");
    } catch (e) { notify(e.message, "err"); }
    setBusy("");
  };
  const restore = async (file) => {
    if (!file) return;
    let data;
    try { data = JSON.parse(await file.text()); } catch (e) { notify("This file is not valid JSON", "err"); return; }
    const n = Array.isArray(data.pages) ? data.pages.length : 0;
    if (!(await ask({ title: "Restore this backup?", message: `All current Quran pages will be replaced with ${n} pages from the file. The current data is saved on the server first.`, ok: "Restore", danger: true }))) return;
    setBusy("up");
    try { const r = await api("/v1/admin/import", { method: "POST", body: data }); notify(`Restored ${r.pages} pages`); }
    catch (e) { notify(e.message, "err"); }
    setBusy("");
  };
  return (
    <div className="qa-grid2 top">
      <div className="qa-card qa-form">
        <h2>Download backup</h2>
        <p className="qa-muted">One file with every Quran page, translation, audio link and setting. Keep a copy on your computer from time to time.</p>
        <p className="qa-muted small">The server also keeps the last 30 versions automatically before every change.</p>
        <div className="qa-form-foot"><button className="qa-btn" disabled={busy === "dl"} onClick={dl}><I.backup />Download backup</button></div>
      </div>
      <div className="qa-card qa-form">
        <h2>Restore from a backup</h2>
        <p className="qa-muted">Replaces all Quran pages with the pages from a backup file. Every page is checked before anything changes.</p>
        {me.role === "owner" ? (
          <div className="qa-form-foot">
            <label className="qa-btn ghost">{busy === "up" ? "Restoring…" : "Choose backup file"}
              <input type="file" accept=".json,application/json" hidden onChange={(e) => restore(e.target.files[0])} />
            </label>
          </div>
        ) : <p className="qa-muted">Only the owner can restore backups.</p>}
      </div>
    </div>
  );
}

export default function BackupPage() {
  return <Shell title="Backup"><Backup /></Shell>;
}
