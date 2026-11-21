"use client";
// Learn Tajweed: who can open it (free for all / limited + Premium), Premium plans and codes, and recordings per item.
import { useCallback, useEffect, useRef, useState } from "react";
import Shell from "@/components/Shell";
import { api } from "@/lib/api";
import { I, useUi, timeAgo } from "@/components/ui";
import { startRecording } from "@/lib/recorder";

const Mic = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21" /></svg>;
const MAX_SEC = 20;

function Access({ t, setT, onSave, busy, lessons }) {
  const setPlan = (i, patch) => setT({ ...t, plans: t.plans.map((p, j) => (j === i ? { ...p, ...patch } : p)) });
  const setAcc = (n, v) => setT({ ...t, lessonAccess: { ...(t.lessonAccess || {}), [n]: v } });
  const setAll = (v) => setT({ ...t, lessonAccess: Object.fromEntries((lessons || []).map((l) => [l.n, v])) });
  return (
    <div className="qa-card qa-form">
      <h2>Access</h2>
      <div className="qa-seg">
        <button className={t.mode === "free" ? "on" : ""} onClick={() => setT({ ...t, mode: "free" })}>Free for everyone</button>
        <button className={t.mode === "limited" ? "on" : ""} onClick={() => setT({ ...t, mode: "limited" })}>Limited (Premium unlocks all)</button>
      </div>
      <p className="qa-muted small">{t.mode === "free"
        ? "Every lesson and every item is open to all visitors."
        : "Choose for each lesson below whether it is free, limited or Premium."}</p>
      {t.mode === "limited" && (
        <>
          <h3>Each lesson <small className="qa-muted">(choose what visitors without Premium can open)</small></h3>
          <div className="qa-seg sm">
            <button onClick={() => setAll("free")}>All free</button>
            <button onClick={() => setAll("limited")}>All limited</button>
            <button onClick={() => setAll("premium")}>All Premium</button>
          </div>
          <div className="qa-lessonacc">
            {(lessons || []).map((l) => {
              const v = (t.lessonAccess || {})[l.n] || "limited";
              return (
                <div key={l.n} className="row">
                  <span className="n">{l.n}</span>
                  <span className="nm"><b dir="rtl">{l.title}</b><small>{l.en}</small></span>
                  <div className="qa-seg xs">
                    {[["free", "Free"], ["limited", "Limited"], ["premium", "Premium"]].map(([k, lb]) => (
                      <button key={k} className={v === k ? `on ${k}` : ""} onClick={() => setAcc(l.n, k)}>{lb}</button>
                    ))}
                  </div>
                </div>
              );
            })}
            {!lessons && <div className="qa-skel" />}
          </div>
          <label>"Limited" lessons: free items at the start<input className="qa-input sm" type="number" min="0" max="200" value={t.freeCount} onChange={(e) => setT({ ...t, freeCount: e.target.value })} /></label>
          <p className="qa-muted small">Free = every item open · Limited = only the first {t.freeCount} items open · Premium = whole lesson locked. People with a Premium code can open everything.</p>
        </>
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

function Recordings({ audio, setAudio, data }) {
  const { notify } = useUi();
  const [n, setN] = useState(1);
  const [busy, setBusy] = useState("");
  const player = useRef(null);
  const recRef = useRef(null);
  const [rec, setRec] = useState(null); // { id, sec } while recording, { id, saving: true } while uploading
  const lesson = data && data.lessons.find((l) => l.n === n);
  // stop the microphone when leaving the page or switching lesson
  useEffect(() => () => { recRef.current && recRef.current.ctl.cancel(); recRef.current = null; }, [n]);
  useEffect(() => {
    if (!rec || rec.saving) return;
    const t = setInterval(() => {
      setRec((r) => (r && !r.saving ? { ...r, sec: r.sec + 1 } : r));
    }, 1000);
    return () => clearInterval(t);
  }, [rec && rec.id, rec && rec.saving]);
  useEffect(() => { if (rec && !rec.saving && rec.sec >= MAX_SEC) stopRec(); });
  const startRec = async (id) => {
    if (recRef.current) return;
    try {
      const ctl = await startRecording();
      recRef.current = { id, ctl };
      setRec({ id, sec: 0 });
    } catch (e) { notify(e.message, "err"); }
  };
  const stopRec = async () => {
    const cur = recRef.current; if (!cur) return;
    recRef.current = null;
    setRec({ id: cur.id, saving: true });
    try {
      const file = await cur.ctl.stop();
      await upload(cur.id, file);
    } catch (e) { notify(e.message, "err"); }
    setRec(null);
  };
  const cancelRec = () => { const cur = recRef.current; recRef.current = null; cur && cur.ctl.cancel(); setRec(null); };
  const listen = (url) => { const a = player.current; a.src = url; a.play().catch(() => notify("Could not play", "err")); };
  const upload = async (id, file) => {
    if (!file) return;
    setBusy(id);
    try {
      const form = new FormData(); form.append("file", file);
      const r = await api(`/v1/admin/tajweed/audio?item=${id}`, { method: "POST", form });
      setAudio((m) => ({ ...m, [id]: r.url })); notify("Recording uploaded — tap the play button to hear it");
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
      <p className="qa-muted small">For any item (alif, ba, …) either tap <b>Record</b> and say it with your own voice — tap <b>Stop</b> when you finish and it is uploaded straight away — or tap Upload to choose an audio file (mp3 / m4a / wav, max 10 MB). Silence before and after your voice is cut off automatically. Words taken from the Quran already have Quran.com's word-by-word recitation; an uploaded recording is used instead of it.</p>
      {!data ? <div className="qa-skel" /> : !lesson ? <p className="qa-muted">Lessons file not found — rebuild the admin panel.</p> : (
        <div className="qa-recgrid">
          {lesson.items.map((x) => {
            const mine = audio[x.id];
            const built = x.audio ? data.audioBase + x.audio : null;
            return (
              <div key={x.id} className={`qa-rec${mine ? " mine" : built ? " built" : " none"}${rec && rec.id === x.id ? " recording" : ""}`}>
                <b dir="rtl">{x.t}</b>
                {rec && rec.id === x.id ? (
                  rec.saving ? <small className="rec-state">Saving…</small>
                  : <small className="rec-state"><i className="dot" />Recording 0:{String(rec.sec).padStart(2, "0")}</small>
                ) : <small>{mine ? "Your recording" : built ? "Quran.com recitation" : "No recording yet"}</small>}
                {rec && rec.id === x.id && !rec.saving ? (
                  <div className="act">
                    <button className="qa-btn sm rec-stop" onClick={stopRec}><i className="sq" />Stop</button>
                    <button className="qa-icon-btn" title="Cancel" onClick={cancelRec}><I.x /></button>
                  </div>
                ) : (
                <div className="act">
                  <button className="qa-btn sm rec-btn" title="Record with your voice" disabled={!!rec || busy === x.id} onClick={() => startRec(x.id)}><Mic />Record</button>
                  {(mine || built) && <button className="qa-icon-btn" title="Listen" onClick={() => listen(mine || built)}><I.music /></button>}
                  <label className={`qa-btn sm ghost${busy === x.id || rec ? " dis" : ""}`}>{busy === x.id ? "…" : mine ? "Change" : "Upload"}
                    <input type="file" accept="audio/*,.mp3,.m4a,.ogg,.wav,.aac,.webm" hidden onChange={(e) => { upload(x.id, e.target.files[0]); e.target.value = ""; }} /></label>
                  {mine && <button className="qa-icon-btn red" title="Remove" onClick={() => remove(x.id)}><I.trash /></button>}
                </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// built-in lessons with the admin panel's edits applied
const mergeLessons = (base, edits) => {
  const map = new Map((base || []).map((l) => [l.n, l]));
  Object.values(edits || {}).forEach((l) => { if (l && l.n) map.set(+l.n, { ...map.get(+l.n), ...l, n: +l.n, edited: true }); });
  return [...map.values()].sort((a, b) => a.n - b.n);
};

function LessonEditor({ data, edits, setEdits }) {
  const { notify, ask } = useUi();
  const [n, setN] = useState(1);
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);
  const lesson = data && data.lessons.find((l) => l.n === n);
  useEffect(() => { if (lesson) setF(JSON.parse(JSON.stringify({ title: lesson.title, en: lesson.en || "", cols: lesson.cols, items: lesson.items }))); }, [lesson && lesson.n, edits]); // eslint-disable-line
  const setItem = (i, patch) => setF({ ...f, items: f.items.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
  const move = (i, d) => { const it = [...f.items]; const [x] = it.splice(i, 1); it.splice(i + d, 0, x); setF({ ...f, items: it }); };
  const save = async () => {
    setBusy(true);
    try {
      const r = await api(`/v1/admin/tajweed/lessons/${n}`, { method: "PUT", body: f });
      setEdits((m) => ({ ...m, [n]: r.lesson })); notify("Lesson saved — the website shows it now");
    } catch (e) { notify(e.message, "err"); }
    setBusy(false);
  };
  const reset = async () => {
    if (!(await ask({ title: `Undo all changes to lesson ${n}?`, message: "The original lesson comes back. A lesson you added is removed.", ok: "Undo changes", danger: true }))) return;
    try {
      await api(`/v1/admin/tajweed/lessons/${n}`, { method: "DELETE" });
      setEdits((m) => { const x = { ...m }; delete x[n]; return x; });
      if (!data.base.some((l) => l.n === n)) setN(1);
      notify("Original lesson restored");
    } catch (e) { notify(e.message, "err"); }
  };
  const addLesson = () => {
    const next = Math.max(...data.lessons.map((l) => l.n)) + 1;
    setEdits((m) => ({ ...m, [next]: { n: next, title: "درس جديد", en: "New lesson", items: [{ id: `${next}-1`, t: "ا", sp: "" }], draft: true } }));
    setN(next);
  };
  return (
    <div className="qa-card qa-form">
      <div className="qa-card-h"><h2>Edit lessons</h2>
        {data && <select className="qa-input" style={{ maxWidth: 320 }} value={n} onChange={(e) => setN(+e.target.value)}>
          {data.lessons.map((l) => <option key={l.n} value={l.n}>{l.n}. {l.title} ({l.en}){l.edited ? " · edited" : ""}</option>)}
        </select>}
        <button className="qa-btn ghost sm" onClick={addLesson}><I.plus />New lesson</button>
      </div>
      <p className="qa-muted small">Change a lesson's name, the letters / words in it and their spellings, change the order or add new items. Saved changes show on the website straight away.</p>
      {!f ? <div className="qa-skel" /> : (
        <>
          <div className="qa-grid2">
            <label>Lesson name (Arabic)<input className="qa-input" dir="rtl" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
            <label>Lesson name (English)<input className="qa-input" value={f.en} onChange={(e) => setF({ ...f, en: e.target.value })} /></label>
          </div>
          <div className="qa-itemedit">
            <div className="hd"><span>#</span><span>Letter / word</span><span>Spelling (shown under it)</span><span /></div>
            {f.items.map((x, i) => (
              <div key={x.id || i} className="row">
                <span className="n">{i + 1}</span>
                <input className="qa-input ar" dir="rtl" value={x.t} onChange={(e) => setItem(i, { t: e.target.value })} />
                <input className="qa-input" dir="auto" value={x.sp || ""} placeholder={x.v ? "(automatic: letter name + vowel)" : ""} onChange={(e) => setItem(i, { sp: e.target.value })} />
                <span className="act">
                  <button className="qa-icon-btn" title="Move up" disabled={!i} onClick={() => move(i, -1)}><I.up /></button>
                  <button className="qa-icon-btn" title="Move down" disabled={i === f.items.length - 1} onClick={() => move(i, 1)}><I.down /></button>
                  <button className="qa-icon-btn red" title="Remove" onClick={() => setF({ ...f, items: f.items.filter((_, j) => j !== i) })}><I.trash /></button>
                </span>
              </div>
            ))}
          </div>
          <div className="qa-form-foot">
            <button className="qa-btn ghost" onClick={() => setF({ ...f, items: [...f.items, { t: "", sp: "" }] })}><I.plus />Add item</button>
            {lesson && lesson.edited && !lesson.draft && <button className="qa-btn ghost" onClick={reset}>Undo changes</button>}
            <button className="qa-btn" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save lesson"}</button>
          </div>
        </>
      )}
    </div>
  );
}

function TajweedBody() {
  const { notify } = useUi();
  const [t, setT] = useState(null);
  const [audio, setAudio] = useState({});
  const [busy, setBusy] = useState(false);
  const [base, setBase] = useState(null);
  const [edits, setEdits] = useState({});
  useEffect(() => { api("/v1/admin/tajweed").then((r) => { setT(r.tajweed); setAudio(r.audio || {}); }).catch((e) => notify(e.message, "err")); }, [notify]);
  useEffect(() => {
    (window.__TAJ_LESSONS__ ? Promise.resolve(window.__TAJ_LESSONS__) : fetch("/tajweed/lessons.json").then((r) => r.json())).then(setBase).catch(() => setBase({ lessons: [] }));
    api("/v1/admin/tajweed/lessons").then((r) => setEdits(r.lessons || {})).catch(() => {});
  }, []);
  const data = base ? { ...base, base: base.lessons, lessons: mergeLessons(base.lessons, edits) } : null;
  const save = async () => {
    setBusy(true);
    try { const r = await api("/v1/admin/tajweed", { method: "PUT", body: t }); setT(r.tajweed); notify("Saved — the website uses it now"); }
    catch (e) { notify(e.message, "err"); }
    setBusy(false);
  };
  if (!t) return <div className="qa-skel" />;
  return (
    <div className="qa-tajweed">
      <div className="qa-grid2 top"><Access t={t} setT={setT} onSave={save} busy={busy} lessons={data && data.lessons} /><Codes plans={t.plans} /></div>
      <Recordings audio={audio} setAudio={setAudio} data={data} />
      <LessonEditor data={data} edits={edits} setEdits={setEdits} />
    </div>
  );
}

export default function Tajweed() {
  return <Shell title="Learn Tajweed"><TajweedBody /></Shell>;
}
