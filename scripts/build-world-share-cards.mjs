// Renders the 1200 x 630 social card for each world from its existing room artwork and the site's own fonts.
// Usage: node scripts/build-world-share-cards.mjs   (writes public/v42/share/<world>.jpg)
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { chromium } from "playwright";

const root = path.resolve(".");
const asset = (relative) => pathToFileURL(path.join(root, "public", relative)).href;
const worlds = [
  [
    "starship",
    "World 01",
    "Starship lab",
    "Your ship. Your intelligence.",
    "/v40/thumbs/room-starship-1280.webp",
    // The ship sits on the left of its artwork; move it clear of the title.
    "left:360px;width:840px;object-position:22% center",
  ],
  [
    "principles",
    "World 02",
    "Principles engine",
    "Put the principles in motion.",
    "/v40/thumbs/room-principles-1280.webp",
  ],
  [
    "studios",
    "World 03",
    "The Studios",
    "A world worth getting lost in.",
    "/v40/thumbs/room-studios-threshold-1280.webp",
  ],
  ["heritage", "World 04", "Flight heritage", "Built with a test pilot’s mind.", "/v40/thumbs/room-heritage-1280.webp"],
];
const fonts = `
@font-face{font-family:Orbitron;font-weight:700;src:url(${asset("/v40/assets/orbitron-extended-2.woff2")})}
@font-face{font-family:"Exo 2";font-weight:500;src:url(${asset("/v40/assets/exo-2-extended-2.woff2")})}
@font-face{font-family:"JetBrains Mono";font-weight:400;src:url(${asset("/v40/assets/jetbrains-mono-extended-1.woff2")})}`;
const card = ([, number, title, line, art, artStyle = ""]) => `<!doctype html><meta charset="utf-8"><style>${fonts}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;background:#050608;overflow:hidden;position:relative;color:#edf4f6}
.art{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:62% center}
.veil{position:absolute;inset:0;background:linear-gradient(90deg,#050608 0%,#050608e6 30%,#05060899 52%,#05060800 78%),linear-gradient(0deg,#050608cc,#05060800 40%)}
.copy{position:absolute;left:72px;top:0;bottom:0;width:600px;display:flex;flex-direction:column;justify-content:center;gap:18px}
.mark{font:700 34px/1 Orbitron,sans-serif;letter-spacing:-.02em}
.mark .a{color:#e9b65c}.mark .i{color:#22d3ee}
.num{font:400 18px/1 "JetBrains Mono",monospace;letter-spacing:.18em;text-transform:uppercase;color:#e9b65c;margin-top:36px}
h1{font:700 64px/1.02 Orbitron,sans-serif;letter-spacing:-.01em}
p{font:500 28px/1.3 "Exo 2",sans-serif;color:#cfe3e8;max-width:520px}
.rule{position:absolute;left:72px;bottom:56px;display:flex;gap:14px;align-items:center;font:400 16px/1 "JetBrains Mono",monospace;letter-spacing:.14em;text-transform:uppercase;color:#9fc7d0}
.rule i{width:44px;height:2px;background:#e9b65c}
</style><img class="art" src="${asset(art)}" style="${artStyle}"><div class="veil"></div>
<div class="copy"><div class="mark">c<span class="a">A</span>sh<span class="i">I</span>o</div><div class="num">${number} of 04</div><h1>${title}</h1><p>${line}</p></div>
<div class="rule"><i></i>cashio.us · Human in command</div>`;

const browser = await chromium.launch({
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" }),
  headless: true,
  // The card page reads the local artwork and fonts from disk.
  args: ["--allow-file-access-from-files"],
});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await mkdir("public/v42/share", { recursive: true });
const scratch = await mkdtemp(path.join(os.tmpdir(), "world-cards-"));
for (const world of worlds) {
  const file = path.join(scratch, `${world[0]}.html`);
  await writeFile(file, card(world));
  await page.goto(pathToFileURL(file).href, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const ready = await page.evaluate(() => ({
    art: document.querySelector(".art").naturalWidth,
    fonts: [...document.fonts].filter((f) => f.status === "loaded").length,
  }));
  if (!ready.art || ready.fonts < 3) throw new Error(`${world[0]} card is missing artwork or fonts`);
  const jpg = await page.screenshot({ type: "jpeg", quality: 82 });
  await writeFile(`public/v42/share/${world[0]}.jpg`, jpg);
  console.log(`public/v42/share/${world[0]}.jpg`, jpg.length);
}
await browser.close();
