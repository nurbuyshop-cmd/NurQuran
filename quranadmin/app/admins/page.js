"use client";
import { useEffect, useState } from "react";
import Shell, { useAdmin } from "@/components/Shell";
import { api } from "@/lib/api";
import { I, timeAgo, useUi } from "@/components/ui";

function Admins() {
  const me = useAdmin();
  const { notify, ask } = useUi();
  const [list, setList] = useState(null);
  const [f, setF] = useState({ name: "", email: "", password: "", role: "editor" });
  const [busy, setBusy] = useState(false);
  const load = () => api("/v1/admin/admins").then((r) => setList(r.admins)).catch((e) => notify(e.message, "err"));
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);
  const add = async (e) => {
    e.preventDefault(); setBusy(true);
    try { await api("/v1/admin/admins", { method: "POST", body: f }); notify(`${f.name} can now log in`); setF({ name: "", email: "", password: "", role: "editor" }); load(); }
    catch (err) { notify(err.message, "err"); }
    setBusy(false);
  };
  const del = async (a) => {
    if (!(await ask({ title: `Remove ${a.name}?`, message: `${a.email} will no longer be able to log in.`, ok: "Remove", danger: true }))) return;
    try { await api(`/v1/admin/admins/${a.id}`, { method: "DELETE" }); notify("Admin removed"); load(); } catch (e) { notify(e.message, "err"); }
  };
  const owner = me.role === "owner";
  return (
    <div className="qa-grid2 top">
      <div className="qa-card flush">
        {!list ? <div className="qa-skel" /> : (
          <table className="qa-table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Added</th><th /></tr></thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.id}>
                  <td data-l="Name"><b>{a.name}</b>{a.id === me.id && <span className="qa-tag">You</span>}</td>
                  <td data-l="Email">{a.email}</td>
                  <td data-l="Role"><span className={`qa-tag ${a.role}`}>{a.role === "owner" ? "Owner" : "Editor"}</span></td>
                  <td data-l="Added" className="qa-muted">{timeAgo(a.createdAt)}</td>
                  <td className="qa-row-act">{owner && a.id !== me.id && <button className="qa-icon-btn red" onClick={() => del(a)} title="Remove"><I.trash /></button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {owner ? (
        <form className="qa-card qa-form" onSubmit={add}>
          <h2>Add admin</h2>
          <label>Name<input className="qa-input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></label>
          <label>Email<input type="email" className="qa-input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required /></label>
          <label>Password <small>(at least 8 characters)</small><input type="text" className="qa-input" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required /></label>
          <label>Role<select className="qa-input" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
            <option value="editor">Editor — can add and edit Quran pages</option>
            <option value="owner">Owner — can also manage admins and restore backups</option>
          </select></label>
          <div className="qa-form-foot"><button className="qa-btn" disabled={busy}><I.plus />Add admin</button></div>
        </form>
      ) : <div className="qa-card"><p className="qa-muted">Only the owner can add or remove admins.</p></div>}
    </div>
  );
}

export default function AdminsPage() {
  return <Shell title="Admins"><Admins /></Shell>;
}
