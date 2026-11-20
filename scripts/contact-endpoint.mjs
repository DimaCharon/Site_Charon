// Explicit, reviewed destination for personal data. Never put tokens or a Bot API URL here.
export function contactEndpoint(config) {
  if (
    !config ||
    Object.keys(config).join() !== "endpoint" ||
    typeof config.endpoint !== "string"
  )
    throw Error("Ожидается только поле endpoint в contact-delivery.json.");
  const s = config.endpoint;
  if (!s) return "";
  if (
    s.length > 300 ||
    !/^https:\/\/(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}\/contact$/.test(
      s,
    )
  )
    throw Error(
      "Нужен публичный HTTPS-адрес обработчика с путём /contact, без ключей и параметров.",
    );
  const u = new URL(s);
  if (
    u.hostname === "telegram.org" ||
    u.hostname.endsWith(".telegram.org") ||
    u.hostname === "t.me" ||
    u.href !== s
  )
    throw Error("Укажите адрес своего обработчика, не Telegram.");
  return s;
}
