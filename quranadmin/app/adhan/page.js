"use client";
// Prayer Times → adhan sounds: listen, replace any adhan with your own recording, and choose which need Premium.
import { useEffect, useRef, useState } from "react";
import Shell from "@/components/Shell";
import { api, SITE_URL } from "@/lib/api";
import { I, useUi } from "@/components/ui";

const SOUNDS = [
  ["default", "Default Sound", false],
  ["beep", "Long Beep", false],
  ["mishari", "Mishari Alafasy", true],
  ["mishari_full", "Mishari Alafasy (Full Adhan)", true],
  ["madinah", "Madinah", true],
  ["madinah_full", "Madinah (Full Adhan)", true],
  ["makkah", "Makkah", true],
  ["makkah_full", "Makkah (Full Adhan)", true],
  ["istanbul", "Istanbul", true],
  ["istanbul_full", "Istanbul (Full Adhan)", true],
  ["aqsa", "Alaqsa Masjid", true],
  ["aqsa_full", "Alaqsa Masjid (Full Adhan)", true],
];

function AdhanBody() {
  const { notify } = useUi();
  const [a, setA] = useState(null);
  const [busy, setBusy] = useState("");
  const [saving, setSaving] = useState(false);
  const player = useRef(null);
  const [playing, setPlaying] = useState("");
  useEffect(() => { api("/v1/admin/adhan").then((r) => setA(r.adhan)).catch((e) => notify(e.message, "err")); }, [notify]);

  const listen = (id, url) => {
    const p = player.current;
    if (playing === id) { p.pause(); setPlaying(""); return; }
    p.src = url; p.play().then(() => setPlaying(id)).catch(() => notify("Could not play this sound", "err"));
  };
  const upload = async (id, file) => {
    if (!file) return;
    setBusy(id);
    try {
      const form = new FormData(); form.append("file", file);
      const r = await api(`/v1/admin/adhan/audio?id=${id}`, { method: "POST", form });
      setA((x) => ({ ...x, audio: { ...x.audio, [id]: r.url } })); notify("Adhan uploaded — the website plays it now");
    } catch (e) { notify(e.message, "err"); }
    setBusy("");
  };
  const remove = async (id) => {
    try {
      await api(`/v1/admin/adhan/audio?id=${id}`, { method: "DELETE" });
      setA((x) => { const audio = { ...x.audio }; delete audio[id]; return { ...x, audio }; }); notify("Back to the built-in recording");
    } catch (e) { notify(e.message, "err"); }
  };
  const togglePremium = (id) => setA((x) => ({ ...x, premium: x.premium.includes(id) ? x.premium.filter((p) => p !== id) : [...x.premium, id] }));
  const savePremium = async () => {
    setSaving(true);
    try { const r = await api("/v1/admin/adhan", { method: "PUT", body: { premium: a.premium } }); setA(r.adhan); notify("Saved"); }
    catch (e) { notify(e.message, "err"); }
    setSaving(false);
  };

  if (!a) return <div className="qa-skel" />;
  return (
    <div className="qa-card">
      <audio ref={player} onEnded={() => setPlaying("")} onPause={() => setPlaying("")} />
      <div className="qa-card-h"><h2>Adhan sounds</h2><span className="qa-tag">{SOUNDS.length}</span></div>
      <p className="qa-muted small">These are the sounds visitors choose in Prayer Times → Alarm Settings. Every adhan already has a built-in recording.
        Upload your own file to replace one (mp3 / m4a, max 15 MB). Tick "Premium" for adhans only Premium members can choose.</p>
      <div className="qa-adhan">
        {SOUNDS.map(([id, name, file]) => {
          const mine = a.audio[id];
          const url = mine || (file ? `${SITE_URL}/sounds/${id}.mp3` : null);
          return (
            <div key={id} className="row">
              <span className="nm"><b>{name}</b>
                <small className={mine ? "mine" : ""}>{mine ? "Your uploaded recording" : file ? "Built-in recording" : "Built-in tone"}</small></span>
              <label className="prem"><input type="checkbox" checked={a.premium.includes(id)} onChange={() => togglePremium(id)} />Premium</label>
              <span className="act">
                {url && <button className="qa-icon-btn" title={playing === id ? "Stop" : "Listen"} onClick={() => listen(id, url)}>{playing === id ? <I.x /> : <I.music />}</button>}
                <label className={`qa-btn sm${busy === id ? " dis" : ""}`}>{busy === id ? "…" : mine ? "Change" : "Upload"}
                  <input type="file" accept="audio/*,.mp3,.m4a,.ogg,.wav,.aac" hidden onChange={(e) => { upload(id, e.target.files[0]); e.target.value = ""; }} /></label>
                {mine && <button className="qa-icon-btn red" title="Use built-in recording" onClick={() => remove(id)}><I.trash /></button>}
              </span>
            </div>
          );
        })}
      </div>
      <div className="qa-form-foot"><button className="qa-btn" disabled={saving} onClick={savePremium}>{saving ? "Saving…" : "Save Premium choices"}</button></div>
    </div>
  );
}

export default function Adhan() {
  return <Shell title="Adhan sounds"><AdhanBody /></Shell>;
}
