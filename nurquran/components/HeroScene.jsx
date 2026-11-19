// Desert background for the home header. It follows the real sky at the chosen city:
//   night   — before sunrise and after maghrib: dark sky, stars, crescent
//   morning — first hour after sunrise: soft dawn colours, rising sun
//   day     — bright blue sky, sun, clouds
//   evening — last hour before maghrib: golden sky, low sun
const P = {
  night: {
    sky: ["#0b1736", "#173468", "#3f6fa6", "#7aa3cc"], glow: "#a9c6e4", glowO: 0.55,
    far: "#5d86b4", farO: 0.75, camels: "#2b4f7d", dune1: "#0f2448", dune2: "#0a1a37", ridge: "#163463", shade: 0.35,
  },
  morning: {
    sky: ["#3d6fb6", "#7fa9d9", "#f3c9a1", "#ffe0b8"], glow: "#fff1c9", glowO: 0.75,
    far: "#8a7f8f", farO: 0.6, camels: "#6d5a54", dune1: "#c99a6b", dune2: "#a87a52", ridge: "#dcb487", shade: 0.3,
  },
  day: {
    sky: ["#1f6fc4", "#3f8fdc", "#7dbbee", "#bfe2fa"], glow: "#ffffff", glowO: 0.5,
    far: "#7f9fbf", farO: 0.55, camels: "#8a6a45", dune1: "#e0b47c", dune2: "#c99760", ridge: "#ecc898", shade: 0.32,
  },
  evening: {
    sky: ["#2b3f7a", "#8a5c8f", "#e98a5a", "#f7c26b"], glow: "#ffd27a", glowO: 0.7,
    far: "#6b5370", farO: 0.65, camels: "#4a3442", dune1: "#b36b45", dune2: "#8a4f35", ridge: "#c98057", shade: 0.32,
  },
};

export default function HeroScene({ phase = "night" }) {
  const c = P[phase] || P.night;
  const night = phase === "night";
  const stars = [
    [420, 40, 1.2, 0.8], [520, 90, 1, 0.6], [610, 30, 1.4, 0.9], [700, 70, 1, 0.6],
    [820, 25, 1.2, 0.8], [905, 95, 1, 0.5], [980, 45, 1.3, 0.8], [1080, 80, 1, 0.6],
    [1150, 30, 1.2, 0.7], [360, 120, 1, 0.5], [760, 140, 1, 0.4], [1010, 150, 1, 0.4],
  ];
  // where the sun sits: low on the left in the morning, high in the day, low on the right in the evening
  const sun = phase === "morning" ? [300, 205, 30] : phase === "evening" ? [1210, 215, 32] : [1060, 150, 24];
  return (
    <svg className={`scene ${phase}`} viewBox="0 0 1440 400" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id={`sky-${phase}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.sky[0]} />
          <stop offset=".45" stopColor={c.sky[1]} />
          <stop offset=".8" stopColor={c.sky[2]} />
          <stop offset="1" stopColor={c.sky[3]} />
        </linearGradient>
        <radialGradient id={`glow-${phase}`} cx={night ? ".72" : String(sun[0] / 1440)} cy={night ? ".78" : String(sun[1] / 400)} r=".45">
          <stop offset="0" stopColor={c.glow} stopOpacity={c.glowO} />
          <stop offset="1" stopColor={c.glow} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`fade-${phase}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity={c.shade} />
          <stop offset=".3" stopColor="#000" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="1440" height="400" fill={`url(#sky-${phase})`} />
      <rect width="1440" height="400" fill={`url(#glow-${phase})`} />

      {night ? (
        <>
          <g fill="#fff">
            {stars.map(([cx, cy, r, o], i) => <circle key={i} cx={cx} cy={cy} r={r} opacity={o} />)}
          </g>
          <g transform="translate(345 62)">
            <circle r="22" fill="#f4f1dc" />
            <circle cx="9" cy="-6" r="19" fill="#0e1c3e" />
          </g>
        </>
      ) : (
        <>
          <g transform={`translate(${sun[0]} ${sun[1]})`}>
            <circle r={sun[2] * 2.2} fill={phase === "day" ? "#fff7d6" : "#ffe6a8"} opacity=".35" />
            <circle r={sun[2] * 1.45} fill={phase === "day" ? "#fff3b8" : "#ffd27a"} opacity=".55" />
            <circle r={sun[2]} fill={phase === "day" ? "#ffe066" : phase === "morning" ? "#ffc85a" : "#ffb347"} />
          </g>
          <g fill="#fff" opacity={phase === "day" ? 0.9 : 0.55}>
            <path d="M560 95c0-14 12-24 26-22 6-12 24-14 33-4 14-3 26 8 24 22 9 2 14 9 12 16H548c-4-7 2-12 12-12z" />
            <path d="M880 60c0-10 9-17 19-15 5-9 18-10 24-3 10-2 19 6 17 16 7 1 10 7 9 12H871c-3-5 1-9 9-10z" />
            <path d="M1180 120c0-12 10-20 22-18 5-10 20-12 28-3 12-2 22 7 20 18 8 2 12 8 10 13h-91c-3-6 2-10 11-10z" opacity=".8" />
          </g>
        </>
      )}

      <g fill={c.far} opacity={c.farO}>
        <rect x="905" y="215" width="7" height="90" /><path d="M903 215 l5.5 -22 l5.5 22z" /><rect x="901" y="228" width="15" height="4" />
        <rect x="1110" y="215" width="7" height="90" /><path d="M1108 215 l5.5 -22 l5.5 22z" /><rect x="1106" y="228" width="15" height="4" />
        <path d="M960 305 V262 h100 v43z" />
        <path d="M975 262 C975 228 1045 228 1045 262z" />
        <rect x="1007" y="214" width="6" height="14" /><circle cx="1010" cy="212" r="3" />
        <path d="M925 305 V275 h35 v30z" /><path d="M930 275 c0-18 25-18 25 0z" />
        <path d="M1060 305 V275 h35 v30z" /><path d="M1065 275 c0-18 25-18 25 0z" />
      </g>
      <g fill={c.camels}>
        <path d="M1180 300 l2-18 c2-8 8-10 12-14 c4-4 8-4 11 0 c3 4 7 4 10 0 c3-3 7-3 9 1 l6-14 c1-3 6-3 7 0 l1 6 l-3 2 l-7 16 c-2 5-5 8-9 8 l1 13 h-3 l-2-12 h-14 l-2 12 h-3 l0-13 c-3 0-5 2-6 5 l-2 8z" />
        <path d="M1250 302 l2-15 c2-7 7-9 10-12 c3-3 7-3 9 0 c3 3 6 3 8 0 c3-3 6-2 8 1 l5-12 c1-3 5-3 6 0 l1 5 l-3 2 l-6 14 c-2 4-4 7-8 7 l1 11 h-3 l-2-10 h-12 l-2 10 h-3 v-11 c-3 0-4 2-5 4 l-2 6z" />
      </g>
      <path d="M0 250 C160 180 300 175 470 250 C560 290 640 300 760 300 L1440 300 V400 H0z" fill={c.dune1} />
      <path d="M0 330 C200 290 420 300 640 320 C860 340 1100 300 1440 310 V400 H0z" fill={c.dune2} />
      <path d="M380 255 C430 235 470 238 520 262 L470 300 Z" fill={c.ridge} opacity=".6" />
      <rect width="1440" height="400" fill={`url(#fade-${phase})`} />
    </svg>
  );
}
