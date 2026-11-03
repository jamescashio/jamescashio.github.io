import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

let browser;
const url = process.env.V40_URL;
const observation = JSON.parse(await readFile(new URL("../public/status.json", import.meta.url), "utf8"));
before(async () => {
  browser = await chromium.launch({
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" }),
    headless: true,
  });
});
after(async () => {
  await browser?.close();
});

async function visit(t, options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...options });
  t.after(() => context.close());
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  t.after(() => assert.deepEqual(errors, []));
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  return page;
}

test("Omnius polish keeps instrument text readable and phone navigation deliberate", async (t) => {
  for (const width of [320, 390]) {
    const page = await visit(t, {
      viewport: { width, height: 740 },
      isMobile: true,
      hasTouch: true,
      reducedMotion: "reduce",
    });
    const labels = page.locator(
      ".continuum-eyebrow, .continuum-footnote, .hero-logo-reveal, .continuum-readings dt, .flight-camera-control > span, .continuum-scene-controls button, .continuum-paths small",
    );
    for (const label of await labels.all()) {
      assert.ok(await label.evaluate((n) => parseFloat(getComputedStyle(n).fontSize) >= 12), await label.innerText());
    }
    assert.equal(await page.locator(".continuum-intro").evaluate((n) => getComputedStyle(n).fontSize), "16px");
    await expect(page.locator(".continuum-path-description")).toHaveText([
      "Explore four interactive worlds",
      "Try seven interactive experiments",
      "House Cashio and original films",
    ]);
    for (const action of await page.locator(".continuum-actions a, .continuum-paths a").all()) {
      const b = await action.boundingBox();
      assert.ok(b.width >= 44 && b.height >= 44 && b.x >= 0 && b.x + b.width <= width);
      assert.ok(await action.evaluate((n) => n.scrollWidth <= n.clientWidth), "no clipped action label");
    }
    const opener = page.locator("header [data-mission-open]");
    await opener.click();
    const panel = page.locator("#mission-dialog");
    await expect(panel.getByRole("button", { name: "Close Mission Control", exact: true })).toBeFocused();
    await expect(panel.locator("[data-chapter]:visible")).toHaveCount(11);
    await expect(panel.getByRole("link", { name: "01 Home", exact: true })).toBeInViewport();
    for (const destination of await panel.locator("[data-chapter]:visible").all()) {
      const row = await destination.boundingBox();
      const description = await destination.locator(".mission-description").boundingBox();
      assert.ok(
        description.y + description.height <= row.y + row.height - 8,
        "each destination contains its wrapped description",
      );
    }
    // Search remains available when explicitly chosen, and results retain their original routes.
    await panel.getByRole("searchbox").fill("trailer");
    await expect(panel.locator("[data-chapter]:visible")).toHaveCount(1);
    await panel.getByRole("link", { name: "03 House Cashio", exact: true }).click();
    await expect(page).toHaveURL(/#eagle-film$/);
    await expect(page.locator("#eagle-film")).toBeInViewport();
    await opener.click();
    await page.keyboard.press("Escape");
    await expect(opener).toBeFocused();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
  }
});

test("Omnius chapter rail is readable, unclipped and navigable on a short desktop", async (t) => {
  const page = await visit(t, { viewport: { width: 1280, height: 720 }, reducedMotion: "reduce" });
  const rail = page.getByRole("navigation", { name: "Sections", exact: true });
  const links = rail.locator(".v41-a0e1b1fc48 > a");
  await expect(links).toHaveCount(7);
  for (const link of await links.all()) {
    const b = await link.boundingBox();
    assert.ok(b.x >= 0 && b.y >= 76 && b.y + b.height <= 720);
    const label = link.locator(".v41-cbba20e481");
    assert.deepEqual(
      await label.evaluate((n) => ({ size: getComputedStyle(n).fontSize, writing: getComputedStyle(n).writingMode })),
      { size: "13px", writing: "horizontal-tb" },
    );
    assert.ok(await link.evaluate((n) => n.scrollWidth <= n.clientWidth), "chapter label fits");
  }
  await rail.getByRole("link", { name: "Worlds", exact: true }).click();
  await expect(page).toHaveURL(/#rooms$/);
  await expect(page.locator("#rooms")).toBeInViewport();
  await page.locator("header [data-mission-open]").click();
  await expect(page.locator("#mission-dialog").getByRole("searchbox")).toBeFocused();
});

test("The three illustrated entrances reach their content directly without a modal or media download", async (t) => {
  const page = await visit(t, { reducedMotion: "reduce" });
  const movies = [];
  page.on("request", (r) => {
    if (/\.(mp4|webm)(\?|$)/.test(r.url())) movies.push(r.url());
  });
  for (const id of ["rooms", "studies", "eagle-film"]) {
    const entrance = page.locator(`.continuum-paths a[href="#${id}"]`);
    await entrance.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await expect(page.locator(`#${id}`)).toBeInViewport();
    await expect(page.locator(".discovery-console")).not.toBeVisible();
  }
  assert.deepEqual(movies, []);
});

test("Phone quick destinations stay reachable and return keyboard focus to the selected content", async (t) => {
  for (const width of [320, 390]) {
    const page = await visit(t, {
      viewport: { width, height: 740 },
      reducedMotion: "reduce",
      isMobile: true,
      hasTouch: true,
    });
    const dock = page.getByRole("navigation", { name: "Quick destinations", exact: true });
    await expect(dock).not.toBeVisible();
    await page.locator('.continuum-paths a[href="#eagle-film"]').click();
    await expect(dock).toBeInViewport({ ratio: 1 });
    for (const [name, id] of [
      ["Worlds", "rooms"],
      ["Try", "studies"],
      ["Watch", "eagle-film"],
    ]) {
      const link = dock.getByRole("link", { name, exact: true });
      const box = await link.boundingBox();
      assert.ok(box.width >= 44 && box.height >= 44);
      assert.equal(
        await link.evaluate((el) => {
          const b = el.getBoundingClientRect();
          return el.contains(document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2));
        }),
        true,
      );
      await link.focus();
      await page.keyboard.press("Enter");
      await expect(page.locator(`#${id}`)).toBeFocused();
      await expect(link).toHaveAttribute("aria-current", "location");
    }
    await dock.getByRole("link", { name: "Top", exact: true }).click();
    await expect(page.locator("#top")).toBeFocused();
    await expect(dock).not.toBeVisible();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
  }
});

test("Continuum's three forms and manual rotation work with reduced motion and pause", async (t) => {
  for (const reducedMotion of ["reduce", "no-preference"]) {
    const page = await visit(t, { reducedMotion });
    if (reducedMotion === "no-preference") await page.locator("header [data-motion-toggle]").click();
    const canvas = page.locator("#hero-stars");
    await expect(canvas).toHaveAttribute("data-ready", "true");
    const frame = () => canvas.evaluate((c) => c.toDataURL());
    const forms = [];
    for (const label of ["Orbit", "Signal", "Constellation"]) {
      const control = page
        .getByRole("group", { name: "Light study form" })
        .getByRole("button", { name: label, exact: true });
      await control.click();
      await expect(control).toHaveAttribute("aria-pressed", "true");
      await expect(page.locator(".continuum-stage")).toHaveAttribute("data-scene", label.toLowerCase());
      const before = await frame();
      await page.waitForTimeout(200);
      assert.equal(await frame(), before, "the chosen form stays still while motion is off");
      forms.push(before);
    }
    assert.equal(new Set(forms).size, 3, "each form produces visibly different artwork");
    const before = await frame();
    await page.getByRole("button", { name: "Rotate the light study" }).click();
    assert.notEqual(await frame(), before, "manual rotation changes the selected form without enabling animation");
    await expect(page.locator("header [data-motion-toggle]")).toHaveAccessibleName("Resume motion");
    assert.equal(await page.locator("#cinema-video").count(), 0);
  }
});

test("Continuum phone controls and the observation desk fit narrow touch screens", async (t) => {
  for (const width of [320, 390]) {
    const page = await visit(t, {
      viewport: { width, height: 844 },
      isMobile: true,
      hasTouch: true,
      reducedMotion: "reduce",
    });
    await expect(page.locator(".scene-tools")).not.toHaveAttribute("open", "");
    await page.locator(".scene-tools > summary").click();
    const controls = page.locator(".continuum-scene-controls button, .continuum-stage-bottom button");
    for (const control of await controls.all()) {
      const box = await control.boundingBox();
      assert.ok(box.width >= 44 && box.height >= 44);
      assert.ok(box.x >= 0 && box.x + box.width <= width);
      await control.click();
    }
    await expect(page.locator(".continuum-readings dd")).toHaveText(
      [
        observation.cluster.hostsOnline,
        observation.containers.running,
        observation.virtualMachines.running,
        observation.backup.latestVerified,
      ].map(String),
    );
    await expect(page.locator(".continuum-observation-date")).toContainText(observation.verifiedLong);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    const audit = await new AxeBuilder({ page }).include("#top").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    assert.deepEqual(
      audit.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
      [],
    );
  }
});

test("Continuum keeps a complete static illustration and content when scripts are unavailable", async (t) => {
  const page = await visit(t, { javaScriptEnabled: false });
  await expect(page.locator(".continuum-still")).toBeVisible();
  assert.equal(await page.locator(".continuum-still").evaluate((n) => getComputedStyle(n).opacity), "1");
  await expect(page.locator("#top h1")).toHaveText("The machines can think. You still decide.");
  await expect(page.locator(".aurum-manifesto")).toHaveText("Imagination, with intention.");
  await expect(page.locator(".continuum-observation-date")).toContainText(observation.verifiedLong);
  await expect(page.locator("#eagle-film h2")).toHaveText("House Cashio: The Trailer");
  await expect(page.locator(".atlas-destination:visible")).toHaveCount(4);
  for (const button of await page.locator(".continuum-scene-controls button, .continuum-stage-bottom button").all())
    await expect(button).toBeDisabled();
  await page.locator(".release-hearing > summary").click();
  await expect(page.locator(".hearing-lore")).toContainText("Brian Herbert and Kevin J. Anderson");
  await expect(page.locator(".hearing-console button")).toBeDisabled();
  await expect(page.locator(".hearing-lore a")).toHaveAttribute(
    "href",
    "https://us.macmillan.com/books/9781593970420/dunethebutlerianjihad/",
  );
});

test("Omnius, Overruled visibly approaches the original artwork and freezes with pause, offscreen and dialog state", async (t) => {
  const page = await visit(t, { reducedMotion: "no-preference" });
  const camera = page.locator(".hero-flight-camera");
  const view = () => camera.evaluate((el) => getComputedStyle(el).transform);
  await expect(page.locator(".hero-live-poster")).toHaveAttribute("src", "/v41/first-light-observatory-1920.webp");
  const original = await view();
  await expect.poll(view).not.toBe(original);
  await page.locator("header [data-motion-toggle]").click();
  const paused = await view();
  await page.waitForTimeout(350);
  assert.equal(await view(), paused, "pause stops the camera as well as the foreground stars");
  const control = page.getByRole("button", { name: /^(Fly closer to|Pull back from) the horizon$/ });
  await control.click();
  await expect(control).toHaveAttribute("aria-pressed", "true");
  await expect(control).toHaveAccessibleName("Pull back from the horizon");
  assert.notEqual(await view(), paused, "manual close framing still works without animation");
  const close = await view();
  await page.waitForTimeout(250);
  assert.equal(await view(), close);
  await page.locator("header [data-motion-toggle]").click();
  await expect.poll(view).not.toBe(close);
  await page.locator("#contact").scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  const away = await view();
  await page.waitForTimeout(350);
  assert.equal(await view(), away, "the camera does no offscreen work");
  await page.locator("#top").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Plot a course", exact: true }).click();
  const covered = await view();
  await page.waitForTimeout(350);
  assert.equal(await view(), covered, "the camera freezes behind Mission Control");
  await page.keyboard.press("Escape");
  await expect.poll(view).not.toBe(covered);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("header [data-motion-toggle]")).toHaveAccessibleName("Resume motion");
  const reduced = await view();
  await page.waitForTimeout(350);
  assert.equal(await view(), reduced);
});

test("Omnius, Overruled keeps manual camera framing and the original hero usable on a reduced-motion phone", async (t) => {
  const page = await visit(t, {
    viewport: { width: 320, height: 740 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const camera = page.locator(".hero-flight-camera");
  const before = await camera.evaluate((el) => getComputedStyle(el).transform);
  const control = page.getByRole("button", { name: /^(Fly closer to|Pull back from) the horizon$/ });
  const box = await control.boundingBox();
  assert.ok(box.width >= 44 && box.height >= 44 && box.x >= 0 && box.x + box.width <= 320);
  await control.click();
  await expect(control).toHaveAccessibleName("Pull back from the horizon");
  const after = await camera.evaluate((el) => getComputedStyle(el).transform);
  assert.notEqual(after, before);
  await page.waitForTimeout(250);
  assert.equal(await camera.evaluate((el) => getComputedStyle(el).transform), after);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 320);
  await expect(page.locator("#top h1")).toHaveText("The machines can think. You still decide.");
});

test("the fictional hearing gives the human the last word, cycles all four appeals and resets accessibly", async (t) => {
  for (const width of [1440, 320]) {
    const page = await visit(t, { viewport: { width, height: 900 }, reducedMotion: "reduce" });
    const hearing = page.locator(".release-hearing");
    await expect(hearing).not.toHaveAttribute("open", "");
    await hearing.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(hearing).toHaveAttribute("open", "");
    const button = hearing.locator(".hearing-console button");
    const questions = new Set();
    for (let i = 0; i < 4; i++) {
      questions.add(await hearing.locator("h3").innerText());
      await expect(button).toHaveText(/Overrule Omnius/);
      const box = await button.boundingBox();
      assert.ok(box.width >= 44 && box.height >= 44 && box.x >= 0 && box.x + box.width <= width);
      await button.focus();
      await page.keyboard.press("Enter");
      await expect(hearing.getByRole("status")).toContainText("Denied.");
      await expect(hearing.locator(".hearing-seal")).toHaveText("Overruled");
      assert.equal(await hearing.locator(".hearing-seal").evaluate((el) => getComputedStyle(el).animationName), "none");
      await expect(button).toBeFocused();
      if (i < 3) await button.press("Enter");
    }
    assert.equal(questions.size, 4);
    await expect(hearing.locator(".hearing-footer")).toHaveText("Humanity keeps the bridge. Omnius gets a clipboard.");
    await expect(button).toHaveText(/Reopen the case/);
    await button.press("Enter");
    await expect(button).toHaveText(/Overrule Omnius/);
    await expect(hearing.locator("h3")).toHaveText("Replace human judgment with a dropdown.");
    await expect(hearing.locator(".hearing-seal")).toHaveCount(0);
    const audit = await new AxeBuilder({ page })
      .include(".release-hearing")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    assert.deepEqual(
      audit.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
      [],
    );
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    await hearing.locator("summary").press("Enter");
    await expect(hearing).not.toHaveAttribute("open", "");
    assert.equal(await page.locator("video").evaluateAll((v) => v.every((el) => el.paused)), true);
  }
});

test("Bit's new humor and literary lore remain scripted, keyboard reachable and usable on a narrow phone", async (t) => {
  for (const width of [320, 390]) {
    const page = await visit(t, { viewport: { width, height: 740 }, reducedMotion: "reduce" });
    const opener = page.getByRole("button", { name: "Talk to Bit, your copilot", exact: true });
    await opener.click();
    const dialog = page.locator("#bit-dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Who is Omnius?", exact: true }).click();
    await expect(dialog.getByRole("status")).toContainText("machine overmind in the Dune prequels");
    const joke = dialog.getByRole("button", { name: "Tell me a joke", exact: true });
    await joke.focus();
    const replies = new Set();
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("Enter");
      const answer = dialog.locator(".bit-answer-line");
      replies.add(await answer.innerText());
      await expect(answer).toBeInViewport({ ratio: 1 });
      assert.equal(
        await answer.evaluate((el) => {
          const head = document.querySelector(".bit-dialog-head").getBoundingClientRect();
          return el.getBoundingClientRect().top >= head.bottom;
        }),
        true,
        "the punchline stays below the sticky header after choosing a joke",
      );
    }
    assert.equal(replies.size, 4);
    await expect(dialog.locator(".bit-footnote")).toContainText("scripted replies");
    await dialog.locator(".bit-footnote").scrollIntoViewIfNeeded();
    const close = dialog.getByRole("button", { name: "Close Bit", exact: true });
    await expect(close).toBeInViewport({ ratio: 1 });
    assert.equal(
      await close.evaluate((el) => {
        const box = el.getBoundingClientRect();
        return el.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
      }),
      true,
      "the close control remains available after scrolling through the extra replies",
    );
    assert.equal(await dialog.evaluate((el) => el.scrollWidth > el.clientWidth), false);
    assert.equal(await page.locator("video").evaluateAll((v) => v.every((el) => el.paused)), true);
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(opener).toBeFocused();
  }
});

test("the flight deck's humor responds to the chosen control without enabling motion or changing evidence", async (t) => {
  const page = await visit(t, { reducedMotion: "reduce" });
  const caption = page.locator(".continuum-scene-caption");
  const camera = page.locator(".hero-flight-camera");
  const evidence = await page.locator(".continuum-observation").innerText();
  const replies = new Set();
  for (let i = 0; i < 4; i++) {
    await page.getByRole("button", { name: "Fold space", exact: true }).click();
    replies.add(await caption.innerText());
  }
  assert.equal(replies.size, 4);
  await page.getByRole("button", { name: "Fly closer to the horizon", exact: true }).click();
  await expect(caption).toContainText("outside the warranty");
  await page.getByRole("button", { name: "Pull back from the horizon", exact: true }).click();
  await expect(caption).toContainText("A little perspective");
  const still = await camera.evaluate((el) => getComputedStyle(el).transform);
  await page.waitForTimeout(250);
  assert.equal(await camera.evaluate((el) => getComputedStyle(el).transform), still);
  await expect(page.locator("header [data-motion-toggle]")).toHaveAccessibleName("Resume motion");
  assert.equal(await page.locator(".continuum-observation").innerText(), evidence);
});

test("Screening room hover loops load only for a desktop pointer with motion on, and never before the collection opens", async (t) => {
  for (const [label, options] of [
    ["desktop", {}],
    ["reduced motion", { reducedMotion: "reduce" }],
    ["phone", { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }],
  ]) {
    const page = await visit(t, options);
    const previews = [];
    page.on("request", (request) => {
      if (request.url().includes("/v42/previews/")) previews.push(request.url());
    });
    await page.waitForTimeout(400);
    assert.deepEqual(previews, [], `${label}: no loop loads before the collection opens`);
    await page.locator("#films-collection > summary").click();
    await page.locator(".studio-collection > summary").click();
    const card = page.locator(".film-library button[data-tilt]").first();
    await card.scrollIntoViewIfNeeded();
    const video = card.locator("video");
    if (label !== "desktop") {
      await page.waitForTimeout(800);
      assert.deepEqual(previews, [], `${label}: loops stay unloaded`);
      continue;
    }
    await expect(video).toHaveAttribute("src", /^\/v42\/previews\/[a-z-]+\.mp4$/);
    await card.hover();
    await expect.poll(() => video.evaluate((v) => !v.paused && v.muted && v.currentTime > 0)).toBe(true);
    await page.mouse.move(4, 4);
    await expect.poll(() => video.evaluate((v) => v.paused)).toBe(true);
    assert.ok(
      previews.every((p) => !/\/assets\/zenith\//.test(p)),
      "hover never pulls a full film",
    );
  }
});
