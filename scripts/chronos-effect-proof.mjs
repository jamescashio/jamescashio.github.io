import { chromium } from "@playwright/test";
import { mkdir, writeFile, rename } from "node:fs/promises";
import path from "node:path";

const [effect = "hero", output = `artifacts/chronos/effect-${effect}`] = process.argv.slice(2);
const base = process.env.V40_URL || "http://127.0.0.1:4392/";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
async function activity(page, width, releaseEnhancement) {
  if (effect === "hero") {
    releaseEnhancement();
    if (width >= 1000) await page.locator('[data-living-hero="ready"]').waitFor({ timeout: 15000 });
    await page.waitForTimeout(1200);
    for (let i = 0; i < 18; i++) {
      await page.mouse.move(width * (0.5 + Math.sin(i / 4) * 0.25), 300 + Math.cos(i / 4) * 140);
      await page.waitForTimeout(100);
    }
  } else if (effect === "worlds") {
    await page.locator(".atlas-destination:not([hidden]) .atlas-enter").click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(900);
    await page.goBack();
    await page.waitForLoadState("networkidle");
    if (effect === "instruments") await page.locator("#evidence").scrollIntoViewIfNeeded();
    if (effect === "edge") await page.locator(".workshop-highlight").first().scrollIntoViewIfNeeded();
    await page.locator("#top").waitFor();
    await page.waitForTimeout(1000);
  } else if (effect === "reveal") {
    for (let i = 0; i < 18; i++) {
      await page.mouse.wheel(0, 160);
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(1200);
  } else if (effect === "boarding") {
    await page.locator('a[href="#flight=board"]').first().click();
    await page.waitForTimeout(2200);
  } else if (effect === "cinema") {
    const card = page.locator(".film-library button[data-tilt]").first();
    if (width >= 1000) await card.hover();
    await page.waitForTimeout(4000);
  } else if (effect === "instruments") {
    releaseEnhancement();
    await page.waitForFunction(() => document.querySelector('#evidence [data-counted="1"]'));
    await page.waitForTimeout(3000);
  } else if (effect === "edge") {
    const card = page.locator(".workshop-highlight").first();
    if (width >= 1000) {
      const box = await card.boundingBox();
      for (let i = 0; i < 18; i++) {
        await page.mouse.move(box.x + box.width * (0.5 + Math.sin(i / 4) * 0.4), box.y + box.height / 2);
        await page.waitForTimeout(80);
      }
    }
    await page.waitForTimeout(1000);
  } else throw new Error(`Unknown effect ${effect}`);
}

try {
  // Recording is separate so video encoding cannot distort the performance trace.
  for (const [width, cpu, record] of [
    [1440, 1, false],
    [1440, 4, false],
    [390, 4, false],
    [1440, 1, true],
    [390, 4, true],
  ]) {
    const label = `${width}-${cpu}x${record ? "-recording" : ""}`;
    const context = await browser.newContext({
      viewport: { width, height: width === 390 ? 844 : 900 },
      isMobile: width === 390,
      hasTouch: width === 390,
      ...(record ? { recordVideo: { dir: output, size: { width, height: width === 390 ? 844 : 900 } } } : {}),
    });

    let releaseEnhancement = () => {};
    const enhancementGate = new Promise((resolve) => {
      releaseEnhancement = resolve;
    });
    if (effect === "hero")
      await context.route("**/living-hero-*.js", async (route) => {
        await enhancementGate;
        await route.continue();
      });
    if (effect === "instruments")
      await context.route("**/hud-*.js", async (route) => {
        await enhancementGate;
        await route.continue();
      });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpu });
    await page.goto(base, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.cashioV40);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(3500);
    if (effect === "worlds")
      await page.locator(".atlas-destination:not([hidden]) .atlas-enter").scrollIntoViewIfNeeded();
    if (effect === "cinema") {
      await page
        .locator(".film-library button[data-tilt]")
        .first()
        .evaluate((card) => {
          for (let node = card.parentElement; node; node = node.parentElement)
            if (node instanceof HTMLDetailsElement) node.open = true;
        });
      await page.locator(".film-library button[data-tilt]").first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(2000);
    }
    if (effect === "instruments") await page.locator("#evidence").scrollIntoViewIfNeeded();
    if (effect === "edge") await page.locator(".workshop-highlight").first().scrollIntoViewIfNeeded();
    await page.locator("#top").waitFor();
    await page.waitForTimeout(1000);
    if (!record)
      await cdp.send("Tracing.start", {
        categories:
          "devtools.timeline,v8,blink.user_timing,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.frame",
        transferMode: "ReturnAsStream",
      });
    let failure = null;
    try {
      await activity(page, width, releaseEnhancement);
    } catch (error) {
      failure = error.message;
    }
    const row = { effect, label, width, cpu, record, errors, failure };
    if (!record) {
      const finished = new Promise((resolve) => cdp.once("Tracing.tracingComplete", resolve));
      await cdp.send("Tracing.end");
      const { stream } = await finished;
      let data = "";
      for (;;) {
        const chunk = await cdp.send("IO.read", { handle: stream });
        data += chunk.data;
        if (chunk.eof) break;
      }
      await cdp.send("IO.close", { handle: stream });
      const events = JSON.parse(data).traceEvents;
      const frames = events
        .filter(
          (event) => event.name === "AnimationFrame" && event.ph === "b" && event.args?.animation_frame_timing_info,
        )
        .map((event) => ({ timestamp: event.ts, ...event.args.animation_frame_timing_info }));
      const limit = cpu === 1 ? 16.7 : 33;
      row.frameCount = frames.length;
      row.maxFrameMs = Math.max(0, ...frames.map((frame) => frame.duration_ms));
      row.limitMs = limit;
      row.exceedances = frames.filter((frame) => frame.duration_ms > limit);
      row.passed = !failure && !errors.length && frames.length > 0 && row.exceedances.length === 0;
      row.trace = `${label}-trace.json`;
      await writeFile(path.join(output, row.trace), data);
      await writeFile(path.join(output, `${label}-frames.json`), JSON.stringify(frames, null, 2));
    }
    await page.screenshot({ path: path.join(output, `${label}.png`) });
    const video = page.video();
    await context.close();
    if (video) {
      row.recording = `${label}.webm`;
      await rename(await video.path(), path.join(output, row.recording));
    }
    results.push(row);
    await writeFile(
      path.join(output, "summary.json"),
      JSON.stringify({ base, effect, browser: browser.version(), results }, null, 2),
    );
    console.log(JSON.stringify({ ...row, exceedances: row.exceedances?.length }));
  }
} finally {
  await browser.close();
}
if (results.some((row) => row.failure || row.errors.length || (!row.record && !row.passed))) process.exitCode = 1;
