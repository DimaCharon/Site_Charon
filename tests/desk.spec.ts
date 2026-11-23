import { test, expect } from "@playwright/test";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { loadPublished } from "../scripts/published-data.mjs";
const { content } = loadPublished(),
  w = content.copy;
test("Рабочий референс открывает отдельную форму с выбранным образцом, старые закладки совместимы", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('.desktop-nav [data-nav="references"]').click();
  await expect(page).toHaveURL(/\/references\/$/);
  const pick = page.locator('[data-reference="identity-object"]');
  await pick.click();
  await expect(page).toHaveURL(/\/contacts\/\?ref=identity-object$/);
  await expect(page.locator("#brief-reference")).toHaveValue("identity-object");
  await page.reload();
  await expect(page.locator("#brief-reference")).toHaveValue("identity-object");
  await page.goto("/contacts/?ref=not-published");
  await expect(page.locator("#brief-reference")).toHaveValue("");
  await page.goto("/#contacts");
  await expect(page).toHaveURL(/\/contacts\/$/);
});
test("Автономный бриф: переход с референса, сохранение файла, никаких POST или локального хранения персональных данных", async ({
  page,
}) => {
  test.skip(!existsSync("out/Charon.html"));
  const requests: string[] = [];
  await page.route(/^https?:/, (r) => {
    requests.push(r.request().url());
    return r.abort();
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(
    pathToFileURL(resolve("out/Charon.html")).href + "#/references",
  );
  await page.locator('[data-reference="orbit-atlas"]').click();
  await expect(page.locator("#brief-reference")).toHaveValue("orbit-atlas");
  await expect(
    page.getByRole("button", { name: w["brief.send"], exact: true }),
  ).toBeDisabled();
  await page.getByLabel(w["brief.name"], { exact: true }).fill("TestVisitor");
  await page.locator("#brief-task").fill("Нужна карта направлений.");
  await page.locator("#brief-reply").fill("reader@example.org");
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: w["brief.draft"] }).click();
  const f = await dl;
  expect(f.suggestedFilename()).toBe("charon-brief.txt");
  const text = await readFile((await f.path())!, "utf8");
  expect(text).toContain("TestVisitor");
  expect(text).toContain("reader@example.org");
  expect(text).toContain("[orbit-atlas]");
  await expect(page.getByRole("status")).toHaveText(w["brief.saved"]);
  await page.reload();
  await expect(page.locator("#brief-name")).toHaveValue("");
  expect(
    await page.evaluate(() =>
      [localStorage, sessionStorage].map((s) => JSON.stringify(s)).join(""),
    ),
  ).not.toContain("reader@example.org");
  expect(requests).toEqual([]);
});
test("Снег: выключен по умолчанию, запоминает выбор, не перехватывает клики и учитывает настройки движения", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/references/");
  const snow = page.locator(".snow-film"),
    settings = page.getByRole("button", {
      name: w["settings.title"],
      exact: true,
    }),
    sw = page.getByRole("switch", { name: w["settings.snow"], exact: true });
  await expect(snow).toHaveCount(0);
  const quick = page
    .locator("header")
    .getByRole("button", { name: w["settings.snow"], exact: true });
  await expect(quick).toHaveAttribute("aria-pressed", "false");
  await quick.click();
  await expect(quick).toHaveAttribute("aria-pressed", "true");
  await settings.click();
  await expect(sw).toHaveAttribute("aria-checked", "true");
  await sw.click();
  await expect(snow).toHaveCount(0);
  await sw.click();
  await page.keyboard.press("Escape");
  await expect(snow).toHaveCount(1);
  await expect(snow).toHaveCSS("pointer-events", "none");
  await expect(snow.locator('.snow-crystal img[src*="snowflake.png"]')).toHaveCount(8);
  const grains = snow.locator(".snow-dust i:visible");
  await expect(grains).toHaveCount(84);
  const near = await grains.evaluateAll(
    (nodes) =>
      nodes.filter((n) => {
        const css = getComputedStyle(n);
        return parseFloat(css.width) >= 3.8 && parseFloat(css.opacity) >= 0.78;
      }).length,
  );
  expect(near).toBeGreaterThan(10);
  await page.locator('[data-reference="orbit-atlas"]').click();
  await expect(snow).toHaveCount(1);
  await page.reload();
  await expect(snow).toHaveCount(1);
  await page.setViewportSize({ width: 900, height: 900 });
  await expect(grains).toHaveCount(54);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(grains).toHaveCount(36);
  await expect(quick).toBeInViewport();
  await quick.click();
  await expect(snow).toHaveCount(0);
  await quick.click();
  await expect(grains).toHaveCount(36);
  await page.locator("#brief-name").focus();
  await expect(snow).toHaveCSS("visibility", "visible");
  await page.locator("#brief-name").blur();
  await expect(snow).toHaveCSS("visibility", "visible");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(snow).toHaveCount(0);
  await expect(quick).toBeDisabled();
  await settings.click();
  await expect(sw).toBeDisabled();
  await page.keyboard.press("Escape");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(snow).toHaveCount(1);
  await settings.click();
  const motion = page.getByRole("switch", {
    name: w["settings.text09"],
    exact: true,
  });
  await motion.click();
  await expect(sw).toBeDisabled();
  await expect(snow).toHaveCount(0);
  await motion.click();
  await sw.click();
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(snow).toHaveCount(0);
});
