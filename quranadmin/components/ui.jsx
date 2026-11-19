"use client";
import { createContext, useCallback, useContext, useRef, useState } from "react";

/* ---------- icons ---------- */
const S = { fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round" };
export const I = {
  dash: () => <svg viewBox="0 0 24 24" {...S}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>,
  pages: () => <svg viewBox="0 0 24 24" {...S}><path d="M4 5.5C6.5 4 9.5 4 12 5.5v14C9.5 18 6.5 18 4 19.5z" /><path d="M20 5.5C17.5 4 14.5 4 12 5.5v14c2.5-1.5 5.5-1.5 8 0z" /></svg>,
  surah: () => <svg viewBox="0 0 24 24" {...S}><path d="M4 6h16M4 12h16M4 18h10" /></svg>,
  settings: () => <svg viewBox="0 0 24 24" {...S}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z" /></svg>,
  users: () => <svg viewBox="0 0 24 24" {...S}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5" /><path d="M16 4.5a3.5 3.5 0 010 7M18 14.8c1.8.7 3 2.4 3.5 5.2" /></svg>,
  backup: () => <svg viewBox="0 0 24 24" {...S}><path d="M12 3v12M7 10l5 5 5-5" /><path d="M4 17v3h16v-3" /></svg>,
  log: () => <svg viewBox="0 0 24 24" {...S}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  logout: () => <svg viewBox="0 0 24 24" {...S}><path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" /></svg>,
  menu: () => <svg viewBox="0 0 24 24" {...S}><path d="M4 7h16M4 12h16M4 17h16" /></svg>,
  plus: () => <svg viewBox="0 0 24 24" {...S} strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg>,
  edit: () => <svg viewBox="0 0 24 24" {...S}><path d="M4 20h4L19 9l-4-4L4 16z" /></svg>,
  trash: () => <svg viewBox="0 0 24 24" {...S}><path d="M4 7h16M10 7V4h4v3M6 7l1 13h10l1-13" /></svg>,
  up: () => <svg viewBox="0 0 24 24" {...S}><path d="M6 15l6-6 6 6" /></svg>,
  down: () => <svg viewBox="0 0 24 24" {...S}><path d="M6 9l6 6 6-6" /></svg>,
  eye: () => <svg viewBox="0 0 24 24" {...S}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>,
  ext: () => <svg viewBox="0 0 24 24" {...S}><path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" /></svg>,
  book: () => <svg viewBox="0 0 24 24" {...S}><path d="M5 4h10a4 4 0 014 4v12H9a4 4 0 01-4-4z" /><path d="M5 16a4 4 0 014-4h10M9 8h6" /></svg>,
  bell: () => <svg viewBox="0 0 24 24" {...S}><path d="M6 16V11a6 6 0 0112 0v5l1.5 2h-15z" /><path d="M10 20.5a2 2 0 004 0" /></svg>,
  image: () => <svg viewBox="0 0 24 24" {...S}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-9 9" /></svg>,
  music: () => <svg viewBox="0 0 24 24" {...S}><path d="M9 18V5l11-2v13" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="17.5" cy="16" r="2.5" /></svg>,
  check: () => <svg viewBox="0 0 24 24" {...S} strokeWidth="2.4"><path d="M5 12.5l4.5 4.5L19 7" /></svg>,
  x: () => <svg viewBox="0 0 24 24" {...S} strokeWidth="2.2"><path d="M6 6l12 12M18 6L6 18" /></svg>,
  paste: () => <svg viewBox="0 0 24 24" {...S}><rect x="6" y="4" width="12" height="17" rx="2" /><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3" /></svg>,
  logo: () => (
    <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="19" fill="#1f8a3b" /><circle cx="18" cy="20" r="11" fill="#f3c74b" /><circle cx="22" cy="17.5" r="9.5" fill="#1f8a3b" /><path d="M28 12l1 2.6 2.7.2-2.1 1.7.7 2.6-2.3-1.5-2.3 1.5.7-2.6-2.1-1.7 2.7-.2z" fill="#f3c74b" /></svg>
  ),
};

/* ---------- toast + confirm ---------- */
const UiCtx = createContext(null);
export function UiProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const t = useRef(null);
  const notify = useCallback((msg, type = "ok") => {
    setToast({ msg, type });
    clearTimeout(t.current);
    t.current = setTimeout(() => setToast(null), 3200);
  }, []);
  const ask = useCallback((opts) => new Promise((resolve) => setConfirm({ ...opts, resolve })), []);
  return (
    <UiCtx.Provider value={{ notify, ask }}>
      {children}
      {toast && <div className={`qa-toast ${toast.type}`} role="status">{toast.msg}</div>}
      {confirm && (
        <div className="qa-modal-bg" onClick={() => { confirm.resolve(false); setConfirm(null); }}>
          <div className="qa-modal sm" onClick={(e) => e.stopPropagation()}>
            <h3>{confirm.title}</h3>
            <p>{confirm.message}</p>
            <div className="qa-modal-btns">
              <button className="qa-btn ghost" onClick={() => { confirm.resolve(false); setConfirm(null); }}>Cancel</button>
              <button className={`qa-btn ${confirm.danger ? "danger" : ""}`} onClick={() => { confirm.resolve(true); setConfirm(null); }}>{confirm.ok || "OK"}</button>
            </div>
          </div>
        </div>
      )}
    </UiCtx.Provider>
  );
}
export const useUi = () => useContext(UiCtx);

export const timeAgo = (iso) => {
  if (!iso) return "";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};
