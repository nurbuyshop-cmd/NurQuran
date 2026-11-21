"use client";
// About Us + Privacy Policy: the two pages linked in the website footer. Edit here; the website shows the change at once.
// The page address never changes (…/about and …/privacy-policy), so the Play Store link stays the same.
import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { api, SITE_URL } from "@/lib/api";
import { I, useUi } from "@/components/ui";
import RichText from "@/components/RichText";

const PAGES = [
  ["about", "About Us", "/about"],
  ["privacy", "Privacy Policy", "/privacy-policy"],
];
const fmt = (iso) => { try { return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } };

function Editor({ slug, path, initial, onSaved }) {
  const { notify } = useUi();
  const [f, setF] = useState({ title: initial.title, body: initial.body });
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState("edit");
  const dirty = f.title !== initial.title || f.body !== initial.body;
  const url = `${SITE_URL}${path}`;

  const save = async () => {
    setBusy(true);
    try {
      const r = await api(`/v1/admin/content/${slug}`, { method: "PUT", body: f });
      onSaved(slug, r.page);
      notify("Saved — the website shows the new text now");
    } catch (e) { notify(e.message, "err"); }
    setBusy(false);
  };
  const copy = () => { try { navigator.clipboard.writeText(location.protocol + url.replace(/^https?:/, "")); notify("Link copied"); } catch (e) {} };

  return (
    <div className="qa-card qa-form sp-card">
      <div className="sp-link">
        <span>Page link:</span>
        <a href={url} target="_blank" rel="noreferrer">{url.replace(/^\/\//, "")}</a>
        <button className="qa-btn ghost sm" onClick={copy}>Copy</button>
      </div>
      <p className="qa-muted small">Last updated: {initial.updatedAt ? fmt(initial.updatedAt) : "—"} (shown on the page automatically)</p>
      <label>Page title<input className="qa-input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
      <div className="sp-bar">
        <div className="qa-seg">
          <button className={view === "edit" ? "on" : ""} onClick={() => setView("edit")}>Write</button>
          <button className={view === "preview" ? "on" : ""} onClick={() => setView("preview")}>Preview</button>
        </div>
        <span className="qa-muted small">Start a line with <b>## </b> for a heading, <b>- </b> for a bullet point. Leave an empty line between paragraphs. <b>**bold**</b></span>
      </div>
      {view === "edit"
        ? <textarea className="qa-input sp-text" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} spellCheck />
        : <div className="sp-preview"><h1>{f.title}</h1><RichText text={f.body} /></div>}
      <div className="qa-form-foot">
        {dirty && <button className="qa-btn ghost" disabled={busy} onClick={() => setF({ title: initial.title, body: initial.body })}>Undo changes</button>}
        <button className="qa-btn" disabled={busy || !dirty} onClick={save}><I.check />{busy ? "Saving…" : "Save page"}</button>
      </div>
    </div>
  );
}

function Body() {
  const { notify } = useUi();
  const [content, setContent] = useState(null);
  const [tab, setTab] = useState("about");
  useEffect(() => { api("/v1/admin/content").then((r) => setContent(r.content)).catch((e) => notify(e.message, "err")); }, [notify]);
  if (!content) return <div className="qa-skel" />;
  const cur = PAGES.find((p) => p[0] === tab);
  return (
    <>
      <p className="qa-muted small sp-intro">These two pages are linked at the bottom (footer) of the website. Use the Privacy Policy link in Google Play Console — the link stays the same when you change the text here.</p>
      <div className="qa-seg sp-tabs">
        {PAGES.map(([id, label]) => <button key={id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>{label}</button>)}
      </div>
      <Editor key={`${tab}-${content[tab].updatedAt}`} slug={tab} path={cur[2]} initial={content[tab]}
        onSaved={(slug, page) => setContent((c) => ({ ...c, [slug]: page }))} />
    </>
  );
}

export default function SitePages() {
  return <Shell title="Site Pages"><Body /></Shell>;
}
