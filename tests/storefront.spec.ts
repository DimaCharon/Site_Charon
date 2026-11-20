import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync, existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { loadPublished } from "../scripts/published-data.mjs";
import { pageMeta, publishedPaths, publicOrigin } from "../shared/routes.mjs";
const { content, profile } = loadPublished(),
  w = content.copy;
test("Статика без JavaScript: индексируются реальные страницы, метаданные и ссылки в каталог", async ({
  browser,
}) => {
  const c = await browser.newContext({ javaScriptEnabled: false });
  const page = await c.newPage();
  const paths = publishedPaths(content),
    sitemap = readFileSync("dist/sitemap.xml", "utf8");
  for (const p of paths) {
    const str = readFileSync(resolve("dist", p, "index.html"), "utf8");
    expect(str).toContain("<h1");
    expect(str).toContain(
      '<link rel="canonical" href="' + publicOrigin + (p ? p + "/" : "") + '"',
    );
    expect(sitemap).toContain(
      "<loc>" + publicOrigin + (p ? p + "/" : "") + "</loc>",
    );
  }
  await page.goto("http://127.0.0.1:4173/products/");
  const cards = page.locator(".shelf-row");
  await expect(cards).toHaveCount(content.projects.length);
  if (content.projects.length) {
    const p = content.projects[0];
    await cards.first().click();
    await expect(page).toHaveTitle(
      pageMeta("products/" + p.id, content, profile).title,
    );
    await expect(page.locator("main h1")).toHaveText(p.name);
    await expect(page.locator(".brief-row").first()).toBeVisible();
  }
  await c.close();
});
test("Витрина → каталог → продукт: фильтры, отсутствие фиктивной оплаты, мобильные прямые ссылки", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator(".hero-actions .primary").click();
  await expect(page).toHaveURL(/#projects$/);
  await page.locator('.footer-directory a[href="./products/"]').click();
  const list = page.locator(".shelf-row"),
    field = page.getByRole("searchbox", { name: w["store.search"] });
  await expect(list).toHaveCount(content.projects.length);
  await field.fill("unlikely-нет-такого-результата-0011");
  await expect(list).toHaveCount(0);
  await expect(page.locator(".empty-projects")).toBeVisible();
  await page.getByRole("button", { name: w["store.reset"] }).click();
  await page
    .getByRole("button", { name: w["projects.concept"], exact: true })
    .click();
  await expect(list).toHaveCount(
    content.projects.filter((p: any) => p.status === "Концепция").length,
  );
  await page.getByRole("button", { name: w["store.all"], exact: true }).click();
  if (content.projects.length) {
    await list.first().click();
    await page.reload();
    const p = content.projects[0];
    await expect(page.locator("main h1")).toHaveText(p.name);
    await expect(
      page.getByRole("link", { name: w["store.buy"], exact: true }),
    ).toHaveCount(p.offer.sale === "checkout" ? 1 : 0);
  }
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
    ).toBeLessThanOrEqual(1);
  }
});
test("Демо без регистрации: изменение материала, рисунка и названия, экспорт настоящего PNG 1600×900", async ({
  page,
}) => {
  await page.goto("/lab/");
  await page
    .getByLabel(w["lab.titleInput"], { exact: true })
    .fill("Тест обложки");
  await page
    .getByRole("button", { name: w["lab.graphite"], exact: true })
    .click();
  await page.getByRole("combobox").selectOption("wave");
  await page.getByRole("slider", { name: w["lab.density"] }).fill("57");
  const poster = page.locator(".lab-proof svg.lab-poster");
  await expect(poster).toContainText("Тест обложки");
  await expect(poster).toContainText(w["lab.wave"]);
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: w["lab.save"] }).click();
  const f = await dl;
  expect(f.suggestedFilename()).toBe("charon-cover.png");
  const bytes = await readFile((await f.path())!);
  expect(bytes.subarray(1, 4).toString()).toBe("PNG");
  expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual([1600, 900]);
  await page.reload();
  await expect(
    page.getByLabel(w["lab.titleInput"], { exact: true }),
  ).toHaveValue(w["lab.sample"]);
});
test("Автономный файл: каталог, демо и возврат домой без единого сетевого обращения", async ({
  page,
}) => {
  test.skip(!existsSync("out/Charon.html"), "Сначала npm run standalone");
  const requests: string[] = [];
  await page.route(/^https?:/, (r) => {
    requests.push(r.request().url());
    return r.abort();
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(pathToFileURL(resolve("out/Charon.html")).href);
  await page.locator('.footer-directory a[href="#/products"]').click();
  await expect(page.locator("main h1")).toHaveText(w["store.catalog"]);
  if (content.projects.length) {
    await page.locator(".shelf-row").first().click();
    await expect(page.locator("main h1")).toHaveText(content.projects[0].name);
  }
  await page.locator('.footer-directory a[href="#/lab"]').click();
  await expect(page.locator("main h1")).toHaveText(w["lab.title"]);
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: w["lab.save"] }).click();
  const png = await readFile((await (await pending).path())!);
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1600, 900]);
  await page.locator("header .brand").click();
  await expect(page.locator(".hero")).toBeVisible();
  expect(requests).toEqual([]);
});
test("Доступность дополнительных страниц и мобильный макет", async ({
  page,
}) => {
  test.setTimeout(70_000);
  for (const path of [
    "products",
    "lab",
    "journal",
    "guide",
    "updates",
    ...content.projects.slice(0, 1).map((p: any) => "products/" + p.id),
    "journal/" + content.interests[0].kind,
  ]) {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/" + path + "/");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
      path,
    ).toBeLessThanOrEqual(1);
    const report = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      report.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
      path,
    ).toEqual([]);
  }
});
test("Старые закладки интересов и мира приводят на нужное место в журнале", async ({
  page,
}) => {
  for (const id of ["interests", "world"]) {
    await page.goto("/#" + id);
    await expect(page).toHaveURL(new RegExp("/journal/#" + id + "$"));
    await expect(page.locator("#" + id)).toBeInViewport();
  }
});
