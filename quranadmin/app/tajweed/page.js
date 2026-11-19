"use client";
// Learn Tajweed: who can open it (free for all / limited + Premium), Premium plans and codes, and recordings per item.
import { useCallback, useEffect, useRef, useState } from "react";
import Shell from "@/components/Shell";
import { api } from "@/lib/api";
import { I, useUi, timeAgo } from "@/components/ui";

function Access({ t, setT, onSave, busy }) {
  const setPlan = (i, patch) => setT({ ...t, plans: t.plans.map((p, j) => (j === i ? { ...p, ...patch } : p)) });
  return (
    <div className="qa-card qa-form">
      <h2>Access</h2>
      <div className="qa-seg">
        <button className={t.mode === "free" ? "on" : ""} onClick={() => setT({ ...t, mode: "free" })}>Free for everyone</button>
        <button className={t.mode === "limited" ? "on" : ""} onClick={() => setT({ ...t, mode: "limited" })}>Limited (Premium unlocks all)</button>
      </div>
      <p className="qa-muted small">{t.mode === "free"
        ? "Every lesson and every item is open to all visitors."
        : `Visitors can open the first ${t.freeCount} items of every lesson. People with a Premium code can open everything.`}</p>
      {t.mode === "limited" && (
        <label>Free items in each lesson<input className="qa-input sm" type="number" min="0" max="200" value={t.freeCount} onChange={(e) => setT({ ...t, freeCount: e.target.value })} /></label>
      )}
      <h3>Premium plans <small className="qa-muted">(shown on the website's Premium page)</small></h3>
      {t.plans.map((p, i) => (
        <div key={i} className="qa-lang">
          <input className="qa-input" placeholder="Name (e.g. Yearly)" value={p.name} onChange={(e) => setPlan(i, { name: e.target.value })} />
          <input className="qa-input" placeholder="Price (e.g. BDT 4,200)" value={p.price} onChange={(e) => setPlan(i, { price: e.target.value })} />
          <input className="qa-input" placeholder="Note (optional)" value={p.note} onChange={(e) => setPlan(i, { note: e.target.value })} />
          <button className="qa-icon-btn red" title="Remove" onClick={() => setT({ ...t, plans: t.plans.filter((_, j) => j !== i) })}><I.x /></button>
        </div>
      ))}
      {t.plans.length < 6 && <button className="qa-btn ghost sm" onClick={() => setT({ ...t, plans: [...t.plans, { id: `plan${Date.now() % 100000}`, name: "", price: "", note: "" }] })}><I.plus />Add plan</button>}
      <label>How to pay <small>(shown when someone taps "Subscribe now" — e.g. bKash number, WhatsApp, steps)</small>
        <textarea className="qa-input" rows={5} value={t.payInfo} onChange={(e) => setT({ ...t, payInfo: e.target.value })}
          placeholder={"bKash (Personal): 01XXXXXXXXX\nSend the money, then WhatsApp the transaction ID to 01XXXXXXXXX.\nWe will send your Premium code."} /></label>
      <div className="qa-form-foot"><button className="qa-btn" disabled={busy} onClick={onSave}>Save</button></div>
    </div>
  );
}

function Codes({ plans }) {
  const { notify, ask } = useUi();
  const [list, setList] = useState(null);
  const [f, setF] = useState({ plan: "", days: "365", count: "1", note: "" });
  const [made, setMade] = useState([]);
  const load = useCallback(() => api("/v1/admin/premium/codes").then((r) => setList(r.codes)).catch((e) => notify(e.message, "err")), [notify]);
  useEffect(() => { load(); }, [load]);
  const pickPlan = (name) => {
    const n = name.toLowerCase();
    setF({ ...f, plan: name, days: n.includes("week") ? "7" : n.includes("month") ? "30" : n.includes("year") ? "365" : n.includes("life") ? "0" : f.days });
  };
  const make = async (e) => {
    e.preventDefault();
    try {
      const r = await api("/v1/admin/premium/codes", { method: "POST", body: { ...f, days: f.days === "" ? 0 : +f.days, count: +f.count || 1 } });
      setMade(r.codes); notify(`${r.codes.length} code${r.codes.length > 1 ? "s" : ""} made`); load();
    } catch (err) { notify(err.message, "err"); }
  };
  const copy = async (text) => { try { await navigator.clipboard.writeText(text); notify("Copied"); } catch (e) { notify("Copy is not available here", "err"); } };
  const del = async (c) => {
    if (!(await ask({ title: `Delete code ${c.code}?`, message: "Premium stops on the phone that uses it.", ok: "Delete", danger: true }))) return;
    try { await api(`/v1/admin/premium/codes/${c.code}`, { method: "DELETE" }); load(); } catch (e) { notify(e.message, "err"); }
  };
  const reset = async (c) => {
    try { await api(`/v1/admin/premium/codes/${c.code}/reset`, { method: "POST" }); notify("The code can now be used on a new phone"); load(); } catch (e) { notify(e.message, "err"); }
  };
  const status = (c) => !c.redeemedAt ? "Not used yet" : !c.active ? "Ended" : c.expiresAt ? `Active until ${new Date(c.expiresAt).toLocaleDateString()}` : "Active · lifetime";
  return (
    <div className="qa-card">
      <div className="qa-card-h"><h2>Premium codes</h2><span className="qa-tag">{list ? list.length : 0}</span></div>
      <p className="qa-muted small">When someone pays, make a code and send it to them. They enter it on the website (Premium → Enter code). One code works on one phone; "New phone" frees it to move.</p>
      <form className="qa-codeform" onSubmit={make}>
        <label>Plan<select className="qa-input" value={f.plan} onChange={(e) => pickPlan(e.target.value)}>
          <option value="">Choose…</option>{plans.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
        </select></label>
        <label>Days <small>(0 = lifetime)</small><input className="qa-input sm" type="number" min="0" value={f.days} onChange={(e) => setF({ ...f, days: e.target.value })} /></label>
        <label>How many<input className="qa-input sm" type="number" min="1" max="50" value={f.count} onChange={(e) => setF({ ...f, count: e.target.value })} /></label>
        <label>Note <small>(buyer's name / phone)</small><input className="qa-input" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></label>
        <button className="qa-btn"><I.plus />Make code</button>
      </form>
      {made.length > 0 && (
        <div className="qa-made">
          {made.map((c) => <button key={c.code} onClick={() => copy(c.code)} title="Copy">{c.code} <I.paste /></button>)}
        </div>
      )}
      {!list ? <div className="qa-skel" /> : (
        <div className="qa-table-wrap">
          <table className="qa-table">
            <thead><tr><th>Code</th><th>Plan</th><th>Status</th><th>Note</th><th>Made</th><th /></tr></thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.code}>
                  <td><button className="qa-link mono" onClick={() => copy(c.code)}>{c.code}</button></td>
                  <td>{c.plan}</td>
                  <td>{status(c)}</td>
                  <td>{c.note}</td>
                  <td>{timeAgo(c.createdAt)}</td>
                  <td className="qa-row-act">
                    {c.device && <button className="qa-btn ghost sm" onClick={() => reset(c)}>New phone</button>}
                    <button className="qa-icon-btn red" title="Delete" onClick={() => del(c)}><I.trash /></button>
                  </td>
                </tr>
              ))}
              {!list.length && <tr><td colSpan={6} className="qa-muted">No codes yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Recordings({ audio, setAudio }) {
  const { notify } = useUi();
  const [data, setData] = useState(null);
  const [n, setN] = useState(1);
  const [busy, setBusy] = useState("");
  const player = useRef(null);
  useEffect(() => { fetch("/tajweed/lessons.json").then((r) => r.json()).then(setData).catch(() => setData({ lessons: [] })); }, []);
  const lesson = data && data.lessons.find((l) => l.n === n);
  const listen = (url) => { const a = player.current; a.src = url; a.play().catch(() => notify("Could not play", "err")); };
  const upload = async (id, file) => {
    if (!file) return;
    setBusy(id);
    try {
      const form = new FormData(); form.append("file", file);
      const r = await api(`/v1/admin/tajweed/audio?item=${id}`, { method: "POST", form });
      setAudio((m) => ({ ...m, [id]: r.url })); notify("Recording uploaded");
    } catch (e) { notify(e.message, "err"); }
    setBusy("");
  };
  const remove = async (id) => {
    try { await api(`/v1/admin/tajweed/audio?item=${id}`, { method: "DELETE" }); setAudio((m) => { const x = { ...m }; delete x[id]; return x; }); notify("Recording removed"); }
    catch (e) { notify(e.message, "err"); }
  };
  return (
    <div className="qa-card">
      <audio ref={player} />
      <div className="qa-card-h"><h2>Recordings</h2>
        {data && <select className="qa-input" style={{ maxWidth: 320 }} value={n} onChange={(e) => setN(+e.target.value)}>
          {data.lessons.map((l) => <option key={l.n} value={l.n}>{l.n}. {l.title} ({l.en})</option>)}
        </select>}
      </div>
      <p className="qa-muted small">Words taken from the Quran already have Quran.com's word-by-word recitation. Letter lessons need your own recordings: upload one short audio for each item (mp3 / m4a, max 10 MB). An uploaded recording is used instead of the built-in one.</p>
      {!data ? <div className="qa-skel" /> : !lesson ? <p className="qa-muted">Lessons file not found — rebuild the admin panel.</p> : (
        <div className="qa-recgrid">
          {lesson.items.map((x) => {
            const mine = audio[x.id];
            const built = x.audio ? data.audioBase + x.audio : null;
            return (
              <div key={x.id} className={`qa-rec${mine ? " mine" : built ? " built" : " none"}`}>
                <b dir="rtl">{x.t}</b>
                <small>{mine ? "Your recording" : built ? "Quran.com recitation" : "No recording yet"}</small>
                <div className="act">
                  {(mine || built) && <button className="qa-icon-btn" title="Listen" onClick={() => listen(mine || built)}><I.music /></button>}
                  <label className={`qa-btn sm${busy === x.id ? " dis" : ""}`}>{busy === x.id ? "…" : mine ? "Change" : "Upload"}
                    <input type="file" accept="audio/*,.mp3,.m4a,.ogg,.wav,.aac,.webm" hidden onChange={(e) => { upload(x.id, e.target.files[0]); e.target.value = ""; }} /></label>
                  {mine && <button className="qa-icon-btn red" title="Remove" onClick={() => remove(x.id)}><I.trash /></button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TajweedBody() {
  const { notify } = useUi();
  const [t, setT] = useState(null);
  const [audio, setAudio] = useState({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { api("/v1/admin/tajweed").then((r) => { setT(r.tajweed); setAudio(r.audio || {}); }).catch((e) => notify(e.message, "err")); }, [notify]);
  const save = async () => {
    setBusy(true);
    try { const r = await api("/v1/admin/tajweed", { method: "PUT", body: t }); setT(r.tajweed); notify("Saved — the website uses it now"); }
    catch (e) { notify(e.message, "err"); }
    setBusy(false);
  };
  if (!t) return <div className="qa-skel" />;
  return (
    <div className="qa-tajweed">
      <div className="qa-grid2 top"><Access t={t} setT={setT} onSave={save} busy={busy} /><Codes plans={t.plans} /></div>
      <Recordings audio={audio} setAudio={setAudio} />
    </div>
  );
}

export default function Tajweed() {
  return <Shell title="Learn Tajweed"><TajweedBody /></Shell>;
}
