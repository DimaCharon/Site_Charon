/** The only automated write path. Runs in an owner-authorized GitHub workflow;
 * no public server, public write API, permanent GitHub token, or browser session cookie. */
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { readFile, writeFile, appendFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import {
  canonicalProfile,
  normalizeProfile,
} from "../shared/profile-schema.mjs";
export function verifyRequest({
  packet,
  key,
  current,
  owner,
  actor,
  initiator,
  repository,
  ref,
  event,
  now = Date.now(),
}) {
  if (
    !owner ||
    !actor ||
    !initiator ||
    actor.toLowerCase() !== owner.toLowerCase() ||
    initiator.toLowerCase() !== owner.toLowerCase() ||
    ref !== "refs/heads/main" ||
    event !== "workflow_dispatch"
  )
    throw new Error("Подтверждение владельца для main обязательно.");
  if (typeof key !== "string" || !/^[a-f\d]{64}$/.test(key))
    throw new Error("Ключ публикации не настроен.");
  if (typeof packet !== "string" || packet.length > 8192)
    throw new Error("Некорректный размер пакета.");
  const match = /^CH1\.([A-Za-z0-9_-]{1,8000})\.([a-f0-9]{64})$/.exec(
    packet.trim(),
  );
  if (!match) throw new Error("Некорректный формат пакета.");
  const expected = createHmac("sha256", Buffer.from(key, "hex"))
    .update("CH1." + match[1])
    .digest();
  if (!timingSafeEqual(expected, Buffer.from(match[2], "hex")))
    throw new Error("Подпись не подтверждена.");
  let payload;
  try {
    payload = JSON.parse(Buffer.from(match[1], "base64url").toString("utf8"));
  } catch {
    throw new Error("Пакет не читается.");
  }
  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload) ||
    Object.keys(payload).sort().join(",") !== "base,issued,profile,repo,v" ||
    payload.v !== 1 ||
    payload.repo !== repository ||
    !Number.isSafeInteger(payload.issued) ||
    payload.issued > now + 60_000 ||
    now - payload.issued > 15 * 60_000
  )
    throw new Error("Неверный адресат или истёк срок действия пакета.");
  const base = createHash("sha256")
    .update(canonicalProfile(current))
    .digest("hex");
  if (payload.base !== base)
    throw new Error(
      "Опубликованный профиль уже изменился. Обновите сайт и подготовьте новый пакет.",
    );
  return normalizeProfile(payload.profile);
}
async function apply() {
  const e = process.env;
  if (e.GITHUB_ACTIONS !== "true")
    throw new Error("Публикация выполняется только в GitHub Actions.");
  const current = JSON.parse(await readFile("public/identity.json", "utf8"));
  const profile = verifyRequest({
    packet: e.PROFILE_PACKET,
    key: e.PROFILE_SIGNING_KEY,
    current,
    owner: e.GITHUB_REPOSITORY_OWNER,
    actor: e.GITHUB_ACTOR,
    initiator: e.GITHUB_TRIGGERING_ACTOR,
    repository: e.GITHUB_REPOSITORY,
    ref: e.GITHUB_REF,
    event: e.GITHUB_EVENT_NAME,
  });
  const changed =
    e.CHECK_ONLY !== "true" &&
    canonicalProfile(profile) !== canonicalProfile(current);
  if (changed)
    await writeFile(
      "public/identity.json",
      JSON.stringify(profile, null, 2) + "\n",
    );
  await appendFile(e.GITHUB_OUTPUT, `changed=${changed}\n`);
  console.log(
    changed
      ? "Проверенный профиль подготовлен к публикации."
      : "Проверка пройдена. Файлы не изменены.",
  );
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url)
  apply().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
