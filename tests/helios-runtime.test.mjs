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
async function visit(t, { width = 1440, height = 1000, motion = "reduce", hash = "" } = {}) {
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
    await expect(page.locator("#st-name")).toHaveText("Escalation Cascade");
    await page.locator("#studies-h").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(output, `study-deck-${width}.png`) });
  }
});

test("Mission presets and the last change match the model, including custom settings and unchanged counts", async (t) => {
  const page = await visit(t, { width: 390 });
  await expect(page.locator('[data-mission="routine"]')).toHaveAttribute("aria-pressed", "true");
  await page.locator('[data-mission="blackout"]').click();
  await expect(page.locator("#mission-state")).toHaveText("Deep-space blackout · selected");
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
  await page.locator('.minute a[href="#work"]').click();
  await expect(page.locator("#work-h")).toBeFocused();
  await page.locator('.minute a[href="#build-story"]').click();
  await expect(page.locator("#build-proof-title")).toBeFocused();
  await page.locator('.minute a[href="#evidence"]').click();
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
  const page = await visit(t, { width: 390, height: 844, motion: "no-preference" });
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
  await page.locator("h1").scrollIntoViewIfNeeded();
  await expect(page.locator("#flow-scene")).toHaveAttribute("data-scene-active", "false");
  const paused = await packet.getAttribute("transform");
  await page.waitForTimeout(200);
  assert.equal(await packet.getAttribute("transform"), paused, "offscreen packets do not keep animating");
  await page.locator("#motion-btn").click();
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
  const page = await visit(t, { motion: "no-preference" });
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
  await page.locator("h1").scrollIntoViewIfNeeded();
  await expect(engine).toHaveAttribute("data-animating", "false");
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
  await page.route("**/v38/assets/celestial.webp", (route) => route.abort());
  await page.goto(url + "#operator");
  await page.reload();
  await page.locator("#sigplate").scrollIntoViewIfNeeded();
  await expect(page.locator("#sig-art")).toHaveAttribute("src", "/v38/assets/celestial.jpg");
  await page.locator("#sig-art").evaluate((image) => image.decode());
  assert.equal(await page.locator("#sig-art").evaluate((image) => image.naturalWidth), 1680);
});

test("Mission Control follows nested text and keyboard selection to the exact study", async (t) => {
  const page = await visit(t);
  await page.keyboard.press("Control+k");
  await page.locator("#mc-search").fill("Graphify");
  await page.locator("#mc-list strong").click();
  await expect(page.locator("#mc")).not.toBeVisible();
  await expect(page.locator("#st-name")).toHaveText("Graphify");
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

test("The full page, atlas, principles, evidence console, hangar and contact stay usable", async (t) => {
  for (const width of [1440, 390, 320]) {
    const page = await visit(t, { width, height: width > 700 ? 1000 : 844 });
    for (const id of [
      "top",
      "work",
      "studies",
      "universe",
      "starship",
      "principles",
      "studios",
      "evidence",
      "heritage",
      "operator",
      "contact",
    ]) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width, `${id} at ${width}px`);
      await page.screenshot({ path: path.join(output, `polish-${width}-${id}.png`) });
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
    for (const [index, title] of [
      [0, "Begin with a clear signal."],
      [1, "Give each request the route it needs."],
      [2, "Trust has a timestamp."],
    ]) {
      await page.locator(`[data-pr='${index}']`).click();
      await expect(page.locator("#pr-title")).toHaveText(title);
    }
    await page.locator("#engine").press("ArrowRight");
    await expect(page.locator("#eng-rot")).toHaveAttribute("style", /rotate\(10deg\)/);
    await page.locator("#engine").press("Home");
    await expect(page.locator("#eng-rot")).toHaveAttribute("style", /rotate\(0deg\)/);
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
    await page.locator("#eve-in").fill("fleet");
    await page.locator("#eve-in").press("Enter");
    await expect(page.locator("#eve-out")).toContainText("September 18, 2026");
    await page.locator("#eve-in").fill("routes");
    await page.locator("#eve-in").press("Enter");
    await expect(page.locator("#eve-out")).toContainText("routingVerified: null");
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
  await expect(page.locator(".brief-output")).toContainText("September 18, 2026");
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
  assert.equal((await data.json()).provenance.observedAtUtc, "2026-09-18T22:53:54Z");
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

test("Evidence leads with meaning, expands by keyboard and links the shipped build", async (t) => {
  const page = await visit(t, { width: 320, hash: "#evidence" });
  await expect(page.locator(".evidence-summary")).toContainText("20 containers. One virtual machine.");
  await expect(page.locator(".evidence-summary")).toContainText("not established here");
  await expect(page.locator("#build-proof-title")).toHaveText("One boundary. Every request accounted for.");
  await page.locator(".case-engineering summary").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator('.case-engineering a[href*="pull/135"]')).toBeVisible();
  await expect(page.locator("#evidence-records")).not.toHaveAttribute("open", "");
  await page.locator("#evidence-records summary").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#ev-chart")).toBeVisible();
  await expect(page.locator("#ev-chart")).toContainText("Not verified");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 320);
  await audit(page, "expanded-evidence-320");
  await page.screenshot({ path: path.join(output, "expanded-evidence-320.png") });
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
  const page = await visit(t, { motion: "no-preference" });
  await page.locator("#motion-btn").click();
  await page.reload();
  await expect(page.locator("#motion-btn")).toHaveAttribute("aria-pressed", "false");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator("#motion-btn")).toHaveAttribute("aria-pressed", "false");
  await page.locator("#motion-btn").click();
  await page.reload();
  await expect(page.locator("#motion-btn")).toHaveAttribute("aria-pressed", "true");
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
  await page.locator("#hero-primary").click();
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
  await expect(staticPage.locator(".studio-card")).toHaveCount(3);
  assert.equal(new URL(staticPage.url()).pathname, "/");
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
