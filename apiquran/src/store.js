// Tiny JSON-file database. Every collection lives in its own file under storage/,
// written atomically (temp file + rename) so a crash never leaves a half-written file.
const fs = require("fs");
const path = require("path");

const DIR = process.env.STORAGE_DIR || path.join(__dirname, "..", "storage");
fs.mkdirSync(DIR, { recursive: true });
const cache = {};

function file(name) {
  return path.join(DIR, `${name}.json`);
}

function read(name, fallback) {
  if (cache[name] !== undefined) return cache[name];
  try {
    cache[name] = JSON.parse(fs.readFileSync(file(name), "utf8"));
  } catch (e) {
    cache[name] = typeof fallback === "function" ? fallback() : fallback;
    if (cache[name] !== undefined) write(name, cache[name]);
  }
  return cache[name];
}

function write(name, data) {
  cache[name] = data;
  const tmp = `${file(name)}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 1));
  fs.renameSync(tmp, file(name));
  return data;
}

// keep a dated copy of the Quran content before every change (last 30 kept)
function backup(name) {
  try {
    const bdir = path.join(DIR, "backups");
    fs.mkdirSync(bdir, { recursive: true });
    const src = file(name);
    if (!fs.existsSync(src)) return;
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    fs.copyFileSync(src, path.join(bdir, `${name}-${stamp}.json`));
    const all = fs.readdirSync(bdir).filter((f) => f.startsWith(name + "-")).sort();
    all.slice(0, Math.max(0, all.length - 30)).forEach((f) => fs.unlinkSync(path.join(bdir, f)));
  } catch (e) {
    console.error("backup failed", e.message);
  }
}

module.exports = { read, write, backup, DIR };
