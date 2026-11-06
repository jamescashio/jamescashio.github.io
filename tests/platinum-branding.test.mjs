import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const url = process.env.V40_URL;
const brand = "/brand/platinum/";
const iconVersion = "?v=c-red-top-20261105";
let browser;
before(async () => {
  assert.ok(url, "Set V40_URL to the built platinum preview.");
  browser = await chromium.launch({
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" }),
    headless: true,
  });
});
after(async () => browser?.close());

async function visit(t, path, width, height) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce" });
  t.after(() => context.close());
  await context.addInitScript(() => {
    window.brandAudioAttempts = 0;
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (...args) {
      if (!this.muted && this.volume > 0) window.brandAudioAttempts++;
      return play.apply(this, args);
    };
    window.brandAudioContexts = [];
    for (const name of ["AudioContext", "webkitAudioContext"]) {
      const NativeContext = window[name];
      if (!NativeContext) continue;
      window[name] = new Proxy(NativeContext, {
        construct(Target, args) {
          const context = Reflect.construct(Target, args);
          window.brandAudioContexts.push(context);
          return context;
        },
      });
    }
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.url().includes(brand) && response.status() >= 400)
      errors.push(`${response.status()} ${response.url()}`);
  });
  t.after(() => assert.deepEqual(errors, [], `${path} has no runtime, CSP, or brand asset failures`));
  await page.goto(new URL(path, url).href, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  return { page, context };
}

async function assertMetadata(page) {
  await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute(
    "href",
    `${brand}favicon.svg${iconVersion}`,
  );
  await expect(page.locator('link[rel="icon"][sizes="32x32"]')).toHaveAttribute(
    "href",
    `${brand}favicon-32.png${iconVersion}`,
  );
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    "href",
    `${brand}apple-touch-icon.png${iconVersion}`,
  );
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", `${brand}site.webmanifest${iconVersion}`);
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", /#0d1017/i);
}

async function assertKeyboardFocus(page, target) {
  await expect(target).toHaveAccessibleName(/\S/);
  await target.focus();
  await expect(target).toBeFocused();
  const focus = await target.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      visible: node.matches(":focus-visible"),
      outline: style.outlineStyle !== "none" && parseFloat(style.outlineWidth) >= 2,
      transparent: style.outlineColor === "transparent" || style.outlineColor === "rgba(0, 0, 0, 0)",
    };
  });
  assert.ok(focus.visible && focus.outline && !focus.transparent, "keyboard focus has a visible outline");
}

test("current brand assets decode at their advertised sizes while the archived edition retains its artwork", async (t) => {
  const { page, context } = await visit(t, "/", 1440, 900);
  await assertMetadata(page);
  const kit = await context.request.get(new URL(`${brand}brand-manifest.json`, url).href);
  assert.equal(kit.status(), 200);
  const inventory = await kit.json();
  assert.deepEqual(inventory.logoAccentOrder, { A: "red", I: "blue" });
  assert.deepEqual(inventory.faviconAccentOrder, { top: "#FF3D55", bottom: "#3578FF" });
  for (const file of ["favicon.svg", "icon.svg"]) {
    const vector = await context.request.get(new URL(`${brand}${file}${iconVersion}`, url).href);
    assert.equal(vector.status(), 200);
    const source = await vector.text();
    assert.match(source, /d="M41 11H54L47 22H34Z" fill="#FF3D55"/);
    assert.match(source, /d="M34 42H47L54 53H41Z" fill="#3578FF"/);
  }
  const provenance = await context.request.get(new URL(`${brand}provenance.json`, url).href);
  assert.equal(provenance.status(), 200);
  assert.equal(
    (await provenance.json()).source_sha256,
    "98b34ec176dd3a27babb155cafd5d1e37b9dd1b497648804280e3416e7d9f654",
    "the detailed signature uses Doug's corrected red-A / blue-I artwork",
  );
  for (const file of ["wordmark.svg", "everyday-dark.svg", "everyday-light.svg"]) {
    const vector = await context.request.get(new URL(`${brand}${file}`, url).href);
    assert.equal(vector.status(), 200);
    const accents = await page.evaluate(
      (source) => {
        const svg = new DOMParser().parseFromString(source, "image/svg+xml");
        return [...svg.querySelectorAll("path[fill]")]
          .map((path) => path.getAttribute("fill").toUpperCase())
          .filter((color) => ["#FF3D55", "#3578FF"].includes(color));
      },
      await vector.text(),
    );
    assert.deepEqual(accents, ["#FF3D55", "#3578FF"], `${file} keeps the red A before the blue capital I`);
  }
  // The preserved V43 edition sets its text wordmarks in live type; V44 uses the vector wordmark checked above.
  const { page: edition } = await visit(t, "/v43/", 1440, 900);
  for (const [glyph, color] of [
    ["a", "rgb(255, 61, 85)"],
    ["i", "rgb(53, 120, 255)"],
  ]) {
    const letters = edition.locator(`#v40-root .cashio-brand-${glyph}`);
    assert.ok(await letters.count(), "current text wordmarks carry explicit letter colors");
    assert.ok(
      (await letters.evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).color))).every(
        (value) => value === color,
      ),
    );
  }
  const response = await context.request.get(new URL(`${brand}site.webmanifest${iconVersion}`, url).href);
  assert.equal(response.status(), 200);
  const manifest = await response.json();
  assert.ok(
    manifest.icons.every(({ src }) => src.endsWith(iconVersion)),
    "phone icons use the corrected cache version",
  );
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.short_name, "cAshIo");
  assert.equal(manifest.theme_color.toLowerCase(), "#0d1017");
  assert.deepEqual(manifest.icons.map(({ sizes }) => sizes).sort(), ["192x192", "512x512"]);
  const assets = [
    { path: `${brand}wordmark.svg`, width: 348, height: 80 },
    { path: `${brand}icon.svg${iconVersion}`, width: 64, height: 64 },
    { path: `${brand}favicon.svg${iconVersion}`, width: 64, height: 64 },
    { path: `${brand}favicon-32.png${iconVersion}`, width: 32, height: 32 },
    { path: `${brand}apple-touch-icon.png${iconVersion}`, width: 180, height: 180 },
    ...manifest.icons.map(({ src, sizes }) => {
      const [width, height] = sizes.split("x").map(Number);
      return { path: src, width, height };
    }),
    { path: `${brand}share-card.jpg`, width: 1200, height: 630 },
  ];
  const decoded = await page.evaluate(
    async (assets) =>
      Promise.all(
        assets.map(async ({ path }) => {
          const image = new Image();
          image.src = path;
          await image.decode();
          return { path, width: image.naturalWidth, height: image.naturalHeight };
        }),
      ),
    assets,
  );
  for (const [index, image] of decoded.entries()) {
    const expected = assets[index];
    assert.ok(image.width > 0 && image.height > 0, `${image.path} decodes`);
    if (new URL(image.path, url).pathname.endsWith(".svg")) {
      // A viewBox-only SVG may use the browser's default intrinsic pixel dimensions.
      const vector = await context.request.get(new URL(image.path, url).href);
      assert.equal(vector.status(), 200);
      assert.match(await vector.text(), new RegExp(`viewBox="0 0 ${expected.width} ${expected.height}"`));
    } else assert.deepEqual(image, expected, `${image.path} matches its advertised raster dimensions`);
  }

  const archived = await readFile(new URL("../v39/index.html", import.meta.url), "utf8");
  assert.match(archived, /rel="icon" href="\/cashio\/icon\.svg\?v=c-red-top-20261105"/);
  const archivedIcon = await readFile(new URL("../public/cashio/icon-gold-archive.svg", import.meta.url));
  assert.equal(
    createHash("sha256").update(archivedIcon).digest("hex"),
    "b4c7fe338d1782f4d14b3594af4136f00e8467d46c8e068cdebe8bfd63e61c85",
    "the archive icon preserves public/cashio/icon.svg from 6254986 byte for byte",
  );
  const servedArchivedIcon = await context.request.get(new URL("/cashio/icon-gold-archive.svg", url).href);
  assert.equal(servedArchivedIcon.status(), 200);
  assert.deepEqual(await servedArchivedIcon.body(), archivedIcon, "the archive serves the preserved original icon");
  assert.match(archived, /src="\/brand\/platinum\/signature-1680\.webp"/);
  assert.match(archived, /https:\/\/cashio\.us\/assets\/workshop\/share-card-v394\.jpg/);
  const originalArtwork = await readFile(new URL("../public/brand/celestial-1680.webp", import.meta.url));
  const servedOriginalArtwork = await context.request.get(new URL("/brand/celestial-1680.webp", url).href);
  assert.equal(servedOriginalArtwork.status(), 200);
  assert.deepEqual(
    await servedOriginalArtwork.body(),
    originalArtwork,
    "the original signature artwork remains available",
  );
});

// Each page names its first call to action, whether its icon yields to the wordmark on the narrowest phones,
// and the motion indicator that must stay still under reduced motion.
const pages = {
  "/": { action: ".cta[data-transit-go]", narrowIcon: false, orbiter: null, motion: true },
  "/v43/": { action: ".tour-launch", narrowIcon: false, orbiter: ".hud-orbiter", motion: true },
  "/cashio.html": { action: ".hero .button", narrowIcon: true, orbiter: null, motion: false },
};

for (const [path, shape] of Object.entries(pages)) {
  test(`${path} keeps its platinum identity readable, keyboard accessible and quiet on desktop and phones`, async (t) => {
    for (const [width, height] of [
      [1440, 900],
      [390, 844],
      [320, 568],
    ]) {
      const { page, context } = await visit(t, path, width, height);
      await assertMetadata(page);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      for (const file of ["wordmark.svg", "icon.svg"]) {
        const image = page
          .locator(`header img[src="${brand}${file}${file === "icon.svg" ? iconVersion : ""}"]`)
          .first();
        if (file === "icon.svg" && !shape.narrowIcon && width === 320) await expect(image).toBeHidden();
        else await expect(image).toBeVisible();
        await expect.poll(() => image.evaluate((node) => node.complete && node.naturalWidth > 0)).toBe(true);
      }
      const signature = page.locator(`img[src^="${brand}signature-"]`).first();
      await signature.scrollIntoViewIfNeeded();
      await expect.poll(() => signature.evaluate((node) => node.complete && node.naturalWidth > 0)).toBe(true);
      assert.match(
        await signature.evaluate((node) => node.currentSrc),
        /\/brand\/platinum\/signature-(?:420|840|1680)\.webp$/,
      );
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        true,
        `${width}px page has no horizontal overflow`,
      );
      const media = await page.evaluate(() => ({
        attempts: window.brandAudioAttempts,
        activeContexts: window.brandAudioContexts.filter((context) => context.state === "running").length,
        audible: [...document.querySelectorAll("audio,video")].filter(
          (media) => !media.paused && !media.muted && media.volume > 0,
        ).length,
      }));
      assert.deepEqual(media, { attempts: 0, activeContexts: 0, audible: 0 }, "sound needs an explicit visitor choice");

      const orbiter = shape.orbiter ? page.locator(shape.orbiter) : null;
      const orbitBefore = orbiter ? await orbiter.getAttribute("style") : null;
      const { violations } = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
        .analyze();
      assert.deepEqual(
        violations
          .filter(({ impact }) => impact === "serious" || impact === "critical")
          .map(({ id, impact, nodes }) => ({ id, impact, targets: nodes.map(({ target }) => target) })),
        [],
        `${path} ${width}×${height} has no serious or critical automated accessibility violations, including contrast`,
      );
      if (orbiter)
        assert.equal(await orbiter.getAttribute("style"), orbitBefore, "system reduced motion keeps the orbit still");

      await page.keyboard.press("Tab");
      await assertKeyboardFocus(page, page.locator(`header a:has(img[src="${brand}wordmark.svg"])`).first());
      await assertKeyboardFocus(page, page.locator(shape.action));
      if (shape.motion) {
        const assertHeaderFits = async () => {
          const clipped = await page.getByRole("banner").evaluate((header) =>
            [...header.querySelectorAll("a,button")]
              .map((node) => ({
                label: node.getAttribute("aria-label") || node.textContent,
                box: node.getBoundingClientRect(),
              }))
              .filter(({ box }) => box.width && (box.left < 0 || box.right > document.documentElement.clientWidth + 1))
              .map(({ label }) => label),
          );
          assert.deepEqual(clipped, [], "header controls clear the scrollbar in both motion states");
        };
        await assertHeaderFits();
        await page.locator('header button[aria-label$="motion"]').click();
        await assertHeaderFits();
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await context.close();
    }
  });
}
