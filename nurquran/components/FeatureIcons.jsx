// Hand-drawn SVG icons for the home feature grid (no emojis, no external images).

const ar = { fontFamily: "var(--font-ar)" };

export const QuranIcon = () => (
  <svg viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="31" fill="#e8a019" />
    <circle cx="32" cy="32" r="27" fill="#1d8a3a" />
    <circle cx="32" cy="32" r="23.5" fill="none" stroke="#f3c74b" strokeWidth="1.2" strokeDasharray="2 2" />
    <circle cx="32" cy="32" r="20" fill="none" stroke="#f3c74b" strokeWidth=".8" />
    <text x="32" y="38" textAnchor="middle" style={ar} fontSize="17" fontWeight="700" fill="#f6d35b">القرآن</text>
    <text x="32" y="23" textAnchor="middle" style={ar} fontSize="8" fill="#f6d35b">الكريم</text>
  </svg>
);

export const TasbeehIcon = () => (
  <svg viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="31" fill="#2f6fb5" />
    <circle cx="30" cy="27" r="15" fill="none" stroke="#2fbf6a" strokeWidth="6" strokeLinecap="round" strokeDasharray="0.1 7.2" />
    <circle cx="30" cy="27" r="15" fill="none" stroke="#1d5a3a" strokeWidth=".8" opacity=".6" />
    <path d="M40 38 l5 8" stroke="#1d5a3a" strokeWidth="1.2" />
    <circle cx="45.5" cy="47" r="3" fill="#2fbf6a" />
    <path d="M43 50 l-1.5 6 h8 l-1.5-6z" fill="#f3c74b" />
  </svg>
);

export const TajweedIcon = () => (
  <svg viewBox="0 0 64 64">
    <path d="M14 52 l4-10 M50 52 l-4-10" stroke="#9b6a2f" strokeWidth="3" strokeLinecap="round" />
    <rect x="4" y="10" width="56" height="36" rx="3" fill="#c98a3c" />
    <rect x="8" y="14" width="48" height="28" rx="1.5" fill="#2e7d4f" />
    <text x="21" y="35" textAnchor="middle" style={ar} fontSize="17" fill="#fff">ب</text>
    <text x="44" y="33" textAnchor="middle" style={ar} fontSize="15" fill="#fff">ج</text>
    <text x="33" y="27" textAnchor="middle" style={ar} fontSize="12" fill="#f3e27a">ا</text>
    <rect x="40" y="44" width="10" height="2.5" rx="1" fill="#fff" />
  </svg>
);

export const QiblaIcon = () => (
  <svg viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="30" fill="#fff" stroke="#1c1c1c" strokeWidth="3.5" />
    <circle cx="32" cy="32" r="23" fill="none" stroke="#1d8a3a" strokeWidth="2.2" strokeDasharray="1.5 2.5" />
    <path d="M32 6 l3 6 h-6z" fill="#1d8a3a" />
    <path d="M22 26 l10-5 10 5 v14 l-10 5 -10-5z" fill="#111" />
    <path d="M22 26 l10 5 10-5" fill="none" stroke="#333" strokeWidth="1" />
    <path d="M22 29 l10 5 10-5" fill="none" stroke="#e8b923" strokeWidth="2" />
    <path d="M32 31 v14" stroke="#333" strokeWidth=".8" />
  </svg>
);

export const ECardIcon = () => (
  <svg viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="31" fill="#f7c64a" />
    <rect x="18" y="14" width="28" height="22" rx="2" fill="#ef5b6b" transform="rotate(-8 32 25)" />
    <path d="M27 22 c0-3 4-3 5 0 c1-3 5-3 5 0 c0 3-5 6-5 6s-5-3-5-6z" fill="#fff" transform="rotate(-8 32 25)" />
    <rect x="13" y="28" width="38" height="24" rx="2.5" fill="#fff" />
    <path d="M13 30 l19 13 19-13" fill="none" stroke="#f08a24" strokeWidth="2.5" strokeLinejoin="round" />
  </svg>
);

export const PrayerTimesIcon = () => (
  <svg viewBox="0 0 64 64">
    <circle cx="32" cy="30" r="27" fill="#fff" stroke="#c9ccd2" strokeWidth="4" />
    <g stroke="#555" strokeWidth="1.6" strokeLinecap="round">
      <path d="M32 7v3M32 50v3M9 30h3M52 30h-3M16 14l2 2M48 14l-2 2" />
    </g>
    <path d="M32 30 V15 M32 30 L42 24" stroke="#222" strokeWidth="2.4" strokeLinecap="round" />
    <circle cx="32" cy="30" r="2" fill="#c0392b" />
    <path d="M6 64 V52 h52 v12z" fill="#2e9c4f" />
    <path d="M20 52 C20 38 44 38 44 52z" fill="#3fb562" />
    <rect x="31" y="34" width="2" height="5" fill="#f3c74b" />
    <rect x="10" y="38" width="4" height="14" fill="#3fb562" />
    <path d="M9 38l3-6 3 6z" fill="#3fb562" />
    <rect x="50" y="38" width="4" height="14" fill="#3fb562" />
    <path d="M49 38l3-6 3 6z" fill="#3fb562" />
  </svg>
);

export const InflightIcon = () => (
  <svg viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="29" fill="#fff" stroke="#f08a24" strokeWidth="5" />
    <path
      transform="rotate(45 32 32)"
      fill="#1e7fd8"
      d="M32 11c2 0 3 3 3 6v9l15 8v4l-15-4v11l5 4v3l-8-2-8 2v-3l5-4V34l-15 4v-4l15-8v-9c0-3 1-6 3-6z"
    />
  </svg>
);

export const HifzIcon = () => (
  <svg viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="31" fill="#e8e8e8" />
    <circle cx="32" cy="32" r="28" fill="#c0392b" />
    <path d="M6 30 a26 26 0 0 1 52 0" fill="#d9534f" />
    <text x="32" y="24" textAnchor="middle" style={ar} fontSize="10" fontWeight="700" fill="#fff">حفظ القرآن</text>
    <path d="M18 38 l9 9 l19-19" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18 38 l9 9 l19-19" fill="none" stroke="#27a844" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const HijriIcon = () => (
  <svg viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="31" fill="#2aa79b" />
    <rect x="17" y="16" width="30" height="32" rx="3" fill="#fff" />
    <rect x="17" y="16" width="30" height="9" rx="3" fill="#3b7bd8" />
    <rect x="17" y="21" width="30" height="4" fill="#3b7bd8" />
    <rect x="23" y="13" width="3" height="7" rx="1.5" fill="#333" />
    <rect x="38" y="13" width="3" height="7" rx="1.5" fill="#333" />
    <text x="32" y="43" textAnchor="middle" style={ar} fontSize="16" fontWeight="700" fill="#222">٢٤</text>
  </svg>
);

export const AllahNamesIcon = () => (
  <svg viewBox="0 0 64 64">
    <circle cx="32" cy="32" r="31" fill="#0e0e0e" />
    <path d="M20 50 V26 C20 14 44 14 44 26 V50" fill="none" stroke="#d9a62e" strokeWidth="2.5" />
    <path d="M24 50 V27 C24 18 40 18 40 27 V50" fill="none" stroke="#d9a62e" strokeWidth="1" />
    <text x="32" y="40" textAnchor="middle" style={ar} fontSize="14" fontWeight="700" fill="#e8b923">الله</text>
    <path d="M17 50 h30" stroke="#d9a62e" strokeWidth="2.5" />
  </svg>
);
