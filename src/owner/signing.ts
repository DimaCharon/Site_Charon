import gate from "../config/owner-gate.json";
import {
  canonicalDocument,
  type SiteDocument,
} from "../../shared/content-schema.mjs";
import {
  diffDocuments,
  imageHashes,
  bundleName,
  INLINE_LIMIT,
  LIFETIME,
  FILE_LIMIT,
  PACKET_LIMIT,
} from "../../shared/edition.mjs";
import { toBase64, type MediaBank } from "./media";
export const OWNER_DRAFTS =
  "https://github.com/DimaCharon/Site_Charon/releases";
export const OWNER_WORKFLOW =
  "https://github.com/DimaCharon/Site_Charon/actions/workflows/owner-profile.yml";
const encode = new TextEncoder();
const hex = (bytes: ArrayBuffer) =>
  Array.from(new Uint8Array(bytes), (x) =>
    x.toString(16).padStart(2, "0"),
  ).join("");
/** The UI verifier is public, not an authorization boundary. The non-exportable
 * session key signs drafts; the repository owner must separately authorize the workflow. */
export async function unlock(pin: string): Promise<CryptoKey | null> {
  if (!crypto.subtle)
    throw new Error("Откройте сайт по HTTPS для входа в панель.");
  const password = encode.encode(pin);
  const material = await crypto.subtle.importKey(
    "raw",
    password,
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  password.fill(0);
  const salt = Uint8Array.from(gate.salt.match(/../g)!, (p) => parseInt(p, 16));
  const raw = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt, iterations: gate.iterations },
      material,
      256,
    ),
  );
  try {
    if (hex(await crypto.subtle.digest("SHA-256", raw)) !== gate.verifier)
      return null;
    return await crypto.subtle.importKey(
      "raw",
      raw,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
  } finally {
    raw.fill(0);
  }
}
export async function preparePacket(
  key: CryptoKey,
  original: SiteDocument,
  draft: SiteDocument,
  bank: MediaBank,
  now = Date.now(),
) {
  const patch = diffDocuments(original, draft);
  if (!Object.keys(patch).length)
    throw new Error("Пока нет изменений для публикации.");
  const base = hex(
    await crypto.subtle.digest(
      "SHA-256",
      encode.encode(canonicalDocument(original)),
    ),
  );
  const encoded = toBase64(
    encode.encode(
      JSON.stringify({
        v: 2,
        repo: "DimaCharon/Site_Charon",
        issued: now,
        base,
        patch,
      }),
    ),
  )
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
  const framed = "CH2." + encoded,
    text =
      framed +
      "." +
      hex(await crypto.subtle.sign("HMAC", key, encode.encode(framed)));
  if (text.length > PACKET_LIMIT)
    throw new Error("Слишком много изменений за одну публикацию.");
  const known = new Set(imageHashes(original)),
    images: MediaBank = {};
  for (const hash of imageHashes(draft)) {
    if (!known.has(hash)) {
      if (!Object.hasOwn(bank, hash))
        throw new Error("Новая обложка не найдена. Загрузите её повторно.");
      images[hash] = bank[hash];
    }
  }
  const count = Object.keys(images).length,
    file =
      count > 0 || text.length > INLINE_LIMIT
        ? new Blob([JSON.stringify({ packet: text, images })], {
            type: "application/json",
          })
        : null;
  if (file && file.size > FILE_LIMIT)
    throw new Error(
      "Пакет превышает 24 МиБ. Разделите изменения на две публикации.",
    );
  return {
    text,
    expires: now + LIFETIME,
    file,
    name: bundleName(text),
    count,
    patch,
  };
}
