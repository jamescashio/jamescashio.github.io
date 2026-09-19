import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";
import { preview } from "vite";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "artifacts", "quality");
const executablePath = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].find((candidate) => candidate && existsSync(candidate));
assert.ok(executablePath, "Install Chrome or set CHROME_PATH; this check never downloads a browser.");
assert.ok(existsSync(path.join(root, "dist", "index.html")), "Run npm run build first.");
await mkdir(output, { recursive: true });
const server = await preview({
  configFile: false,
  root,
  build: { outDir: "dist" },
  preview: { host: "127.0.0.1", port: 4189, strictPort: true, open: false },
});
const reports = [];
const routes = [
  { path: "/", name: "home-v38" },
  { path: "/?runtime=quality", name: "home-v37" },
  { path: "/cashio.html", name: "cashio" },
];
let browser;
try {
  browser = await chromium.launch({ executablePath, headless: true, chromiumSandbox: true });
  for (const width of [1440, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });
    try {
      for (const { path: route, name } of routes) {
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        const response = await page.goto(`http://127.0.0.1:4189${route}`, { waitUntil: "networkidle" });
        await page.evaluate(() => document.fonts.ready);
        const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
        const layout = await page.evaluate(() => ({
          viewport: innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          audibleMedia: [...document.querySelectorAll("audio, video")].filter(
            (media) => !media.paused && !media.muted && media.volume > 0,
          ).length,
        }));
        const blocking = result.violations.filter((violation) => ["serious", "critical"].includes(violation.impact));
        const passed =
          response?.ok() &&
          blocking.length === 0 &&
          errors.length === 0 &&
          layout.documentWidth <= width + 1 &&
          layout.audibleMedia === 0;
        reports.push({
          route,
          finalUrl: page.url(),
          width,
          status: response?.status(),
          passed,
          layout,
          errors,
          blocking: blocking.map((v) => v.id),
          violations: result.violations,
          incomplete: result.incomplete.map((v) => ({ id: v.id, description: v.description })),
        });
        console.log(
          `${passed ? "PASS" : "FAIL"} ${route} at ${width}px: ${blocking.length} serious/critical accessibility rules, ${errors.length} runtime errors`,
        );
        await page.screenshot({
          path: path.join(output, `${name}-${width}.png`),
          fullPage: true,
        });
        await page.close();
      }
    } finally {
      await context.close();
    }
  }
} finally {
  await browser?.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
  await writeFile(
    path.join(output, "accessibility.json"),
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        browser: executablePath,
        coverage:
          "Automated WCAG checks, overflow, runtime errors, and silent startup under reduced motion. Manual keyboard and screen-reader testing remain separate.",
        reports,
      },
      null,
      2,
    ) + "\n",
  );
}
assert.ok(
  reports.length === routes.length * 3 && reports.every((report) => report.passed),
  "Quality checks failed; inspect artifacts/quality/accessibility.json.",
);
