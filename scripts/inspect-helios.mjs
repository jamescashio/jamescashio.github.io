import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs/promises";
import path from "node:path";

const output = path.resolve("../qa");
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const report = [];
for (const width of [1440, 768, 390, 320]) {
  const context = await browser.newContext({
    viewport: { width, height: width > 700 ? 1000 : 844 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const failed = [];
  page.on("response", (r) => {
    if (r.status() >= 400) failed.push([r.status(), r.url()]);
  });
  await page.goto("http://127.0.0.1:4388/v38/", { waitUntil: "networkidle" });
  const layout = await page.evaluate(() => ({
    width: innerWidth,
    document: document.documentElement.scrollWidth,
    overflow: [...document.querySelectorAll("main *")]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return (
          r.width > 0 &&
          (r.right > innerWidth + 1 || r.left < -1) &&
          getComputedStyle(el).position !== "absolute" &&
          el.tagName !== "svg" &&
          !el.closest("svg,.evidence-scroll,.engine")
        );
      })
      .map((el) => ({ tag: el.tagName, id: el.id, class: el.className, rect: el.getBoundingClientRect().toJSON() })),
  }));
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
    .analyze();
  await page.screenshot({ path: path.join(output, `home-${width}.png`) });
  const images = await page.evaluate(async () => {
    const items = [...document.images];
    items.forEach((x) => (x.loading = "eager"));
    await Promise.all(items.map((x) => x.decode().catch(() => {})));
    return items.map((x) => ({ src: x.getAttribute("src"), width: x.naturalWidth, height: x.naturalHeight }));
  });
  const studies = [];
  for (const id of ["hermes", "cascade", "exposure", "briefing", "dashboards", "signal", "graphify"]) {
    await page.locator(`#study-${id}`).click();
    await page.locator("#instrument").scrollIntoViewIfNeeded();
    const result = await new AxeBuilder({ page })
      .include("#instrument")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
      .analyze();
    studies.push({ id, violations: result.violations });
  }
  await page.screenshot({ path: path.join(output, `graphify-${width}.png`) });
  await page.locator("#mc-btn").click();
  const menu = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
    .analyze();
  await page.screenshot({ path: path.join(output, `menu-${width}.png`) });
  await page.keyboard.press("Escape");
  await page.goto("http://127.0.0.1:4388/v38/#flight=board");
  await page.locator(".first-flight[open]").waitFor();
  await page.locator(".ff-stage-ready,.ff-stage-fallback").waitFor({ timeout: 45000 });
  const flight = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
    .analyze();
  await page.screenshot({ path: path.join(output, `flight-${width}.png`) });
  report.push({
    width,
    layout,
    images,
    errors,
    failed,
    violations: axe.violations,
    studies,
    menu: menu.violations,
    flight: flight.violations,
  });
  await context.close();
  process.stdout.write(
    JSON.stringify({
      width,
      overflow: layout.overflow.length,
      errors,
      failed,
      violations: axe.violations.map((v) => ({ id: v.id, n: v.nodes.length })),
      studyViolations: studies
        .filter((s) => s.violations.length)
        .map((s) => ({ id: s.id, v: s.violations.map((v) => v.id) })),
      menu: menu.violations.map((v) => ({ id: v.id, n: v.nodes.length })),
      flight: flight.violations.map((v) => ({ id: v.id, n: v.nodes.length })),
    }) + "\n",
  );
}
await fs.writeFile(path.join(output, "inspection.json"), JSON.stringify(report, null, 2));
await browser.close();
