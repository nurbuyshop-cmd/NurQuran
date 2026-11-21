// Builds a single self-contained HTML file of the site for quick previews: preview/dist/index.html
import { build } from "esbuild";
import { writeFileSync, mkdirSync, cpSync, readFileSync } from "fs";
import path from "path";

const root = path.resolve(".");
const r = await build({
  entryPoints: ["preview/entry.jsx"],
  bundle: true, minify: true, write: false, format: "iife", jsx: "automatic",
  outdir: "preview/dist", external: ["/fonts/*"], loader: { ".js": "jsx" },
  define: { "process.env.NODE_ENV": '"production"', "process.env.NEXT_PUBLIC_QURAN_BASE": '""', "process.env.NEXT_PUBLIC_API_URL": '""' },
  alias: {
    "next/link": path.join(root, "preview/next-link.jsx"),
    "next/navigation": path.join(root, "preview/next-navigation.js"),
    "@": root,
  },
});
const js = r.outputFiles.find((f) => f.path.endsWith(".js")).text;
let css = r.outputFiles.filter((f) => f.path.endsWith(".css")).map((f) => f.text).join("\n");
const imports = [...css.matchAll(/@import\s+url\([^)]*\);?/g)].map((m) => m[0]);
css = css.replace(/@import\s+url\([^)]*\);?/g, "");
// Bangla font inline, so the single-file preview shows Tiro Bangla too
css = css.replace(/url\(['"]?\/fonts\/(tiro-bangla[^'")]+\.woff2)['"]?\)/g, (m, f) => `url(data:font/woff2;base64,${readFileSync(path.join("public/fonts", f)).toString("base64")})`);
const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Quran — Preview</title>
<style>${imports.join("\n")}\n${css}</style></head>
<body><div id="root"></div><script>window.__DATA_BASE__="data/";</script><script>${js.replace(/<\/script/g, "<\\/script")}</script></body></html>`;
mkdirSync("preview/dist", { recursive: true });
writeFileSync("preview/dist/index.html", html);
cpSync("public/data", "preview/dist/data", { recursive: true });
console.log("preview/dist/index.html", (html.length / 1024).toFixed(0) + " KB");
