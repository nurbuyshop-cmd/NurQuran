"use client";
// Notifications — cards like the reference app: picture, title, message, View, "N days ago", X to remove.
// The notifications themselves are written in the admin panel (Notifications page).
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useNotifications, timeAgo } from "@/lib/notifications";
import { useSiteImages } from "@/lib/siteImages";
import { QuranIcon } from "./FeatureIcons";
import "./pages.css";

export default function NotificationsPage() {
  const router = useRouter();
  const { list, all, dismiss, markSeen, restore, loaded } = useNotifications();
  const imgs = useSiteImages();
  const [open, setOpen] = useState(null);
  useEffect(() => { if (loaded) markSeen(); }, [loaded, all.length, markSeen]);

  const view = (n) => {
    if (!n.link) { setOpen(n); return; }
    if (n.link.startsWith("/")) router.push(n.link);
    else window.open(n.link, "_blank", "noopener");
  };

  return (
    <div className="np">
      <header className="np-head">
        <button className="b" aria-label="Back" onClick={() => (history.length > 1 ? router.back() : router.push("/"))}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <span className="sep" />
        <h1>Notifications</h1>
      </header>

      <div className="nt-list">
        {loaded && !list.length && (
          <div className="sr-empty">
            <p>No notifications yet.</p>
            {all.length > 0 && <button className="nt-restore" onClick={restore}>Show removed notifications</button>}
          </div>
        )}
        {list.map((n) => (
          <article key={n.id} className="nt-card">
            <span className="pic">{imgs[`notif:${n.id}`] ? <img src={imgs[`notif:${n.id}`]} alt="" /> : <QuranIcon />}</span>
            <h3>{n.title}</h3>
            <button className="x" aria-label="Remove notification" onClick={() => dismiss(n.id)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3.5" y="3.5" width="17" height="17" rx="3.5" /><path d="M8.5 8.5l7 7M15.5 8.5l-7 7" strokeLinecap="round" /></svg>
            </button>
            {n.body && <p className="body">{n.body.length > 140 ? `${n.body.slice(0, 140).trim()}…` : n.body}</p>}
            <button className="view" onClick={() => view(n)}>View</button>
            <time>{timeAgo(n.createdAt)}</time>
          </article>
        ))}
      </div>

      {open && (
        <div className="nt-modal-bg" onClick={() => setOpen(null)}>
          <div className="nt-modal" onClick={(e) => e.stopPropagation()}>
            {imgs[`notif:${open.id}`] && <img className="hero" src={imgs[`notif:${open.id}`]} alt="" />}
            <h3>{open.title}</h3>
            <p>{open.body}</p>
            <time>{timeAgo(open.createdAt)}</time>
            <button onClick={() => setOpen(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
