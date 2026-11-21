import Link from "next/link";

// Footer links shown on the home page and on the About / Privacy pages (mobile and desktop).
export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <nav className="sf-links">
        <Link href="/about">About Us</Link>
        <span aria-hidden="true">·</span>
        <Link href="/contact">Contact Us</Link>
        <span aria-hidden="true">·</span>
        <Link href="/privacy-policy">Privacy Policy</Link>
      </nav>
      <div className="sf-copy">© {new Date().getFullYear()} Nur Quran · All rights reserved</div>
    </footer>
  );
}
