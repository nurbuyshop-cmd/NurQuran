"use client";
// Website logo: the picture uploaded in the admin panel (Images → Logo & favicon), or the built-in crescent logo.
import { useSiteConfig } from "@/lib/siteImages";

export default function SiteLogo({ className }) {
  const cfg = useSiteConfig();
  const url = cfg.images && cfg.images["brand:logo"];
  if (url) return <img className={`${className || ""} site-logo-img`} src={url} alt={cfg.siteName || "Logo"} />;
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="19" fill="#1f8a3b" />
      <circle cx="18" cy="20" r="11" fill="#f3c74b" />
      <circle cx="22" cy="17.5" r="9.5" fill="#1f8a3b" />
      <path d="M28 12l1 2.6 2.7.2-2.1 1.7.7 2.6-2.3-1.5-2.3 1.5.7-2.6-2.1-1.7 2.7-.2z" fill="#f3c74b" />
    </svg>
  );
}
