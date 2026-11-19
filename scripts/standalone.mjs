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
const result = await build({
  configFile: false,
  plugins: [react()],
  base: "./",
  define: {
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
const poster = await uri("public/art/identity.webp", "image/webp");
js =
  "const __charonPoster=" +
  JSON.stringify(poster) +
  ";\n" +
  js.replaceAll('"./art/identity.webp"', "__charonPoster");
for (const [name, mime] of [
  ["studio-lut.png", "image/png"],
  ["brushed.webp", "image/webp"],
]) {
  js = js.replaceAll(
    JSON.stringify("./art/" + name),
    JSON.stringify(await uri("public/art/" + name, mime)),
  );
}
if (hasMascot)
  js = js.replaceAll(
    '"./models/charon.glb"',
    JSON.stringify(await uri("public/models/charon.glb", "model/gltf-binary")),
  );
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
