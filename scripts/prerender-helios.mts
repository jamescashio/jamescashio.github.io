import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";

// Helios is already authored HTML. Inline its small stylesheet to remove a blocking round trip.
const target = "dist/index.html";
let html = await readFile(target, "utf8");
const styles = [...html.matchAll(/<link rel="stylesheet" crossorigin href="(\/assets\/[\w.-]+\.css)">/g)];
if (styles.length !== 1) throw new Error("Expected one Helios entry stylesheet");
const [link, source] = styles[0];
const css = await readFile("dist" + source, "utf8");
// V39 budget: 17 KB gzip covers the living hero and chapter styles; the dead custom cursor was removed to pay for it.
const STYLE_BUDGET_GZIP = 17000;
if (gzipSync(css).byteLength > STYLE_BUDGET_GZIP || /<\/style/i.test(css))
  throw new Error("Helios style delivery budget exceeded");
html = html.replace(link, `<style data-helios-styles="${source}">${css}</style>`);
// The root serves the current experience directly; old shared addresses normalize before paint.
const entry = (await readFile("public/helios-entry.js", "utf8")).replace(/\r\n?/g, "\n").trim();
html = html.replace('<script src="/helios-entry.js"></script>', `<script id="helios-entry-route">${entry}</script>`);
const hashes = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(
  (match) => `'sha256-${createHash("sha256").update(match[1]).digest("base64")}'`,
);
html = html.replace("script-src 'self';", `script-src 'self' ${hashes.join(" ")};`);
await writeFile(target, html);
