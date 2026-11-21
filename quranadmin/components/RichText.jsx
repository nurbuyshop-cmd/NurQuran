// Simple text format used by About Us / Privacy Policy (same rules as the admin editor):
//   "## Heading"  → heading      "- item" → bullet list      blank line → new paragraph
//   **bold**, and links (https://…, emails) become clickable.
function inline(text, k) {
  const out = [];
  const re = /(\*\*[^*]+\*\*|https?:\/\/[^\s)]+|[\w.+-]+@[\w-]+\.[\w.-]+\w)/g;
  let last = 0, m, i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith("**")) out.push(<b key={`${k}-${i++}`}>{t.slice(2, -2)}</b>);
    else if (t.includes("@") && !t.startsWith("http")) out.push(<a key={`${k}-${i++}`} href={`mailto:${t}`}>{t}</a>);
    else out.push(<a key={`${k}-${i++}`} href={t} target="_blank" rel="noopener noreferrer">{t}</a>);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function RichText({ text, className = "" }) {
  const blocks = [];
  let list = null, para = [];
  const flushPara = () => { if (para.length) { blocks.push({ t: "p", v: para.join(" ") }); para = []; } };
  const flushList = () => { if (list) { blocks.push({ t: "ul", v: list }); list = null; } };
  String(text || "").split("\n").forEach((raw) => {
    const line = raw.trim();
    if (!line) { flushPara(); flushList(); return; }
    if (line.startsWith("## ") || line.startsWith("# ")) { flushPara(); flushList(); blocks.push({ t: "h", v: line.replace(/^#+\s*/, "") }); return; }
    if (/^[-•*]\s+/.test(line)) { flushPara(); (list = list || []).push(line.replace(/^[-•*]\s+/, "")); return; }
    flushList(); para.push(line);
  });
  flushPara(); flushList();
  return (
    <div className={`rich ${className}`}>
      {blocks.map((b, i) =>
        b.t === "h" ? <h2 key={i}>{inline(b.v, i)}</h2>
        : b.t === "ul" ? <ul key={i}>{b.v.map((x, j) => <li key={j}>{inline(x, `${i}-${j}`)}</li>)}</ul>
        : <p key={i}>{inline(b.v, i)}</p>
      )}
    </div>
  );
}
