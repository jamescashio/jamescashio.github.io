import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
import path from "node:path";

const url = process.env.HELIOS_URL || "http://127.0.0.1:4388/v38/";
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
  const data = await page.request.get(url + "status.json");
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
  await page.goto(new URL("/#build=hermes", url).href);
  await expect(page.locator("#odyssey-root")).toBeAttached();
  assert.equal(new URL(page.url()).pathname, "/");
});
