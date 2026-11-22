import type { Profile } from "./profile-schema.mjs";
export type Field =
  | "ai"
  | "code"
  | "trading"
  | "product"
  | "design"
  | "automation"
  | "technology"
  | "experiments";
export type Art = Field | "identity";
export type Cover = {
  hash: string;
  alt: string;
  fit: "cover" | "contain";
  x: number;
  y: number;
};
export type Theme = "original" | "lavender" | "ice" | "steel";
export type Offer = {
  audience: string;
  result: string;
  sale: "showcase" | "inquiry" | "checkout";
  price: string;
  terms: string;
  siteUrl: string;
  buyUrl: string;
  demo: "none" | "lab" | "link";
  demoUrl: string;
  docsUrl: string;
};
export type Project = {
  offer: Offer;
  id: string;
  name: string;
  caption: string;
  category: string;
  status: "Активный проект" | "Разработка" | "Концепция";
  art: Art;
  short: string;
  description: string;
  details: string[];
  tags: string[];
  cover: Cover | null;
  theme: Theme;
};
export type Direction = { title: string; icon: Field; text: string };
export type World = {
  label: string;
  kind: Field;
  title: string;
  text: string;
  x: number;
  y: number;
};
export type Interest = {
  title: string;
  kind: Field;
  text: string;
  question: string;
  note: string;
};
export type Content = {
  version: 2;
  copy: Record<string, string>;
  projects: Project[];
  directions: Direction[];
  worlds: World[];
  interests: Interest[];
};
export type SiteDocument = { profile: Profile; content: Content };
export type TextFieldSpec = {
  key: string;
  group: string;
  label: string;
  max: number;
};
export const textFields: readonly TextFieldSpec[];
export const artKinds: readonly Art[];
export const statusValues: readonly Project["status"][];
export const MAX_PROJECTS: number;
export function normalizeContent(v: unknown): Content;
export function normalizeDocument(v: unknown): SiteDocument;
export function canonicalDocument(v: unknown): string;
