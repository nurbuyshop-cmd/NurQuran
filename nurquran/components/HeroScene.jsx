// Night desert background: sky, stars, crescent, distant mosque, camels, dunes.
export default function HeroScene() {
  const stars = [
    [420, 40, 1.2, 0.8], [520, 90, 1, 0.6], [610, 30, 1.4, 0.9], [700, 70, 1, 0.6],
    [820, 25, 1.2, 0.8], [905, 95, 1, 0.5], [980, 45, 1.3, 0.8], [1080, 80, 1, 0.6],
    [1150, 30, 1.2, 0.7], [360, 120, 1, 0.5], [760, 140, 1, 0.4], [1010, 150, 1, 0.4],
  ];
  return (
    <svg className="scene" viewBox="0 0 1440 400" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b1736" />
          <stop offset=".45" stopColor="#173468" />
          <stop offset=".8" stopColor="#3f6fa6" />
          <stop offset="1" stopColor="#7aa3cc" />
        </linearGradient>
        <radialGradient id="glow" cx=".72" cy=".78" r=".45">
          <stop offset="0" stopColor="#a9c6e4" stopOpacity=".55" />
          <stop offset="1" stopColor="#a9c6e4" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity=".35" />
          <stop offset=".3" stopColor="#000" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="1440" height="400" fill="url(#sky)" />
      <rect width="1440" height="400" fill="url(#glow)" />
      <g fill="#fff">
        {stars.map(([cx, cy, r, o], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} opacity={o} />
        ))}
      </g>
      <g transform="translate(345 62)">
        <circle r="22" fill="#f4f1dc" />
        <circle cx="9" cy="-6" r="19" fill="#0e1c3e" />
      </g>
      <g fill="#5d86b4" opacity=".75">
        <rect x="905" y="215" width="7" height="90" /><path d="M903 215 l5.5 -22 l5.5 22z" /><rect x="901" y="228" width="15" height="4" />
        <rect x="1110" y="215" width="7" height="90" /><path d="M1108 215 l5.5 -22 l5.5 22z" /><rect x="1106" y="228" width="15" height="4" />
        <path d="M960 305 V262 h100 v43z" />
        <path d="M975 262 C975 228 1045 228 1045 262z" />
        <rect x="1007" y="214" width="6" height="14" /><circle cx="1010" cy="212" r="3" />
        <path d="M925 305 V275 h35 v30z" /><path d="M930 275 c0-18 25-18 25 0z" />
        <path d="M1060 305 V275 h35 v30z" /><path d="M1065 275 c0-18 25-18 25 0z" />
      </g>
      <g fill="#2b4f7d">
        <path d="M1180 300 l2-18 c2-8 8-10 12-14 c4-4 8-4 11 0 c3 4 7 4 10 0 c3-3 7-3 9 1 l6-14 c1-3 6-3 7 0 l1 6 l-3 2 l-7 16 c-2 5-5 8-9 8 l1 13 h-3 l-2-12 h-14 l-2 12 h-3 l0-13 c-3 0-5 2-6 5 l-2 8z" />
        <path d="M1250 302 l2-15 c2-7 7-9 10-12 c3-3 7-3 9 0 c3 3 6 3 8 0 c3-3 6-2 8 1 l5-12 c1-3 5-3 6 0 l1 5 l-3 2 l-6 14 c-2 4-4 7-8 7 l1 11 h-3 l-2-10 h-12 l-2 10 h-3 v-11 c-3 0-4 2-5 4 l-2 6z" />
      </g>
      <path d="M0 250 C160 180 300 175 470 250 C560 290 640 300 760 300 L1440 300 V400 H0z" fill="#0f2448" />
      <path d="M0 330 C200 290 420 300 640 320 C860 340 1100 300 1440 310 V400 H0z" fill="#0a1a37" />
      <path d="M380 255 C430 235 470 238 520 262 L470 300 Z" fill="#163463" opacity=".6" />
      <rect width="1440" height="400" fill="url(#fade)" />
    </svg>
  );
}
