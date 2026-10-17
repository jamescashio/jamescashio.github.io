import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const url = process.env.V40_URL;
let browser;
before(async () => {
  browser = await chromium.launch({
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" }),
    headless: true,
  });
});
after(async () => {
  await browser?.close();
});
async function visit(t, { width = 1440, motion = "reduce", hash = "", js = true } = {}) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    reducedMotion: motion,
    javaScriptEnabled: js,
    acceptDownloads: true,
  });
  const page = await context.newPage();
  const errors = [],
    broken = [],
    external = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("response", (r) => {
    if (r.status() >= 400) broken.push(r.url());
  });
  page.on("request", (r) => {
    if (/^https?:/.test(r.url()) && new URL(r.url()).origin !== new URL(url).origin) external.push(r.url());
  });
  t.after(async () => {
    await context.close();
    assert.deepEqual(errors, [], "no runtime or CSP errors");
    assert.deepEqual(broken, [], "all resources load");
    assert.deepEqual(external, [], "the experience and experiments stay on the same origin");
  });
  await page.goto(url + hash);
  if (js) await expect(page.locator("#bit-dialog")).toBeAttached();
  await expect(page.locator("#v40-root h1")).toBeVisible();
  return page;
}
async function audit(page, selector) {
  let builder = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"]);
  if (selector) builder = builder.include(selector);
  const { violations } = await builder.analyze();
  assert.deepEqual(
    violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
    [],
  );
}

test("The Sovereign waits for a click, fits every screen, and stops when dismissed or offscreen", async () => {
  for (const width of [320, 390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    try {
      const page = await context.newPage();
      const errors = [];
      let playerRequests = 0;
      page.on("pageerror", (error) => errors.push(error.message));
      await page.route("https://www.youtube-nocookie.com/**", async (route) => {
        playerRequests++;
        await route.fulfill({
          contentType: "text/html",
          body: "<title>Test player</title><p>Player loaded after consent.</p>",
        });
      });
      await page.goto(url + "#ai-worm");
      await expect(page.locator("#bit-dialog")).toBeAttached();
      const film = page.locator("#ai-worm");
      const play = film.getByRole("button", { name: "Play The Sovereign, version 9", exact: true });
      await expect(play).toBeVisible();
      assert.equal(playerRequests, 0, "no YouTube request before a visitor chooses Play");
      await expect(film.locator("iframe")).toHaveCount(0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
      await audit(page, "#ai-worm");
      await play.focus();
      await page.keyboard.press("Enter");
      await expect(film.locator("iframe")).toHaveAttribute("src", /youtube-nocookie\.com\/embed\/382mPi4ON60\?/);
      await expect.poll(() => playerRequests).toBe(1);
      await film.getByRole("button", { name: "Close player ×", exact: true }).click();
      await expect(film.locator("iframe")).toHaveCount(0);
      await expect(play).toBeFocused();
      await play.click();
      await expect(film.locator("iframe")).toHaveCount(1);
      await page.locator("#top").scrollIntoViewIfNeeded();
      await expect(film.locator("iframe")).toHaveCount(0);
      assert.deepEqual(errors, []);
    } finally {
      await context.close();
    }
  }
});

test("V40 preserves its content and serves a readable edition without JavaScript", async (t) => {
  for (const { js, width } of [
    { js: true, width: 390 },
    { js: false, width: 390 },
    { js: false, width: 320 },
  ]) {
    const page = await visit(t, { js, width });
    await expect(page.locator("main > section")).toHaveCount(11);
    await expect(page.locator("h1")).toHaveText("The machines can think. You still decide.");
    await expect(page.locator("footer")).toContainText("two releases short of the answer", { ignoreCase: true });
    await expect(page.locator('#contact a[href^="mailto:doug@cashio.us"]').first()).toBeVisible();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
  }
});

test("Bit is keyboard accessible, funny, bounded, and responsive", async (t) => {
  for (const width of [320, 390, 1440]) {
    const page = await visit(t, { width });
    const launch = page.locator("header [data-bit-open]");
    await launch.click();
    const dialog = page.locator("#bit-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("[data-bit-close]")).toBeFocused();
    await dialog.getByRole("button", { name: "Who is in command?", exact: true }).click();
    await expect(dialog).toContainText("enthusiastic polyhedron");
    await expect(dialog).toHaveAttribute("data-mood", "yes");
    await dialog.getByRole("button", { name: "Is the answer 42?", exact: true }).click();
    await expect(dialog).toContainText("BIT / LORE");
    await dialog.getByRole("button", { name: "May private data leave?", exact: true }).click();
    await expect(dialog).toContainText("human review");
    await expect(dialog).toHaveAttribute("data-mood", "no");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    await audit(page, "#bit-dialog");
    await page.keyboard.press("Escape");
    await expect(launch).toBeFocused();
    await launch.click();
    await dialog.getByRole("button", { name: "Take the controls →", exact: true }).click();
    await expect(page.locator("#studies")).toBeFocused();
    await expect(dialog).not.toBeVisible();
  }
});

test("Device and explicit motion preferences keep Bit and ambient films still", async (t) => {
  for (const motion of ["reduce", "no-preference"]) {
    const page = await visit(t, { motion });
    if (motion === "no-preference") await page.locator("header [data-motion-toggle]").click();
    await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
    await page.waitForTimeout(150);
    const canvas = page.locator("header [data-bit-portrait] canvas");
    const frame = await canvas.evaluate((c) => c.toDataURL());
    await page.waitForTimeout(250);
    assert.equal(await canvas.evaluate((c) => c.toDataURL()), frame);
    assert.equal(await page.locator("video").evaluateAll((vs) => vs.every((v) => v.muted && v.paused)), true);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
  }
});

test("Mission Control searches chapters and closes with a usable focus destination", async (t) => {
  const page = await visit(t, { width: 320 });
  await page.keyboard.press("Control+k");
  const dialog = page.locator("#mission-dialog");
  await expect(dialog).toBeVisible();
  await dialog.locator("input").fill("nobody matches this");
  await expect(dialog.locator(".mission-empty")).toBeVisible();
  await dialog.locator("input").fill("Seven");
  await dialog.locator("[data-chapter]:visible").click();
  await expect(page).toHaveURL(/#studies$/);
  await expect(dialog).not.toBeVisible();
});

test("Private inputs override the routing demonstration", async (t) => {
  const page = await visit(t);
  const studies = page.locator("#studies");
  await studies.getByRole("button", { name: "Analyze", exact: true }).click();
  await studies.getByRole("button", { name: "Requires attributable sources", exact: true }).click();
  await studies.getByRole("button", { name: "Route this request", exact: true }).click();
  await expect(studies.getByRole("heading", { name: "Sourced research", exact: true })).toBeVisible();
  await studies.getByRole("button", { name: "Contains private information", exact: true }).click();
  await studies.getByRole("button", { name: "Route this request", exact: true }).click();
  await expect(studies.getByRole("heading", { name: "Human review", exact: true })).toBeVisible();
});

test("Briefing treats markup as text and downloads the visitor's actual brief", async (t) => {
  const page = await visit(t);
  await page.locator('[role="tab"]').nth(3).click();
  await page.locator("#lab-observed").fill('<img src=x onerror="window.injected=true"> is an observation.');
  await page.locator("#lab-source").fill("Example, 10-05-2026");
  await page.getByRole("button", { name: "Build my brief →", exact: true }).click();
  await expect(page.locator(".lab-brief")).toContainText("<img");
  assert.equal(await page.evaluate(() => Boolean(window.injected)), false);
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download .txt ↓", exact: true }).click();
  const download = await pending;
  assert.match(await readFile(await download.path(), "utf8"), /Example, 10-05-2026/);
});

test("Every experiment remains usable on narrow phones", async (t) => {
  const page = await visit(t, { width: 320 });
  for (let i = 0; i < 7; i++) {
    await page.locator('[role="tab"]').nth(i).click();
    await expect(page.locator('[role="tab"]').nth(i)).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#experiment-panel")).toBeVisible();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 320);
    await audit(page, "#studies");
  }
});

test("Shared scenarios restore the human-review boundary", async (t) => {
  const page = await visit(t, { hash: "#experiment=cascade&confidence=99&consequence=true" });
  await expect(page.locator("#lab-confidence")).toHaveValue("99");
  await expect(page.getByLabel("The action would be difficult to undo", { exact: true })).toBeChecked();
  await expect(page.locator(".lab-result h4")).toContainText("person");
});

test("Shared scenarios reject inherited keys while restoring valid bounded values", async (t) => {
  for (const name of ["__proto__", "constructor", "toString"]) {
    const page = await visit(t, { hash: `#experiment=${name}&polluted=true&confidence=99` });
    await expect(page.locator('[role="tab"]').first()).toHaveAttribute("aria-selected", "true");
    assert.equal(await page.evaluate(() => Object.hasOwn(Object.prototype, "polluted")), false);
  }
  const page = await visit(t, {
    hash: "#experiment=cascade&confidence=999&consequence=true&__proto__=true&constructor=true&polluted=true",
  });
  await expect(page.locator("#lab-confidence")).toHaveValue("100");
  await expect(page.getByLabel("The action would be difficult to undo", { exact: true })).toBeChecked();
  await expect(page.locator(".lab-result h4")).toContainText("person");
  await page.getByRole("button", { name: "Reset this example", exact: true }).click();
  await expect(page.locator("#lab-confidence")).toHaveValue("85");
  await expect(page.getByLabel("The action would be difficult to undo", { exact: true })).not.toBeChecked();
  assert.equal(await page.evaluate(() => Object.hasOwn(Object.prototype, "polluted")), false);
});

test("Experience bookmarks stay in V40 and explicit version archives stay available", async (t) => {
  const page = await visit(t);
  for (const [relative, pathname, hash] of [
    ["/#build=hermes", "/", "#experiment=hermes"],
    ["/#flight=board", "/", "#flight=board"],
    ["/#lensing", "/", "#lensing"],
    ["/#glossary", "/", "#workshop"],
    ["/#atlas-inspection", "/", "#universe"],
    ["/#request-journey", "/", "#universe"],
    ["/v40/#contact", "/", "#contact"],
    ["/#deck=eve", "/command-deck.html", "#deck=eve"],
  ]) {
    await page.goto(new URL(relative, url).href);
    await expect.poll(() => new URL(page.url()).pathname).toBe(pathname);
    if (hash.includes("=")) {
      // Preserved scenarios can append their defaults after restoring a shared selection.
      for (const [key, value] of new URLSearchParams(hash.slice(1)))
        await expect.poll(() => new URLSearchParams(new URL(page.url()).hash.slice(1)).get(key)).toBe(value);
    } else {
      await expect.poll(() => new URL(page.url()).hash).toBe(hash);
    }
    if (["#workshop", "#universe"].includes(hash)) await expect(page.locator(hash)).toBeVisible();
  }
});

test("Boarding, reload, Back and closing a scene keep visitors in V40", async (t) => {
  for (const width of [1440, 390, 320]) {
    const page = await visit(t, { width });
    const board = page.locator('a[href="#flight=board"]').first();
    await board.click();
    await expect(page.locator("#helios-flight dialog")).toBeVisible();
    if (width === 390) await audit(page, "#helios-flight");
    assert.equal(new URL(page.url()).pathname, "/");
    assert.equal(new URL(page.url()).hash, "#flight=board");
    await page.reload();
    await expect(page.locator("#helios-flight dialog")).toBeVisible();
    assert.equal(new URL(page.url()).pathname, "/");
    await page.keyboard.press("Escape");
    await expect(page.locator("#helios-flight")).toHaveCount(0);
    await expect(page.locator("#v40-root")).not.toHaveAttribute("inert");
    await page.locator('a[href="#signature"]').click();
    await expect(page.locator("#helios-studio .brand-studio")).toBeVisible();
    if (width === 390) await audit(page, "#helios-studio");
    assert.equal(new URL(page.url()).pathname, "/");
    await page.goBack();
    await expect(page.locator("#helios-studio")).toHaveCount(0);
    await expect(page.locator("#v40-root")).not.toHaveAttribute("inert");
    await page.locator('a[href="#experiment=briefing"]').first().click();
    await expect(page.locator("#local-experiment")).toHaveAttribute("data-lab", "briefing");
    assert.equal(new URL(page.url()).pathname, "/");
  }
});

test("Every current room works and its return links lead to the V40 homepage", async (t) => {
  for (const width of [1440, 390, 320]) {
    const page = await visit(t, { width });
    for (const id of ["starship", "principles", "studios", "heritage"]) {
      await page.goto(new URL(`/rooms/${id}/interactive/`, url).href);
      await expect(page.locator(`#${id}`)).toHaveAttribute("data-room-state", "ready");
      if (width === 390) await audit(page);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
      await expect(page.locator('a[href^="/v39/"]')).toHaveCount(0);
      if (id === "starship") {
        await page.locator("#tg-net").click();
        await expect(page.locator("#tg-net")).toHaveAttribute("aria-pressed", "false");
        await expect(page.locator("#net-label")).toHaveText("Offline");
      }
      if (id === "principles") {
        await page.locator('[data-pr="1"]').click();
        await expect(page.locator("#pr-n")).toHaveText("02");
        await expect(page.locator("#engine")).toHaveAttribute("tabindex", "0");
      }
      if (id === "heritage") {
        const before = await page.locator("#hg-head").textContent();
        await page.locator("button[data-pilot]").nth(1).click();
        await expect(page.locator("#hg-head")).not.toHaveText(before);
      }
      await page.locator('header a[href="/#rooms"]').click();
      await expect(page.locator("#v40-root h1")).toBeVisible();
      assert.equal(new URL(page.url()).pathname, "/");
      assert.equal(new URL(page.url()).hash, "#rooms");
    }
    await page.goto(new URL("/rooms/studios/", url).href);
    await page.locator('header a[href="/#rooms"]').click();
    await expect(page.locator("#v40-root h1")).toBeVisible();
    assert.equal(new URL(page.url()).pathname, "/");
  }
});

test("A completed flight brings the requested V40 contact section into view and focus", async (t) => {
  const page = await visit(t, { hash: "#flight=permission" });
  await expect(page.locator("#helios-flight dialog")).toBeVisible();
  await page.getByRole("button", { name: /^Finish/ }).click();
  await page.getByRole("button", { name: /^Compare notes with Doug/ }).click();
  await expect(page.locator("#helios-flight")).toHaveCount(0);
  await expect(page.locator("#contact")).toBeInViewport();
  await expect(page.locator("#contact")).toBeFocused();
  assert.equal(new URL(page.url()).pathname, "/");
});

test("Closing a follow-on film does not leave a closed scene in Back history", async (t) => {
  const page = await visit(t);
  await page.locator('a[href="#signature"]').click();
  await expect(page.locator(".brand-studio")).toBeVisible();
  await page.getByRole("button", { name: /Watch the signature awaken/ }).click();
  await expect(page.locator(".lensing-film")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#helios-studio")).toHaveCount(0);
  await page.goBack();
  await expect(page.locator("#helios-studio")).toHaveCount(0);
  await expect(page.locator("#v40-root h1")).toBeVisible();
});

test("Room motion respects the homepage's saved pause and can be changed locally", async (t) => {
  const page = await visit(t, { motion: "no-preference", width: 390 });
  await page.getByRole("button", { name: "Pause motion", exact: true }).first().click();
  await page.goto(new URL("/rooms/starship/interactive/", url).href);
  await expect(page.locator("#starship")).toHaveAttribute("data-room-state", "ready");
  await expect(page.locator("html")).toHaveClass(/motion-off/);
  await page.getByRole("button", { name: "Resume motion", exact: true }).click();
  await expect(page.locator("html")).not.toHaveClass(/motion-off/);
  await page.locator('header a[href="/#rooms"]').click();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "on");
});

test("An older online mission bookmark restores its exact cloud and privacy choices", async (t) => {
  const page = await visit(t);
  await page.goto(new URL("/#mission=cloud.private.online.permitted", url).href);
  await expect(page.locator("#starship")).toHaveAttribute("data-room-state", "ready");
  await expect(page.locator('[data-arch="cloud"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('[data-sens="private"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#tg-permit")).toHaveAttribute("aria-pressed", "true");
  assert.equal(new URL(page.url()).pathname, "/rooms/starship/interactive/");
});

test("Sanctuary's working-studies action moves to the requested V40 section", async (t) => {
  const page = await visit(t, { hash: "#film=sanctuary" });
  await page.getByRole("button", { name: "Explore the working studies", exact: true }).click();
  await expect(page.locator("#helios-studio")).toHaveCount(0);
  await expect(page.locator("#work")).toBeInViewport();
  await expect(page.locator("#work")).toBeFocused();
  assert.equal(new URL(page.url()).pathname, "/");
});
