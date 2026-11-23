import { handleContact } from "../relay/worker.mjs";
import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  mkdtemp,
  readFile,
  writeFile,
  cp,
  mkdir,
  symlink,
  rm,
} from "node:fs/promises";
import { join, resolve } from "node:path";
import { execFile as exec } from "node:child_process";
import { promisify } from "node:util";
import { pbkdf2Sync } from "node:crypto";
import { pathToFileURL } from "node:url";
import { applyEdition } from "../scripts/apply-owner-packet.mjs";
import { loadPublished } from "../scripts/published-data.mjs";
import { bundleName } from "../shared/edition.mjs";
const run = promisify(exec),
  pin = process.env.CHARON_TEST_PIN;
const base = process.cwd();
function errorsOn(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (e) => {
    if (e.type() === "error") errors.push(e.text());
  });
  return errors;
}
async function openEditor(page: Page) {
  // The static footer is readable before React attaches its gesture listener.
  await expect(page.locator("html")).toHaveAttribute(
    "data-motion",
    /^(full|reduced)$/,
  );
  const b = page.locator(".owner-trigger");
  await b.scrollIntoViewIfNeeded();
  await b.click({ clickCount: 5, delay: 55 });
  await page.getByLabel("Код доступа", { exact: true }).fill(pin!);
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Панель владельца", exact: true }),
  ).toBeVisible();
  return page.getByRole("dialog");
}
async function workspace() {
  await mkdir(".cache", { recursive: true });
  const path = await mkdtemp(resolve(".cache/cms-render-"));
  for (const f of [
    "package.json",
    "src",
    "public",
    "shared",
    "scripts",
    "index.html",
    "vite.config.ts",
    "tsconfig.json",
  ])
    await cp(f, join(path, f), { recursive: true });
  await symlink(resolve("node_modules"), join(path, "node_modules"), "dir");
  return path;
}
async function routedPreview(context: BrowserContext, root: string) {
  const page = await context.newPage();
  await page.route("https://preview.test/Site_Charon/**", async (route) => {
    const path =
      new URL(route.request().url()).pathname.slice("/Site_Charon/".length) ||
      "index.html";
    await route.fulfill({
      path: join(root, "dist", path.endsWith("/") ? path + "index.html" : path),
    });
  });
  return page;
}
async function photoFixture(page: Page) {
  const s = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 1800;
    c.height = 1100;
    const ctx = c.getContext("2d")!,
      pixels = ctx.createImageData(c.width, c.height);
    let random = 702;
    for (let y = 0; y < c.height; y++)
      for (let x = 0; x < c.width; x++) {
        random = (Math.imul(random, 1664525) + 1013904223) >>> 0;
        const i = (y * c.width + x) * 4,
          light =
            31 +
            58 * (1 - x / c.width) +
            20 * Math.sin((x + y) * 0.004) +
            ((random >>> 25) / 127) * 24;
        pixels.data.set([light, light + 4, light + 12, 255], i);
      }
    ctx.putImageData(pixels, 0, 0);
    ctx.lineWidth = 3;
    for (let i = 0; i < 24; i++) {
      ctx.strokeStyle = i % 3 === 0 ? "#d3d2e4" : "#8c91ae";
      ctx.beginPath();
      ctx.ellipse(
        990,
        570,
        465 - i * 8,
        185 + i * 4,
        -0.52 + i * 0.018,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
    }
    return c.toDataURL("image/jpeg", 0.94).split(",")[1];
  });
  return {
    name: "studio-original.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.from(s, "base64"),
  };
}
async function checkNoGPU(page: Page) {
  await page.addInitScript(() => {
    const get = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      ...args: unknown[]
    ) {
      return args[0] === "webgl2" ? null : Reflect.apply(get, this, args);
    } as typeof get;
  });
}

test("Редактор → подписанный комплект с фото → сборка Pages и автономная страница для нового посетителя", async ({
  page,
  context,
}) => {
  test.skip(!pin, "Полный путь владельца требует CHARON_TEST_PIN.");
  test.setTimeout(150_000);
  const errors = errorsOn(page);
  page.setDefaultTimeout(9000);
  await checkNoGPU(page);
  await page.goto("/");
  const dlg = await openEditor(page);
  const { profile, content } = loadPublished(),
    current = { profile, content };
  const oldCount = content.projects.length;
  const dir = await workspace();
  try {
    await dlg
      .getByRole("button", { name: "Добавить проект", exact: true })
      .click();
    await dlg
      .getByLabel("Название проекта", { exact: true })
      .fill("Орбитальный этюд");
    await dlg
      .getByLabel("Краткое описание", { exact: true })
      .fill("Тестовая обложка в проектном архиве.");
    const external = "https://product.example.test/space?view=studio#start";
    const opened: string[] = [];
    await context.route("https://product.example.test/**", (r) => {
      opened.push(r.request().url());
      return r.fulfill({
        contentType: "text/html",
        body: "<title>Product destination</title>",
      });
    });
    const siteField = dlg.getByLabel("Сайт продукта", { exact: true });
    const sitePreview = dlg.locator(".cms-preview .product-site-link");
    await siteField.fill("not a URL");
    await expect(sitePreview).toHaveCount(0);
    await siteField.fill(external);
    await expect(sitePreview).toHaveAttribute("href", external);
    await siteField.fill("");
    await expect(sitePreview).toHaveCount(0);
    await siteField.fill(external);
    await dlg.getByLabel("Категория", { exact: true }).fill("VISUAL STUDY");
    await dlg.getByRole("button", { name: "Лёд", exact: true }).click();
    await dlg
      .getByLabel("Подпись на обложке", { exact: true })
      .fill("PLATE / 004");
    await dlg.locator("summary", { hasText: "Подробное досье" }).click();
    await dlg
      .getByLabel("Полное описание", { exact: true })
      .fill("Проверяем переход из карточки в досье.");
    await dlg.getByLabel("В фокусе проекта").fill("Композиция\nСвет");
    await dlg.getByLabel("Теги").fill("Студия\nЭтюд");
    await dlg
      .getByLabel("Статус", { exact: true })
      .selectOption("Активный проект");
    await dlg.locator("summary", { hasText: "Демо, цена и продажа" }).click();
    await dlg
      .getByLabel("Способ продажи", { exact: true })
      .selectOption("checkout");
    await dlg
      .getByLabel("Цена и валюта", { exact: true })
      .fill("1 900 ₽ · однократно");
    await dlg
      .getByLabel("HTTPS-ссылка покупки", { exact: true })
      .fill("https://example.org/checkout");
    await dlg
      .getByLabel("Условия доступа", { exact: true })
      .fill("Условия из тестовой копии.");
    await dlg.getByLabel("Демонстрация", { exact: true }).selectOption("lab");
    await dlg.locator("summary", { hasText: "Демо, цена и продажа" }).click();
    await dlg
      .getByLabel("Фотография проекта")
      .setInputFiles(await photoFixture(page));
    const preview = dlg.locator(".cms-preview");
    await expect(preview.locator(".project-cover")).toHaveAttribute(
      "src",
      /^data:image\/jpeg;base64,/,
    );
    await dlg
      .getByLabel("Описание фото для скринридера", { exact: true })
      .fill("Гравированные орбиты");
    await dlg
      .getByLabel("Кадрирование", { exact: true })
      .selectOption("contain");
    await dlg.getByLabel("По горизонтали", { exact: true }).fill("38");
    if (oldCount)
      await dlg
        .getByRole("button", { name: "Переместить раньше", exact: true })
        .click();
    const at = Math.max(0, oldCount - 1);
    await expect(preview.locator(".product-art")).toHaveClass(/material-ice/);
    await expect(preview.locator(".project-cover")).toHaveCSS(
      "object-position",
      "38% 50%",
    );
    await preview
      .getByRole("button", {
        name: content.copy["projects.more"] + " Орбитальный этюд",
        exact: true,
      })
      .click();
    await expect(preview).toContainText("Проверяем переход");
    await expect(preview.locator(".detail-list li")).toHaveCount(2);
    await preview.getByRole("button", { name: "К карточке" }).click();
    await mkdir(join(base, ".cache", "proofs"), { recursive: true });
    await dlg.locator(".cms-scroll").evaluate((e) => (e.scrollTop = 0));
    await dlg.screenshot({
      path: join(base, ".cache/proofs/project-studio.png"),
    });
    await dlg
      .getByRole("button", { name: "Тексты сайта", exact: true })
      .click();
    await dlg
      .getByLabel("Заголовок · первая строка", { exact: true })
      .fill("Студия на орбите");
    const group = dlg.getByLabel("Раздел сайта", { exact: true });
    await group.selectOption("nav");
    await dlg.getByLabel("Пункт меню · Проекты", { exact: true }).fill("Архив");
    await group.selectOption("about");
    await dlg.locator(".cms-disclosure summary").first().click();
    await dlg
      .getByLabel("Описание направления", { exact: true })
      .first()
      .fill("Новая запись направления.");
    await group.selectOption("world");
    await dlg.locator(".cms-disclosure summary").first().click();
    await dlg
      .getByLabel("Описание орбиты", { exact: true })
      .first()
      .fill("Новая подпись орбиты.");
    await group.selectOption("interests");
    await dlg.locator(".cms-disclosure summary").first().click();
    await dlg
      .getByLabel("Текст заметки", { exact: true })
      .first()
      .fill("Новая личная заметка.");
    await group.selectOption("seo");
    await dlg
      .getByLabel("Заголовок вкладки браузера", { exact: true })
      .fill("Орбита & Charon");
    await dlg
      .getByLabel("Поиск по всему сайту", { exact: true })
      .fill("Закрыть окно");
    await expect(
      dlg.getByLabel(/Окна и управление · Доступность · Закрыть окно/),
    ).toBeVisible();
    await expect(page.locator(".project-rail .project-card")).toHaveCount(
      oldCount,
    );
    await expect(page.locator("#hero-title")).not.toContainText(
      "Студия на орбите",
    );
    await dlg
      .getByRole("button", { name: "Подготовить публикацию", exact: true })
      .click();
    await expect(
      dlg.getByRole("heading", { name: "Подтверждение публикации" }),
    ).toBeVisible();
    const name = await dlg
      .getByLabel("Имя файла для GitHub", { exact: true })
      .inputValue();
    const dl = page.waitForEvent("download");
    await dlg.getByRole("button", { name: /Скачать файл публикации/ }).click();
    const downloaded = await dl;
    expect(downloaded.suggestedFilename()).toBe(name);
    const bundle = JSON.parse(
      await readFile((await downloaded.path())!, "utf8"),
    );
    expect(bundleName(bundle.packet)).toBe(name);
    expect(Object.values(bundle.images)[0]!.toString().length).toBeGreaterThan(
      8192,
    );
    const gate = JSON.parse(
      await readFile("src/config/owner-gate.json", "utf8"),
    );
    const request = {
      key: pbkdf2Sync(
        pin!,
        Buffer.from(gate.salt, "hex"),
        gate.iterations,
        32,
        "sha256",
      ).toString("hex"),
      owner: "DimaCharon",
      actor: "DimaCharon",
      initiator: "DimaCharon",
      repository: "DimaCharon/Site_Charon",
      ref: "refs/heads/main",
      event: "workflow_dispatch",
    };
    const { changed } = await applyEdition({
      current,
      ...bundle,
      request,
      root: join(dir, "public"),
    });
    expect(changed).toBe(true);
    await run(
      process.execPath,
      [
        resolve("node_modules/vite/bin/vite.js"),
        "build",
        "--logLevel",
        "error",
      ],
      { cwd: dir },
    );
    await run(process.execPath, ["scripts/standalone.mjs"], { cwd: dir });
    const live = await routedPreview(context, dir);
    const liveErrors = errorsOn(live);
    await checkNoGPU(live);
    await live.goto("https://preview.test/Site_Charon/");
    await expect(live).toHaveTitle("Орбита & Charon");
    await expect(live.locator("#hero-title")).toContainText("Студия на орбите");
    await expect(live.locator('.desktop-nav a[href="#projects"]')).toHaveText(
      "Архив",
    );
    await expect(live.locator(".field-note")).toContainText("Новая запись");
    const cards = live.locator(".project-rail .project-card");
    await expect(cards).toHaveCount(oldCount + 1);
    await expect(cards.nth(at).locator("h3")).toHaveText("Орбитальный этюд");
    await expect(cards.nth(at).locator(".product-site-link")).toHaveAttribute(
      "href",
      external,
    );
    const picture = cards.nth(at).getByAltText("Гравированные орбиты");
    await picture.scrollIntoViewIfNeeded();
    await expect(picture).toHaveAttribute("src", /media\/[a-f0-9]{64}\.jpg$/);
    await expect
      .poll(() => picture.evaluate((e: HTMLImageElement) => e.naturalWidth))
      .toBe(1440);
    await cards.nth(at).getByRole("button").click();
    await expect(live.locator("dialog .dossier-text")).toHaveText(
      "Проверяем переход из карточки в досье.",
    );
    await expect(live.locator("dialog .product-site-link")).toHaveAttribute(
      "href",
      external,
    );
    await live.keyboard.press("Escape");
    await live.locator(".catalog-hop").click();
    await live.setViewportSize({ width: 390, height: 844 });
    const row = live
      .locator(".shelf-row")
      .filter({
        has: live.getByRole("heading", {
          name: "Орбитальный этюд",
          exact: true,
        }),
      });
    const direct = row.locator(".product-site-link");
    await expect(direct).toHaveAttribute("href", external);
    await expect(direct).toHaveAttribute("rel", "noopener noreferrer");
    expect(opened).toEqual([]);
    const [dest] = await Promise.all([
      live.waitForEvent("popup"),
      direct.click(),
    ]);
    await expect(dest).toHaveURL(external);
    await expect(dest).toHaveTitle("Product destination");
    expect(await dest.evaluate(() => window.opener === null)).toBe(true);
    await dest.close();
    await row.locator(".shelf-title").click();
    await live.setViewportSize({ width: 1440, height: 960 });
    await expect(
      live.locator(".access-slip .product-site-link"),
    ).toHaveAttribute("href", external);
    await expect(live.locator(".access-slip .slip-price")).toHaveText(
      "1 900 ₽ · однократно",
    );
    await expect(
      live.getByRole("link", { name: content.copy["store.buy"] }),
    ).toHaveAttribute("href", "https://example.org/checkout");
    await expect(live.locator(".access-slip")).toContainText(
      "Условия из тестовой копии.",
    );
    await expect(live.locator(".sheet-object .project-cover")).toHaveAttribute(
      "src",
      /^\.\.\/\.\.\/media\//,
    );
    await live.locator('.desktop-nav a[data-nav="interests"]').click();
    await expect(live.locator(".inspector-content")).toContainText(
      "Новая подпись",
    );
    await live.locator(".interest-card").first().click();
    await expect(live.locator("dialog .dossier-text")).toHaveText(
      "Новая личная заметка.",
    );
    await live.close();
    expect(liveErrors).toEqual([]);
    const file = await context.newPage();
    const offErrors = errorsOn(file),
      requests: string[] = [];
    await file.route(/^https?:/, (r) => {
      requests.push(r.request().url());
      return r.abort();
    });
    await checkNoGPU(file);
    await file.goto(pathToFileURL(join(dir, "out/Charon.html")).href);
    await expect(file).toHaveTitle("Орбита & Charon");
    await expect(
      file
        .locator(".project-rail .project-card")
        .nth(at)
        .locator(".product-site-link"),
    ).toHaveAttribute("href", external);
    const embedded = file
      .locator(".project-rail .project-cover")
      .nth(content.projects.slice(0, at).filter((p: any) => p.cover).length);
    await embedded.scrollIntoViewIfNeeded();
    await expect(embedded).toHaveAttribute("src", /^data:image\/jpeg;base64,/);
    await expect
      .poll(() => embedded.evaluate((e: HTMLImageElement) => e.naturalWidth))
      .toBe(1440);
    expect(requests).toEqual([]);
    expect(offErrors).toEqual([]);
    await file.close();
    expect(errors).toEqual([]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("Мобильная админка: замена и сброс фото, удаление всех карточек, приватность и доступность", async ({
  page,
}) => {
  test.skip(!pin, "Требуется CHARON_TEST_PIN.");
  test.setTimeout(90_000);
  const errors = errorsOn(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const dlg = await openEditor(page),
    initial = await page.locator(".project-rail .project-card").count();
  const add = dlg.getByRole("button", { name: "Добавить проект", exact: true });
  await add.click();
  await dlg.getByLabel("Фотография проекта").setInputFiles({
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("not a photograph"),
  });
  await expect(dlg.getByRole("alert")).toContainText("JPEG, PNG или WebP");
  await dlg
    .getByLabel("Фотография проекта")
    .setInputFiles("public/art/identity.webp");
  const preview = dlg.locator(".cms-preview");
  await expect(preview.locator(".project-cover")).toHaveCount(1);
  const first = await preview.locator(".project-cover").getAttribute("src");
  await dlg
    .getByLabel("Фотография проекта")
    .setInputFiles(await photoFixture(page));
  await expect(preview.locator(".project-cover")).not.toHaveAttribute(
    "src",
    first!,
  );
  await dlg.getByRole("button", { name: "Убрать фото", exact: true }).click();
  await expect(preview.locator(".project-cover")).toHaveCount(0);
  await expect(preview.locator(".generative-art")).toBeVisible();
  await dlg.locator(".cms-scroll").evaluate((e) => (e.scrollTop = 0));
  await mkdir(".cache/proofs", { recursive: true });
  await dlg.screenshot({ path: ".cache/proofs/owner-mobile.png" });
  for (const w of [320, 390, 720, 1024]) {
    await page.setViewportSize({ width: w, height: 844 });
    expect(
      await dlg.evaluate((d) => d.scrollWidth - d.clientWidth),
    ).toBeLessThanOrEqual(1);
    expect(
      await dlg
        .locator(".cms-scroll")
        .evaluate((d) => d.scrollWidth - d.clientWidth),
    ).toBeLessThanOrEqual(1);
  }
  const report = await new AxeBuilder({ page })
    .include("dialog")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    report.violations.map((v) => [v.id, v.nodes.map((n) => n.target)]),
  ).toEqual([]);
  for (let n = initial + 1; n > 0; n--) {
    await dlg
      .getByRole("button", { name: "Удалить проект", exact: true })
      .click();
    await dlg
      .getByRole("button", { name: "Да, убрать карточку", exact: true })
      .click();
  }
  await expect(
    dlg.getByRole("heading", { name: "Пока нет карточек" }),
  ).toBeVisible();
  await expect(page.locator(".project-rail .project-card")).toHaveCount(
    initial,
  );
  if (initial) {
    await dlg
      .getByRole("button", { name: "Подготовить публикацию", exact: true })
      .click();
    const packet = await dlg
      .getByLabel("Пакет изменений", { exact: true })
      .inputValue();
    expect(
      JSON.parse(Buffer.from(packet.split(".")[1], "base64url").toString())
        .patch.projects,
    ).toEqual({ order: [], updates: [] });
    await dlg
      .getByRole("button", { name: "Вернуться к редактированию" })
      .click();
  }
  await add.click();
  await page.keyboard.press("Escape");
  await expect(
    dlg.getByRole("heading", { name: "Закрыть редактор?" }),
  ).toBeVisible();
  await dlg.getByRole("button", { name: "Выйти без сохранения" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.reload();
  await expect(page.locator(".project-rail .project-card")).toHaveCount(
    initial,
  );
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).filter((k) => /draft|content|media/.test(k)),
    ),
  ).toEqual([]);
  expect(errors).toEqual([]);
});

test("Пустая опубликованная галерея и изменённые подписи интерфейса не ломают навигацию", async ({
  page,
}) => {
  test.setTimeout(45_000);
  const dir = await workspace();
  try {
    const { content } = loadPublished();
    content.projects = [];
    Object.assign(content.copy, {
      "projects.empty": "Архив готовится к открытию",
      "footer.signature": "Личная цифровая подпись",
      "studio.text26": "Студия объекта",
      "settings.title": "Вид страницы",
      "settings.text03": "Выберите тему страницы.",
      "contacts.title1": "Есть вопрос",
      "contacts.title2": "о проекте?",
      "interface.text02": "Закрыть просмотр",
    });
    await writeFile(join(dir, "public/content.json"), JSON.stringify(content));
    await run(process.execPath, ["scripts/standalone.mjs"], { cwd: dir });
    const errors = errorsOn(page);
    await checkNoGPU(page);
    await page.goto(pathToFileURL(join(dir, "out/Charon.html")).href);
    await expect(page.locator(".project-rail .project-card")).toHaveCount(0);
    await expect(page.locator(".empty-projects")).toHaveText(
      "Архив готовится к открытию",
    );
    await expect(page.locator("#projects .rail-nav")).toHaveCount(0);
    await expect(page.locator("#projects .rail-bottom")).not.toBeVisible();
    await page.locator('.footer-directory a[href="#/contacts"]').click();
    await expect(page.locator("#contacts-title")).toHaveText(
      "Есть вопрос о проекте?",
    );
    await page
      .getByRole("button", { name: "Вид страницы", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toContainText(
      "Выберите тему страницы.",
    );
    await page
      .getByRole("button", { name: "Закрыть просмотр", exact: true })
      .click();
    const trigger = page.getByRole("button", {
      name: "Личная цифровая подпись",
      exact: true,
    });
    for (let i = 0; i < 5; i++) await trigger.click();
    await expect(page.getByLabel("Код доступа", { exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("Предложение по запросу в изолированной витрине ведёт в опубликованный контакт, а не в оплату", async ({
  context,
}) => {
  test.setTimeout(50_000);
  const dir = await workspace();
  try {
    const { content, profile } = loadPublished();
    profile.contacts = {
      telegram: "",
      email: "reader@example.org",
      github: "",
      social: "",
    };
    content.projects = [
      {
        id: "request-example",
        name: "Проверка запроса",
        category: "",
        status: "Разработка",
        art: "code",
        short: "Запрос в изолированной копии.",
        description: "",
        details: [],
        tags: [],
        cover: null,
        theme: "original",
        caption: "",
        offer: {
          audience: "",
          result: "",
          sale: "inquiry",
          price: "",
          terms: "Условия обсуждаются с автором.",
          buyUrl: "",
          demo: "link",
          demoUrl: "https://example.org/sample",
          docsUrl: "https://example.org/guide",
        },
      },
    ];
    await writeFile(join(dir, "public/identity.json"), JSON.stringify(profile));
    await writeFile(join(dir, "public/content.json"), JSON.stringify(content));
    await run(
      process.execPath,
      [
        resolve("node_modules/vite/bin/vite.js"),
        "build",
        "--logLevel",
        "error",
      ],
      { cwd: dir },
    );
    const p = await routedPreview(context, dir);
    const errors = errorsOn(p);
    await p.goto("https://preview.test/Site_Charon/products/request-example/");
    await expect(p.locator(".slip-actions .primary")).toHaveAttribute(
      "href",
      "mailto:reader@example.org?subject=" +
        encodeURIComponent(content.projects[0].name),
    );
    await expect(
      p.getByRole("link", { name: content.copy["store.buy"] }),
    ).toHaveCount(0);
    await expect(
      p.getByRole("link", { name: content.copy["store.demo"] }),
    ).toHaveAttribute("href", "https://example.org/sample");
    await expect(
      p.getByRole("link", { name: content.copy["store.docs"] }),
    ).toHaveAttribute("href", "https://example.org/guide");
    await p.locator("header .contact-nav").click();
    await expect(p.locator(".contact-channel")).toHaveCount(1);
    await expect(p.locator(".contact-channel")).toHaveAttribute(
      "href",
      "mailto:reader@example.org",
    );
    await p.close();
    expect(errors).toEqual([]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("Рабочий бриф → обработчик → подтверждённая доставка (изолированный Bot API); при ошибке данные не теряются", async ({
  context,
}) => {
  test.setTimeout(75_000);
  const dir = await workspace(),
    target = "https://brief.example.test/contact",
    site = "https://preview.test",
    w = loadPublished().content.copy;
  const messages: { text: string; chat_id: string }[] = [];
  let upstream: "ok" | "busy" | "unknown" = "busy",
    posts = 0;
  const limit = { limit: async () => ({ success: true }) };
  try {
    await writeFile(
      join(dir, "src/config/contact-delivery.json"),
      JSON.stringify({ endpoint: target }),
    );
    await run(
      process.execPath,
      [
        resolve("node_modules/vite/bin/vite.js"),
        "build",
        "--logLevel",
        "error",
      ],
      { cwd: dir },
    );
    const p = await routedPreview(context, dir);
    await p.route(target, async (route) => {
      const req = route.request();
      if (req.method() === "POST") posts++;
      const r = await handleContact(
        new Request(req.url(), {
          method: req.method(),
          headers: req.headers(),
          ...(req.method() === "POST" ? { body: req.postData() } : {}),
        }),
        {
          SITE_ORIGIN: site,
          TELEGRAM_BOT_TOKEN: "123456:" + "y".repeat(35),
          TELEGRAM_CHAT_ID: "123456",
          VISITOR_LIMIT: limit,
          INBOX_LIMIT: limit,
        },
        async (_url: string, opts: RequestInit) => {
          if (upstream === "busy") return new Response("", { status: 429 });
          if (upstream === "unknown") return Response.json({ ok: false });
          messages.push(JSON.parse(String(opts.body)));
          return Response.json({
            ok: true,
            result: { message_id: 15, chat: { id: 123456 } },
          });
        },
      );
      await route.fulfill({
        status: r.status,
        headers: Object.fromEntries(r.headers),
        body: await r.text(),
      });
    });
    await p.goto(site + "/Site_Charon/references/");
    await p.locator('[data-reference="identity-object"]').click();
    const send = p.getByRole("button", { name: w["brief.send"], exact: true }),
      status = p.locator(".brief-status");
    await send.click();
    await expect(p.locator("#brief-name")).toBeFocused();
    await p.locator("#brief-name").fill("Тест");
    await p.locator("#brief-brand").fill("Тестовая студия");
    await p.locator("#brief-task").fill("Сделай сайт, блядь");
    await send.click();
    await expect(p.locator("#err-task")).toHaveText(w["brief.errLanguage"]);
    expect(posts).toBe(0);
    await p.locator("#brief-task").fill("Собрать страницу с трёхмерным знаком.");
    await p.locator("#brief-reply").fill("bad");
    await send.click();
    await expect(p.locator("#brief-reply")).toBeFocused();
    await p.locator("#brief-reply").fill("@test_artist");
    await send.click();
    await expect(p.locator("#brief-consent")).toBeFocused();
    expect(posts).toBe(0);
    await p.locator("#brief-consent").check();
    await send.click();
    await expect(status).toHaveText(w["brief.errBusy"]);
    upstream = "unknown";
    await send.click();
    await expect(status).toHaveText(w["brief.errDelivery"]);
    await expect(p.locator("#brief-name")).toHaveValue("Тест");
    upstream = "ok";
    await send.click();
    await expect(
      p.getByRole("heading", { name: w["brief.received"], exact: true }),
    ).toBeVisible();
    await expect(p.locator(".sent-paper p")).toHaveCount(0);
    expect(messages).toHaveLength(1);
    expect(messages[0].text).toContain(
      "Референс: " + w["refs.identityTitle"] + " [identity-object]",
    );
    expect(messages[0].text).toContain("Бренд: Тестовая студия");
    expect(messages[0].text).toContain("@test_artist");
    await p
      .getByRole("button", { name: w["brief.again"], exact: true })
      .click();
    await expect(p.locator("#brief-name")).toHaveValue("");
    expect(await p.evaluate(() => JSON.stringify(localStorage))).not.toContain(
      "@test_artist",
    );
    await p.close();
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
