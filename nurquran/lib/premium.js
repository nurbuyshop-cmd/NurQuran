"use client";
// Premium on this phone: a code from the admin panel is redeemed once and kept in this browser.
import { useCallback, useEffect, useState } from "react";
import { API_URL } from "@/lib/quran/data";

const KEY = "nq_premium", DEV = "nq_device";
const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } };
const deviceId = () => {
  try {
    let d = localStorage.getItem(DEV);
    if (!d) { d = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`); localStorage.setItem(DEV, d); }
    return d;
  } catch (e) { return "no-storage"; }
};
const valid = (p) => !!(p && p.token && (!p.expiresAt || new Date(p.expiresAt) > new Date()));
let checked = false;
const subs = new Set();
const set = (p) => { try { p ? localStorage.setItem(KEY, JSON.stringify(p)) : localStorage.removeItem(KEY); } catch (e) {} subs.forEach((f) => f(p)); };

export function usePremium() {
  const [p, setP] = useState(null);
  useEffect(() => {
    setP(read());
    subs.add(setP);
    const cur = read();
    // check once per visit that the code is still active (it can be deleted or end); offline keeps the saved state
    if (cur && cur.token && !checked && API_URL) {
      checked = true;
      fetch(`${API_URL}/v1/premium/status`, { headers: { Authorization: `Bearer ${cur.token}` }, cache: "no-store" })
        .then((r) => r.json().then((d) => ({ r, d })))
        .then(({ r, d }) => { if (d.ok) set({ ...cur, plan: d.plan, expiresAt: d.expiresAt }); else if (r.status === 401 || r.status === 410) set(null); })
        .catch(() => {});
    }
    return () => subs.delete(setP);
  }, []);
  const redeem = useCallback(async (code) => {
    const r = await fetch(`${API_URL}/v1/premium/redeem`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, device: deviceId() }),
    });
    const d = await r.json().catch(() => ({}));
    if (!d.ok) throw new Error(d.error || "Could not check the code. Try again.");
    const next = { token: d.token, plan: d.plan, expiresAt: d.expiresAt, code: String(code).trim().toUpperCase() };
    set(next);
    return next;
  }, []);
  return { premium: valid(p) ? p : null, redeem, signOut: () => set(null) };
}
