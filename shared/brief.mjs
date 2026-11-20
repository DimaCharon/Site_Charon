// Public contact form contract. No user-selected destinations, attachments, or credentials.
export const briefLimits = Object.freeze({
  name: 80,
  brand: 120,
  task: 1400,
  reply: 160,
  reference: 180,
});
const fields = Object.keys(briefLimits),
  keys = [...fields, "consent", "website"];
export function checkBrief(raw) {
  if (
    !raw ||
    typeof raw !== "object" ||
    Array.isArray(raw) ||
    Object.keys(raw).length !== keys.length ||
    !keys.every((k) => Object.hasOwn(raw, k))
  )
    return { ok: false, field: "form" };
  if (raw.website !== "") return { ok: false, field: "form" };
  const value = {};
  for (const k of fields) {
    const v = raw[k];
    if (typeof v !== "string" || v.length > briefLimits[k])
      return { ok: false, field: k };
    const s = v.replace(/\r\n?/g, "\n").trim().normalize("NFC");
    if (
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u.test(
        s,
      ) ||
      (k !== "task" && /[\n\t\u2028\u2029]/u.test(s))
    )
      return { ok: false, field: k };
    value[k] = s;
  }
  if (!value.name) return { ok: false, field: "name" };
  if (value.task.length < 6) return { ok: false, field: "task" };
  if (
    !/^(?:@[a-z\d_]{3,32}|https:\/\/t\.me\/[a-z\d_]{3,32}\/?|[^\s@]{1,64}@[^\s@.]+(?:\.[^\s@.]+)+)$/i.test(
      value.reply,
    ) &&
    !(
      /^[+\d][\d ().-]+$/.test(value.reply) &&
      /^\d{7,15}$/.test(value.reply.replace(/\D/g, ""))
    )
  )
    return { ok: false, field: "reply" };
  if (raw.consent !== true) return { ok: false, field: "consent" };
  return { ok: true, value };
}
export function briefText(v) {
  return [
    "Новая заявка · Charon",
    "",
    `Имя: ${v.name}`,
    `Бренд: ${v.brand || "не указан"}`,
    `Как связаться: ${v.reply}`,
    ...(v.reference ? [`Референс: ${v.reference}`] : []),
    "",
    "Что нужно сделать:",
    v.task,
  ].join("\n");
}
