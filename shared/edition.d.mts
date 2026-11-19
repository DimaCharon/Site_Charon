import type { SiteDocument, Content, Project } from "./content-schema.mjs";
export type EditionPatch = Partial<
  Pick<Content, "copy" | "directions" | "worlds" | "interests">
> & {
  profile?: SiteDocument["profile"];
  projects?: { order: string[]; updates: Project[] };
};
export const INLINE_LIMIT: number,
  COVER_LIMIT: number,
  COVER_EDGE: number,
  FILE_LIMIT: number,
  PACKET_LIMIT: number,
  LIFETIME: number;
export function imageHashes(d: SiteDocument): string[];
export function bundleName(packet: string): string;
export function diffDocuments(a: SiteDocument, b: SiteDocument): EditionPatch;
export function patchedDocument(a: SiteDocument, p: unknown): SiteDocument;
