import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const output = process.argv[2] || "artifacts/chronos/quality";
const url = process.env.V40_URL || "http://127.0.0.1:4392/";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" }),
  headless: true,
});
const results = [];
try {
  for (const width of [390, 1350, 1440, 3440]) {
    const height = width === 1350 ? 940 : width === 390 ? 844 : 900;
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(() => {
      window.chronosShifts = [];
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.chronosShifts.push(entry.value);
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto(url);
    await page.waitForFunction(() => !!window.cashioV40);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(3000);
    const geometry = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
      cls: window.chronosShifts.reduce((sum, value) => sum + value, 0),
    }));
    await page.evaluate(() => {
      document.querySelectorAll("[data-reveal]").forEach((node) => window.cashioV40.reveal(node));
      document.getAnimations().forEach((animation) => {
        const end = animation.effect.getComputedTiming().endTime;
        if (Number.isFinite(end)) animation.finish();
        else animation.pause();
      });
    });
    const violations = width === 1350 ? [] : (await new AxeBuilder({ page }).analyze()).violations;
    await page.screenshot({ path: path.join(output, `${width}.png`), fullPage: width === 390 });
    const row = {
      width,
      height,
      geometry,
      errors,
      violations: violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        description: violation.description,
        nodes: violation.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })),
      })),
    };
    results.push(row);
    console.log(JSON.stringify({ width, ...geometry, errors: errors.length, violations: violations.length }));
    await context.close();
  }
  await writeFile(path.join(output, "quality.json"), JSON.stringify(results, null, 2));
  for (const result of results) {
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.violations, [], `axe ${result.width}`);
    assert.equal(result.geometry.width, result.width, `overflow ${result.width}`);
    if (result.width === 1350) assert.ok(result.geometry.cls <= 0.02, `CLS ${result.geometry.cls}`);
    if (result.width === 390) assert.ok(result.geometry.height <= 11500, `phone journey ${result.geometry.height}`);
  }
} finally {
  await browser.close();
}
