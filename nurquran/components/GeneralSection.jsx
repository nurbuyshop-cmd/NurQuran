"use client";
// "General" card at the bottom of the mobile home page: Contact us, Privacy Policy, Notifications, Facebook…
// The tiles (name, picture, link, order) are set in the admin panel → General & Contact.
import Link from "next/link";
import { useSiteConfig } from "@/lib/siteImages";
import { GenIcon } from "./GeneralIcons";

const DEFAULT_ITEMS = [
  { id: "contact", type: "contact", title: "Contact us", icon: "email" },
  { id: "privacy", type: "privacy", title: "Privacy Policy", icon: "shield" },
];
const HREF = { contact: "/contact", privacy: "/privacy-policy", about: "/about", notifications: "/notifications" };

function share() {
  const url = location.origin;
  if (navigator.share) navigator.share({ title: document.title, text: "Read the Holy Quran", url }).catch(() => {});
  else window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, "_blank", "noopener");
}

export default function GeneralSection() {
  const cfg = useSiteConfig();
  const items = (cfg.general && cfg.general.items) || DEFAULT_ITEMS;
  if (!items.length) return null;
  return (
    <section className="qset-card gen-card mob-only">
      <h3><span>General</span></h3>
      <div className="gen-row">
        {items.map((x) => {
          const pic = cfg.images && cfg.images[`general:${x.id}`];
          const inner = (
            <>
              <span className="gen-tile">{pic ? <img src={pic} alt="" /> : <GenIcon name={x.icon} />}</span>
              <span className="gen-lbl">{x.title}</span>
            </>
          );
          if (x.type === "share") return <button key={x.id} className="gen-item" onClick={share}>{inner}</button>;
          if (x.type === "link") {
            const internal = x.link.startsWith("/");
            return internal
              ? <Link key={x.id} href={x.link} className="gen-item">{inner}</Link>
              : <a key={x.id} href={x.link} className="gen-item" target={/^https?:/i.test(x.link) ? "_blank" : undefined} rel="noopener noreferrer">{inner}</a>;
          }
          return <Link key={x.id} href={HREF[x.type] || "/"} className="gen-item">{inner}</Link>;
        })}
      </div>
    </section>
  );
}
