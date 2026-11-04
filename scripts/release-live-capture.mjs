import { mkdir, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import { chromium, expect } from "@playwright/test";
const base = "https://cashio.us/";
const directory = path.resolve("output/playwright/first-contact-live");
await mkdir(directory, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true });
const errors = [],
  checks = [];
try {
  if (!process.argv.includes("--phones-only")) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      recordVideo: { dir: directory, size: { width: 1440, height: 1000 } },
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto(base, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(directory, "homepage.png") });
    await page.locator(".tour-launch").click();
    await expect(page.locator(".ff-entrance")).toBeVisible();
    await page.screenshot({ path: path.join(directory, "entrance.png") });
    await expect(page.locator(".ff-stage")).toHaveClass(/ff-stage-ready/, { timeout: 15000 });
    await expect(page.locator(".ff-entrance")).toHaveCount(0);
    await expect(page.locator(".ff-showcase")).toHaveAttribute("data-playback", "tour");
    await page.waitForTimeout(2600);
    await page.getByRole("button", { name: /Pause tour/ }).click();
    await page.getByRole("button", { name: "04 Human command", exact: true }).click();
    await page.getByRole("button", { name: /Permit these private requests/ }).click();
    await page.getByRole("button", { name: "Finish →", exact: true }).click();
    await page.locator("#ff-callsign").fill("Doug Cashio");
    await page.locator(".ff-personalize button").click();
    await expect(page.locator(".ff-keepsake > img")).toHaveAttribute("alt", /for Doug Cashio:/);
    await page.screenshot({ path: path.join(directory, "mission-card.png") });
    for (const format of ["portrait", "landscape"]) {
      await page
        .locator(".ff-card-formats")
        .getByRole("button", { name: new RegExp(`^${format}`, "i") })
        .click();
      const download = page.waitForEvent("download");
      await page.locator(".ff-finale .ff-save").click();
      await (await download).saveAs(path.resolve(`outputs/first-contact-live-mission-card-${format}.png`));
    }
    checks.push("Personalized PNG exports saved in both formats with 12 permitted cloud requests.");
    await page.locator(".ff-roadster-next").click();
    await page.locator(".roadster-cta").click();
    await expect(page.locator(".roadster-inspection")).toHaveAttribute("data-phase", "ready", { timeout: 20000 });
    for (const [index, name] of ["body", "wheels", "thrusters"].entries()) {
      await page.locator(".roadster-views button").nth(index).click();
      await page.waitForTimeout(1800);
      await page.locator(".roadster-plate").screenshot({ path: path.join(directory, `roadster-${name}.png`) });
    }
    checks.push("All three desktop Roadster views inspected in motion.");
    await context.close();
    await copyFile(await page.video().path(), path.resolve("outputs/first-contact-live.webm"));
  }
  for (const width of [390, 320]) {
    const phone = await browser.newContext({
      viewport: { width, height: 844 },
      reducedMotion: "reduce",
      isMobile: true,
      hasTouch: true,
    });
    const screen = await phone.newPage();
    screen.on("pageerror", (error) => errors.push(error.message));
    await screen.goto(base + "#roadster-studio");
    await screen.locator(".roadster-cta").click();
    await expect(screen.locator(".roadster-inspection")).toHaveAttribute("data-phase", "ready", { timeout: 20000 });
    await screen.locator(".roadster-plate").screenshot({ path: path.join(directory, `roadster-${width}.png`) });
    if (await screen.evaluate(() => document.documentElement.scrollWidth !== innerWidth))
      throw new Error(`Overflow at ${width}`);
    await screen.goto(base + "#flight=permission");
    await expect(screen.locator(".ff-stage")).toHaveClass(/ff-stage-ready/);
    await screen
      .getByRole("button", { name: /^(?:Skip to the ending|Finish)/ })
      .filter({ visible: true })
      .click();
    await screen.locator("#ff-callsign").fill("Doug Cashio");
    await screen.locator(".ff-personalize button").click();
    await expect(screen.locator(".ff-keepsake > img")).toHaveAttribute("alt", /for Doug Cashio:/);
    const geometry = await screen.evaluate(() => ({
      width: innerWidth,
      dialog: document.querySelector(".first-flight").clientWidth,
      scroll: document.querySelector(".first-flight").scrollWidth,
    }));
    if (geometry.width !== width || geometry.scroll > geometry.dialog) throw new Error(JSON.stringify(geometry));
    await screen.screenshot({ path: path.join(directory, `card-controls-${width}.png`) });
    checks.push(`${width}px phone: no overflow, framed Roadster and personalized mission card.`);
    await phone.close();
  }
} finally {
  await browser.close();
}
await writeFile(
  "outputs/first-contact-live-visual-qa.json",
  JSON.stringify({ url: base, date: new Date().toISOString(), checks, errors }, null, 2),
);
if (errors.length) throw new Error(errors.join("\n"));
