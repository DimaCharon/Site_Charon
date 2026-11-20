/** Build a portable, completely offline edition of the same interactive site. */
import { build } from "vite";
import { createHash } from "node:crypto";
import react from "@vitejs/plugin-react";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";

import { loadPublished } from "./published-data.mjs";
import { publishMetadata } from "../shared/metadata.mjs";
const { profile, content, media: inlineMedia } = loadPublished("public", true);
const hasMascot = existsSync("public/models/charon.glb");
const embedded = {};
for (const [name, mime] of [
  ["references/identity.webp", "image/webp"],
  ["references/atlas.webp", "image/webp"],
  ["art/identity.webp", "image/webp"],
  ["art/studio-lut.png", "image/png"],
  ["art/brushed.webp", "image/webp"],
  ...(hasMascot ? [["models/charon.glb", "model/gltf-binary"]] : []),
])
  embedded[name] =
    "data:" +
    mime +
    ";base64," +
    (await readFile("public/" + name)).toString("base64");
const result = await build({
  configFile: false,
  plugins: [react()],
  base: "./",
  define: {
    __CHARON_OFFLINE__: "true",
    __CHARON_CONTACT_ENDPOINT__: JSON.stringify(""),
    __CHARON_ASSETS__: JSON.stringify(embedded),
    __CHARON_CONTENT__: JSON.stringify(content),
    __CHARON_MEDIA__: JSON.stringify(inlineMedia),
    __HAS_MASCOT__: JSON.stringify(hasMascot),
    __CHARON_PROFILE__: JSON.stringify(profile),
  },
  build: {
    write: false,
    modulePreload: false,
    cssCodeSplit: false,
    target: "es2020",
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
const files = (Array.isArray(result) ? result[0] : result).output;
const uri = async (path, mime) =>
  `data:${mime};base64,${(await readFile(path)).toString("base64")}`;
let js = files.find((f) => f.type === "chunk" && f.isEntry).code;
let css = String(files.find((f) => f.fileName.endsWith(".css")).source);
let html = String(files.find((f) => f.fileName === "index.html").source);
for (const name of ["manrope-cyrillic.woff2", "manrope-latin.woff2"]) {
  const font = await uri("public/fonts/" + name, "font/woff2");
  css = css
    .replaceAll("../fonts/" + name, font)
    .replaceAll("./fonts/" + name, font);
}
const script = js.replace(/<\/script/gi, "<\\/script");
const hash = createHash("sha256").update(script).digest("base64");
const policy = `default-src 'none'; script-src 'sha256-${hash}'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src data: blob:; worker-src blob:; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'`;
html = publishMetadata(html, content.copy)
  .replace(
    "<head>",
    () =>
      `<head><meta http-equiv="Content-Security-Policy" content="${policy}">`,
  )
  .replace(/<script[^>]+src="[^"]+"[^>]*><\/script>/g, "")
  .replace(/<link[^>]+rel="(?:stylesheet|preload|modulepreload)"[^>]*>/g, "")
  .replace("./favicon.svg", await uri("public/favicon.svg", "image/svg+xml"))
  .replace("</head>", () => `<style>${css}</style></head>`)
  .replace("</body>", () => `<script type="module">${script}</script></body>`);
await mkdir("out", { recursive: true });
await writeFile("out/Charon.html", html);
console.log(
  `Offline edition: out/Charon.html (${Math.round(Buffer.byteLength(html) / 1024)} KiB), no CDN or server required.`,
);
