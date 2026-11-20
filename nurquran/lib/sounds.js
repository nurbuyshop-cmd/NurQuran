"use client";
// Alarm sounds. Adhan recordings are read from /public/sounds/<id>.mp3. A recording uploaded in the admin panel
// (Prayer Times → Adhan sounds) is used instead of the built-in file.
let ctx = null, current = null;
let overrides = {};
export function setSoundOverrides(map) { overrides = map && typeof map === "object" ? map : {}; }
export const soundUrl = (id) => overrides[id] || `/sounds/${id}.mp3`;

function tone(freqs, dur, vol) {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    let t = ctx.currentTime;
    freqs.forEach((f) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.3 * vol, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(ctx.destination);
      o.start(t); o.stop(t + dur + 0.05);
      t += dur * 0.85;
    });
  } catch (e) {}
}

export function stopSound() {
  if (current) { try { current.pause(); } catch (e) {} current = null; }
}

// preview = short sample when choosing; otherwise the real alarm
export function playSound(id, volume = 90, preview = true) {
  stopSound();
  const vol = Math.max(0.05, volume / 100);
  if (id === "none" || id === "silent") return;
  if (id === "default") return tone([880, 660, 880], 0.35, vol);
  if (id === "beep") return tone([1000], preview ? 1.2 : 3, vol);
  try {
    const a = new Audio(soundUrl(id));
    a.volume = vol;
    a.play().catch(() => tone([660, 880, 990], 0.4, vol));
    if (preview) setTimeout(() => { if (current === a) stopSound(); }, 8000);
    current = a;
  } catch (e) {
    tone([660, 880, 990], 0.4, vol);
  }
}
