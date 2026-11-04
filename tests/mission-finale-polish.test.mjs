import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";

const url = process.env.V40_URL;
let browser;
before(async () => {
  assert.ok(url, "Set V40_URL to the built preview before running the finale checks.");
  browser = await chromium.launch({
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" }),
    headless: true,
  });
});
after(async () => browser?.close());

async function ending(t, { width, shareable = false, setup } = {}) {
  const context = await browser.newContext({
    viewport: { width, height: 844 },
    reducedMotion: "reduce",
  });
  t.after(() => context.close());
  await context.addInitScript((supported) => {
    Object.defineProperty(navigator, "canShare", { configurable: true, value: () => supported });
  }, shareable);
  if (setup) await context.addInitScript(setup);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  t.after(() => assert.deepEqual(errors, []));
  await page.goto(new URL("#flight=permission", url).href, { waitUntil: "networkidle" });
  await expect(page.locator(".ff-stage")).toHaveClass(/ff-stage-ready/);
  await page.getByRole("button", { name: "Finish →", exact: true }).click();
  await expect(page.locator("#ff-finale-title")).toBeFocused();
  return page;
}

test("phone endings put usable Save and Share or Copy controls beside the card before personalization", async (t) => {
  for (const width of [320, 390]) {
    for (const shareable of [false, true]) {
      const page = await ending(t, { width, shareable });
      const finale = page.locator(".ff-finale");
      await expect(finale.locator(".ff-save")).toBeEnabled();
      const positions = await finale.evaluate((node) => {
        const card = node.querySelector(".ff-keepsake > img").getBoundingClientRect();
        const save = node.querySelector(".ff-save").getBoundingClientRect();
        const controls = [...node.querySelectorAll(".ff-finale-actions button")].map((button) => {
          const box = button.getBoundingClientRect();
          return {
            x: box.x,
            right: box.right,
            bottom: box.bottom,
            width: box.width,
            height: box.height,
            fits: button.scrollWidth <= button.clientWidth,
          };
        });
        const actions = node.querySelector(".ff-finale-actions");
        const form = node.querySelector(".ff-personalize");
        return {
          scrollTop: node.scrollTop,
          gap: save.y - card.bottom,
          controls,
          actionsBeforeName: !!(actions.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING),
          noOverflow: node.scrollWidth <= node.clientWidth,
        };
      });
      assert.equal(positions.scrollTop, 0, "focus must begin at the ending, without skipping the card");
      assert.ok(positions.gap >= 0 && positions.gap <= 84, "Save directly follows the card's format selector");
      assert.equal(positions.actionsBeforeName, true, "personalization must not bury the sharing actions");
      assert.equal(positions.noOverflow, true);
      assert.equal(positions.controls.length, shareable ? 3 : 2);
      for (const button of positions.controls) {
        assert.ok(button.width >= 110 && button.height >= 44 && button.x >= 0 && button.right <= width);
        assert.ok(button.bottom <= 844, "all card actions are available without a phone scroll");
        assert.equal(button.fits, true, "the complete button label fits");
      }
      await finale.getByRole("button", { name: /^Portrait/ }).focus();
      await page.keyboard.press("Tab");
      await expect(finale.getByRole("button", { name: /^Landscape/ })).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(finale.locator(".ff-save")).toBeFocused();
      await expect(finale.getByRole("button", { name: /^Roadster Studio/ })).toBeVisible();
      await expect(finale.getByRole("button", { name: "Replay flight", exact: true })).toBeVisible();
      await expect(finale.getByRole("button", { name: /^Compare notes with Doug/ })).toBeVisible();
      await finale.locator(".ff-finale-routes summary").focus();
      await page.keyboard.press("Enter");
      await expect(finale.getByRole("button", { name: /^Test a private request/ })).toBeVisible();
      await expect(finale.getByRole("button", { name: /^See the real build story/ })).toBeVisible();
      await page.close();
    }
  }
});

test("a failed image can recover both real PNG formats without replaying or changing the decision", async (t) => {
  const page = await ending(t, {
    width: 320,
    setup: () => {
      window.failCardExports = true;
      const encode = HTMLCanvasElement.prototype.toBlob;
      HTMLCanvasElement.prototype.toBlob = function (callback, ...args) {
        if (window.failCardExports && [1080, 1600].includes(this.width)) {
          callback(null);
          return;
        }
        return encode.call(this, callback, ...args);
      };
    },
  });
  const finale = page.locator(".ff-finale");
  await expect(finale.locator(".ff-finale-status")).toContainText("image could not be prepared");
  await expect(finale.locator(".ff-save")).toBeDisabled();
  await expect(finale.locator(".ff-share")).toBeEnabled();
  await page.evaluate(() => {
    window.failCardExports = false;
  });
  await finale.getByRole("button", { name: "Try preparing the image again", exact: true }).click();
  await expect(finale.locator(".ff-save")).toBeEnabled();
  await expect(finale.locator(".ff-card-retry")).toHaveCount(0);
  await expect(finale.locator(".ff-finale-metrics dd")).toHaveText(["00", "00", "12"]);
  for (const [format, width, height] of [
    ["Portrait", 1080, 1440],
    ["Landscape", 1600, 1000],
  ]) {
    await finale.getByRole("button", { name: new RegExp(`^${format}`) }).click();
    await expect(finale.locator(".ff-keepsake > img")).toHaveAttribute("alt", /0 onboard, 0 in cloud, 12 held/);
    const download = page.waitForEvent("download");
    await finale.locator(".ff-save").click();
    const file = await download;
    const bytes = await readFile(await file.path());
    assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    assert.deepEqual([bytes.readUInt32BE(16), bytes.readUInt32BE(20)], [width, height]);
    assert.match(file.suggestedFilename(), new RegExp(`0-0-12-${format.toLowerCase()}\\.png$`));
  }
});

test("a missing scene offers a real replay recovery while keeping the scenario link usable", async (t) => {
  const page = await ending(t, {
    width: 390,
    setup: () => {
      window.failSceneCapture = true;
      window.captureFailures = 0;
      const draw = CanvasRenderingContext2D.prototype.drawImage;
      CanvasRenderingContext2D.prototype.drawImage = function (source, ...args) {
        if (window.failSceneCapture && source instanceof HTMLCanvasElement && source.closest(".ff-stage")) {
          window.captureFailures++;
          throw new DOMException("The scene capture failed.", "InvalidStateError");
        }
        return draw.call(this, source, ...args);
      };
      Object.defineProperty(navigator.clipboard, "writeText", {
        configurable: true,
        value: async (text) => {
          window.copiedScenario = text;
        },
      });
    },
  });
  const finale = page.locator(".ff-finale");
  await expect(finale.locator(".ff-finale-status")).toContainText("flight image could not be captured");
  assert.equal(await page.evaluate(() => window.captureFailures), 1, "the original scene capture must fail");
  await expect(finale.locator(".ff-save")).toBeDisabled();
  await expect(finale.getByRole("button", { name: "Try preparing the image again", exact: true })).toHaveCount(0);
  await finale.getByRole("button", { name: "Copy this scenario", exact: true }).click();
  assert.equal(
    await page.evaluate(() => window.copiedScenario),
    new URL("#mission=cloud.private.connected.held", url).href,
  );
  await page.evaluate(() => {
    window.failSceneCapture = false;
  });
  await finale.getByRole("button", { name: "Replay to capture your card", exact: true }).click();
  await expect(finale).toHaveCount(0);
  await page.getByRole("combobox", { name: "Flight chapter" }).selectOption("3");
  await page.getByRole("button", { name: "Finish →", exact: true }).click();
  await expect(finale.locator(".ff-save")).toBeEnabled();
  await expect(finale.locator(".ff-keepsake > img")).toHaveAttribute("alt", /0 onboard, 0 in cloud, 12 held/);
  await expect(finale.locator(".ff-card-retry")).toHaveCount(0);
  const download = page.waitForEvent("download");
  await finale.locator(".ff-save").click();
  const file = await download;
  const bytes = await readFile(await file.path());
  assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.deepEqual([bytes.readUInt32BE(16), bytes.readUInt32BE(20)], [1080, 1440]);
});
