export const publicOrigin = "https://dimacharon.github.io/Site_Charon/";
export const fixedPages = ["products", "lab", "journal", "guide", "updates"];
export function publishedPaths(c) {
  return [
    "",
    ...fixedPages,
    ...c.projects.map((p) => "products/" + p.id),
    ...c.interests.map((n) => "journal/" + n.kind),
  ];
}
export function pageMeta(path, c, profile) {
  const w = c.copy;
  let name = "",
    summary = "";
  const [section, slug] = path.split("/");
  if (!path)
    return {
      title: w["seo.title"],
      description: w["seo.description"],
      socialTitle: w["seo.socialTitle"],
      socialDescription: w["seo.socialDescription"],
    };
  if (section === "products" && slug) {
    const p = c.projects.find((p) => p.id === slug);
    if (p) {
      name = p.name;
      summary = p.short || p.description;
    }
  } else if (section === "journal" && slug) {
    const n = c.interests.find((n) => n.kind === slug);
    if (n) {
      name = n.title;
      summary = n.question || n.note;
    }
  } else {
    const item = {
      products: ["store.catalog", "store.catalogIntro"],
      lab: ["lab.title", "lab.intro"],
      journal: ["library.notes", "library.notesIntro"],
      guide: ["library.guide", "library.guideIntro"],
      updates: ["library.updates", "library.updatesIntro"],
    }[section];
    if (item) {
      name = w[item[0]];
      summary = w[item[1]];
    }
  }
  const title =
      (name || w["store.missing"]) +
      " — " +
      (name === profile.name ? w["store.catalog"] : profile.name),
    description = (summary || w["seo.description"]).slice(0, 420);
  return {
    title,
    description,
    socialTitle: title,
    socialDescription: description,
  };
}
