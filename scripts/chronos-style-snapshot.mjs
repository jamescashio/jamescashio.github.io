import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

// Compare the same composed rest frame, including offscreen and closed content.
// Animated phases are sampled at time zero; finite entrances are completed.
const [mode = "capture", destination = "artifacts/chronos/styles", other] = process.argv.slice(2);
if (mode === "diff") {
  const before = JSON.parse(await readFile(path.join(destination, "snapshot.json"), "utf8"));
  const after = JSON.parse(await readFile(path.join(other, "snapshot.json"), "utf8"));
  const differences = [];
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    const a = before[key];
    const b = after[key];
    if (!a || !b) differences.push({ key, missing: !a ? "baseline" : "candidate" });
    else if (JSON.stringify(a) !== JSON.stringify(b)) {
      for (let i = 0; i < Math.max(a.elements.length, b.elements.length); i++) {
        const left = a.elements[i];
        const right = b.elements[i];
        if (JSON.stringify(left) === JSON.stringify(right)) continue;
        differences.push({ key, element: i, before: left, after: right });
      }
      if (a.height !== b.height || a.width !== b.width)
        differences.push({ key, before: [a.width, a.height], after: [b.width, b.height] });
    }
  }
  await writeFile(path.join(other, "diff.json"), JSON.stringify(differences, null, 2));
  console.log(JSON.stringify({ cases: Object.keys(after).length, differences: differences.length }));
  assert.equal(differences.length, 0, "computed style snapshot differences");
} else {
  const browser = await chromium.launch({
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" }),
    headless: true,
  });
  const result = {};
  const base = process.env.V40_URL || "http://127.0.0.1:4392/";
  const routes = ["", ...["starship", "principles", "studios", "heritage"].map((id) => `rooms/${id}/interactive/`)];
  await mkdir(destination, { recursive: true });
  try {
    for (const route of routes) {
      for (const width of [320, 390, 834, 1440, 3440]) {
        for (const motion of ["no-preference", "reduce"]) {
          const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: motion });
          const page = await context.newPage();
          await page.clock.install({ time: new Date("2026-11-02T18:00:00Z") });
          await page.clock.pauseAt(new Date("2026-11-02T18:00:01Z"));
          const errors = [];
          page.on("pageerror", (error) => errors.push(error.message));
          await page.goto(new URL(route, base).href);
          await page.clock.runFor(100);
          await page.waitForFunction(() => window.cashioV40 || document.querySelector('[data-room-state="ready"]'));
          await page.evaluate(() => document.fonts.ready);
          await page.waitForLoadState("networkidle");
          await page.clock.runFor(3000);
          await page.evaluate(() => {
            document.querySelectorAll("[data-reveal]").forEach((element) => window.cashioV40?.reveal(element));
            document.querySelectorAll("video").forEach((video) => video.pause());
            document.getAnimations().forEach((animation) => {
              const timing = animation.effect.getComputedTiming();
              animation.pause();
              animation.currentTime = Number.isFinite(timing.endTime) ? timing.endTime : 0;
            });
          });
          await page.clock.runFor(1600);
          const key = `${route || "home"}|${width}|${motion}`;
          result[key] = await page.evaluate(() => {
            const root = document.querySelector("#v40-root") || document.body;
            const relevant =
              /^(display|position|box-sizing|width|height|min-width|min-height|max-width|max-height|margin-(top|right|bottom|left)|padding-(top|right|bottom|left)|border-(top|right|bottom|left)-(width|color|style)|border-radius|top|right|bottom|left|gap|row-gap|column-gap|grid-template-columns|grid-template-rows|grid-column|grid-row|flex|flex-direction|flex-wrap|align-items|justify-content|order|overflow-x|overflow-y|color|background-color|background-image|font-family|font-size|font-weight|font-style|line-height|letter-spacing|text-align|text-transform|text-shadow|white-space|word-break|transform|transform-origin|translate|rotate|scale|opacity|filter|visibility|z-index|object-fit|object-position|perspective|content-visibility|contain-intrinsic-size)$/;
            const elements = [root, ...root.querySelectorAll("*")].map((element) => {
              const style = getComputedStyle(element);
              const values = {};
              for (const property of [...style].filter((name) => relevant.test(name)).sort())
                values[property] = style.getPropertyValue(property);
              return { tag: element.tagName, id: element.id, class: element.getAttribute("class"), values };
            });
            return {
              width: document.documentElement.scrollWidth,
              height: document.documentElement.scrollHeight,
              elements,
            };
          });
          assert.deepEqual(errors, [], key);
          console.log(`${key}: ${result[key].elements.length} elements`);
          await context.close();
        }
      }
    }
    await writeFile(path.join(destination, "snapshot.json"), JSON.stringify(result));
    await writeFile(
      path.join(destination, "method.json"),
      JSON.stringify(
        {
          browser: browser.version(),
          routes,
          widths: [320, 390, 834, 1440, 3440],
          height: 900,
          motion: ["no-preference", "reduce"],
          state: "At rest, entrances complete; infinite CSS animations at time zero; closed disclosures retained",
          base,
        },
        null,
        2,
      ),
    );
  } finally {
    await browser.close();
  }
}
