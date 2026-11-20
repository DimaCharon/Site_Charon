import { copy as w, coverUrl, projects, statusLabel } from "./site";
import { assetUrl, pageHref } from "./routes";
export type WorkReference = {
  id: string;
  title: string;
  description: string;
  category: string;
  image: string;
  alt: string;
  href: string;
  credit: string;
  projectId?: string;
  fit?: "contain" | "cover";
  position?: string;
};
// Use only published work with actual material, never invent customer projects or screenshots.
export function referenceIndex(): WorkReference[] {
  const items: WorkReference[] = projects
    .filter((p) => p.cover || p.offer.demo !== "none")
    .map((p) => {
      const lab = p.offer.demo === "lab";
      return {
        id: "work-" + p.id,
        title: lab ? w["lab.title"] : p.name,
        description: lab ? w["refs.labNote"] : p.short || p.offer.result,
        category: lab ? w["refs.labType"] : p.category || w["refs.projectType"],
        image: coverUrl(p.cover),
        alt: p.cover?.alt || p.name,
        href: lab ? pageHref("lab") : pageHref("products/" + p.id),
        credit: p.name + " · " + statusLabel(p.status),
        projectId: p.id,
        fit: p.cover?.fit,
        position: p.cover ? `${p.cover.x}% ${p.cover.y}%` : undefined,
      };
    });
  items.push(
    {
      id: "identity-object",
      title: w["refs.identityTitle"],
      description: w["refs.identityNote"],
      category: w["refs.identityType"],
      image: assetUrl("references/identity.webp"),
      alt: w["refs.identityAlt"],
      href: pageHref("", "home"),
      credit: w["store.specimen"],
    },
    {
      id: "orbit-atlas",
      title: w["refs.atlasTitle"],
      description: w["refs.atlasNote"],
      category: w["refs.atlasType"],
      image: assetUrl("references/atlas.webp"),
      alt: w["refs.atlasAlt"],
      href: pageHref("journal", "world"),
      credit: w["world.text07"],
    },
  );
  return items;
}
