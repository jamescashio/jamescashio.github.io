import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
import path from "node:path";

const url = process.env.HELIOS_URL || "http://127.0.0.1:4388/";
const output = path.resolve(process.env.HELIOS_QA_DIR || "../qa/final");
let browser;
before(async () => {
  await fs.mkdir(output, { recursive: true });
  browser = await chromium.launch({
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" }),
    headless: true,
  });
});
after(async () => {
  await browser?.close();
});
async function visit(t, { width = 1440, height = 1000, motion = "reduce", hash = "", expandWorkbenches = true } = {}) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: motion,
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();
  const errors = [];
  const broken = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (response) => {
    if (response.status() >= 400) broken.push(response.url());
  });
  t.after(async () => {
    await context.close();
    assert.deepEqual(errors, [], "no JavaScript errors");
    assert.deepEqual(broken, [], "no failed asset requests");
  });
  await page.goto(url + hash, { waitUntil: "networkidle" });
  await expect(page.locator("#study-hermes")).toBeAttached();
  // Feature checks begin with their controls open through the same disclosure a visitor uses.
  // The dedicated first-visit test below checks the collapsed default and shared-link reveal.
  if (expandWorkbenches && (!hash || /^#(?:work$|universe$|build=|studies$|request-journey$)/.test(hash))) {
    for (const id of ["study-lab", "atlas-lab"]) {
      const disclosure = page.locator(`#${id}`);
      if (!(await disclosure.evaluate((element) => element.open))) {
        await disclosure.locator("summary").first().click();
        await expect(disclosure).toHaveAttribute("open", "");
      }
    }
    if (!hash) await page.locator("#top").scrollIntoViewIfNeeded();
  }
  return page;
}
async function audit(page, label) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
    .analyze();
  await fs.writeFile(path.join(output, `axe-${label}.json`), JSON.stringify(result, null, 2));
  assert.deepEqual(
    result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    [],
    label,
  );
}
async function choose(page, id) {
  await page.locator(`#study-${id}`).click();
  await expect(page.locator(`#study-${id}`)).toHaveAttribute("aria-selected", "true");
}

test("Privacy feedback answers each new prediction at once and stays complete when motion is interrupted", async (t) => {
  for (const motion of ["reduce", "no-preference"]) {
    const page = await visit(t, { width: 320, height: 700, motion, hash: "#work" });
    await expect(page.locator("#pv-live")).toBeEmpty();
    await expect(page.locator("#pv-result")).toBeHidden();
    await expect(page.locator("#pv-answer")).toHaveText("Your call.");
    // Choosing a prediction reveals the answer in the same click.
    await page.locator('[data-pv="keep"]').click();
    await expect(page.locator("#pv-result")).toBeVisible();
    await expect(page.locator("#pv-text")).toContainText("Not quite. Privacy wins.");
    await expect(page.locator("#pv-answer")).toHaveText("Human review");
    await expect(page.locator("#pv-live")).toContainText("Your prediction: Research.");
    await expect(page.locator("#pv-trace")).toBeVisible();
    // A new prediction replaces the old feedback rather than adding to it.
    await page.locator('[data-pv="human"]').click();
    await expect(page.locator("#pv-text")).not.toContainText("Not quite");
    await expect(page.locator("#pv-live")).toContainText("You called it.");
    await expect(page.locator("#pv-live")).toContainText("Your prediction: Human review.");
    await expect(page.locator('[data-pv="human"]')).toBeFocused();
    await expect(page.locator('[data-pv="keep"]')).toHaveAttribute("aria-pressed", "false");
    for (let i = 0; i < 3; i++) await page.locator("#pv-reveal").click();
    if (motion === "no-preference") await page.locator("#motion-btn").click();
    await expect(page.locator("#pv-answer")).toHaveText("Human review");
    await expect(page.locator("#pv-route .pv-command")).toBeVisible();
    await expect(page.locator("#pv-route .pv-question")).toBeHidden();
    await expect(page.locator("#pv-live")).toContainText("You called it.");
    await expect(page.locator("#pv-signal")).toHaveCSS("opacity", "0");
    await expect(page.locator("#pv-result")).toHaveCSS("opacity", "1");
    const choices = await page
      .locator("[data-pv]")
      .evaluateAll((buttons) => buttons.map((b) => b.getBoundingClientRect().top));
    assert.ok(Math.abs(choices[0] - choices[1]) < 1, "both predictions share one row on the narrow phone");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 320);
    await page.locator("#pv-prompt").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(output, `privacy-polish-${motion}.png`) });
    await audit(page, `privacy-polish-${motion}`);
  }
});

test("Flight heritage keeps the displayed photograph, lesson and history source in sync", async (t) => {
  const page = await visit(t, { width: 390, hash: "#heritage" });
  for (const [pilot, source] of [
    ["rutan", "airbornescience.nasa.gov"],
    ["johnson", "www.lockheedmartin.com"],
    ["hoover", "airandspace.si.edu"],
    ["yeager", "www.nasa.gov"],
  ]) {
    await page.locator(`#pilots [data-pilot="${pilot}"]`).click();
    await expect(page.locator(`#hangar img[data-pilot="${pilot}"]`)).toHaveClass(/\bon\b/);
    assert.equal(new URL(await page.locator("#hg-source").getAttribute("href")).hostname, source);
    assert.ok((await page.locator("#hg-body").textContent()).length > 80);
    await expect(page.locator("#hg-source")).toBeVisible();
  }
  await page.locator("#hg-card").screenshot({ path: path.join(output, "heritage-polish.png") });
});

test("Repeated signature ignition stays bounded and motion-off keeps a complete still response", async (t) => {
  const page = await visit(t, { width: 390, motion: "no-preference", hash: "#operator" });
  await expect(page.locator("#sigplate .sig-ring")).toHaveCSS("animation-name", "none");
  for (let i = 0; i < 3; i++) {
    await page.locator("#sig-btn").click();
    await expect(page.locator("#sigburst i")).toHaveCount(16);
  }
  await page.locator("#motion-btn").click();
  await page.locator("#sig-btn").click();
  await expect(page.locator("#sigburst i")).toHaveCount(0);
  await expect(page.locator("#sig-state")).toHaveText("ENERGIZED · GOLD INTENT");
  await expect(page.locator("#sig-art")).toHaveCSS("animation-name", "none");
  await expect(page.locator("#sig-state")).toHaveText("DORMANT · GOLD INTENT", { timeout: 6000 });
});

test("The compact study deck keeps readable tabs, keyboard selection and nearby controls on small screens", async (t) => {
  for (const width of [320, 390, 768]) {
    const page = await visit(t, { width, height: 844 });
    await page.locator("#study-hermes").focus();
    for (const key of ["End", "Home", "ArrowRight"]) {
      await page.keyboard.press(key);
      const active = page.locator('[role="tab"][aria-selected="true"]');
      await expect(active).toBeFocused();
      const bounds = await page.locator("#studies-list").evaluate((strip) => {
        const tab = strip.querySelector('[aria-selected="true"]');
        const tabBox = tab.getBoundingClientRect();
        const box = strip.getBoundingClientRect();
        return {
          left: tabBox.left - box.left,
          right: tabBox.right - box.right,
          height: box.height,
          title: parseFloat(getComputedStyle(tab.querySelector(".study-title")).fontSize),
          gap: document.querySelector("#instrument").getBoundingClientRect().top - box.bottom,
        };
      });
      assert.ok(bounds.left >= -1 && bounds.right <= 1, "the entire selected card is visible");
      assert.ok(bounds.height < 240, "the selector does not consume a screen of scrolling");
      assert.ok(bounds.title >= 16, "study titles remain readable at every phone width");
      assert.ok(bounds.gap >= 0 && bounds.gap < 55, "the controls immediately follow the selector");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    }
    await expect(page.locator("#st-name")).toHaveText("Know when to pause");
    await expect(page.locator("#st-codename")).toHaveText("Escalation Cascade");
    await page.locator("#studies-h").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(output, `study-deck-${width}.png`) });
  }
});

test("Mission presets and the last change match the model, including custom settings and unchanged counts", async (t) => {
  const page = await visit(t, { width: 390, hash: "#starship" });
  await expect(page.locator('[data-mission="routine"]')).toHaveAttribute("aria-pressed", "true");
  await page.locator('[data-mission="blackout"]').click();
  await expect(page.locator("#mission-state")).toHaveText("Deep space blackout · selected");
  await expect(page.locator("#w-change")).toHaveText("Local: 6 → 12 · Cloud: 6 → 0");
  await page.locator('[data-mission="blackout"]').click();
  await expect(page.locator("#w-change")).toHaveText("Local: 6 → 12 · Cloud: 6 → 0");
  await page.locator("#tg-permit").click();
  await expect(page.locator("#mission-state")).toHaveText("Custom flight plan · your settings");
  await expect(page.locator('[data-mission][aria-pressed="true"]')).toHaveCount(0);
  await expect(page.locator("#w-change")).toHaveText("Settings changed; the request counts stay the same.");
  await page.locator('[data-mission="classified"]').click();
  await expect(page.locator("#w-change")).toHaveText("Local: 12 → 0 · Held: 0 → 12");
  await page.locator("#tg-permit").click();
  await expect(page.locator("#w-change")).toHaveText("Cloud: 0 → 12 · Held: 12 → 0");
  await expect(page.locator("#decision-change")).toHaveAttribute("data-held", "false");
  await page.locator("#motion-btn").click();
  await expect(page.locator("#w-change")).toHaveText("Cloud: 0 → 12 · Held: 12 → 0");
});

test("The first-minute path, chapter labels and principles lead to their working destinations", async (t) => {
  const page = await visit(t);
  await page.locator('.hero a[href="#work"]').click();
  await expect(page.locator("#work-h")).toBeFocused();
  await page.locator("#mc-btn").click();
  await page.locator("#mc-search").fill("Starship build story");
  await page.locator('#mc-list a[href="#build-story"]').click();
  await expect(page.locator("#build-proof-title")).toBeFocused();
  await page.locator('.sections a[href="#evidence"]').click();
  await expect(page.locator("#ev-h")).toBeFocused();
  await expect
    .poll(() => page.locator("#evidence").evaluate((element) => Math.abs(element.getBoundingClientRect().top - 100)))
    .toBeLessThan(45);
  const chapter = page.locator('.sections a[href="#principles"]');
  await chapter.focus();
  await expect(chapter.locator("span")).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.locator("#pr-h")).toBeFocused();
  await expect(chapter).toHaveAttribute("aria-current", "location");
  await page.locator('[data-pr="1"]').click();
  await page.locator("#pr-action").click();
  await expect(page.locator("#study-hermes")).toHaveAttribute("aria-selected", "true");
  await page.locator('.sections a[href="#principles"]').click();
  await page.locator('[data-pr="2"]').click();
  await page.locator("#pr-action").click();
  await expect(page.locator("#study-dashboards")).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#lab-age")).toBeVisible();
  await page.locator('.sections a[href="#heritage"]').click();
  await expect(page.locator("#he-h")).toBeFocused();
});

test("Changing a routing input interrupts the old progress counter cleanly", async (t) => {
  const page = await visit(t, { motion: "no-preference" });
  await page.locator("#route-btn").click();
  await page.waitForTimeout(350);
  await page.locator("#tg-private").click();
  await page.waitForTimeout(1800);
  await expect(page.locator("#ringtxt")).toHaveText("00/05");
  await page.locator("#route-btn").click();
  await expect(page.locator("#ringtxt")).toHaveText("05/05");
  await expect(page.locator("#st-code")).toHaveText("HOLD");
});

test("The illustrated request manifest agrees with each scenario and motion stops outside the scene", async (t) => {
  const page = await visit(t, { width: 390, height: 844, motion: "no-preference", hash: "#starship" });
  for (const mission of ["routine", "blackout", "classified"]) {
    await page.locator(`[data-mission=${mission}]`).click();
    const counts = await page.locator("#n-local, #n-cloud, #n-held").allTextContents();
    for (const [i, kind] of ["local", "cloud", "held"].entries())
      await expect(page.locator(`#packets [data-kind=${kind}]`)).toHaveCount(Number(counts[i]));
    await expect(page.locator("#request-slots i")).toHaveCount(12);
    await expect(page.locator("#schem")).toHaveAttribute(
      "aria-label",
      new RegExp(`${counts[2]} held for human review`),
    );
    await page.locator("#flow-scene").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(output, `flow-${mission}-390.png`) });
  }
  await page.locator('[data-mission="routine"]').click();
  await page.locator("#flow-scene").scrollIntoViewIfNeeded();
  await expect(page.locator("#flow-scene")).toHaveAttribute("data-scene-active", "true");
  const packet = page.locator("#packets > g").first();
  const before = await packet.getAttribute("transform");
  await expect.poll(() => packet.getAttribute("transform")).not.toBe(before);
  // Leaving the Starship lab hides the scene, so its packets must stop.
  await page.locator(".room-back").click();
  await expect(page.locator("#flow-scene")).toHaveAttribute("data-scene-active", "false");
  const paused = await packet.getAttribute("transform");
  await page.waitForTimeout(200);
  assert.equal(await packet.getAttribute("transform"), paused, "offscreen packets do not keep animating");
  await page.locator("#motion-btn").click();
  await page.locator('.room-card[data-room-route="#starship"]').click();
  await page.locator("#flow-scene").scrollIntoViewIfNeeded();
  const still = await packet.getAttribute("transform");
  await page.waitForTimeout(200);
  assert.equal(await packet.getAttribute("transform"), still, "manual motion off produces a stable illustration");
  await audit(page, "instruments-motion-off-390");
});

test("Atlas traces restart once, pause offscreen, and become a complete static explanation with reduced motion", async (t) => {
  const page = await visit(t, { motion: "no-preference" });
  await page.locator("#trace-btn").click();
  await expect(page.locator("#atlas")).toHaveAttribute("data-tracing", "true");
  await expect(page.locator("#trace-label")).toHaveText("Human intent leaves the operator");
  await page.waitForTimeout(400);
  await page.locator("#trace-btn").click();
  await expect(page.locator("#trace-label")).toHaveText("Human intent leaves the operator");
  await page.locator("h1").scrollIntoViewIfNeeded();
  await expect(page.locator("#atlas")).toHaveAttribute("data-scene-active", "false");
  const packet = page.locator("#packet");
  const paused = await packet.getAttribute("transform");
  await page.waitForTimeout(200);
  assert.equal(await packet.getAttribute("transform"), paused);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("#atlas")).toHaveAttribute("data-tracing", "false");
  await expect(packet).toHaveAttribute("opacity", "0");
  await expect(page.locator("#trace-label")).toContainText("Zeus receives the work → Result returns for human review");
});

test("The 3D orbital engine pauses, preserves keyboard control, and recovers to its vector instrument", async (t) => {
  const page = await visit(t, { motion: "no-preference", hash: "#principles" });
  const engine = page.locator("#engine");
  await engine.scrollIntoViewIfNeeded();
  await expect(engine).toHaveAttribute("data-renderer", "webgl", { timeout: 15000 });
  await expect(engine).toHaveAttribute("data-animating", "true");
  await engine.press("ArrowRight");
  await expect(page.locator("#eng-rot")).toHaveAttribute("style", /rotate\(10deg\)/);
  await page.locator('[data-pr="2"]').click();
  await expect(page.locator('[data-ring-label="2"]')).toHaveClass("active");
  await engine.scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(output, "orbital-engine-3d.png") });
  // Leaving the Principles page hides the engine, so it must stop drawing until the page opens again.
  await page.locator(".room-back").click();
  await expect(engine).toHaveAttribute("data-animating", "false");
  await page.locator('.room-card[data-room-route="#principles"]').click();
  await engine.scrollIntoViewIfNeeded();
  await expect(engine).toHaveAttribute("data-animating", "true");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(engine).toHaveAttribute("data-animating", "false");
  await engine.press("Home");
  await expect(page.locator("#eng-rot")).toHaveAttribute("style", /rotate\(0deg\)/);
  // A real context loss must expose the complete fallback, without losing controls.
  await engine
    .locator("canvas")
    .evaluate((canvas) => canvas.getContext("webgl2").getExtension("WEBGL_lose_context").loseContext());
  await expect(engine).not.toHaveAttribute("data-renderer", "webgl");
  await expect(page.locator(".engine-fallback")).toHaveCSS("opacity", "1");
  await engine.press("ArrowLeft");
  await expect(page.locator("#eng-rot")).toHaveAttribute("style", /rotate\(-10deg\)/);
  await audit(page, "orbital-engine-fallback");
});

for (const width of [1440, 768, 390, 320])
  test(`Helios at ${width}px: content, menu, all studies and flight remain accessible`, async (t) => {
    const page = await visit(t, { width, height: width > 700 ? 1000 : 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width, "no horizontal page overflow");
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.locator("h1")).toContainText("Own the iron.");
    await audit(page, `home-${width}`);
    await page.screenshot({ path: path.join(output, `home-${width}.png`) });
    for (const id of ["cascade", "exposure", "briefing", "dashboards", "signal", "graphify", "hermes"]) {
      await choose(page, id);
      if (id === "hermes") await expect(page.locator(".ring-progress")).toBeVisible();
      else await expect(page.locator(".ring-progress")).not.toBeVisible();
      const result = await new AxeBuilder({ page })
        .include("#instrument")
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
        .analyze();
      assert.deepEqual(
        result.violations.map((v) => v.id),
        [],
        `${id} at ${width}px`,
      );
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    }
    await page.locator("#mc-btn").click();
    await expect(page.locator("#mc")).toBeVisible();
    await audit(page, `menu-${width}`);
    await page.keyboard.press("Escape");
    await expect(page.locator("#mc-btn")).toBeFocused();
    await page.goto(url + "#flight=permission");
    await expect(page.locator(".first-flight")).toBeVisible();
    await expect(page.locator(".ff-stage-ready,.ff-stage-fallback")).toBeVisible({ timeout: 45000 });
    await expect(page.locator("#ff-scene-title")).toHaveText("The final say is yours.");
    await expect(page.getByRole("button", { name: "Permit these private requests" })).toBeVisible();
    await audit(page, `flight-${width}`);
    await page.screenshot({ path: path.join(output, `flight-${width}.png`) });
    const dialog = await page
      .locator(".first-flight")
      .evaluate((el) => ({ width: el.clientWidth, scroll: el.scrollWidth }));
    assert.equal(dialog.width, dialog.scroll, "no clipped dialog content");
    await page.keyboard.press("Escape");
    await expect(page.locator(".first-flight")).toHaveCount(0);
    await page.locator("#sigplate").scrollIntoViewIfNeeded();
    await page.locator("#sig-art").evaluate((image) => image.decode());
    assert.equal(await page.locator("#sig-art").evaluate((image) => image.naturalWidth), 1680);
    const artwork = await page.locator("#sig-art").boundingBox();
    const controls = await page.locator("#sigplate .cap").boundingBox();
    assert.ok(controls.y >= artwork.y + artwork.height, "signature controls leave the artwork unobstructed");
    await page.locator("#sigplate").screenshot({ path: path.join(output, `signature-${width}.png`) });
  });

test("House Cashio signature loads, energizes, falls back to its original artwork, and opens the 3D studio", async (t) => {
  const page = await visit(t, { width: 390, height: 844, motion: "no-preference", hash: "#operator" });
  await page.locator("#sigplate").scrollIntoViewIfNeeded();
  await page.locator("#sig-art").evaluate((image) => image.decode());
  await page.locator("#sig-btn").click();
  await expect(page.locator("#sig-state")).toHaveText("ENERGIZED · GOLD INTENT");
  await expect(page.locator("#sig-state")).toHaveText("DORMANT · GOLD INTENT", { timeout: 6000 });
  await page.getByRole("link", { name: "Explore the celestial signature in 3D" }).click();
  await expect(page.locator("#brand-studio-title")).toHaveText("Celestial Forge");
  await expect(page.getByRole("button", { name: "Close celestial signature" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#brand-studio-title")).toHaveCount(0);
  await page.route(/\/v38\/(?:assets\/celestial|immutable\/celestial-[a-f0-9]+)\.webp$/, (route) => route.abort());
  await page.goto(url + "#operator");
  await page.reload();
  await page.locator("#sigplate").scrollIntoViewIfNeeded();
  await expect(page.locator("#sig-art")).toHaveAttribute("src", "/v38/assets/celestial.jpg");
  await page.locator("#sig-art").evaluate((image) => image.decode());
  assert.equal(await page.locator("#sig-art").evaluate((image) => image.naturalWidth), 1680);
});

test("Mission Control keeps search and Close in reach, recovers from empty results and finds the build story", async (t) => {
  for (const width of [1440, 390, 320]) {
    const page = await visit(t, { width, height: width === 320 ? 568 : 844 });
    await page.locator("#mc-btn").click();
    await expect(page.locator("#mc-search")).toBeFocused();
    await expect(page.locator("#mc-results")).toHaveText("Search the whole workshop");
    await expect(page.locator("#mc-clear")).toBeHidden();
    const searchBefore = await page.locator("#mc-search").boundingBox();
    const closeBefore = await page.locator("#mc-close").boundingBox();
    await page.screenshot({ path: path.join(output, `mission-control-${width}.png`) });
    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#mc-list a").last()).toBeFocused();
    await expect(page.locator("#mc-list a").last()).toBeInViewport();
    assert.ok(
      await page
        .locator(".mc-content")
        .evaluate((list) => list.scrollHeight <= list.clientHeight || list.scrollTop > 0),
    );
    for (const [selector, before] of [
      ["#mc-search", searchBefore],
      ["#mc-close", closeBefore],
    ]) {
      await expect(page.locator(selector)).toBeInViewport();
      const after = await page.locator(selector).boundingBox();
      assert.ok(Math.abs(after.y - before.y) < 1, `${selector} stays stationary when destinations scroll`);
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    await audit(page, `mission-control-${width}`);
    await page.locator("#mc-search").fill("no-such-destination");
    await expect(page.locator("#mc-results")).toHaveText("0 destinations found");
    await expect(page.locator(".mc-empty")).toContainText("clear the search");
    const clear = await page.locator("#mc-clear").boundingBox();
    assert.ok(clear.width >= 44 && clear.height >= 44, "clear search has a touch-sized target");
    await page.locator("#mc-clear").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#mc-search")).toBeFocused();
    await expect(page.locator("#mc-results")).toHaveText("Search the whole workshop");
    for (const query of ["build ship", "ship build"]) {
      await page.locator("#mc-search").fill(query);
      await expect(page.locator("#mc-results")).toHaveText("1 destination found");
      await expect(page.locator("#mc-list strong")).toHaveText("Starship build story");
    }
    await page.keyboard.press("Enter");
    await expect(page.locator("#build-proof-title")).toBeFocused();
    assert.equal(new URL(page.url()).hash, "#build-story");
    await page.locator("#mc-btn").click();
    await page.keyboard.press("Escape");
    await expect(page.locator("#mc-btn")).toBeFocused();
  }
});

test("Mission Control follows nested text and keyboard selection to the exact study", async (t) => {
  const page = await visit(t);
  await page.keyboard.press("Control+k");
  await page.locator("#mc-search").fill("Graphify");
  await page.locator("#mc-list strong").click();
  await expect(page.locator("#mc")).not.toBeVisible();
  await expect(page.locator("#st-name")).toHaveText("Trace a dependency");
  await expect(page.locator("#st-codename")).toHaveText("Graphify");
  await expect(page.locator("#instrument [data-module]")).toHaveCount(5);
  await page.keyboard.press("Control+k");
  await page.locator("#mc-search").fill("Escalation");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page.locator("#mc")).not.toBeVisible();
  await expect(page.locator("#lab-severity")).toBeVisible();
  await page.locator("#study-cascade").focus();
  await page.keyboard.press("End");
  await expect(page.locator("#study-graphify")).toBeFocused();
  await page.keyboard.press("Home");
  await expect(page.locator("#study-hermes")).toBeFocused();
});

test("The invitation and three starting routes work by keyboard, keep sound opt-in and restore focus", async (t) => {
  for (const width of [1440, 390, 320]) {
    const page = await visit(t, { width, height: width === 320 ? 740 : 1000 });
    await expect(page.locator("#hero-primary")).toBeInViewport();
    assert.equal(
      await page.evaluate(() =>
        performance.getEntriesByType("resource").some((resource) => /three\.module-/.test(resource.name)),
      ),
      false,
      "the optional 3D engine stays unloaded until requested",
    );
    await page.locator("#hero-primary").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".first-flight")).toHaveAttribute("data-playback", "manual");
    assert.equal(
      await page.evaluate(() => [...document.querySelectorAll("audio,video")].every((media) => media.paused)),
      true,
    );
    await page.keyboard.press("Escape");
    await expect(page.locator("#hero-primary")).toBeFocused();
    await page.locator(".hero-next").click();
    await expect(page.locator("#workshop-title")).toBeFocused();
    await expect(page.locator(".workshop-note .workshop-link")).toHaveAttribute(
      "href",
      "https://github.com/jamescashio/jamescashio.github.io",
    );
    await page.locator("#mc-btn").click();
    await expect(page.locator("#mc-start a")).toHaveCount(3);
    await page.keyboard.press("ArrowDown");
    await expect(page.locator('#mc-start a[href="#flight=board"]')).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(page.locator("#work-h")).toBeFocused();
    await page.locator("#mc-btn").click();
    await page.locator("#mc-search").fill("Graphify");
    await expect(page.locator("#mc-start")).toBeHidden();
    await page.locator("#mc-clear").click();
    await expect(page.locator("#mc-start")).toBeVisible();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(page.locator("#build-proof-title")).toBeFocused();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
  }
});

test("The full page, atlas, principles, evidence console, hangar and contact stay usable", async (t) => {
  for (const width of [1440, 390, 320]) {
    const page = await visit(t, { width, height: width > 700 ? 1000 : 844 });
    for (const id of ["top", "work", "studies", "universe", "evidence", "rooms", "operator", "contact"]) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width, `${id} at ${width}px`);
      await page.screenshot({ path: path.join(output, `polish-${width}-${id}.png`) });
    }
    // Principles, Studios and Flight heritage open as their own pages and keep the home page short.
    for (const id of ["starship", "principles", "studios", "heritage"]) {
      await expect(page.locator(`#${id}`)).toBeHidden();
      await page.locator(`.room-card[data-room-route="#${id}"]`).click();
      await expect(page.locator(`#${id}`)).toHaveAttribute("data-room-state", "ready");
      await expect(page.locator(`#${id}`)).toBeVisible();
      await expect(page.locator("#top")).toBeHidden();
      await expect(page.locator(`.room-links a[href="#${id}"]`)).toHaveAttribute("aria-current", "page");
      assert.equal(await page.evaluate(() => Math.round(scrollY)), 0, `${id} opens at the top of its page`);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width, `${id} at ${width}px`);
      await page.screenshot({ path: path.join(output, `polish-${width}-${id}.png`) });
      await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
      await page
        .locator(`#${id} img`)
        .evaluateAll((images) => Promise.all(images.map((image) => image.decode().catch(() => {}))));
      await page.locator(".room-back").click();
      await expect(page.locator("#rooms-h")).toBeFocused();
    }
    for (const [node, name] of [
      ["dsh", "DSH"],
      ["hermes", "HERMES"],
      ["zeus", "Zeus"],
      ["apollo", "Apollo"],
      ["operator", "The operator"],
    ]) {
      await page.locator(`[data-node=${node}]`).click();
      await expect(page.locator("#nd-name")).toHaveText(name);
    }
    await page.locator("#trace-btn").click();
    await expect(page.locator("#trace-label")).toContainText("human review");
    await page.locator('.room-card[data-room-route="#principles"]').click();
    for (const [index, title] of [
      [0, "Show the age of a fact."],
      [1, "Make the choice explainable."],
      [2, "Make the claim testable."],
    ]) {
      await page.locator(`[data-pr='${index}']`).click();
      await expect(page.locator("#pr-title")).toHaveText(title);
    }
    await page.locator("#engine").press("ArrowRight");
    await expect(page.locator("#eng-rot")).toHaveAttribute("style", /rotate\(10deg\)/);
    await page.locator("#engine").press("Home");
    await expect(page.locator("#eng-rot")).toHaveAttribute("style", /rotate\(0deg\)/);
    await page.locator('.room-links a[href="#heritage"]').click();
    for (const [pilot, word] of [
      ["yeager", "BELL X-1"],
      ["johnson", "SR-71"],
      ["rutan", "PROTEUS"],
      ["hoover", "P-51"],
    ]) {
      await page.locator(`#pilots [data-pilot=${pilot}]`).click();
      await expect(page.locator("#hg-title")).toContainText(word);
      await page.locator("#hangar img.on").evaluate((image) => image.decode());
    }
    await page.locator(".room-back").click();
    await page.locator("#eve-in").fill("fleet");
    await page.locator("#eve-in").press("Enter");
    await expect(page.locator("#eve-out")).toContainText("September 24, 2026");
    await page.locator("#eve-in").fill("routes");
    await page.locator("#eve-in").press("Enter");
    await expect(page.locator("#eve-out")).toContainText("Routing verification: not established");
    await page.locator("#copy-email").click();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), "doug@cashio.us");
    const mail = await page.locator('#contact a[href^="mailto:"]').getAttribute("href");
    assert.ok(mail.startsWith("mailto:doug@cashio.us"));
    const broken = await page
      .locator("main img")
      .evaluateAll((images) =>
        images.filter((image) => !image.complete || !image.naturalWidth).map((image) => image.src),
      );
    assert.deepEqual(broken, [], "every illustration decodes after the full-page tour");
    await audit(page, `full-page-${width}`);
  }
});

test("Escalation and exposure change the next action without claiming a real assessment", async (t) => {
  const page = await visit(t);
  await choose(page, "cascade");
  await page.locator("#lab-severity").press("End");
  await expect(page.locator(".lab-answer")).toContainText("Human decision");
  await page.locator("#lab-severity").press("Home");
  await page.locator("#lab-confidence").press("End");
  await expect(page.locator(".lab-answer")).toContainText("Bounded check");
  await page.locator("#lab-confidence").press("Home");
  await expect(page.locator(".lab-answer")).toContainText("Human decision");
  await choose(page, "exposure");
  await page.locator("[data-key=reachable]").check();
  await page.locator("[data-key=auth]").uncheck();
  await expect(page.locator(".lab-answer")).toContainText("Investigate first");
  await page.locator("[data-key=auth]").check();
  await page.locator("[data-key=critical]").check();
  await expect(page.locator(".lab-answer")).toContainText("Review the boundary");
  await page.locator("[data-key=reachable]").uncheck();
  await expect(page.locator(".lab-answer")).toContainText("Validate the observation");
});

test("Briefing preserves dated evidence and unknowns; empty selections cannot compose a claim", async (t) => {
  const page = await visit(t, { hash: "#build=briefing" });
  for (const id of ["fleet", "routing", "authority"]) await page.locator(`[data-fact=${id}]`).check();
  await page.locator("[data-compose]").click();
  await expect(page.locator(".brief-output")).toContainText("September 24, 2026");
  await expect(page.locator(".brief-output")).toContainText("remain unverified");
  await expect(page.locator(".brief-output")).toContainText("accountable person");
  for (const id of ["fleet", "routing", "authority"]) await page.locator(`[data-fact=${id}]`).uncheck();
  await expect(page.locator("[data-compose]")).toBeDisabled();
});

test("Freshness and signal controls cross their documented boundaries", async (t) => {
  const page = await visit(t, { hash: "#build=dashboards&age=23" });
  await expect(page.locator(".lab-answer")).toContainText("Within the example window");
  await page.locator("#lab-age").press("ArrowRight");
  await expect(page.locator("#value-age")).toHaveText("24 h");
  await expect(page.locator(".lab-answer")).toContainText("Refresh required");
  await choose(page, "signal");
  await page.locator("#lab-deviation").press("End");
  await page.locator("[data-key=corroborated]").uncheck();
  await expect(page.locator(".lab-answer")).toContainText("Corroborate the signal");
  await page.locator("[data-key=corroborated]").check();
  await expect(page.locator(".lab-answer")).toContainText("Operator review");
  await page.locator("#lab-deviation").press("Home");
  await expect(page.locator(".lab-answer")).toContainText("Continue observation");
});

test("Graphify shows direct and indirect impact and keeps keyboard focus", async (t) => {
  const page = await visit(t, { hash: "#build=graphify" });
  await page.locator("[data-module=policy]").click();
  await expect(page.locator(".lab-answer")).toContainText("3 modules affected");
  await page.locator("[data-module=adapter]").click();
  await expect(page.locator(".lab-answer")).toContainText("2 modules affected");
  await expect(page.locator("[data-module=adapter]")).toBeFocused();
  await page.locator("[data-module=ui]").click();
  await expect(page.locator(".lab-answer")).toContainText("0 modules affected");
  await page.locator("#copy-settings").click();
  const shared = await page.evaluate(() => navigator.clipboard.readText());
  await page.goto(shared);
  await expect(page.locator("[data-module=ui]")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".lab-answer")).toContainText("0 modules affected");
});

test("HERMES shared settings restore all choices and privacy always wins", async (t) => {
  const page = await visit(t);
  await page.locator("[data-intent=analyze]").click();
  await page.locator("#tg-sources").click();
  await expect(page.locator("#st-code")).toHaveText("EVIDENCE");
  await page.locator("#tg-private").click();
  await page.locator("#route-btn").click();
  await expect(page.locator("#st-code")).toHaveText("HOLD");
  await page.locator("#copy-settings").click();
  const shared = await page.evaluate(() => navigator.clipboard.readText());
  await page.goto(shared);
  await expect(page.locator("[data-intent=analyze]")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#tg-sources")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#tg-private")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#st-code")).toHaveText("HOLD");
});

test("The integrated flight responds, shares its actual scenario, downloads a card, and returns to the study", async (t) => {
  const page = await visit(t, { width: 390, height: 844, hash: "#flight=hull" });
  await expect(page.locator(".ff-stage-ready,.ff-stage-fallback")).toBeVisible({ timeout: 45000 });
  await page.getByRole("button", { name: "Cut the cloud link" }).click();
  await expect(page.locator(".ff-decision-result")).toContainText("12 onboard · 0 in cloud · 0 held");
  await page.getByRole("button", { name: "See my decision" }).click();
  await expect(page.locator(".ff-recap")).toBeVisible();
  await page.getByRole("button", { name: "Copy this scenario" }).click();
  const shared = await page.evaluate(() => navigator.clipboard.readText());
  assert.ok(shared.endsWith("#mission=hybrid.mixed.offline.held"));
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save mission card" }).click();
  const download = await downloadPromise;
  assert.match(download.suggestedFilename(), /\.png$/);
  await download.saveAs(path.join(output, "mission-card.png"));
  await page.getByRole("button", { name: "Test a private request" }).click();
  await expect(page.locator(".first-flight")).toHaveCount(0);
  await expect(page.locator("#st-code")).toHaveText("HOLD");
  await page.goto(shared);
  await expect(page.locator("#n-local")).toHaveText("12");
  await expect(page.locator("#n-cloud")).toHaveText("0");
});

test("Motion off leaves future sections visible and a system preference change reaches the open flight", async (t) => {
  const page = await visit(t, { motion: "no-preference" });
  await page.locator("#motion-btn").click();
  await expect(page.locator("#motion-btn")).toHaveAttribute("aria-pressed", "false");
  const hidden = await page
    .locator("main h1,main h2,main h3,[data-rise]")
    .evaluateAll((els) => els.filter((el) => getComputedStyle(el).opacity === "0").map((el) => el.textContent));
  assert.deepEqual(hidden, []);
  await page.locator("#mc-btn").click();
  await page.locator("#mc-search").fill("evidence");
  await page.locator('#mc-list a[href="#evidence"] strong').click();
  await expect(page.locator("#ev-h")).toBeInViewport();
  await page.goto(url + "#flight=board");
  await expect(page.locator(".first-flight")).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".first-flight")).toHaveAttribute("data-motion", "off");
  await expect(page.getByRole("button", { name: "Manual flight" })).toBeVisible();
  await page.keyboard.press("Escape");
  assert.equal(await page.evaluate(() => document.body.style.overflow), "");
});

test("Legacy hash entry, production evidence and unavailable WebGL remain usable", async (t) => {
  const page = await visit(t);
  const data = await page.request.get(new URL("/v38/status.json", url).href);
  assert.equal((await data.json()).provenance.observedAtUtc, "2026-09-24T21:43:10Z");
  const context = await browser.newContext({ reducedMotion: "reduce" });
  t.after(() => context.close());
  await context.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
      if (type === "webgl" || type === "webgl2") return null;
      return getContext.call(this, type, ...rest);
    };
  });
  const fallback = await context.newPage();
  await fallback.goto(url + "#flight=blackout");
  await expect(fallback.locator(".ff-stage-fallback")).toBeVisible({ timeout: 45000 });
  await expect(fallback.locator(".ff-decision-result")).toContainText("12 onboard");
  await fallback.getByRole("button", { name: "Restore the cloud link" }).click();
  await expect(fallback.locator(".ff-decision-result")).toContainText("6 onboard · 6 in cloud");
  await fallback.keyboard.press("Escape");
  await expect(fallback.locator("h1")).toBeFocused();
  assert.equal(new URL(fallback.url()).hash, "", "a directly opened flight returns to the clean homepage");
  await page.goto(new URL("/odyssey.html#build=hermes", url).href);
  await expect(page.locator("#odyssey-root")).toBeAttached();
  assert.equal(new URL(page.url()).pathname, "/odyssey.html");
});

test("Bit docks into the menu on compact screens without covering the study", async (t) => {
  const page = await visit(t, { width: 390 });
  for (const width of [390, 320, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.locator("#studies").scrollIntoViewIfNeeded();
    await expect(page.locator("#mc-btn #bitcv")).toBeVisible();
    await expect(page.locator("#bit-btn")).not.toBeVisible();
    const mascot = await page.locator("#bitcv").boundingBox();
    const header = await page.locator("body > header").boundingBox();
    assert.ok(
      mascot.y >= header.y && mascot.y + mascot.height <= header.y + header.height,
      "Bit stays inside navigation",
    );
    await page.locator("#mc-btn").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#mc-search")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.locator("#mc-btn")).toBeFocused();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    const size = await page
      .locator("#nd-evidence")
      .evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
    assert.ok(size >= 12, "important evidence labels use readable shared typography");
    await page.screenshot({ path: path.join(output, `connected-menu-${width}.png`) });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(page.locator("#bit-btn #bitcv")).toBeVisible();
  await expect(page.locator("#bitcv")).toHaveCount(1);
});

test("A privacy decision travels through the atlas, exact HERMES settings and a reload", async (t) => {
  const page = await visit(t);
  await page.locator("#pv-reveal").click();
  await page.locator("#pv-trace").click();
  const traceButton = await page.locator("#trace-btn").boundingBox();
  assert.ok(traceButton.y >= 80, "The atlas link leaves its trace control below the fixed header");
  await expect(page.locator("#request-outcome")).toHaveText("Human review");
  await expect(page.locator("#trace-label")).toContainText("The external route is held");
  await expect(page.locator("#trace-stage-compute")).toHaveText("Hold");
  await expect(page.locator("#w2")).not.toHaveClass(/tracing/);
  const saved = await page.locator("#request-continue").getAttribute("href");
  await page.locator("#request-continue").click();
  await expect(page.locator("#tg-private")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#tg-sources")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('[data-intent="analyze"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#st-lane")).toHaveText("Human review");
  await page.goto(url + saved);
  await expect(page.locator("#st-lane")).toHaveText("Human review");
  await page.locator("#st-trace").click();
  await page.locator('[data-request-private="false"]').click();
  await expect(page.locator("#request-outcome")).toHaveText("Research");
  await expect(page.locator("#trace-stage-compute")).toHaveText("Compute");
  await page.locator("#request-continue").click();
  await expect(page.locator("#tg-private")).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("#st-lane")).toHaveText("Research");
  await page.locator("#tg-sources").click();
  await page.locator('[data-intent="draft"]').click();
  await page.locator("#st-trace").click();
  await expect(page.locator("#request-outcome")).toHaveText("Workhorse");
  await expect(page.locator("#request-source")).toContainText("Draft · sources optional");
  await audit(page, "connected-request");
});

test("Changing privacy interrupts a trace and never animates the held request into compute", async (t) => {
  const page = await visit(t, { motion: "no-preference", hash: "#universe" });
  await page.locator("#trace-btn").click();
  await page.locator("#atlas").scrollIntoViewIfNeeded();
  await expect(page.locator("#atlas")).toHaveAttribute("data-tracing", "true");
  await page.locator('[data-request-private="true"]').click();
  await page.locator("#atlas").scrollIntoViewIfNeeded();
  await expect(page.locator("#trace-label")).toHaveText("The external route is held", { timeout: 9000 });
  await expect(page.locator('[data-node="zeus"]')).not.toHaveClass(/trace-active/);
  await expect(page.locator("#w2")).not.toHaveClass(/tracing/);
  await expect(page.locator("#atlas")).toHaveAttribute("data-tracing", "false", { timeout: 9000 });
  await expect(page.locator("#trace-label")).toContainText("compute step is skipped");
  await page.locator("#trace-btn").click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("#atlas")).toHaveAttribute("data-tracing", "false");
  await expect(page.locator("#packet")).toHaveAttribute("opacity", "0");
  await expect(page.locator("#trace-label")).toContainText("The decision returns to the operator");
});

test("E.V.E. keeps each reply line visually separate at phone and desktop widths", async (t) => {
  for (const width of [320, 1440]) {
    const page = await visit(t, { width, motion: "no-preference", hash: "#evidence" });
    for (const [command, lineCount] of [
      ["help", 3],
      ["fleet", 4],
    ]) {
      await page.locator("#eve-in").fill(command);
      await page.locator("#eve-in").press("Enter");
      const lines = page.locator("#eve-out .eve-reply").last().locator("span");
      await expect(lines).toHaveCount(lineCount);
      const bounds = await lines.evaluateAll((items) =>
        items.map((item) => {
          const rect = item.getBoundingClientRect();
          return { top: rect.top, bottom: rect.bottom };
        }),
      );
      for (let i = 1; i < bounds.length; i++) {
        assert.ok(
          bounds[i].top >= bounds[i - 1].bottom + 3,
          `${command} line ${i + 1} starts below the preceding line at ${width}px`,
        );
      }
    }
  }
});

test("Evidence leads with meaning, expands by keyboard and links the shipped build", async (t) => {
  const page = await visit(t, { width: 320, hash: "#evidence" });
  await expect(page.locator("#evidence")).toContainText("A dated look inside the lab.");
  await page.locator('.eve-chips [data-eve="fleet"]').click();
  await expect(page.locator("#eve-out")).toContainText("Running guests: 20 containers");
  await expect(page.locator("#build-story")).not.toBeVisible();
  await expect(page.locator("#evidence-records")).not.toHaveAttribute("open", "");
  await page.locator("#evidence-records summary").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#ev-chart")).toBeVisible();
  await expect(page.locator("#ev-chart")).toContainText("Not verified");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 320);
  await audit(page, "expanded-evidence-320");
  await page.screenshot({ path: path.join(output, "expanded-evidence-320.png") });
  await page.locator("#mc-btn").click();
  await page.locator("#mc-search").fill("Starship build story");
  await page.locator('#mc-list a[href="#build-story"]').click();
  await expect(page.locator("#build-proof-title")).toHaveText("The ship that vanished when motion stopped.");
  await expect(page.locator('#build-story a[href*="pull/135"]')).toBeVisible();
});

test("The composed opening keeps its artwork, visible first action and a finite visitor-requested orbit", async (t) => {
  const page = await visit(t, { motion: "no-preference", height: 900 });
  await page.mouse.move(1000, 420);
  await page.waitForTimeout(2200);
  await expect(page.locator(".hero")).not.toHaveClass(/scene-ready/);
  assert.equal(await page.locator(".hero-light").evaluate((el) => getComputedStyle(el).opacity), "0");
  assert.equal(
    await page.evaluate(() => performance.getEntriesByType("resource").some((r) => /\/hero-.*\.js/.test(r.name))),
    false,
  );
  await expect(page.locator("#hero-primary")).toBeVisible();
  await page.screenshot({ path: path.join(output, "composed-opening-1440.png") });
  await page.locator("#fold-btn").click();
  await expect(page.locator(".hero")).toHaveClass(/fold-active/);
  await expect(page.locator(".hero")).not.toHaveClass(/fold-active/, { timeout: 5000 });
  assert.ok(Number(await page.locator("#fallback").evaluate((el) => getComputedStyle(el).opacity)) >= 0.7);
  await page.locator("#fold-btn").click();
  await expect(page.locator(".hero")).toHaveClass(/fold-active/);
  await page.locator("#motion-btn").click();
  await expect(page.locator(".hero")).not.toHaveClass(/fold-active/);
  await expect.poll(() => page.locator("#gl").evaluate((el) => getComputedStyle(el).opacity)).toBe("0");
  for (const width of [768, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(url);
    const action = await page.locator("#hero-primary").boundingBox();
    assert.ok(action.y > 66 && action.y + action.height < 844, `primary action is above the fold at ${width}px`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    await audit(page, `composed-opening-${width}`);
    await page.screenshot({ path: path.join(output, `composed-opening-${width}.png`) });
  }
});

test("Manual quiet mode survives reload and device changes, while blocked storage leaves controls usable", async (t) => {
  const page = await visit(t, { width: 390, motion: "no-preference" });
  await expect(page.locator(".motion-pause")).toBeVisible();
  await expect(page.locator(".motion-resume")).toBeHidden();
  await page.locator("#motion-btn").click();
  await page.reload();
  await expect(page.locator("#motion-btn")).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".motion-resume")).toBeVisible();
  await expect(page.locator(".motion-pause")).toBeHidden();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".motion-device")).toBeVisible();
  await expect(page.locator(".motion-resume")).toBeHidden();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator("#motion-btn")).toHaveAttribute("aria-pressed", "false");
  await page.locator("#motion-btn").click();
  await page.reload();
  await expect(page.locator("#motion-btn")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".motion-pause")).toBeVisible();
  await expect(page.locator(".motion-device")).toBeHidden();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("#motion-btn")).toHaveAttribute("aria-pressed", "false");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator("#motion-btn")).toHaveAttribute("aria-pressed", "true");
  await page.context().addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error("Storage unavailable");
    };
    Storage.prototype.setItem = () => {
      throw new Error("Storage unavailable");
    };
  });
  await page.reload();
  await page.locator("#motion-btn").click();
  await expect(page.locator("#motion-btn")).toHaveAttribute("aria-pressed", "false");
  await page.locator(".hero-secondary").click();
  await expect(page.locator("#work-h")).toBeFocused();
});

test("Helios flight waits for its visitor, offers an optional tour and pauses that tour for a decision", async (t) => {
  const page = await visit(t, { motion: "no-preference", hash: "#flight=board" });
  await expect(page.locator(".ff-stage-ready,.ff-stage-fallback")).toBeVisible({ timeout: 45000 });
  await expect(page.locator(".first-flight")).toHaveAttribute("data-playback", "manual");
  await page.waitForTimeout(5500);
  await expect(page.locator("#ff-scene-title")).toHaveText("Your ship. Your boundary.");
  await page.getByRole("button", { name: "Play tour", exact: true }).click();
  await expect(page.locator(".first-flight")).toHaveAttribute("data-playback", "tour");
  await expect(page.locator("#ff-scene-title")).toHaveText("Open it. Understand it.", { timeout: 7500 });
  await page.getByRole("button", { name: "Cut the cloud link", exact: false }).click();
  await expect(page.locator(".first-flight")).toHaveAttribute("data-playback", "manual");
  await expect(page.locator(".ff-decision-result")).toContainText("12 onboard · 0 in cloud · 0 held");
  await page.getByRole("button", { name: "See my decision", exact: false }).click();
  await expect(page.locator(".ff-recap")).toBeVisible();
  await page.getByRole("button", { name: "Replay flight", exact: true }).click();
  await expect(page.locator(".first-flight")).toHaveAttribute("data-playback", "manual");
  await expect(page.locator("#ff-scene-title")).toHaveText("Your ship. Your boundary.");
  await page.screenshot({ path: path.join(output, "visitor-paced-flight.png") });
  await page.keyboard.press("Escape");
  await expect(page.locator("h1")).toBeFocused();
});

test("A plain visit stays at cashio.us, old V38 addresses normalize and deliberate archives remain available", async (t) => {
  const page = await visit(t);
  assert.equal(new URL(page.url()).pathname, "/");
  assert.equal(new URL(page.url()).search, "");
  const navigation = await page.evaluate(() => performance.getEntriesByType("navigation")[0].name);
  assert.equal(new URL(navigation).pathname, "/", "the root responds with the current document directly");
  for (const suffix of [
    "/v38/?release=38.4#studios",
    "/v38/index.html?release=38.4#operator",
    "/?release=38.4#studies",
  ]) {
    await page.goto(new URL(suffix, url).href);
    await expect(page.locator("#study-hermes")).toBeAttached();
    assert.equal(new URL(page.url()).pathname, "/");
    assert.equal(new URL(page.url()).search, "");
    assert.equal(new URL(page.url()).hash, new URL(suffix, url).hash);
  }
  await page.goto(new URL("/?v=37.17#build=hermes", url).href);
  await expect(page.locator("#odyssey-root")).toBeAttached();
  assert.equal(new URL(page.url()).pathname, "/odyssey.html");
  await page.goto(new URL("/#deck=builds", url).href);
  await expect.poll(() => new URL(page.url()).pathname).toBe("/command-deck.html");
  const context = await browser.newContext({ javaScriptEnabled: false });
  t.after(() => context.close());
  const staticPage = await context.newPage();
  await staticPage.goto(url);
  await expect(staticPage.locator("h1")).toBeVisible();
  await expect(staticPage.locator(".room-card")).toHaveCount(4);
  await staticPage.locator('.room-card[href="/rooms/studios/"]').click();
  await expect(staticPage.locator(".studio-card")).toHaveCount(3);
  await expect(staticPage.locator(".studio-library a")).toHaveCount(5);
  assert.equal(new URL(staticPage.url()).pathname, "/rooms/studios/");
});

test("Studios preserve the current page, return focus, Back/Forward and exact signature context", async (t) => {
  const page = await visit(t, { hash: "#operator" });
  const stamp = await page.evaluate(() => performance.timeOrigin);
  const opener = page.locator('#sigplate a[href="#signature"]');
  await opener.scrollIntoViewIfNeeded();
  const startY = await page.evaluate(() => scrollY);
  await opener.click();
  await expect(page.locator("#brand-studio-title")).toHaveText("Celestial Forge");
  assert.equal(new URL(page.url()).pathname, "/");
  await expect(page.locator("html")).toHaveClass(/experience-open/);
  await page.keyboard.press("Escape");
  await expect(opener).toBeFocused();
  assert.equal(new URL(page.url()).hash, "#operator");
  assert.ok(Math.abs((await page.evaluate(() => scrollY)) - startY) < 5);
  await page.goForward();
  await expect(page.locator("#brand-studio-title")).toBeVisible();
  await page.goBack();
  await expect(page.locator("#helios-studio")).toHaveCount(0);
  await expect(opener).toBeFocused();
  await opener.click();
  await page.getByRole("button", { name: "Watch the signature awaken" }).click();
  await expect(page.locator("#lensing-film-title")).toContainText("signature");
  await page.keyboard.press("Escape");
  await expect(opener).toBeFocused();
  assert.equal(new URL(page.url()).hash, "#operator");
  assert.equal(await page.evaluate(() => performance.timeOrigin), stamp, "no full-page handoff to V37 occurred");
});

test("The original studios fit desktop and narrow phones, share Helios type and pass accessibility checks", async (t) => {
  for (const width of [1440, 390, 320]) {
    const page = await visit(t, { width, height: width === 1440 ? 1000 : 844, hash: "#studios" });
    await page.screenshot({ path: path.join(output, `studios-${width}.png`) });
    await audit(page, `studios-${width}`);
    for (const [hash, dialog] of [
      ["#signature", ".brand-studio"],
      ["#lensing", ".lens-observatory"],
      ["#film=sanctuary", ".lensing-film"],
    ]) {
      const link = page.locator(`.studio-card[href="${hash}"]`);
      await link.click();
      await expect(page.locator(dialog)).toBeVisible({ timeout: 20000 });
      const box = await page
        .locator(dialog)
        .evaluate((el) => ({ width: el.clientWidth, scroll: el.scrollWidth, font: getComputedStyle(el).fontFamily }));
      assert.ok(box.scroll <= box.width + 1, `${hash} fits ${width}px`);
      assert.match(box.font, /Instrument Sans/);
      if (hash === "#signature") {
        await expect(page.locator(".cashio-brand-mark img")).toHaveJSProperty("complete", true);
        const artwork = await page.locator(".cashio-brand-mark img").boundingBox();
        const viewport = await page.locator(".bs-art-window").boundingBox();
        assert.ok(artwork.height <= viewport.height + 2, "the full signature fits before entering detail mode");
      }
      if (hash === "#lensing")
        await expect(page.locator(".lens-observatory")).toHaveAttribute("data-ready", "true", { timeout: 20000 });
      if (hash.startsWith("#film")) {
        await expect(page.locator(".lensing-film-choice")).toHaveCount(5);
        assert.equal(await page.locator("video").evaluate((el) => el.paused && el.muted && !el.autoplay), true);
      }
      await audit(page, `studio-${hash.slice(1)}-${width}`);
      await page.screenshot({ path: path.join(output, `studio-${hash.slice(1).replace("=", "-")}-${width}.png`) });
      await page.keyboard.press("Escape");
      await expect(page.locator("#helios-studio")).toHaveCount(0);
      await expect(link).toBeFocused();
    }
  }
});

test("Cancelling a slow studio import prevents a late scene from replacing the page", async (t) => {
  const page = await visit(t, { width: 390, hash: "#studios" });
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  await page.route("**/assets/studio-island-*.js", async (route) => {
    await gate;
    await route.continue();
  });
  const link = page.locator('.studio-card[href="#signature"]');
  await link.click();
  await expect(page.locator("#scene-loader")).toBeVisible();
  await page.getByRole("button", { name: "Cancel opening", exact: true }).click();
  await expect(link).toBeFocused();
  release();
  await page.waitForLoadState("networkidle");
  await expect(page.locator("#helios-studio")).toHaveCount(0);
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  await link.click();
  await expect(page.locator("#brand-studio-title")).toBeVisible();
});

test("Opening the menu freezes the visible request instrument and resume preserves its progress", async (t) => {
  const page = await visit(t, { motion: "no-preference", hash: "#universe" });
  await page.locator("#trace-btn").click();
  await page.locator("#atlas").scrollIntoViewIfNeeded();
  await expect.poll(() => page.locator("#trace-progress").getAttribute("style")).not.toContain("scaleX(0)");
  await page.locator("#mc-btn").click();
  const stopped = await page.locator("#trace-progress").getAttribute("style");
  await page.waitForTimeout(400);
  assert.equal(await page.locator("#trace-progress").getAttribute("style"), stopped);
  await page.keyboard.press("Escape");
  await expect.poll(() => page.locator("#trace-progress").getAttribute("style")).not.toBe(stopped);
});

test("Shared Observatory settings reload at the root, and reduced motion reaches each open studio", async (t) => {
  const hash = "#lensing&v=1&light=eclipse&view=gate&clouds=23&aurora=61&sun=105&gate=1";
  const page = await visit(t, { width: 390, hash, motion: "no-preference" });
  const observatory = page.locator(".lens-observatory");
  await expect(observatory).toHaveAttribute("data-ready", "true", { timeout: 20000 });
  await expect(observatory).toHaveAttribute("data-light", "eclipse");
  await expect(observatory).toHaveAttribute("data-view", "gate");
  await page.getByRole("button", { name: "Share my universe" }).click();
  const shared = await page.evaluate(() => navigator.clipboard.readText());
  assert.equal(new URL(shared).pathname, "/");
  assert.match(new URL(shared).hash, /light=eclipse&view=gate&clouds=23&aurora=61&sun=105/);
  await page.goto(shared);
  await page.reload();
  await expect(observatory).toHaveAttribute("data-view", "gate");
  await expect(observatory).toHaveAttribute("data-light", "eclipse");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(observatory).toHaveAttribute("data-motion", "off");
  await page.keyboard.press("Escape");
  await expect(page.locator("#studios-h")).toBeFocused();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.locator('.studio-card[href="#signature"]').click();
  await expect(page.locator(".brand-studio")).toHaveAttribute("data-motion", "on");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".brand-studio")).toHaveAttribute("data-motion", "off");
});

test("A failed optional studio keeps a clear return and a real reload recovery", async (t) => {
  const page = await visit(t, { width: 390, hash: "#studios" });
  await page.route("**/assets/studio-island-*.js", (route) => route.abort());
  const link = page.locator('.studio-card[href="#signature"]');
  await link.click();
  await expect(page.locator("#scene-loader-title")).toHaveText("This scene couldn’t open.");
  await expect(page.getByRole("button", { name: "Reload scene" })).toBeVisible();
  await page.getByRole("button", { name: "Back to the site", exact: true }).click();
  await expect(link).toBeFocused();
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  assert.equal(new URL(page.url()).pathname, "/");
  await page.unroute("**/assets/studio-island-*.js");
  await page.reload();
  await link.click();
  await expect(page.locator("#brand-studio-title")).toBeVisible();
});

test("The wide opening keeps its identity below navigation and its first action in view", async (t) => {
  for (const width of [1024, 1440, 2560]) {
    const page = await visit(t, { width, height: 900 });
    const geometry = await page.evaluate(() => ({
      navigation: document.querySelector(".nav").getBoundingClientRect().bottom,
      identity: document.querySelector(".hero .kick").getBoundingClientRect().top,
      action: document.querySelector("#hero-primary").getBoundingClientRect().bottom,
      pageWidth: document.documentElement.scrollWidth,
      viewport: innerHeight,
    }));
    assert.ok(geometry.identity >= geometry.navigation + 8, `identity clears navigation at ${width}px`);
    assert.ok(geometry.action <= geometry.viewport, `primary action is in view at ${width}px`);
    assert.equal(geometry.pageWidth, width, `page fits at ${width}px`);
  }
});

test("The first visit stays compact and shared links reveal the exact experiment", async (t) => {
  const page = await visit(t, { width: 390, height: 844, expandWorkbenches: false });
  await expect(page.locator("#study-lab")).not.toHaveAttribute("open", "");
  await expect(page.locator("#atlas-lab")).not.toHaveAttribute("open", "");
  await expect(page.locator("#pv-reveal")).toBeVisible();
  const summary = page.locator("#study-lab > summary");
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#study-hermes")).toBeVisible();
  await choose(page, "cascade");
  await expect(page.locator("#secondary-instrument")).toBeVisible();
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#study-hermes")).not.toBeVisible();
  await page.goto(url + "#request-journey");
  await expect(page.locator("#atlas-lab")).toHaveAttribute("open", "");
  await expect(page.locator("#request-journey")).toBeFocused();
  await page.locator("#request-continue").click();
  await expect(page.locator("#study-lab")).toHaveAttribute("open", "");
  await expect(page.locator("#study-hermes")).toHaveAttribute("aria-selected", "true");
  await page.goBack();
  await expect(page.locator("#request-journey")).toBeFocused();
  await page.goForward();
  await expect(page.locator("#studies-h")).toBeFocused();
  await audit(page, "workbench-disclosures-390");
});

test("Phone atlas captions, fleet labels and all flight chapter names fit at the readable label floor", async (t) => {
  for (const width of [320, 390]) {
    const page = await visit(t, { width, height: 844, hash: "#universe" });
    const fleet = await page.locator(".fleet-counts .stat").evaluateAll((cards) =>
      cards.map((card) => {
        const label = card.querySelector(".mono");
        const box = label.getBoundingClientRect();
        const parent = card.getBoundingClientRect();
        return {
          inside: box.left >= parent.left && box.right <= parent.right,
          clipped: label.scrollWidth > label.clientWidth + 1,
          font: parseFloat(getComputedStyle(label).fontSize),
        };
      }),
    );
    assert.ok(fleet.every((label) => label.inside && !label.clipped && label.font >= 14));
    const map = await page.locator("#atlas").evaluate((atlas) => {
      const bottom = atlas.getBoundingClientRect().bottom;
      const hint = getComputedStyle(atlas, "::after");
      const hintTop =
        bottom -
        parseFloat(hint.bottom) -
        parseFloat(hint.height) -
        parseFloat(hint.paddingTop) -
        parseFloat(hint.paddingBottom);
      const captions = [
        ...atlas.querySelectorAll('[data-node="zeus"] .node-detail, [data-node="apollo"] .node-detail'),
      ];
      return { hintTop, captions: captions.map((label) => label.getBoundingClientRect().bottom) };
    });
    assert.ok(
      map.captions.every((bottom) => bottom + 8 <= map.hintTop),
      "node captions clear the instruction strip",
    );
    await page.locator("#hero-primary").click();
    const picker = page.getByRole("combobox", { name: "Flight chapter", exact: true });
    await expect(picker).toBeVisible();
    await expect(picker.locator("option")).toHaveText([
      "1 / 4 · Board",
      "2 / 4 · Open the hull",
      "3 / 4 · Cut the cloud",
      "4 / 4 · Human command",
    ]);
    const geometry = await picker.evaluate((field) => ({
      height: field.getBoundingClientRect().height,
      font: parseFloat(getComputedStyle(field).fontSize),
      body: document.querySelector("#helios-flight .ff-body").getBoundingClientRect().height,
    }));
    assert.ok(geometry.height >= 44 && geometry.font >= 14);
    assert.ok(geometry.body >= 400, "The chapter content gets at least 400px of an 844px phone");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    await picker.selectOption("3");
    await page.getByRole("button", { name: "Finish →", exact: true }).click();
    const replay = page.getByRole("button", { name: "Replay flight", exact: true });
    await expect(replay).toBeVisible();
    const finish = await replay.evaluate((button) => ({
      replay: button.getBoundingClientRect().width,
      group: button.parentElement.getBoundingClientRect().width,
      height: button.getBoundingClientRect().height,
    }));
    assert.ok(finish.replay >= finish.group - 2, "Replay uses its full row after Finish");
    assert.ok(finish.height >= 44, "Replay keeps a full touch target");
    await audit(page, `phone-labels-${width}`);
  }
});

test("Aa labels match visible words in every style and a completed flight names available actions", async (t) => {
  for (const width of [390, 1440]) {
    const page = await visit(t, { width, height: 900, motion: "no-preference", expandWorkbenches: false });
    for (const style of ["Signature", "Cockpit", "Readable"]) {
      await expect(page.locator("#type-btn")).toHaveAccessibleName(`Aa ${style}. Change type style`);
      const result = await new AxeBuilder({ page })
        .include("#type-btn")
        .withRules(["label-content-name-mismatch"])
        .analyze();
      assert.deepEqual(
        result.violations.map((v) => v.id),
        [],
        `${width}px ${style} visible name`,
      );
      await page.locator("#type-btn").click();
    }
    if (width === 390) {
      await page.goto(url + "#flight=permission");
      await page.getByRole("button", { name: "Finish →", exact: true }).click();
      await expect(page.locator("#helios-flight .first-flight")).toHaveAttribute("data-complete", "true");
      await expect(page.locator("#helios-flight #ff-boundary")).not.toContainText("Use Next");
      await expect(page.locator("#helios-flight #ff-boundary")).toContainText(/Replay.*save your card/);
    }
  }
});

test("The home path introduces creative rooms before evidence, while the build story keeps its address", async (t) => {
  const page = await visit(t, { width: 1024, height: 900, expandWorkbenches: false });
  await expect(page.locator(".nav nav")).not.toBeVisible();
  await expect(page.locator("#mc-btn")).toBeVisible();
  await expect(page.locator("#build-story")).not.toBeVisible();
  await expect(page.locator(".philo")).not.toBeVisible();
  assert.ok(
    await page
      .locator("#rooms")
      .evaluate((rooms) =>
        Boolean(rooms.compareDocumentPosition(document.querySelector("#evidence")) & Node.DOCUMENT_POSITION_FOLLOWING),
      ),
  );
  await page.locator("#mc-btn").click();
  await page.locator("#mc-search").fill("Starship build story");
  await page.locator('#mc-list a[href="#build-story"]').click();
  await expect(page.locator("html")).toHaveAttribute("data-room", "starship");
  await expect(page.locator("#build-proof-title")).toBeFocused();
  await expect(page.locator("#build-story")).toContainText("blank canvas");
  await page.locator(".room-back").click();
  await expect(page.locator("#rooms-h")).toBeFocused();
  await page.goBack();
  await expect(page.locator("#build-proof-title")).toBeFocused();
  await expect(page.locator("#build-proof-title")).toBeInViewport();
});

test("Direct section and room-story addresses keep visible heading focus after the initial fragment jump", async (t) => {
  for (const width of [390, 1440]) {
    for (const [hash, heading] of [
      ["#build-story", "#build-proof-title"],
      ["#evidence", "#ev-h"],
    ]) {
      const page = await visit(t, { width, height: 900, hash, expandWorkbenches: false });
      await expect(page.locator(heading)).toBeFocused();
      await expect(page.locator(heading)).toBeInViewport();
      await page.reload({ waitUntil: "networkidle" });
      await expect(page.locator(heading)).toBeFocused();
      await expect(page.locator(heading)).toBeInViewport();
    }
  }
});

test("Forward to the fragment-free home restores visible hero focus after an evidence visit", async (t) => {
  for (const width of [390, 1440]) {
    const page = await visit(t, { width, height: 844, hash: "#evidence", expandWorkbenches: false });
    await expect(page.locator("#ev-h")).toBeFocused();
    await page.getByRole("link", { name: "cAshIo home", exact: true }).click();
    await expect(page.locator("#top h1")).toBeFocused();
    await expect(page.locator("#top h1")).toBeInViewport();
    assert.equal(new URL(page.url()).hash, "");
    await page.goBack();
    await expect(page.locator("#ev-h")).toBeFocused();
    await expect(page.locator("#ev-h")).toBeInViewport();
    await page.goForward();
    await expect(page.locator("#top h1")).toBeFocused();
    await expect(page.locator("#top h1")).toBeInViewport();
    assert.equal(new URL(page.url()).hash, "");
  }
});

test("Rooms load only when opened and retain their controls between visits", async (t) => {
  const page = await visit(t, { width: 390, height: 844, expandWorkbenches: false });
  const roomRequests = [];
  page.on("request", (request) => {
    if (/\/room-(starship|principles|studios|heritage)-.*\.js$/.test(request.url())) roomRequests.push(request.url());
  });
  assert.equal(await page.locator("#tg-net,#engine,.studio-card,#he-img").count(), 0);
  assert.equal(
    await page.evaluate(() =>
      performance
        .getEntriesByType("resource")
        .some((r) => /\/room-(starship|principles|studios|heritage)-/.test(r.name)),
    ),
    false,
  );
  await page.locator('.room-card[data-room-route="#starship"]').click();
  await expect(page.locator("#starship")).toHaveAttribute("data-room-state", "ready");
  await page.locator("#tg-net").click();
  const state = await page.locator("#tg-net").getAttribute("aria-pressed");
  await page.locator("#starship .room-end a").first().click();
  await expect(page.locator("#rooms-h")).toBeFocused();
  await page.locator('.room-card[data-room-route="#starship"]').click();
  await expect(page.locator("#tg-net")).toHaveAttribute("aria-pressed", state);
  assert.equal(roomRequests.length, 1, "only one room bundle, loaded once");
});

test("Every room supports a direct URL, reload, Back and Forward after deferred loading", async (t) => {
  for (const width of [390, 1440]) {
    for (const [hash, id, heading] of [
      ["#starship", "starship", "ship-h"],
      ["#principles", "principles", "pr-h"],
      ["#studios", "studios", "studios-h"],
      ["#heritage", "heritage", "he-h"],
      ["#build-story", "starship", "build-proof-title"],
      ["#mission=sovereign.private.offline.held", "starship", "ship-h"],
    ]) {
      const page = await visit(t, { width, height: 900, hash, expandWorkbenches: false });
      await expect(page.locator(`#${id}`)).toHaveAttribute("data-room-state", "ready");
      await expect(page.locator(`#${heading}`)).toBeFocused();
      await expect(page.locator(`#${heading}`)).toBeInViewport();
      await page.reload({ waitUntil: "networkidle" });
      await expect(page.locator(`#${heading}`)).toBeFocused();
      await page.locator(`#${id} .room-end a`).first().click();
      await expect(page.locator("#rooms-h")).toBeFocused();
      await page.goBack();
      await expect(page.locator(`#${heading}`)).toBeFocused();
      await page.goForward();
      await expect(page.locator("#rooms-h")).toBeFocused();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    }
  }
});

test("A late room response cannot steal focus after leaving or opening Mission Control", async (t) => {
  for (const destination of ["home", "menu"]) {
    const page = await visit(t, { width: 390, height: 844, expandWorkbenches: false });
    let release;
    const hold = new Promise((resolve) => {
      release = resolve;
    });
    await page.route(/\/room-principles-.*\.js$/, async (route) => {
      await hold;
      await route.continue();
    });
    await page.locator('.room-card[data-room-route="#principles"]').click();
    await expect(page.locator("#principles")).toHaveAttribute("data-room-state", "loading");
    await expect(page.locator(".room-load-status").filter({ hasText: "Opening" })).toBeVisible();
    if (destination === "home") await page.locator(".room-back").click();
    else await page.locator("#mc-btn").click();
    release();
    await expect(page.locator("#principles")).toHaveAttribute("data-room-state", "ready");
    await expect(page.locator(destination === "home" ? "#rooms-h" : "#mc-search")).toBeFocused();
    if (destination === "home") await expect(page.locator("#principles")).not.toBeVisible();
  }
});

test("A failed room load offers a static reading page and reload recovery", async (t) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  t.after(() => context.close());
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const blocked = /\/room-heritage-.*\.js$/;
  await page.route(blocked, (route) => route.abort());
  await page.goto(url);
  await page.locator('.room-card[data-room-route="#heritage"]').click();
  await expect(page.locator("#heritage")).toHaveAttribute("data-room-state", "error");
  await expect(page.locator("#he-h")).toBeFocused();
  await expect(page.locator("#he-h")).toBeInViewport();
  await expect(page.locator('#heritage a[href="/rooms/heritage/"]')).toBeVisible();
  await page.unroute(blocked);
  await page.getByRole("button", { name: "Reload this room", exact: true }).click();
  await expect(page.locator("#heritage")).toHaveAttribute("data-room-state", "ready");
  await expect(page.locator("#he-h")).toBeFocused();
  assert.deepEqual(errors, []);
});

test("All four reading editions remain reachable and readable without JavaScript", async (t) => {
  for (const width of [320, 1440]) {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width, height: 900 } });
    t.after(() => context.close());
    const page = await context.newPage();
    for (const id of ["starship", "principles", "studios", "heritage"]) {
      await page.goto(url);
      await page.locator(`.room-card[href="/rooms/${id}/"]`).click();
      // Measure layout only once the reading page and its stylesheet have loaded.
      await page.waitForURL(`**/rooms/${id}/`);
      await page.waitForLoadState("load");
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator(`#${id}`)).toBeVisible();
      await expect(page.locator(".room-end a").first()).toBeVisible();
      assert.equal(await page.locator("script").count(), 0);
      if (id === "starship") {
        // The comparison and request bars show the default example, not empty headings or full bars.
        const rows = await page
          .locator("#cmp-rows .cmp")
          .evaluateAll((nodes) => nodes.map((node) => [...node.children].map((cell) => cell.textContent.trim())));
        assert.deepEqual(rows, [
          ["Sovereign / local", "12", "0", "0"],
          ["Hybrid", "6", "6", "0"],
          ["Cloud", "0", "6", "6"],
        ]);
        await expect(page.locator("#cmp-rows .cmp.on strong")).toHaveText("Hybrid");
        const fills = await page
          .locator("#b-local, #b-cloud, #b-held")
          .evaluateAll((bars) =>
            bars.map((bar) => bar.getBoundingClientRect().width / bar.parentElement.getBoundingClientRect().width),
          );
        fills.forEach((fill, i) => assert.ok(Math.abs(fill - [0.5, 0.5, 0][i]) < 0.02, `bar ${i} fill ${fill}`));
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
      for (const link of await page.locator("a").evaluateAll((nodes) => nodes.map((a) => a.getAttribute("href"))))
        assert.ok(link.startsWith("/") || /^https?:/.test(link), link);
      await page.locator(".room-end a").first().click();
      await expect(page.locator("#rooms-h")).toBeVisible();
    }
  }
});

test("Skip to content keeps the current room and history while moving keyboard focus", async (t) => {
  for (const width of [320, 1440]) {
    for (const [hash, id, heading] of [
      ["#evidence", "top", "#top h1"],
      ["#starship", "starship", "#ship-h"],
      ["#principles", "principles", "#pr-h"],
      ["#studios", "studios", "#studios-h"],
      ["#heritage", "heritage", "#he-h"],
    ]) {
      const page = await visit(t, { width, height: 844, hash, expandWorkbenches: false });
      const address = page.url();
      const title = await page.title();
      const entries = await page.evaluate(() => history.length);
      const skip = page.getByRole("link", { name: "Skip to content", exact: true });
      await skip.focus();
      await expect(skip).toBeInViewport();
      await skip.press("Enter");
      await expect(page.locator(heading)).toBeFocused();
      await expect(page.locator(heading)).toBeInViewport();
      await expect(page.locator(`#${id}`)).toBeVisible();
      assert.equal(page.url(), address, "Skipping content does not navigate away");
      assert.equal(await page.title(), title);
      assert.equal(await page.evaluate(() => history.length), entries, "No extra history entry");
    }
  }
});

test("The V35 archive returns to the current site without adding a cinema tab stop", async (t) => {
  for (const width of [320, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: "reduce" });
    t.after(() => context.close());
    const page = await context.newPage();
    await page.goto(new URL("/command-deck.html#deck=eve", url).href);
    await page.locator('button[data-cmd="photo"]').click();
    const cinema = page.getByRole("dialog", { name: "Cinema view", exact: true });
    await expect(cinema).toBeVisible();
    const back = page.locator('a[href="/"]').filter({ hasText: "Back to current site" });
    assert.equal(await back.evaluate((link) => Boolean(link.closest("[inert]"))), true);
    const exit = cinema.getByRole("button", { name: "EXIT CINEMA", exact: true });
    for (const key of ["Tab", "Shift+Tab"]) {
      await page.keyboard.press(key);
      await expect(exit).toBeFocused();
    }
    await page.keyboard.press("Escape");
    await expect(cinema).not.toBeVisible();
    assert.equal(await back.evaluate((link) => Boolean(link.closest("[inert]"))), false);
    await page.goto(new URL("/command-deck.html", url).href);
    await back.click();
    await expect(page.locator("#hero-primary")).toBeVisible();
    assert.equal(new URL(page.url()).pathname, "/");

    const staticContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width, height: 844 } });
    t.after(() => staticContext.close());
    const staticPage = await staticContext.newPage();
    await staticPage.goto(new URL("/command-deck.html", url).href);
    await staticPage.getByRole("link", { name: "Back to current site", exact: false }).click();
    await expect(staticPage.locator("#hero-primary")).toBeVisible();
    assert.equal(new URL(staticPage.url()).pathname, "/");
  }
});

test("Study shortcuts reveal the chosen experiment and heritage credits never cover the photograph", async (t) => {
  for (const width of [320, 390, 1440]) {
    const page = await visit(t, { width, height: 844, expandWorkbenches: false });
    const shortcuts = page.getByRole("navigation", { name: "Study shortcuts", exact: true });
    await expect(shortcuts.getByRole("link")).toHaveCount(7);
    await expect(page.locator("#study-lab")).not.toHaveAttribute("open", "");
    for (const id of ["hermes", "cascade", "exposure", "briefing", "dashboards", "signal", "graphify"]) {
      await shortcuts.locator(`a[href="#build=${id}"]`).click();
      await expect(page.locator("#study-lab")).toHaveAttribute("open", "");
      await expect(page.locator(`#study-${id}`)).toHaveAttribute("aria-selected", "true");
      await expect(page.locator("#studies-h")).toBeFocused();
    }
    await page.locator('.room-card[data-room-route="#heritage"]').click();
    for (const pilot of ["yeager", "johnson", "rutan", "hoover"]) {
      await page.locator(`#pilots [data-pilot="${pilot}"]`).click();
      await expect(page.locator("#hangar").getByRole("img")).toHaveCount(1);
      const geometry = await page.locator("#hg-credit").evaluate((credit) => {
        const photo = document.querySelector("#hangar").getBoundingClientRect();
        const caption = credit.closest("figcaption").getBoundingClientRect();
        return { imageBottom: photo.bottom, captionTop: caption.top, right: caption.right };
      });
      assert.ok(geometry.captionTop >= geometry.imageBottom, "Credits have a separate band below the image");
      assert.ok(geometry.right <= width, "The caption stays within the page");
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    await audit(page, `heritage-caption-${width}`);
  }
});

test("Section navigation keeps its heading visible after a viewport change", async (t) => {
  const page = await visit(t, {
    width: 320,
    height: 844,
    motion: "no-preference",
    hash: "#heritage",
    expandWorkbenches: false,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url + "#studies");
  await expect(page.locator("#studies-h")).toBeFocused();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator("#st-next").scrollIntoViewIfNeeded();
  await page.locator('.sections a[href="#studies"]').click();
  await expect(page.locator("#studies-h")).toBeFocused();
  await expect(page.locator("#studies-h")).toBeInViewport();
  await expect
    .poll(() => page.locator("#studies-h").evaluate((heading) => heading.getBoundingClientRect().top))
    .toBeGreaterThanOrEqual(70);
});

test("Enhanced room cards have native interactive destinations while static editions remain explicit", async (t) => {
  const page = await visit(t, { width: 390, expandWorkbenches: false });
  for (const id of ["starship", "principles", "studios", "heritage"]) {
    const card = page.locator(`.room-card[data-room-route="#${id}"]`);
    await expect(card).toHaveAttribute("href", `#${id}`);
    // Follow the actual native address, as a copied or new-tab link would do.
    const address = await card.evaluate((link) => link.href);
    const other = await page.context().newPage();
    await other.goto(address);
    await expect(other.locator(`#${id}`)).toHaveAttribute("data-room-state", "ready");
    assert.equal(new URL(other.url()).pathname, "/");
    await other.close();
    await card.press("Enter");
    await expect(page.locator(`#${id}`)).toHaveAttribute("data-room-state", "ready");
    await page.locator(".room-back").click();
  }
});

test("Mission Control offers a compact index, relevant hints and a keyboard-accessible glossary", async (t) => {
  for (const width of [320, 390, 1440]) {
    const page = await visit(t, { width, height: 844, expandWorkbenches: false });
    await page.locator("#mc-btn").click();
    await expect(page.locator("#mc-list a")).toHaveCount(5);
    if (width < 600) await expect(page.locator(".mc-keymap")).toBeHidden();
    else await expect(page.locator(".mc-keymap")).toBeVisible();
    await page.locator("#mc-search").fill("glossary");
    await expect(page.locator('#mc-list a[href="#glossary"]')).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page.locator("#glossary")).toHaveAttribute("open", "");
    await expect(page.locator("#glossary > summary")).toBeFocused();
    await expect(page.locator("#glossary > summary")).toBeInViewport();
    assert.equal(new URL(page.url()).hash, "#glossary");
    await page.reload();
    await expect(page.locator("#glossary")).toHaveAttribute("open", "");
    await expect(page.locator("#glossary > summary")).toBeFocused();
    await page.keyboard.press("Space");
    await expect(page.locator("#glossary")).not.toHaveAttribute("open", "");
    await page.keyboard.press("Space");
    await expect(page.locator("#glossary")).toHaveAttribute("open", "");
    await audit(page, `glossary-${width}`);
  }
});

test("Reading editions explain inactive controls and contain no live regions", async (t) => {
  const page = await visit(t, { expandWorkbenches: false });
  for (const status of await page.locator(".room-load-status").all()) await expect(status).toBeEmpty();
  for (const id of ["starship", "principles", "studios", "heritage"]) {
    await page.goto(new URL(`/rooms/${id}/`, url).href);
    await expect(page.locator("#reading-mode")).toContainText("Controls are inactive in this reading edition");
    assert.equal(await page.locator('[aria-live],[role="status"],[role="log"]').count(), 0);
    assert.equal(await page.locator("div[aria-label]:not([role]),span[aria-label]:not([role])").count(), 0);
    assert.equal(await page.locator("button:enabled,input:enabled,select:enabled,textarea:enabled").count(), 0);
    for (const control of await page.locator("button,input,select,textarea").all())
      await expect(control).toHaveAttribute("aria-describedby", "reading-mode");
    await expect(page.getByRole("link", { name: "Open the interactive room", exact: false })).toBeVisible();
  }
});

test("Phones and data-saving visits keep the hero artwork without downloading the decorative film", async (t) => {
  for (const setting of ["phone", "save-data", "slow-connection", "desktop"]) {
    const context = await browser.newContext({
      viewport: { width: setting === "phone" ? 390 : 1440, height: 900 },
      hasTouch: setting === "phone",
      isMobile: setting === "phone",
      reducedMotion: "no-preference",
    });
    t.after(() => context.close());
    if (setting === "save-data" || setting === "slow-connection")
      await context.addInitScript((value) => {
        Object.defineProperty(navigator, "connection", {
          configurable: true,
          value: {
            saveData: value === "save-data",
            effectiveType: value === "slow-connection" ? "2g" : "4g",
          },
        });
      }, setting);
    const page = await context.newPage();
    const media = [];
    page.on("request", (request) => {
      if (request.url().includes("helios-arrival.mp4")) media.push(request.url());
    });
    await page.goto(url, { waitUntil: "networkidle" });
    await expect(page.locator("#study-hermes")).toBeAttached();
    await expect(page.locator("#fallback")).toBeVisible();
    if (setting === "desktop") {
      await expect.poll(() => media.length).toBeGreaterThan(0);
      assert.equal(await page.locator("#hero-film").evaluate((film) => film.muted), true);
    } else {
      assert.deepEqual(media, [], `${setting} does not fetch the decorative film`);
      await expect(page.locator("#hero-film")).toHaveCount(0);
      await page.locator("#mc-btn").click();
      if (setting === "phone") await expect(page.locator(".mc-keymap")).toBeHidden();
    }
    await context.close();
  }
});

test("A shared HERMES study link restores its settings on open and on reload", async (t) => {
  const shared = "#build=hermes&intent=analyze&private=1&sources=1";
  const page = await visit(t, { hash: shared, expandWorkbenches: false });
  for (let pass = 0; pass < 2; pass++) {
    await expect(page.locator('[data-intent="analyze"]')).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#tg-private")).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#tg-sources")).toHaveAttribute("aria-pressed", "true");
    assert.equal(new URL(page.url()).hash, shared);
    await page.reload();
  }
});

test("Back from a room returns to the reader's place and search ranks titles first", async (t) => {
  const page = await visit(t, { width: 1440, height: 900, expandWorkbenches: false });
  await page.locator("#rooms").scrollIntoViewIfNeeded();
  const card = page.locator('.room-card[data-room-route="#principles"]');
  // Measure where the card sits on screen, which stays meaningful while lazily laid out sections settle.
  const place = () => card.evaluate((el) => ({ top: el.getBoundingClientRect().top, y: scrollY }));
  await card.hover();
  const before = await place();
  assert.ok(before.y > 1000, "the rooms row sits well below the opening");
  await card.click();
  await expect(page.locator("#pr-h")).toBeVisible();
  await page.goBack();
  await expect(card).toBeInViewport();
  await expect.poll(async () => Math.abs((await place()).top - before.top)).toBeLessThan(120);
  await page.locator("#mc-btn").click();
  // A title match outranks a glossary keyword, and short words match whole words only.
  await page.locator("#mc-search").fill("zeus");
  await expect(page.locator("#mc-list a strong").first()).toContainText(/zeus/i);
  await expect(page.locator("#mc-list a").first()).not.toHaveAttribute("href", "#glossary");
  for (const [query, first] of [
    ["eve", "#evidence"],
    ["yeager", "#heritage"],
  ]) {
    await page.locator("#mc-search").fill(query);
    await expect(page.locator("#mc-list a").first()).toHaveAttribute("href", first);
  }
  await page.locator("#mc-search").fill("bit");
  await expect(page.locator('#mc-list a[href="#top"]')).toHaveCount(0);
});
