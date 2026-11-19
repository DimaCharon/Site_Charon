/** One allowlist for public reads, owner drafts, the build and the publication job. */
export const contactNames = Object.freeze({
  telegram: "Telegram",
  email: "Email",
  github: "GitHub",
  social: "Другие соцсети",
});
export const defaultProfile = Object.freeze({
  name: "Charon",
  contacts: Object.freeze({ telegram: "", email: "", github: "", social: "" }),
});
const forbidden = /[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u;
const isObject = (v) =>
  v !== null && typeof v === "object" && !Array.isArray(v);
function exactKeys(o, keys) {
  return (
    isObject(o) &&
    Object.keys(o).length === keys.length &&
    keys.every((k) => Object.hasOwn(o, k))
  );
}
export function safeContact(key, value) {
  if (
    !Object.hasOwn(contactNames, key) ||
    typeof value !== "string" ||
    value.length > 384 ||
    forbidden.test(value)
  )
    return null;
  const v = value.trim();
  if (!v) return null;
  if (key === "email") {
    if (
      v.length > 254 ||
      !/^[\w.+-]{1,64}@[a-z\d-]+(?:\.[a-z\d-]+)*\.[a-z]{2,63}$/i.test(v) ||
      v.includes("..")
    )
      return null;
    return "mailto:" + v;
  }
  try {
    const u = new URL(v);
    if (
      u.protocol !== "https:" ||
      u.username ||
      u.password ||
      u.port ||
      !u.hostname.includes(".") ||
      /\s|\\/u.test(v)
    )
      return null;
    if (
      key === "telegram" &&
      (!["t.me", "telegram.me"].includes(u.hostname) || u.pathname === "/")
    )
      return null;
    if (key === "github" && (u.hostname !== "github.com" || u.pathname === "/"))
      return null;
    return u.href;
  } catch {
    return null;
  }
}
export function normalizeProfile(raw) {
  if (
    !exactKeys(raw, ["name", "contacts"]) ||
    !exactKeys(raw.contacts, Object.keys(contactNames))
  )
    throw new Error("Некорректная структура профиля.");
  if (typeof raw.name !== "string" || forbidden.test(raw.name))
    throw new Error("Проверьте имя профиля.");
  const name = raw.name.trim().normalize("NFC");
  if (!name || [...name].length > 32)
    throw new Error("Имя должно содержать от 1 до 32 символов.");
  const contacts = {};
  for (const [k, label] of Object.entries(contactNames)) {
    const value = raw.contacts[k];
    if (
      typeof value !== "string" ||
      value.length > 384 ||
      forbidden.test(value)
    )
      throw new Error(`Проверьте поле ${label}.`);
    const v = value.trim();
    if (v && !safeContact(k, v))
      throw new Error(
        k === "email"
          ? "Проверьте адрес электронной почты."
          : `Проверьте ссылку ${label}: нужен полный HTTPS-адрес${k === "telegram" ? " на t.me" : k === "github" ? " на github.com" : ""}.`,
      );
    contacts[k] = v;
  }
  return { name, contacts };
}
export function canonicalProfile(value) {
  return JSON.stringify(normalizeProfile(value));
}
