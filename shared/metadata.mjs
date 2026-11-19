const escape = (v) =>
  v.replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        ch
      ],
  );
export function publishMetadata(html, copy) {
  return html
    .replace(
      /<title>[\s\S]*?<\/title>/i,
      () => "<title>" + escape(copy["seo.title"]) + "</title>",
    )
    .replace(/<meta\b[^>]+>/g, (tag) => {
      const k = tag.includes('name="description"')
        ? "seo.description"
        : tag.includes('property="og:title"')
          ? "seo.socialTitle"
          : tag.includes('property="og:description"')
            ? "seo.socialDescription"
            : null;
      return k
        ? tag.replace(
            /content="[^"]*"/,
            () => 'content="' + escape(copy[k]) + '"',
          )
        : tag;
    })
    .replace(
      /<noscript\b[^>]*>[\s\S]*?<\/noscript\s*>/i,
      () => "<noscript>" + escape(copy["seo.noscript"]) + "</noscript>",
    );
}
