// Icons for Prayer Times / Qibla screens.
const S = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };

export const Back = () => <svg viewBox="0 0 24 24" {...S} strokeWidth="2.2"><path d="M15 5l-7 7 7 7" /></svg>;
export const ChevR = () => <svg viewBox="0 0 24 24" {...S} strokeWidth="2.2"><path d="M9 5l7 7-7 7" /></svg>;
export const ChevL = () => <svg viewBox="0 0 24 24" {...S} strokeWidth="2.2"><path d="M15 5l-7 7 7 7" /></svg>;
export const Share = () => (
  <svg viewBox="0 0 24 24" {...S}><path d="M12 3v12M7.5 7.5L12 3l4.5 4.5" /><path d="M6 11H5a1 1 0 00-1 1v8a1 1 0 001 1h14a1 1 0 001-1v-8a1 1 0 00-1-1h-1" /></svg>
);
export const Locate = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 3L3 10.5l7.2 2.3L12.5 20z" /></svg>;
export const Check = () => <svg viewBox="0 0 24 24" {...S} strokeWidth="1.8"><path d="M4 12.5l5 5L20 6.5" /></svg>;
export const Plus = () => <svg viewBox="0 0 24 24" {...S} strokeWidth="2.6"><path d="M12 5v14M5 12h14" /></svg>;
export const Gear = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.4 13a7.6 7.6 0 000-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 00-1.7-1L15 3.3h-4l-.4 2.6a7.4 7.4 0 00-1.7 1l-2.5-1-2 3.5L6.6 11a7.6 7.6 0 000 2l-2.2 1.6 2 3.5 2.5-1a7.4 7.4 0 001.7 1l.4 2.6h4l.4-2.6a7.4 7.4 0 001.7-1l2.5 1 2-3.5zM13 15.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z" transform="translate(-1 0)" />
  </svg>
);
export const QiblaBtnIco = () => (
  <svg viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="14.5" fill="#fff" stroke="#3a3a3a" strokeWidth="2" />
    <circle cx="16" cy="16" r="11" fill="none" stroke="#1d8a3a" strokeWidth="1.6" strokeDasharray="1.2 1.8" />
    <path d="M11 13.5l5-2.5 5 2.5v6l-5 2.5-5-2.5z" fill="#111" />
    <path d="M11 15l5 2.5 5-2.5" fill="none" stroke="#e8b923" strokeWidth="1.4" />
  </svg>
);
export const PrayersBtnIco = () => (
  <svg viewBox="0 0 32 32">
    <path d="M4 30V24h24v6z" fill="#2e9c4f" />
    <path d="M9 24c0-8 14-8 14 0z" fill="#3fb562" />
    <rect x="15.2" y="11" width="1.6" height="5" fill="#d9b23c" />
    <rect x="5" y="15" width="2.6" height="9" fill="#3fb562" /><path d="M4.6 15l1.7-4 1.7 4z" fill="#3fb562" />
    <rect x="24.4" y="15" width="2.6" height="9" fill="#3fb562" /><path d="M24 15l1.7-4 1.7 4z" fill="#3fb562" />
    <circle cx="16" cy="9" r="5" fill="#fff" stroke="#888" strokeWidth="1.2" />
    <path d="M16 6.5V9l1.8 1" stroke="#333" strokeWidth="1" fill="none" />
  </svg>
);

// Sound-type icon used beside prayers and in the sound list
export function SoundIco({ kind, size = 26 }) {
  if (kind === "none")
    return (
      <svg viewBox="0 0 26 26" width={size} height={size}>
        <circle cx="13" cy="13" r="10.5" fill="none" stroke="#e53935" strokeWidth="2" />
        <path d="M5.6 20.4L20.4 5.6" stroke="#e53935" strokeWidth="2" />
      </svg>
    );
  const ring = <circle cx="13" cy="13" r="11.5" fill="#fff" stroke="#2e9c6a" strokeWidth="1.6" />;
  if (kind === "silent")
    return (
      <svg viewBox="0 0 26 26" width={size} height={size} fill="none" stroke="#2e7d5b" strokeWidth="1.4" strokeLinecap="round">
        {ring}
        <path d="M9.5 15.5v-3a3.5 3.5 0 016.2-2.2M16.5 12.5v3l1 1.3H8.5" /><path d="M12 18.5a1.2 1.2 0 002 0" /><path d="M7 7l12 12" />
      </svg>
    );
  if (kind === "bell")
    return (
      <svg viewBox="0 0 26 26" width={size} height={size} fill="none" stroke="#2e7d5b" strokeWidth="1.4" strokeLinecap="round">
        {ring}
        <circle cx="13" cy="14" r="5" /><path d="M13 11.5V14l1.6 1" /><path d="M8 8.6l1.8-1.6M18 8.6L16.2 7" /><path d="M10 19l-1 1M16 19l1 1" />
      </svg>
    );
  return (
    <svg viewBox="0 0 26 26" width={size} height={size} fill="none" stroke="#2e7d5b" strokeWidth="1.3" strokeLinejoin="round">
      {ring}
      <path d="M8.5 19v-4.2c0-2.6 2-4.3 4.5-5.6 2.5 1.3 4.5 3 4.5 5.6V19z" />
      <path d="M13 9.2V6.6" /><path d="M11.4 19v-2.4a1.6 1.6 0 013.2 0V19" />
      <path d="M6.2 19V12.5M19.8 19V12.5" /><path d="M5.6 12.5l.6-1.6.6 1.6M19.2 12.5l.6-1.6.6 1.6" />
    </svg>
  );
}
