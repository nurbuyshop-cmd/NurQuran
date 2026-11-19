"use client";
// Reciter list on the website: order (first → last), show / hide, and the default reciter for new visitors.
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { api } from "@/lib/api";
import { I, useUi } from "@/components/ui";
import { IMAGE_GROUPS } from "@/lib/imageSlots";

const ALL = IMAGE_GROUPS.find((g) => g.kind === "reciter").items; // [id, name] in the website's built-in order

function arrange(cfg) {
  const order = (cfg && cfg.order) || [];
  const pos = (id) => { const i = order.indexOf(id); return i < 0 ? 1000 + ALL.findIndex(([x]) => x === id) : i; };
  return ALL.map(([id]) => id).sort((a, b) => pos(a) - pos(b));
}

function RecitersBody() {
  const { notify } = useUi();
  const [settings, setSettings] = useState(null);
  const [order, setOrder] = useState([]);
  const [hidden, setHidden] = useState([]);
  const [def, setDef] = useState(ALL[0][0]);
  const [imgs, setImgs] = useState({});
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(null);

  useEffect(() => {
    api("/v1/admin/settings").then((r) => {
      setSettings(r.settings);
      const c = r.settings.reciters;
      setOrder(arrange(c));
      setHidden((c && c.hidden) || []);
      setDef((c && c.default) || arrange(c)[0]);
    }).catch((e) => notify(e.message, "err"));
    api("/v1/images").then((r) => setImgs(r.images || {})).catch(() => {});
  }, [notify]);

  const name = (id) => (ALL.find(([x]) => x === id) || [id, id])[1];
  const touch = () => setDirty(true);
  const move = (i, to) => {
    if (to < 0 || to >= order.length || to === i) return;
    const n = [...order]; const [x] = n.splice(i, 1); n.splice(to, 0, x);
    setOrder(n); touch();
  };
  const toggleHide = (id) => {
    if (id === def) { notify("This is the default reciter — choose another default before hiding it", "err"); return; }
    setHidden((h) => (h.includes(id) ? h.filter((x) => x !== id) : [...h, id])); touch();
  };
  const makeDefault = (id) => { setDef(id); setHidden((h) => h.filter((x) => x !== id)); touch(); };
  const reset = () => { setOrder(ALL.map(([id]) => id)); setHidden([]); setDef(ALL[0][0]); touch(); };
  const save = async () => {
    setBusy(true);
    try {
      const r = await api("/v1/admin/settings", { method: "PUT", body: { ...settings, reciters: { order, hidden, default: def } } });
      setSettings(r.settings); setDirty(false); notify("Reciter list saved — the website shows it now");
    } catch (e) { notify(e.message, "err"); }
    setBusy(false);
  };

  if (!settings) return <div className="qa-skel" />;
  return (
    <div className="qa-card qa-recs">
      <div className="qa-card-h">
        <h2>Reciter list</h2>
        <div className="qa-row-act">
          <button className="qa-btn ghost sm" onClick={reset}>Built-in order</button>
          <button className="qa-btn sm" disabled={!dirty || busy} onClick={save}><I.check />{busy ? "Saving…" : "Save"}</button>
        </div>
      </div>
      <p className="qa-muted small">
        Drag a row (or use the arrows) to set the order on the website — the top one shows first. <b>Default</b> is the reciter
        new visitors hear (and anyone who has not picked one). Hidden reciters are not shown on the website.
      </p>
      <ol className="list">
        {order.map((id, i) => {
          const off = hidden.includes(id), isDef = def === id;
          return (
            <li key={id} className={`${off ? "off" : ""}${drag === i ? " drag" : ""}${isDef ? " def" : ""}`} draggable
              onDragStart={() => setDrag(i)} onDragOver={(e) => { e.preventDefault(); if (drag !== null && drag !== i) { move(drag, i); setDrag(i); } }}
              onDragEnd={() => setDrag(null)}>
              <span className="hd" title="Drag to move">⋮⋮</span>
              <span className="no">{i + 1}</span>
              <span className="pv">{imgs[`reciter:${id}`] ? <img src={imgs[`reciter:${id}`]} alt="" /> : name(id).replace(/^(Abdur|Abdul|Abu)[- ]/, "").split(/[\s-]+/).filter((w) => !/^(Al|As|Ash|Ad)$/i.test(w)).slice(0, 2).map((w) => w[0]).join("")}</span>
              <span className="nm"><b>{name(id)}</b>{isDef && <span className="qa-tag">Default</span>}{off && <span className="qa-tag gray">Hidden</span>}</span>
              <span className="act">
                <button className="qa-icon-btn" title="Move up" disabled={i === 0} onClick={() => move(i, i - 1)}><I.up /></button>
                <button className="qa-icon-btn" title="Move down" disabled={i === order.length - 1} onClick={() => move(i, i + 1)}><I.down /></button>
                <label className="rad" title="Default reciter"><input type="radio" name="def" checked={isDef} onChange={() => makeDefault(id)} />Default</label>
                <button className={`qa-btn sm ${off ? "" : "ghost"}`} onClick={() => toggleHide(id)}>{off ? "Show" : "Hide"}</button>
              </span>
            </li>
          );
        })}
      </ol>
      {dirty && <div className="qa-form-foot"><button className="qa-btn" disabled={busy} onClick={save}>Save changes</button></div>}
    </div>
  );
}

export default function Reciters() {
  return <Shell title="Reciters"><RecitersBody /></Shell>;
}
