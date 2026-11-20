// NurQuran API — apiquran.toptol.site
// Start: `node app.js` (cPanel: Setup Node.js App → Application startup file = app.js)
const fs = require("fs");
const path = require("path");

// ---- load .env (simple parser, no extra package) ----
const envFile = path.join(__dirname, ".env");
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, "utf8").split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  });
}

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const crypto = require("crypto");
const store = require("./src/store");
const { validatePage } = require("./src/validate");
const { SURAHS, JUZ_NAMES, TOTAL_PAGES, TOTAL_AYAHS } = require("./src/meta");

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || store.read("secret", () => ({ key: crypto.randomBytes(32).toString("hex") })).key;
const ORIGINS = (process.env.ALLOWED_ORIGINS || "http://nurquran.toptol.site,https://nurquran.toptol.site,http://quranadmin.toptol.site,https://quranadmin.toptol.site,http://localhost:3000,http://localhost:3001")
  .split(",").map((s) => s.trim()).filter(Boolean);
const UPLOAD_DIR = path.join(__dirname, "uploads");
fs.mkdirSync(path.join(UPLOAD_DIR, "audio"), { recursive: true });
fs.mkdirSync(path.join(UPLOAD_DIR, "images"), { recursive: true });

/* ---------- data (seeded on first run) ---------- */
const seed = () => JSON.parse(fs.readFileSync(path.join(__dirname, "src", "seed-content.json"), "utf8")).pages;
const getPages = () => store.read("pages", () => ({ updatedAt: new Date().toISOString(), pages: seed() }));
const getSettings = () => store.read("settings", () => ({
  siteName: "Nur Quran",
  reciter: "Yasser-Al-Dosari",
  languages: [{ code: "bn", name: "বাংলা" }, { code: "en", name: "English" }],
}));
const getAdmins = () => store.read("admins", () => {
  const email = (process.env.ADMIN_EMAIL || "admin@toptol.site").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "ChangeMe@123";
  return [{ id: "a1", name: "Admin", email, hash: bcrypt.hashSync(password, 10), role: "owner", createdAt: new Date().toISOString() }];
});
const getLog = () => store.read("log", []);
// pictures uploaded from the admin panel: { slot: url }, e.g. "reciter:sudais", "feature:read-quran", "theme:night"
const getImages = () => store.read("images", () => ({ updatedAt: new Date().toISOString(), items: {} }));
function log(admin, action, detail) {
  const l = getLog();
  l.unshift({ at: new Date().toISOString(), by: admin ? admin.name : "system", action, detail });
  store.write("log", l.slice(0, 300));
}
getPages(); getSettings(); getAdmins();

/* ---------- app ---------- */
const app = express();
app.disable("x-powered-by");
app.set("trust proxy", true);
app.use(cors({ origin: (o, cb) => cb(null, !o || ORIGINS.includes(o)), credentials: false }));
app.use(express.json({ limit: "5mb" }));
app.use("/uploads", express.static(UPLOAD_DIR, { maxAge: "30d", immutable: true }));

const ok = (res, data) => res.json({ ok: true, ...data });
const fail = (res, code, error, extra) => res.status(code).json({ ok: false, error, ...extra });
const publicAdmin = (a) => ({ id: a.id, name: a.name, email: a.email, role: a.role, createdAt: a.createdAt });
const sortPages = (pages) => pages.sort((a, b) => a.page - b.page);

function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return fail(res, 401, "Please log in.");
  try {
    const p = jwt.verify(token, JWT_SECRET);
    const admin = getAdmins().find((a) => a.id === p.id);
    if (!admin) return fail(res, 401, "Account not found.");
    req.admin = admin;
    next();
  } catch (e) {
    return fail(res, 401, "Session expired. Please log in again.");
  }
}
const ownerOnly = (req, res, next) => (req.admin.role === "owner" ? next() : fail(res, 403, "Only the owner can do this."));

/* ---------- public ---------- */
app.get("/", (req, res) => ok(res, { name: "NurQuran API", version: 1 }));
app.get("/v1/health", (req, res) => ok(res, { time: new Date().toISOString() }));

app.get("/v1/meta", (req, res) => {
  const { pages } = getPages();
  ok(res, { surahs: SURAHS, juz: JUZ_NAMES, totalPages: TOTAL_PAGES, totalAyahs: TOTAL_AYAHS, settings: getSettings(), pagesAdded: pages.length });
});
// everything the reader needs, cached by the browser; check /v1/quran/version first
app.get("/v1/quran", (req, res) => {
  const d = getPages();
  res.set("Cache-Control", "public, max-age=60");
  ok(res, { updatedAt: d.updatedAt, pages: d.pages, settings: getSettings() });
});
app.get("/v1/quran/version", (req, res) => {
  res.set("Cache-Control", "no-cache");
  ok(res, { updatedAt: getPages().updatedAt });
});
app.get("/v1/quran/pages/:n", (req, res) => {
  const p = getPages().pages.find((x) => x.page === Number(req.params.n));
  if (!p) return fail(res, 404, "Page not added yet.");
  ok(res, { page: p });
});

/* ---------- auth ---------- */
const attempts = new Map();
app.post("/v1/auth/login", (req, res) => {
  const ip = req.ip;
  const now = Date.now();
  const rec = (attempts.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  if (rec.length >= 8) return fail(res, 429, "Too many attempts. Try again in a few minutes.");
  const email = String(req.body.email || "").trim().toLowerCase();
  const admin = getAdmins().find((a) => a.email === email);
  if (!admin || !bcrypt.compareSync(String(req.body.password || ""), admin.hash)) {
    rec.push(now); attempts.set(ip, rec);
    return fail(res, 401, "Wrong email or password.");
  }
  attempts.delete(ip);
  const token = jwt.sign({ id: admin.id }, JWT_SECRET, { expiresIn: "7d" });
  log(admin, "login", "");
  ok(res, { token, admin: publicAdmin(admin) });
});
app.get("/v1/auth/me", auth, (req, res) => ok(res, { admin: publicAdmin(req.admin) }));
app.post("/v1/auth/password", auth, (req, res) => {
  const { current, next } = req.body || {};
  if (!bcrypt.compareSync(String(current || ""), req.admin.hash)) return fail(res, 400, "Current password is wrong.");
  if (String(next || "").length < 8) return fail(res, 400, "New password must be at least 8 characters.");
  const admins = getAdmins().map((a) => (a.id === req.admin.id ? { ...a, hash: bcrypt.hashSync(next, 10) } : a));
  store.write("admins", admins);
  log(req.admin, "password changed", "");
  ok(res, {});
});

/* ---------- admin: dashboard ---------- */
app.get("/v1/admin/stats", auth, (req, res) => {
  const { pages, updatedAt } = getPages();
  const ayahs = pages.flatMap((p) => p.blocks.filter((b) => b.t === "ayah"));
  const perSurah = {};
  ayahs.forEach((a) => (perSurah[a.s] = (perSurah[a.s] || 0) + 1));
  const perJuz = {};
  pages.forEach((p) => (perJuz[p.juz] = (perJuz[p.juz] || 0) + 1));
  ok(res, {
    updatedAt,
    pages: pages.length, totalPages: TOTAL_PAGES,
    ayahs: ayahs.length, totalAyahs: TOTAL_AYAHS,
    translated: ayahs.filter((a) => a.tr && Object.keys(a.tr).length).length,
    withAudio: ayahs.filter((a) => a.audio).length,
    surahsComplete: SURAHS.filter((s) => perSurah[s.n] === s.ayahs).length,
    perSurah, perJuz,
    nextPage: (() => { let n = 1; const set = new Set(pages.map((p) => p.page)); while (set.has(n)) n++; return n; })(),
    log: getLog().slice(0, 15),
  });
});

/* ---------- admin: pages ---------- */
app.get("/v1/admin/pages", auth, (req, res) => ok(res, { pages: getPages().pages }));
app.get("/v1/admin/pages/:n", auth, (req, res) => {
  const p = getPages().pages.find((x) => x.page === Number(req.params.n));
  if (!p) return fail(res, 404, "Page not found.");
  ok(res, { page: p });
});
const langCodes = () => getSettings().languages.map((l) => l.code);
const describe = (p) => {
  const ay = p.blocks.filter((b) => b.t === "ayah");
  return ay.length ? `page ${p.page} (${ay[0].s}:${ay[0].a} – ${ay[ay.length - 1].s}:${ay[ay.length - 1].a})` : `page ${p.page}`;
};
app.post("/v1/admin/pages", auth, (req, res) => {
  const d = getPages();
  const r = validatePage(req.body || {}, d.pages, langCodes(), null);
  if (r.errors) return fail(res, 400, r.errors[0], { errors: r.errors });
  store.backup("pages");
  store.write("pages", { updatedAt: new Date().toISOString(), pages: sortPages([...d.pages, { ...r.page, updatedAt: new Date().toISOString(), updatedBy: req.admin.name }]) });
  log(req.admin, "added", describe(r.page));
  ok(res, { page: r.page });
});
app.put("/v1/admin/pages/:n", auth, (req, res) => {
  const n = Number(req.params.n);
  const d = getPages();
  if (!d.pages.some((p) => p.page === n)) return fail(res, 404, "Page not found.");
  const r = validatePage(req.body || {}, d.pages, langCodes(), n);
  if (r.errors) return fail(res, 400, r.errors[0], { errors: r.errors });
  store.backup("pages");
  const pages = d.pages.filter((p) => p.page !== n);
  pages.push({ ...r.page, updatedAt: new Date().toISOString(), updatedBy: req.admin.name });
  store.write("pages", { updatedAt: new Date().toISOString(), pages: sortPages(pages) });
  log(req.admin, "edited", describe(r.page));
  ok(res, { page: r.page });
});
app.delete("/v1/admin/pages/:n", auth, (req, res) => {
  const n = Number(req.params.n);
  const d = getPages();
  const p = d.pages.find((x) => x.page === n);
  if (!p) return fail(res, 404, "Page not found.");
  store.backup("pages");
  store.write("pages", { updatedAt: new Date().toISOString(), pages: d.pages.filter((x) => x.page !== n) });
  log(req.admin, "deleted", describe(p));
  ok(res, {});
});

/* ---------- admin: audio upload ---------- */
const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(UPLOAD_DIR, "audio"),
    filename: (req, f, cb) => {
      const ext = (path.extname(f.originalname) || ".mp3").toLowerCase();
      const tag = String(req.query.tag || "audio").replace(/[^a-z0-9_-]/gi, "");
      cb(null, `${tag}-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, f, cb) => cb(null, /\.(mp3|m4a|ogg|wav|aac)$/i.test(f.originalname)),
});
app.post("/v1/admin/upload", auth, upload.single("file"), (req, res) => {
  if (!req.file) return fail(res, 400, "Choose an audio file (mp3, m4a, ogg, wav, aac — max 25 MB).");
  const base = process.env.PUBLIC_URL || `${req.protocol}://${req.get("host")}`;
  log(req.admin, "uploaded audio", req.file.filename);
  ok(res, { url: `${base}/uploads/audio/${req.file.filename}` });
});

/* ---------- images (reciter photos, home icons, theme pictures) ---------- */
const SLOT = /^(reciter|feature|theme|notif):[a-z0-9-]{1,40}$/;
// everything the visitors' site needs from the admin panel in one small call
app.get("/v1/site", (req, res) => {
  const d = getImages();
  res.set("Cache-Control", "no-cache");
  ok(res, { updatedAt: d.updatedAt, images: d.items, reciters: getSettings().reciters || null,
    tajweed: publicTajweed(), tajweedAudio: getTajweedAudio().items, tajweedLessons: getTajweedLessons().lessons,
    adhan: publicAdhan(), tafsir: getSettings().tafsir || null });
});
app.get("/v1/images", (req, res) => {
  const d = getImages();
  res.set("Cache-Control", "no-cache");
  ok(res, { updatedAt: d.updatedAt, images: d.items });
});
const imageUpload = multer({
  storage: multer.diskStorage({
    destination: path.join(UPLOAD_DIR, "images"),
    filename: (req, f, cb) => {
      const ext = (path.extname(f.originalname) || ".jpg").toLowerCase().replace(".jpeg", ".jpg");
      cb(null, `${String(req.query.slot || "img").replace(/[^a-z0-9-]/gi, "-")}-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, f, cb) => cb(null, /\.(png|jpe?g|webp|gif)$/i.test(f.originalname) && /^image\//.test(f.mimetype)),
});
const removeImageFile = (url) => {
  const m = /\/uploads\/images\/([A-Za-z0-9._-]+)$/.exec(url || "");
  if (m) fs.unlink(path.join(UPLOAD_DIR, "images", m[1]), () => {});
};
app.post("/v1/admin/images", auth, (req, res, next) => {
  if (!SLOT.test(String(req.query.slot || ""))) return fail(res, 400, "Unknown picture slot.");
  next();
}, imageUpload.single("file"), (req, res) => {
  if (!req.file) return fail(res, 400, "Choose a picture (png, jpg, webp or gif — max 3 MB).");
  const slot = String(req.query.slot);
  const base = process.env.PUBLIC_URL || `${req.protocol}://${req.get("host")}`;
  const d = getImages();
  removeImageFile(d.items[slot]);
  const url = `${base}/uploads/images/${req.file.filename}`;
  store.write("images", { updatedAt: new Date().toISOString(), items: { ...d.items, [slot]: url } });
  log(req.admin, "uploaded picture", slot);
  ok(res, { slot, url });
});
app.delete("/v1/admin/images", auth, (req, res) => {
  const slot = String(req.query.slot || "");
  const d = getImages();
  if (!d.items[slot]) return fail(res, 404, "No picture for this slot.");
  removeImageFile(d.items[slot]);
  const items = { ...d.items };
  delete items[slot];
  store.write("images", { updatedAt: new Date().toISOString(), items });
  log(req.admin, "removed picture", slot);
  ok(res, {});
});

/* ---------- Learn Tajweed: access (free / limited), premium plans, recordings, premium codes ---------- */
const TAJ_DEFAULT = {
  mode: "limited", freeCount: 6,
  plans: [
    { id: "weekly", name: "Weekly", price: "BDT 290", note: "" },
    { id: "yearly", name: "Yearly", price: "BDT 4,200", note: "Best value" },
    { id: "lifetime", name: "Lifetime", price: "BDT 7,000", note: "Pay once, access forever" },
  ],
  payInfo: "",
};
const getTajweed = () => ({ ...TAJ_DEFAULT, lessonAccess: {}, ...(getSettings().tajweed || {}) });
const publicTajweed = () => { const t = getTajweed(); return { mode: t.mode, freeCount: t.freeCount, lessonAccess: t.lessonAccess || {}, plans: t.plans, payInfo: t.payInfo }; };
// lessons edited in the admin panel (title, items, new lessons): { lessons: { [n]: lesson } } — replaces the built-in lesson n
const getTajweedLessons = () => store.read("tajweedLessons", () => ({ lessons: {} }));
const getTajweedAudio = () => store.read("tajweedAudio", () => ({ items: {} }));
const getCodes = () => store.read("premiumCodes", []);
const PREMIUM_SECRET = () => JWT_SECRET + ":premium";

const tajAudioUpload = multer({
  storage: multer.diskStorage({
    destination: path.join(UPLOAD_DIR, "audio"),
    filename: (req, f, cb) => cb(null, `tajweed-${String(req.query.item || "x").replace(/[^0-9-]/g, "")}-${Date.now()}${(path.extname(f.originalname) || ".mp3").toLowerCase()}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, f, cb) => cb(null, /\.(mp3|m4a|ogg|wav|aac|webm)$/i.test(f.originalname) && /^(audio|video)\//.test(f.mimetype)),
});
const removeAudioFile = (url) => {
  const m = /\/uploads\/audio\/([A-Za-z0-9._-]+)$/.exec(url || "");
  if (m) fs.unlink(path.join(UPLOAD_DIR, "audio", m[1]), () => {});
};
app.post("/v1/admin/tajweed/audio", auth, (req, res, next) => {
  if (!/^\d{1,3}-\d{1,4}$/.test(String(req.query.item || ""))) return fail(res, 400, "Unknown lesson item.");
  next();
}, tajAudioUpload.single("file"), (req, res) => {
  if (!req.file) return fail(res, 400, "Choose an audio file (mp3, m4a, ogg, wav, aac, webm — max 10 MB).");
  const item = String(req.query.item);
  const base = process.env.PUBLIC_URL || `${req.protocol}://${req.get("host")}`;
  const d = getTajweedAudio();
  removeAudioFile(d.items[item]);
  const url = `${base}/uploads/audio/${req.file.filename}`;
  store.write("tajweedAudio", { items: { ...d.items, [item]: url } });
  log(req.admin, "uploaded tajweed audio", item);
  ok(res, { item, url });
});
app.delete("/v1/admin/tajweed/audio", auth, (req, res) => {
  const item = String(req.query.item || "");
  const d = getTajweedAudio();
  if (!d.items[item]) return fail(res, 404, "No recording for this item.");
  removeAudioFile(d.items[item]);
  const items = { ...d.items }; delete items[item];
  store.write("tajweedAudio", { items });
  log(req.admin, "removed tajweed audio", item);
  ok(res, {});
});
app.get("/v1/admin/tajweed", auth, (req, res) => ok(res, { tajweed: getTajweed(), audio: getTajweedAudio().items }));
app.put("/v1/admin/tajweed", auth, (req, res) => {
  const b = req.body || {};
  const cur = getTajweed();
  const plans = Array.isArray(b.plans) ? b.plans.slice(0, 6).map((p, i) => ({
    id: String(p.id || `plan${i + 1}`).replace(/[^a-z0-9-]/gi, "").slice(0, 20) || `plan${i + 1}`,
    name: String(p.name || "").trim().slice(0, 30), price: String(p.price || "").trim().slice(0, 30), note: String(p.note || "").trim().slice(0, 60),
  })).filter((p) => p.name) : cur.plans;
  // per lesson: "free" (all items open), "premium" (all items locked), "limited" (first freeCount items open)
  const lessonAccess = {};
  const la = b.lessonAccess && typeof b.lessonAccess === "object" ? b.lessonAccess : (cur.lessonAccess || {});
  Object.entries(la).slice(0, 200).forEach(([n, v]) => {
    if (/^\d{1,3}$/.test(n) && ["free", "premium", "limited"].includes(v)) lessonAccess[n] = v;
  });
  const t = {
    mode: b.mode === "free" ? "free" : "limited",
    freeCount: Math.max(0, Math.min(200, parseInt(b.freeCount ?? cur.freeCount, 10) || 0)),
    lessonAccess,
    plans,
    payInfo: String(b.payInfo ?? cur.payInfo).slice(0, 2000),
  };
  store.write("settings", { ...getSettings(), tajweed: t });
  const counts = Object.values(lessonAccess).reduce((m, v) => ({ ...m, [v]: (m[v] || 0) + 1 }), {});
  log(req.admin, "updated Learn Tajweed access", t.mode === "free" ? "free for everyone"
    : `per lesson — free: ${counts.free || 0}, premium: ${counts.premium || 0}, others limited to ${t.freeCount} items`);
  ok(res, { tajweed: t });
});

/* ---------- Learn Tajweed: edit lessons (title, items, spellings) and add new lessons ---------- */
const cleanLesson = (n, b) => {
  const items = (Array.isArray(b.items) ? b.items : []).slice(0, 300).map((x) => ({
    id: /^\d{1,3}-\d{1,4}$/.test(String(x.id || "")) && String(x.id).startsWith(`${n}-`) ? String(x.id) : null,
    t: String(x.t || "").trim().slice(0, 120),
    sp: String(x.sp || "").trim().slice(0, 120),
    ...(x.audio && /^[A-Za-z0-9/_.-]{1,200}$/.test(String(x.audio)) ? { audio: String(x.audio) } : {}),
    ...(x.kind === "letter" ? { kind: "letter" } : {}),
    ...(x.letter ? { letter: String(x.letter).slice(0, 4) } : {}),
    ...(["fatha", "kasra", "damma", "fathatan", "kasratan", "dammatan"].includes(x.v) ? { v: x.v } : {}),
    ...(x.wide ? { wide: true } : {}),
  })).filter((x) => x.t);
  let next = items.reduce((m, x) => Math.max(m, x.id ? +x.id.split("-")[1] : 0), 0);
  const seen = new Set();
  items.forEach((x) => { if (!x.id || seen.has(x.id)) x.id = `${n}-${++next}`; seen.add(x.id); });
  return {
    n, title: String(b.title || "").trim().slice(0, 120) || `Lesson ${n}`, en: String(b.en || "").trim().slice(0, 120),
    ...(b.cols === 3 ? { cols: 3 } : {}), items,
  };
};
app.get("/v1/admin/tajweed/lessons", auth, (req, res) => ok(res, { lessons: getTajweedLessons().lessons }));
app.put("/v1/admin/tajweed/lessons/:n", auth, (req, res) => {
  const n = parseInt(req.params.n, 10);
  if (!(n >= 1 && n <= 200)) return fail(res, 400, "Lesson number must be 1–200.");
  const lesson = cleanLesson(n, req.body || {});
  if (!lesson.items.length) return fail(res, 400, "A lesson needs at least one item.");
  const d = getTajweedLessons();
  store.write("tajweedLessons", { lessons: { ...d.lessons, [n]: lesson } });
  log(req.admin, "edited Learn Tajweed lesson", `${n}. ${lesson.title}`);
  ok(res, { lesson });
});
app.delete("/v1/admin/tajweed/lessons/:n", auth, (req, res) => {
  const d = getTajweedLessons();
  const n = String(parseInt(req.params.n, 10));
  if (!d.lessons[n]) return fail(res, 404, "This lesson has no changes.");
  const lessons = { ...d.lessons }; delete lessons[n];
  store.write("tajweedLessons", { lessons });
  log(req.admin, "reset Learn Tajweed lesson", n);
  ok(res, {});
});

/* ---------- Tafsir: which books visitors see, default language and default book per language ---------- */
const TAFSIR_IDS = ["164", "165", "166", "381", "gh-bengali-mokhtasar", "160", "159", "157", "818", "gh-ur-tafsir-as-saadi-urdu", "169", "168", "817", "gh-en-tafsir-al-mukhtasar", "gh-tafsir-al-jalalayn", "16", "gh-ar-tafsir-al-mukhtasar", "gh-ar-tafsir-al-jalalayn", "14", "91", "15", "90", "94", "93", "gh-indonesian-mokhtasar", "gh-id-tafsir-as-saadi", "gh-hindi-mokhtasar", "gh-tr-tafsir-ibne-kathir", "gh-turkish-mokhtasar", "gh-turkish-tafsir-as-saadi-turkish", "gh-persian-mokhtasar", "gh-pashto-mokhtasar", "gh-uzbek-mokhtasar", "gh-azeri-mokhtasar", "gh-kyrgyz-mokhtasar", "gh-uyghur-mokhtasar", "gh-french-mokhtasar", "gh-fulani-mokhtasar", "gh-sq-saadi", "gh-bosnian-mokhtasar", "gh-malayalam-mokhtasar", "gh-tamil-mokhtasar", "gh-assamese-mokhtasar", "170", "gh-russian-mokhtasar", "gh-ru-tafsir-ibne-kahtir", "804", "gh-kurdish-mokhtasar"];
const TAFSIR_LANGS = ["bn", "ur", "en", "ar", "id", "hi", "tr", "fa", "ps", "uz", "az", "ky", "ug", "fr", "ff", "sq", "bs", "ml", "ta", "as", "ru", "ku"];
const getTafsirCfg = () => ({ hidden: [], defaultLang: "bn", defaults: {}, ...(getSettings().tafsir || {}) });
app.get("/v1/admin/tafsir", auth, (req, res) => ok(res, { tafsir: getTafsirCfg() }));
app.put("/v1/admin/tafsir", auth, (req, res) => {
  const b = req.body || {};
  const hidden = Array.isArray(b.hidden) ? [...new Set(b.hidden.map(String).filter((x) => TAFSIR_IDS.includes(x)))] : getTafsirCfg().hidden.map(String);
  const defaults = {};
  Object.entries(b.defaults && typeof b.defaults === "object" ? b.defaults : {}).forEach(([l, id]) => {
    if (TAFSIR_LANGS.includes(l) && TAFSIR_IDS.includes(String(id)) && !hidden.includes(String(id))) defaults[l] = String(id);
  });
  const t = { hidden, defaultLang: TAFSIR_LANGS.includes(b.defaultLang) ? b.defaultLang : "bn", defaults };
  store.write("settings", { ...getSettings(), tafsir: t });
  log(req.admin, "updated tafsir settings", `${TAFSIR_IDS.length - hidden.length} books shown, default ${t.defaultLang}`);
  ok(res, { tafsir: t });
});

/* ---------- Prayer Times: adhan recordings and which adhans need Premium ---------- */
const ADHAN_IDS = ["default", "beep", "mishari", "mishari_full", "madinah", "madinah_full", "makkah", "makkah_full",
  "istanbul", "istanbul_full", "aqsa", "aqsa_full"];
const ADHAN_PREMIUM_DEFAULT = ["makkah_full", "istanbul_full", "aqsa_full"];
const getAdhan = () => store.read("adhan", () => ({ premium: ADHAN_PREMIUM_DEFAULT, audio: {} }));
const publicAdhan = () => { const a = getAdhan(); return { premium: a.premium, audio: a.audio }; };
const adhanUpload = multer({
  storage: multer.diskStorage({
    destination: path.join(UPLOAD_DIR, "audio"),
    filename: (req, f, cb) => cb(null, `adhan-${String(req.query.id || "x").replace(/[^a-z_]/g, "")}-${Date.now()}${(path.extname(f.originalname) || ".mp3").toLowerCase()}`),
  }),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, f, cb) => cb(null, /\.(mp3|m4a|ogg|wav|aac)$/i.test(f.originalname) && /^(audio|video)\//.test(f.mimetype)),
});
app.get("/v1/admin/adhan", auth, (req, res) => ok(res, { adhan: getAdhan() }));
app.put("/v1/admin/adhan", auth, (req, res) => {
  const b = req.body || {};
  const premium = Array.isArray(b.premium) ? [...new Set(b.premium.map(String).filter((x) => ADHAN_IDS.includes(x)))] : getAdhan().premium;
  store.write("adhan", { ...getAdhan(), premium });
  log(req.admin, "updated adhan Premium list", premium.join(", ") || "all free");
  ok(res, { adhan: getAdhan() });
});
app.post("/v1/admin/adhan/audio", auth, (req, res, next) => {
  if (!ADHAN_IDS.includes(String(req.query.id || ""))) return fail(res, 400, "Unknown adhan.");
  next();
}, adhanUpload.single("file"), (req, res) => {
  if (!req.file) return fail(res, 400, "Choose an audio file (mp3, m4a, ogg, wav, aac — max 15 MB).");
  const id = String(req.query.id);
  const base = process.env.PUBLIC_URL || `${req.protocol}://${req.get("host")}`;
  const d = getAdhan();
  removeAudioFile(d.audio[id]);
  const url = `${base}/uploads/audio/${req.file.filename}`;
  store.write("adhan", { ...d, audio: { ...d.audio, [id]: url } });
  log(req.admin, "uploaded adhan", id);
  ok(res, { id, url });
});
app.delete("/v1/admin/adhan/audio", auth, (req, res) => {
  const id = String(req.query.id || "");
  const d = getAdhan();
  if (!d.audio[id]) return fail(res, 404, "This adhan uses the built-in recording.");
  removeAudioFile(d.audio[id]);
  const audio = { ...d.audio }; delete audio[id];
  store.write("adhan", { ...d, audio });
  log(req.admin, "removed uploaded adhan", id);
  ok(res, {});
});

// premium codes: the admin makes a code for a buyer; the buyer types it on the website (Premium page)
const codeOut = (c) => ({ ...c, active: !c.expiresAt || new Date(c.expiresAt) > new Date() });
app.get("/v1/admin/premium/codes", auth, (req, res) => ok(res, { codes: getCodes().map(codeOut) }));
app.post("/v1/admin/premium/codes", auth, (req, res) => {
  const b = req.body || {};
  const count = Math.max(1, Math.min(50, parseInt(b.count, 10) || 1));
  const days = b.days === "" || b.days == null ? 0 : Math.max(0, Math.min(36500, parseInt(b.days, 10) || 0)); // 0 = lifetime
  const plan = String(b.plan || "").trim().slice(0, 30) || (days ? `${days} days` : "Lifetime");
  const note = String(b.note || "").trim().slice(0, 100);
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const mk = () => "NQ-" + Array.from({ length: 8 }, (_, i) => (i === 4 ? "-" : "") + A[crypto.randomInt(A.length)]).join("");
  const list = getCodes();
  const made = [];
  for (let i = 0; i < count; i++) {
    let c; do { c = mk(); } while (list.some((x) => x.code === c));
    const row = { code: c, plan, days, note, createdAt: new Date().toISOString(), by: req.admin.name, device: null, redeemedAt: null, expiresAt: null };
    list.unshift(row); made.push(row);
  }
  store.write("premiumCodes", list.slice(0, 5000));
  log(req.admin, "made premium codes", `${count} × ${plan}`);
  ok(res, { codes: made.map(codeOut) });
});
app.delete("/v1/admin/premium/codes/:code", auth, (req, res) => {
  const list = getCodes();
  if (!list.some((x) => x.code === req.params.code)) return fail(res, 404, "Code not found.");
  store.write("premiumCodes", list.filter((x) => x.code !== req.params.code));
  log(req.admin, "deleted premium code", req.params.code);
  ok(res, {});
});
app.post("/v1/admin/premium/codes/:code/reset", auth, (req, res) => {
  const list = getCodes();
  const c = list.find((x) => x.code === req.params.code);
  if (!c) return fail(res, 404, "Code not found.");
  c.device = null; // the buyer can use it on a new phone; the end date stays
  store.write("premiumCodes", list);
  log(req.admin, "reset premium code device", c.code);
  ok(res, { code: codeOut(c) });
});
const redeemTries = new Map();
app.post("/v1/premium/redeem", (req, res) => {
  const ip = req.ip, now = Date.now();
  const rec = (redeemTries.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  if (rec.length >= 15) return fail(res, 429, "Too many tries. Please wait a few minutes.");
  rec.push(now); redeemTries.set(ip, rec);
  const code = String((req.body || {}).code || "").trim().toUpperCase().replace(/\s+/g, "");
  const device = String((req.body || {}).device || "").slice(0, 64);
  if (!device) return fail(res, 400, "Missing device id.");
  const list = getCodes();
  const c = list.find((x) => x.code === code);
  if (!c) return fail(res, 404, "This code is not valid. Check it and try again.");
  if (c.device && c.device !== device) return fail(res, 409, "This code is already used on another phone. Ask for help to move it.");
  if (!c.redeemedAt) {
    c.redeemedAt = new Date().toISOString();
    c.expiresAt = c.days ? new Date(now + c.days * 86400000).toISOString() : null;
  }
  if (c.expiresAt && new Date(c.expiresAt) <= new Date()) return fail(res, 410, "This code has ended.");
  c.device = device;
  store.write("premiumCodes", list);
  const token = jwt.sign({ code: c.code, device }, PREMIUM_SECRET(), c.expiresAt ? { expiresIn: Math.floor((new Date(c.expiresAt) - now) / 1000) } : {});
  ok(res, { token, plan: c.plan, expiresAt: c.expiresAt });
});
app.get("/v1/premium/status", (req, res) => {
  const h = req.headers.authorization || "";
  try {
    const p = jwt.verify(h.slice(7), PREMIUM_SECRET());
    const c = getCodes().find((x) => x.code === p.code);
    if (!c || c.device !== p.device) return fail(res, 401, "Premium is not active on this phone.");
    if (c.expiresAt && new Date(c.expiresAt) <= new Date()) return fail(res, 410, "Premium has ended.");
    ok(res, { plan: c.plan, expiresAt: c.expiresAt });
  } catch (e) { fail(res, 401, "Premium is not active on this phone."); }
});

/* ---------- notifications (shown on the website's Notifications page) ---------- */
const getNotifs = () => store.read("notifications", []);
const cleanNotif = (b, cur = {}) => {
  const title = String(b.title ?? cur.title ?? "").trim().slice(0, 120);
  const body = String(b.body ?? cur.body ?? "").trim().slice(0, 2000);
  const link = String(b.link ?? cur.link ?? "").trim().slice(0, 500);
  if (!title) return { error: "Enter a title." };
  if (link && !/^(https?:\/\/|\/)/i.test(link)) return { error: "Link must start with http://, https:// or / (a page of the website)." };
  return { title, body, link };
};
app.get("/v1/notifications", (req, res) => {
  res.set("Cache-Control", "no-cache");
  ok(res, { notifications: getNotifs().slice(0, 100) });
});
app.get("/v1/admin/notifications", auth, (req, res) => ok(res, { notifications: getNotifs() }));
app.post("/v1/admin/notifications", auth, (req, res) => {
  const c = cleanNotif(req.body || {});
  if (c.error) return fail(res, 400, c.error);
  const n = { id: `n${Date.now().toString(36)}`, ...c, createdAt: new Date().toISOString(), by: req.admin.name };
  store.write("notifications", [n, ...getNotifs()].slice(0, 300));
  log(req.admin, "added notification", c.title);
  ok(res, { notification: n });
});
app.put("/v1/admin/notifications/:id", auth, (req, res) => {
  const list = getNotifs();
  const cur = list.find((x) => x.id === req.params.id);
  if (!cur) return fail(res, 404, "Notification not found.");
  const c = cleanNotif(req.body || {}, cur);
  if (c.error) return fail(res, 400, c.error);
  const n = { ...cur, ...c, updatedAt: new Date().toISOString() };
  store.write("notifications", list.map((x) => (x.id === n.id ? n : x)));
  log(req.admin, "edited notification", c.title);
  ok(res, { notification: n });
});
app.delete("/v1/admin/notifications/:id", auth, (req, res) => {
  const list = getNotifs();
  const cur = list.find((x) => x.id === req.params.id);
  if (!cur) return fail(res, 404, "Notification not found.");
  store.write("notifications", list.filter((x) => x.id !== cur.id));
  const imgs = getImages();
  const slot = `notif:${cur.id}`;
  if (imgs.items[slot]) {
    removeImageFile(imgs.items[slot]);
    const items = { ...imgs.items }; delete items[slot];
    store.write("images", { updatedAt: new Date().toISOString(), items });
  }
  log(req.admin, "deleted notification", cur.title);
  ok(res, {});
});

/* ---------- admin: settings ---------- */
app.get("/v1/admin/settings", auth, (req, res) => ok(res, { settings: getSettings() }));
app.put("/v1/admin/settings", auth, (req, res) => {
  const b = req.body || {};
  const cur = getSettings();
  const languages = Array.isArray(b.languages)
    ? b.languages.map((l) => ({ code: String(l.code || "").trim().toLowerCase().slice(0, 8), name: String(l.name || "").trim().slice(0, 40) })).filter((l) => /^[a-z-]{2,8}$/.test(l.code) && l.name)
    : cur.languages;
  // reciter list order, hidden reciters and the default reciter for new visitors
  const ID = /^[a-z0-9-]{1,40}$/;
  let reciters = cur.reciters || null;
  if (b.reciters && typeof b.reciters === "object") {
    const order = Array.isArray(b.reciters.order) ? [...new Set(b.reciters.order.map(String).filter((x) => ID.test(x)))].slice(0, 100) : [];
    const hidden = Array.isArray(b.reciters.hidden) ? [...new Set(b.reciters.hidden.map(String).filter((x) => ID.test(x)))].slice(0, 100) : [];
    const def = ID.test(String(b.reciters.default || "")) ? String(b.reciters.default) : order[0] || null;
    if (def && hidden.includes(def)) return fail(res, 400, "The default reciter cannot be hidden.");
    reciters = { order, hidden, default: def };
  }
  const settings = {
    ...cur,
    reciters,
    siteName: String(b.siteName ?? cur.siteName).trim().slice(0, 60) || cur.siteName,
    reciter: String(b.reciter ?? cur.reciter).trim().slice(0, 60) || cur.reciter,
    languages,
  };
  store.write("settings", settings);
  log(req.admin, "updated settings", "");
  ok(res, { settings });
});

/* ---------- admin: admins ---------- */
app.get("/v1/admin/admins", auth, (req, res) => ok(res, { admins: getAdmins().map(publicAdmin) }));
app.post("/v1/admin/admins", auth, ownerOnly, (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (!name) return fail(res, 400, "Enter a name.");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail(res, 400, "Enter a valid email.");
  if (password.length < 8) return fail(res, 400, "Password must be at least 8 characters.");
  const admins = getAdmins();
  if (admins.some((a) => a.email === email)) return fail(res, 400, "This email is already an admin.");
  const a = { id: `a${Date.now()}`, name, email, hash: bcrypt.hashSync(password, 10), role: req.body.role === "owner" ? "owner" : "editor", createdAt: new Date().toISOString() };
  store.write("admins", [...admins, a]);
  log(req.admin, "added admin", email);
  ok(res, { admin: publicAdmin(a) });
});
app.delete("/v1/admin/admins/:id", auth, ownerOnly, (req, res) => {
  if (req.params.id === req.admin.id) return fail(res, 400, "You cannot remove yourself.");
  const admins = getAdmins();
  const a = admins.find((x) => x.id === req.params.id);
  if (!a) return fail(res, 404, "Admin not found.");
  store.write("admins", admins.filter((x) => x.id !== a.id));
  log(req.admin, "removed admin", a.email);
  ok(res, {});
});

/* ---------- admin: backup ---------- */
app.get("/v1/admin/export", auth, (req, res) => {
  res.set("Content-Disposition", `attachment; filename="nurquran-backup-${new Date().toISOString().slice(0, 10)}.json"`);
  res.json({ exportedAt: new Date().toISOString(), ...getPages(), settings: getSettings(), tajweedLessons: getTajweedLessons(), adhan: getAdhan() });
});
app.post("/v1/admin/import", auth, ownerOnly, (req, res) => {
  const incoming = req.body && Array.isArray(req.body.pages) ? req.body.pages : null;
  if (!incoming) return fail(res, 400, "This file is not a NurQuran backup.");
  const clean = [];
  for (const p of incoming) {
    const r = validatePage(p, clean, langCodes(), null);
    if (r.errors) return fail(res, 400, `Page ${p.page}: ${r.errors[0]}`, { errors: r.errors });
    clean.push({ ...r.page, updatedAt: p.updatedAt || new Date().toISOString(), updatedBy: p.updatedBy || req.admin.name });
  }
  store.backup("pages");
  store.write("pages", { updatedAt: new Date().toISOString(), pages: sortPages(clean) });
  // lessons edited in the admin panel and the adhan Premium list come back too (uploaded files stay where they are)
  const tl = req.body.tajweedLessons;
  if (tl && tl.lessons && typeof tl.lessons === "object") {
    const lessons = {};
    Object.entries(tl.lessons).slice(0, 200).forEach(([n, l]) => { const k = parseInt(n, 10); if (k >= 1 && k <= 200 && l) lessons[k] = cleanLesson(k, l); });
    store.write("tajweedLessons", { lessons });
  }
  if (req.body.adhan && Array.isArray(req.body.adhan.premium)) {
    store.write("adhan", { ...getAdhan(), premium: req.body.adhan.premium.map(String).filter((x) => ADHAN_IDS.includes(x)) });
  }
  log(req.admin, "imported backup", `${clean.length} pages`);
  ok(res, { pages: clean.length });
});
app.get("/v1/admin/log", auth, (req, res) => ok(res, { log: getLog() }));

/* ---------- errors ---------- */
app.use((req, res) => fail(res, 404, "Not found."));
app.use((err, req, res, next) => {
  console.error(err);
  if (err && err.code === "LIMIT_FILE_SIZE") return fail(res, 400, req.path.includes("/images") ? "Picture is too large (max 3 MB)." : "File is too large (max 25 MB).");
  fail(res, 500, "Server error. Please try again.");
});

app.listen(PORT, () => console.log(`NurQuran API on port ${PORT}`));
