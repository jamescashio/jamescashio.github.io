import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";

const output = process.argv[2] || "artifacts/chronos/hero-checks";
const base = process.env.V40_URL || "http://127.0.0.1:4392/";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
try {
  for (const [width, density, reduced, saveData, slowConnection] of [
    [320, 1, false, false],
    [390, 3, false, false],
    [834, 2, false, false],
    [1440, 1, false, false],
    [1440, 2, false, false],
    [1440, 3, false, false],
    [3440, 1, false, false],
    [3440, 2, false, false],
    [3440, 3, false, false],
    [1440, 1, true, false],
    [1440, 1, false, true],
    [1440, 1, false, false, true],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      deviceScaleFactor: density,
      reducedMotion: reduced ? "reduce" : "no-preference",
    });
    if (saveData || slowConnection)
      await context.addInitScript(
        ({ saveData, slowConnection }) =>
          Object.defineProperty(navigator, "connection", {
            value: {
              saveData,
              effectiveType: slowConnection ? "3g" : "4g",
              addEventListener() {},
              removeEventListener() {},
            },
          }),
        { saveData, slowConnection },
      );
    await context.addInitScript(() => {
      window.chronosWorkerFrames = 0;
      window.chronosWorkerCompleted = 0;
      const original = Worker.prototype.postMessage;
      Worker.prototype.postMessage = function (message, transfer) {
        if (message?.type === "init")
          this.addEventListener("message", ({ data }) => {
            if (data?.type === "frame") window.chronosWorkerCompleted++;
          });
        if (message?.type === "frame") window.chronosWorkerFrames++;
        return original.call(this, message, transfer);
      };
    });
    const page = await context.newPage();
    const errors = [],
      requests = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => {
      if (/living-hero|observatory-depth/.test(request.url())) requests.push(request.url());
    });
    await page.goto(base);
    await page.waitForFunction(() => window.cashioV40);
    const expected = width >= 1000 && !reduced && !saveData && !slowConnection;
    if (expected) await page.locator('[data-living-hero="ready"]').waitFor({ timeout: 15000 });
    await page.waitForTimeout(1800);
    const state = await page.evaluate(() => ({
      enhanced: !!document.querySelector('[data-living-hero="ready"]'),
      width: document.documentElement.scrollWidth,
      priority: document.querySelector(".hero-live-poster").fetchPriority,
      hidden: document.querySelector(".living-hero-canvas")?.getAttribute("aria-hidden"),
      frames: window.chronosWorkerFrames,
    }));
    assert.equal(state.enhanced, expected);
    assert.equal(state.width, width);
    assert.equal(state.priority, "high");
    assert.deepEqual(errors, []);
    if (expected) assert.equal(state.hidden, "true");
    else assert.equal(requests.length, 0);
    const label = `${width}-${density}x${reduced ? "-reduced" : ""}${saveData ? "-save-data" : ""}${slowConnection ? "-3g" : ""}`;
    await page.screenshot({ path: path.join(output, `${label}.png`) });
    const pauses = {};
    let cadence = null;
    if (expected && width === 1440 && density === 1) {
      cadence = await page.evaluate(async () => {
        const start = performance.now(),
          before = window.chronosWorkerCompleted;
        await new Promise((resolve) => setTimeout(resolve, 4000));
        const seconds = (performance.now() - start) / 1000;
        const frames = window.chronosWorkerCompleted - before;
        return { seconds, frames, framesPerSecond: frames / seconds };
      });
      assert.ok(cadence.framesPerSecond >= 55 && cadence.framesPerSecond <= 61, "approximately 60 Hz worker cadence");
      for (const reason of ["pause", "offscreen", "hidden"]) {
        await page.evaluate((reason) => {
          if (reason === "pause") {
            document.documentElement.dataset.motion = "off";
            document.dispatchEvent(new Event("cashio-motion"));
          } else if (reason === "offscreen") window.scrollTo(0, 3500);
          else {
            Object.defineProperty(document, "hidden", { configurable: true, value: true });
            document.dispatchEvent(new Event("visibilitychange"));
          }
        }, reason);
        await page.waitForTimeout(350);
        const before = await page.evaluate(() => window.chronosWorkerFrames);
        await page.waitForTimeout(350);
        const after = await page.evaluate(() => window.chronosWorkerFrames);
        assert.equal(after, before, reason);
        pauses[reason] = true;
        await page.evaluate(() => {
          delete document.hidden;
          window.scrollTo(0, 0);
          document.documentElement.dataset.motion = "on";
          document.dispatchEvent(new Event("cashio-motion"));
          document.dispatchEvent(new Event("visibilitychange"));
        });
        await page.waitForTimeout(350);
      }
    }
    results.push({ label, state, errors, requests, pauses, cadence });
    console.log(JSON.stringify({ label, enhanced: state.enhanced, pauses, cadence }));
    await context.close();
  }
} finally {
  await browser.close();
}
const fallbackBrowser = await chromium.launch({ channel: "chrome", headless: true, args: ["--disable-webgl"] });
try {
  const page = await fallbackBrowser.newPage({ viewport: { width: 1440, height: 900 } });
  // Chromium's disable-webgl flag does not disable OffscreenCanvas contexts.
  // Exercise the worker's unavailable-API path directly instead.
  await page.route("**/living-hero.worker-*.js", async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body: "OffscreenCanvas.prototype.getContext = () => null;\n" + (await response.text()),
    });
  });
  await page.goto(base);
  await page.waitForTimeout(5000);
  assert.equal(await page.locator('[data-living-hero="ready"]').count(), 0);
  assert.equal(
    await page.locator(".hero-live-poster").evaluate((image) => getComputedStyle(image).visibility),
    "visible",
  );
  results.push({ label: "no-webgl", posterFallback: true });
} finally {
  await fallbackBrowser.close();
}
await writeFile(path.join(output, "summary.json"), JSON.stringify(results, null, 2));
