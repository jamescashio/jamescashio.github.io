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
async function visit(t, { width = 1440, motion = "reduce", hash = "", js = true, touch = false } = {}) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    reducedMotion: motion,
    javaScriptEnabled: js,
    acceptDownloads: true,
    hasTouch: touch,
    isMobile: touch,
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

test("The logo reveal is explicit, square, playable, and pauses the other identity film", async () => {
  for (const width of [320, 390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    try {
      const page = await context.newPage();
      const errors = [];
      const media = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("request", (request) => {
        if (request.url().includes("logo-reveal-512.mp4")) media.push(request.url());
      });
      await page.goto(url);
      const invitation = page.getByRole("link", { name: "Watch the logo reveal · 15 seconds", exact: true });
      await expect(invitation).toHaveAttribute("href", "/cashio.html#logo-reveal");
      assert.equal(media.length, 0, "the homepage invitation never downloads the reveal video");
      await invitation.click();
      await expect(page).toHaveURL(new URL("cashio.html#logo-reveal", url).href);
      const reveal = page.locator("#logo-reveal-player");
      await expect(reveal).toBeVisible();
      await page.locator("#logo-reveal summary").click();
      assert.equal(media.length, 0, "the poster and description never download the reveal video");
      assert.equal(await reveal.evaluate((video) => video.paused && video.muted && video.controls), true);
      const box = await reveal.boundingBox();
      assert.ok(Math.abs(box.width - box.height) < 1, "preserve the complete square composition");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
      await audit(page, "#logo-reveal");
      await reveal.evaluate((video) => video.play());
      await expect.poll(() => reveal.evaluate((video) => video.currentTime)).toBeGreaterThan(0);
      assert.equal(await reveal.evaluate((video) => video.videoWidth), 512);
      assert.equal(await reveal.evaluate((video) => video.videoHeight), 512);
      assert.ok(Math.abs((await reveal.evaluate((video) => video.duration)) - 15.04) < 0.15);
      await reveal.evaluate((video) => (video.muted = false));
      assert.equal(await reveal.evaluate((video) => video.muted), false, "sound remains under native player control");
      assert.equal(await reveal.evaluate((video) => video.paused), false, "the reveal is playing before the switch");
      await page.locator("#film video").evaluate((video) => video.play());
      assert.equal(await page.locator("#film video").evaluate((video) => video.paused), false);
      await expect.poll(() => reveal.evaluate((video) => video.paused)).toBe(true);
      await page.locator("#film video").scrollIntoViewIfNeeded();
      await page.locator("#film video").evaluate((video) => video.play());
      await page.locator(".hero").scrollIntoViewIfNeeded();
      await expect.poll(() => page.locator("#film video").evaluate((video) => video.paused)).toBe(true);
      assert.deepEqual(errors, []);
    } finally {
      await context.close();
    }
  }
});

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
    await expect(page.locator("footer")).toContainText("one release short of the answer", { ignoreCase: true });
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

test("Every mobile Menu section stays in V40 and survives a reload", async (t) => {
  const ids = [
    "top",
    "workshop",
    "rooms",
    "films",
    "law",
    "work",
    "studies",
    "universe",
    "evidence",
    "operator",
    "contact",
  ];
  for (const width of [390, 320]) {
    const page = await visit(t, { width, touch: true });
    assert.deepEqual(
      await page
        .locator("#mission-dialog [data-chapter]")
        .evaluateAll((links) => links.map((link) => link.dataset.chapter)),
      ids,
    );
    for (const id of ids) {
      await page.locator("header [data-mission-open]").tap();
      const link = page.locator(`#mission-dialog [data-chapter="${id}"]`);
      await expect(link).toHaveAttribute("href", `#${id}`);
      await link.tap();
      await expect(page.locator("#mission-dialog")).not.toBeVisible();
      assert.equal(new URL(page.url()).pathname, "/");
      assert.equal(new URL(page.url()).hash, `#${id}`);
      await expect(page.locator(`#${id}`)).toBeFocused();
      await expect(page.locator(`#${id}`)).toBeInViewport();
      await page.reload();
      await expect(page.locator("#mission-dialog")).toBeAttached();
      await expect(page).toHaveTitle(/V41 Eagle/);
      assert.equal(new URL(page.url()).pathname, "/");
      assert.equal(new URL(page.url()).hash, `#${id}`);
      await expect(page.locator(`#${id}`)).toBeInViewport();
    }
  }
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

test("An older build bookmark does not trap the Back button", async (t) => {
  const page = await visit(t, { hash: "#work" });
  await page.goto(new URL("/#build=hermes", url).href);
  await expect.poll(() => new URL(page.url()).hash.startsWith("#experiment=hermes")).toBe(true);
  await page.goBack();
  await expect.poll(() => new URL(page.url()).hash).toBe("#work");
  await expect(page.locator("#v40-root h1")).toBeAttached();
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

test("The visual ticker loop exposes each telemetry fact once to assistive technology", async (t) => {
  const page = await visit(t);
  const ticker = page.locator('[aria-label="Lab telemetry ticker"]');
  const spoken = await ticker.ariaSnapshot();
  assert.equal((spoken.match(/containers/g) || []).length, 1, "the accessible ticker contains one container fact");
  assert.equal((await ticker.textContent()).match(/containers/g).length, 2, "both visual copies remain for the loop");
});

test("The quiet orbit link opens the correct silent film and returns focus at every screen width", async (t) => {
  for (const width of [1440, 390, 320]) {
    const page = await visit(t, { width });
    const opener = page.getByRole("link", { name: "Watch its quiet orbit · 5 seconds →", exact: true });
    await opener.click();
    const cinema = page.locator(".lensing-film");
    await expect(cinema).toBeVisible();
    const video = cinema.locator("video");
    await expect(video).toHaveAttribute("src", "/assets/zenith/celestial-signature.mp4");
    assert.equal(await video.evaluate((v) => v.muted && v.paused), true, "the film opens quietly on its poster");
    await cinema.locator(".lensing-film-play").click();
    await expect.poll(() => video.evaluate((v) => v.currentTime)).toBeGreaterThan(0.1);
    assert.equal(await video.evaluate((v) => v.muted), true);
    await page.keyboard.press("Escape");
    await expect(page.locator("#helios-studio")).toHaveCount(0);
    await expect(opener).toBeFocused();
    assert.equal(new URL(page.url()).pathname, "/");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
  }
});

for (const hash of ["#signature", "#flight=board", "#film=zenith-celestial-signature"]) {
  test(`Mission Control shortcuts leave the active ${hash} scene in command`, async (t) => {
    const page = await visit(t, { hash });
    const scene = page.locator("#helios-flight dialog, #helios-studio dialog");
    await expect(scene).toBeVisible();
    for (const shortcut of ["Control+k", "Meta+k"]) {
      await page.keyboard.press(shortcut);
      assert.equal(
        await page.locator("#mission-dialog").evaluate((d) => d.open),
        false,
        "a background menu cannot open over the active scene",
      );
      await expect(scene).toBeVisible();
    }
    await page.keyboard.press("Escape");
    await expect(page.locator("#helios-flight, #helios-studio")).toHaveCount(0);
    await page.keyboard.press("Control+k");
    await expect(page.locator("#mission-dialog")).toBeVisible();
  });
}

test("Phone buttons keep comfortable 44 pixel touch areas without horizontal overflow", async (t) => {
  async function checkButtons(page, selector) {
    const small = await page.locator(selector).evaluateAll((buttons) =>
      buttons
        .map((button) => ({
          name: button.getAttribute("aria-label") || button.textContent.trim(),
          width: button.getBoundingClientRect().width,
          height: button.getBoundingClientRect().height,
        }))
        .filter((r) => r.width < 43.9 || r.height < 43.9),
    );
    assert.deepEqual(small, [], "visible phone buttons have a minimum 44 pixel hit area");
  }
  for (const width of [390, 320, 1024]) {
    const page = await visit(t, { width, touch: true });
    await checkButtons(page, "#v40-root button:visible");
    const header = await page.locator("header a:visible, header button:visible").evaluateAll((controls) =>
      controls.map((c) => {
        const r = c.getBoundingClientRect();
        return { name: c.textContent.trim(), x: r.x, y: r.y, right: r.right, bottom: r.bottom };
      }),
    );
    for (const [index, a] of header.entries()) {
      assert.ok(a.x >= 0 && a.right <= width, "header actions fit the touch viewport");
      for (const b of header.slice(index + 1)) {
        assert.ok(
          Math.min(a.right, b.right) - Math.max(a.x, b.x) <= 1 ||
            Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y) <= 1,
          "header actions do not overlap",
        );
      }
    }
    await page.locator("header [data-mission-open]").click();
    await checkButtons(page, "#mission-dialog button:visible");
    await page.keyboard.press("Escape");
    await page.locator("header [data-bit-open]").click();
    await checkButtons(page, "#bit-dialog button:visible");
    await page.keyboard.press("Escape");
    await page.getByRole("link", { name: "Watch its quiet orbit · 5 seconds →", exact: true }).click();
    await expect(page.locator(".lensing-film")).toBeVisible();
    await checkButtons(page, "#helios-studio button:visible");
    await page.keyboard.press("Escape");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
  }
});

test("Closing a film preserves the computed shared experiment and the visitor's place", async (t) => {
  for (const exit of ["Escape", "Back"]) {
    const page = await visit(t, { hash: "#experiment=hermes&intent=analyze&private=true&sources=true" });
    await page.getByRole("button", { name: "Route this request", exact: true }).click();
    const result = page.locator("#studies h4");
    await expect(result).toHaveText("Human review");
    const opener = page.getByRole("link", { name: "Watch its quiet orbit · 5 seconds →", exact: true });
    await opener.click();
    await expect(page.locator(".lensing-film")).toBeVisible();
    if (exit === "Back") await page.goBack();
    else await page.keyboard.press("Escape");
    await expect(page.locator("#helios-studio")).toHaveCount(0);
    await expect(result).toHaveText("Human review");
    await expect(opener).toBeInViewport();
    await page.goto(new URL("#experiment=hermes&intent=draft&private=false&sources=false", url).href);
    await expect(result).toHaveText("Choose a task");
    await page.getByRole("button", { name: "Route this request", exact: true }).click();
    await expect(result).toHaveText("Everyday drafting");
  }
});

test("Back to a shared experiment after ordinary navigation restores its exact inputs", async (t) => {
  const page = await visit(t, { hash: "#experiment=hermes&intent=analyze&private=true&sources=true" });
  await page.locator("header [data-mission-open]").click();
  await page.locator('#mission-dialog [data-chapter="studies"]').click();
  await expect(page).toHaveURL(/#studies$/);
  await page.locator('[role="tab"]').nth(1).click();
  await expect(page.locator('[role="tab"]').nth(1)).toHaveAttribute("aria-selected", "true");
  await page.goBack();
  await expect(page.locator('[role="tab"]').first()).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("button", { name: "Contains private information", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Route this request", exact: true }).click();
  await expect(page.locator("#studies h4")).toHaveText("Human review");
});

for (const [hash, module] of [
  ["#signature", "studio-island"],
  ["#flight=board", "flight-island"],
  ["#film=zenith-celestial-signature", "studio-island"],
]) {
  test(`Mission Control stays closed while ${hash} is loading`, async (t) => {
    const page = await visit(t);
    let release;
    const loading = new Promise((resolve) => {
      release = resolve;
    });
    await page.route(`**/assets/${module}-*.js`, async (route) => {
      await loading;
      await route.continue();
    });
    try {
      await page.goto(new URL(hash, url).href);
      await expect(page.locator(".v40-scene-status")).toBeVisible();
      await page.keyboard.press("Control+k");
      assert.equal(await page.locator("#mission-dialog").evaluate((d) => d.open), false);
    } finally {
      release();
    }
    await expect(page.locator("#helios-flight dialog, #helios-studio dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#helios-flight, #helios-studio")).toHaveCount(0);
  });
}
