"use client";
// About Us / Privacy Policy text, written in the admin panel (Site Pages).
// Shows the last saved copy (or the built-in default) straight away, then loads the latest from the API.
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/quran/data";
import DEFAULTS from "./contentDefaults.json";

const key = (slug) => `nq_page_${slug}`;
function cached(slug) {
  try { const c = JSON.parse(localStorage.getItem(key(slug)) || "null"); if (c && c.title) return c; } catch (e) {}
  return { ...DEFAULTS[slug], updatedAt: null };
}

export function useSiteContent(slug) {
  const [page, setPage] = useState(() => ({ ...DEFAULTS[slug], updatedAt: null }));
  useEffect(() => {
    setPage(cached(slug));
    if (!API_URL || window.__QURAN_BUNDLE__) return;
    let live = true;
    fetch(`${API_URL}/v1/content/${slug}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!live || !d || !d.ok || !d.page) return;
        setPage(d.page);
        try { localStorage.setItem(key(slug), JSON.stringify(d.page)); } catch (e) {}
      })
      .catch(() => {});
    return () => { live = false; };
  }, [slug]);
  return page;
}
