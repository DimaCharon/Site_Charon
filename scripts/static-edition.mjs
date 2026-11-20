import { build } from "esbuild";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { publicOrigin, publishedPaths, pageMeta } from "../shared/routes.mjs";
import { publishMetadata } from "../shared/metadata.mjs";
const esc = (s) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function staticEdition(doc, define) {
  return {
    name: "charon-static-edition",
    apply: "build",
    enforce: "post",
    async generateBundle(_options, bundle) {
      const root = bundle["index.html"];
      if (!root || root.type !== "asset") throw Error("No index template");
      const template = String(root.source);
      await mkdir(".cache", { recursive: true });
      const tmp = await mkdtemp(resolve(".cache/ssg-"));
      try {
        const output = join(tmp, "render.mjs");
        await build({
          entryPoints: ["src/prerender.tsx"],
          outfile: output,
          bundle: true,
          format: "esm",
          platform: "node",
          target: "node20",
          packages: "external",
          define,
          jsx: "automatic",
          loader: { ".css": "empty" },
          logLevel: "silent",
        });
        const { renderPath } = await import(pathToFileURL(output).href);
        const entries = publishedPaths(doc.content);
        if (new Set(entries).size !== entries.length)
          throw Error("Duplicate URL");
        for (const path of entries) {
          const depth = path ? path.split("/").length : 0,
            base = depth ? "../".repeat(depth) : "./",
            m = pageMeta(path, doc.content, doc.profile),
            url = publicOrigin + (path ? path + "/" : "");
          let html = publishMetadata(template, {
            ...doc.content.copy,
            "seo.title": m.title,
            "seo.description": m.description,
            "seo.socialTitle": m.socialTitle,
            "seo.socialDescription": m.socialDescription,
          });
          const photo =
            path.startsWith("products/") &&
            doc.content.projects.find((p) => "products/" + p.id === path)
              ?.cover;
          html = html
            .replace(/\b(src|href)="\.\//g, (_, attr) => attr + '="' + base)
            .replace("<html ", () => `<html data-route="${esc(path)}" `)
            .replace(
              "</head>",
              () =>
                `<link rel="canonical" href="${esc(url)}"><meta property="og:url" content="${esc(url)}"><meta property="og:image" content="${esc(publicOrigin + (photo ? "media/" + photo.hash + ".jpg" : "art/identity.webp"))}"></head>`,
            );
          if (path)
            html = html.replace(
              /<link\s+[^>]*rel="preload"[^>]*as="image"[^>]*>/g,
              "",
            );
          const markup = renderPath(path);
          if (!markup.includes("<h1") || !markup.includes("<main"))
            throw Error("Missing primary content: " + path);
          html = html.replace(
            '<div id="root"></div>',
            () => `<div id="root">${markup}</div>`,
          );
          if (path)
            this.emitFile({
              type: "asset",
              fileName: path + "/index.html",
              source: html,
            });
          else root.source = html;
        }
        this.emitFile({
          type: "asset",
          fileName: "sitemap.xml",
          source:
            '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
            entries
              .map(
                (path) =>
                  "<url><loc>" +
                  esc(publicOrigin + (path ? path + "/" : "")) +
                  "</loc></url>",
              )
              .join("") +
            "</urlset>\n",
        });
        const w = doc.content.copy;
        this.emitFile({
          type: "asset",
          fileName: "404.html",
          source: `<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>404 — ${esc(w["store.missing"])}</title><style>body{margin:12vh 8vw;background:#141518;color:#eeeef1;font:18px/1.6 system-ui}small{letter-spacing:.15em;color:#c4b5d9}h1{font-size:clamp(34px,6vw,86px)}a{color:#cebfed}</style><main><small>${esc(w["nav.brand"])} / 404</small><h1>${esc(w["store.missing"])}</h1><a href="${publicOrigin}products/">${esc(w["store.toProducts"])} →</a></main></html>`,
        });
        console.log(
          "Static storefront:",
          entries.length,
          "searchable HTML pages.",
        );
      } finally {
        await rm(tmp, { recursive: true, force: true });
      }
    },
  };
}
