import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const out = new URL("../artifacts/v41/lighthouse/", import.meta.url);
await mkdir(out, { recursive: true });
const runs = Number(process.argv[2] || 3),
  results = [];
for (const [width, height] of [
  [1440, 900],
  [3440, 1440],
  [390, 844],
].filter(([w]) => !process.argv[3] || w === Number(process.argv[3])))
  for (let run = 1; run <= runs; run++) {
    const profile = new URL(`../artifacts/v41/lighthouse-profile-${width}-${run}/`, import.meta.url);
    await mkdir(profile, { recursive: true });
    const chrome = await launch({
      ...(process.env.CHROME_PATH ? { chromePath: process.env.CHROME_PATH } : {}),
      userDataDir: fileURLToPath(profile),
      chromeFlags: ["--headless", "--disable-gpu"],
      logLevel: "silent",
    });
    try {
      const result = await lighthouse(process.env.V41_URL || "http://127.0.0.1:4191/", {
        port: chrome.port,
        output: ["json", "html"],
        logLevel: "error",
        onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
        formFactor: width === 390 ? "mobile" : "desktop",
        screenEmulation: { mobile: width === 390, width, height, deviceScaleFactor: 1, disabled: false },
        ...(width === 390
          ? {}
          : {
              throttling: {
                rttMs: 40,
                throughputKbps: 10240,
                cpuSlowdownMultiplier: 1,
                requestLatencyMs: 0,
                downloadThroughputKbps: 0,
                uploadThroughputKbps: 0,
              },
            }),
      });
      await writeFile(new URL(`${width}-${run}.json`, out), result.report[0]);
      await writeFile(new URL(`${width}-${run}.html`, out), result.report[1]);
      const lhr = result.lhr;
      const summary = {
        width,
        height,
        run,
        scores: Object.fromEntries(Object.entries(lhr.categories).map(([k, v]) => [k, Math.round(v.score * 100)])),
        metrics: Object.fromEntries(
          [
            "first-contentful-paint",
            "largest-contentful-paint",
            "total-blocking-time",
            "cumulative-layout-shift",
            "speed-index",
          ].map((k) => [k, lhr.audits[k].numericValue]),
        ),
        warnings: lhr.runWarnings,
        improvements: Object.values(lhr.audits)
          .filter((a) => a.score !== null && a.score < 0.9)
          .map((a) => ({ id: a.id, title: a.title, displayValue: a.displayValue })),
      };
      results.push(summary);
      console.log(
        JSON.stringify({
          ...summary,
          improvements: summary.improvements.map(({ id, title, displayValue }) => ({ id, title, displayValue })),
        }),
      );
    } finally {
      await chrome.kill();
    }
    await writeFile(new URL("summary.json", out), JSON.stringify(results, null, 2));
  }
