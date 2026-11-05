import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const url = process.env.V40_URL;
let browser;
before(async () => {
  assert.ok(url, "Set V40_URL to the built studio preview.");
  browser = await chromium.launch({
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" }),
    headless: true,
  });
});
after(async () => browser?.close());

async function ending(t, { width = 390, permit = false, setup } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: "reduce" });
  t.after(() => context.close());
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "canShare", { configurable: true, value: () => false });
  });
  if (setup) await context.addInitScript(setup);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  t.after(() => assert.deepEqual(errors, []));
  await page.goto(new URL("#flight=permission", url).href, { waitUntil: "networkidle" });
  await expect(page.locator(".ff-stage")).toHaveClass(/ff-stage-ready/);
  if (permit) {
    await page.getByRole("button", { name: /Permit these private requests/ }).click();
    await page.getByRole("button", { name: /Skip to the ending/ }).click();
  } else {
    await page.getByRole("button", { name: "Finish →", exact: true }).click();
  }
  await expect(page.locator(".ff-finale .ff-save")).toBeEnabled({ timeout: 15000 });
  return page;
}

test("card inspection fits phones, contains keyboard focus and closes independently of the flight", async (t) => {
  for (const width of [320, 390, 1440]) {
    const page = await ending(t, { width });
    const inspect = page.getByRole("button", { name: "Inspect mission card", exact: true });
    const original = await page.locator(".ff-keepsake > img").getAttribute("src");
    assert.match(original, /^data:image\/png;base64,/);
    await inspect.click();
    const dialog = page.getByRole("dialog", { name: "Your mission card.", exact: true });
    await expect(dialog).toBeVisible();
    const close = dialog.getByRole("button", { name: /^Close preview/ });
    const zoom = dialog.getByRole("button", { name: "View full size", exact: true });
    await expect(close).toBeFocused();
    await expect(dialog.locator("img")).toHaveAttribute("src", original);
    const geometry = await dialog.evaluate((node) => {
      const box = node.getBoundingClientRect();
      const image = node.querySelector("img");
      return {
        x: box.x,
        right: box.right,
        y: box.y,
        bottom: box.bottom,
        fits: node.scrollWidth <= node.clientWidth,
        fittedImage: image.clientWidth <= node.querySelector(".ff-card-inspector-image").clientWidth,
      };
    });
    assert.ok(geometry.x >= 0 && geometry.right <= width && geometry.y >= 0 && geometry.bottom <= 844);
    assert.equal(geometry.fits, true);
    assert.equal(geometry.fittedImage, true);
    await page.keyboard.press("Shift+Tab");
    await expect(zoom).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(close).toBeFocused();
    await zoom.click();
    const imageRegion = dialog.getByRole("region", { name: "Full-size mission card. Scroll to inspect." });
    await expect(imageRegion).toBeFocused();
    assert.equal(await imageRegion.evaluate((node) => node.scrollWidth > node.clientWidth), true);
    await page.keyboard.press("Tab");
    await expect(close).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(page.locator(".ff-showcase")).toBeVisible();
    await expect(inspect).toBeFocused();
    await inspect.click();
    await page.mouse.click(2, 2);
    await expect(dialog).toHaveCount(0);
    await expect(page.locator(".ff-showcase")).toBeVisible();
    await expect(inspect).toBeFocused();
    await inspect.click();
    const { violations } = await new AxeBuilder({ page }).include(".ff-card-inspector").analyze();
    assert.deepEqual(
      violations.map((item) => item.id),
      [],
    );
    await close.click();
    await expect(inspect).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.locator(".ff-showcase")).toHaveCount(0);
    await page.close();
  }
});

test("rapid composition and callsign changes export only the latest real scene and keep native sharing ready", async (t) => {
  const page = await ending(t, {
    width: 390,
    permit: true,
    setup: () => {
      const drawings = new WeakMap();
      const blobDrawings = new WeakMap();
      const urlDrawings = new Map();
      window.pendingMissionEncodes = [];
      window.downloadedDrawings = [];
      window.sharedCards = [];
      const fill = CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText = function (...args) {
        if ([1080, 1600].includes(this.canvas.width)) {
          const lines = drawings.get(this.canvas) || [];
          lines.push(String(args[0]));
          drawings.set(this.canvas, lines);
        }
        return fill.apply(this, args);
      };
      const encode = HTMLCanvasElement.prototype.toBlob;
      HTMLCanvasElement.prototype.toBlob = function (callback, ...args) {
        const lines = [...(drawings.get(this) || [])];
        const run = () =>
          encode.call(
            this,
            (blob) => {
              if (blob) blobDrawings.set(blob, lines);
              callback(blob);
            },
            ...args,
          );
        if (window.holdMissionEncoding && [1080, 1600].includes(this.width)) window.pendingMissionEncodes.push(run);
        else run();
      };
      const objectURL = URL.createObjectURL;
      URL.createObjectURL = (blob) => {
        const value = objectURL(blob);
        if (blobDrawings.has(blob)) urlDrawings.set(value, blobDrawings.get(blob));
        return value;
      };
      const click = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function () {
        if (urlDrawings.has(this.href)) window.downloadedDrawings.push(urlDrawings.get(this.href));
        return click.call(this);
      };
      Object.defineProperty(navigator, "canShare", { configurable: true, value: () => true });
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: async ({ files }) => {
          window.sharedCards.push({
            name: files[0].name,
            size: files[0].size,
            active: navigator.userActivation.isActive,
          });
        },
      });
    },
  });
  const finale = page.locator(".ff-finale");
  const compose = finale.locator(".ff-card-composition");
  await page.evaluate(() => {
    window.holdMissionEncoding = true;
  });
  await compose.getByRole("button", { name: "Field report", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.pendingMissionEncodes.length)).toBe(2);
  await expect(finale.locator(".ff-save")).toBeDisabled();
  await compose.getByRole("button", { name: "Cinematic", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.pendingMissionEncodes.length)).toBe(4);
  await finale.locator("#ff-callsign").fill("Final Pilot");
  await finale.getByRole("button", { name: "Apply", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.pendingMissionEncodes.length)).toBe(6);
  await compose.getByRole("button", { name: "Field report", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.pendingMissionEncodes.length)).toBe(8);
  await page.evaluate(() => {
    window.holdMissionEncoding = false;
    window.pendingMissionEncodes.reverse().forEach((encode) => encode());
  });
  await expect(finale.locator(".ff-save")).toBeEnabled({ timeout: 15000 });
  await expect(finale.locator(".ff-keepsake > img")).toHaveAttribute(
    "alt",
    /for Final Pilot:.*0 onboard, 12 in cloud, 0 held/,
  );
  for (const [format, width, height] of [
    ["Portrait", 1080, 1440],
    ["Landscape", 1600, 1000],
  ]) {
    await finale.getByRole("button", { name: new RegExp(`^${format}`) }).click();
    const preview = await finale.locator(".ff-keepsake > img").getAttribute("src");
    const pending = page.waitForEvent("download");
    await finale.locator(".ff-save").click();
    const download = await pending;
    const bytes = await readFile(await download.path());
    assert.match(download.suggestedFilename(), new RegExp(`0-12-0-field-report-${format.toLowerCase()}\\.png$`));
    assert.deepEqual([bytes.readUInt32BE(16), bytes.readUInt32BE(20)], [width, height]);
    assert.deepEqual(
      bytes,
      Buffer.from(preview.split(",")[1], "base64"),
      "the preview and saved PNG are the same image",
    );
  }
  const drawings = await page.evaluate(() => window.downloadedDrawings);
  assert.equal(drawings.length, 2);
  for (const text of drawings) {
    assert.ok(text.includes("CALLSIGN / Final Pilot"));
    assert.ok(text.includes("FIELD REPORT / A HUMAN IN COMMAND."));
    assert.match(text.join(" "), /All 12 requests use an external cloud provider/);
  }
  await finale.getByRole("button", { name: /^Share mission card/ }).click();
  const shares = await page.evaluate(() => window.sharedCards);
  assert.equal(shares.length, 1);
  assert.match(shares[0].name, /0-12-0-field-report-landscape\.png$/);
  assert.ok(shares[0].active && shares[0].size > 40000);
  assert.ok(!page.url().includes("Final") && !page.url().includes("Pilot"));
});

test("field reports keep every scenario heading and decision clear of the captured frame and settings", async (t) => {
  const page = await ending(t);
  const results = await page.evaluate(async () => {
    const resource = performance
      .getEntriesByType("resource")
      .find((entry) => /\/cinematic-mission-card-[^/]+\.js/.test(entry.name));
    if (!resource) throw new Error("The built mission-card generator was not loaded.");
    const module = await import(resource.name);
    const create = Object.values(module).find((value) => typeof value === "function");
    if (!create) throw new Error("The mission-card generator export was not found.");
    const still = document.createElement("canvas");
    still.width = 640;
    still.height = 400;
    const paint = still.getContext("2d");
    paint.fillStyle = "#174357";
    paint.fillRect(0, 0, 640, 400);
    const originalFill = CanvasRenderingContext2D.prototype.fillText;
    const originalStroke = CanvasRenderingContext2D.prototype.strokeRect;
    const originalBlob = HTMLCanvasElement.prototype.toBlob;
    let texts = [];
    let frames = [];
    CanvasRenderingContext2D.prototype.fillText = function (text, x, y, maxWidth) {
      const measured = this.measureText(String(text));
      const width = Math.min(measured.width, maxWidth ?? Infinity);
      texts.push({
        text: String(text),
        x: this.textAlign === "right" ? x - width : x,
        right: this.textAlign === "right" ? x : x + width,
        top: y - measured.actualBoundingBoxAscent,
        bottom: y + measured.actualBoundingBoxDescent,
      });
      return originalFill.call(this, text, x, y, ...(maxWidth === undefined ? [] : [maxWidth]));
    };
    CanvasRenderingContext2D.prototype.strokeRect = function (x, y, width, height) {
      frames.push({ x, y, right: x + width, bottom: y + height });
      return originalStroke.call(this, x, y, width, height);
    };
    // This check measures real font/layout geometry; other tests verify actual PNG encoding.
    HTMLCanvasElement.prototype.toBlob = function (callback) {
      callback(new Blob(["geometry check"], { type: "image/png" }));
    };
    const results = [];
    try {
      for (const architecture of ["sovereign", "hybrid", "cloud"]) {
        for (const sensitivity of ["mixed", "private", "public"]) {
          for (const connected of [true, false]) {
            for (const allowPrivateEgress of [true, false]) {
              for (const format of ["portrait", "landscape"]) {
                texts = [];
                frames = [];
                const { record } = await create(
                  still,
                  { architecture, sensitivity, connected, allowPrivateEgress },
                  format,
                  location.origin + location.pathname,
                  "WWWWWWWWWWWWWWWWWWWWWWWW",
                  "field-report",
                );
                const stamp = texts.findIndex((line) => line.text === "FIELD REPORT / A HUMAN IN COMMAND.");
                const settings = texts.findIndex(
                  (line) => line.text === record.architecture + " / " + record.connection,
                );
                const frame = frames[1];
                results.push({
                  architecture,
                  sensitivity,
                  connected,
                  allowPrivateEgress,
                  format,
                  title: record.title,
                  frame,
                  headings: texts.slice(2, stamp + 1),
                  decision: texts.slice(stamp + 1, settings),
                  firstSetting: texts[settings],
                  summary: record.decision,
                  texts,
                });
              }
            }
          }
        }
      }
    } finally {
      CanvasRenderingContext2D.prototype.fillText = originalFill;
      CanvasRenderingContext2D.prototype.strokeRect = originalStroke;
      HTMLCanvasElement.prototype.toBlob = originalBlob;
    }
    return results;
  });
  assert.equal(results.length, 72);
  for (const result of results) {
    const label = JSON.stringify({
      architecture: result.architecture,
      sensitivity: result.sensitivity,
      connected: result.connected,
      allowPrivateEgress: result.allowPrivateEgress,
      format: result.format,
    });
    const width = result.format === "portrait" ? 1080 : 1600;
    assert.ok(
      result.headings.every((line) => line.bottom + 8 < result.frame.y),
      `title/frame overlap: ${label}`,
    );
    assert.equal(result.decision.map((line) => line.text).join(" "), result.summary, `missing decision copy: ${label}`);
    assert.ok(
      result.decision.every((line) => line.bottom + 8 < result.firstSetting.top),
      `decision/settings overlap: ${label}`,
    );
    assert.ok(
      result.decision.every((line) =>
        result.format === "portrait" ? line.top > result.frame.bottom : line.x > result.frame.right,
      ),
      `decision/frame overlap: ${label}`,
    );
    assert.ok(
      result.texts.every((line) => line.x >= 32 && line.right <= width - 32),
      `text exceeds card edges: ${label}`,
    );
  }
});
