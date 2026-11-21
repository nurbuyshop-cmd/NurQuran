"use client";
// Contact Us page — the details are filled in the admin panel → General & Contact.
import { useRouter } from "next/navigation";
import { useSiteConfig } from "@/lib/siteImages";
import { GenIcon } from "./GeneralIcons";
import SiteFooter from "./SiteFooter";
import "./pages.css";

const digits = (s) => String(s || "").replace(/[^\d+]/g, "");
const ensureHttp = (u) => (/^https?:\/\//i.test(u) ? u : `https://${u}`);

export default function ContactPage() {
  const router = useRouter();
  const cfg = useSiteConfig();
  const c = (cfg.general && cfg.general.contact) || {};
  const rows = [
    c.email && { icon: "email", label: "Email", value: c.email, href: `mailto:${c.email}`, act: "Send email" },
    c.phone && { icon: "phone", label: "Phone", value: c.phone, href: `tel:${digits(c.phone)}`, act: "Call" },
    c.whatsapp && { icon: "whatsapp", label: "WhatsApp", value: c.whatsapp, href: `https://wa.me/${digits(c.whatsapp).replace(/^\+/, "")}`, act: "Chat", ext: true },
    c.facebook && { icon: "facebook", label: "Facebook", value: c.facebook.replace(/^https?:\/\/(www\.)?/i, ""), href: ensureHttp(c.facebook), act: "Open", ext: true },
    c.website && { icon: "website", label: "Website", value: c.website.replace(/^https?:\/\//i, ""), href: ensureHttp(c.website), act: "Visit", ext: true },
    c.address && { icon: "location", label: "Address", value: c.address, href: `https://www.google.com/maps/search/${encodeURIComponent(c.address)}`, act: "Map", ext: true },
    c.hours && { icon: "clock", label: "Working hours", value: c.hours },
  ].filter(Boolean);

  return (
    <div className="np cp">
      <header className="np-head">
        <button className="b" aria-label="Back" onClick={() => (history.length > 1 ? router.back() : router.push("/"))}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <span className="sep" />
        <h1>Contact us</h1>
      </header>
      <div className="ct-wrap">
        <div className="ct-hero">
          <span className="ic"><GenIcon name="email" /></span>
          <h2>Get in touch</h2>
          {c.intro && <p>{c.intro}</p>}
        </div>
        {rows.length ? (
          <div className="ct-list">
            {rows.map((r) => {
              const body = (
                <>
                  <span className="ic"><GenIcon name={r.icon} /></span>
                  <span className="tx"><small>{r.label}</small><b>{r.value}</b></span>
                  {r.act && <span className="go">{r.act}</span>}
                </>
              );
              return r.href
                ? <a key={r.label} className="ct-row" href={r.href} target={r.ext ? "_blank" : undefined} rel="noopener noreferrer">{body}</a>
                : <div key={r.label} className="ct-row">{body}</div>;
            })}
          </div>
        ) : <p className="ct-empty">Contact details will be added soon.</p>}
      </div>
      <SiteFooter />
    </div>
  );
}
