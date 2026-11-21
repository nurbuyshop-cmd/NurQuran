"use client";
// Swaps the browser-tab icon for the favicon uploaded in the admin panel (Images → Logo & favicon).
// Without an upload the built-in /favicon.svg stays.
import { useEffect } from "react";
import { useSiteConfig } from "@/lib/siteImages";

export default function SiteFavicon() {
  const cfg = useSiteConfig();
  const url = cfg.images && cfg.images["brand:favicon"];
  useEffect(() => {
    const href = url || "/favicon.svg";
    let links = [...document.querySelectorAll("link[rel~='icon'], link[rel='apple-touch-icon']")];
    if (!links.length) {
      const l = document.createElement("link"); l.rel = "icon"; document.head.appendChild(l); links = [l];
    }
    links.forEach((l) => { l.href = href; if (url) l.removeAttribute("type"); });
  }, [url]);
  return null;
}
