import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

let browser;
const url = process.env.V40_URL;
const observation = JSON.parse(await readFile(new URL("../public/status.json", import.meta.url), "utf8"));
before(async () => {
  browser = await chromium.launch({
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" }),
    headless: true,
  });
});
after(async () => {
  await browser?.close();
});

async function visit(t, options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...options });
  t.after(() => context.close());
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  t.after(() => assert.deepEqual(errors, []));
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  return page;
}

test("Continuum's three forms and manual rotation work with reduced motion and pause", async (t) => {
  for (const reducedMotion of ["reduce", "no-preference"]) {
    const page = await visit(t, { reducedMotion });
    if (reducedMotion === "no-preference") await page.locator("header [data-motion-toggle]").click();
    const canvas = page.locator("#hero-stars");
    await expect(canvas).toHaveAttribute("data-ready", "true");
    const frame = () => canvas.evaluate((c) => c.toDataURL());
    const forms = [];
    for (const label of ["Orbit", "Signal", "Constellation"]) {
      const control = page
        .getByRole("group", { name: "Light study form" })
        .getByRole("button", { name: label, exact: true });
      await control.click();
      await expect(control).toHaveAttribute("aria-pressed", "true");
      await expect(page.locator(".continuum-stage")).toHaveAttribute("data-scene", label.toLowerCase());
      const before = await frame();
      await page.waitForTimeout(200);
      assert.equal(await frame(), before, "the chosen form stays still while motion is off");
      forms.push(before);
    }
    assert.equal(new Set(forms).size, 3, "each form produces visibly different artwork");
    const before = await frame();
    await page.getByRole("button", { name: "Rotate the light study" }).click();
    assert.notEqual(await frame(), before, "manual rotation changes the selected form without enabling animation");
    await expect(page.locator("header [data-motion-toggle]")).toHaveAccessibleName("Resume motion");
    assert.equal(await page.locator("#cinema-video").count(), 0);
  }
});

test("Continuum phone controls and the observation desk fit narrow touch screens", async (t) => {
  for (const width of [320, 390]) {
    const page = await visit(t, {
      viewport: { width, height: 844 },
      isMobile: true,
      hasTouch: true,
      reducedMotion: "reduce",
    });
    const controls = page.locator(".continuum-scene-controls button, .continuum-stage-bottom button");
    for (const control of await controls.all()) {
      const box = await control.boundingBox();
      assert.ok(box.width >= 44 && box.height >= 44);
      assert.ok(box.x >= 0 && box.x + box.width <= width);
      await control.click();
    }
    await expect(page.locator(".continuum-readings dd")).toHaveText(
      [
        observation.cluster.hostsOnline,
        observation.containers.running,
        observation.virtualMachines.running,
        observation.backup.latestVerified,
      ].map(String),
    );
    await expect(page.locator(".continuum-observation-date")).toContainText(observation.verifiedLong);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    const audit = await new AxeBuilder({ page }).include("#top").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    assert.deepEqual(
      audit.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
      [],
    );
  }
});

test("Continuum keeps a complete static illustration and content when scripts are unavailable", async (t) => {
  const page = await visit(t, { javaScriptEnabled: false });
  await expect(page.locator(".continuum-still")).toBeVisible();
  assert.equal(await page.locator(".continuum-still").evaluate((n) => getComputedStyle(n).opacity), "1");
  await expect(page.locator("#top h1")).toHaveText("The machines can think. You still decide.");
  await expect(page.locator(".aurum-manifesto")).toHaveText("Imagination, with intention.");
  await expect(page.locator(".continuum-observation-date")).toContainText(observation.verifiedLong);
  await expect(page.locator("#eagle-film h2")).toHaveText("House Cashio: The Trailer");
  await expect(page.locator(".atlas-destination:visible")).toHaveCount(4);
  for (const button of await page.locator(".continuum-scene-controls button, .continuum-stage-bottom button").all())
    await expect(button).toBeDisabled();
});

test("Signature Flight visibly approaches the original artwork and freezes with pause, offscreen and dialog state", async (t) => {
  const page = await visit(t, { reducedMotion: "no-preference" });
  const camera = page.locator(".hero-flight-camera");
  const view = () => camera.evaluate((el) => getComputedStyle(el).transform);
  await expect(page.locator(".hero-live-poster")).toHaveAttribute("src", "/v41/first-light-observatory-1920.webp");
  const original = await view();
  await expect.poll(view).not.toBe(original);
  await page.locator("header [data-motion-toggle]").click();
  const paused = await view();
  await page.waitForTimeout(350);
  assert.equal(await view(), paused, "pause stops the camera as well as the foreground stars");
  const control = page.getByRole("button", { name: /^(Fly closer to|Pull back from) the horizon$/ });
  await control.click();
  await expect(control).toHaveAttribute("aria-pressed", "true");
  await expect(control).toHaveAccessibleName("Pull back from the horizon");
  assert.notEqual(await view(), paused, "manual close framing still works without animation");
  const close = await view();
  await page.waitForTimeout(250);
  assert.equal(await view(), close);
  await page.locator("header [data-motion-toggle]").click();
  await expect.poll(view).not.toBe(close);
  await page.locator("#contact").scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  const away = await view();
  await page.waitForTimeout(350);
  assert.equal(await view(), away, "the camera does no offscreen work");
  await page.locator("#top").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Plot a course", exact: true }).click();
  const covered = await view();
  await page.waitForTimeout(350);
  assert.equal(await view(), covered, "the camera freezes behind the Discovery dialog");
  await page.keyboard.press("Escape");
  await expect.poll(view).not.toBe(covered);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("header [data-motion-toggle]")).toHaveAccessibleName("Resume motion");
  const reduced = await view();
  await page.waitForTimeout(350);
  assert.equal(await view(), reduced);
});

test("Signature Flight keeps manual camera framing and the original hero usable on a reduced-motion phone", async (t) => {
  const page = await visit(t, {
    viewport: { width: 320, height: 740 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const camera = page.locator(".hero-flight-camera");
  const before = await camera.evaluate((el) => getComputedStyle(el).transform);
  const control = page.getByRole("button", { name: /^(Fly closer to|Pull back from) the horizon$/ });
  const box = await control.boundingBox();
  assert.ok(box.width >= 44 && box.height >= 44 && box.x >= 0 && box.x + box.width <= 320);
  await control.click();
  await expect(control).toHaveAccessibleName("Pull back from the horizon");
  const after = await camera.evaluate((el) => getComputedStyle(el).transform);
  assert.notEqual(after, before);
  await page.waitForTimeout(250);
  assert.equal(await camera.evaluate((el) => getComputedStyle(el).transform), after);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 320);
  await expect(page.locator("#top h1")).toHaveText("The machines can think. You still decide.");
});
