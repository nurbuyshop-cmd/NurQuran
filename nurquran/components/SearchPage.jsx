"use client";
// Search — same layout as the reference app: Ask AI + search box, Exact / Affixes / All Roots, content picker.
//   Exact      the whole word, as typed
//   Affixes    any word that contains it (with prefixes / suffixes)
//   All Roots  every ayah that uses a word from the same Arabic root (Quranic Arabic Corpus)
//   Ask AI     type a question in any language; ayahs are ranked by how many of its key words they share
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BASE, addStaticFonts } from "@/lib/quran/mushaf";
import { surah } from "@/lib/quran/meta";
import "./pages.css";

const AR = /[؀-ۿ]/;
const norm = (t) => String(t || "")
  .replace(/[ً-ٰٟۖ-ۭـ]/g, "")
  .replace(/[ٱأإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/ؤ/g, "و").replace(/ئ/g, "ي");
const loose = (t) => norm(t).replace(/ا/g, ""); // Uthmani spelling often drops the long alif (ٱلْكِتَٰبُ = الكتاب)
const STOP = new Set("a an the of to in on for and or is are was were be by with what which who whom how why when where do does did i me my we our you your he she it they them this that these those about from as at not no can will shall there their his her its all any some tell show give find ayah ayat verse verses quran surah allah says say said".split(" "));
const BN_STOP = new Set("কি কী কেন কোথায় কিভাবে কীভাবে কে এবং ও আর এর এই সেই যে যা তা হয় হলো হল করে করা আছে নেই একটি এক জন সম্পর্কে বিষয়ে নিয়ে বলুন বলো দাও দিন আয়াত কুরআন কোরআন".split(" "));

const cache = {};
const getJSON = (u) => (cache[u] = cache[u] || fetch(u).then((r) => r.json()));

function Mark({ text, term }) {
  if (!term) return text;
  const i = text.toLowerCase().indexOf(term.toLowerCase());
  if (i < 0) return text;
  return <>{text.slice(0, i)}<mark>{text.slice(i, i + term.length)}</mark>{text.slice(i + term.length)}</>;
}

export default function SearchPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [mode, setMode] = useState("affix");
  const [content, setContent] = useState("ar");
  const [menu, setMenu] = useState(false);
  const [langs, setLangs] = useState([]);
  const [ar, setAr] = useState(null);
  const [tr, setTr] = useState({});
  const [roots, setRoots] = useState(null);
  const [ai, setAi] = useState(false);
  const inp = useRef(null);

  useEffect(() => {
    addStaticFonts();
    getJSON(`${BASE}/quran/search.json`).then((rows) => setAr(rows.map(([s, a, t, d], i) => ({ i, s, a, t, d: d || t, n: norm(t), l: loose(t) })))).catch(() => setAr([]));
    getJSON(`${BASE}/quran/tr/index.json`).then(setLangs).catch(() => {});
    try { const p = JSON.parse(localStorage.getItem("nq_search") || "null"); if (p) { setMode(p.mode || "affix"); setContent(p.content || "ar"); } } catch (e) {}
  }, []);
  useEffect(() => { try { localStorage.setItem("nq_search", JSON.stringify({ mode, content })); } catch (e) {} }, [mode, content]);
  // translations load when chosen (or for Ask AI)
  const need = useMemo(() => {
    const ids = new Set();
    if (content !== "ar") ids.add(content);
    if (ai) { ids.add("en-sahih"); ids.add("bn-taisirul"); }
    return [...ids];
  }, [content, ai]);
  useEffect(() => {
    need.forEach((id) => { if (!tr[id]) getJSON(`${BASE}/quran/tr/${id}.json`).then((rows) => setTr((m) => ({ ...m, [id]: rows }))).catch(() => {}); });
  }, [need, tr]);
  useEffect(() => { if (mode === "root" && !roots) getJSON(`${BASE}/quran/roots.json`).then(setRoots).catch(() => setRoots({ roots: {}, forms: {} })); }, [mode, roots]);

  const term = q.trim();
  const refMatch = term.match(/^(\d{1,3})\s*[:.\s]\s*(\d{1,3})$/);

  const results = useMemo(() => {
    if (!ar || term.length < 2) return null;
    // Ask AI: rank ayahs by shared key words (Arabic, English and Bengali)
    if (ai) {
      // key words; long English words are cut to their stem so "patience" also finds "patient", "patiently"
      const words = term.toLowerCase().split(/[\s,.?!؟،।]+/).filter((w) => w.length > 1 && !STOP.has(w) && !BN_STOP.has(w))
        .map((w) => (/^[a-z]+$/.test(w) && w.length > 6 ? w.slice(0, w.length - (w.endsWith("ness") || w.endsWith("ment") ? 4 : 2)) : w));
      if (!words.length) return [];
      const sources = [["ar", ar.map((x) => x.n)], ...need.filter((id) => tr[id]).map((id) => [id, tr[id].map((r) => r[2].toLowerCase())])];
      const score = new Array(ar.length).fill(0);
      words.forEach((w) => {
        const wn = AR.test(w) ? norm(w) : w;
        sources.forEach(([id, texts]) => {
          if ((id === "ar") !== AR.test(w)) return;
          texts.forEach((t, i) => { if (t.includes(wn)) score[i] += 1 + (t.split(wn).length - 2) * 0.2; });
        });
      });
      return ar.map((x, i) => ({ ...x, sc: score[i] })).filter((x) => x.sc > 0).sort((a, b) => b.sc - a.sc).slice(0, 60);
    }
    if (content === "ar") {
      if (!AR.test(term)) return [];
      const t = norm(term), tl = loose(term);
      if (mode === "root") {
        if (!roots) return null;
        const set = new Set();
        const add = (r) => (roots.roots[r] || "").split(",").filter(Boolean).forEach((k) => set.add(k));
        // the typed text can be a root itself (e.g. كتب) or any word from the Quran (e.g. الكتاب, يكتبون)
        if (roots.roots[t]) add(t);
        t.split(/\s+/).forEach((w) => {
          (roots.forms[w] || "").split(",").filter(Boolean).forEach(add);
          if (!roots.forms[w]) Object.keys(roots.forms).forEach((f) => { if (f.replace(/ا/g, "") === w.replace(/ا/g, "")) roots.forms[f].split(",").forEach(add); });
        });
        return ar.filter((x) => set.has(`${x.s}:${x.a}`));
      }
      if (mode === "exact") {
        const tw = t.split(/\s+/), tlw = tl.split(/\s+/);
        return ar.filter((x) => {
          const ws = x.n.split(/\s+/), wl = x.l.split(/\s+/);
          return tw.length === 1 ? ws.includes(tw[0]) || wl.includes(tlw[0]) : x.n.includes(t) || x.l.includes(tl);
        });
      }
      return ar.filter((x) => x.n.includes(t) || x.l.includes(tl));
    }
    const rows = tr[content];
    if (!rows) return null;
    const low = term.toLowerCase();
    const re = mode === "exact" ? new RegExp(`(^|[^\\p{L}])${low.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^\\p{L}])`, "u") : null;
    return rows.map((r, i) => ({ ...ar[i], tx: r[2] })).filter((x) => (re ? re.test(x.tx.toLowerCase()) : x.tx.toLowerCase().includes(low)));
  }, [ar, tr, roots, term, mode, content, ai, need]);

  const open = (s, a) => router.push(`/quran/?s=${s}&a=${a}`);
  const label = content === "ar" ? "Al-Quran" : (langs.find((l) => l.id === content) || {}).label || content;
  const trFor = (x) => {
    if (x.tx) return x.tx;
    const id = content !== "ar" ? content : ai ? "en-sahih" : null;
    return id && tr[id] ? tr[id][x.i]?.[2] : null;
  };

  return (
    <div className="np">
      <header className="np-head">
        <button className="b" aria-label="Back" onClick={() => (history.length > 1 ? router.back() : router.push("/"))}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <span className="sep" />
        <h1>Search</h1>
      </header>

      <div className="sr-box">
        <div className={`sr-input${ai ? " ai" : ""}`}>
          <button className={`askai${ai ? " on" : ""}`} onClick={() => { setAi((v) => !v); inp.current && inp.current.focus(); }} aria-pressed={ai}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5L21 21" /></svg>
            Ask AI
          </button>
          <input ref={inp} value={q} onChange={(e) => setQ(e.target.value)} placeholder={ai ? "Ask anything… e.g. patience in hardship" : "Search"}
            dir="auto" enterKeyHint="search" autoComplete="off" />
          {q && <button className="clr" aria-label="Clear" onClick={() => { setQ(""); inp.current && inp.current.focus(); }}>
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor" /><path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>}
        </div>

        {!ai && (
          <div className="sr-seg">
            {[["exact", "Exact"], ["affix", "Affixes"], ["root", "All Roots"]].map(([k, l]) => (
              <button key={k} className={mode === k ? "on" : ""} onClick={() => setMode(k)}
                disabled={k === "root" && content !== "ar"} title={k === "root" && content !== "ar" ? "Roots work with the Arabic text" : undefined}>{l}</button>
            ))}
            <button className="dd" onClick={() => setMenu((m) => !m)}>{label.replace(/ \(.*\)$/, "")}<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6z" fill="currentColor" /></svg></button>
            {menu && (
              <>
                <div className="sr-menu-bg" onClick={() => setMenu(false)} />
                <div className="sr-menu">
                  <small>Available content for searching:</small>
                  <button className={content === "ar" ? "on" : ""} onClick={() => { setContent("ar"); setMenu(false); }}>Al-Quran</button>
                  {langs.map((l) => (
                    <button key={l.id} className={content === l.id ? "on" : ""} onClick={() => { setContent(l.id); if (mode === "root") setMode("affix"); setMenu(false); }}>{l.label}</button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {!term && (
        <div className="sr-hint">
          <p>Ask anything and find related ayas with AI button</p>
          <p>You can also add Arabic keyboard using Setting =&gt; Language &amp; input =&gt; Language =&gt; Add Arabic</p>
        </div>
      )}

      {term && (
        <div className="sr-res">
          {refMatch && surah(+refMatch[1]) && +refMatch[2] >= 1 && +refMatch[2] <= surah(+refMatch[1]).ayahs && (
            <button className="sr-go" onClick={() => open(+refMatch[1], +refMatch[2])}>Go to {surah(+refMatch[1]).en} {refMatch[1]}:{refMatch[2]} →</button>
          )}
          {results === null && <p className="sr-empty">Searching…</p>}
          {results && !results.length && !refMatch && (
            <p className="sr-empty">{content === "ar" && !ai && !AR.test(term) ? "Type in Arabic to search the Quran text, or choose a translation from the menu." : "No ayahs found."}</p>
          )}
          {results && results.length > 0 && <div className="sr-count">{results.length > 300 ? "300+" : results.length} {ai ? "related ayahs" : "ayahs"}</div>}
          {results && results.slice(0, 300).map((x) => {
            const t = trFor(x);
            return (
              <button key={`${x.s}:${x.a}`} className="sr-item" onClick={() => open(x.s, x.a)}>
                <span className="ref">{surah(x.s).en} {x.s}:{x.a}</span>
                <span className="ar" dir="rtl">{x.d}</span>
                {t && <span className="tx" dir="auto"><Mark text={t} term={content !== "ar" && !ai ? term : ""} /></span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
