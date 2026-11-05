import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";

const url = process.env.V40_URL;
let browser;
before(async () => {
  assert.ok(url, "Set V40_URL to the built preview before running entrance checks.");
  browser = await chromium.launch({
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" }),
    headless: true,
  });
});
after(async () => browser?.close());

test("boarding before deferred startup returns keyboard focus to the exact reading-edition link", async (t) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 844 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  let releaseStartup;
  const startup = new Promise((resolve) => {
    releaseStartup = resolve;
  });
  t.after(async () => {
    releaseStartup();
    await context.close();
  });
  await page.route("**/assets/page-client-*.js", async (route) => {
    await startup;
    await route.continue();
  });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  const alternatives = page.getByRole("navigation", { name: "Other ways to begin" });
  const board = alternatives.getByRole("link", { name: /Board the starship/ });
  await page.locator("#top .tour-launch").focus();
  await page.keyboard.press("Tab");
  await expect(board).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#flight=board$/);
  assert.equal(await page.evaluate(() => !!window.cashioV40), false, "the original click precedes client startup");
  await expect(page.locator("#helios-flight")).toHaveCount(0);

  releaseStartup();
  const flight = page.locator("#helios-flight dialog");
  await expect(flight).toHaveAttribute("open", "");
  await expect(flight).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#helios-flight")).toHaveCount(0);
  await expect(board).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(alternatives.getByRole("link", { name: /Try an experiment/ })).toBeFocused();
});

test("the first invitation explains the journey and leaves manual routes readable and keyboard accessible", async (t) => {
  for (const [width, height] of [
    [1440, 844],
    [1280, 720],
    [390, 844],
    [320, 844],
  ]) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce" });
    t.after(() => context.close());
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(url, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);

    const hero = page.locator("#top");
    const tour = hero.locator(".tour-launch");
    const alternatives = hero.getByRole("navigation", { name: "Other ways to begin" });
    await expect(tour).toHaveAttribute("href", "#flight=tour");
    await expect(tour).toHaveAccessibleDescription("Four scenes. Sound off. Pause any time.");
    await expect(page.locator("#helios-flight")).toHaveCount(0);
    await expect(hero.getByRole("heading", { level: 1 })).toBeVisible();

    const layout = await hero.evaluate((node) => {
      const invitation = node.querySelector(".tour-launch");
      const expectations = node.querySelector("#tour-expectations");
      const choices = node.querySelector(".tour-alternatives");
      return {
        ordered:
          invitation.getBoundingClientRect().bottom <= expectations.getBoundingClientRect().top &&
          expectations.getBoundingClientRect().bottom <= choices.getBoundingClientRect().top,
        controls: [...node.querySelectorAll(".tour-launch, .tour-alternatives a")].map((link) => {
          const bounds = link.getBoundingClientRect();
          return {
            left: bounds.left,
            right: bounds.right,
            width: bounds.width,
            height: bounds.height,
            bottom: bounds.bottom,
            fits: link.scrollWidth <= link.clientWidth,
            descriptionSize: parseFloat(getComputedStyle(link.querySelector("small")).fontSize),
          };
        }),
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    assert.equal(layout.ordered, true, "the optional routes follow the tour and its expectations");
    assert.equal(layout.overflow, false);
    for (const control of layout.controls) {
      assert.ok(control.left >= 0 && control.right <= width && control.width >= 44 && control.height >= 44);
      assert.equal(control.fits, true, "entry labels must fit their visible hit areas");
      assert.ok(control.descriptionSize >= 14, "essential route explanations remain readable");
      if (width === 1280) assert.ok(control.bottom <= height, "all entry choices fit a short desktop's first view");
    }

    const board = alternatives.getByRole("link", { name: /Board the starship/ });
    await tour.focus();
    await page.keyboard.press("Tab");
    await expect(board).toBeFocused();
    await page.keyboard.press("Enter");
    const flight = page.locator("#helios-flight dialog");
    await expect(page).toHaveURL(/#flight=board$/);
    await expect(flight).toHaveAttribute("data-playback", "manual");
    // Rendering the dialog and opening its native modal happen in separate React phases.
    await expect(flight).toHaveAttribute("open", "");
    await expect(flight).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(board).toBeFocused();
    await page.keyboard.press("Tab");
    const experiment = alternatives.getByRole("link", { name: /Try an experiment/ });
    await expect(experiment).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#studies")).toBeInViewport();
    await expect(page.locator("#helios-flight")).toHaveCount(0);
    assert.deepEqual(errors, []);
    await context.close();
  }
});
