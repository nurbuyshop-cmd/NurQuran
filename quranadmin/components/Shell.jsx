"use client";
import { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api, getToken, setToken, SITE_URL } from "@/lib/api";
import { I, UiProvider } from "./ui";

const NAV = [
  ["/", "Dashboard", I.dash],
  ["/pages/", "Quran Pages", I.pages],
  ["/surahs/", "Surahs", I.surah],
  ["/settings/", "Settings", I.settings],
  ["/admins/", "Admins", I.users],
  ["/backup/", "Backup", I.backup],
  ["/activity/", "Activity", I.log],
];

const AdminCtx = createContext(null);
export const useAdmin = () => useContext(AdminCtx);

export default function Shell({ title, actions, children }) {
  const router = useRouter();
  const path = usePathname() || "/";
  const [admin, setAdmin] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!getToken()) { router.replace("/login/"); return; }
    api("/v1/auth/me").then((r) => setAdmin(r.admin)).catch(() => router.replace("/login/"));
    const out = () => router.replace("/login/");
    window.addEventListener("qa-logout", out);
    return () => window.removeEventListener("qa-logout", out);
  }, [router]);

  const logout = () => { setToken(null); router.replace("/login/"); };
  const norm = (p) => (p.endsWith("/") ? p : p + "/");
  const active = (href) => (href === "/" ? norm(path) === "/" : norm(path).startsWith(href));

  if (!admin) return <div className="qa-loading"><span className="spin" /></div>;

  return (
    <AdminCtx.Provider value={admin}>
      <UiProvider>
        <div className="qa">
          <aside className={`qa-side${open ? " open" : ""}`}>
            <div className="qa-brand"><span className="lg"><I.logo /></span><div><b>Nur Quran</b><small>Admin Panel</small></div></div>
            <nav>
              {NAV.map(([href, label, Icon]) => (
                <Link key={href} href={href} className={active(href) ? "on" : ""} onClick={() => setOpen(false)}><Icon />{label}</Link>
              ))}
            </nav>
            <a className="qa-site" href={SITE_URL} target="_blank" rel="noreferrer"><I.ext />View website</a>
            <div className="qa-me">
              <span className="av">{admin.name.slice(0, 1).toUpperCase()}</span>
              <div><b>{admin.name}</b><small>{admin.role === "owner" ? "Owner" : "Editor"}</small></div>
              <button onClick={logout} title="Log out" aria-label="Log out"><I.logout /></button>
            </div>
          </aside>
          {open && <div className="qa-scrim" onClick={() => setOpen(false)} />}
          <div className="qa-main">
            <header className="qa-top">
              <button className="qa-burger" onClick={() => setOpen(true)} aria-label="Menu"><I.menu /></button>
              <h1>{title}</h1>
              <div className="qa-top-act">{actions}</div>
            </header>
            <div className="qa-content">{children}</div>
          </div>
        </div>
      </UiProvider>
    </AdminCtx.Provider>
  );
}
