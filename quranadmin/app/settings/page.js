"use client";
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { api } from "@/lib/api";
import { I, useUi } from "@/components/ui";

function SiteSettings() {
  const { notify } = useUi();
  const [s, setS] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { api("/v1/admin/settings").then((r) => setS(r.settings)).catch((e) => notify(e.message, "err")); }, [notify]);
  if (!s) return <div className="qa-skel" />;
  const setLang = (i, patch) => setS({ ...s, languages: s.languages.map((l, j) => (j === i ? { ...l, ...patch } : l)) });
  const save = async () => {
    setBusy(true);
    try { const r = await api("/v1/admin/settings", { method: "PUT", body: s }); setS(r.settings); notify("Settings saved"); }
    catch (e) { notify(e.message, "err"); }
    setBusy(false);
  };
  return (
    <div className="qa-card qa-form">
      <h2>Website</h2>
      <label>Website name<input className="qa-input" value={s.siteName} onChange={(e) => setS({ ...s, siteName: e.target.value })} /></label>
      <label>Reciter name <small>(shown in the audio player)</small><input className="qa-input" value={s.reciter} onChange={(e) => setS({ ...s, reciter: e.target.value })} /></label>
      <h3>Translation languages</h3>
      <p className="qa-muted small">Each language gets its own box in the page editor. Code examples: bn, en, ur, ar.</p>
      {s.languages.map((l, i) => (
        <div key={i} className="qa-lang">
          <input className="qa-input sm" placeholder="code" value={l.code} onChange={(e) => setLang(i, { code: e.target.value })} />
          <input className="qa-input" placeholder="Name (e.g. বাংলা)" value={l.name} onChange={(e) => setLang(i, { name: e.target.value })} />
          <button className="qa-icon-btn red" onClick={() => setS({ ...s, languages: s.languages.filter((_, j) => j !== i) })} title="Remove"><I.x /></button>
        </div>
      ))}
      <button className="qa-btn ghost sm" onClick={() => setS({ ...s, languages: [...s.languages, { code: "", name: "" }] })}><I.plus />Add language</button>
      <div className="qa-form-foot"><button className="qa-btn" disabled={busy} onClick={save}>Save settings</button></div>
    </div>
  );
}

function Password() {
  const { notify } = useUi();
  const [f, setF] = useState({ current: "", next: "", again: "" });
  const [busy, setBusy] = useState(false);
  const save = async (e) => {
    e.preventDefault();
    if (f.next !== f.again) { notify("The new passwords do not match", "err"); return; }
    setBusy(true);
    try { await api("/v1/auth/password", { method: "POST", body: f }); notify("Password changed"); setF({ current: "", next: "", again: "" }); }
    catch (err) { notify(err.message, "err"); }
    setBusy(false);
  };
  return (
    <form className="qa-card qa-form" onSubmit={save}>
      <h2>My password</h2>
      <label>Current password<input type="password" className="qa-input" autoComplete="current-password" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} required /></label>
      <label>New password <small>(at least 8 characters)</small><input type="password" className="qa-input" autoComplete="new-password" value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} required /></label>
      <label>New password again<input type="password" className="qa-input" autoComplete="new-password" value={f.again} onChange={(e) => setF({ ...f, again: e.target.value })} required /></label>
      <div className="qa-form-foot"><button className="qa-btn" disabled={busy}>Change password</button></div>
    </form>
  );
}

export default function Settings() {
  return (
    <Shell title="Settings">
      <div className="qa-grid2 top"><SiteSettings /><Password /></div>
    </Shell>
  );
}
