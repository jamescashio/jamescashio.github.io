import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { chromium } from "@playwright/test";
import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";

const output = process.argv[2] || "artifacts/chronos/performance";
const url = process.env.V40_URL || "http://127.0.0.1:4392/";
const chromePath = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
await mkdir(output, { recursive: true });
const summary = { url, captured: new Date().toISOString(), runs: {}, medians: {} };
const median = (values) => values.toSorted((a, b) => a - b)[Math.floor(values.length / 2)];
const html = await readFile(path.join(process.env.CHRONOS_DIST || "dist", "index.html"), "utf8");
summary.initialCssGzipBytes = [...html.matchAll(/<style data-v42-styles="[^"]+">([\s\S]*?)<\/style>/g)].reduce(
  (sum, match) => sum + gzipSync(match[1]).length,
  0,
);

const browser = await chromium.launch({ executablePath: chromePath, headless: true });
try {
  for (const [label, width, height, rate] of [
    ["desktop", 1350, 940, 1],
    ["phone", 390, 844, 4],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      isMobile: label === "phone",
      hasTouch: label === "phone",
    });
    const page = await context.newPage();
    const session = await context.newCDPSession(page);
    await page.addInitScript(() => {
      window.chronosMetrics = { shifts: [], tasks: [] };
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries())
          if (!entry.hadRecentInput) window.chronosMetrics.shifts.push({ start: entry.startTime, value: entry.value });
      }).observe({ type: "layout-shift", buffered: true });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries())
          window.chronosMetrics.tasks.push({ start: entry.startTime, duration: entry.duration });
      }).observe({ type: "longtask", buffered: true });
    });
    await session.send("Emulation.setCPUThrottlingRate", { rate });
    await session.send("Tracing.start", {
      categories:
        "devtools.timeline,v8,blink.user_timing,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.frame",
      transferMode: "ReturnAsStream",
    });
    await page.goto(url);
    await page.waitForTimeout(6000);
    const metrics = await page.evaluate(() => ({
      ...window.chronosMetrics,
      height: document.documentElement.scrollHeight,
      width: document.documentElement.scrollWidth,
    }));
    // CLS uses the standard session window: at most five seconds with one second gaps.
    let score = 0,
      current = 0,
      first = 0,
      previous = 0;
    for (const shift of metrics.shifts) {
      if (shift.start - previous > 1000 || shift.start - first > 5000) {
        current = 0;
        first = shift.start;
      }
      current += shift.value;
      previous = shift.start;
      score = Math.max(score, current);
    }
    summary[label] = { ...metrics, cls: score, cpuRate: rate };
    const completed = new Promise((resolve) => session.once("Tracing.tracingComplete", resolve));
    await session.send("Tracing.end");
    const { stream } = await completed;
    let trace = "";
    while (true) {
      const chunk = await session.send("IO.read", { handle: stream });
      trace += chunk.data;
      if (chunk.eof) break;
    }
    await session.send("IO.close", { handle: stream });
    await writeFile(path.join(output, `${label}-startup-trace.json`), trace);
    await context.close();
  }
} finally {
  await browser.close();
}
for (const device of ["mobile", "desktop"]) {
  summary.runs[device] = [];
  for (let index = 1; index <= 5; index++) {
    const userDataDir = path.resolve(output, `profile-${device}-${index}-${Date.now()}`);
    await mkdir(userDataDir, { recursive: true });
    const chrome = await launch({
      chromePath,
      userDataDir,
      chromeFlags: ["--headless=new", "--no-first-run", "--disable-extensions", "--disable-background-networking"],
    });
    try {
      const settings =
        device === "desktop"
          ? {
              formFactor: "desktop",
              screenEmulation: { mobile: false, width: 1440, height: 900, deviceScaleFactor: 1, disabled: false },
              throttling: {
                rttMs: 40,
                throughputKbps: 10240,
                cpuSlowdownMultiplier: 1,
                requestLatencyMs: 0,
                downloadThroughputKbps: 0,
                uploadThroughputKbps: 0,
              },
            }
          : {
              formFactor: "mobile",
              screenEmulation: { mobile: true, width: 390, height: 844, deviceScaleFactor: 1, disabled: false },
            };
      const { lhr, report } = await lighthouse(
        url,
        {
          port: chrome.port,
          output: "json",
          logLevel: "error",
          onlyCategories: ["performance", "accessibility", "best-practices"],
          maxWaitForLoad: 45000,
        },
        { extends: "lighthouse:default", settings },
      );
      await writeFile(path.join(output, `${device}-${index}.json`), report);
      const row = {
        performance: Math.round(lhr.categories.performance.score * 100),
        accessibility: Math.round(lhr.categories.accessibility.score * 100),
        bestPractices: Math.round(lhr.categories["best-practices"].score * 100),
        lcp: lhr.audits["largest-contentful-paint"].numericValue,
        tbt: lhr.audits["total-blocking-time"].numericValue,
        cls: lhr.audits["cumulative-layout-shift"].numericValue,
      };
      summary.runs[device].push(row);
      await writeFile(path.join(output, "summary.json"), JSON.stringify(summary, null, 2));
      console.log(JSON.stringify({ device, index, ...row }));
    } finally {
      await chrome.kill();
    }
  }
  summary.medians[device] = Object.fromEntries(
    Object.keys(summary.runs[device][0]).map((key) => [key, median(summary.runs[device].map((row) => row[key]))]),
  );
}
await writeFile(path.join(output, "summary.json"), JSON.stringify(summary, null, 2));
console.log(
  JSON.stringify({
    medians: summary.medians,
    cssGzip: summary.initialCssGzipBytes,
    cls: summary.desktop.cls,
    phoneHeight: summary.phone.height,
  }),
);
