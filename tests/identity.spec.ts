import { test as base, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const test = base.extend<{ cleanPage: void }>({
  cleanPage: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      await use();
      expect(errors).toEqual([]);
    },
    { auto: true },
  ],
});
// Layout and content must also work without a GPU; the real renderer has a dedicated test below.
async function posterMode(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      ...args: unknown[]
    ) {
      if (args[0] === "webgl2") return null;
      return Reflect.apply(original, this, args);
    } as typeof original;
  });
}

test("Настоящая 3D-сцена: каркас, вращение, просмотр и экспорт PNG", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".viewport").first()).toHaveAttribute(
    "data-state",
    "ready",
  );
  const scene = page.locator(".scene-host").first();
  const initial = await scene.screenshot();
  await scene.focus();
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(180);
  expect((await scene.screenshot()).equals(initial)).toBe(false);
  await page
    .getByRole("button", { name: "Показать каркас", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Показать материал" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Развернуть 3D-сцену" }).click();
  const d = page.getByRole("dialog");
  await expect(d.locator(".viewport")).toHaveAttribute("data-state", "ready");
  const wait = page.waitForEvent("download");
  await d.getByRole("button", { name: "Сохранить изображение" }).click();
  expect((await wait).suggestedFilename()).toBe("charon-artifact.png");
  await page.keyboard.press("Escape");
  await expect(d).toHaveCount(0);
});
test("Проектный архив: все семь досье, честные статусы, горизонтальная навигация", async ({
  page,
}) => {
  await posterMode(page);
  await page.goto("/");
  await page.getByRole("link", { name: "Мои проекты", exact: true }).click();
  await expect(page).toHaveURL(/#projects$/);
  const cards = page.locator(".project-card");
  await expect(cards).toHaveCount(7);
  await expect(
    page.getByRole("button", { name: "Предыдущий проект", exact: true }),
  ).toBeDisabled();
  for (let i = 0; i < 7; i++) {
    const name = await cards.nth(i).locator("h3").innerText();
    await cards.nth(i).getByRole("button").click();
    await expect(
      page.getByRole("dialog").getByRole("heading", { name, exact: true }),
    ).toBeVisible();
    if (i === 1)
      await expect(page.locator("dialog .project-status")).toHaveText(
        "Концепция",
      );
    await page.keyboard.press("Escape");
  }
  await expect(
    page.getByRole("button", { name: "Следующий проект", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Предыдущий проект", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Следующий проект", exact: true }),
  ).toBeEnabled();
});
test("Профиль, интерактивные направления, семь орбит и исследовательские заметки", async ({
  page,
}) => {
  await posterMode(page);
  await page.goto("/");
  await page
    .getByRole("tab", { name: "Digital Products", exact: true })
    .click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "Начинаю с конкретной задачи",
  );
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Creative Development", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  const nodes = page.locator(".orbit-node");
  await expect(nodes).toHaveCount(7);
  for (let i = 0; i < 7; i++) {
    await nodes.nth(i).click();
    await expect(nodes.nth(i)).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".inspector-kicker")).toContainText(
      "0" + (i + 1),
    );
  }
  const fields = page.locator(".interest-card");
  for (let i = 0; i < 7; i++) {
    await fields.nth(i).click();
    await expect(page.locator("dialog .study-art")).toBeVisible();
    await page.getByRole("button", { name: "Закрыть окно" }).click();
  }
});
test("Настройки сохраняются локально; контакты не выдуманы и корректно валидируются", async ({
  page,
}) => {
  await posterMode(page);
  await page.goto("/");
  await expect(page.locator("a.contact-channel")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Настройки пространства", exact: true })
    .click();
  await page.getByRole("button", { name: "Серебро", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("switch", { name: "Интерактивный курсор" }).click();
  await page
    .getByRole("button", { name: "Профиль и контакты", exact: true })
    .click();
  await page.getByLabel("Имя или псевдоним").fill("Preview identity");
  await page
    .getByLabel("Telegram", { exact: true })
    .fill("https://example.org/test");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Проверьте ссылку");
  await page.getByLabel("Telegram", { exact: true }).fill("");
  await page.getByLabel("Email", { exact: true }).fill("preview@example.org");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Сохранено", exact: true }),
  ).toBeVisible();
  const wait = page.waitForEvent("download");
  await page.getByRole("button", { name: "JSON", exact: true }).click();
  expect((await wait).suggestedFilename()).toBe("identity.json");
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(page.locator(".id-name")).toHaveText("Preview identity");
  await expect(page.locator(".hero-author")).toHaveText("Preview identity");
  await expect(page.locator("a.contact-channel")).toHaveAttribute(
    "href",
    "mailto:preview@example.org",
  );
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page
    .getByRole("button", { name: "Редактировать профиль", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Вернуть опубликованный профиль" })
    .click();
  await expect(page.locator(".id-name")).toHaveText("Charon");
});
test("Мобильное меню, компоновка 320–1920 px, отсутствие горизонтального переполнения", async ({
  page,
}) => {
  await posterMode(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Открыть меню" }).click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: /Контакты/ })
    .click();
  await expect(page).toHaveURL(/#contacts$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  for (const width of [
    320, 360, 390, 430, 640, 768, 900, 1024, 1280, 1440, 1920,
  ]) {
    await page.setViewportSize({ width, height: 860 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
      `width ${width}`,
    ).toBeLessThanOrEqual(1);
  }
});
test("Без WebGL, reduced motion и доступность в обеих темах", async ({
  page,
}) => {
  await posterMode(page);
  await page.goto("/");
  await expect(page.locator(".viewport").first()).toHaveAttribute(
    "data-state",
    "poster",
  );
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  await expect(page.locator(".artifact-poster")).toBeVisible();
  expect(
    await page
      .locator(".artifact-poster")
      .evaluate((im: HTMLImageElement) => im.naturalWidth),
  ).toBeGreaterThan(800);
  for (const theme of ["dark", "light"]) {
    if (theme === "light") {
      await page
        .getByRole("button", { name: "Настройки пространства", exact: true })
        .click();
      await page.getByRole("button", { name: "Серебро", exact: true }).click();
      await page.keyboard.press("Escape");
    }
    const report = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      report.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
  }
});
