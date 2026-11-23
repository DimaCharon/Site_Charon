import test from "node:test";
import assert from "node:assert/strict";
import { handleContact } from "../relay/worker.mjs";
import { briefLimits, checkBrief, briefText } from "../shared/brief.mjs";
import { contactEndpoint } from "../scripts/contact-endpoint.mjs";
const raw = {
  name: " Лена ",
  brand: "Студия",
  task: "Собрать каталог\r\nс примерами работ.",
  reply: "@example_studio",
  reference: "Студия обложек [work-charon]",
  consent: true,
  website: "",
};
const site = "https://preview.example.org",
  url = "https://brief.example.org/contact",
  token = "123456:" + "x".repeat(35);
const pass = { limit: async () => ({ success: true }) },
  stop = { limit: async () => ({ success: false }) };
const env = {
  SITE_ORIGIN: site,
  TELEGRAM_BOT_TOKEN: token,
  TELEGRAM_CHAT_ID: "1234567",
  VISITOR_LIMIT: pass,
  INBOX_LIMIT: pass,
};
function request({
  method = "POST",
  at = url,
  headers = {},
  body = JSON.stringify(raw),
} = {}) {
  return new Request(at, {
    method,
    headers: { "Content-Type": "application/json", Origin: site, ...headers },
    ...(["POST", "PUT"].includes(method) ? { body } : {}),
  });
}
test("Бриф нормализуется и не требует бренд; согласие, задача и пригодный контакт обязательны", () => {
  const ok = checkBrief(raw);
  assert.equal(ok.ok, true);
  assert.match(briefText(ok.value), /Имя: Лена\n/);
  assert.match(ok.value.task, /каталог\nс примерами/);
  for (const reply of [
    "person@example.org",
    "+7 (999) 000-12-34",
    "https://t.me/example_studio",
    "@example_studio",
  ])
    assert.equal(checkBrief({ ...raw, brand: "", reply }).ok, true);
  for (const bad of [
    { consent: false },
    { reply: "нет" },
    { name: "" },
    { task: "  И " },
    { name: "Ле\nна" },
    { website: "filled" },
    { brand: "a".repeat(briefLimits.brand + 1) },
    { reference: 42 },
    { chat_id: "elsewhere" },
  ])
    assert.equal(checkBrief({ ...raw, ...bad }).ok, false);
});
test("Доставка: ровно один sendMessage, только в личный чат из secret, без интерпретации разметки", async () => {
  let count = 0;
  const r = await handleContact(request(), env, async (u, opts) => {
    count++;
    assert.equal(u, "https://api.telegram.org/bot" + token + "/sendMessage");
    assert.equal(opts.redirect, "manual");
    const data = JSON.parse(opts.body);
    assert.equal(data.chat_id, env.TELEGRAM_CHAT_ID);
    assert.equal(data.text, briefText(checkBrief(raw).value));
    assert.equal(data.parse_mode, undefined);
    assert.equal(data.link_preview_options.is_disabled, true);
    return Response.json({
      ok: true,
      result: { message_id: 12, chat: { id: Number(env.TELEGRAM_CHAT_ID) } },
    });
  });
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("access-control-allow-origin"), site);
  assert.deepEqual(await r.json(), { delivered: true });
  assert.equal(count, 1);
});
test("Неизвестный origin, незаполненный сервер, чужие поля, лимиты и антиспам не вызывают Telegram", async () => {
  let calls = 0;
  const never = async () => {
    calls++;
    throw Error();
  };
  for (const [opts, patch, status] of [
    [{ headers: { Origin: "null" } }, {}, 403],
    [{ headers: { Origin: "https://elsewhere.test" } }, {}, 403],
    [{ method: "GET" }, {}, 405],
    [{ at: url + "?address=x" }, {}, 404],
    [{ headers: { "content-type": "text/plain" } }, {}, 415],
    [{}, { TELEGRAM_CHAT_ID: "" }, 503],
    [{}, { TELEGRAM_BOT_TOKEN: "" }, 503],
    [{}, { VISITOR_LIMIT: null }, 503],
    [{}, { VISITOR_LIMIT: stop }, 429],
    [{}, { INBOX_LIMIT: stop }, 429],
    [{ body: "a".repeat(17000) }, {}, 413],
    [{ body: "{" }, {}, 400],
    [{ body: JSON.stringify({ ...raw, consent: false }) }, {}, 422],
    [{ body: JSON.stringify({ ...raw, website: "robot" }) }, {}, 422],
    [{ body: JSON.stringify({ ...raw, chat_id: "222" }) }, {}, 422],
  ]) {
    const r = await handleContact(request(opts), { ...env, ...patch }, never);
    assert.equal(r.status, status);
    assert.equal((await r.json()).delivered, false);
  }
  assert.equal(calls, 0);
  const pre = await handleContact(request({ method: "OPTIONS" }), env, never);
  assert.equal(pre.status, 204);
  assert.equal(pre.headers.get("access-control-allow-origin"), site);
});
test("Ошибка/тайм-аут/неподтверждённое сообщение не превращаются в успешную отправку и не раскрывают содержимое", async () => {
  for (const send of [
    async () => {
      throw Error(token);
    },
    async () => Response.json({ ok: false, description: raw.reply }),
    async () =>
      Response.json({
        ok: true,
        result: { message_id: 0, chat: { id: 1234567 } },
      }),
    async () =>
      Response.json({
        ok: true,
        result: { message_id: 123, chat: { id: 54321 } },
      }),
    async () => new Response("", { status: 302, headers: { location: "https://elsewhere.test/" } }),
    async () => new Response("", { status: 429 }),
  ]) {
    const r = await handleContact(request(), env, send);
    assert.ok(r.status >= 400);
    const text = await r.text();
    assert.equal(JSON.parse(text).delivered, false);
    assert.ok(!text.includes(raw.reply) && !text.includes(token));
  }
});
test("Публичная конфигурация допускает только HTTPS-адрес обработчика без секрета или отключённую доставку", () => {
  assert.equal(contactEndpoint({ endpoint: url }), url);
  assert.equal(contactEndpoint({ endpoint: "" }), "");
  for (const s of [
    "http://example.com/contact",
    "https://name:password@example.org/contact",
    "https://api.telegram.org/contact",
    url + "?key=x",
    url + "#x",
    "https://example.org/another",
    "https://example.org:42/contact",
  ])
    assert.throws(() => contactEndpoint({ endpoint: s }));
  assert.throws(() => contactEndpoint({ endpoint: url, token: "bad" }));
});
