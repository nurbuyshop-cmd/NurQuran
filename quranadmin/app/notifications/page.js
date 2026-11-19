"use client";
// Notifications shown on the website (bell icon → Notifications page): title, message, optional link and picture.
import { useCallback, useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { api } from "@/lib/api";
import { I, useUi, timeAgo } from "@/components/ui";

const EMPTY = { title: "", body: "", link: "" };

function NotifBody() {
  const { notify, ask } = useUi();
  const [list, setList] = useState(null);
  const [imgs, setImgs] = useState({});
  const [f, setF] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [pic, setPic] = useState(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => {
    api("/v1/admin/notifications").then((r) => setList(r.notifications)).catch((e) => notify(e.message, "err"));
    api("/v1/images").then((r) => setImgs(r.images || {})).catch(() => {});
  }, [notify]);
  useEffect(() => { load(); }, [load]);

  const reset = () => { setF(EMPTY); setEditing(null); setPic(null); };
  const submit = async (e) => {
    e.preventDefault();
    if (pic && pic.size > 3 * 1024 * 1024) { notify("Picture is too large (max 3 MB)", "err"); return; }
    setBusy(true);
    try {
      const r = editing
        ? await api(`/v1/admin/notifications/${editing}`, { method: "PUT", body: f })
        : await api("/v1/admin/notifications", { method: "POST", body: f });
      if (pic) {
        const form = new FormData();
        form.append("file", pic);
        await api(`/v1/admin/images?slot=${encodeURIComponent(`notif:${r.notification.id}`)}`, { method: "POST", form });
      }
      notify(editing ? "Notification updated" : "Notification published — visitors see it now");
      reset(); load();
    } catch (err) { notify(err.message, "err"); }
    setBusy(false);
  };
  const edit = (n) => { setEditing(n.id); setF({ title: n.title, body: n.body || "", link: n.link || "" }); setPic(null); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const del = async (n) => {
    if (!(await ask({ title: `Delete "${n.title}"?`, message: "It will be removed from the website.", ok: "Delete", danger: true }))) return;
    try { await api(`/v1/admin/notifications/${n.id}`, { method: "DELETE" }); notify("Notification deleted"); if (editing === n.id) reset(); load(); }
    catch (e) { notify(e.message, "err"); }
  };
  const removePic = async (n) => {
    try { await api(`/v1/admin/images?slot=${encodeURIComponent(`notif:${n.id}`)}`, { method: "DELETE" }); load(); notify("Picture removed"); }
    catch (e) { notify(e.message, "err"); }
  };

  return (
    <div className="qa-grid2 top qa-notifs">
      <form className="qa-card qa-form" onSubmit={submit}>
        <h2>{editing ? "Edit notification" : "New notification"}</h2>
        <label>Title<input className="qa-input" maxLength={120} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. The beauty of Fasting 😊" required /></label>
        <label>Message<textarea className="qa-input" rows={4} maxLength={2000} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} placeholder="e.g. An integral aspect of Islam 🌙" /></label>
        <label>Link for the View button <small>(optional — a page like /quran/?s=2&a=183 or a full https:// link; empty = show the full message)</small>
          <input className="qa-input" value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} placeholder="/quran/?s=2&a=183" /></label>
        <label>Picture <small>(optional, square, max 3 MB — without one the Quran logo is shown)</small>
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => setPic(e.target.files[0] || null)} /></label>
        <div className="qa-form-foot">
          {editing && <button type="button" className="qa-btn ghost" onClick={reset}>Cancel</button>}
          <button className="qa-btn" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Publish"}</button>
        </div>
      </form>

      <div className="qa-card">
        <div className="qa-card-h"><h2>Published</h2><span className="qa-tag">{list ? list.length : 0}</span></div>
        {!list ? <div className="qa-skel" /> : !list.length ? <p className="qa-muted">No notifications yet. Write the first one on the left.</p> : (
          <div className="qa-nlist">
            {list.map((n) => (
              <div key={n.id} className={`qa-n${editing === n.id ? " on" : ""}`}>
                <span className="pv">{imgs[`notif:${n.id}`] ? <img src={imgs[`notif:${n.id}`]} alt="" /> : <I.logo />}</span>
                <div className="tx">
                  <b>{n.title}</b>
                  {n.body && <p>{n.body}</p>}
                  <small>{timeAgo(n.createdAt)}{n.link ? ` · ${n.link}` : ""}</small>
                </div>
                <div className="act">
                  <button className="qa-icon-btn" title="Edit" onClick={() => edit(n)}><I.edit /></button>
                  {imgs[`notif:${n.id}`] && <button className="qa-icon-btn" title="Remove picture" onClick={() => removePic(n)}><I.x /></button>}
                  <button className="qa-icon-btn red" title="Delete" onClick={() => del(n)}><I.trash /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Notifications() {
  return <Shell title="Notifications"><NotifBody /></Shell>;
}
