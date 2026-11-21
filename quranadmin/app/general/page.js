"use client";
// General section (tiles at the bottom of the mobile home page) and the Contact Us details.
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { api } from "@/lib/api";
import { I, useUi } from "@/components/ui";
import { GenIcon } from "@/components/GeneralIcons";

const TYPES = [
  ["contact", "Contact us page"],
  ["privacy", "Privacy Policy page"],
  ["about", "About Us page"],
  ["notifications", "Notifications page"],
  ["share", "Share the website (Spread Quran)"],
  ["link", "Custom link (Facebook, YouTube, any page…)"],
];
const ICONS = [
  ["email", "Email"], ["shield", "Privacy"], ["info", "Info"], ["bell", "Bell"], ["share", "Share"], ["facebook", "Facebook"],
  ["youtube", "YouTube"], ["whatsapp", "WhatsApp"], ["telegram", "Telegram"], ["instagram", "Instagram"], ["website", "Website"],
  ["star", "Star / Rate"], ["phone", "Phone"], ["link", "Link"],
];
const DEFAULT_ICON = { contact: "email", privacy: "shield", about: "info", notifications: "bell", share: "share", link: "link" };
const DEFAULT_TITLE = { contact: "Contact us", privacy: "Privacy Policy", about: "About Us", notifications: "Notifications", share: "Spread Quran", link: "" };
const CONTACT = [
  ["intro", "Short message at the top", "We'd love to hear from you…", true],
  ["email", "Email", "support@example.com"],
  ["phone", "Phone number", "+880 1XXX-XXXXXX"],
  ["whatsapp", "WhatsApp number", "+880 1XXX-XXXXXX"],
  ["facebook", "Facebook page link", "https://facebook.com/yourpage"],
  ["website", "Website", "https://nurquran.toptol.site"],
  ["address", "Address", "House, Road, Area, City, Country", true],
  ["hours", "Working hours", "Sat–Thu, 10am–6pm (BD time)"],
];

function Item({ x, i, n, pic, busy, set, move, del, upload, unpic }) {
  return (
    <div className={`gn-item${x.hidden ? " off" : ""}`}>
      <div className="gn-pv">
        <span className="tile">{pic ? <img src={pic} alt="" /> : <GenIcon name={x.icon} />}</span>
        <label className={`qa-btn ghost sm${busy ? " dis" : ""}`}>{busy ? "…" : pic ? "Change picture" : "Upload picture"}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(e) => { const f = e.target.files[0]; e.target.value = ""; f && upload(x.id, f); }} />
        </label>
        {pic && <button className="qa-link small" onClick={() => unpic(x.id)}>Use built-in icon</button>}
      </div>
      <div className="gn-fields qa-form">
        <label>Name<input className="qa-input" value={x.title} maxLength={40} onChange={(e) => set(i, { title: e.target.value })} /></label>
        <label>Opens<select className="qa-input" value={x.type} onChange={(e) => set(i, { type: e.target.value, icon: DEFAULT_ICON[e.target.value], title: x.title || DEFAULT_TITLE[e.target.value] })}>
          {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select></label>
        {x.type === "link" && <label>Link <small>(https://…, mailto:, tel: or a page on the site like /tasbeeh)</small>
          <input className="qa-input" value={x.link} placeholder="https://facebook.com/yourpage" onChange={(e) => set(i, { link: e.target.value })} /></label>}
        {!pic && <label>Built-in icon<select className="qa-input" value={x.icon} onChange={(e) => set(i, { icon: e.target.value })}>
          {ICONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select></label>}
      </div>
      <div className="gn-act">
        <button className="qa-icon-btn" title="Move up" disabled={i === 0} onClick={() => move(i, -1)}><I.up /></button>
        <button className="qa-icon-btn" title="Move down" disabled={i === n - 1} onClick={() => move(i, 1)}><I.down /></button>
        <button className={`qa-icon-btn${x.hidden ? "" : " on"}`} title={x.hidden ? "Hidden — click to show" : "Shown — click to hide"} onClick={() => set(i, { hidden: !x.hidden })}><I.eye /></button>
        <button className="qa-icon-btn red" title="Delete" onClick={() => del(i)}><I.trash /></button>
      </div>
    </div>
  );
}

function Body() {
  const { notify, ask } = useUi();
  const [g, setG] = useState(null);
  const [saved, setSaved] = useState("");
  const [imgs, setImgs] = useState({});
  const [busy, setBusy] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    api("/v1/admin/general").then((r) => { setG(r.general); setSaved(JSON.stringify(r.general)); }).catch((e) => notify(e.message, "err"));
    api("/v1/images").then((r) => setImgs(r.images || {})).catch(() => {});
  }, [notify]);
  if (!g) return <div className="qa-skel" />;
  const dirty = JSON.stringify(g) !== saved;
  const items = g.items;
  const setItems = (list) => setG({ ...g, items: list });
  const set = (i, patch) => setItems(items.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const move = (i, d) => { const l = [...items]; [l[i], l[i + d]] = [l[i + d], l[i]]; setItems(l); };
  const del = async (i) => {
    if (!(await ask({ title: `Delete "${items[i].title}"?`, message: "It is removed from the General section when you save.", ok: "Delete", danger: true }))) return;
    setItems(items.filter((_, j) => j !== i));
  };
  const add = () => setItems([...items, { id: `i${Date.now().toString(36)}`, type: "link", title: "", icon: "facebook", link: "", hidden: false }]);
  const upload = async (id, file) => {
    if (file.size > 3 * 1024 * 1024) { notify("Picture is too large (max 3 MB)", "err"); return; }
    setBusy(id);
    try {
      const form = new FormData(); form.append("file", file);
      const r = await api(`/v1/admin/images?slot=general:${id}`, { method: "POST", form });
      setImgs((m) => ({ ...m, [`general:${id}`]: r.url })); notify("Picture uploaded — save to show a new item on the website");
    } catch (e) { notify(e.message, "err"); }
    setBusy("");
  };
  const unpic = async (id) => {
    try { await api(`/v1/admin/images?slot=general:${id}`, { method: "DELETE" }); setImgs((m) => { const n = { ...m }; delete n[`general:${id}`]; return n; }); }
    catch (e) { notify(e.message, "err"); }
  };
  const save = async () => {
    setSaving(true);
    try { const r = await api("/v1/admin/general", { method: "PUT", body: g }); setG(r.general); setSaved(JSON.stringify(r.general)); notify("Saved — the website shows it now"); }
    catch (e) { notify(e.message, "err"); }
    setSaving(false);
  };
  const c = g.contact || {};

  return (
    <div className="gn">
      <section className="qa-card">
        <div className="qa-card-h"><h2>General section</h2><span className="qa-tag">{items.filter((x) => !x.hidden).length} shown</span></div>
        <p className="qa-muted small">The round-cornered tiles at the bottom of the mobile home page (like Contact us, Privacy Policy, Notifications, Facebook). Add as many as you like, change the order with the arrows, and upload your own picture for any tile (square PNG, transparent background, about 200×200 px).</p>
        <div className="gn-strip">
          {items.filter((x) => !x.hidden).map((x) => (
            <div key={x.id} className="gn-mini"><span className="tile">{imgs[`general:${x.id}`] ? <img src={imgs[`general:${x.id}`]} alt="" /> : <GenIcon name={x.icon} />}</span><small>{x.title || "—"}</small></div>
          ))}
        </div>
        <div className="gn-list">
          {items.map((x, i) => <Item key={x.id} x={x} i={i} n={items.length} pic={imgs[`general:${x.id}`]} busy={busy === x.id}
            set={set} move={move} del={del} upload={upload} unpic={unpic} />)}
        </div>
        <button className="qa-btn ghost sm" onClick={add}><I.plus />Add item</button>
      </section>

      <section className="qa-card qa-form">
        <h2>Contact Us details</h2>
        <p className="qa-muted small">Shown on the Contact us page (nurquran.toptol.site/contact). Leave a box empty to hide that line. Visitors can tap to email, call, open WhatsApp or the map.</p>
        <div className="gn-contact">
          {CONTACT.map(([k, label, ph, big]) => (
            <label key={k} className={big ? "wide" : ""}>{label}
              {big ? <textarea className="qa-input" rows={2} placeholder={ph} value={c[k] || ""} onChange={(e) => setG({ ...g, contact: { ...c, [k]: e.target.value } })} />
                : <input className="qa-input" placeholder={ph} value={c[k] || ""} onChange={(e) => setG({ ...g, contact: { ...c, [k]: e.target.value } })} />}
            </label>
          ))}
        </div>
      </section>

      <div className="gn-save">
        {dirty && <span className="qa-muted small">You have unsaved changes</span>}
        <button className="qa-btn" disabled={saving || !dirty} onClick={save}><I.check />{saving ? "Saving…" : "Save"}</button>
      </div>
    </div>
  );
}

export default function General() {
  return <Shell title="General & Contact"><Body /></Shell>;
}
