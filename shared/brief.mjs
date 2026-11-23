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
// A conservative filter: check whole words, not arbitrary substrings inside
// names or project titles. The same checks run in the form and in the Worker.
const inappropriate = /(?:^|[^\p{L}\p{N}])(?:х[.\-_*]*[уy][.\-_*]*[йяеёию]|п[.\-_*]*[иi][.\-_*]*з[.\-_*]*д|б[.\-_*]*л[.\-_*]*[яa][.\-_*]*д|(?:за|вы|про|на|раз|пере)?[её][.\-_*]*б(?:а|у|и|л|н|т)|сука|суки|суку|мудак|гандон|пидор|fuck|shit|bitch)(?:[\p{L}\p{N}]*)?(?=$|[^\p{L}\p{N}])/iu;
function textIssue(text) {
  const clean = text.normalize("NFKC").replace(/[\u200b-\u200f\u2060\ufeff]/g, "");
  if (inappropriate.test(clean)) return "profanity";
  // Long repeated characters and link floods are common automated noise.
  if (/(\S)\1{11,}/u.test(clean) || (clean.match(/https?:\/\/[^\s]+/gi) || []).length > 3)
    return "spam";
  return null;
}
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
  for (const k of ["name", "brand", "task"]) {
    const reason = textIssue(value[k]);
    if (reason) return { ok: false, field: k, reason };
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
