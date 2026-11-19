/** The only automated write path. Runs in an owner-authorized GitHub workflow;
 * no public server, public write API, permanent GitHub token, or browser session cookie. */
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { readFile, writeFile, appendFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import {
  canonicalProfile,
  normalizeProfile,
} from "../shared/profile-schema.mjs";
import { canonicalDocument } from "../shared/content-schema.mjs";
import {
  patchedDocument,
  INLINE_LIMIT,
  PACKET_LIMIT,
  LIFETIME,
} from "../shared/edition.mjs";
import { fromDraft } from "./release-inbox.mjs";
import { planMedia, applyMedia } from "./media-store.mjs";
import { join } from "node:path";
function authorize({ owner, actor, initiator, ref, event }) {
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
}
// Legacy standalone editions may still submit profile-only CH1 packets.
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
  authorize({ owner, actor, initiator, ref, event });
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
export function verifyEdition(request) {
  const { packet, key, current, repository, now = Date.now() } = request;
  authorize(request);
  if (typeof key !== "string" || !/^[a-f0-9]{64}$/.test(key))
    throw new Error("Ключ публикации не настроен.");
  if (typeof packet !== "string" || packet.length > PACKET_LIMIT)
    throw new Error("Некорректный размер пакета.");
  const m = /^CH2\.([A-Za-z0-9_-]+)\.([a-f0-9]{64})$/.exec(packet);
  if (!m) throw new Error("Некорректный пакет из редактора.");
  const sig = createHmac("sha256", Buffer.from(key, "hex"))
    .update("CH2." + m[1])
    .digest();
  if (!timingSafeEqual(sig, Buffer.from(m[2], "hex")))
    throw new Error("Подпись не подтверждена.");
  const data = JSON.parse(Buffer.from(m[1], "base64url").toString("utf8"));
  if (
    !data ||
    typeof data !== "object" ||
    Object.keys(data).sort().join(",") !== "base,issued,patch,repo,v" ||
    data.v !== 2 ||
    data.repo !== repository ||
    !Number.isSafeInteger(data.issued) ||
    data.issued > now + 60_000 ||
    now - data.issued > LIFETIME
  )
    throw new Error("Неверный адресат или истёк срок действия пакета.");
  if (
    data.base !==
    createHash("sha256").update(canonicalDocument(current)).digest("hex")
  )
    throw new Error(
      "Опубликованный сайт уже изменился. Обновите страницу и перенесите правки.",
    );
  return patchedDocument(current, data.patch);
}
export async function applyEdition({
  current,
  packet,
  images = {},
  request,
  root = "public",
  checkOnly,
}) {
  const document = packet.startsWith("CH1.")
    ? {
        ...current,
        profile: verifyRequest({
          ...request,
          packet,
          current: current.profile,
        }),
      }
    : verifyEdition({ ...request, packet, current });
  const plan = await planMedia(join(root, "media"), current, document, images);
  const changed =
    !checkOnly && canonicalDocument(current) !== canonicalDocument(document);
  if (changed) {
    await applyMedia(join(root, "media"), plan);
    for (const [name, value] of [
      ["identity", document.profile],
      ["content", document.content],
    ])
      await writeFile(
        join(root, name + ".json"),
        JSON.stringify(value, null, 2) + "\n",
      );
  }
  return { changed, document };
}
async function apply() {
  const e = process.env;
  if (e.GITHUB_ACTIONS !== "true")
    throw new Error("Публикация выполняется только в GitHub Actions.");
  const request = {
    key: e.PROFILE_SIGNING_KEY,
    owner: e.GITHUB_REPOSITORY_OWNER,
    actor: e.GITHUB_ACTOR,
    initiator: e.GITHUB_TRIGGERING_ACTOR,
    repository: e.GITHUB_REPOSITORY,
    ref: e.GITHUB_REF,
    event: e.GITHUB_EVENT_NAME,
  };
  authorize(request);
  const input = (e.PROFILE_PACKET || "").trim();
  if (!input || input.length > INLINE_LIMIT)
    throw new Error(
      "Вставьте короткий пакет или имя файла из черновика релиза.",
    );
  const bundle = input.startsWith("charon-")
    ? await fromDraft(input, request.repository, e.GH_TOKEN)
    : { packet: input, images: {} };
  const current = {
    profile: JSON.parse(await readFile("public/identity.json", "utf8")),
    content: JSON.parse(await readFile("public/content.json", "utf8")),
  };
  const { changed } = await applyEdition({
    current,
    ...bundle,
    request,
    checkOnly: e.CHECK_ONLY === "true",
  });
  await appendFile(e.GITHUB_OUTPUT, `changed=${changed}\n`);
  console.log(
    changed
      ? "Проверенные материалы подготовлены к публикации."
      : "Проверка пройдена. Файлы не изменены.",
  );
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url)
  apply().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
