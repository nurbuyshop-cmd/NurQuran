"use client";
// Upload the pictures the website shows: reciter photos, home page icons, theme pictures.
import { useCallback, useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { api } from "@/lib/api";
import { I, useUi } from "@/components/ui";
import { IMAGE_GROUPS } from "@/lib/imageSlots";

function Slot({ slot, label, url, round, onUpload, onRemove, busy }) {
  return (
    <div className="qa-img">
      <div className={`pv${round ? " round" : ""}${url ? "" : " empty"}`}>
        {url ? <img src={url} alt={label} /> : <span>Default</span>}
      </div>
      <b>{label}</b>
      <div className="act">
        <label className={`qa-btn sm${busy ? " dis" : ""}`}>
          {busy ? "Uploading…" : url ? "Change" : "Upload"}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden disabled={busy}
            onChange={(e) => { const f = e.target.files[0]; e.target.value = ""; f && onUpload(slot, f); }} />
        </label>
        {url && <button className="qa-icon-btn red" title="Remove (use the default)" onClick={() => onRemove(slot, label)}><I.trash /></button>}
      </div>
    </div>
  );
}

function ImagesBody() {
  const { notify, ask } = useUi();
  const [imgs, setImgs] = useState(null);
  const [busy, setBusy] = useState("");
  const load = useCallback(() => api("/v1/images").then((r) => setImgs(r.images || {})).catch((e) => notify(e.message, "err")), [notify]);
  useEffect(() => { load(); }, [load]);

  const upload = async (slot, file) => {
    if (file.size > 3 * 1024 * 1024) { notify("Picture is too large (max 3 MB)", "err"); return; }
    setBusy(slot);
    try {
      const form = new FormData();
      form.append("file", file);
      const r = await api(`/v1/admin/images?slot=${encodeURIComponent(slot)}`, { method: "POST", form });
      setImgs((m) => ({ ...m, [slot]: r.url }));
      notify("Picture uploaded — it shows on the website now");
    } catch (e) { notify(e.message, "err"); }
    setBusy("");
  };
  const remove = async (slot, label) => {
    if (!(await ask({ title: `Remove the picture for ${label}?`, message: "The website will show the default picture again.", ok: "Remove", danger: true }))) return;
    try {
      await api(`/v1/admin/images?slot=${encodeURIComponent(slot)}`, { method: "DELETE" });
      setImgs((m) => { const n = { ...m }; delete n[slot]; return n; });
      notify("Picture removed");
    } catch (e) { notify(e.message, "err"); }
  };

  return (
    <>
      {!imgs ? <div className="qa-skel" /> : IMAGE_GROUPS.map((g) => (
        <section key={g.kind} className="qa-card qa-imgs">
          <div className="qa-card-h"><h2>{g.title}</h2><span className="qa-tag">{g.items.filter(([id]) => imgs[`${g.kind}:${id}`]).length} / {g.items.length} uploaded</span></div>
          <p className="qa-muted small">{g.hint} PNG, JPG, WEBP or GIF, up to 3 MB.</p>
          <div className="grid">
            {g.items.map(([id, label]) => {
              const slot = `${g.kind}:${id}`;
              return <Slot key={slot} slot={slot} label={label} url={imgs[slot]} round={g.round} busy={busy === slot} onUpload={upload} onRemove={remove} />;
            })}
          </div>
        </section>
      ))}
    </>
  );
}

export default function Images() {
  return <Shell title="Images"><ImagesBody /></Shell>;
}
