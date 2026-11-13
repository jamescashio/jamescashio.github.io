// Render current brand placements from the approved C and full-frame signature.
// Existing artwork, source images and historical share cards are never overwritten.
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const directory = "public/brand/platinum";
const data = async (path, type) => `data:${type};base64,${(await readFile(path)).toString("base64")}`;
async function renderPlacements() {
  const icon = await data(`${directory}/icon.svg`, "image/svg+xml");
  const signature = await data(`${directory}/signature-1680.webp`, "image/webp");
  // The card is set in the front door's own faces.
  const display = await data("public/fonts/oxanium-latin-variable.woff2", "font/woff2");
  const body = await data("public/fonts/exo2-500.woff2", "font/woff2");
  const browser = await chromium.launch({
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" }),
    headless: true,
  });
  try {
    const page = await browser.newPage({ deviceScaleFactor: 1 });
    const iconSizes = process.argv.includes("--share-card-only") ? [] : [180, 192, 512];
    for (const size of iconSizes) {
      await page.setViewportSize({ width: size, height: size });
      await page.setContent(
        `<style>body{margin:0;background:#111217}img{display:block;width:100%;height:100%}</style><img src="${icon}">`,
      );
      await page.locator("img").evaluate((image) => image.decode());
      await page.screenshot({ path: `${directory}/${size === 180 ? "apple-touch-icon" : `icon-${size}`}.png` });
    }
    await page.setViewportSize({ width: 1200, height: 630 });
    await page.setContent(`<!doctype html><html lang="en"><meta charset="utf-8"><style>
    @font-face{font-family:Display;src:url(${display});font-weight:200 800} @font-face{font-family:Exo;src:url(${body})}
    *{box-sizing:border-box;margin:0}body{position:relative;width:1200px;height:630px;background:#0D1017;color:#E2E6EE;overflow:hidden}
    /* The signature is painted on near black; keeping only what is lighter than the card leaves the letters, the orbits and their light, with no box around them. */
    img{position:absolute;width:1030px;height:auto;left:85px;top:15px;mix-blend-mode:lighten}
    .label{position:absolute;left:52px;top:34px;font:500 15px Exo,sans-serif;letter-spacing:3px;color:#B4BDCD}
    .title{position:absolute;left:52px;bottom:76px;font:700 42px Display,sans-serif;color:#F5F5F7}
    .foot{position:absolute;left:52px;bottom:35px;font:500 20px Exo,sans-serif;color:#B4BDCD}
    .rule{position:absolute;left:52px;bottom:132px;width:76px;height:3px;background:#3578FF}.rule:after{content:"";position:absolute;left:80px;width:16px;height:3px;background:#FF3D55}
    </style><img alt="" src="${signature}"><div class="label">DOUG CASHIO · HUMAN IN COMMAND</div><div class="rule"></div><div class="title">Imagination, with intention.</div><div class="foot">cashio.us · Original worlds. Useful experiments.</div></html>`);
    await page.locator("img").evaluate((image) => image.decode());
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${directory}/share-card.jpg`, type: "jpeg", quality: 91 });
    console.log(
      iconSizes.length
        ? "Rendered 180/192/512 px mobile icons and the 1200 × 630 social card."
        : "Rendered the 1200 × 630 social card; existing icons were preserved.",
    );
  } finally {
    await browser.close();
  }
}

async function synchronizeManifest() {
  const path = `${directory}/brand-manifest.json`;
  const before = await readFile(path, "utf8");
  const manifest = JSON.parse(before);
  manifest.files = await Promise.all(
    manifest.files.map(async (file) => {
      const bytes = await readFile(`${directory}/${file.name}`);
      return { ...file, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") };
    }),
  );
  const after = `${JSON.stringify(manifest, null, 2)}\n`;
  if (after !== before) await writeFile(path, after);
  console.log(`Synchronized ${manifest.files.length} brand asset hashes and byte counts.`);
}

// Refresh the inventory without changing any artwork or starting a browser.
if (!process.argv.includes("--manifest-only")) await renderPlacements();
await synchronizeManifest();
