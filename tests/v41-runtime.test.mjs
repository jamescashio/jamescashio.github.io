import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

let browser;
const url = process.env.V40_URL;
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
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "no-preference",
    ...options,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  t.after(async () => {
    await context.close();
    assert.deepEqual(errors, [], "no runtime or security policy errors");
  });
  return page;
}
for (const [width, height] of [
  [1440, 900],
  [3440, 1440],
  [390, 844],
]) {
  test(`V41 hero and actions fit at ${width}; whole page has no serious accessibility issues`, async (t) => {
    const page = await visit(t, { viewport: { width, height }, hasTouch: width === 390 });
    await page.goto(url);
    await page.waitForTimeout(1500);
    await expect(page.locator("h1")).toHaveText("The machines can think. You still decide.");
    for (const selector of ["h1", 'a[href="#flight=board"]', '#hero-content a[href="#studies"]']) {
      const rect = await page.locator(selector).first().boundingBox();
      assert.ok(rect && rect.y >= 68 && rect.y + rect.height <= height, `${selector} is visible in the first view`);
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
      .analyze();
    assert.deepEqual(
      audit.violations
        .filter((v) => ["serious", "critical"].includes(v.impact))
        .map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
      [],
    );
    const labels = await new AxeBuilder({ page }).withRules(["label-content-name-mismatch"]).analyze();
    assert.deepEqual(
      labels.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
      [],
    );
    for (const [selector, text] of [
      ["#evidence h2", "Trust has a timestamp."],
      ["#contact h2", "Don't panic. Say hello."],
      ["#rooms h2", "Pick a world. Stay a while."],
    ])
      await expect(page.locator(selector).first()).toHaveText(text);
    const missing = await page
      .locator("#rooms img, #films button img")
      .evaluateAll((images) => images.filter((i) => !i.alt || !i.srcset).map((i) => i.outerHTML));
    assert.deepEqual(missing, [], "world and film cards have descriptions and responsive images");
  });
}
test("The rail and workshop evidence stay readable during entrance motion", async (t) => {
  const page = await visit(t, { viewport: { width: 3440, height: 1440 } });
  await page.goto(url);
  await page.locator(".v41-31fb338fa2").evaluate((rail) => {
    for (const animation of rail.getAnimations({ subtree: true })) {
      animation.pause();
      animation.currentTime = 700;
    }
  });
  await page.locator("#workshop").scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  await page.locator("#workshop").evaluate((section) => {
    for (const animation of section.getAnimations({ subtree: true })) {
      animation.pause();
      animation.currentTime = 40;
    }
  });
  const audit = await new AxeBuilder({ page })
    .include(".v41-bf5360592c")
    .include("#workshop")
    .withRules(["color-contrast"])
    .analyze();
  assert.deepEqual(audit.violations, []);
});

test("The planet stays in the hero; House Cashio replaces the featured Eagle film with accessible playback", async (t) => {
  const page = await visit(t);
  const filmRequests = [];
  page.on("request", (request) => {
    if (/cashio-(?:v41-eagle|trailer)-.*\.mp4/.test(request.url())) filmRequests.push(request.url());
  });
  await page.goto(url);
  await page.waitForTimeout(3000);
  await expect(page.locator("#top video, #top a[href='#film=intro']")).toHaveCount(0);
  await expect(page.locator("#top .hero-live-poster")).toBeVisible();
  const order = await page.locator("main > section").evaluateAll((s) => s.slice(0, 3).map((n) => n.id));
  assert.deepEqual(order, ["top", "eagle-film", "workshop"]);
  const hero = await page.locator("#top").boundingBox();
  const film = await page.locator("#eagle-film").boundingBox();
  assert.ok(film.y >= hero.y + hero.height, "film invitation follows the complete hero");
  await page.reload();
  await page.waitForTimeout(2600);
  const watch = page.getByRole("link", { name: "Watch House Cashio 61 seconds", exact: true });
  await expect(page.locator("#eagle-film h2")).toHaveText("House Cashio: The Trailer");
  await expect(page.locator("#eagle-film img")).toHaveAttribute("src", "/assets/hero/cashio-trailer-poster.webp");
  await expect(page.locator("#eagle-film img")).toHaveAttribute("alt", /House Cashio/);
  await expect(page.locator("#eagle-film")).not.toContainText("A moment in orbit.");
  await page.getByRole("link", { name: "Next: watch House Cashio", exact: true }).click();
  await expect(page).toHaveURL(/#eagle-film$/);
  await expect(watch).toBeInViewport();
  await page.waitForTimeout(500);
  assert.deepEqual(filmRequests, [], "waiting, reloading and scrolling do not download either film");
  await expect(page.locator("#cinema-video")).toHaveCount(0);
  await page.locator("#eagle-film summary").click();
  await expect(page.locator("#eagle-film details p")).toBeVisible();
  await expect(page.locator("#eagle-film details p")).toContainText("The cat was not consulted.");
  await watch.focus();
  await page.keyboard.press("Enter");
  const replay = page.locator("#cinema-video");
  await expect(replay).toBeVisible();
  assert.equal(await replay.evaluate((v) => v.muted && v.controls && v.paused), true);
  await expect(replay.locator("track")).toHaveAttribute("kind", "captions");
  await expect(replay.locator("track")).toHaveAttribute("src", "/assets/hero/cashio-trailer-text.vtt");
  await expect(replay).toHaveAttribute("src", /cashio-trailer-1080p\.mp4$/);
  await expect(page).toHaveURL(/#film=trailer$/);
  await replay.evaluate((v) => v.play());
  await expect.poll(() => replay.evaluate((v) => v.currentTime)).toBeGreaterThan(0.1);
  assert.ok(await replay.evaluate((v) => v.duration >= 60 && v.duration <= 62));
  assert.equal(await page.locator("video").evaluateAll((v) => v.filter((v) => !v.paused).length), 1);
  await page.keyboard.press("Escape");
  await expect(replay).toHaveCount(0);
  await expect(watch).toBeFocused();
  await expect(watch).toBeInViewport();
  await page.goto(url + "#film=trailer");
  await expect(replay).toBeVisible();
  await page.reload();
  await expect(replay).toHaveAttribute("src", /cashio-trailer-1080p\.mp4$/);
  await page.keyboard.press("Escape");
  await expect(replay).toHaveCount(0);
  // Existing Eagle bookmarks retain their original film and codec fallback.
  await page.goto(url + "#film=intro");
  await expect(replay).toBeVisible();
  await expect(page.locator("#helios-studio")).toHaveCount(0);
  await page.reload();
  await expect(replay.locator("source").first()).toHaveAttribute("src", /cashio-v41-eagle-replay/);
  const sources = await replay.locator("source").evaluateAll((s) => s.map((n) => n.src));
  assert.ok(sources[0].endsWith("1080p-av1.mp4") && sources[1].endsWith("1080p-h264.mp4"));
  await replay.evaluate((video, fallback) => {
    video.src = fallback;
    video.load();
    return video.play();
  }, sources[1]);
  await expect.poll(() => replay.evaluate((v) => v.currentTime)).toBeGreaterThan(0.1);
  assert.equal(await replay.evaluate((v) => v.muted && v.currentSrc.endsWith("h264.mp4")), true);
  await page.keyboard.press("Escape");
  await expect(replay).toHaveCount(0);
});
test("Data saving and reduced motion keep posters still, while manual replay selects the small rendition", async (t) => {
  for (const mode of ["saveData", "3g", "reduce"]) {
    const page = await visit(t, { reducedMotion: mode === "reduce" ? "reduce" : "no-preference" });
    if (mode !== "reduce")
      await page.addInitScript(
        (mode) =>
          Object.defineProperty(navigator, "connection", {
            value: {
              saveData: mode === "saveData",
              effectiveType: mode === "3g" ? "3g" : "4g",
              addEventListener() {},
              removeEventListener() {},
            },
          }),
        mode,
      );
    await page.goto(url);
    await page.waitForTimeout(2600);
    await expect(page.locator("#top video")).toHaveCount(0);
    await expect(page.locator("#top .hero-live-poster")).toBeVisible();
    await page.locator("#feature-video").scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    assert.equal(await page.locator("video").evaluateAll((v) => v.every((v) => v.paused)), true);
    if (mode !== "reduce") {
      await page.goto(url + "#film=intro");
      await expect(page.locator("#cinema-video")).toBeVisible();
      const sources = await page.locator("#cinema-video source").evaluateAll((s) => s.map((n) => n.src));
      assert.ok(sources.every((s) => s.includes("480p")));
      assert.equal(await page.locator("#cinema-video").evaluate((v) => v.paused), true);
    }
  }
});
test("Only the visible film plays; leaving its halfway boundary or switching motion off pauses playback", async (t) => {
  const page = await visit(t);
  await page.goto(url + "#films");
  const feature = page.locator("#feature-video");
  await feature.scrollIntoViewIfNeeded();
  await expect.poll(() => feature.evaluate((v) => v.paused)).toBe(false);
  assert.equal(await page.locator("video").evaluateAll((v) => v.filter((v) => !v.paused).length), 1);
  await page.evaluate(() => {
    const r = document.querySelector("#feature-video").getBoundingClientRect();
    scrollBy(0, r.top + r.height * 0.6);
  });
  await expect.poll(() => feature.evaluate((v) => v.paused)).toBe(true);
  await feature.scrollIntoViewIfNeeded();
  await expect.poll(() => feature.evaluate((v) => v.paused)).toBe(false);
  await page.keyboard.press("Control+k");
  await expect(page.locator("#mission-dialog")).toBeVisible();
  assert.equal(await page.locator("video").evaluateAll((v) => v.every((v) => v.paused)), true);
  await page.keyboard.press("Escape");
  await expect.poll(() => feature.evaluate((v) => v.paused)).toBe(false);
  await page.getByRole("button", { name: "Pause motion", exact: true }).first().click();
  assert.equal(await page.locator("video").evaluateAll((v) => v.every((v) => v.paused)), true);
  assert.equal(
    await page.locator("video").evaluateAll((v) => v.every((v) => v.preload === "none" && Boolean(v.poster))),
    true,
  );
});

test("The starfield limits ambient work and stops while offscreen, motion is paused or cinema is open", async (t) => {
  const page = await visit(t);
  await page.addInitScript(() => {
    window.heroDraws = 0;
    const clear = CanvasRenderingContext2D.prototype.clearRect;
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      if (this.canvas.id === "hero-stars") window.heroDraws++;
      return clear.apply(this, args);
    };
  });
  const draws = () => page.evaluate(() => window.heroDraws);
  const staysStill = async () => {
    await page.waitForTimeout(300);
    const before = await draws();
    await page.waitForTimeout(450);
    assert.equal(await draws(), before, "an inactive hero does no canvas work");
  };
  await page.goto(url);
  await expect.poll(draws).toBeGreaterThan(2);
  const before = await draws();
  await page.waitForTimeout(1000);
  const rendered = (await draws()) - before;
  assert.ok(rendered > 0 && rendered <= 35, `ambient starfield stays near 30fps; drew ${rendered} frames`);
  await page.getByRole("button", { name: "Pause motion", exact: true }).first().click();
  await staysStill();
  await page.getByRole("button", { name: "Resume motion", exact: true }).first().click();
  const resumed = await draws();
  await expect.poll(draws).toBeGreaterThan(resumed);
  await page.getByRole("link", { name: "Next: watch House Cashio", exact: true }).click();
  await page.waitForTimeout(900);
  await staysStill();
  await page.goto(url + "#film=intro");
  await expect(page.locator("#cinema-video")).toBeVisible();
  await staysStill();
  await page.keyboard.press("Escape");
  await expect(page.locator("#cinema-video")).toHaveCount(0);
  await page.locator("#top").scrollIntoViewIfNeeded();
  const closed = await draws();
  await expect.poll(draws).toBeGreaterThan(closed);
});
