import gate from "../config/owner-gate.json";
import {
  canonicalProfile,
  normalizeProfile,
  type Profile,
} from "../../shared/profile-schema.mjs";

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
  original: Profile,
  draft: Profile,
) {
  const base = hex(
    await crypto.subtle.digest(
      "SHA-256",
      encode.encode(canonicalProfile(original)),
    ),
  );
  const issued = Date.now();
  const body = encode.encode(
    JSON.stringify({
      v: 1,
      repo: "DimaCharon/Site_Charon",
      issued,
      base,
      profile: normalizeProfile(draft),
    }),
  );
  const encoded = btoa(String.fromCharCode(...body))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
  const framed = "CH1." + encoded;
  const signature = hex(
    await crypto.subtle.sign("HMAC", key, encode.encode(framed)),
  );
  return { text: framed + "." + signature, expires: issued + 15 * 60_000 };
}
