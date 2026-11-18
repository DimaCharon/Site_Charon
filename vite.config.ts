import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { existsSync } from "node:fs";
export default defineConfig({
  plugins: [react()],
  base: "./",
  define: {
    __HAS_MASCOT__: JSON.stringify(existsSync("public/models/charon.glb")),
  },
  server: { host: "0.0.0.0", allowedHosts: true, port: 5173 },
  preview: { host: "0.0.0.0", allowedHosts: true, port: 4173 },
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
