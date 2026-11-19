import { COVER_LIMIT, COVER_EDGE } from "../../shared/edition.mjs";
export type MediaBank = Record<string, string>; // metadata-free JPEGs, held in the unlocked session only.
export const previewPhoto = (images: MediaBank, hash?: string) =>
  hash && Object.hasOwn(images, hash)
    ? "data:image/jpeg;base64," + images[hash]
    : undefined;
export function toBase64(bytes: Uint8Array) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 16384)
    s += String.fromCharCode(...bytes.subarray(i, i + 16384));
  return btoa(s);
}
export const toHex = (bytes: ArrayBuffer) =>
  Array.from(new Uint8Array(bytes), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
async function encode(canvas: HTMLCanvasElement, q: number) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) =>
        b?.type === "image/jpeg"
          ? resolve(b)
          : reject(new Error("Не удалось сохранить обложку.")),
      "image/jpeg",
      q,
    ),
  );
}
// Browsers may attach ICC or camera metadata. Keep only the JPEG codec stream in the publication.
function stripMetadata(raw: ArrayBuffer): Uint8Array<ArrayBuffer> {
  const b = new Uint8Array(raw),
    parts = [b.subarray(0, 2)];
  let offset = 2;
  while (offset + 4 <= b.length) {
    if (b[offset] !== 255) break;
    const mark = b[offset + 1];
    if (mark === 0xda) {
      parts.push(b.subarray(offset));
      const out = new Uint8Array(parts.reduce((n, v) => n + v.length, 0));
      let i = 0;
      for (const p of parts) {
        out.set(p, i);
        i += p.length;
      }
      return out;
    }
    const end = offset + 2 + (b[offset + 2] * 256 + b[offset + 3]);
    if (end <= offset + 3 || end > b.length) break;
    if ((mark < 0xe0 || mark > 0xef) && mark !== 0xfe)
      parts.push(b.subarray(offset, end));
    offset = end;
  }
  throw new Error("Браузер вернул неподдерживаемое изображение.");
}
export async function processPhoto(file: File) {
  if (!file.size || file.size > 16 * 1024 * 1024)
    throw new Error("Выберите фотографию до 16 МБ.");
  const h = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const jpeg = h[0] === 255 && h[1] === 216 && h[2] === 255,
    png = h[0] === 137 && String.fromCharCode(...h.slice(1, 4)) === "PNG",
    webp =
      String.fromCharCode(...h.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...h.slice(8, 12)) === "WEBP";
  if (!jpeg && !png && !webp)
    throw new Error("Нужна фотография в формате JPEG, PNG или WebP.");
  const url = URL.createObjectURL(file),
    img = new Image();
  try {
    img.src = url;
    await img.decode().catch(() => {
      throw new Error(
        "Не удалось прочитать изображение. Выберите другой файл.",
      );
    });
    if (
      !img.naturalWidth ||
      !img.naturalHeight ||
      img.naturalWidth * img.naturalHeight > 52_000_000
    )
      throw new Error("Слишком большое разрешение фото (максимум 52 Мп).");
    const canvas = document.createElement("canvas"),
      ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Браузер не поддерживает обработку фото.");
    let scale = Math.min(
      1,
      COVER_EDGE / Math.max(img.naturalWidth, img.naturalHeight),
    );
    for (let attempt = 0; attempt < 4; attempt++, scale *= 0.76) {
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      ctx.fillStyle = "#202126";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      for (const q of [0.86, 0.74, 0.61]) {
        const b = await encode(canvas, q);
        if (b.size > COVER_LIMIT) continue;
        const raw = stripMetadata(await b.arrayBuffer());
        return {
          hash: toHex(await crypto.subtle.digest("SHA-256", raw)),
          base64: toBase64(raw),
          width: canvas.width,
          height: canvas.height,
        };
      }
    }
    throw new Error(
      "Не удалось уменьшить фото до 256 КиБ. Выберите другой кадр.",
    );
  } finally {
    URL.revokeObjectURL(url);
    img.removeAttribute("src");
  }
}
