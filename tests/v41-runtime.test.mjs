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

test("Mission Control filters, previews and keyboard navigation reach the intended chapter quietly", async (t) => {
  const page = await visit(t);
  const films = [];
  page.on("request", (request) => {
    if (/\.(mp4|webm)(\?|$)/.test(request.url())) films.push(request.url());
  });
  await page.goto(url);
  const opener = page.locator("header [data-mission-open]");
  await opener.click();
  const panel = page.locator("#mission-dialog");
  await expect(panel.locator("[data-chapter]:visible")).toHaveCount(11);
  for (const [name, count] of [
    ["Explore", 4],
    ["Try", 3],
    ["Watch", 2],
    ["Connect", 2],
    ["All", 11],
  ]) {
    await panel.getByRole("button", { name, exact: true }).click();
    await expect(panel.locator("[data-chapter]:visible")).toHaveCount(count);
  }
  await panel.getByRole("button", { name: "Watch", exact: true }).click();
  const search = panel.getByRole("searchbox");
  await search.fill("TRAILER");
  await expect(panel.locator("[data-chapter]:visible")).toHaveCount(1);
  await search.press("ArrowDown");
  await expect(panel.getByRole("link", { name: "03 House Cashio", exact: true })).toBeFocused();
  await expect(panel.locator(".mission-preview h3")).toHaveText("An unlikely crew.");
  await expect(panel.locator(".mission-preview img")).toHaveAttribute("src", "/assets/hero/cashio-trailer-poster.webp");
  await page.keyboard.press("Enter");
  await expect(panel).not.toBeVisible();
  await expect(page).toHaveURL(/#eagle-film$/);
  await expect(page.locator("#eagle-film")).toBeInViewport();
  await expect(page.locator("#cinema-video")).toHaveCount(0);
  assert.deepEqual(films, [], "browsing destinations never downloads or starts a film");
  await opener.click();
  await expect(panel.locator("[data-chapter]:visible")).toHaveCount(11);
  await panel.getByRole("link", { name: "11 About Doug", exact: true }).focus();
  assert.ok(await panel.locator(".mission-results").evaluate((n) => n.scrollTop > 0));
  await page.keyboard.press("Escape");
  await expect(opener).toBeFocused();
  await opener.click();
  assert.equal(await panel.locator(".mission-results").evaluate((n) => n.scrollTop), 0);
  await page.setViewportSize({ width: 1280, height: 720 });
  for (const link of await panel.locator("[data-chapter]").all()) {
    await link.focus();
    const previewBounds = await panel.locator(".mission-preview").boundingBox();
    const descriptionBounds = await panel.locator(".mission-preview p").boundingBox();
    assert.ok(
      descriptionBounds.y + descriptionBounds.height <= previewBounds.y + previewBounds.height,
      "every artwork description fits a short laptop window",
    );
  }
});

test("the visual destination desk fits phones and recovers from an empty combined filter", async (t) => {
  for (const width of [320, 390]) {
    const page = await visit(t, { viewport: { width, height: 640 }, isMobile: true, hasTouch: true });
    await page.goto(url);
    await page.locator("header [data-mission-open]").click();
    const panel = page.locator("#mission-dialog");
    assert.equal(
      await panel.locator(".mission-preview img").getAttribute("src"),
      null,
      "phones do not download hidden menu artwork",
    );
    await panel.getByRole("button", { name: "Watch", exact: true }).click();
    await panel.getByRole("searchbox").fill("atlas");
    await expect(panel.locator("[data-chapter]:visible")).toHaveCount(0);
    await expect(panel.getByText("No matching destination.", { exact: false })).toBeVisible();
    await panel.getByRole("button", { name: "Show all destinations", exact: true }).click();
    await expect(panel.locator("[data-chapter]:visible")).toHaveCount(11);
    await expect(panel.getByRole("searchbox")).toBeFocused();
    await expect(panel.getByRole("button", { name: "All", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(panel.getByRole("button", { name: "Close Mission Control", exact: true })).toBeInViewport();
    const bounds = await panel.boundingBox();
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    const targets = await panel.locator("button:visible").evaluateAll((buttons) =>
      buttons.map((b) => ({
        label: b.textContent,
        width: b.getBoundingClientRect().width,
        height: b.getBoundingClientRect().height,
      })),
    );
    assert.deepEqual(
      targets.filter((b) => b.width < 44 || b.height < 44),
      [],
    );
    const audit = await new AxeBuilder({ page })
      .include("#mission-dialog")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    assert.deepEqual(audit.violations, []);
  }
});

test("the new atlas and film graphics obey reduced motion and pause without losing their controls", async (t) => {
  for (const reducedMotion of ["reduce", "no-preference"]) {
    const page = await visit(t, { reducedMotion });
    await page.goto(url);
    if (reducedMotion === "no-preference")
      await page.getByRole("button", { name: "Pause motion", exact: true }).first().click();
    await page.getByRole("tab", { name: "02 Principles", exact: true }).click();
    assert.equal(await page.locator(".atlas-core-grid").evaluate((n) => getComputedStyle(n).animationName), "none");
    await page.getByRole("link", { name: "Watch House Cashio 61 seconds", exact: true }).hover();
    assert.equal(await page.locator(".film-aperture-ring").evaluate((n) => getComputedStyle(n).transform), "none");
    await page.locator("header [data-mission-open]").click();
    await page.locator('#mission-dialog [data-chapter="rooms"]').focus();
    assert.equal(await page.locator(".mission-preview img").evaluate((n) => n.getAnimations().length), 0);
  }
});

test("the world atlas connects keyboard and map selection to the correct destination", async (t) => {
  const page = await visit(t);
  const media = [];
  page.on("request", (request) => {
    if (/\.(mp4|webm)(\?|$)/.test(request.url())) media.push(request.url());
  });
  await page.goto(url);
  const atlas = page.getByRole("tablist", { name: "World atlas", exact: true });
  await atlas.getByRole("tab").first().focus();
  const cases = [
    ["End", 3, "heritage"],
    ["ArrowRight", 0, "starship"],
    ["ArrowDown", 1, "principles"],
    ["ArrowRight", 2, "studios"],
    ["Home", 0, "starship"],
    ["ArrowLeft", 3, "heritage"],
  ];
  for (const [key, index, slug] of cases) {
    await page.keyboard.press(key);
    await expect(atlas.getByRole("tab").nth(index)).toBeFocused();
    await expect(atlas.getByRole("tab").nth(index)).toHaveAttribute("aria-selected", "true");
    await expect(page.locator(".atlas-destination:visible")).toHaveCount(1);
    await expect(page.locator(".atlas-destination:visible a")).toHaveAttribute("href", `/rooms/${slug}/interactive/`);
  }
  await page.getByRole("button", { name: "Preview Studios in the atlas", exact: true }).click();
  await expect(atlas.getByRole("tab").nth(2)).toBeFocused();
  await expect(page.locator(".atlas-destination:visible")).toContainText("Follow the light.");
  assert.deepEqual(media, [], "choosing a destination does not preload or play any film");
});

test("all four atlas destinations fit phones with accessible controls", async (t) => {
  for (const width of [320, 390]) {
    const page = await visit(t, { viewport: { width, height: 844 }, isMobile: true, hasTouch: true });
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    for (let index = 0; index < 4; index++) {
      const tab = page.getByRole("tablist", { name: "World atlas", exact: true }).getByRole("tab").nth(index);
      await tab.click();
      const target = await tab.boundingBox();
      assert.ok(target.width >= 44 && target.height >= 44);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
      await expect(page.locator(".atlas-destination:visible a")).toBeVisible();
    }
    const audit = await new AxeBuilder({ page })
      .include("#rooms")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    assert.deepEqual(audit.violations, []);
  }
});

test("the atlas reading edition exposes all original world links without JavaScript", async (t) => {
  const page = await visit(t, { javaScriptEnabled: false });
  await page.goto(url);
  for (const slug of ["starship", "principles", "studios", "heritage"]) {
    await expect(page.locator(`#rooms a[href="/rooms/${slug}/interactive/"]`)).toBeVisible();
    await expect(page.locator(`#rooms a[href="/rooms/${slug}/"]`)).toBeVisible();
  }
  await expect(page.locator(".atlas-destination:visible")).toHaveCount(4);
  await expect(page.locator("#rooms")).toContainText("A world worth getting lost in.");
});

test("atlas transitions respect both reduced motion and the site's pause control", async (t) => {
  for (const reducedMotion of ["reduce", "no-preference"]) {
    const page = await visit(t, { reducedMotion });
    await page.goto(url);
    if (reducedMotion === "no-preference") {
      await page.getByRole("button", { name: "Pause motion", exact: true }).first().click();
    }
    await page.getByRole("tablist", { name: "World atlas", exact: true }).getByRole("tab").nth(1).click();
    const motion = await page
      .locator(".atlas-route, .atlas-destination:visible img")
      .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).animationName));
    assert.deepEqual(motion, ["none", "none"]);
  }
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
  [1280, 720],
  [3440, 1440],
  [390, 844],
]) {
  test(`Current hero and actions fit at ${width}; whole page has no serious accessibility issues`, async (t) => {
    const page = await visit(t, { viewport: { width, height }, hasTouch: width === 390 });
    await page.goto(url);
    await page.waitForTimeout(1500);
    await expect(page.locator("h1")).toHaveText("The machines can think. You still decide.");
    await expect(page.locator(".aurum-manifesto")).toHaveText("Imagination, with intention.");
    const dock = page.locator('nav[aria-label="Sections"]');
    const dockRect = (await dock.isVisible()) ? await dock.boundingBox() : null;
    const selectors = ["h1", 'a[href="#flight=board"]', '#hero-content a[href="#studies"]'];
    if (dockRect) selectors.push(".continuum-scene-deck");
    for (const selector of selectors) {
      const rect = await page.locator(selector).first().boundingBox();
      assert.ok(rect && rect.y >= 68 && rect.y + rect.height <= height, `${selector} is visible in the first view`);
      if (dockRect) {
        const overlaps =
          rect.x < dockRect.x + dockRect.width &&
          rect.x + rect.width > dockRect.x &&
          rect.y < dockRect.y + dockRect.height &&
          rect.y + rect.height > dockRect.y;
        assert.equal(overlaps, false, `${selector} stays clear of the floating chapter dock`);
      }
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
  await page.locator(".continuum-observation").evaluate((rail) => {
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
    .include("nav[aria-label=Sections]")
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
  const order = await page.locator("main > section").evaluateAll((s) => s.slice(0, 4).map((n) => n.id));
  assert.deepEqual(order, ["top", "eagle-film", "workshop", "rooms"]);
  const hero = await page.locator("#top").boundingBox();
  const workshop = await page.locator("#workshop").boundingBox();
  assert.ok(workshop.y >= hero.y + hero.height, "real projects follow the complete hero");
  await expect(page.locator("#films-collection")).not.toHaveAttribute("open", "");
  await page.reload();
  await page.waitForTimeout(2600);
  const watch = page.getByRole("link", { name: "Watch House Cashio 61 seconds", exact: true });
  await expect(page.locator("#eagle-film h2")).toHaveText("House Cashio: The Trailer");
  await expect(page.locator("#eagle-film .eagle-film-play img")).toHaveAttribute(
    "src",
    "/assets/hero/cashio-trailer-poster.webp",
  );
  await expect(page.locator("#eagle-film .eagle-film-play img")).toHaveAttribute("alt", /House Cashio/);
  await expect(page.locator("#eagle-film")).not.toContainText("A moment in orbit.");
  await page.locator(".continuum-next").click();
  await expect(page).toHaveURL(/#eagle-film$/);
  await expect(page.locator("main > #eagle-film")).toBeVisible();
  await expect(page.locator("#eagle-film")).toHaveCount(1);
  await watch.scrollIntoViewIfNeeded();
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
    await page.locator("#films-collection > summary").click();
    await page.locator(".studio-collection > summary").click();
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
  await page.locator(".studio-collection > summary").click();
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
    await page
      .locator("video")
      .evaluateAll((v) => v.every((v) => v.preload === "none" && (!v.getAttribute("src") || Boolean(v.poster)))),
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
  const telemetry = page.locator(".continuum-observation");
  await expect(telemetry).toBeVisible();
  const before = await draws();
  await page.waitForTimeout(1000);
  const rendered = (await draws()) - before;
  assert.ok(rendered > 0 && rendered <= 35, `ambient starfield stays near 30fps; drew ${rendered} frames`);
  const headingBefore = await page.locator("h1").boundingBox();
  // The camera now owns image depth; the poster remains an untransformed image inside it.
  const camera = page.locator(".hero-flight-camera");
  const cameraX = () => camera.evaluate((node) => new DOMMatrixReadOnly(getComputedStyle(node).transform).m41);
  await page.mouse.move(200, 320);
  await page.waitForTimeout(450);
  const leftView = await cameraX();
  await page.mouse.move(1200, 320);
  await expect.poll(cameraX).toBeLessThan(leftView - 3);
  const poster = page.locator(".hero-live-poster");
  await expect.poll(() => camera.evaluate((node) => node.style.transform)).toContain("translate3d");
  assert.deepEqual(
    await page.locator("h1").boundingBox(),
    headingBefore,
    "orbital depth never moves the reading surface",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(telemetry).toBeVisible();
  await expect.poll(() => poster.evaluate((node) => node.style.transform)).toBe("");
  await page.setViewportSize({ width: 1440, height: 900 });
  // The viewport command can finish before React commits the desktop view and its pointer handler.
  await expect(telemetry).toBeVisible();
  await page.mouse.move(840, 330);
  await expect.poll(() => camera.evaluate((node) => node.style.transform)).toContain("translate3d");
  await page.getByRole("button", { name: "Pause motion", exact: true }).first().click();
  await expect.poll(() => poster.evaluate((node) => getComputedStyle(node).transform)).toBe("none");
  const pausedCamera = await camera.evaluate((node) => getComputedStyle(node).transform);
  await staysStill();
  assert.equal(await camera.evaluate((node) => getComputedStyle(node).transform), pausedCamera);
  await page.getByRole("button", { name: "Resume motion", exact: true }).first().click();
  const resumed = await draws();
  await expect.poll(draws).toBeGreaterThan(resumed);
  await page.locator(".continuum-next").click();
  await page.getByRole("link", { name: "Explore the workshop →", exact: true }).click();
  await expect(page.locator("#top")).not.toBeInViewport();
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
