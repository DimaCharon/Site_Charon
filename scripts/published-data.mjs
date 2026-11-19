import { readFileSync, lstatSync } from "node:fs";
import { join } from "node:path";
import { normalizeDocument } from "../shared/content-schema.mjs";
import { imageHashes, COVER_LIMIT } from "../shared/edition.mjs";
import { checkImage } from "./media-store.mjs";
// Both distributions reject a broken content document or a missing/corrupt referenced cover.
export function loadPublished(root = "public", inline = false) {
  const get = (name) =>
    JSON.parse(readFileSync(join(root, name + ".json"), "utf8"));
  const d = normalizeDocument({
      profile: get("identity"),
      content: get("content"),
    }),
    media = {};
  for (const hash of imageHashes(d)) {
    const file = join(root, "media", hash + ".jpg"),
      s = lstatSync(file);
    if (!s.isFile() || s.size > COVER_LIMIT)
      throw new Error("Повреждена обложка " + hash);
    const bytes = checkImage(readFileSync(file), hash);
    if (inline)
      media[hash] = "data:image/jpeg;base64," + bytes.toString("base64");
  }
  return { ...d, media };
}
