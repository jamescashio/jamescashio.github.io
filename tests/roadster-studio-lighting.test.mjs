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

async function openStudio(t, width = 1440, reducedMotion = "reduce") {
  const height = width === 320 ? 568 : width === 390 ? 844 : 1000;
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion });
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
  await page.goto(new URL("#roadster-studio", url).href, { waitUntil: "networkidle" });
  await page.locator(".roadster-cta").click();
  await expect(page.locator(".roadster-inspection")).toHaveAttribute("data-phase", "ready", { timeout: 30000 });
  return page;
}

async function still(page) {
  await page.waitForTimeout(120);
  const draws = await page.evaluate(() => window.roadsterDraws);
  await page.waitForTimeout(250);
  assert.equal(await page.evaluate(() => window.roadsterDraws), draws, "the Roadster does no idle drawing");
}

test("the studio light is visible, keyboard adjustable, and quiet with reduced motion", async (t) => {
  for (const width of [1440, 390, 320]) {
    const page = await openStudio(t, width);
    const canvas = page.locator(".roadster-inspection canvas");
    const slider = page.getByRole("slider", { name: "Move the light", exact: true });
    const requests = [];
    page.on("request", (request) => requests.push(request.url()));
    await expect(page.getByRole("button", { name: "Sweep light", exact: true })).toBeDisabled();
    await slider.focus();
    await page.evaluate(() => new Promise(requestAnimationFrame));
    if (width <= 390) {
      const visibility = await canvas.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const headerBottom = document.querySelector("header").getBoundingClientRect().bottom;
        const visible = Math.max(0, Math.min(rect.bottom, innerHeight) - Math.max(rect.top, headerBottom, 0));
        const slider = document.querySelector("#roadster-light-angle").getBoundingClientRect();
        return {
          fraction: visible / rect.height,
          viewport: { width: innerWidth, height: innerHeight },
          canvas: { top: rect.top, bottom: rect.bottom, height: rect.height },
          slider: { top: slider.top, bottom: slider.bottom },
          headerBottom,
        };
      });
      assert.ok(
        visibility.fraction >= 0.75,
        `at least three quarters of the Roadster stays visible while adjusting its light on a short phone: ${JSON.stringify(visibility)}`,
      );
      assert.ok(
        visibility.slider.top >= visibility.headerBottom && visibility.slider.bottom <= visibility.viewport.height,
        `the focused light control stays fully visible: ${JSON.stringify(visibility)}`,
      );
      for (const control of await page
        .locator(".roadster-lighting-controls input, .roadster-lighting-controls button")
        .all()) {
        const clearance = await control.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          const dock = document.querySelector("nav.journey-dock")?.getBoundingClientRect();
          const pointsClear = [0.2, 0.5, 0.8].every((x) =>
            [0.2, 0.5, 0.8].every((y) =>
              element.contains(document.elementFromPoint(rect.x + rect.width * x, rect.y + rect.height * y)),
            ),
          );
          return {
            pointsClear,
            label: element.getAttribute("aria-label") || element.textContent || element.id,
            top: rect.top,
            bottom: rect.bottom,
            dockTop: dock?.height ? dock.top : null,
          };
        });
        assert.equal(
          clearance.pointsClear,
          true,
          `the light and both actions remain clear of fixed navigation after framing: ${JSON.stringify(clearance)}`,
        );
      }
    }
    await slider.press("Home");
    await expect(slider).toHaveValue("-80");
    await expect(canvas).toHaveAttribute("data-light-angle", "-80");
    await canvas.scrollIntoViewIfNeeded();
    const leftLight = await canvas.screenshot();
    await slider.focus();
    await slider.press("End");
    await expect(slider).toHaveValue("80");
    await expect(canvas).toHaveAttribute("data-light-angle", "80");
    await canvas.scrollIntoViewIfNeeded();
    assert.notDeepEqual(
      await canvas.screenshot(),
      leftLight,
      "light position visibly changes the same original surfaces",
    );
    await slider.focus();
    await slider.press("ArrowLeft");
    await expect(slider).toHaveValue("79");
    await page.getByRole("button", { name: "Reset light", exact: true }).click();
    await expect(slider).toHaveValue("0");
    await still(page);
    if (width === 320) {
      await page.evaluate(() => window.scrollBy({ top: 100, behavior: "instant" }));
      const position = await slider.boundingBox();
      const scrollBeforeDrag = await page.evaluate(() => scrollY);
      await page.mouse.move(position.x + position.width / 2, position.y + position.height / 2);
      await page.mouse.down();
      await page.mouse.move(position.x + position.width - 5, position.y + position.height / 2);
      assert.equal(
        await page.evaluate(() => scrollY),
        scrollBeforeDrag,
        "the light control never moves under an active pointer drag",
      );
      await page.mouse.up();
    }
    await page
      .getByRole("group", { name: "Roadster rendering", exact: true })
      .getByRole("button", { name: "Blueprint", exact: true })
      .click();
    await expect(slider).toBeDisabled();
    await expect(page.locator("#roadster-light-help")).toContainText("Return to Studio");
    await page
      .getByRole("group", { name: "Roadster rendering", exact: true })
      .getByRole("button", { name: "Studio", exact: true })
      .click();
    await expect(slider).toBeEnabled();
    assert.ok(
      requests.every((request) => !/\.(?:hdr|exr|glb|gz)(?:$|\?)/.test(request)),
      "lighting needs no new model or image assets",
    );
    for (const control of await page.locator(".roadster-lighting button, .roadster-lighting input").all()) {
      const box = await control.boundingBox();
      assert.ok(box.width >= 44 && box.height >= 44 && box.x >= 0 && box.x + box.width <= width);
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
  }
});

test("a light sweep is finite and stops at its current angle on Stop, hidden, offscreen, or reduced motion", async (t) => {
  const page = await openStudio(t, 1440, "no-preference");
  const canvas = page.locator(".roadster-inspection canvas");
  const start = () => page.getByRole("button", { name: "Sweep light", exact: true }).click();
  await start();
  await expect(page.getByRole("button", { name: "Stop sweep", exact: true })).toBeVisible();
  await expect(page.locator(".roadster-lighting")).toHaveAttribute("data-sweeping", "false", { timeout: 6000 });
  await expect(canvas).toHaveAttribute("data-light-angle", "80");
  await still(page);
  await start();
  await expect.poll(() => canvas.getAttribute("data-light-angle")).not.toBe("80");
  await page.getByRole("button", { name: "Stop sweep", exact: true }).click();
  const stopped = await canvas.getAttribute("data-light-angle");
  await still(page);
  assert.equal(await canvas.getAttribute("data-light-angle"), stopped);
  await start();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const hidden = await canvas.getAttribute("data-light-angle");
  await expect(page.locator(".roadster-lighting")).toHaveAttribute("data-sweeping", "false");
  await still(page);
  await page.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  assert.equal(await canvas.getAttribute("data-light-angle"), hidden, "returning does not reset or restart the light");
  await start();
  await page.locator("#contact").scrollIntoViewIfNeeded();
  await expect(page.locator(".roadster-lighting")).toHaveAttribute("data-sweeping", "false");
  await still(page);
  await canvas.scrollIntoViewIfNeeded();
  await start();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".roadster-lighting")).toHaveAttribute("data-sweeping", "false");
  await expect(page.getByRole("button", { name: "Sweep light", exact: true })).toBeDisabled();
  await still(page);
});

test("component locators trace actual details, remain reachable after orbiting, and reset accessibly", async (t) => {
  for (const width of [1440, 320]) {
    const page = await openStudio(t, width);
    const canvas = page.locator(".roadster-inspection canvas");
    for (const [view, component] of [
      ["Body", "windshield"],
      ["Wheels", "wheel face"],
      ["Thrusters", "nozzle bank"],
    ]) {
      await page
        .getByRole("group", { name: "Inspect Roadster details" })
        .getByRole("button", { name: new RegExp(view) })
        .click();
      const locator = page.getByRole("button", { name: `Inspect ${component} detail`, exact: true });
      await locator.focus();
      await locator.press("Enter");
      await expect(locator).toHaveAttribute("aria-expanded", "true");
      await expect(canvas).toHaveAttribute("data-detail", view.toLowerCase());
      await expect(page.locator("#roadster-component-note")).toBeVisible();
      await canvas.focus();
      for (let turn = 0; turn < 13; turn++) await canvas.press("ArrowRight");
      await expect(locator).toBeVisible();
      await expect(locator).toBeEnabled();
      const box = await locator.boundingBox();
      assert.ok(box.width >= 44 && box.height >= 44 && box.x >= 0 && box.x + box.width <= width);
      await locator.press("Enter");
      await expect(locator).toHaveAttribute("aria-expanded", "false");
      await locator.press("Enter");
      await expect(locator).toHaveAttribute("data-anchored", "true");
      await still(page);
    }
    await page
      .getByRole("group", { name: "Roadster rendering", exact: true })
      .getByRole("button", { name: "Blueprint", exact: true })
      .click();
    await expect(page.locator("#roadster-component-note")).toBeVisible();
    const { violations } = await new AxeBuilder({ page }).include("#roadster-studio").analyze();
    assert.deepEqual(
      violations.map(({ id }) => id),
      [],
    );
    await canvas.focus();
    await canvas.press("Escape");
    await expect(page.locator(".roadster-cta")).toBeFocused();
    await still(page);
  }
});

test("one sweep click reframes an offscreen Roadster and starts the light immediately", async (t) => {
  const page = await openStudio(t, 320, "no-preference");
  const canvas = page.locator(".roadster-inspection canvas");
  await canvas.evaluate((element) =>
    window.scrollBy({ top: element.getBoundingClientRect().bottom + 8, behavior: "instant" }),
  );
  await expect.poll(async () => (await canvas.boundingBox()).y + (await canvas.boundingBox()).height).toBeLessThan(0);
  const trigger = page.getByRole("button", { name: "Sweep light", exact: true });
  const bounds = await trigger.boundingBox();
  assert.ok(
    bounds.y > 70 && bounds.y + bounds.height < 568,
    "the sweep control is already visible while the car is offscreen",
  );
  await trigger.click();
  await expect(page.locator(".roadster-lighting")).toHaveAttribute("data-sweeping", "true");
  await expect(canvas).toBeInViewport({ ratio: 0.75 });
  await expect.poll(() => canvas.getAttribute("data-light-angle")).not.toBe("0");
  await page.getByRole("button", { name: "Stop sweep", exact: true }).click();
  await still(page);
});
