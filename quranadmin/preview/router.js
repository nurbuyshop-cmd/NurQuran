// Preview-only in-memory router (stands in for next/navigation in the single-file preview)
import { useEffect, useState } from "react";
let route = "/login/";
const subs = new Set();
const norm = (href) => { let [p, q = ""] = href.split("?"); if (!p.endsWith("/")) p += "/"; return q ? `${p}?${q}` : p; };
export function go(href) { route = norm(href); subs.forEach((f) => f(route)); window.scrollTo(0, 0); }
export function useRoute() {
  const [r, setR] = useState(route);
  useEffect(() => { subs.add(setR); return () => subs.delete(setR); }, []);
  return r;
}
export function useRouter() { return { push: go, replace: go, back: () => go("/") }; }
export function usePathname() { return useRoute().split("?")[0]; }
export function useSearchParams() { return new URLSearchParams(useRoute().split("?")[1] || ""); }
