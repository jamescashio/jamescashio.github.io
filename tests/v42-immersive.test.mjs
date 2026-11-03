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
    reducedMotion: "reduce",
    ...options,
  });
  t.after(() => context.close());
  const page = await context.newPage(),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  t.after(() => assert.deepEqual(errors, []));
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  return page;
}

test("Build notes expose the decisions and limits with keyboard controls on desktop and narrow phones", async (t) => {
  for (const width of [1440, 320]) {
    const page = await visit(t, { viewport: { width, height: 900 } });
    for (const [id, finalLabel, expected] of [
      ["evidence", "Publish", "latest reported snapshots passed their integrity check"],
      ["brief", "Keep", "claims have not been independently verified"],
    ]) {
      const notes = page.locator(`#build-${id}`);
      await notes.locator("summary").click();
      const steps = notes.getByRole("group");
      await steps.getByRole("button", { name: new RegExp(finalLabel) }).press("Space");
      await expect(steps.getByRole("button", { name: new RegExp(finalLabel) })).toHaveAttribute("aria-pressed", "true");
      await expect(notes.locator(".build-story-page[data-selected=true]")).toContainText(expected);
      assert.equal(await notes.locator(".build-story-page:visible").count(), 1);
      assert.equal(
        await page
          .locator(".build-route-light")
          .first()
          .evaluate((node) => getComputedStyle(node).animationName),
        "none",
      );
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
      const { violations } = await new AxeBuilder({ page }).include(`#build-${id}`).analyze();
      assert.deepEqual(
        violations.map((item) => item.id),
        [],
      );
      await notes.locator("summary").click();
    }
  }
});

test("The first-visit route boards the starship, cuts the cloud link and continues to the worlds", async (t) => {
  const page = await visit(t, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const route = page.getByRole("navigation", { name: "Recommended first visit" });
  const board = route.getByRole("link", { name: /Board the starship/ });
  await board.click();
  await expect(page.locator("#helios-flight dialog")).toBeVisible();
  await expect(page).toHaveURL(/#flight=board$/);
  await page.keyboard.press("Escape");
  await expect(page.locator("#helios-flight")).toHaveCount(0);
  await route.getByRole("link", { name: /Cut the cloud link/ }).click();
  await expect(page).toHaveURL(/#flight=blackout$/);
  await expect(page.locator("#helios-flight dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await route.getByRole("link", { name: /Pick a world/ }).click();
  await expect(page.locator("#rooms")).toBeInViewport();
});

test("Every build-story step remains readable without JavaScript", async (t) => {
  const context = await browser.newContext({ viewport: { width: 320, height: 900 }, javaScriptEnabled: false });
  t.after(() => context.close());
  const page = await context.newPage();
  await page.goto(url);
  for (const id of ["evidence", "brief"]) {
    const notes = page.locator(`#build-${id}`);
    await notes.locator("summary").click();
    for (const story of await notes.locator(".build-story-page").all()) await expect(story).toBeVisible();
    await expect(notes.locator(".build-lesson")).toBeVisible();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  }
});
// Plot a course opens Mission Control, the one finder; the guided routes live inside it.
async function openRoute(page, label = "Find your world") {
  await page.getByRole("button", { name: "Plot a course", exact: true }).click();
  await page
    .locator("#mission-dialog")
    .getByRole("group", { name: "Guided routes", exact: true })
    .getByRole("button", { name: label, exact: true })
    .click();
}
test("Discovery offers twelve real destinations, keyboard stepping, a copyable route and focus restoration", async (t) => {
  const page = await visit(t, { permissions: ["clipboard-read", "clipboard-write"] });
  const opener = page.getByRole("button", { name: "Plot a course", exact: true });
  await openRoute(page);
  const dialog = page.locator(".discovery-console");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { level: 3 })).toHaveText("Starship lab");
  const projection = dialog.getByRole("group", { name: "Holographic destination map", exact: true });
  await projection.getByRole("button", { name: "Preview The Studios", exact: true }).click();
  await expect(dialog.getByRole("heading", { level: 3 })).toHaveText("The Studios");
  await expect(dialog.locator(".continuum-primary")).toHaveAttribute("href", "/rooms/studios/interactive/");
  await dialog
    .getByRole("group", { name: "Destination view", exact: true })
    .getByRole("button", { name: "Artwork", exact: true })
    .click();
  await expect(dialog.locator(".discovery-art > img")).toHaveAttribute(
    "src",
    "/v40/assets/room-studios-threshold.webp",
  );
  await dialog
    .getByRole("group", { name: "Destination view", exact: true })
    .getByRole("button", { name: "Hologram", exact: true })
    .click();
  await projection.getByRole("button", { name: "Preview Starship lab", exact: true }).click();
  await page.keyboard.press("ArrowRight");
  await expect(dialog.getByRole("heading", { level: 3 })).toHaveText("Principles engine");
  await page.keyboard.press("ArrowLeft");
  await expect(dialog.getByRole("heading", { level: 3 })).toHaveText("Starship lab");
  for (const [path, first, destination] of [
    ["Explore", "Starship lab", "/rooms/starship/interactive/"],
    ["Try", "A decision worth tracing", "#work"],
    ["Watch", "House Cashio", "#film=trailer"],
  ]) {
    await dialog
      .getByRole("group", { name: "Discovery path", exact: true })
      .getByRole("button", { name: path, exact: true })
      .click();
    await expect(dialog.getByRole("heading", { level: 3 })).toHaveText(first);
    await expect(dialog.locator(".continuum-primary")).toHaveAttribute("href", destination);
    await expect(dialog.locator(".discovery-stops button")).toHaveCount(4);
    for (const control of await dialog.locator(".discovery-stops button").all()) {
      await control.click();
      const href = await dialog.locator(".continuum-primary").getAttribute("href");
      if (href.startsWith("/")) assert.equal((await page.request.get(new URL(href, url).href)).status(), 200);
      else
        assert.match(href, /^#(?:film=(?:trailer|intro|orbital-instrument|threshold)|work|studies|universe|evidence)$/);
    }
  }
  await dialog.getByRole("button", { name: "Copy this route", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "Route copied", exact: true })).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  assert.match(copied, /https:\/\/cashio.us\/#film=trailer/);
  assert.match(copied, /https:\/\/cashio.us\/#film=threshold/);
  assert.doesNotMatch(copied, /127\.0\.0\.1/);
  const audit = await new AxeBuilder({ page })
    .include(".discovery-console")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  assert.deepEqual(
    audit.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    [],
  );
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
});
test("Discovery direct links close the console and reach an existing experiment without starting media", async (t) => {
  const page = await visit(t);
  const movies = [];
  page.on("request", (r) => {
    if (/\.(mp4|webm)(\?|$)/.test(r.url())) movies.push(r.url());
  });
  await openRoute(page);
  const dialog = page.locator(".discovery-console");
  await dialog
    .getByRole("group", { name: "Discovery path", exact: true })
    .getByRole("button", { name: "Try", exact: true })
    .click();
  await expect(dialog.getByRole("heading", { level: 3 })).toHaveText("A decision worth tracing");
  await dialog.getByRole("button", { name: "02 Seven small experiments", exact: true }).click();
  await dialog.getByRole("link", { name: "Open the experiments", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page).toHaveURL(/#studies$/);
  await expect(page.locator("#studies")).toBeInViewport();
  assert.deepEqual(movies, []);
  await openRoute(page);
  await dialog
    .getByRole("group", { name: "Discovery path", exact: true })
    .getByRole("button", { name: "Watch", exact: true })
    .click();
  await dialog.getByRole("link", { name: "Watch House Cashio", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator("#cinema-video")).toBeVisible();
  assert.equal(await page.locator("#cinema-video").evaluate((v) => v.muted), true);
  assert.equal(await page.evaluate(() => document.documentElement.style.overflow), "hidden");
  await page.keyboard.press("Escape");
  await expect(page.locator("#cinema-video")).toHaveCount(0);
  await expect(page.locator("#discovery-launch")).toBeFocused();
});
test("Discovery remains operable on 390 and 320 pixel phones including the sticky close control", async (t) => {
  for (const width of [390, 320]) {
    const page = await visit(t, { viewport: { width, height: 740 }, isMobile: true, hasTouch: true });
    await openRoute(page);
    const dialog = page.locator(".discovery-console");
    await dialog
      .getByRole("group", { name: "Discovery path", exact: true })
      .getByRole("button", { name: "Watch", exact: true })
      .click();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { level: 3 })).toHaveText("House Cashio");
    const box = await dialog.boundingBox();
    assert.ok(box.x >= 0 && box.x + box.width <= width);
    for (const control of await dialog.locator("button").all()) {
      const b = await control.boundingBox();
      assert.ok(b.width >= 44 && b.height >= 44, "44 pixel targets");
    }
    await dialog.getByRole("button", { name: "Next discovery", exact: true }).click();
    await expect(dialog.getByRole("heading", { level: 3 })).toHaveText("Eagle");
    await expect(dialog.getByRole("button", { name: "Close discovery console", exact: true })).toBeInViewport();
    assert.equal(await dialog.evaluate((el) => el.scrollWidth > el.clientWidth), false);
    const audit = await new AxeBuilder({ page })
      .include(".discovery-console")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    assert.deepEqual(
      audit.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
      [],
    );
    await dialog.getByRole("button", { name: "Close discovery console", exact: true }).click();
    assert.equal(await page.evaluate(() => document.documentElement.style.overflow), "");
  }
});
test("The cinema selector changes the featured film quietly and retains genuine Eagle playback and captions", async (t) => {
  const page = await visit(t);
  const movies = [];
  page.on("request", (r) => {
    if (/\.(mp4|webm)(\?|$)/.test(r.url())) movies.push(r.url());
  });
  const group = page.getByRole("group", { name: "Featured cinema", exact: true });
  for (const [name, title, href, note] of [
    ["03 Orbital Instrument", "Orbital Instrument", "#film=orbital-instrument", "Visual description below"],
    ["04 Threshold", "Threshold", "#film=threshold", "Visual description below"],
    ["01 House Cashio", "House Cashio: The Trailer", "#film=trailer", "Captions available"],
    ["02 Eagle", "Eagle", "#film=intro", "Captions available"],
  ]) {
    await group.getByRole("button", { name, exact: true }).click();
    await expect(page.locator("#eagle-film h2")).toHaveText(title);
    await expect(page.locator("#eagle-film .eagle-film-play")).toHaveAttribute("href", href);
    await expect(page.locator(".eagle-film-note")).toContainText(note);
  }
  assert.deepEqual(movies, []);
  await page.getByRole("link", { name: "Watch Eagle 36 seconds", exact: true }).click();
  const video = page.locator("#cinema-video");
  await expect(video).toBeVisible();
  await expect(video.locator("track")).toHaveAttribute("src", "/assets/hero/cashio-v41-eagle-text.vtt");
  await video.evaluate((v) => v.play());
  await expect.poll(() => video.evaluate((v) => v.currentTime)).toBeGreaterThan(0.15);
  assert.equal(await video.evaluate((v) => v.muted), true);
  await page.keyboard.press("Escape");
  await expect(video).toHaveCount(0);
});
test("Fold space respects motion-off and an open discovery console suspends ambient rendering", async (t) => {
  const page = await visit(t);
  const canvas = page.locator("#hero-stars");
  await page.locator("header [data-motion-toggle]").click(); // enable motion for this check
  await page.evaluate(() => {
    window.immersiveFrames = 0;
    const original = CanvasRenderingContext2D.prototype.clearRect;
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      if (this.canvas.id === "hero-stars") window.immersiveFrames++;
      return original.apply(this, args);
    };
  });
  await expect.poll(() => page.evaluate(() => window.immersiveFrames)).toBeGreaterThan(2);
  await page.getByRole("button", { name: "Plot a course", exact: true }).click();
  const frames = await page.evaluate(() => window.immersiveFrames);
  await page.waitForTimeout(250);
  assert.equal(await page.evaluate(() => window.immersiveFrames), frames);
  await page.keyboard.press("Escape");
  await page.locator("header [data-motion-toggle]").click(); // pause
  await page.getByRole("button", { name: "Signal", exact: true }).click();
  const before = await canvas.evaluate((c) => c.toDataURL());
  await page.getByRole("button", { name: "Fold space", exact: true }).click();
  const after = await canvas.evaluate((c) => c.toDataURL());
  assert.notEqual(after, before);
  await page.waitForTimeout(250);
  assert.equal(await canvas.evaluate((c) => c.toDataURL()), after);
  await expect(page.locator("header [data-motion-toggle]")).toHaveAccessibleName("Resume motion");
});
