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

/* ---------- admin: settings ---------- */
app.get("/v1/admin/settings", auth, (req, res) => ok(res, { settings: getSettings() }));
app.put("/v1/admin/settings", auth, (req, res) => {
  const b = req.body || {};
  const cur = getSettings();
  const languages = Array.isArray(b.languages)
    ? b.languages.map((l) => ({ code: String(l.code || "").trim().toLowerCase().slice(0, 8), name: String(l.name || "").trim().slice(0, 40) })).filter((l) => /^[a-z-]{2,8}$/.test(l.code) && l.name)
    : cur.languages;
  const settings = {
    ...cur,
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
  res.json({ exportedAt: new Date().toISOString(), ...getPages(), settings: getSettings() });
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
  log(req.admin, "imported backup", `${clean.length} pages`);
  ok(res, { pages: clean.length });
});
app.get("/v1/admin/log", auth, (req, res) => ok(res, { log: getLog() }));

/* ---------- errors ---------- */
app.use((req, res) => fail(res, 404, "Not found."));
app.use((err, req, res, next) => {
  console.error(err);
  if (err && err.code === "LIMIT_FILE_SIZE") return fail(res, 400, "File is too large (max 25 MB).");
  fail(res, 500, "Server error. Please try again.");
});

app.listen(PORT, () => console.log(`NurQuran API on port ${PORT}`));
