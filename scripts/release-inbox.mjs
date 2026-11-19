import { FILE_LIMIT, bundleName } from "../shared/edition.mjs";
export async function readBundle(response) {
  if (
    !response.ok ||
    !response.body ||
    Number(response.headers.get("content-length") || 0) > FILE_LIMIT
  )
    throw new Error("Файл обновления недоступен или слишком велик.");
  const chunks = [];
  let length = 0;
  for await (const chunk of response.body) {
    length += chunk.byteLength;
    if (length > FILE_LIMIT) throw new Error("Превышен размер файла.");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks, length).toString("utf8"));
}
// Only an asset of an UNPUBLISHED release in this repository; no user-supplied URLs.
export async function fromDraft(name, repository, token, request = fetch) {
  if (
    !/^charon-[a-f0-9]{16}\.json$/.test(name) ||
    !token ||
    repository !== "DimaCharon/Site_Charon"
  )
    throw new Error("Неверное имя файла или репозиторий.");
  const root = "https://api.github.com/repos/" + repository,
    headers = {
      Authorization: "Bearer " + token,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
  const get = (url, h = headers) =>
    request(url, {
      headers: h,
      redirect: "manual",
      signal: AbortSignal.timeout(60_000),
    });
  let asset;
  for (let page = 1; page <= 5 && !asset; page++) {
    const r = await get(`${root}/releases?per_page=100&page=${page}`);
    if (!r.ok)
      throw new Error("Не удалось получить список черновиков релизов.");
    const list = await r.json();
    for (const rel of list)
      if (rel.draft === true) {
        asset = rel.assets.find(
          (a) => a.name === name && a.state === "uploaded",
        );
        if (asset) break;
      }
    if (list.length < 100) break;
  }
  if (
    !asset ||
    !Number.isSafeInteger(asset.id) ||
    asset.id < 1 ||
    !Number.isSafeInteger(asset.size) ||
    asset.size < 1 ||
    asset.size > FILE_LIMIT
  )
    throw new Error(
      "В черновиках релизов не найден файл подходящего размера. Сохраните черновик, проверьте имя и повторите.",
    );
  let download = await get(`${root}/releases/assets/${asset.id}`, {
    ...headers,
    Accept: "application/octet-stream",
  });
  if (download.status === 302 || download.status === 307) {
    const u = new URL(download.headers.get("location"));
    if (
      u.protocol !== "https:" ||
      !u.hostname.endsWith(".githubusercontent.com") ||
      u.username ||
      u.password ||
      u.port
    )
      throw new Error("Неожиданный адрес хранилища.");
    download = await get(u.href, {});
  }
  const obj = await readBundle(download);
  if (
    !obj ||
    typeof obj !== "object" ||
    Object.keys(obj).sort().join(",") !== "images,packet" ||
    typeof obj.packet !== "string" ||
    bundleName(obj.packet) !== name
  )
    throw new Error("Имя или структура комплекта не совпадает.");
  return obj;
}
