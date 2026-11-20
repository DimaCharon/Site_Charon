import { assetUrl } from "./routes";
import type { Content, Cover, Project } from "../../shared/content-schema.mjs";
export type {
  Field,
  Art,
  Cover,
  Theme,
  Direction,
  Project,
  Interest,
  World,
  Content,
  SiteDocument,
} from "../../shared/content-schema.mjs";
// A validated, baked snapshot. Only an authorized publication can replace it.
export const publishedContent: Content = __CHARON_CONTENT__;
export const { copy, projects, worlds, directions, interests } =
  publishedContent;
export const navigation = [
  "home",
  "projects",
  "about",
  "interests",
  "contacts",
].map((id) => ({ id, label: copy["nav." + id] }));
export function coverUrl(cover: Cover | null) {
  return !cover
    ? ""
    : __CHARON_MEDIA__[cover.hash] || assetUrl(`media/${cover.hash}.jpg`);
}
export function statusLabel(s: Project["status"], words = copy) {
  return words[
    s === "Активный проект"
      ? "projects.active"
      : s === "Концепция"
        ? "projects.concept"
        : "projects.working"
  ];
}
