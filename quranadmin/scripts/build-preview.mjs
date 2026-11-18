// Single-file preview of the admin panel using the in-browser demo API: preview/dist/index.html
import { build } from "esbuild";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";
const root = path.resolve(".");
const r = await build({
  entryPoints: ["preview/entry.jsx"], bundle: true, minify: true, write: false, format: "iife", jsx: "automatic",
  outdir: "preview/dist", loader: { ".js": "jsx" }, external: ["/fonts/*"],
  define: { "process.env.NODE_ENV": '"production"', "process.env.NEXT_PUBLIC_API_URL": '""', "process.env.NEXT_PUBLIC_SITE_URL": '"https://nurquran.toptol.site"' },
  alias: { "next/link": path.join(root, "preview/link.jsx"), "next/navigation": path.join(root, "preview/router.js"), "@": root },
});
const js = r.outputFiles.find((f) => f.path.endsWith(".js")).text;
let css = r.outputFiles.filter((f) => f.path.endsWith(".css")).map((f) => f.text).join("\n");
const imports = [...css.matchAll(/@import\s+url\([^)]*\);?/g)].map((m) => m[0]);
css = css.replace(/@import\s+url\([^)]*\);?/g, "");
const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Nur Quran Admin — Preview</title><style>${imports.join("\n")}\n${css}</style></head><body><div id="root"></div><script>${js.replace(/<\/script/g, "<\\/script")}</script></body></html>`;
mkdirSync("preview/dist", { recursive: true });
writeFileSync("preview/dist/index.html", html);
console.log("preview/dist/index.html", (html.length / 1024).toFixed(0) + " KB");
