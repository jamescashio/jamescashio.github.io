import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const url = process.env.V40_URL;
let browser;
before(async () => {
  browser = await chromium.launch({
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" }),
    headless: true,
  });
});
after(async () => browser?.close());

async function visit(t, { width = 1440, motion = "reduce", hash = "#flight=permission", setup } = {}) {
  const context = await browser.newContext({
    viewport: { width, height: width > 700 ? 900 : 844 },
    reducedMotion: motion,
    permissions: ["clipboard-read", "clipboard-write"],
  });
  t.after(() => context.close());
  if (setup) await context.addInitScript(setup);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  t.after(() => assert.deepEqual(errors, []));
  await page.goto(new URL(hash, url).href, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  return page;
}

async function png(page, format, dimensions) {
  const finale = page.locator(".ff-finale");
  await finale.getByRole("button", { name: new RegExp(`^${format}`, "i") }).click();
  await expect(finale.locator(".ff-keepsake > img")).toBeVisible();
  const download = page.waitForEvent("download");
  await finale.getByRole("button", { name: /^Save mission card/ }).click();
  const saved = await download;
  assert.match(saved.suggestedFilename(), new RegExp(`-${format}\\.png$`));
  const bytes = await readFile(await saved.path());
  assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.deepEqual([bytes.readUInt32BE(16), bytes.readUInt32BE(20)], dimensions);
  assert.ok(bytes.length > 40000, "the exported card contains a rendered scene");
  return saved.suggestedFilename();
}

test("the uninterrupted cinematic tour ends in an honest, downloadable record", async (t) => {
  const page = await visit(t, { motion: "no-preference", hash: "#flight=tour" });
  const flight = page.locator(".ff-showcase");
  await expect(flight).toHaveAttribute("data-playback", "tour");
  await expect(flight.locator(".ff-story")).toBeHidden();
  const stage = await flight.locator(".ff-stage").boundingBox();
  assert.ok(stage.width > 1300 && stage.height > 600, "the tour gives the ship the full stage");
  await expect(flight).toHaveAttribute("data-complete", "true", { timeout: 40000 });
  await expect(flight.locator("#ff-finale-title")).toBeFocused();
  // Two full-size PNGs are encoded asynchronously after the scene freezes.
  // Wait for the explicit ready state on software-rendered CI machines.
  await expect(flight.locator(".ff-finale-status")).toHaveText(
    "Your record is ready. Save the image or copy your scenario link.",
    { timeout: 15000 },
  );
  await expect(flight.locator(".ff-keepsake > img")).toHaveAttribute("alt", /0 onboard, 0 in cloud, 12 held/);
  await expect(flight.locator(".ff-finale-metrics dd")).toHaveText(["00", "00", "12"]);
  await png(page, "portrait", [1080, 1440]);
  await png(page, "landscape", [1600, 1000]);
  await flight.getByRole("button", { name: "Copy this scenario", exact: true }).click();
  assert.equal(
    await page.evaluate(() => navigator.clipboard.readText()),
    new URL("#mission=cloud.private.connected.held", url).href,
  );
  await flight.locator(".ff-finale-detail summary").click();
  await expect(flight.locator(".ff-finale .ff-recap")).toContainText("THE LAST CHAPTER, BOTH WAYS");
  await flight.getByRole("button", { name: "Replay flight", exact: true }).click();
  await expect(flight).toHaveAttribute("data-view", "cinema");
  await expect(flight.locator(".ff-finale")).toHaveCount(0);
  await expect(flight.locator(".ff-telemetry strong")).toHaveText(["06", "06", "00"]);
});

test("phone endings preserve the chosen permission, readable actions and onward focus", async (t) => {
  for (const width of [320, 390]) {
    const page = await visit(t, {
      width,
      setup: () => {
        Object.defineProperty(navigator, "canShare", { value: () => false, configurable: true });
      },
    });
    const flight = page.locator(".ff-showcase");
    await expect(flight.locator(".ff-stage")).toHaveClass(/ff-stage-ready/);
    await flight.getByRole("button", { name: /Permit these private requests/ }).click();
    await flight.getByRole("button", { name: /Skip to the ending/ }).click();
    await expect(flight.locator(".ff-keepsake > img")).toHaveAttribute("alt", /0 onboard, 12 in cloud, 0 held/);
    await expect(flight.locator(".ff-finale-metrics dd")).toHaveText(["00", "12", "00"]);
    await expect(flight.getByRole("button", { name: /^Share mission card/ })).toHaveCount(0);
    const filename = await png(page, "portrait", [1080, 1440]);
    assert.match(filename, /cloud-connected-0-12-0/);
    await flight.getByRole("button", { name: "Copy this scenario", exact: true }).click();
    assert.equal(
      await page.evaluate(() => navigator.clipboard.readText()),
      new URL("#mission=cloud.private.connected.permitted", url).href,
    );
    for (const control of await flight.locator(".ff-finale-actions button, .ff-card-formats button").all()) {
      const box = await control.boundingBox();
      assert.ok(box.width >= 44 && box.height >= 44 && box.x >= 0 && box.x + box.width <= width);
    }
    assert.equal(await flight.evaluate((n) => n.scrollWidth <= n.clientWidth), true);
    const { violations } = await new AxeBuilder({ page }).include("#helios-flight").analyze();
    assert.deepEqual(
      violations.map((item) => item.id),
      [],
    );
    await flight.getByRole("button", { name: /^Roadster Studio/ }).click();
    await expect(page.locator("#helios-flight")).toHaveCount(0);
    await expect(page.locator("#roadster-studio")).toBeFocused();
    await expect(page.locator("#roadster-studio")).toBeInViewport();
    assert.equal(await page.locator("#roadster-studio").evaluate((n) => n.closest("details") === null), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    const { violations: roadsterViolations } = await new AxeBuilder({ page }).include("#roadster-studio").analyze();
    assert.deepEqual(
      roadsterViolations.map((item) => item.id),
      [],
      JSON.stringify(roadsterViolations.map(({ id, nodes }) => ({ id, nodes }))),
    );
  }
});

test("native sharing uses a prepared PNG within the gesture and handles failure and cancellation", async (t) => {
  const page = await visit(t, {
    width: 390,
    setup: () => {
      window.sharedCards = [];
      Object.defineProperty(navigator, "canShare", {
        configurable: true,
        value: ({ files }) => files?.[0]?.type === "image/png",
      });
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: async ({ files }) => {
          window.sharedCards.push({
            name: files[0].name,
            size: files[0].size,
            active: navigator.userActivation.isActive,
          });
          if (window.sharedCards.length === 1) throw new DOMException("Unavailable", "NotAllowedError");
          if (window.sharedCards.length === 2) throw new DOMException("Cancelled", "AbortError");
        },
      });
    },
  });
  const flight = page.locator(".ff-showcase");
  await expect(flight.locator(".ff-stage")).toHaveClass(/ff-stage-ready/);
  await flight.getByRole("button", { name: "Finish →", exact: true }).click();
  const share = flight.getByRole("button", { name: /^Share mission card/ });
  await share.waitFor({ state: "visible" });
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const button of await flight.locator(".ff-finale-actions button").all()) {
      const box = await button.boundingBox();
      assert.ok(
        box.width >= 110 && box.height >= 44 && box.x >= 0 && box.x + box.width <= width,
        "native sharing must leave Save and Copy wide enough to read",
      );
      assert.ok(
        await button.evaluate((node) => node.scrollWidth <= node.clientWidth),
        "the complete action label fits",
      );
    }
  }
  await share.click();
  await expect(flight.locator(".ff-finale-status")).toContainText("Sharing is unavailable here");
  await share.click();
  await expect(flight.locator(".ff-finale-status")).toContainText("Sharing cancelled");
  await flight.getByRole("button", { name: /^Landscape/ }).click();
  await share.click();
  await expect(flight.locator(".ff-finale-status")).toHaveText("Mission card shared.");
  const calls = await page.evaluate(() => window.sharedCards);
  assert.equal(calls.length, 3);
  assert.ok(calls.every((call) => call.active && call.size > 40000));
  assert.match(calls[2].name, /landscape\.png$/);
});

test("image and clipboard failures retain the actual scenario and an accessible recovery path", async (t) => {
  const page = await visit(t, {
    width: 320,
    setup: () => {
      HTMLCanvasElement.prototype.toBlob = function (callback) {
        callback(null);
      };
      Object.defineProperty(navigator.clipboard, "writeText", {
        configurable: true,
        value: () => Promise.reject(new Error("Unavailable")),
      });
    },
  });
  await expect(page.locator(".ff-stage")).toHaveClass(/ff-stage-ready/);
  await page.getByRole("button", { name: "Finish →", exact: true }).click();
  await expect(page.locator(".ff-finale-status")).toContainText("image could not be prepared");
  await expect(page.locator(".ff-finale").getByRole("button", { name: /^Save mission card/ })).toBeDisabled();
  await page.getByRole("button", { name: "Copy this scenario", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Scene link" })).toHaveValue(
    new URL("#mission=cloud.private.connected.held", url).href,
  );
  await page.getByRole("button", { name: "Replay flight", exact: true }).click();
  await expect(page.locator(".ff-showcase")).toHaveAttribute("data-playback", "manual");
  await expect(page.locator(".ff-finale")).toHaveCount(0);
});
