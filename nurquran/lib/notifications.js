"use client";
// Notifications written in the admin panel. Dismissed ones (X) and "seen up to" are kept in this browser.
import { useCallback, useEffect, useState } from "react";
import { API_URL } from "@/lib/quran/data";

const CACHE = "nq_notifs", GONE = "nq_notifs_dismissed", SEEN = "nq_notifs_seen";
const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v ?? d; } catch (e) { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
let mem = null, inflight = null;
const subs = new Set();
function refresh() {
  if (inflight || !API_URL || (typeof window !== "undefined" && window.__QURAN_BUNDLE__)) return inflight;
  inflight = fetch(`${API_URL}/v1/notifications`, { cache: "no-store" }).then((r) => r.json()).then((d) => {
    if (d && d.ok) { mem = d.notifications || []; write(CACHE, mem); subs.forEach((f) => f(mem)); }
  }).catch(() => {}).finally(() => { inflight = null; });
  return inflight;
}

export function useNotifications() {
  const [list, setList] = useState(mem || []);
  const [gone, setGone] = useState([]);
  const [seen, setSeen] = useState("");
  const [loaded, setLoaded] = useState(!!mem);
  useEffect(() => {
    if (!mem) { mem = read(CACHE, []); setList(mem); }
    setGone(read(GONE, [])); setSeen(read(SEEN, ""));
    const on = (l) => { setList(l); setLoaded(true); };
    subs.add(on);
    const p = refresh();
    if (p) p.then(() => setLoaded(true)); else setLoaded(true);
    return () => subs.delete(on);
  }, []);
  const visible = list.filter((n) => !gone.includes(n.id));
  const unread = visible.filter((n) => !seen || n.createdAt > seen).length;
  const dismiss = useCallback((id) => setGone((g) => { const n = [...new Set([...g, id])]; write(GONE, n); return n; }), []);
  const markSeen = useCallback(() => {
    const latest = (mem || []).reduce((m, n) => (n.createdAt > m ? n.createdAt : m), "");
    if (latest) { write(SEEN, latest); setSeen(latest); }
  }, []);
  const restore = useCallback(() => { write(GONE, []); setGone([]); }, []);
  return { list: visible, all: list, unread, dismiss, markSeen, restore, loaded };
}

export function timeAgo(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) { const h = Math.floor(s / 3600); return `${h} hour${h > 1 ? "s" : ""} ago`; }
  const d = Math.floor(s / 86400);
  return `${d} day${d > 1 ? "s" : ""} ago`;
}
