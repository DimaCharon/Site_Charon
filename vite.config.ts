import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { existsSync } from "node:fs";
import { loadPublished } from "./scripts/published-data.mjs";
import { publishMetadata } from "./shared/metadata.mjs";
const { content, profile } = loadPublished();
const rules =
  "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' data: blob:; worker-src 'self' blob:; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'";
export default defineConfig({
  plugins: [
    react(),
    {
      name: "charon-content-metadata",
      transformIndexHtml: (html) => publishMetadata(html, content.copy),
    },
    {
      name: "charon-static-policy",
      apply: "build",
      transformIndexHtml() {
        return [
          {
            tag: "meta",
            attrs: { "http-equiv": "Content-Security-Policy", content: rules },
            injectTo: "head-prepend" as const,
          },
        ];
      },
    },
  ],
  base: "./",
  define: {
    __CHARON_CONTENT__: JSON.stringify(content),
    __CHARON_MEDIA__: JSON.stringify({}),
    __HAS_MASCOT__: JSON.stringify(existsSync("public/models/charon.glb")),
    __CHARON_PROFILE__: JSON.stringify(profile),
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: [".e2b.app"],
    cors: false,
    fs: { strict: true },
    port: 5173,
  },
  preview: { host: "0.0.0.0", allowedHosts: [".e2b.app"], port: 4173 },
  build: {
    target: "es2020",
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/node_modules/three/build/three.core"))
            return "geometry";
          if (id.includes("/node_modules/three/")) return "webgl";
        },
      },
    },
  },
});
