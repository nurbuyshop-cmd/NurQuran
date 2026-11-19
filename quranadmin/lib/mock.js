// Demo backend used only by the live preview. Mirrors the real API's endpoints, stored in localStorage.
import { validatePage } from "./validate";
import { SURAHS } from "./meta";

const KEY = "qa_mock_db";
const FATIHA = [
  "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ", "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ", "ٱلرَّحْمَٰنِ ٱلرَّحِيمِ", "مَٰلِكِ يَوْمِ ٱلدِّينِ",
  "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", "ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ",
  "صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ",
];

function fresh() {
  const now = new Date().toISOString();
  return {
    updatedAt: now,
    pages: [{ page: 1, juz: 1, hizb: 1, blocks: [{ t: "surah", s: 1 }, ...FATIHA.map((text, i) => ({ t: "ayah", s: 1, a: i + 1, text }))], updatedAt: now, updatedBy: "Admin" }],
    settings: { siteName: "Nur Quran", reciter: "Yasser-Al-Dosari", languages: [{ code: "bn", name: "বাংলা" }, { code: "en", name: "English" }] },
    admins: [{ id: "a1", name: "Admin", email: "admin@toptol.site", password: "ChangeMe@123", role: "owner", createdAt: now }],
    log: [],
  };
}
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || fresh(); } catch (e) { return fresh(); } };
const save = (db) => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} };
const pub = (a) => ({ id: a.id, name: a.name, email: a.email, role: a.role, createdAt: a.createdAt });
const err = (error, status = 400, errors) => ({ ok: false, error, status, errors });
const log = (db, by, action, detail) => { db.log.unshift({ at: new Date().toISOString(), by, action, detail }); db.log = db.log.slice(0, 300); };
const langs = (db) => db.settings.languages.map((l) => l.code);
const describe = (p) => {
  const ay = p.blocks.filter((b) => b.t === "ayah");
  return ay.length ? `page ${p.page} (${ay[0].s}:${ay[0].a} – ${ay[ay.length - 1].s}:${ay[ay.length - 1].a})` : `page ${p.page}`;
};

export async function mockRequest(path, method, body, form, token) {
  await new Promise((r) => setTimeout(r, 120));
  const db = load();
  const me = db.admins.find((a) => `mock-${a.id}` === token);
  const url = path.split("?")[0];
  if (url === "/v1/auth/login") {
    const a = db.admins.find((x) => x.email === String(body.email || "").toLowerCase().trim() && x.password === body.password);
    if (!a) return err("Wrong email or password.", 401);
    log(db, a.name, "login", ""); save(db);
    return { ok: true, token: `mock-${a.id}`, admin: pub(a) };
  }
  if (!me) return err("Please log in.", 401);
  const nowIso = new Date().toISOString();
  const m = url.match(/^\/v1\/admin\/pages\/(\d+)$/);
  switch (true) {
    case url === "/v1/auth/me": return { ok: true, admin: pub(me) };
    case url === "/v1/auth/password": {
      if (body.current !== me.password) return err("Current password is wrong.");
      if (String(body.next || "").length < 8) return err("New password must be at least 8 characters.");
      me.password = body.next; log(db, me.name, "password changed", ""); save(db); return { ok: true };
    }
    case url === "/v1/admin/stats": {
      const ayahs = db.pages.flatMap((p) => p.blocks.filter((b) => b.t === "ayah"));
      const perSurah = {}; ayahs.forEach((a) => (perSurah[a.s] = (perSurah[a.s] || 0) + 1));
      const perJuz = {}; db.pages.forEach((p) => (perJuz[p.juz] = (perJuz[p.juz] || 0) + 1));
      const set = new Set(db.pages.map((p) => p.page)); let nextPage = 1; while (set.has(nextPage)) nextPage++;
      return { ok: true, updatedAt: db.updatedAt, pages: db.pages.length, totalPages: 604, ayahs: ayahs.length, totalAyahs: 6236,
        translated: ayahs.filter((a) => a.tr && Object.keys(a.tr).length).length, withAudio: ayahs.filter((a) => a.audio).length,
        surahsComplete: SURAHS.filter((s) => perSurah[s.n] === s.ayahs).length, perSurah, perJuz, nextPage, log: db.log.slice(0, 15) };
    }
    case url === "/v1/admin/pages" && method === "GET": return { ok: true, pages: db.pages };
    case url === "/v1/admin/pages" && method === "POST": {
      const r = validatePage(body, db.pages, langs(db), null);
      if (r.errors) return err(r.errors[0], 400, r.errors);
      db.pages.push({ ...r.page, updatedAt: nowIso, updatedBy: me.name }); db.pages.sort((a, b) => a.page - b.page);
      db.updatedAt = nowIso; log(db, me.name, "added", describe(r.page)); save(db); return { ok: true, page: r.page };
    }
    case !!m && method === "GET": {
      const p = db.pages.find((x) => x.page === +m[1]); return p ? { ok: true, page: p } : err("Page not found.", 404);
    }
    case !!m && method === "PUT": {
      const n = +m[1];
      if (!db.pages.some((p) => p.page === n)) return err("Page not found.", 404);
      const r = validatePage(body, db.pages, langs(db), n);
      if (r.errors) return err(r.errors[0], 400, r.errors);
      db.pages = db.pages.filter((p) => p.page !== n); db.pages.push({ ...r.page, updatedAt: nowIso, updatedBy: me.name });
      db.pages.sort((a, b) => a.page - b.page); db.updatedAt = nowIso; log(db, me.name, "edited", describe(r.page)); save(db);
      return { ok: true, page: r.page };
    }
    case !!m && method === "DELETE": {
      const p = db.pages.find((x) => x.page === +m[1]); if (!p) return err("Page not found.", 404);
      db.pages = db.pages.filter((x) => x !== p); db.updatedAt = nowIso; log(db, me.name, "deleted", describe(p)); save(db); return { ok: true };
    }
    case url === "/v1/images": return { ok: true, images: db.images || {} };
    case url === "/v1/site": return { ok: true, images: db.images || {}, reciters: db.settings.reciters || null };
    case url === "/v1/admin/notifications" && method === "GET": return { ok: true, notifications: db.notifications || [] };
    case url === "/v1/admin/notifications" && method === "POST": {
      if (!String(body.title || "").trim()) return err("Enter a title.");
      const n = { id: `n${Date.now().toString(36)}`, title: body.title.trim(), body: (body.body || "").trim(), link: (body.link || "").trim(), createdAt: nowIso, by: me.name };
      db.notifications = [n, ...(db.notifications || [])]; log(db, me.name, "added notification", n.title); save(db); return { ok: true, notification: n };
    }
    case /^\/v1\/admin\/notifications\/[^/]+$/.test(url) && method === "PUT": {
      const id = url.split("/").pop(); const cur = (db.notifications || []).find((x) => x.id === id); if (!cur) return err("Notification not found.", 404);
      Object.assign(cur, { title: body.title, body: body.body, link: body.link, updatedAt: nowIso }); save(db); return { ok: true, notification: cur };
    }
    case /^\/v1\/admin\/notifications\/[^/]+$/.test(url) && method === "DELETE": {
      const id = url.split("/").pop(); db.notifications = (db.notifications || []).filter((x) => x.id !== id); save(db); return { ok: true };
    }
    case url === "/v1/admin/images" && method === "POST": {
      const f = form && form.get("file");
      if (!f) return err("Choose a picture.");
      const slot = new URLSearchParams(path.split("?")[1] || "").get("slot");
      const dataUrl = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(f); });
      db.images = { ...(db.images || {}), [slot]: dataUrl }; log(db, me.name, "uploaded picture", slot); save(db);
      return { ok: true, slot, url: dataUrl };
    }
    case url === "/v1/admin/images" && method === "DELETE": {
      const slot = new URLSearchParams(path.split("?")[1] || "").get("slot");
      const n = { ...(db.images || {}) }; delete n[slot]; db.images = n; log(db, me.name, "removed picture", slot); save(db);
      return { ok: true };
    }
    case url === "/v1/admin/upload": {
      const f = form && form.get("file");
      if (!f) return err("Choose an audio file.");
      log(db, me.name, "uploaded audio", f.name); save(db);
      return { ok: true, url: URL.createObjectURL(f) };
    }
    case url === "/v1/admin/settings" && method === "GET": return { ok: true, settings: db.settings };
    case url === "/v1/admin/settings" && method === "PUT": {
      db.settings = { ...db.settings, ...body, languages: (body.languages || db.settings.languages).filter((l) => l.code && l.name) };
      log(db, me.name, "updated settings", ""); save(db); return { ok: true, settings: db.settings };
    }
    case url === "/v1/admin/admins" && method === "GET": return { ok: true, admins: db.admins.map(pub) };
    case url === "/v1/admin/admins" && method === "POST": {
      if (me.role !== "owner") return err("Only the owner can do this.", 403);
      if (!body.name) return err("Enter a name.");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email || "")) return err("Enter a valid email.");
      if (String(body.password || "").length < 8) return err("Password must be at least 8 characters.");
      if (db.admins.some((a) => a.email === body.email.toLowerCase())) return err("This email is already an admin.");
      const a = { id: `a${Date.now()}`, name: body.name, email: body.email.toLowerCase(), password: body.password, role: body.role === "owner" ? "owner" : "editor", createdAt: nowIso };
      db.admins.push(a); log(db, me.name, "added admin", a.email); save(db); return { ok: true, admin: pub(a) };
    }
    case /^\/v1\/admin\/admins\//.test(url) && method === "DELETE": {
      if (me.role !== "owner") return err("Only the owner can do this.", 403);
      const id = url.split("/").pop();
      if (id === me.id) return err("You cannot remove yourself.");
      db.admins = db.admins.filter((a) => a.id !== id); save(db); return { ok: true };
    }
    case url === "/v1/admin/export": return { ok: true, file: { exportedAt: nowIso, updatedAt: db.updatedAt, pages: db.pages, settings: db.settings } };
    case url === "/v1/admin/import": {
      const clean = [];
      for (const p of body.pages || []) {
        const r = validatePage(p, clean, langs(db), null);
        if (r.errors) return err(`Page ${p.page}: ${r.errors[0]}`, 400, r.errors);
        clean.push({ ...r.page, updatedAt: p.updatedAt || nowIso, updatedBy: p.updatedBy || me.name });
      }
      db.pages = clean; db.updatedAt = nowIso; log(db, me.name, "imported backup", `${clean.length} pages`); save(db); return { ok: true, pages: clean.length };
    }
    case url === "/v1/admin/log": return { ok: true, log: db.log };
    default: return err("Not found.", 404);
  }
}
