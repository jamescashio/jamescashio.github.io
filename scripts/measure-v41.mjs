import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const label = process.argv[2] || "after",
  url = process.argv[3] || "http://127.0.0.1:4191/";
const out = new URL(`../artifacts/v41/${label}/`, import.meta.url);
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
try {
  for (const [width, height] of [
    [1440, 900],
    [3440, 1440],
    [390, 844],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      reducedMotion: "no-preference",
      hasTouch: width === 390,
      isMobile: width === 390,
    });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    const requests = new Map();
    const errors = [];
    cdp.on("Network.requestWillBeSent", (e) =>
      requests.set(e.requestId, { url: e.request.url, bytes: 0, type: e.type }),
    );
    cdp.on("Network.dataReceived", (e) => {
      const r = requests.get(e.requestId);
      if (r) r.bytes += e.encodedDataLength;
    });
    cdp.on("Network.loadingFinished", (e) => {
      const r = requests.get(e.requestId);
      if (r) r.bytes = Math.max(r.bytes, e.encodedDataLength);
    });
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(url, { waitUntil: "load" });
    await page.waitForTimeout(2000);
    const sum = (media) =>
      [...requests.values()].filter((r) => media || !/\.(mp4|webm)(\?|$)/.test(r.url)).reduce((n, r) => n + r.bytes, 0);
    const initialTotalBytes = sum(true),
      initialNonVideoBytes = sum(false);
    const hero = await page.locator("h1").boundingBox();
    const cta = await page.getByRole("link", { name: "Board the starship →", exact: true }).boundingBox();
    await page.screenshot({ path: fileURLToPath(new URL(`hero-${width}.png`, out)) });
    await page.waitForTimeout(2000);
    for (
      let y = 0;
      y < (await page.evaluate(() => document.documentElement.scrollHeight));
      y += Math.round(height * 0.8)
    ) {
      await page.evaluate((y) => scrollTo(0, y), y);
      await page.waitForTimeout(180);
    }
    await page.waitForTimeout(1500);
    results.push({
      width,
      height,
      initialTotalBytes,
      initialNonVideoBytes,
      scrollBytes: sum(true),
      videoRequests: [...requests.values()]
        .filter((r) => /\.(mp4|webm)(\?|$)/.test(r.url))
        .map((r) => ({ url: new URL(r.url).pathname, bytes: r.bytes })),
      hero,
      cta,
      overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      errors,
    });
    console.log(JSON.stringify(results.at(-1)));
    await context.close();
  }
} finally {
  await browser.close();
  await writeFile(
    new URL("transfer.json", out),
    JSON.stringify(
      {
        label,
        url,
        method:
          "Cold Chrome CDP encodedDataLength, cache disabled, 2 seconds after load, then 80 percent viewport steps every 180 ms and 1.5 second settling. Local server transport.",
        results,
      },
      null,
      2,
    ),
  );
}
