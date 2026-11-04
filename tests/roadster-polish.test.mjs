import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const url = process.env.V40_URL;
let browser;
before(async () => {
  browser = await chromium.launch({
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" }),
    headless: true,
  });
});
after(async () => browser?.close());

async function visit(t, width, hash = "#roadster-studio") {
  const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
  t.after(() => context.close());
  await context.addInitScript(() => {
    window.roadsterDraws = 0;
    for (const Context of [WebGLRenderingContext, WebGL2RenderingContext]) {
      for (const method of ["drawElements", "drawArrays"]) {
        const original = Context.prototype[method];
        Context.prototype[method] = function (...args) {
          if (this.canvas.closest?.(".roadster-inspection")) window.roadsterDraws++;
          return original.apply(this, args);
        };
      }
    }
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  t.after(() => assert.deepEqual(errors, []));
  await page.goto(new URL(hash, url).href, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  return page;
}

async function artwork(page) {
  const bounds = await page.locator(".roadster-inspection canvas").boundingBox();
  return page.screenshot({
    clip: { x: bounds.x + 8, y: bounds.y + 80, width: bounds.width - 16, height: bounds.height - 160 },
    animations: "disabled",
  });
}

test("Blueprint reveals the same Roadster on request, restores its finish, and stays still", async (t) => {
  for (const width of [1440, 320]) {
    const page = await visit(t, width);
    await page.locator(".roadster-cta").click();
    const inspection = page.locator(".roadster-inspection");
    await expect(inspection).toHaveAttribute("data-phase", "ready", { timeout: 30000 });
    const appearance = page.getByRole("group", { name: "Roadster rendering", exact: true });
    const requests = [];
    page.on("request", (request) => requests.push(request.url()));
    const studio = await artwork(page);
    const before = await page.evaluate(() => window.roadsterDraws);
    await appearance.getByRole("button", { name: "Blueprint", exact: true }).click();
    await expect(inspection).toHaveAttribute("data-finish", "blueprint");
    await expect.poll(() => page.evaluate(() => window.roadsterDraws)).toBeGreaterThan(before);
    await expect(page.locator(".roadster-concept-note")).toContainText("not a manufacturing drawing");
    await inspection.scrollIntoViewIfNeeded();
    const outline = await artwork(page);
    assert.notDeepEqual(outline, studio, "the original model gains a visibly different outline rendering");
    const settled = await page.evaluate(() => window.roadsterDraws);
    await page.waitForTimeout(400);
    assert.equal(await page.evaluate(() => window.roadsterDraws), settled, "blueprint has no idle drawing loop");
    for (const label of ["Body", "Wheels", "Thrusters"]) {
      const control = page
        .getByRole("group", { name: "Inspect Roadster details" })
        .getByRole("button", { name: new RegExp(label) });
      await control.focus();
      await control.press("Enter");
      await expect(control).toHaveAttribute("aria-pressed", "true");
      await expect(inspection).toHaveAttribute("data-finish", "blueprint");
    }
    await appearance.getByRole("button", { name: "Studio", exact: true }).click();
    await expect(inspection).toHaveAttribute("data-finish", "studio");
    await expect(page.locator(".roadster-concept-note")).toHaveCount(0);
    assert.ok(
      requests.every((request) => !/\.(glb|gz|hdr|exr)(?:$|\?)/.test(request)),
      "appearance changes request no model or environment assets",
    );
    for (const button of await appearance.locator("button").all()) {
      const box = await button.boundingBox();
      assert.ok(box.width >= 44 && box.height >= 44 && box.x >= 0 && box.x + box.width <= width);
    }
    const { violations } = await new AxeBuilder({ page }).include("#roadster-studio").analyze();
    assert.deepEqual(
      violations.map(({ id }) => id),
      [],
    );
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    await page.locator(".roadster-inspection canvas").focus();
    await page.keyboard.press("Escape");
    await expect(inspection).toHaveCount(0);
    await expect(page.locator(".roadster-cta")).toBeFocused();
    const closed = await page.evaluate(() => window.roadsterDraws);
    await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => window.roadsterDraws), closed, "closing releases the active renderer");
  }
});

test("the Roadster destination link never shares the following collection's hit area", async (t) => {
  const page = await visit(t, 412, "#top");
  for (const width of [412, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.locator("#top").scrollIntoViewIfNeeded();
    const separated = await page.locator(".roadster-caption > a").evaluate((link) => {
      const next = document.querySelector("#films-collection > summary");
      return link.getBoundingClientRect().bottom <= next.getBoundingClientRect().top;
    });
    assert.equal(separated, true, "the offscreen section reserves the full link footprint");
    const link = page.locator(".roadster-caption > a");
    await link.scrollIntoViewIfNeeded();
    assert.equal(
      await link.evaluate((node) => {
        const rect = node.getBoundingClientRect();
        return [0.15, 0.5, 0.85].every((x) =>
          [0.15, 0.5, 0.85].every((y) =>
            node.contains(document.elementFromPoint(rect.x + rect.width * x, rect.y + rect.height * y)),
          ),
        );
      }),
      true,
      "the entire link stays clickable, including its edges",
    );
  }
});

test("a lost graphics context can be retried on a fresh Roadster canvas", async (t) => {
  const page = await visit(t, 1440);
  await page.locator(".roadster-cta").click();
  const inspection = page.locator(".roadster-inspection");
  await expect(inspection).toHaveAttribute("data-phase", "ready", { timeout: 30000 });
  await page
    .getByRole("group", { name: "Roadster rendering", exact: true })
    .getByRole("button", { name: "Blueprint", exact: true })
    .click();
  const original = await inspection.locator("canvas").elementHandle();
  const canLoseContext = await original.evaluate((canvas) => {
    const extension = canvas.getContext("webgl2")?.getExtension("WEBGL_lose_context");
    if (!extension) return false;
    extension.loseContext();
    return true;
  });
  if (!canLoseContext) return t.skip("This browser does not expose context-loss simulation.");
  await expect(inspection).toHaveAttribute("data-phase", "error");
  await page.getByRole("button", { name: "Try 3D again", exact: true }).click();
  await expect(inspection).toHaveAttribute("data-phase", "ready", { timeout: 30000 });
  assert.equal(
    await original.evaluate((canvas) => canvas.isConnected),
    false,
    "Retry replaces the lost graphics surface",
  );
  await expect(inspection).toHaveAttribute("data-finish", "studio");
  await expect(inspection).toHaveAttribute("data-view", "body");
  const before = await page.evaluate(() => window.roadsterDraws);
  await inspection.locator("canvas").focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => page.evaluate(() => window.roadsterDraws)).toBeGreaterThan(before);
  await page.keyboard.press("Escape");
  await expect(page.locator(".roadster-cta")).toBeFocused();
});
