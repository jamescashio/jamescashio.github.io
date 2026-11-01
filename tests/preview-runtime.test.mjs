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
  await expect(page.locator("#decision-story > summary")).toBeVisible();
  await expect(page.locator("#decision-story")).not.toHaveAttribute("open", "");
  await expect(page.locator(".studio-collection")).not.toHaveAttribute("open", "");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
  const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  assert.ok(
    pageHeight < 11500,
    `the ${pageHeight}px journey must be at least 23% shorter than the 15,009px reviewed baseline`,
  );
  await expect(page.locator("#workshop")).toContainText("Principal Solutions Consultant");
  await expect(page.locator("#workshop")).toContainText("No new restore rehearsal");
  await expect(page.locator("#ai-worm-title")).toHaveText("The Sovereign");
  await expect(page.locator("#roadster-studio-title")).toHaveText("Roadster Studio");
});

test("the visible showcase opens every featured project from a keyboard without starting media", async (t) => {
  const page = await visit(t);
  const filmRequests = [];
  page.on("request", (request) => {
    if (/\.(mp4|webm)(\?|$)/.test(request.url())) filmRequests.push(request.url());
  });
  await page.goto(url);
  await page.waitForLoadState("networkidle");
  for (const id of ["ai-worm", "roadster-studio"]) {
    const link = page.locator(`#showcase a[href="#${id}"]`);
    await expect(link).toBeVisible();
    await link.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await expect(page.locator(`#${id}`)).toBeInViewport();
    await expect(page.locator("#films-collection")).toHaveAttribute("open", "");
    await page.locator("#films-collection > summary").click();
  }
  assert.deepEqual(filmRequests, [], "project discovery does not download a film");
  const reading = await visit(t, { javaScriptEnabled: false });
  await reading.goto(url);
  await expect(reading.locator("#showcase a")).toHaveCount(2);
  await expect(reading.locator('main > #eagle-film a[href="#film=trailer"]')).toBeVisible();
  await expect(reading.locator("#eagle-film")).toHaveCount(1);
  await expect(reading.locator("#showcase")).toContainText("independent automotive CAD concept");
});

test("the phone header fits before secondary styles arrive", async (t) => {
  for (const width of [320, 390]) {
    const page = await visit(t, { viewport: { width, height: 844 } });
    let releaseStyles;
    const stylesReady = new Promise((resolve) => {
      releaseStyles = resolve;
    });
    await page.route("**/assets/deferred-*.css", async (route) => {
      await stylesReady;
      await route.continue();
    });
    try {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await expect(page.locator(".bit-header .bit-portrait")).toHaveClass(/bit-rendered/);
      const size = await page.evaluate(() => ({
        viewport: innerWidth,
        page: document.documentElement.scrollWidth,
        header: document.querySelector("header").getBoundingClientRect().right,
      }));
      assert.equal(size.viewport, width, "late decorative styles must not expand the mobile viewport");
      assert.equal(size.page, width, "the phone layout must fit before the secondary stylesheet arrives");
      assert.ok(size.header <= width, "the header stays within the phone");
    } finally {
      releaseStyles();
      await page.waitForLoadState("networkidle");
    }
  }
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

test("the completed brief preview, download and editable starting point agree with the dated record", async (t) => {
  const page = await visit(t);
  await page.goto(url + "#workshop");
  const record = await (await page.request.get(new URL("/status.json", url).href)).json();
  const example = page.getByRole("figure", { name: "Example decision brief", exact: true });
  await expect(example).toContainText(
    `${record.containers.running} containers and ${record.virtualMachines.running} virtual machine on ${record.cluster.hostsOnline} hosts.`,
  );
  await expect(example).toContainText(record.verifiedLong);
  await expect(example).toContainText("not a new check");
  const download = page.getByRole("link", { name: "Download an example ↓", exact: true });
  const response = await page.request.get(new URL(await download.getAttribute("href"), url).href);
  assert.equal(response.status(), 200);
  const text = await response.text();
  assert.ok(text.includes(record.verifiedLong));
  assert.ok(text.includes("https://cashio.us/status.json"));
  assert.ok(text.includes("Full system recovery and current AI routing were not tested."));
  await page.getByRole("link", { name: "Make your brief →", exact: true }).click();
  for (const field of ["observed", "source", "unknown", "owner"]) {
    const value = await page.locator(`[data-field="${field}"]`).inputValue();
    assert.ok(value.length > 0 && text.includes(value), `${field} matches the downloadable example`);
  }
});

test("the evidence console remains discoverable, keyboard operated and directly bookmarkable", async (t) => {
  const page = await visit(t);
  await page.goto(url + "#evidence");
  const console = page.locator(".evidence-console");
  const summary = console.locator("summary").first();
  await expect(console).not.toHaveAttribute("open", "");
  await summary.focus();
  await page.keyboard.press("Enter");
  await console.getByRole("button", { name: "fleet", exact: true }).click();
  await expect(page.locator("#eve-out")).toContainText("counts describe running guests, not application health");
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(console).not.toHaveAttribute("open", "");
  await expect(summary).toBeFocused();
  await page.goto(url + "#eve-in");
  await expect(console).toHaveAttribute("open", "");
  await expect(page.locator("#eve-in")).toBeInViewport();
  await page.reload();
  await expect(console).toHaveAttribute("open", "");
  await expect(page.locator("#eve-in")).toBeInViewport();
});
