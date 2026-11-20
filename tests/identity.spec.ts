import { readFileSync } from "node:fs";
const publicIdentity = JSON.parse(readFileSync("public/identity.json", "utf8"));
import type { Content } from "../shared/content-schema.mjs";
const editorial: Content = JSON.parse(
  readFileSync("public/content.json", "utf8"),
);
const {
  copy: words,
  projects: archive,
  directions: dirs,
  interests: notes,
  worlds: orbits,
} = editorial;
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
    .getByRole("button", { name: words["studio.text16"], exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: words["studio.text15"] }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: words["studio.text24"] }).click();
  const d = page.getByRole("dialog");
  await expect(d.locator(".viewport")).toHaveAttribute("data-state", "ready");
  const wait = page.waitForEvent("download");
  await d.getByRole("button", { name: words["studio.text23"] }).click();
  expect((await wait).suggestedFilename()).toBe("charon-artifact.png");
  await page.keyboard.press("Escape");
  await expect(d).toHaveCount(0);
});
test("Проектный архив: опубликованные досье, честные статусы, горизонтальная навигация", async ({
  page,
}) => {
  await posterMode(page);
  await page.goto("/");
  await page
    .getByRole("link", { name: words["hero.primary"], exact: true })
    .click();
  await expect(page).toHaveURL(/#projects$/);
  const cards = page.locator(".project-card");
  test.setTimeout(45_000 + archive.length * 2600);
  await expect(cards).toHaveCount(archive.length);
  if (!archive.length) {
    await expect(page.locator(".empty-projects")).toHaveText(
      words["projects.empty"],
    );
    return;
  }
  await expect(
    page.getByRole("button", { name: words["projects.text07"], exact: true }),
  ).toBeDisabled();
  for (let i = 0; i < archive.length; i++) {
    const name = await cards.nth(i).locator("h3").innerText();
    await cards.nth(i).getByRole("button").click();
    await expect(
      page.getByRole("dialog").getByRole("heading", { name, exact: true }),
    ).toBeVisible();
    await expect(page.locator("dialog .project-status")).toHaveText(
      words[
        archive[i].status === "Концепция"
          ? "projects.concept"
          : archive[i].status === "Разработка"
            ? "projects.working"
            : "projects.active"
      ],
    );
    await page.keyboard.press("Escape");
  }
  await expect(
    page.getByRole("button", { name: words["projects.text08"], exact: true }),
  ).toBeDisabled();
  if (archive.length < 3) return;
  await page
    .getByRole("button", { name: words["projects.text07"], exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: words["projects.text08"], exact: true }),
  ).toBeEnabled();
});
test("Профиль, интерактивные направления, семь орбит и исследовательские заметки", async ({
  page,
}) => {
  await posterMode(page);
  await page.goto("/");
  await page.getByRole("tab", { name: dirs[1].title, exact: true }).click();
  await expect(page.getByRole("tabpanel")).toContainText(dirs[1].text);
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: dirs[2].title, exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page.locator('.desktop-nav a[data-nav="interests"]').click();
  const nodes = page.locator(".orbit-node");
  await expect(nodes).toHaveCount(7);
  for (let i = 0; i < 7; i++) {
    await nodes.nth(i).click();
    await expect(nodes.nth(i)).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".inspector-kicker")).toContainText(
      words["world.text04"] + (i + 1),
    );
  }
  const fields = page.locator(".interest-card");
  for (let i = 0; i < 7; i++) {
    await fields.nth(i).click();
    await expect(page.locator("dialog .study-art")).toBeVisible();
    await page.getByRole("button", { name: words["interface.text02"] }).click();
  }
});
test("Посетитель видит только опубликованный профиль, а личные настройки сохраняются", async ({
  page,
}) => {
  await posterMode(page);
  await page.addInitScript(() =>
    localStorage.setItem(
      "charon.profile.v2",
      JSON.stringify({
        name: "Legacy preview",
        contacts: {
          telegram: "",
          email: "preview@example.org",
          github: "",
          social: "",
        },
      }),
    ),
  );
  await page.goto("/");
  await expect(page.locator(".id-name")).toHaveText(publicIdentity.name);
  await expect(page.locator(".contact-channels button")).toHaveCount(0);
  await expect(page.locator(".identity-card button")).toHaveCount(0);
  await page
    .getByRole("button", { name: words["settings.title"], exact: true })
    .click();
  await expect(page.locator("dialog input")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Профиль и контакты", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: words["settings.text05"], exact: true })
    .click();
  await page.getByRole("switch", { name: words["settings.text10"] }).click();
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator(".id-name")).toHaveText(publicIdentity.name);
});
test("Мобильное меню, компоновка 320–1920 px, отсутствие горизонтального переполнения", async ({
  page,
}) => {
  await posterMode(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: words["nav.text03"] }).click();
  await page.getByRole("dialog").locator('nav a[href="#contacts"]').click();
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
        .getByRole("button", { name: words["settings.title"], exact: true })
        .click();
      await page
        .getByRole("button", { name: words["settings.text05"], exact: true })
        .click();
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

async function drag(
  page: import("@playwright/test").Page,
  selector: string,
  dx: number,
) {
  const node = page.locator(selector).first();
  await node.scrollIntoViewIfNeeded();
  const box = (await node.boundingBox())!;
  const x = box.x + box.width * (dx < 0 ? 0.74 : 0.26),
    y = box.y + box.height * 0.55;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + 2, { steps: 12 });
  await page.mouse.up();
}
test("Пять нажатий, пароль и изолированный черновик владельца", async ({
  page,
}) => {
  await posterMode(page);
  await page.goto("/");
  const trigger = page.locator("footer .owner-trigger");
  await trigger.scrollIntoViewIfNeeded();
  for (let i = 0; i < 4; i++) await trigger.click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await trigger.click();
  const pin = page.getByLabel("Код доступа", { exact: true });
  await expect(pin).toBeVisible();
  await pin.fill("incorrect");
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Неверный код");
  await expect(page.getByLabel("Имя или псевдоним")).toHaveCount(0);
  if (!process.env.CHARON_TEST_PIN) return;
  await pin.fill(process.env.CHARON_TEST_PIN);
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Панель владельца" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Профиль", exact: true }).click();
  await page.getByLabel("Имя или псевдоним").fill("Preview identity");
  await page
    .getByLabel("Telegram", { exact: true })
    .fill("https://example.org/preview");
  await page.getByRole("button", { name: "Подготовить публикацию" }).click();
  await expect(page.getByRole("alert")).toContainText("Проверьте ссылку");
  await page.getByLabel("Telegram", { exact: true }).fill("");
  await page.getByLabel("Email", { exact: true }).fill("preview@example.org");
  await page.getByRole("button", { name: "Подготовить публикацию" }).click();
  await expect(
    page.getByRole("heading", { name: "Подтверждение публикации" }),
  ).toBeVisible();
  const packet = await page
    .getByLabel("Пакет изменений", { exact: true })
    .inputValue();
  expect(packet).toMatch(/^CH2\./);
  const body = JSON.parse(
    Buffer.from(packet.split(".")[1], "base64url").toString(),
  );
  expect(body.patch.profile.name).toBe("Preview identity");
  expect(body.patch.profile.contacts.email).toBe("preview@example.org");
  await expect(
    page.getByRole("link", { name: "Открыть GitHub" }),
  ).toHaveAttribute("href", /actions\/workflows\/owner-profile\.yml$/);
  await page.keyboard.press("Escape");
  await expect(page.locator(".id-name")).toHaveText(publicIdentity.name);
  await page.reload();
  await expect(page.locator(".id-name")).toHaveText(publicIdentity.name);
  await expect(page.locator("a.contact-channel")).toHaveCount(
    Object.values(publicIdentity.contacts).filter(Boolean).length,
  );
});
test("Мышью листаются галерея, досье, направления, орбиты и заметки", async ({
  page,
}) => {
  await posterMode(page);
  await page.goto("/");
  if (archive.length >= 3) {
    await drag(page, ".project-rail", -190);
    await expect
      .poll(() => page.locator(".project-rail").evaluate((el) => el.scrollLeft))
      .toBeGreaterThan(100);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page
      .locator(".project-rail .project-card")
      .nth(1)
      .getByRole("button")
      .click();
    await drag(page, "dialog .product-art", -120);
    await expect(page.locator("dialog .modal-title")).toHaveText(
      archive[2].name,
    );
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("dialog .modal-title")).toHaveText(
      archive[1].name,
    );
    await page.keyboard.press("Escape");
  }
  await drag(page, ".field-note", -115);
  await expect(page.getByRole("tab", { name: dirs[1].title })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.goto("/journal/");
  await drag(page, ".atlas-stage", -115);
  await expect(page.locator(".inspector-content h3")).toHaveText(
    orbits[1].title,
  );
  await page.locator(".interest-card").first().click();
  await drag(page, "dialog .study-art", -120);
  await expect(page.locator("dialog .modal-title")).toHaveText(notes[1].title);
  await page.keyboard.press("Escape");
});
test("На сенсорном экране работают настоящие горизонтальные свайпы", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4173/");
  const cdp = await context.newCDPSession(page);
  const swipe = async (sel: string) => {
    const el = page.locator(sel).first();
    await el.scrollIntoViewIfNeeded();
    const r = (await el.boundingBox())!;
    const x = r.x + r.width * 0.8,
      y = r.y + r.height * 0.5;
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y }],
    });
    for (let i = 1; i <= 9; i++)
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: x - i * r.width * 0.058, y }],
      });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  };
  if (archive.length >= 2) {
    await swipe(".project-rail");
    await expect
      .poll(() => page.locator(".project-rail").evaluate((e) => e.scrollLeft))
      .toBeGreaterThan(100);
  }
  await page.locator('.footer-directory a[href="./journal/"]').tap();
  await swipe(".interest-wall");
  await expect
    .poll(() => page.locator(".interest-wall").evaluate((e) => e.scrollLeft))
    .toBeGreaterThan(80);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.locator(".interest-card").nth(1).tap();
  await swipe("dialog .study-art");
  await expect(page.locator("dialog .modal-title")).toHaveText(notes[2].title);
  await context.close();
});
