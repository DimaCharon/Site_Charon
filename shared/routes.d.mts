import type { Content } from "./content-schema.mjs";
import type { Profile } from "./profile-schema.mjs";
export const publicOrigin: string;
export const fixedPages: string[];
export function publishedPaths(c: Content): string[];
export function pageMeta(
  path: string,
  c: Content,
  profile: Profile,
): {
  title: string;
  description: string;
  socialTitle: string;
  socialDescription: string;
};
