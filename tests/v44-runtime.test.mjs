// The V44 front door in a real browser: the things lint, axe and Lighthouse cannot see.
// Run with `npm run test:v44` after a build, or set V44_URL to a served build.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { transcript } from "../scripts/v44-status.mjs";

const url = process.env.V44_URL;
let browser;
before(async () => {
  assert.ok(url, "Set V44_URL to the built front door.");
  browser = await chromium.launch({
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" }),
    headless: true,
  });
});
after(async () => browser?.close());

async function visit(t, { width = 1440, height = 900, mobile = false, motion = "reduce", hash = "" } = {}) {
  const context = await browser.newContext({
    viewport: { width, height },
    isMobile: mobile,
    hasTouch: mobile,
    reducedMotion: motion,
  });
  t.after(() => context.close());
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  t.after(() => assert.deepEqual(errors, [], "the front door runs without errors"));
  await page.goto(new URL(`/${hash}`, url).href, { waitUntil: "networkidle" });
  return page;
}

const SIZES = [
  [320, 568, true],
  [375, 667, true],
  [390, 844, true],
  [844, 390, true],
  [834, 1194, true],
  [1024, 600, false],
  [1366, 768, false],
  [1440, 900, false],
  [3822, 1600, false],
];

test("every arrival fits its first screen, clear of the header and of Bit, without sideways scroll", async (t) => {
  for (const [width, height, mobile] of SIZES) {
    const page = await visit(t, { width, height, mobile });
    const m = await page.evaluate(() => {
      const box = (s) => document.querySelector(s).getBoundingClientRect();
      const bit = document.querySelector(".bit");
      const b = bit.getBoundingClientRect();
      const cta = box(".cta[data-transit-go]");
      const shown = getComputedStyle(bit).visibility !== "hidden";
      return {
        kicker: box(".arrival .kicker").top,
        header: box(".hud-bar").bottom,
        cta: cta.bottom,
        bitOnCta: shown && b.left < cta.right && cta.left < b.right && b.top < cta.bottom && cta.top < b.bottom,
        wide: document.documentElement.scrollWidth > innerWidth,
      };
    });
    const size = `${width}×${height}`;
    assert.ok(m.kicker >= m.header + 8, `${size}: the kicker starts below the header`);
    assert.ok(m.cta <= height, `${size}: the call to action is inside the first screen`);
    assert.equal(m.bitOnCta, false, `${size}: Bit does not cover the call to action`);
    assert.equal(m.wide, false, `${size}: no horizontal scroll`);
  }
});

test("the header turns solid once the page scrolls, so text never runs behind it", async (t) => {
  for (const [width, height, mobile] of [
    [390, 844, true],
    [1440, 900, false],
  ]) {
    const page = await visit(t, { width, height, mobile });
    const hud = page.locator("[data-hud]");
    await expect(hud).not.toHaveAttribute("data-scrolled", "");
    await page.evaluate(() => scrollTo(0, document.querySelector("#workshop").offsetTop));
    await expect(hud).toHaveAttribute("data-scrolled", "");
    // The header fades to solid; wait for the fade, then read the alpha of its background color.
    await expect
      .poll(() =>
        hud.evaluate((node) => Number(getComputedStyle(node).backgroundColor.match(/,\s*([\d.]+)\)$/)?.[1] ?? 1)),
      )
      .toBeGreaterThanOrEqual(0.85);
  }
});

test("keyboard focus is visible on every cut corner control", async (t) => {
  const page = await visit(t);
  for (const selector of [
    "[data-motion-toggle]",
    ".chip-solid",
    ".cta[data-transit-go]",
    "[data-screen-play]",
    "a.sovereign",
    "a.hangar",
    ".eve-quick .chip",
    ".profile-links .chip",
  ]) {
    const control = page.locator(selector).first();
    await control.scrollIntoViewIfNeeded();
    await page.evaluate(() => document.activeElement?.blur());
    const before = await control.screenshot();
    await page.keyboard.press("Shift+Tab");
    await control.focus();
    await expect(control).toBeFocused();
    const ring = await control.evaluate((node) => {
      const s = getComputedStyle(node);
      return {
        visible: node.matches(":focus-visible"),
        width: parseFloat(s.outlineWidth),
        offset: parseFloat(s.outlineOffset),
      };
    });
    assert.ok(ring.visible && ring.width >= 2, `${selector} shows a focus ring`);
    assert.ok(ring.offset < 0, `${selector} draws its ring inside the clipped shape`);
    assert.notDeepEqual(await control.screenshot(), before, `${selector} looks different when focused`);
  }
});

test("the station sheet marks the current station, moves focus to the chosen one and keeps Back", async (t) => {
  const page = await visit(t, { width: 390, height: 844, mobile: true });
  const menu = page.locator("[data-menu-toggle]");
  const sheet = page.locator("#station-sheet");
  await expect(sheet.locator("a")).toHaveCount(7);
  await menu.click();
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('a[aria-current="true"]')).toHaveAttribute("href", "#arrival");
  await sheet.locator('a[href="#helm"]').click();
  await expect(sheet).toBeHidden();
  await expect(page.locator("#helm-title")).toBeFocused();
  assert.equal(new URL(page.url()).hash, "#helm");
  await menu.click();
  await page.mouse.click(20, 600);
  await expect(sheet).toBeHidden();
  await page.goBack();
  await expect.poll(() => new URL(page.url()).hash).toBe("");
});

test("Pause stills the page: typing finishes and nothing keeps animating", async (t) => {
  const page = await visit(t, { motion: "no-preference" });
  await page.locator("#evidence").scrollIntoViewIfNeeded();
  await page.locator("#eve-cmd").fill("backups");
  await page.keyboard.press("Enter");
  await page.locator("[data-motion-toggle]").click();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
  await expect(page.locator("[data-motion-toggle]")).toHaveAccessibleName("Resume motion");
  const line = page.locator("[data-eve-log] p").last();
  assert.equal(
    await line.locator('[aria-hidden="true"]').textContent(),
    await line.locator(".sr").textContent(),
    "the typed line is complete the moment motion pauses",
  );
  await expect(page.locator("[data-eve-log]")).not.toHaveAttribute("data-typing", "");
  await expect(page.locator("[data-bit-open]")).not.toHaveAttribute("data-spinning", "");
  await page.waitForTimeout(200);
  const running = await page.evaluate(
    () =>
      document
        .getAnimations()
        .filter((a) => a.playState === "running" && Number.isFinite(a.effect?.getTiming().iterations ?? 1) === false)
        .length,
  );
  assert.equal(running, 0, "no endless animation runs while paused");
});

test("E.V.E. counts the same withheld list the page prints and ignores inherited words", async (t) => {
  const page = await visit(t);
  const printed = await page.locator("details.withheld").first().locator("li").count();
  await page.locator("#eve-cmd").fill("limits");
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-eve-log]")).toContainText(`Withheld or unmeasured: ${printed} items`);
  await page.locator("#eve-cmd").fill("constructor");
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-eve-log] p").last()).toContainText("Unknown command");
  await expect(page.locator("#eve-cmd")).toHaveAccessibleName("E.V.E. command");
});

test("E.V.E.'s opening readout never arrives after a visitor has already spoken", async (t) => {
  const page = await visit(t);
  // The visitor speaks while E.V.E. is still off screen, then she comes into view.
  await page.evaluate(() => {
    const input = document.querySelector("#eve-cmd");
    input.value = "constructor";
    input.form.requestSubmit();
  });
  await page.locator("[data-eve]").scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await expect(page.locator("[data-eve-log] p").last()).toContainText("Unknown command");
  await expect(page.locator("[data-eve-log]")).not.toContainText("loaded.");
});

test("the helm map draws the route the rule chose", async (t) => {
  const page = await visit(t);
  const map = page.locator("[data-route-map]");
  await expect(map).toHaveAttribute("data-route", "workhorse");
  await page.locator('input[value="analyze"]').check({ force: true });
  await expect(map).toHaveAttribute("data-route", "synthesis");
  await page.locator('input[name="sources"]').check({ force: true });
  await expect(map).toHaveAttribute("data-route", "research");
  await page.locator('input[name="privateData"]').check({ force: true });
  await expect(map).toHaveAttribute("data-route", "hold");
  await expect(page.locator("[data-helm-lane]")).toHaveText("Human review");
});

test("the trailer's words come from its captions and step aside for the silent shorts", async (t) => {
  const page = await visit(t, { width: 390, height: 844, mobile: true });
  const cues = transcript(
    await readFile(new URL("../public/assets/hero/cashio-trailer-text.vtt", import.meta.url), "utf8"),
  );
  const words = page.locator("[data-transcript]");
  await expect(words.locator("li")).toHaveCount(cues.length);
  await page.locator('[data-film="shorts"]').click();
  await expect(words).toBeHidden();
  // The silent shorts bring their own text alternative: what happens on screen.
  await expect(page.locator('[data-film-words="shorts"]')).toBeVisible();
  await expect(page.locator('[data-film-words="shorts"] li')).toHaveCount(3);
  await expect(page.locator("[data-screen-video]")).toHaveAttribute("aria-label", "Studio shorts");
  await page.locator('[data-film="trailer"]').click();
  await expect(words).toBeVisible();
});

test("Bit stays out of the arrival on phones and answers for what the visitor did", async (t) => {
  const page = await visit(t, { width: 390, height: 844, mobile: true });
  const bit = page.locator("[data-bit-open]");
  await expect(bit).toBeHidden();
  await page.locator("#helm").scrollIntoViewIfNeeded();
  await page.locator('input[name="privateData"]').check({ force: true });
  await expect(bit).toBeVisible();
  await bit.click();
  await expect(page.locator("[data-bit-line]")).toContainText("held it for a person");
  await expect(page.locator('[data-bit-go="helm"]')).toBeHidden();
  await page.locator('[data-bit-go="eve"]').click();
  // On a touch screen Bit lands on E.V.E.'s console, so arriving does not raise the keyboard.
  await expect(page.locator("[data-eve-log]")).toBeFocused();
});

test("V43 deep links open the preserved edition and V44 stations stay home", async (t) => {
  const page = await visit(t, { hash: "#studies" });
  await expect.poll(() => new URL(page.url()).pathname).toBe("/v43/");
  await page.goto(new URL("/#rooms", url).href);
  await expect.poll(() => new URL(page.url()).hash).toBe("#worlds");
  assert.equal(new URL(page.url()).pathname, "/");
  // A link to a heading or a field on this page is this page's own, never the old edition's.
  for (const id of ["helm-title", "evidence-title", "eve-cmd", "map-title"]) {
    await page.goto(new URL(`/#${id}`, url).href, { waitUntil: "networkidle" });
    assert.equal(new URL(page.url()).pathname, "/", id);
    assert.equal(new URL(page.url()).hash, `#${id}`, id);
  }
});

test("an old alias on a loaded page travels to its station and moves focus there", async (t) => {
  const page = await visit(t);
  await page.evaluate(() => (location.hash = "#rooms"));
  await expect.poll(() => new URL(page.url()).hash).toBe("#worlds");
  await expect(page.locator("#worlds-title")).toBeFocused();
  await expect(page.locator("#worlds-title")).toBeInViewport();
});

test("a film that ends returns to its poster without taking focus from elsewhere", async (t) => {
  const page = await visit(t);
  const video = page.locator("[data-screen-video]");
  await page.locator('[data-film="shorts"]').click();
  await expect(video).toBeVisible();
  // Skip to the end of each clip in the shorts reel, so the whole playlist finishes quickly.
  await page.evaluate(() => {
    const v = document.querySelector("[data-screen-video]");
    const skip = () => (v.currentTime = Math.max(0, v.duration - 0.3));
    v.addEventListener("loadedmetadata", skip);
    if (v.duration) skip();
  });
  await page.locator("#eve-cmd").focus();
  await expect(video).toBeHidden({ timeout: 20000 });
  await expect(page.locator("[data-screen-play]")).toBeVisible();
  await expect(page.locator("#eve-cmd")).toBeFocused();
});

test("the trailer poster shows its art without letterbox bars, with Play underneath", async (t) => {
  const page = await visit(t);
  const poster = await page.locator("[data-screen-poster]").boundingBox();
  const play = await page.locator("[data-screen-play]").boundingBox();
  assert.ok(Math.abs(poster.width / poster.height - 2.39) < 0.02, "the poster is framed at 2.39 to 1");
  assert.ok(play.y >= poster.y + poster.height - 1, "the play row sits below the poster, not over it");
});

test("Back after the first jump returns to the top of the arrival", async (t) => {
  const page = await visit(t);
  await page.locator(".cta[data-transit-go]").click();
  await expect.poll(() => new URL(page.url()).hash).toBe("#cinema");
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(300);
  await page.goBack();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(5);
});

test("on phones Bit steps aside while reading down, returns, and its card closes on an outside tap", async (t) => {
  const page = await visit(t, { width: 390, height: 844, mobile: true });
  const bit = page.locator("[data-bit-open]");
  await page.evaluate(() => scrollTo(0, document.querySelector("#worlds").offsetTop));
  await expect(bit).toBeVisible();
  await page.evaluate(() => scrollBy(0, 400));
  // It fades and lets taps through, but stays in the page so a keyboard can still reach it.
  await expect(bit).toHaveCSS("opacity", "0");
  await expect(bit).toHaveCSS("pointer-events", "none");
  await expect(bit).toHaveCSS("opacity", "1", { timeout: 4000 });
  await bit.click();
  const card = page.locator("[data-bit-dialog]");
  await expect(card).toBeVisible();
  await page.mouse.click(30, 300);
  await expect(card).toBeHidden();
});

test("with motion on, tabbing into a card that has not faded in yet shows it at once", async (t) => {
  const page = await visit(t, { motion: "no-preference" });
  const card = page.locator(".world").first();
  await expect(card).not.toHaveClass(/\bin\b/);
  await card.locator("a").first().focus();
  await expect(card).toHaveClass(/\bin\b/);
  assert.equal(await card.evaluate((node) => getComputedStyle(node).opacity), "1");
});

test("the station sheet closes when the window widens to the desktop navigation", async (t) => {
  const page = await visit(t, { width: 900, height: 900 });
  await page.locator("[data-menu-toggle]").click();
  await expect(page.locator("#station-sheet")).toBeVisible();
  await page.setViewportSize({ width: 1300, height: 900 });
  await expect(page.locator("#station-sheet")).toBeHidden();
});

test("without JavaScript the controls that need it are switched off and the notice says why", async (t) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  t.after(() => context.close());
  const page = await context.newPage();
  await page.goto(new URL("/", url).href);
  await expect(page.locator("[data-screen-play]")).toBeDisabled();
  await expect(page.locator("[data-bit-open]")).toBeDisabled();
  await expect(page.locator("#eve-cmd")).toBeDisabled();
  await expect(page.locator(".noscript")).toContainText("their controls stay switched off");
  await expect(page.locator("h1")).toBeVisible();
});

test("on a phone the helm's result follows the inputs that change it", async (t) => {
  for (const [width, height] of [
    [320, 568],
    [390, 844],
  ]) {
    const page = await visit(t, { width, height, mobile: true });
    const toggle = page.locator('input[name="privateData"]');
    // Put the switch a third of the way down the screen, where a thumb would use it, then flip it.
    await toggle.evaluate((el) => {
      const top = el.closest(".switch").getBoundingClientRect().top;
      scrollTo({ top: scrollY + top - innerHeight * 0.35, behavior: "auto" });
    });
    await toggle.check({ force: true });
    await expect(page.locator("[data-helm-lane]")).toHaveText("Human review");
    const lane = await page.locator("[data-helm-lane]").boundingBox();
    assert.ok(lane.y >= 0 && lane.y + lane.height <= height, `${width}x${height}: lane at ${lane.y}`);
  }
});

test("on a phone, choosing a film brings the screen into view under the header", async (t) => {
  for (const [width, height] of [
    [320, 568],
    [390, 844],
  ]) {
    const page = await visit(t, { width, height, mobile: true });
    const reel = page.locator('[data-film="shorts"]');
    await reel.scrollIntoViewIfNeeded();
    await reel.click();
    await expect(page.locator("[data-screen-video]")).toBeVisible();
    await expect
      .poll(async () => {
        const header = await page.locator(".hud-bar").boundingBox();
        const video = await page.locator("[data-screen-video]").boundingBox();
        return video.y >= header.y + header.height - 1 && video.y + video.height <= height;
      })
      .toBe(true);
  }
});

test("the scope film keeps the poster's 2.39 frame while it plays", async (t) => {
  const page = await visit(t);
  const before = await page.locator("[data-screen-poster]").boundingBox();
  await page.locator("[data-screen-play]").click();
  const video = page.locator("[data-screen-video]");
  await expect(video).toBeVisible();
  const box = await video.boundingBox();
  assert.ok(Math.abs(box.width / box.height - 2.39) < 0.02, `ratio ${box.width / box.height}`);
  assert.ok(Math.abs(box.height - before.height) < 2, "the frame does not grow on Play");
});

test("the header keeps its chips on one line at every width, and the stations fit beside them", async (t) => {
  const page = await visit(t, { width: 1180, height: 800 });
  for (const width of [1024, 1180, 1200, 1220, 1239, 1240, 1260, 1366]) {
    await page.setViewportSize({ width, height: 800 });
    const m = await page.evaluate(() => {
      const chips = [...document.querySelectorAll(".hud-actions .chip")].filter(
        (c) => getComputedStyle(c).display !== "none",
      );
      const list = document.querySelector(".stations ol").getBoundingClientRect();
      const actions = document.querySelector(".hud-actions").getBoundingClientRect();
      const nav = getComputedStyle(document.querySelector(".stations")).display !== "none";
      return {
        tallest: Math.max(...chips.map((c) => c.getBoundingClientRect().height)),
        clear: !nav || list.right <= actions.left,
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    assert.ok(m.tallest <= 44, `${width}: a chip wrapped (${m.tallest}px)`);
    assert.ok(m.clear, `${width}: the stations run into the chips`);
    assert.equal(m.overflow, false, `${width}: sideways scroll`);
  }
});

test("on short laptop screens the gate readout steps aside for Bit", async (t) => {
  for (const [width, height, shown] of [
    [1280, 720, false],
    [1024, 600, false],
    [1366, 768, true],
    [1440, 900, true],
  ]) {
    const page = await visit(t, { width, height });
    const readout = page.locator(".gate-readout");
    if (!shown) {
      await expect(readout).toBeHidden();
      continue;
    }
    await expect(readout).toBeVisible();
    const r = await readout.boundingBox();
    const b = await page.locator("[data-bit-open]").boundingBox();
    const overlap = !(r.x + r.width <= b.x || b.x + b.width <= r.x || r.y + r.height <= b.y || b.y + b.height <= r.y);
    assert.equal(overlap, false, `${width}x${height}: Bit covers the readout`);
  }
});

test("E.V.E. opens with her own reading and stays quiet until the visitor speaks", async (t) => {
  const page = await visit(t);
  const log = page.locator("[data-eve-log]");
  await page.locator("[data-eve]").scrollIntoViewIfNeeded();
  await expect(log).toContainText("loaded");
  await expect(log.locator(".you")).toHaveCount(0);
  await expect(log).toHaveAttribute("aria-live", "off");
  await page.locator("#eve-cmd").fill("version");
  await page.locator("#eve-cmd").press("Enter");
  await expect(log.locator(".you")).toHaveText(["version"]);
  await expect(log).toHaveAttribute("aria-live", "polite");
  await expect(log).toContainText("Mentat");
});

test("each station lights the sky in its own color", async (t) => {
  const page = await visit(t);
  const sky = page.locator(".sky");
  for (const id of ["cinema", "helm", "doug"]) {
    await page.evaluate((s) => document.getElementById(s).scrollIntoView(), id);
    await expect(sky).toHaveAttribute("data-at", id);
  }
  // On the painted poster only the current station's light is lit, and the change is a crossfade of opacity.
  const lit = await page.evaluate(() =>
    [...document.querySelectorAll("[data-tint]")]
      .filter((el) => getComputedStyle(el).opacity === "1")
      .map((el) => el.dataset.tint),
  );
  assert.deepEqual(lit, ["doug"]);
});

test("keyboard focus finishes a fade that scrolling had already started", async (t) => {
  const page = await visit(t, { motion: "no-preference" });
  const card = page.locator(".world").first();
  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveClass(/\bin\b/);
  await card.locator("a").first().focus();
  await expect(card).toHaveAttribute("data-reveal", "now");
  assert.equal(await card.evaluate((node) => getComputedStyle(node).opacity), "1");
});

const CHROME = process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" };

test("axe finds no WCAG 2.2 AA or best practice violations at the contract widths, disclosures open", async (t) => {
  for (const [width, height, mobile] of [
    [320, 568, true],
    [390, 844, true],
    [834, 1194, true],
    [1440, 900, false],
    [3822, 1600, false],
  ]) {
    const page = await visit(t, { width, height, mobile });
    await page.evaluate(() => document.querySelectorAll("details:not([hidden])").forEach((d) => (d.open = true)));
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
      .analyze();
    const found = result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
    assert.deepEqual(found, [], `${width}x${height}`);
  }
});

test("Pause stops the live gate's frame loop, not only the page's animations", async (t) => {
  const gl = await chromium.launch({
    ...CHROME,
    headless: true,
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
  });
  t.after(() => gl.close());
  const context = await gl.newContext({ viewport: { width: 1280, height: 720 }, reducedMotion: "no-preference" });
  const page = await context.newPage();
  await page.goto(new URL("/?gl=force", url).href, { waitUntil: "networkidle" });
  const canvas = page.locator(".sky-canvas");
  await expect(canvas).toHaveAttribute("data-running", "", { timeout: 10000 });
  await page.locator("[data-motion-toggle]").click();
  await expect(canvas).not.toHaveAttribute("data-running");
  // Still paused a moment later: nothing wakes the loop behind the visitor's back.
  await page.mouse.move(400, 300);
  await page.waitForTimeout(400);
  await expect(canvas).not.toHaveAttribute("data-running");
});

test("Bit's card closes from the keyboard: Escape from anywhere, or focus leaving the card", async (t) => {
  const page = await visit(t);
  const bit = page.locator("[data-bit-open]");
  const card = page.locator("[data-bit-dialog]");
  await page.evaluate(() => document.getElementById("worlds").scrollIntoView());
  await bit.click();
  await expect(card).toBeVisible();
  await page.locator("#eve-cmd").focus();
  await expect(card).toBeHidden();
  await bit.click();
  await expect(card).toBeVisible();
  await page.locator("#eve-cmd").focus();
  await bit.click();
  await expect(card).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(card).toBeHidden();
  await expect(bit).toBeFocused();
});

test("the transit line still reaches its end after the page changes height", async (t) => {
  const page = await visit(t);
  const progress = () =>
    page.evaluate(() =>
      Number(getComputedStyle(document.querySelector("[data-transit-fill]")).getPropertyValue("--progress")),
    );
  // Measure with every disclosure open, then close them again: the page is shorter than it was measured.
  await page.evaluate(() => document.querySelectorAll("details:not([hidden])").forEach((d) => (d.open = true)));
  await page.setViewportSize({ width: 1440, height: 901 });
  await page.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = false)));
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(progress).toBeGreaterThan(0.995);
});

test("printing gives the words and the record on paper, with no sky and no plate left faded", async (t) => {
  const page = await visit(t, { motion: "no-preference" });
  await page.emulateMedia({ media: "print" });
  const m = await page.evaluate(() => ({
    sky: getComputedStyle(document.querySelector(".sky")).display,
    hud: getComputedStyle(document.querySelector(".hud")).display,
    faded: [...document.querySelectorAll("[data-reveal]")].filter((el) => getComputedStyle(el).opacity !== "1").length,
    ink: getComputedStyle(document.querySelector("#evidence-title")).color,
  }));
  assert.deepEqual(m, { sky: "none", hud: "none", faded: 0, ink: "rgb(17, 17, 17)" });
});

test("Bit offers only places the visitor is not already at, and every destination exists", async (t) => {
  const page = await visit(t);
  const targets = await page.evaluate(() =>
    [...document.querySelectorAll("[data-bit-go]")].map((b) => ({
      go: Boolean(document.getElementById(b.dataset.bitGo)),
      station: Boolean(document.querySelector(`[data-station="${b.dataset.bitStation}"]`)),
    })),
  );
  assert.ok(
    targets.every((x) => x.go && x.station),
    "each Bit button names a real place and its station",
  );
  await page.evaluate(() => document.getElementById("evidence").scrollIntoView());
  await page.locator("[data-bit-open]").click();
  await expect(page.locator('[data-bit-go="eve"]')).toBeHidden();
  await expect(page.locator('[data-bit-go="helm"]')).toBeVisible();
});

test("the helm says its decision in one line to screen readers", async (t) => {
  const page = await visit(t);
  await page.locator('input[name="privateData"]').check({ force: true });
  await expect(page.locator("[data-helm-say]")).toHaveText("Human review. Held for a person.");
  assert.equal(await page.locator("[data-helm-result]").getAttribute("aria-live"), null);
});

test("Back hands keyboard focus to the control the journey started from", async (t) => {
  const page = await visit(t);
  await page.locator(".cta[data-transit-go]").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#cinema-title")).toBeFocused();
  await page.goBack();
  await expect(page.locator(".cta[data-transit-go]")).toBeFocused();
});

test("the live gate takes over from its poster only at the gate, never mid flight", async (t) => {
  const gl = await chromium.launch({
    ...CHROME,
    headless: true,
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
  });
  t.after(() => gl.close());
  const context = await gl.newContext({ viewport: { width: 640, height: 400 }, reducedMotion: "reduce" });
  // Note whether the live scene ever took over, even if a slow software renderer hands back to the poster later.
  // The visitor sets off from inside the page, before it has finished loading. A scroll sent from this test can
  // arrive after a quick page has already gone live at the gate, which is the page working as designed.
  await context.addInitScript(() => {
    window.__wentLive = false;
    new MutationObserver(() => {
      if (document.querySelector(".sky")?.hasAttribute("data-live")) window.__wentLive = true;
    }).observe(document, { attributes: true, subtree: true, attributeFilter: ["data-live"] });
    addEventListener("DOMContentLoaded", () => scrollTo({ top: 300, behavior: "instant" }), { once: true });
  });
  const page = await context.newPage();
  await page.goto(new URL("/?gl=force", url).href, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  assert.equal(await page.evaluate(() => scrollY), 300, "the visitor has set off");
  await page.waitForTimeout(1500);
  assert.equal(await page.evaluate(() => window.__wentLive), false, "the poster keeps the scene while away");
  await page.evaluate(() => scrollTo(0, 0));
  await expect.poll(() => page.evaluate(() => window.__wentLive), { timeout: 10000 }).toBe(true);
});

test("a shared route opens the helm on the same decision", async (t) => {
  const page = await visit(t, { hash: "?route=research.private#helm" });
  await expect(page.locator('input[value="research"]')).toBeChecked();
  await expect(page.locator('input[name="privateData"]')).toBeChecked();
  await expect(page.locator('input[name="sources"]')).not.toBeChecked();
  await expect(page.locator("[data-helm-lane]")).toHaveText("Human review");
  await expect(page.locator("[data-route-map]")).toHaveAttribute("data-route", "hold");
  assert.equal(new URL(page.url()).pathname, "/", "a shared route stays on the front door");
  // A link the helm did not write opens the helm as it ships.
  await page.goto(new URL("/?route=banana#helm", url).href, { waitUntil: "networkidle" });
  await expect(page.locator("[data-helm-lane]")).toHaveText("Workhorse");
});

test("sharing a route hands over a link to the decision on screen", async (t) => {
  for (const [width, height, mobile] of [
    [1440, 900, false],
    [320, 568, true],
  ]) {
    const page = await visit(t, { width, height, mobile });
    // Take the clipboard's place, and leave no share sheet, so the test reads exactly what the page would copy.
    await page.evaluate(() => {
      window.__copied = null;
      Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: async (text) => void (window.__copied = text) },
        configurable: true,
      });
    });
    await page.locator('input[value="analyze"]').check({ force: true });
    await page.locator('input[name="sources"]').check({ force: true });
    const share = page.locator("[data-helm-share]");
    await share.scrollIntoViewIfNeeded();
    const box = await share.boundingBox();
    assert.ok(box.height >= 44, `${width}: the share control is ${box.height}px tall`);
    assert.ok(box.x >= 0 && box.x + box.width <= width, `${width}: the share control fits the screen`);
    await share.click();
    await expect(page.locator(".toast")).toContainText("Link copied");
    assert.equal(await page.evaluate(() => window.__copied), new URL("/?route=analyze.sources#helm", url).href);
    // When copying is refused, the address bar carries the link instead.
    await page.evaluate(() => {
      navigator.clipboard.writeText = async () => {
        throw new Error("refused");
      };
    });
    await page.locator('input[name="privateData"]').check({ force: true });
    await share.click();
    await expect.poll(() => new URL(page.url()).search).toBe("?route=analyze.private.sources");
    assert.equal(new URL(page.url()).hash, "#helm");
  }
});

test("the arrival says who is speaking where there is room, and the record says how old it is", async (t) => {
  for (const [width, height, mobile, shown] of [
    [1440, 900, false, true],
    [1366, 768, false, true],
    [834, 1194, true, true],
    [1024, 600, false, false],
    [390, 844, true, false],
  ]) {
    const page = await visit(t, { width, height, mobile });
    const creds = page.locator(".arrival .creds");
    if (shown) {
      await expect(creds).toBeVisible();
      await expect(creds.locator("li")).toHaveCount(3);
      const m = await page.evaluate(() => ({
        creds: document.querySelector(".creds").getBoundingClientRect().bottom,
        cta: document.querySelector(".cta[data-transit-go]").getBoundingClientRect().top,
      }));
      assert.ok(m.creds <= m.cta, `${width}×${height}: the facts sit above the call to action`);
    } else await expect(creds).toBeHidden();
  }
  const page = await visit(t);
  const age = page.locator(".observed .age");
  const day = await page.locator(".observed time").getAttribute("datetime");
  const expected = await page.evaluate((iso) => {
    const [y, m, d] = iso.split("-").map(Number);
    const now = new Date();
    const days = Math.round(
      (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(y, m - 1, d)) / 864e5,
    );
    return days === 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`;
  }, day);
  await expect(age).toHaveText(expected);
});

test("a forced color palette still shows what is chosen, what is on and where the visitor is", async (t) => {
  // Reduced motion, so a painted state is read after it has landed and not part way through a fade.
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    forcedColors: "active",
    reducedMotion: "reduce",
  });
  t.after(() => context.close());
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  const paint = (selector, pseudo) =>
    page.evaluate(
      ([s, p]) => getComputedStyle(document.querySelector(s), p || undefined).backgroundColor,
      [selector, pseudo],
    );
  const track = '[data-helm] input[name="privateData"] + .switch-track';
  const off = await paint(track);
  await page.locator('[data-helm] input[name="privateData"]').check({ force: true });
  assert.notEqual(await paint(track), off, "a switch that is on is painted differently from one that is off");
  assert.notEqual(
    await paint('[data-helm] input[name="intent"]:checked + span'),
    await paint('[data-helm] input[name="intent"]:not(:checked) + span'),
    "the chosen work stands out from the others",
  );
  const edge = (selector) =>
    page.evaluate((s) => getComputedStyle(document.querySelector(s)).borderBottomColor, selector);
  assert.notEqual(
    await edge('.stations a[aria-current="true"]'),
    await edge('.stations a:not([aria-current="true"])'),
    "only the current station is underlined",
  );
  const cta = await page.evaluate(() => {
    const style = getComputedStyle(document.querySelector(".cta[data-transit-go]"));
    return { clip: style.clipPath, border: parseFloat(style.borderTopWidth) };
  });
  assert.equal(cta.clip, "none", "the call to action keeps a whole border");
  assert.ok(cta.border >= 2, "the call to action is drawn as a button");
});
