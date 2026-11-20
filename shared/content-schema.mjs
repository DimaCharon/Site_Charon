import { blankOffer, httpsLink } from "./offer.mjs";
import { normalizeProfile } from "./profile-schema.mjs";
import { textFields } from "./text-fields.mjs";
export { textFields };
export const artKinds = [
  "identity",
  "ai",
  "code",
  "trading",
  "product",
  "design",
  "automation",
  "technology",
  "experiments",
];
export const statusValues = ["Активный проект", "Разработка", "Концепция"];
export const MAX_PROJECTS = 60;
const optionalCopy = new Set([
  "hero.description",
  "about.description",
  "about.lead1",
  "about.lead2",
  "about.lead3",
  "projects.intro",
  "world.text02",
  "world.text03",
  "contacts.intro1",
  "contacts.intro2",
  "about.role",
  "studio.engraving",
  "studio.engravingSub",
  "projects.photoCaption",
]);
const fieldKinds = artKinds.slice(1),
  themes = ["original", "lavender", "ice", "steel"];
const invalid = (hint) => {
  throw new Error("Проверьте " + hint + ".");
};
function exact(v, keys, hint) {
  if (
    !v ||
    typeof v !== "object" ||
    Array.isArray(v) ||
    Object.keys(v).length !== keys.length ||
    !keys.every((k) => Object.hasOwn(v, k))
  )
    invalid(hint);
}
function txt(v, max, hint, empty = false) {
  if (
    typeof v !== "string" ||
    v.length > max * 2 + 20 ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u.test(
      v,
    )
  )
    invalid(hint);
  const s = v
    .replace(/\r\n?|\t/g, " ")
    .trim()
    .normalize("NFC");
  if ((!s && !empty) || [...s].length > max)
    invalid(hint + " (до " + max + " символов)");
  return s;
}
function choice(v, list, hint) {
  if (!list.includes(v)) invalid(hint);
  return v;
}
function pos(n) {
  if (!Number.isInteger(n) || n < 0 || n > 100) invalid("положение объекта");
  return n;
}
function rows(v, max, hint, fn, min = 0) {
  if (!Array.isArray(v) || v.length > max || v.length < min) invalid(hint);
  return v.map(fn);
}
function strings(v, n, max, hint) {
  const a = rows(v, n * 2 + 4, hint, (t) => txt(t, max, hint, true)).filter(
    Boolean,
  );
  if (a.length > n) invalid(hint + " (до " + n + ")");
  return a;
}
function cover(v) {
  if (v === null) return null;
  exact(v, ["hash", "alt", "fit", "x", "y"], "данные фотографии");
  if (
    typeof v.hash !== "string" ||
    v.hash.length !== 64 ||
    !/^[a-f0-9]{64}$/.test(v.hash)
  )
    invalid("идентификатор фотографии");
  return {
    hash: v.hash,
    alt: txt(v.alt, 220, "описание фото", true),
    fit: choice(v.fit, ["cover", "contain"], "кадрирование"),
    x: pos(v.x),
    y: pos(v.y),
  };
}
function offer(v, status) {
  exact(v, Object.keys(blankOffer()), "формат предложения");
  const link = (v, field) => {
    const s = txt(v, 1200, field, true);
    if (!s) return "";
    const u = httpsLink(s);
    if (!u) invalid(field + " (нужна HTTPS-ссылка без логина и пароля)");
    return u;
  };
  const o = {
    audience: txt(v.audience, 400, "аудиторию", true),
    result: txt(v.result, 900, "результат", true),
    sale: choice(v.sale, ["showcase", "inquiry", "checkout"], "способ продажи"),
    price: txt(v.price, 90, "цену", true),
    terms: txt(v.terms, 800, "условия", true),
    buyUrl: link(v.buyUrl, "ссылку покупки"),
    demo: choice(v.demo, ["none", "lab", "link"], "тип демо"),
    demoUrl: link(v.demoUrl, "ссылку демо"),
    docsUrl: link(v.docsUrl, "ссылку документации"),
  };
  if (
    o.sale === "checkout" &&
    (status !== "Активный проект" || !o.price || !o.buyUrl)
  )
    invalid("продажу: нужны активный проект, цена и ссылка на оплату");
  if (o.demo === "link" && !o.demoUrl) invalid("ссылку для внешнего демо");
  return o;
}
function project(p, i) {
  const hint = "проект №" + (i + 1);
  exact(
    p,
    [
      "id",
      "name",
      "category",
      "status",
      "art",
      "short",
      "description",
      "details",
      "tags",
      "cover",
      "theme",
      "caption",
      "offer",
    ],
    hint,
  );
  if (typeof p.id !== "string" || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(p.id))
    invalid("ID проекта");
  return {
    id: p.id,
    offer: offer(p.offer, p.status),
    name: txt(p.name, 90, hint + " — название"),
    caption: txt(p.caption, 90, "подпись на обложке", true),
    category: txt(p.category, 60, "категорию", true),
    status: choice(p.status, statusValues, "статус"),
    art: choice(p.art, artKinds, "тип визуализации"),
    short: txt(p.short, 400, "краткое описание", true),
    description: txt(p.description, 4000, "полное описание", true),
    details: strings(p.details, 14, 600, "пункты досье"),
    tags: strings(p.tags, 16, 44, "теги"),
    cover: cover(p.cover),
    theme: choice(p.theme, themes, "материал карточки"),
  };
}
export function normalizeContent(v) {
  exact(
    v,
    ["version", "copy", "projects", "directions", "worlds", "interests"],
    "структуру сайта",
  );
  if (v.version !== 2) invalid("версию формата");
  exact(
    v.copy,
    textFields.map((f) => f.key),
    "набор подписей",
  );
  const copy = {};
  for (const f of textFields)
    copy[f.key] = txt(
      v.copy[f.key],
      f.max,
      f.label,
      optionalCopy.has(f.key) ||
        f.key.endsWith(".endMark") ||
        f.key.endsWith(".number"),
    );
  const projects = rows(v.projects, MAX_PROJECTS, "число проектов", project);
  if (new Set(projects.map((p) => p.id)).size !== projects.length)
    invalid("уникальность проектов");
  const directions = rows(
    v.directions,
    6,
    "направления",
    (d) => {
      exact(d, ["title", "icon", "text"], "направление");
      return {
        title: txt(d.title, 64, "название направления"),
        icon: choice(d.icon, fieldKinds, "иконку"),
        text: txt(d.text, 1400, "описание направления", true),
      };
    },
    6,
  );
  const worlds = rows(
    v.worlds,
    7,
    "орбиты",
    (w) => {
      exact(w, ["label", "kind", "title", "text", "x", "y"], "орбиту");
      return {
        label: txt(w.label, 28, "подпись орбиты"),
        kind: choice(w.kind, fieldKinds, "объект"),
        title: txt(w.title, 90, "название орбиты"),
        text: txt(w.text, 1400, "описание орбиты", true),
        x: pos(w.x),
        y: pos(w.y),
      };
    },
    7,
  );
  const interests = rows(
    v.interests,
    7,
    "интересы",
    (f) => {
      exact(f, ["title", "kind", "text", "question", "note"], "интерес");
      return {
        title: txt(f.title, 90, "название интереса"),
        kind: choice(f.kind, fieldKinds, "иконку интереса"),
        text: txt(f.text, 400, "описание интереса", true),
        question: txt(f.question, 480, "вопрос", true),
        note: txt(f.note, 2600, "заметку", true),
      };
    },
    7,
  );
  if (new Set(interests.map((n) => n.kind)).size !== interests.length)
    invalid("уникальные адреса заметок");
  return { version: 2, copy, projects, directions, worlds, interests };
}
export function normalizeDocument(d) {
  exact(d, ["profile", "content"], "документ");
  const profile = normalizeProfile(d.profile),
    content = normalizeContent(d.content);
  if (
    content.projects.some((p) => p.offer.sale === "inquiry") &&
    !Object.values(profile.contacts).some(Boolean)
  )
    invalid(
      "канал связи: укажите контакт в профиле или выберите «Только витрина»",
    );
  return { profile, content };
}
export const canonicalDocument = (d) => JSON.stringify(normalizeDocument(d));
