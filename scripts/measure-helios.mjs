import lighthouse from "lighthouse";
import desktopConfig from "lighthouse/core/config/desktop-config.js";
import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const output = path.resolve(process.env.HELIOS_PERF_DIR || "../qa/performance");
const url = process.env.HELIOS_URL || "http://127.0.0.1:4388/";
await fs.mkdir(output, { recursive: true });
const runs = Number(process.argv[2] || 1);
const mode = process.argv[3] === "desktop" ? "desktop" : "mobile";
const results = [];
for (let i = 0; i < runs; i++) {
  const chrome = await chromium.launch({ channel: "chrome", headless: true, args: ["--remote-debugging-port=4389"] });
  try {
    const result = await lighthouse(
      url,
      {
        port: 4389,
        output: ["json", "html"],
        logLevel: "error",
        onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      },
      mode === "desktop" ? desktopConfig : undefined,
    );
    await fs.writeFile(path.join(output, `${mode}-${i + 1}.json`), result.report[0]);
    await fs.writeFile(path.join(output, `${mode}-${i + 1}.html`), result.report[1]);
    const lhr = result.lhr;
    const data = {
      run: i + 1,
      url: lhr.finalDisplayedUrl,
      lighthouse: lhr.lighthouseVersion,
      fetchTime: lhr.fetchTime,
      categories: Object.fromEntries(Object.entries(lhr.categories).map(([key, value]) => [key, value.score * 100])),
      metrics: Object.fromEntries(
        [
          "first-contentful-paint",
          "largest-contentful-paint",
          "total-blocking-time",
          "cumulative-layout-shift",
          "speed-index",
        ].map((key) => [key, lhr.audits[key].numericValue]),
      ),
      opportunities: Object.entries(lhr.audits)
        .filter(([, v]) => v.score !== null && v.score < 1)
        .map(([id, v]) => ({ id, score: v.score, title: v.title, description: v.displayValue })),
    };
    results.push(data);
    process.stdout.write(JSON.stringify(data) + "\n");
  } finally {
    await chrome.close();
  }
}
await fs.writeFile(path.join(output, `summary-${mode}.json`), JSON.stringify(results, null, 2));
