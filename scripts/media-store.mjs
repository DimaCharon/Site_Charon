import { createHash } from "node:crypto";
import {
  lstat,
  readFile,
  readdir,
  mkdir,
  writeFile,
  unlink,
} from "node:fs/promises";
import { join } from "node:path";
import jpeg from "jpeg-js";
import { imageHashes, COVER_EDGE, COVER_LIMIT } from "../shared/edition.mjs";
const hash = (b) => createHash("sha256").update(b).digest("hex");
// Each new asset must be an actual still JPEG, not a URL, original upload or arbitrary blob.
export function checkImage(bytes, id) {
  if (
    bytes.length < 32 ||
    bytes.length > COVER_LIMIT ||
    hash(bytes) !== id ||
    bytes.readUInt16BE(0) !== 0xffd8 ||
    bytes.readUInt16BE(bytes.length - 2) !== 0xffd9
  )
    throw new Error("Неверный хеш, формат или размер фото.");
  let off = 2,
    found = false;
  while (off + 4 <= bytes.length) {
    if (bytes[off++] !== 255) throw new Error("Формат фото не поддерживается.");
    const m = bytes[off++],
      size = bytes.readUInt16BE(off);
    if (size < 2 || off + size > bytes.length)
      throw new Error("Неполное фото.");
    // Allow only ordinary photographic codec markers, and the standard JFIF header. Reject metadata, comments and embedded files.
    if (m === 0xe0) {
      if (size !== 16 || bytes.toString("ascii", off + 2, off + 7) !== "JFIF\0")
        throw new Error("Нестандартный заголовок JPEG.");
    } else if (m === 0xc0 || m === 0xc2) {
      if (found || size < 11 || bytes[off + 2] !== 8)
        throw new Error("Формат кадра JPEG.");
      const w = bytes.readUInt16BE(off + 5),
        h = bytes.readUInt16BE(off + 3);
      if (!w || !h || w > COVER_EDGE || h > COVER_EDGE)
        throw new Error("Превышено разрешение обложки.");
      found = true;
    } else if (m === 0xda) {
      break;
    } else if (![0xdb, 0xc4, 0xdd].includes(m))
      throw new Error("Посторонние данные в JPEG.");
    off += size;
  }
  if (!found) throw new Error("Нет кадра JPEG.");
  try {
    jpeg.decode(bytes, {
      useTArray: true,
      tolerantDecoding: false,
      maxResolutionInMP: 2.1,
      maxMemoryUsageInMB: 96,
    });
  } catch {
    throw new Error("Не удалось декодировать фото.");
  }
  return bytes;
}
export async function planMedia(dir, before, after, images) {
  if (!images || typeof images !== "object" || Array.isArray(images))
    throw new Error("Неверный список вложений.");
  const wanted = new Set(imageHashes(after)),
    known = new Set(imageHashes(before)),
    writes = new Map();
  for (const k of Object.keys(images))
    if (!wanted.has(k) || known.has(k)) throw new Error("Лишнее вложение.");
  let info;
  try {
    info = await lstat(dir);
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
  if (info && !info.isDirectory())
    throw new Error("Каталог изображений недоступен.");
  for (const k of wanted) {
    if (!/^[a-f0-9]{64}$/.test(k)) throw new Error("Недопустимое имя фото.");
    if (known.has(k)) {
      const dest = join(dir, k + ".jpg");
      const meta = await lstat(dest);
      if (
        !meta.isFile() ||
        meta.size > COVER_LIMIT ||
        hash(await readFile(dest)) !== k
      )
        throw new Error("Опубликованная обложка повреждена.");
      continue;
    }
    const data = images[k];
    if (
      typeof data !== "string" ||
      data.length > 4 * Math.ceil(COVER_LIMIT / 3) ||
      !data.length ||
      data.length % 4 !== 0
    )
      throw new Error("Обложка не приложена или превышает лимит.");
    const buf = Buffer.from(data, "base64");
    if (buf.toString("base64") !== data)
      throw new Error("Неверное кодирование фото.");
    writes.set(k, checkImage(buf, k));
  }
  const removes = [];
  if (info)
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.name === ".gitkeep") continue;
      if (!entry.isFile() || !/^([a-f0-9]{64})\.jpg$/.test(entry.name))
        throw new Error("Неизвестный файл в public/media.");
      if (!wanted.has(entry.name.slice(0, -4))) removes.push(entry.name);
    }
  return { writes, removes };
}
export async function applyMedia(dir, plan) {
  await mkdir(dir, { recursive: true });
  for (const [id, bytes] of plan.writes)
    await writeFile(join(dir, id + ".jpg"), bytes, { flag: "wx" });
  for (const name of plan.removes) await unlink(join(dir, name));
}
