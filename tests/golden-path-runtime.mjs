import { test } from "node:test";
import assert from "node:assert/strict";
import { expect } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

export function registerGoldenPathChecks({ visit, audit, output }) {
  test("Studios shortcuts open their destination and survive a shared-address reload", async (t) => {
    for (const width of [1440, 390, 320]) {
      const page = await visit(t, {
        width,
        height: width === 320 ? 568 : 844,
        hash: "#studios",
        expandWorkbenches: false,
      });
      const films = page.getByRole("link", { name: "Watch a film", exact: false }).first();
      await expect(films).toBeInViewport({ ratio: 1 });
      await expect(page.getByRole("link", { name: "Explore a world", exact: false })).toBeInViewport({ ratio: 1 });
      await expect(page.locator(".zenith-library")).not.toHaveAttribute("open", "");
      await films.press("Enter");
      await expect(page.locator("#zenith-heading")).toBeFocused();
      const box = await page.locator("#zenith-heading").boundingBox();
      assert.ok(box.y >= 65 && box.y < 200, "film heading arrives beneath the shared header");
      await page.reload({ waitUntil: "networkidle" });
      await expect(page.locator("#studios")).toHaveAttribute("data-room-state", "ready");
      await expect(page.locator("#zenith-heading")).toBeFocused();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
      await audit(page, `golden-path-films-${width}`);
      await page.locator("#studios").screenshot({ path: path.join(output, `golden-path-studios-${width}.png`) });
    }
  });

  test("film title search reaches the exact silent film and restores the menu opener", async (t) => {
    const page = await visit(t, { width: 390, height: 844, hash: "#studios", expandWorkbenches: false });
    await page.locator("#mc-btn").press("Enter");
    for (const [title, id] of [
      ["Threshold", "zenith-threshold"],
      ["Armillary Nocturne", "zenith-armillary-nocturne"],
      ["The Long View", "zenith-the-long-view"],
      ["Lightwake", "lightwake"],
    ]) {
      await page.locator("#mc-search").fill(title);
      await expect(page.locator(`#mc-list a[href="#film=${id}"]`).first()).toBeVisible();
    }
    await page.locator("#mc-search").fill("Threshold");
    await page.locator('#mc-list a[href="#film=zenith-threshold"]').press("Enter");
    const film = page.locator('.lensing-film[data-clip="zenith-threshold"]');
    await expect(film).toBeVisible();
    assert.equal(await film.locator("video").evaluate((v) => v.paused && v.muted && !v.autoplay), true);
    await page.keyboard.press("Escape");
    await expect(page.locator("#mc-btn")).toBeFocused();
  });

  test("reading edition shortcuts stay on the Studios page without JavaScript", async (t) => {
    const page = await visit(t, { width: 390, height: 844, expandWorkbenches: false });
    const context = await page
      .context()
      .browser()
      .newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    t.after(() => context.close());
    const reading = await context.newPage();
    await reading.goto(new URL("/rooms/studios/", page.url()).href, { waitUntil: "networkidle" });
    for (const [name, id] of [
      ["Watch a film", "zenith-heading"],
      ["Explore a world", "studio-worlds"],
    ]) {
      await reading.getByRole("link", { name, exact: false }).first().press("Enter");
      await expect(reading.locator(`#${id}`)).toBeInViewport();
      assert.equal(new URL(reading.url()).pathname, "/rooms/studios/");
    }
    await audit(reading, "golden-path-reading-shortcuts");
  });

  test("Next film preserves expanded view, waits for Play and retains the original return", async (t) => {
    for (const [width, height] of [
      [1440, 900],
      [390, 844],
      [320, 568],
    ]) {
      const page = await visit(t, { width, height, hash: "#studios", expandWorkbenches: false });
      const opener = page.locator('.zenith-shelf .studio-card[href="#film=zenith-starship-blue-hour"]');
      await opener.press("Enter");
      const film = page.locator(".lensing-film");
      await expect(film).toBeVisible();
      await page.getByRole("button", { name: "Expand view", exact: true }).press("Enter");
      for (const [title, id] of [
        ["Armillary Nocturne", "zenith-armillary-nocturne"],
        ["Threshold", "zenith-threshold"],
        ["Starship Blue Hour", "zenith-starship-blue-hour"],
      ]) {
        const next = page.getByRole("button", { name: `Next film: ${title}`, exact: true });
        await expect(next).toBeInViewport({ ratio: 1 });
        await next.press("Enter");
        await expect(film).toHaveAttribute("data-clip", id);
        await expect(film).toHaveAttribute("data-expanded", "true");
        await expect(film).toHaveAttribute("data-playback", "still");
        await expect(page.getByRole("button", { name: "Play film", exact: true })).toBeFocused();
        assert.equal(new URL(page.url()).hash, `#film=${id}`);
        assert.equal(
          await film.locator("video").evaluate((v) => v.paused && v.muted && !v.loop && v.preload === "none"),
          true,
        );
        assert.equal(
          await film.evaluate(
            (panel) => panel.scrollHeight <= panel.clientHeight + 1 && panel.scrollWidth <= panel.clientWidth + 1,
          ),
          true,
        );
      }
      await audit(page, `golden-path-next-${width}`);
      await page.screenshot({ path: path.join(output, `golden-path-cinema-${width}.png`) });
      await page.keyboard.press("Escape");
      await expect(opener).toBeFocused();
    }
  });

  test("the downloaded brief matches selected records and disappears when those records change", async (t) => {
    const page = await visit(t, { width: 390, height: 844, hash: "#workshop", expandWorkbenches: false });
    const example = await page.request.get(new URL("/artifacts/decision-brief.txt", page.url()).href);
    assert.equal(example.status(), 200);
    const exampleText = await example.text();
    assert.match(exampleText, /September 26, 2026/);
    assert.match(exampleText, /remain unverified/);
    await page.getByRole("link", { name: "Make your brief", exact: false }).press("Enter");
    await expect(page.locator("#st-name")).toBeFocused();
    await page.locator('[data-fact="fleet"]').uncheck();
    await page.locator('[data-fact="routing"]').check();
    await page.locator('[data-fact="authority"]').check();
    await page.locator("[data-compose]").press("Enter");
    const downloadReady = page.waitForEvent("download");
    await page.locator("[data-save-brief]").press("Enter");
    const download = await downloadReady;
    assert.equal(download.suggestedFilename(), "cAshIo-decision-brief.txt");
    const file = path.join(output, "selected-decision-brief.txt");
    await download.saveAs(file);
    const saved = await fs.readFile(file, "utf8");
    assert.match(saved, /THE UNKNOWN[\s\S]*remain unverified/);
    assert.match(saved, /THE BOUNDARY[\s\S]*accountable person/);
    assert.doesNotMatch(saved, /THE OBSERVATION|containers|virtual machine/);
    await expect(page.locator("[data-brief-status]")).toHaveText("Your brief is ready to keep.");
    await audit(page, "golden-path-brief");
    await page.locator(".brief-output").screenshot({ path: path.join(output, "golden-path-brief.png") });
    await page.locator('[data-fact="routing"]').uncheck();
    await page.locator('[data-fact="authority"]').uncheck();
    await expect(page.locator("[data-compose]")).toBeDisabled();
    await expect(page.locator("[data-save-brief]")).toHaveCount(0);
  });
}
