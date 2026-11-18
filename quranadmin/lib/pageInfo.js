import { surah } from "./meta";
// Human summary of a page's contents, e.g. "Al-Fatiha 1–7"
export function pageSummary(p) {
  const ay = p.blocks.filter((b) => b.t === "ayah");
  if (!ay.length) return "No ayahs";
  const groups = [];
  ay.forEach((a) => {
    const g = groups[groups.length - 1];
    if (g && g.s === a.s) g.to = a.a; else groups.push({ s: a.s, from: a.a, to: a.a });
  });
  return groups.map((g) => `${surah(g.s).en} ${g.from}${g.to !== g.from ? `–${g.to}` : ""}`).join(", ");
}
export const ayahCount = (p) => p.blocks.filter((b) => b.t === "ayah").length;
