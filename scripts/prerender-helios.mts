import { readFile, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";

// Helios is already authored HTML. Inline its small stylesheet to remove a blocking round trip.
const target = "dist/v38/index.html";
let html = await readFile(target, "utf8");
const styles = [...html.matchAll(/<link rel="stylesheet" crossorigin href="(\/assets\/[\w.-]+\.css)">/g)];
if (styles.length !== 1) throw new Error("Expected one Helios entry stylesheet");
const [link, source] = styles[0];
const css = await readFile("dist" + source, "utf8");
if (gzipSync(css).byteLength > 15000 || /<\/style/i.test(css)) throw new Error("Helios style delivery budget exceeded");
html = html.replace(link, `<style data-helios-styles="${source}">${css}</style>`);
await writeFile(target, html);
