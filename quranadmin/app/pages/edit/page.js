"use client";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Shell from "@/components/Shell";
import { api } from "@/lib/api";
import { I, useUi } from "@/components/ui";
import { SURAHS, surah } from "@/lib/meta";

let uid = 0;
const nid = () => `b${++uid}`;
const withIds = (blocks) => blocks.map((b) => ({ ...b, _id: nid() }));
const LATIN = /[A-Za-z]/;
const toAr = (n) => String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);

// what comes after ayah s:a — may need a new surah title + bismillah
function after(s, a) {
  if (!s) return [{ t: "surah", s: 1 }, { t: "ayah", s: 1, a: 1, text: "" }];
  if (a < surah(s).ayahs) return [{ t: "ayah", s, a: a + 1, text: "" }];
  if (s >= 114) return [];
  const n = s + 1;
  return [{ t: "surah", s: n }, ...(n === 9 ? [] : [{ t: "bismillah" }]), { t: "ayah", s: n, a: 1, text: "" }];
}
const lastAyah = (blocks) => [...blocks].reverse().find((b) => b.t === "ayah" && b.s);

function Editor() {
  const params = useSearchParams();
  const router = useRouter();
  const { notify, ask } = useUi();
  const editN = params.get("n") ? +params.get("n") : null;
  const newN = params.get("new") ? +params.get("new") : null;

  const [loaded, setLoaded] = useState(false);
  const [pageNo, setPageNo] = useState("");
  const [juz, setJuz] = useState("");
  const [hizb, setHizb] = useState("");
  const [blocks, setBlocks] = useState([]);
  const [langs, setLangs] = useState([]);
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [paste, setPaste] = useState(null);
  const [showTr, setShowTr] = useState(false);
  const [uploading, setUploading] = useState("");
  const saveRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const [{ pages }, { settings }] = await Promise.all([api("/v1/admin/pages"), api("/v1/admin/settings")]);
        setLangs(settings.languages);
        if (editN) {
          const p = pages.find((x) => x.page === editN);
          if (!p) { notify(`Page ${editN} not found`, "err"); router.replace("/pages/"); return; }
          setPageNo(p.page); setJuz(p.juz); setHizb(p.hizb || ""); setBlocks(withIds(p.blocks));
        } else {
          const n = newN || 1;
          const prev = [...pages].filter((p) => p.page < n).sort((a, b) => b.page - a.page)[0];
          const last = prev ? lastAyah(prev.blocks) : null;
          setPageNo(n); setJuz(prev ? prev.juz : 1); setHizb(prev?.hizb || "");
          setBlocks(withIds(last ? after(last.s, last.a) : after(null)));
        }
        setLoaded(true);
      } catch (e) { notify(e.message, "err"); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editN, newN]);

  useEffect(() => {
    const warn = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const change = (fn) => { setBlocks(fn); setDirty(true); };
  const upd = (id, patch) => change((bs) => bs.map((b) => (b._id === id ? { ...b, ...patch } : b)));
  const remove = (id) => change((bs) => bs.filter((b) => b._id !== id));
  const move = (i, d) => change((bs) => { const n = [...bs]; const j = i + d; if (j < 0 || j >= n.length) return n; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const insertAt = (i, items) => change((bs) => { const n = [...bs]; n.splice(i, 0, ...withIds(items)); return n; });
  const addNextAyah = () => {
    const l = lastAyah(blocks);
    const items = l ? after(l.s, l.a) : after(null);
    if (!items.length) { notify("That was the last ayah of the Quran", "err"); return; }
    insertAt(blocks.length, items);
    setTimeout(() => { const els = document.querySelectorAll(".qe-ar"); els[els.length - 1]?.focus(); }, 50);
  };

  const body = () => ({
    page: +pageNo, juz: +juz, hizb: hizb === "" ? "" : +hizb,
    blocks: blocks.map(({ _id, ...b }) => b),
  });
  const save = useCallback(async (goNext) => {
    setSaving(true); setErrors([]);
    try {
      const b = body();
      if (editN) await api(`/v1/admin/pages/${editN}`, { method: "PUT", body: b });
      else await api("/v1/admin/pages", { method: "POST", body: b });
      setDirty(false);
      notify(`Page ${b.page} saved — it is live on the website`);
      if (goNext) router.push(`/pages/edit/?new=${b.page + 1}`);
      else if (!editN || editN !== b.page) router.replace(`/pages/edit/?n=${b.page}`);
    } catch (e) {
      setErrors(e.errors || [e.message]);
      notify("Please fix the problems shown in red", "err");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setSaving(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNo, juz, hizb, blocks, editN]);
  saveRef.current = save;
  useEffect(() => {
    const k = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); saveRef.current(false); } };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  const delPage = async () => {
    if (!(await ask({ title: `Delete page ${editN}?`, message: "It will be removed from the website. A backup is kept on the server.", ok: "Delete", danger: true }))) return;
    try { await api(`/v1/admin/pages/${editN}`, { method: "DELETE" }); setDirty(false); notify(`Page ${editN} deleted`); router.replace("/pages/"); }
    catch (e) { notify(e.message, "err"); }
  };

  const uploadAudio = async (b, file) => {
    if (!file) return;
    setUploading(b._id);
    try {
      const form = new FormData();
      form.append("file", file);
      const r = await api(`/v1/admin/upload?tag=${b.s}_${b.a}`, { method: "POST", form });
      upd(b._id, { audio: r.url });
      notify(`Audio uploaded for ${b.s}:${b.a}`);
    } catch (e) { notify(e.message, "err"); }
    setUploading("");
  };

  const applyPaste = () => {
    const lines = paste.text.split(/\r?\n/).map((x) => x.replace(/[۝\d٠-٩()﴾﴿]+\s*$/u, "").trim()).filter(Boolean);
    if (!lines.length) { setPaste(null); return; }
    let s = +paste.s, a = +paste.a;
    const items = [];
    for (const text of lines) {
      if (a > surah(s).ayahs) { notify(`Stopped at the end of ${surah(s).en}`, "err"); break; }
      items.push({ t: "ayah", s, a, text });
      a++;
    }
    insertAt(blocks.length, items);
    setPaste(null);
    notify(`${items.length} ayahs added`);
  };
  const openPaste = () => {
    const l = lastAyah(blocks);
    const nx = l ? after(l.s, l.a).find((x) => x.t === "ayah") : { s: 1, a: 1 };
    setPaste({ s: nx?.s || 1, a: nx?.a || 1, text: "" });
  };

  if (!loaded) return <div className="qa-skel" />;

  const title = editN ? `Edit page ${editN}` : `New page ${pageNo}`;
  return (
    <div className="qe">
      <div className="qe-head">
        <Link href="/pages/" className="qa-link">← All pages</Link>
        <h2>{title}{dirty && <span className="qe-dirty">unsaved</span>}</h2>
        <div className="qe-head-act">
          {editN && <button className="qa-btn ghost red" onClick={delPage}><I.trash />Delete</button>}
          <button className="qa-btn ghost" disabled={saving} onClick={() => save(true)}>Save & next page</button>
          <button className="qa-btn" disabled={saving} onClick={() => save(false)}><I.check />{saving ? "Saving…" : "Save"}</button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="qa-err list"><b>Could not save:</b><ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul></div>
      )}

      <div className="qe-grid">
        <div className="qe-left">
          <div className="qa-card qe-meta">
            <label>Page number<input className="qa-input" inputMode="numeric" value={pageNo} onChange={(e) => { setPageNo(e.target.value.replace(/\D/g, "")); setDirty(true); }} /></label>
            <label>Juz (Para)<select className="qa-input" value={juz} onChange={(e) => { setJuz(e.target.value); setDirty(true); }}>{Array.from({ length: 30 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></label>
            <label>Hizb <small>(optional)</small><input className="qa-input" inputMode="numeric" value={hizb} onChange={(e) => { setHizb(e.target.value.replace(/\D/g, "")); setDirty(true); }} /></label>
          </div>

          {blocks.map((b, i) => (
            <div key={b._id} className={`qa-card qe-block ${b.t}`}>
              <div className="qe-bh">
                <span className="qe-type">{b.t === "ayah" ? `Ayah ${b.s || "?"}:${b.a || "?"}` : b.t === "surah" ? "Surah title" : "Bismillah"}</span>
                <div className="qe-bact">
                  <button className="qa-icon-btn" onClick={() => move(i, -1)} disabled={i === 0} title="Move up"><I.up /></button>
                  <button className="qa-icon-btn" onClick={() => move(i, 1)} disabled={i === blocks.length - 1} title="Move down"><I.down /></button>
                  <button className="qa-icon-btn red" onClick={() => remove(b._id)} title="Remove"><I.x /></button>
                </div>
              </div>
              {b.t === "surah" && (
                <select className="qa-input" value={b.s || ""} onChange={(e) => upd(b._id, { s: +e.target.value })}>
                  {SURAHS.map((s) => <option key={s.n} value={s.n}>{s.n}. {s.en} — {s.ar}</option>)}
                </select>
              )}
              {b.t === "bismillah" && <p className="qe-bism">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ <small>(shown as a line before the surah)</small></p>}
              {b.t === "ayah" && (
                <>
                  <div className="qe-row">
                    <select className="qa-input" value={b.s || ""} onChange={(e) => upd(b._id, { s: +e.target.value, a: 1 })}>
                      {SURAHS.map((s) => <option key={s.n} value={s.n}>{s.n}. {s.en}</option>)}
                    </select>
                    <input className="qa-input sm" inputMode="numeric" value={b.a || ""} placeholder="Ayah"
                      onChange={(e) => upd(b._id, { a: +e.target.value.replace(/\D/g, "") || "" })} />
                    <span className="qa-muted">of {b.s ? surah(b.s).ayahs : "?"}</span>
                  </div>
                  <textarea className="qe-ar" dir="rtl" lang="ar" rows={2} placeholder="آية — paste or type the Arabic text exactly"
                    value={b.text || ""} onChange={(e) => upd(b._id, { text: e.target.value })} />
                  {LATIN.test(b.text || "") && <div className="qe-warn">This text contains English letters.</div>}
                  <details className="qe-more" open={!!(b.tr && Object.values(b.tr).some(Boolean)) || !!b.audio}>
                    <summary>Translation & audio</summary>
                    {langs.map((l) => (
                      <label key={l.code} className="qe-tr">{l.name}
                        <textarea className="qa-input" rows={2} lang={l.code} value={(b.tr && b.tr[l.code]) || ""}
                          onChange={(e) => upd(b._id, { tr: { ...(b.tr || {}), [l.code]: e.target.value } })} />
                      </label>
                    ))}
                    <div className="qe-audio">
                      <span className="lb"><I.music />Recitation</span>
                      <input className="qa-input" placeholder="Audio URL" value={b.audio || ""} onChange={(e) => upd(b._id, { audio: e.target.value })} />
                      <label className="qa-btn ghost sm">
                        {uploading === b._id ? "Uploading…" : "Upload"}
                        <input type="file" accept="audio/*" hidden onChange={(e) => uploadAudio(b, e.target.files[0])} />
                      </label>
                      {b.audio && <audio src={b.audio} controls preload="none" />}
                    </div>
                  </details>
                </>
              )}
              <div className="qe-insert">
                <button onClick={() => insertAt(i + 1, [{ t: "ayah", s: b.s || 1, a: b.t === "ayah" ? (b.a || 0) + 1 : 1, text: "" }])}>+ Ayah here</button>
                <button onClick={() => insertAt(i + 1, [{ t: "surah", s: Math.min(114, (b.s || 0) + 1) }])}>+ Surah title</button>
                <button onClick={() => insertAt(i + 1, [{ t: "bismillah" }])}>+ Bismillah</button>
              </div>
            </div>
          ))}

          <div className="qe-add">
            <button className="qa-btn" onClick={addNextAyah}><I.plus />Next ayah</button>
            <button className="qa-btn ghost" onClick={openPaste}><I.paste />Paste many ayahs</button>
            <button className="qa-btn ghost" onClick={() => insertAt(blocks.length, [{ t: "surah", s: Math.min(114, (lastAyah(blocks)?.s || 0) + 1) }])}>+ Surah title</button>
            <button className="qa-btn ghost" onClick={() => insertAt(blocks.length, [{ t: "bismillah" }])}>+ Bismillah</button>
          </div>
          <p className="qa-muted small">Tip: press Ctrl + S to save. Each ayah can be on only one page.</p>
        </div>

        <div className="qe-right">
          <div className="qe-prev-h">
            <b>Preview</b>
            <label className="qa-check"><input type="checkbox" checked={showTr} onChange={(e) => setShowTr(e.target.checked)} />Show translation</label>
          </div>
          <div className="qe-prev">
            {blocks.map((b) => {
              if (b.t === "surah") return <div key={b._id} className="pv-surah">سُورَةُ {b.s ? surah(b.s).ar : ""}</div>;
              if (b.t === "bismillah") return <div key={b._id} className="pv-bism">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>;
              return (
                <span key={b._id} className="pv-ay">
                  {b.text || <i className="pv-empty">…</i>} <span className="pv-mark">{toAr(b.a || "")}</span>{" "}
                  {showTr && langs.map((l) => b.tr && b.tr[l.code] ? <span key={l.code} className="pv-tr" dir="auto">{b.tr[l.code]}</span> : null)}
                </span>
              );
            })}
            <div className="pv-pno">{pageNo}</div>
          </div>
        </div>
      </div>

      {paste && (
        <div className="qa-modal-bg" onClick={() => setPaste(null)}>
          <div className="qa-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Paste many ayahs</h3>
            <p>Put each ayah on its own line. Numbers or ۝ at the end of a line are removed.</p>
            <div className="qe-row">
              <label>Start surah<select className="qa-input" value={paste.s} onChange={(e) => setPaste({ ...paste, s: +e.target.value, a: 1 })}>{SURAHS.map((s) => <option key={s.n} value={s.n}>{s.n}. {s.en}</option>)}</select></label>
              <label>From ayah<input className="qa-input sm" inputMode="numeric" value={paste.a} onChange={(e) => setPaste({ ...paste, a: e.target.value.replace(/\D/g, "") })} /></label>
            </div>
            <textarea className="qe-ar big" dir="rtl" rows={8} autoFocus value={paste.text} onChange={(e) => setPaste({ ...paste, text: e.target.value })} />
            <div className="qa-modal-btns">
              <button className="qa-btn ghost" onClick={() => setPaste(null)}>Cancel</button>
              <button className="qa-btn" onClick={applyPaste}>Add ayahs</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditPage() {
  return (
    <Shell title="Page editor">
      <Suspense fallback={<div className="qa-skel" />}><Editor /></Suspense>
    </Shell>
  );
}
