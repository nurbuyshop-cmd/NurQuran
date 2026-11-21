"use client";
// About Us / Privacy Policy page. The text is edited in the admin panel → Site Pages.
import { useRouter } from "next/navigation";
import { useSiteContent } from "@/lib/siteContent";
import RichText from "./RichText";
import SiteFooter from "./SiteFooter";
import "./pages.css";

const fmt = (iso) => { try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); } catch (e) { return ""; } };

export default function ContentPage({ slug }) {
  const router = useRouter();
  const page = useSiteContent(slug);
  return (
    <div className="np cp">
      <header className="np-head">
        <button className="b" aria-label="Back" onClick={() => (history.length > 1 ? router.back() : router.push("/"))}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <span className="sep" />
        <h1>{page.title}</h1>
      </header>
      <article className="cp-card">
        <h1 className="cp-title">{page.title}</h1>
        {page.updatedAt && <p className="cp-date">Last updated: {fmt(page.updatedAt)}</p>}
        <RichText text={page.body} />
      </article>
      <SiteFooter />
    </div>
  );
}
