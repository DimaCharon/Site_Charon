import { canonicalProfile } from "../shared/profile-schema.mjs";
import { blankOffer } from "../shared/offer.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { createHmac, createHash, randomBytes } from "node:crypto";
import {
  mkdtemp,
  mkdir,
  readdir,
  readFile,
  writeFile,
  rm,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import jpeg from "jpeg-js";
import { loadPublished } from "../scripts/published-data.mjs";
import { verifyEdition, applyEdition } from "../scripts/apply-owner-packet.mjs";
import { fromDraft } from "../scripts/release-inbox.mjs";
import { checkImage } from "../scripts/media-store.mjs";
import {
  textFields,
  normalizeContent,
  canonicalDocument,
  normalizeDocument,
  MAX_PROJECTS,
} from "../shared/content-schema.mjs";
import {
  diffDocuments,
  patchedDocument,
  bundleName,
  LIFETIME,
  FILE_LIMIT,
} from "../shared/edition.mjs";
import { publishMetadata } from "../shared/metadata.mjs";
const { content, profile } = loadPublished(),
  original = { content, profile };
const key = randomBytes(32).toString("hex"),
  now = Date.now(),
  repository = "DimaCharon/Site_Charon";
const request = {
  key,
  owner: "DimaCharon",
  actor: "DimaCharon",
  initiator: "DimaCharon",
  ref: "refs/heads/main",
  event: "workflow_dispatch",
  repository,
  now,
};
const hash = (b) => createHash("sha256").update(b).digest("hex");
const sign = (patch, override = {}, current = original) => {
  const payload = {
      v: 2,
      repo: repository,
      issued: now,
      base: hash(canonicalDocument(current)),
      patch,
      ...override,
    },
    framed =
      "CH2." + Buffer.from(JSON.stringify(payload)).toString("base64url");
  return (
    framed +
    "." +
    createHmac("sha256", Buffer.from(key, "hex")).update(framed).digest("hex")
  );
};
const sample = {
  id: "test-cover",
  offer: blankOffer(),
  name: "Тестовая карточка",
  category: "",
  caption: "",
  status: "Концепция",
  art: "design",
  short: "",
  description: "",
  details: [],
  tags: [],
  cover: null,
  theme: "original",
};
const x = 640,
  y = 420,
  rgba = Buffer.alloc(x * y * 4);
let seed = 32817;
for (let i = 0; i < rgba.length; i += 4) {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  rgba[i] = seed >>> 24;
  rgba[i + 1] = seed >>> 16;
  rgba[i + 2] = seed >>> 8;
  rgba[i + 3] = 255;
}
const photo = jpeg.encode({ width: x, height: y, data: rgba }, 55).data,
  id = hash(photo),
  cover = { hash: id, alt: "Проверка фото", fit: "cover", x: 50, y: 70 };
const temp = async (t) => {
  const dir = await mkdtemp(join(tmpdir(), "charon-edition-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await mkdir(join(dir, "media"));
  return dir;
};
test("Схема покрывает все подписи, карточки и редакционные разделы без HTML-шаблонов в полях", () => {
  const d = structuredClone(original);
  for (const f of textFields) d.content.copy[f.key] = "X";
  d.content.directions[0].title = "Проверка направления";
  d.content.interests[1].note = "Другая заметка";
  d.content.worlds[2].text = "Другая орбита";
  d.content.projects = [
    { ...sample, details: [" один ", "", "два"], tags: ["тег", ""] },
  ];
  const patch = diffDocuments(original, d);
  assert.equal(
    Object.keys(patch.copy).length,
    textFields.filter((f) => content.copy[f.key] !== "X").length,
  );
  assert.deepEqual(patchedDocument(original, patch), normalizeDocument(d));
  assert.deepEqual(
    patchedDocument(original, patch).content.projects[0].details,
    ["один", "два"],
  );
  assert.equal(new Set(textFields.map((f) => f.key)).size, textFields.length);
});
test("Добавление, стабильный порядок, удаление до нуля и возврат из пустого архива", () => {
  const first = { ...sample, id: "a" },
    second = { ...sample, id: "b" };
  const a = patchedDocument(original, {
    projects: { order: ["b", "a"], updates: [first, second] },
  });
  assert.deepEqual(
    a.content.projects.map((p) => p.id),
    ["b", "a"],
  );
  const b = structuredClone(a);
  b.content.projects.reverse();
  const delta = diffDocuments(a, b);
  assert.deepEqual(delta.projects, { order: ["a", "b"], updates: [] });
  const empty = patchedDocument(b, { projects: { order: [], updates: [] } });
  assert.deepEqual(empty.content.projects, []);
  assert.equal(
    patchedDocument(empty, { projects: { order: ["a"], updates: [first] } })
      .content.projects[0].name,
    first.name,
  );
});
test("У всего документа единая версия: владелец, ветка, срок, адресат и HMAC обязательны", () => {
  const patch = { copy: { "hero.title1": "Новая строка" } };
  const packet = sign(patch);
  assert.equal(
    verifyEdition({ ...request, current: original, packet }).content.copy[
      "hero.title1"
    ],
    "Новая строка",
  );
  for (const p of [
    { actor: "Other" },
    { initiator: "Other" },
    { ref: "refs/heads/wip" },
    { event: "push" },
    { key: randomBytes(32).toString("hex") },
    { packet: sign(patch, { issued: now - LIFETIME - 1 }) },
    { packet: sign(patch, { repo: "Other/Repo" }) },
    {
      current: patchedDocument(original, {
        copy: { "footer.top": "Вверх страницы" },
      }),
    },
  ])
    assert.throws(() =>
      verifyEdition({ ...request, packet, current: original, ...p }),
    );
});
test("Поля и объём ограничены, набор карточек непротиворечив", () => {
  for (const p of [
    { templates: {} },
    { copy: { "unknown.slot": "Надпись" } },
    { copy: { "footer.signature": "" } },
    { projects: { order: ["missing"], updates: [] } },
    { projects: { order: ["a", "a"], updates: [{ ...sample, id: "a" }] } },
    {
      projects: {
        order: ["a"],
        updates: [{ ...sample, id: "a", theme: "other" }],
      },
    },
    {
      projects: {
        order: [sample.id],
        updates: [
          { ...sample, cover: { ...cover, hash: "not-a-content-hash" } },
        ],
      },
    },
  ])
    assert.throws(() => patchedDocument(original, p));
  assert.throws(() =>
    normalizeContent({
      ...content,
      projects: Array.from({ length: MAX_PROJECTS + 1 }, (_, i) => ({
        ...sample,
        id: "p" + i,
      })),
    }),
  );
});
test("Реальная фотография >8 КиБ: проверка без записи, публикация, повторное использование и удаление", async (t) => {
  const root = await temp(t),
    current = { ...original, content: { ...content, projects: [] } };
  const d = structuredClone(current);
  d.content.projects = [{ ...sample, cover }];
  const packet = sign(diffDocuments(current, d), {}, current),
    images = { [id]: photo.toString("base64") };
  assert.ok(photo.length > 8192);
  const data = { current, packet, request, root, images };
  assert.equal(
    (await applyEdition({ ...data, checkOnly: true })).changed,
    false,
  );
  assert.deepEqual(await readdir(root), ["media"]);
  assert.deepEqual(await readdir(join(root, "media")), []);
  const { document } = await applyEdition(data);
  assert.equal(
    loadPublished(root, true).media[id],
    `data:image/jpeg;base64,${images[id]}`,
  );
  const d2 = structuredClone(document);
  d2.content.projects.push({ ...sample, id: "also", cover });
  const next = await applyEdition({
    current: document,
    request,
    root,
    packet: sign(diffDocuments(document, d2), {}, document),
  });
  assert.deepEqual(await readdir(join(root, "media")), [id + ".jpg"]);
  await applyEdition({
    current: next.document,
    request,
    root,
    packet: sign({ projects: { order: [], updates: [] } }, {}, next.document),
  });
  assert.deepEqual(await readdir(join(root, "media")), []);
  assert.equal(
    JSON.parse(await readFile(join(root, "content.json"), "utf8")).projects
      .length,
    0,
  );
});
test("Неполные, лишние или повреждённые фото блокируют запись всех файлов", async (t) => {
  const root = await temp(t),
    current = { ...original, content: { ...content, projects: [] } },
    packet = sign(
      { projects: { order: [sample.id], updates: [{ ...sample, cover }] } },
      {},
      current,
    );
  for (const images of [
    {},
    { [id]: "AAAA" },
    { [id]: photo.toString("base64"), unexpected: "abcdef" },
  ])
    await assert.rejects(
      applyEdition({ current, packet, request, root, images }),
    );
  assert.deepEqual(await readdir(root), ["media"]);
  assert.throws(() => checkImage(Buffer.from("not a photo"), id));
});
test("GitHub-перенос: только вложение черновика своего репозитория; подписанный URL скачивается без токена", async () => {
  const packet = sign({ copy: { "hero.title2": "Тест" } }),
    name = bundleName(packet),
    bundle = JSON.stringify({ packet, images: {} }),
    visited = [];
  const transport = async (url, opt) => {
    visited.push(url);
    if (url.includes("/releases?"))
      return Response.json([
        { draft: false, assets: [{ name, id: 1, size: 5, state: "uploaded" }] },
        {
          draft: true,
          assets: [{ name, id: 2, size: bundle.length, state: "uploaded" }],
        },
      ]);
    if (url.endsWith("/releases/assets/2"))
      return new Response(null, {
        status: 302,
        headers: {
          location: "https://release-assets.githubusercontent.com/fixture",
        },
      });
    assert.deepEqual(opt.headers, {});
    return new Response(bundle);
  };
  assert.deepEqual(
    await fromDraft(name, repository, "test-only", transport),
    JSON.parse(bundle),
  );
  assert.equal(visited.length, 3);
  for (const f of [
    () =>
      fromDraft(name, repository, "test", async () =>
        Response.json([{ draft: false, assets: [] }]),
      ),
    () => fromDraft("other.json", repository, "test", transport),
    () =>
      fromDraft(name, repository, "test", async () =>
        Response.json([
          {
            draft: true,
            assets: [{ name, id: 4, state: "uploaded", size: FILE_LIMIT + 1 }],
          },
        ]),
      ),
  ])
    await assert.rejects(f);
});
test("Метаданные остаются текстом, включая кавычки, амперсанд и угловые скобки", () => {
  const d = structuredClone(content);
  d.copy["seo.title"] = "А & Б < I >";
  d.copy["seo.description"] = 'Описание с "кавычками"';
  const html = publishMetadata(
    '<title>Old</title><meta name="description" content="Old"><noscript>old</noscript>',
    d.copy,
  );
  assert.ok(html.includes("<title>А &amp; Б &lt; I &gt;</title>"));
  assert.ok(html.includes('content="Описание с &quot;кавычками&quot;"'));
});

test("Покупка требует активного статуса, настоящей HTTPS-ссылки и объявленной цены; запрос требует контакта", () => {
  const root = structuredClone(original);
  const p = {
    ...sample,
    status: "Активный проект",
    offer: {
      ...blankOffer(),
      sale: "checkout",
      price: "Тестовая цена",
      buyUrl: "https://example.org/checkout",
    },
  };
  root.content.projects = [p];
  assert.equal(
    normalizeDocument(root).content.projects[0].offer.buyUrl,
    p.offer.buyUrl,
  );
  for (const extra of [
    { price: "" },
    { buyUrl: "http://example.org/" },
    { buyUrl: "https://user:password@example.org/" },
    { demo: "link", demoUrl: "" },
    { docsUrl: "not a link" },
  ]) {
    const d = structuredClone(root);
    Object.assign(d.content.projects[0].offer, extra);
    assert.throws(() => normalizeDocument(d));
  }
  root.content.projects[0].status = "Концепция";
  assert.throws(() => normalizeDocument(root));
  root.content.projects[0].offer = { ...blankOffer(), sale: "inquiry" };
  root.profile.contacts = { telegram: "", email: "", github: "", social: "" };
  assert.throws(() => normalizeDocument(root), /канал связи/);
  root.profile.contacts.email = "preview@example.org";
  assert.equal(
    normalizeDocument(root).content.projects[0].offer.sale,
    "inquiry",
  );
});

test("В том числе проверочный CH1 не оставляет активный запрос без канала связи", async (t) => {
  const root = await temp(t),
    current = structuredClone(original);
  current.content.projects = [
    { ...sample, offer: { ...blankOffer(), sale: "inquiry" } },
  ];
  current.profile.contacts = {
    telegram: "",
    email: "preview@example.org",
    github: "",
    social: "",
  };
  const next = {
    ...current.profile,
    contacts: { telegram: "", email: "", github: "", social: "" },
  };
  const body = JSON.stringify({
    v: 1,
    issued: now,
    repo: repository,
    base: hash(canonicalProfile(current.profile)),
    profile: next,
  });
  const framed = "CH1." + Buffer.from(body).toString("base64url"),
    packet =
      framed +
      "." +
      createHmac("sha256", Buffer.from(key, "hex"))
        .update(framed)
        .digest("hex");
  for (const checkOnly of [true, false])
    await assert.rejects(
      applyEdition({ current, request, packet, root, checkOnly }),
      /канал связи/,
    );
  assert.deepEqual(await readdir(root), ["media"]);
});
