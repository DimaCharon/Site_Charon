// Narrow typed changes, never arbitrary JSON paths or filesystem names.
import { normalizeDocument, MAX_PROJECTS } from "./content-schema.mjs";
export const INLINE_LIMIT = 8192,
  COVER_LIMIT = 256 * 1024,
  COVER_EDGE = 1440,
  FILE_LIMIT = 24 * 1024 * 1024,
  PACKET_LIMIT = 4 * 1024 * 1024,
  LIFETIME = 30 * 60 * 1000;
export const imageHashes = (d) => [
  ...new Set(
    d.content.projects.flatMap((p) => (p.cover ? [p.cover.hash] : [])),
  ),
];
export const bundleName = (packet) => "charon-" + packet.slice(-16) + ".json";
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
export function diffDocuments(before, after) {
  const a = normalizeDocument(before),
    b = normalizeDocument(after),
    patch = {};
  if (!same(a.profile, b.profile)) patch.profile = b.profile;
  const copy = Object.fromEntries(
    Object.entries(b.content.copy).filter(([k, v]) => a.content.copy[k] !== v),
  );
  if (Object.keys(copy).length) patch.copy = copy;
  for (const k of ["directions", "worlds", "interests"])
    if (!same(a.content[k], b.content[k])) patch[k] = b.content[k];
  if (!same(a.content.projects, b.content.projects)) {
    const original = new Map(a.content.projects.map((p) => [p.id, p]));
    patch.projects = {
      order: b.content.projects.map((p) => p.id),
      updates: b.content.projects.filter((p) => !same(original.get(p.id), p)),
    };
  }
  return patch;
}
const fail = () => {
  throw new Error("Недопустимые поля или порядок в изменениях сайта.");
};
const obj = (o) => o !== null && typeof o === "object" && !Array.isArray(o);
export function patchedDocument(before, patch) {
  const d = normalizeDocument(before);
  if (
    !obj(patch) ||
    Object.keys(patch).some(
      (k) =>
        ![
          "profile",
          "copy",
          "directions",
          "worlds",
          "interests",
          "projects",
        ].includes(k),
    )
  )
    fail();
  if (Object.hasOwn(patch, "profile")) d.profile = patch.profile;
  if (Object.hasOwn(patch, "copy")) {
    if (!obj(patch.copy)) fail();
    for (const [k, v] of Object.entries(patch.copy)) {
      if (!Object.hasOwn(d.content.copy, k)) fail();
      d.content.copy[k] = v;
    }
  }
  for (const k of ["directions", "worlds", "interests"])
    if (Object.hasOwn(patch, k)) d.content[k] = patch[k];
  if (Object.hasOwn(patch, "projects")) {
    const p = patch.projects;
    if (
      !obj(p) ||
      Object.keys(p).length !== 2 ||
      !Array.isArray(p.order) ||
      !Array.isArray(p.updates) ||
      p.order.length > MAX_PROJECTS ||
      p.updates.length > p.order.length ||
      new Set(p.order).size !== p.order.length
    )
      fail();
    const index = new Map(d.content.projects.map((row) => [row.id, row]));
    const touched = new Set();
    for (const row of p.updates) {
      if (!obj(row) || !p.order.includes(row.id) || touched.has(row.id)) fail();
      touched.add(row.id);
      index.set(row.id, row);
    }
    d.content.projects = p.order.map((id) => index.get(id));
  }
  return normalizeDocument(d);
}
