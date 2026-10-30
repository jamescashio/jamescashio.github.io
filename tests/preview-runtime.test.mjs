import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";

let browser;
const url = process.env.V40_URL;
before(async () => {
  browser = await chromium.launch({
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" }),
    headless: true,
  });
});
after(async () => browser?.close());
async function visit(t, options = {}) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
    isMobile: true,
    hasTouch: true,
    ...options,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  t.after(async () => {
    await context.close();
    assert.deepEqual(errors, []);
  });
  return page;
}

test("the compact phone journey keeps projects and professional context visible", async (t) => {
  const page = await visit(t);
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".privacy-exercise")).toBeVisible();
  await expect(page.locator(".studio-collection")).not.toHaveAttribute("open", "");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
  const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  assert.ok(pageHeight < 14500, `the ${pageHeight}px journey must be shorter than the 16,568px baseline`);
  await expect(page.locator("#workshop")).toContainText("Principal Solutions Consultant");
  await expect(page.locator("#workshop")).toContainText("No new restore rehearsal");
  await expect(page.locator("#ai-worm-title")).toHaveText("The Sovereign");
  await expect(page.locator("#roadster-studio-title")).toHaveText("Roadster Studio");
});

test("the optional privacy exercise remains keyboard operated and preserves human authority", async (t) => {
  const page = await visit(t);
  await page.goto(url + "#work");
  const exercise = page.locator(".privacy-exercise");
  const summary = exercise.locator("summary").first();
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(exercise).toHaveAttribute("open", "");
  await exercise.getByRole("button", { name: "A person", exact: true }).click();
  await exercise.getByRole("button", { name: "Show the answer", exact: true }).click();
  await expect(exercise.locator('[role="status"]')).toContainText(/person|human|review/i);
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(exercise).not.toHaveAttribute("open", "");
  await expect(summary).toBeFocused();
});

test("featured project titles fit their own columns on a narrow phone", async (t) => {
  const page = await visit(t, { viewport: { width: 320, height: 740 } });
  await page.goto(url + "#films");
  await page.evaluate(() => document.fonts.ready);
  for (const selector of ["#ai-worm-title", "#roadster-studio-title"]) {
    const size = await page
      .locator(selector)
      .evaluate((node) => ({ width: node.clientWidth, content: node.scrollWidth }));
    assert.ok(size.content <= size.width, `${selector} must not clip inside its card: ${JSON.stringify(size)}`);
  }
});

test("fragment bookmarks open the required disclosures, including in the reading edition", async (t) => {
  const page = await visit(t);
  await page.goto(url + "#privacy-test");
  await expect(page.locator(".privacy-exercise")).toHaveAttribute("open", "");
  await expect(page.locator("#privacy-test")).toBeInViewport();
  await page.goto(url + "#feature-video");
  await expect(page.locator(".studio-collection")).toHaveAttribute("open", "");
  await expect(page.locator("#feature-video")).toBeInViewport();
  const reading = await visit(t, { javaScriptEnabled: false });
  await reading.goto(url + "#privacy-test");
  await expect(reading.locator(".privacy-exercise")).toHaveAttribute("open", "");
  await expect(reading.locator("#privacy-test")).toContainText("No uploads");
});

test("closing the short-film browser stops its playback owner", async (t) => {
  const page = await visit(t, {
    viewport: { width: 1440, height: 900 },
    reducedMotion: "no-preference",
    isMobile: false,
    hasTouch: false,
  });
  await page.goto(url + "#films");
  const collection = page.locator(".studio-collection");
  await collection.locator("summary").first().click();
  const video = page.locator("#feature-video");
  await video.scrollIntoViewIfNeeded();
  await expect.poll(() => video.evaluate((node) => node.paused)).toBe(false);
  await collection.locator("summary").first().click();
  await expect.poll(() => video.evaluate((node) => node.paused)).toBe(true);
  await expect(collection).not.toHaveAttribute("open", "");
});
