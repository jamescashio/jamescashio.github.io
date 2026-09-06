import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { OdysseyApp } from "../src/odyssey/app";

const marker = '<div id="odyssey-root"></div>';
// Preserve the early bookmark redirect without a blocking network round trip.
// CSP permits only these exact, owned bytes; arbitrary inline scripts remain blocked.
const legacyRoute = (await readFile("public/legacy-route.js", "utf8")).replace(/\r\n?/g, "\n").trim();
const legacyHash = createHash("sha256").update(legacyRoute).digest("base64");
const legacyMarker = '<script src="/legacy-route.js"></script>';
const content = `<div id="odyssey-root" data-prerendered="odyssey">${renderToString(createElement(OdysseyApp))}</div>`;
for (const target of ["dist/index.html", "dist/odyssey.html"]) {
  let document = await readFile(target, "utf8");
  if (!document.includes(marker)) throw new Error(`Odyssey prerender root missing in ${target}`);
  if (!document.includes(legacyMarker) || !document.includes("script-src 'self';"))
    throw new Error(`Odyssey early bookmark route or CSP missing in ${target}`);
  // The first view can paint from one response. Dialog styles remain separate lazy assets.
  const styleLinks = [...document.matchAll(/<link rel="stylesheet" crossorigin href="(\/assets\/[\w.-]+\.css)">/g)];
  if (styleLinks.length !== 1) throw new Error(`Expected one initial Odyssey stylesheet in ${target}`);
  const [styleLink, stylePath] = styleLinks[0];
  const styles = await readFile(`dist${stylePath}`, "utf8");
  // Lightwake trades obsolete rules for new controls; cap both parsed and compressed bytes.
  if (Buffer.byteLength(styles) > 195_000 || gzipSync(styles).byteLength > 42_000 || /<\/style/i.test(styles))
    throw new Error(`Initial Odyssey styles exceed the inline delivery contract in ${target}`);
  document = document.replace(styleLink, `<style data-odyssey-styles="${stylePath}">${styles}</style>`);
  await writeFile(
    target,
    document
      .replace(marker, content)
      .replace(legacyMarker, `<script id="legacy-bookmark-route">${legacyRoute}</script>`)
      .replace("script-src 'self';", `script-src 'self' 'sha256-${legacyHash}';`),
  );
}
