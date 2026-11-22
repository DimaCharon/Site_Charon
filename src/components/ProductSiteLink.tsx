import { ArrowUpRight } from "lucide-react";
import { httpsLink } from "../../shared/offer.mjs";
import { copy, type Project } from "../config/site";

// This also renders in the editor, where the owner may still be typing the URL.
export function ProductSiteLink({
  p,
  words = copy,
  prominent = false,
}: {
  p: Project;
  words?: Record<string, string>;
  prominent?: boolean;
}) {
  const href = httpsLink(p.offer.siteUrl?.trim());
  if (!href) return null;
  return (
    <a
      className={"product-site-link" + (prominent ? " featured-site" : "")}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={new URL(href).hostname}
    >
      {words["store.site"]}
      <span className="sr-only"> — {p.name}</span>
      <ArrowUpRight aria-hidden="true" size={15} />
    </a>
  );
}
