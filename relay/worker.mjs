import { briefText, checkBrief } from "../shared/brief.mjs";
const MAX_BYTES = 16 * 1024;
async function limitedJSON(req) {
  if (Number(req.headers.get("content-length")) > MAX_BYTES) throw 413;
  const r = req.body?.getReader();
  if (!r) throw 400;
  const chunks = [];
  let n = 0;
  try {
    while (true) {
      const { done, value } = await r.read();
      if (done) break;
      n += value.byteLength;
      if (n > MAX_BYTES) {
        await r.cancel();
        throw 413;
      }
      chunks.push(value);
    }
  } finally {
    r.releaseLock();
  }
  const buf = new Uint8Array(n);
  let off = 0;
  for (const part of chunks) {
    buf.set(part, off);
    off += part.length;
  }
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(buf));
  } catch {
    throw 400;
  }
}
// No database or logging. No webhook/getUpdates: the owner's existing bot keeps running.
export async function handleContact(req, env, send = fetch) {
  const origin = req.headers.get("Origin"),
    allowed =
      !!env.SITE_ORIGIN && origin === env.SITE_ORIGIN && origin !== "null";
  const headers = {
    "cache-control": "no-store",
    vary: "Origin",
    "x-content-type-options": "nosniff",
    ...(allowed ? { "access-control-allow-origin": origin } : {}),
  };
  const reply = (status, code, extra = {}) =>
    Response.json(code ? { delivered: false, code } : { delivered: true }, {
      status,
      headers: { ...headers, ...extra },
    });
  const u = new URL(req.url);
  if (u.pathname !== "/contact" || u.search) return reply(404, "not_found");
  if (!allowed) return reply(403, "origin");
  if (req.method === "OPTIONS")
    return new Response(null, {
      status: 204,
      headers: {
        ...headers,
        "access-control-allow-methods": "POST, OPTIONS",
        "access-control-allow-headers": "Content-Type",
        "access-control-max-age": "600",
      },
    });
  if (req.method !== "POST")
    return reply(405, "method", { allow: "POST, OPTIONS" });
  if (
    req.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  )
    return reply(415, "json");
  const token = env.TELEGRAM_BOT_TOKEN,
    chat = env.TELEGRAM_CHAT_ID;
  if (
    typeof token !== "string" ||
    !/^\d{4,16}:[A-Za-z0-9_-]{30,128}$/.test(token) ||
    typeof chat !== "string" ||
    !/^[1-9]\d{0,15}$/.test(chat) ||
    !env.VISITOR_LIMIT ||
    !env.INBOX_LIMIT
  )
    return reply(503, "unavailable");
  try {
    const ip = req.headers.get("CF-Connecting-IP") || "unknown";
    if (!(await env.VISITOR_LIMIT.limit({ key: ip })).success)
      return reply(429, "slow", { "retry-after": "60" });
    const body = await limitedJSON(req);
    const check = checkBrief(body);
    if (!check.ok) return reply(422, "invalid");
    if (!(await env.INBOX_LIMIT.limit({ key: "brief-inbox" })).success)
      return reply(429, "slow", { "retry-after": "60" });
    const out = await send(
      "https://api.telegram.org/bot" + token + "/sendMessage",
      {
        method: "POST",
        // Workers supports manual rather than "error"; never follow a redirect
        // because the upstream URL contains the bot token. Non-2xx is rejected below.
        redirect: "manual",
        signal: AbortSignal.timeout(8000),
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: chat,
          text: briefText(check.value),
          link_preview_options: { is_disabled: true },
        }),
      },
    );
    if (out.status === 429) return reply(429, "slow", { "retry-after": "60" });
    if (!out.ok) return reply(502, "unconfirmed");
    const result = await out.json();
    if (
      result?.ok !== true ||
      !Number.isSafeInteger(result.result?.message_id) ||
      result.result.message_id <= 0 ||
      String(result.result.chat?.id) !== chat
    )
      return reply(502, "unconfirmed");
    return reply(200, null);
  } catch (reason) {
    if (reason === 400 || reason === 413) return reply(reason, "invalid");
    return reply(502, "unconfirmed");
  }
}
export default { fetch: (req, env) => handleContact(req, env) };
