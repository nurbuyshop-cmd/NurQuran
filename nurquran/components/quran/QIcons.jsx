// Icons for the Quran reader toolbar / menus.
import { HifzIcon } from "@/components/FeatureIcons";

const ring = (fill = "#fff", stroke = "#dfe6dc") => <circle cx="20" cy="20" r="18.5" fill={fill} stroke={stroke} strokeWidth="1.5" />;

export const Ico = {
  play: () => (
    <svg viewBox="0 0 40 40">{ring()}<circle cx="20" cy="20" r="12" fill="#2fae5c" /><path d="M17 14.5l8.5 5.5-8.5 5.5z" fill="#fff" /></svg>
  ),
  bookmarks: () => (
    <svg viewBox="0 0 40 40">{ring()}<path d="M20 9.5l3.2 6.6 7.2 1-5.2 5 1.3 7.2L20 25.9l-6.5 3.4 1.3-7.2-5.2-5 7.2-1z" fill="#f6c32b" stroke="#d9a41a" strokeWidth=".8" /></svg>
  ),
  autoscroll: () => (
    <svg viewBox="0 0 40 40" fill="none" stroke="#2fae5c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">{ring()}<path d="M14 12l6 6 6-6M14 19l6 6 6-6M14 26l6 6 6-6" opacity=".9" /></svg>
  ),
  share: () => (
    <svg viewBox="0 0 40 40" fill="none" stroke="#2f8f5a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{ring()}<path d="M20 10v13M15.5 14.5L20 10l4.5 4.5" /><path d="M14 18h-1.5v12h15V18H26" /></svg>
  ),
  translations: () => (
    <svg viewBox="0 0 40 40">{ring()}<g stroke="#2f8f5a" strokeWidth="1.8" strokeLinecap="round"><path d="M10 15h8M10 20h8M10 25h8" /></g><text x="27" y="26" textAnchor="middle" fontSize="15" fill="#2f8f5a" style={{ fontFamily: "var(--font-ar)" }}>ع</text></svg>
  ),
  hifz: () => <span className="qi-hifz"><HifzIcon /></span>,
  tajweed: () => (
    <svg viewBox="0 0 40 40">
      {["#e53935", "#fb8c00", "#fdd835", "#43a047", "#1e88e5", "#8e24aa"].map((c, i) => (
        <path key={c} d={`M20 20 L${20 + 18 * Math.cos((i * Math.PI) / 3)} ${20 + 18 * Math.sin((i * Math.PI) / 3)} A18 18 0 0 1 ${20 + 18 * Math.cos(((i + 1) * Math.PI) / 3)} ${20 + 18 * Math.sin(((i + 1) * Math.PI) / 3)}Z`} fill={c} />
      ))}
      <circle cx="20" cy="20" r="7" fill="#fff" />
    </svg>
  ),
  visual: () => (
    <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="none" stroke="#8e24aa" strokeWidth="3" /><circle cx="20" cy="20" r="14" fill="#fff" stroke="#43a047" strokeWidth="1.5" /><text x="20" y="25" textAnchor="middle" fontSize="13" fill="#8e24aa" style={{ fontFamily: "var(--font-ar)" }}>قرآن</text></svg>
  ),
  qurantv: () => (
    <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18.5" fill="#111" /><circle cx="20" cy="20" r="13" fill="none" stroke="#777" strokeWidth=".8" /><text x="20" y="24" textAnchor="middle" fontSize="11" fill="#ddd" style={{ fontFamily: "var(--font-ar)" }}>القرآن</text></svg>
  ),
  gift: () => (
    <svg viewBox="0 0 40 40">{ring()}<rect x="11" y="18" width="18" height="12" rx="1.5" fill="#f48fb1" /><rect x="10" y="14" width="20" height="5" rx="1.5" fill="#ec407a" /><path d="M20 14v16" stroke="#fff59d" strokeWidth="2.5" /><path d="M20 14c-2-5-7-5-6-1 1 2 4 1 6 1zM20 14c2-5 7-5 6-1-1 2-4 1-6 1z" fill="#fdd835" /></svg>
  ),
  search: () => (
    <svg viewBox="0 0 40 40" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round">{ring()}<circle cx="18" cy="18" r="7" /><path d="M23 23l6 6" /></svg>
  ),
  goto: () => (
    <svg viewBox="0 0 40 40" fill="none" stroke="#555" strokeWidth="1.6" strokeLinejoin="round">{ring()}<path d="M9 22l11-5 11 5-11 6z" fill="#f5f5f5" /><path d="M20 17c-2-4 2-7 5-5" /><path d="M25 12l-1 2.5 2.6-.3" /></svg>
  ),
  addbookmark: () => (
    <svg viewBox="0 0 40 40">{ring()}<path d="M20 10l3 6.2 6.8.9-4.9 4.7 1.2 6.7L20 25.3l-6.1 3.2 1.2-6.7-4.9-4.7 6.8-.9z" fill="none" stroke="#e0a800" strokeWidth="1.6" strokeLinejoin="round" /></svg>
  ),
  readingbookmark: () => (
    <svg viewBox="0 0 40 40">{ring()}<path d="M18 11l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L18 25.4l-5.6 3 1.1-6.3-4.6-4.4 6.3-.9z" fill="#fff3c4" stroke="#e0a800" strokeWidth="1.4" strokeLinejoin="round" /><path d="M28 10v5M25.5 12.5h5M30 19v3M28.5 20.5h3" stroke="#8e24aa" strokeWidth="1.3" strokeLinecap="round" /></svg>
  ),
  customize: () => (
    <svg viewBox="0 0 40 40">{ring()}<path d="M13 27l1.5-5 10-10 3.5 3.5-10 10z" fill="#9e9e9e" /><path d="M24.5 12l3.5 3.5" stroke="#555" strokeWidth="1.5" /><path d="M13 27l1.5-5 3.5 3.5z" fill="#ffcc80" /></svg>
  ),
  settings: () => (
    <svg viewBox="0 0 40 40">{ring()}<path d="M20 11.2l1.5.2.6 2.3 1.6.7 2.1-1.2 2.1 2.1-1.2 2.1.7 1.6 2.3.6v3l-2.3.6-.7 1.6 1.2 2.1-2.1 2.1-2.1-1.2-1.6.7-.6 2.3h-3l-.6-2.3-1.6-.7-2.1 1.2-2.1-2.1 1.2-2.1-.7-1.6-2.3-.6v-3l2.3-.6.7-1.6-1.2-2.1 2.1-2.1 2.1 1.2 1.6-.7.6-2.3z" fill="#2fae5c" /><circle cx="20" cy="20" r="3.6" fill="#fff" /></svg>
  ),
  exit: () => (
    <svg viewBox="0 0 40 40">{ring("#fff8e1", "#ffe082")}<path d="M23 13l-7 7 7 7" fill="none" stroke="#f9a825" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  more: () => (
    <svg viewBox="0 0 40 40">{ring("#fff", "#2fae5c")}<circle cx="13" cy="20" r="2.4" fill="#2fae5c" /><circle cx="20" cy="20" r="2.4" fill="#2fae5c" /><circle cx="27" cy="20" r="2.4" fill="#2fae5c" /></svg>
  ),
};

export const ACTIONS = [
  ["play", "Play"], ["bookmarks", "Bookmarks"], ["autoscroll", "Autoscroll"], ["share", "Share"],
  ["translations", "Translations"], ["hifz", "Hifz"], ["tajweed", "Tajweed"], ["visual", "Visual Quran"],
  ["qurantv", "QuranTV"], ["gift", "Gift"], ["search", "Search"], ["goto", "Go to"],
  ["addbookmark", "Add Bookmark"], ["readingbookmark", "Reading Bookmark"], ["customize", "Customize"], ["settings", "Settings"],
];
export const ACTION_LABEL = Object.fromEntries(ACTIONS);
export const SHORT_LABEL = { bookmarks: "Bookmark", translations: "Translatio" };
export const DEFAULT_ORDER = ACTIONS.map((a) => a[0]);

/* small UI glyphs */
export const G = {
  back: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>,
  chevD: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>,
  chevU: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 15l6-6 6 6" /></svg>,
  x: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>,
  xc: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M9 9l6 6M15 9l-6 6" strokeLinecap="round" /></svg>,
  playT: () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5l13 7.5-13 7.5z" /></svg>,
  pause: () => <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4.5" width="4" height="15" rx="1" /><rect x="14" y="4.5" width="4" height="15" rx="1" /></svg>,
  gear: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3.2" /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" strokeLinecap="round" /></svg>,
  repeat: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 11V9a3 3 0 013-3h12l-3-3M20 13v2a3 3 0 01-3 3H5l3 3" /></svg>,
  star: () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.8l2.8 5.8 6.4.9-4.6 4.5 1.1 6.3L12 17.3l-5.7 3 1.1-6.3-4.6-4.5 6.4-.9z" /></svg>,
  trans: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 7h8M3 12h8M3 17h8" /><path d="M15 6h6v9h-3l-3 3z" /></svg>,
  handle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M5 9h14M5 12h14M5 15h14" /></svg>,
  mic: () => <svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="12" rx="3" fill="#f6c32b" /><path d="M6 11a6 6 0 0012 0M12 17v4" stroke="#555" strokeWidth="1.6" fill="none" strokeLinecap="round" /></svg>,
  minus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 12h12" /></svg>,
  plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 6v12M6 12h12" /></svg>,
  restart: () => <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18.5" fill="#fff" stroke="#dfe6dc" strokeWidth="1.5" /><rect x="12" y="13" width="3" height="14" rx="1" fill="#2fae5c" /><path d="M28 13v14l-11-7z" fill="#2fae5c" /></svg>,
  trash: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13" /></svg>,
};

// Ornamental ayah-end marker with Arabic-Indic number
export function AyahMark({ n }) {
  const ar = String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);
  return (
    <span className="qr-mark" aria-label={`Ayah ${n}`}>
      <svg viewBox="0 0 40 44" aria-hidden="true">
        <circle cx="20" cy="22" r="15" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="20" cy="22" r="12" fill="none" stroke="currentColor" strokeWidth=".9" />
        <path d="M14 7.5q6-4 12 0M14 36.5q6 4 12 0" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="20" cy="4.5" r="1.6" fill="currentColor" /><circle cx="20" cy="39.5" r="1.6" fill="currentColor" />
      </svg>
      <b>{ar}</b>
    </span>
  );
}
