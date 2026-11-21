"use client";
// Record from the microphone in the browser and turn it into a small, clean WAV file that plays on every phone.
// The silence before you start speaking and after you finish is cut off automatically, and the volume is evened out.

export const canRecord = () =>
  typeof window !== "undefined" && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) && typeof MediaRecorder !== "undefined";

export async function startRecording() {
  if (!window.isSecureContext) throw new Error("Recording needs a secure (https) admin address. Add SSL to quranadmin.toptol.site, then try again.");
  if (!canRecord()) throw new Error("This browser cannot record. Use Chrome, Edge, Firefox or Safari.");
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
  } catch (e) {
    throw new Error(e && e.name === "NotAllowedError" ? "Microphone permission was blocked. Allow the microphone for this site in the browser, then try again." : "No microphone found.");
  }
  const rec = new MediaRecorder(stream);
  const chunks = [];
  rec.ondataavailable = (e) => e.data && e.data.size && chunks.push(e.data);
  const done = new Promise((res) => { rec.onstop = () => res(new Blob(chunks, { type: rec.mimeType || "audio/webm" })); });
  rec.start();
  const release = () => stream.getTracks().forEach((t) => t.stop());
  return {
    async stop() {
      if (rec.state !== "inactive") rec.stop();
      const blob = await done;
      release();
      return toWav(blob);
    },
    cancel() { try { rec.state !== "inactive" && rec.stop(); } catch (e) {} release(); },
  };
}

const RATE = 24000;

async function toWav(blob) {
  const AC = window.AudioContext || window.webkitAudioContext;
  const ctx = new AC();
  let buf;
  try { buf = await ctx.decodeAudioData(await blob.arrayBuffer()); }
  finally { ctx.close && ctx.close(); }
  // mono + 24 kHz
  const len = Math.max(1, Math.ceil(buf.duration * RATE));
  const off = new OfflineAudioContext(1, len, RATE);
  const src = off.createBufferSource();
  src.buffer = buf; src.connect(off.destination); src.start();
  let d = (await off.startRendering()).getChannelData(0);

  // cut silence at both ends (keep a little breathing room)
  let peak = 0;
  for (let i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i]));
  if (peak < 0.01) throw new Error("Nothing was heard — check the microphone and speak a little louder.");
  const thr = Math.max(0.02, peak * 0.08);
  const win = Math.round(RATE * 0.02);
  const loud = (i) => { let m = 0; for (let j = i; j < Math.min(d.length, i + win); j++) m = Math.max(m, Math.abs(d[j])); return m > thr; };
  let a = 0; while (a < d.length && !loud(a)) a += win;
  let b = d.length - win; while (b > a && !loud(b)) b -= win;
  a = Math.max(0, a - Math.round(RATE * 0.12));
  b = Math.min(d.length, b + win + Math.round(RATE * 0.25));
  d = d.slice(a, b);

  // even out the volume, short fade in/out so there is no click
  const gain = 0.9 / peak;
  const fade = Math.min(Math.round(RATE * 0.015), d.length >> 2);
  const pcm = new Int16Array(d.length);
  for (let i = 0; i < d.length; i++) {
    let v = d[i] * gain;
    if (i < fade) v *= i / fade;
    if (i > d.length - fade) v *= (d.length - i) / fade;
    v = Math.max(-1, Math.min(1, v));
    pcm[i] = v < 0 ? v * 0x8000 : v * 0x7fff;
  }
  const out = new DataView(new ArrayBuffer(44 + pcm.length * 2));
  const str = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
  str(0, "RIFF"); out.setUint32(4, 36 + pcm.length * 2, true); str(8, "WAVE");
  str(12, "fmt "); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 1, true);
  out.setUint32(24, RATE, true); out.setUint32(28, RATE * 2, true); out.setUint16(32, 2, true); out.setUint16(34, 16, true);
  str(36, "data"); out.setUint32(40, pcm.length * 2, true);
  pcm.forEach((v, i) => out.setInt16(44 + i * 2, v, true));
  return new File([out.buffer], "recording.wav", { type: "audio/wav" });
}
