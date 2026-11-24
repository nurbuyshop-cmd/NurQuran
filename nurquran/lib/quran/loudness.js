"use client";
// Equal volume for the recitation. The recordings (one file per ayah, from many reciters) are not
// equally loud. Each file is measured once — a gated loudness, like LUFS: 400 ms blocks, silence
// left out — and the gain that brings it to TARGET_DB is remembered (also in localStorage, so a saved
// surah does not need measuring again). The reader applies the gain with a Web Audio GainNode
// followed by a limiter, so quiet files can also be made louder without clipping.

// the file's bytes: the copy saved for offline listening (Android app), otherwise download it
// (the browser's HTTP cache usually has it already, the <audio> element just loaded it)
async function audioData(url) {
  try {
    if (typeof caches !== "undefined") {
      const r = await (await caches.open("nq-audio-v1")).match(url);
      if (r) return r.arrayBuffer();
    }
  } catch (e) {}
  const r = await fetch(url, { mode: "cors" });
  if (!r.ok) throw new Error(`audio ${r.status}`);
  return r.arrayBuffer();
}

const KEY = "nq-level-v1";
const TARGET_DB = -18;          // gated loudness every ayah is brought to (dBFS)
const MIN_DB = -9, MAX_DB = 14; // never change a file by more than this
const MAX_KEEP = 4000;

let store = null;
const load = () => {
  if (store) return store;
  try { store = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { store = {}; }
  return store;
};
let saveT = 0;
const persist = () => {
  clearTimeout(saveT);
  saveT = setTimeout(() => {
    try {
      const keys = Object.keys(store);
      if (keys.length > MAX_KEEP) keys.slice(0, keys.length - MAX_KEEP).forEach((k) => delete store[k]);
      localStorage.setItem(KEY, JSON.stringify(store));
    } catch (e) {}
  }, 1500);
};
const short = (url) => url.replace(/^https?:\/\/(www\.)?everyayah\.com\/data\//, "");

let dec = null;
function decoder() {
  if (dec) return dec;
  const O = typeof window !== "undefined" && (window.OfflineAudioContext || window.webkitOfflineAudioContext);
  if (!O) return null;
  try { dec = new O(1, 1, 22050); } catch (e) { dec = null; }
  return dec;
}
const decode = (ctx, buf) => new Promise((ok, bad) => {
  const p = ctx.decodeAudioData(buf, ok, bad);
  if (p && p.then) p.then(ok, bad);
});

// gain (a multiplier) that brings this decoded audio to TARGET_DB
function gainOf(ab) {
  const chans = Array.from({ length: ab.numberOfChannels }, (_, c) => ab.getChannelData(c));
  const n = ab.length, block = Math.max(1, Math.round(ab.sampleRate * 0.4)), hop = Math.max(1, Math.round(block / 4));
  // mean square of every 100 ms hop, then 400 ms blocks from four hops
  const hops = [];
  for (let i = 0; i + hop <= n; i += hop) {
    let sum = 0;
    for (const d of chans) for (let j = i; j < i + hop; j++) sum += d[j] * d[j];
    hops.push(sum / (hop * chans.length));
  }
  const blocks = [];
  for (let i = 0; i + 4 <= hops.length; i++) blocks.push((hops[i] + hops[i + 1] + hops[i + 2] + hops[i + 3]) / 4);
  if (!blocks.length && hops.length) blocks.push(hops.reduce((a, b) => a + b, 0) / hops.length);
  const abs = blocks.filter((m) => m > 1e-7);               // -70 dBFS: silence
  if (!abs.length) return 1;
  const mean1 = abs.reduce((a, b) => a + b, 0) / abs.length;
  const rel = abs.filter((m) => m > mean1 * 0.1);            // -10 dB below the average: pauses, breaths
  const mean = rel.reduce((a, b) => a + b, 0) / rel.length;
  const db = 10 * Math.log10(mean);
  const g = Math.min(MAX_DB, Math.max(MIN_DB, TARGET_DB - db));
  return Math.round(Math.pow(10, g / 20) * 1000) / 1000;
}

// already measured: the gain, else null
export function knownGain(url) {
  if (!url) return null;
  const v = load()[short(url)];
  return typeof v === "number" ? v : null;
}

const pending = new Map();
// measure a file (downloads it into the offline cache if needed). Resolves with the gain, or null.
export function measureGain(url) {
  if (!url || typeof window === "undefined") return Promise.resolve(null);
  const k = knownGain(url);
  if (k != null) return Promise.resolve(k);
  if (pending.has(url)) return pending.get(url);
  const ctx = decoder();
  if (!ctx) return Promise.resolve(null);
  const job = audioData(url)
    .then((buf) => decode(ctx, buf))
    .then((ab) => { const g = gainOf(ab); load()[short(url)] = g; persist(); return g; })
    .catch(() => null)
    .finally(() => pending.delete(url));
  pending.set(url, job);
  return job;
}

// the gain if it is known within `ms`, otherwise null (playback starts, the gain follows when ready)
export function gainSoon(url, ms = 350) {
  const k = knownGain(url);
  if (k != null) return Promise.resolve(k);
  return Promise.race([measureGain(url), new Promise((r) => setTimeout(() => r(null), ms))]);
}
