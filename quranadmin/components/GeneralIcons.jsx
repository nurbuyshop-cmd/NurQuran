// Built-in icons for the General tiles and the Contact page (an uploaded picture replaces them).
export const GEN_ICONS = {
  email: () => (
    <svg viewBox="0 0 64 64"><rect x="6" y="14" width="52" height="36" rx="3" fill="#f2c443" /><path d="M6 17l26 19 26-19" fill="none" stroke="#d99c1f" strokeWidth="3" /><path d="M6 50l20-17M58 50L38 33" stroke="#e3ad2c" strokeWidth="2.5" /></svg>
  ),
  shield: () => (
    <svg viewBox="0 0 64 64"><path d="M32 5l22 8v16c0 15-9.5 25.5-22 30C19.5 54.5 10 44 10 29V13z" fill="#1f9d55" /><path d="M32 5l22 8v16c0 15-9.5 25.5-22 30z" fill="#178246" /><rect x="23" y="29" width="18" height="14" rx="2.5" fill="#fff" /><path d="M26.5 29v-4a5.5 5.5 0 0111 0v4" fill="none" stroke="#fff" strokeWidth="3" /><circle cx="32" cy="35.5" r="2.2" fill="#178246" /></svg>
  ),
  info: () => (
    <svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" fill="#2b8ce6" /><circle cx="32" cy="20" r="3.6" fill="#fff" /><rect x="28.5" y="27" width="7" height="20" rx="3.2" fill="#fff" /></svg>
  ),
  bell: () => (
    <svg viewBox="0 0 64 64"><path d="M16 44V30a16 16 0 0132 0v14l4 5H12z" fill="#f5b81c" /><path d="M32 14a16 16 0 0116 16v14l4 5H32z" fill="#e9a70f" /><circle cx="32" cy="9" r="3.5" fill="#f5b81c" /><path d="M25 52a7 7 0 0014 0z" fill="#e09a0a" /></svg>
  ),
  share: () => (
    <svg viewBox="0 0 64 64"><path d="M20 26h-6v30h36V26h-6" fill="none" stroke="#333" strokeWidth="3.4" strokeLinejoin="round" /><path d="M32 40V8M23 17l9-9 9 9" fill="none" stroke="#333" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" /><circle cx="22" cy="46" r="8" fill="#25d366" /><rect x="29" y="38" width="13" height="16" rx="3" fill="#1877f2" /><rect x="38" y="40" width="10" height="13" rx="3" fill="#1da1f2" /></svg>
  ),
  facebook: () => (
    <svg viewBox="0 0 64 64"><path d="M36 58V35h8l1.3-9H36v-5.8c0-2.6.8-4.4 4.5-4.4H46V8a63 63 0 00-7.2-.4C31.6 7.6 27 12 27 20v6h-8v9h8v23z" fill="#1877f2" /></svg>
  ),
  youtube: () => (
    <svg viewBox="0 0 64 64"><rect x="5" y="14" width="54" height="36" rx="10" fill="#ff0000" /><path d="M27 23l15 9-15 9z" fill="#fff" /></svg>
  ),
  whatsapp: () => (
    <svg viewBox="0 0 64 64"><path d="M32 6a26 26 0 00-22.4 39.2L6 58l13.2-3.4A26 26 0 1032 6z" fill="#25d366" /><path d="M24.5 19c-.7-1.5-1.4-1.5-2-1.5h-1.8a3.4 3.4 0 00-2.5 1.2 10.4 10.4 0 00-3.2 7.7c0 4.5 3.3 8.9 3.8 9.5s6.4 10.2 15.8 13.9c7.8 3.1 9.4 2.5 11.1 2.3s5.4-2.2 6.2-4.3a7.6 7.6 0 00.5-4.3c-.2-.4-.7-.6-1.5-1s-4.6-2.3-5.3-2.5-1.2-.4-1.7.4-2 2.5-2.4 3-.9.6-1.7.2a21.3 21.3 0 01-6.2-3.8 23.4 23.4 0 01-4.3-5.4c-.5-.8 0-1.2.3-1.6l1.2-1.4a5.3 5.3 0 00.8-1.3 1.5 1.5 0 000-1.4c-.2-.4-1.6-4.2-2.3-5.7z" fill="#fff" /></svg>
  ),
  telegram: () => (
    <svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="27" fill="#29a9eb" /><path d="M14 31.5l31-12c1.4-.5 2.7.4 2.2 2.6l-5.3 25c-.4 1.8-1.5 2.2-3 1.4l-8.2-6-4 3.8c-.4.4-.8.8-1.7.8l.6-8.4 15.3-13.8c.7-.6-.1-.9-1-.3L21 37.3 13 34.8c-1.8-.6-1.8-1.8.9-2.8z" fill="#fff" /></svg>
  ),
  instagram: () => (
    <svg viewBox="0 0 64 64"><defs><linearGradient id="gig" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#feda75" /><stop offset=".35" stopColor="#fa7e1e" /><stop offset=".6" stopColor="#d62976" /><stop offset="1" stopColor="#4f5bd5" /></linearGradient></defs><rect x="7" y="7" width="50" height="50" rx="14" fill="url(#gig)" /><circle cx="32" cy="32" r="11" fill="none" stroke="#fff" strokeWidth="4" /><circle cx="45" cy="19" r="3" fill="#fff" /></svg>
  ),
  website: () => (
    <svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="25" fill="#e8f5ec" stroke="#1f8a3b" strokeWidth="3.4" /><path d="M7 32h50M32 7c-8 8-8 42 0 50M32 7c8 8 8 42 0 50M11 19h42M11 45h42" fill="none" stroke="#1f8a3b" strokeWidth="2.6" /></svg>
  ),
  star: () => (
    <svg viewBox="0 0 64 64"><path d="M32 6l7.8 16.5 18 2.3-13.2 12.5 3.4 17.9L32 46.4 16 55.2l3.4-17.9L6.2 24.8l18-2.3z" fill="#f5b81c" /></svg>
  ),
  phone: () => (
    <svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="27" fill="#1f9d55" /><path d="M24.5 17.5l4 8.5-3.4 3c1.8 4 5.2 7.4 9.2 9.2l3-3.4 8.5 4-1.2 6c-.3 1.3-1.4 2.2-2.7 2.1C28 45.8 18.2 36 17.1 22c-.1-1.3.8-2.4 2.1-2.7z" fill="#fff" /></svg>
  ),
  location: () => (
    <svg viewBox="0 0 64 64"><path d="M32 58S12 37 12 25a20 20 0 0140 0c0 12-20 33-20 33z" fill="#e53935" /><circle cx="32" cy="25" r="8" fill="#fff" /></svg>
  ),
  clock: () => (
    <svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" fill="#7e57c2" /><path d="M32 16v17l11 7" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  link: () => (
    <svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="27" fill="#eef3ee" /><path d="M28 36l8-8M24.5 30.5l-4 4a6.4 6.4 0 009 9l4-4M39.5 33.5l4-4a6.4 6.4 0 00-9-9l-4 4" fill="none" stroke="#1f8a3b" strokeWidth="4" strokeLinecap="round" /></svg>
  ),
};

export function GenIcon({ name }) {
  const C = GEN_ICONS[name] || GEN_ICONS.link;
  return <C />;
}
