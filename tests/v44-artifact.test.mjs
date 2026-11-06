import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { JSDOM } from "jsdom";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (p) => readFile(path.join(root, p), "utf8");
const exists = (p) =>
  access(path.join(root, p)).then(
    () => true,
    () => false,
  );

const page = async () => new JSDOM(await read("dist/index.html")).window.document;

test("V44 Drummer is the built front door with seven stations in order", async () => {
  const document = await page();
  const receipt = JSON.parse(await read("public/v40/site-release.json"));
  assert.equal(document.title, `Doug Cashio · cAshIo · V44 ${receipt.presentation.name}`);
  assert.equal(document.querySelector('meta[name="robots"]').content, "index, follow");
  assert.equal(document.querySelector('link[rel="canonical"]').href, "https://cashio.us/");
  const stations = [...document.querySelectorAll("main > section[data-station]")].map((s) => s.id);
  assert.deepEqual(stations, ["arrival", "cinema", "worlds", "workshop", "helm", "evidence", "doug"]);
  const nav = [...document.querySelectorAll("nav.stations a")].map((a) => a.getAttribute("href"));
  assert.deepEqual(
    nav,
    stations.map((id) => `#${id}`),
  );
  assert.equal(document.querySelectorAll("h1").length, 1);
  assert.match(
    document.querySelector("h1").textContent.replace(/\s+/g, " "),
    /The machines can think\. You still decide\./,
  );
  assert.equal(document.querySelector("body > a").className, "skip", "the skip link is the first stop");
  assert.ok(document.querySelector("[data-bit-open]"), "Bit stays aboard");
  assert.ok(document.querySelector("[data-eve]"), "E.V.E. stays aboard");
  assert.ok(document.querySelector('a[href="/v43/"]'), "the previous edition stays one link away");
});

test("the built page prints the record exactly and keeps a strict policy", async () => {
  const document = await page();
  // The page is compared with the export it actually ships beside: dist/status.json.
  const status = JSON.parse(await read("dist/status.json"));
  const record = JSON.parse(document.querySelector("[data-eve]").dataset.record);
  assert.equal(record.containers.running, status.containers.running);
  assert.equal(record.backup.latestVerified, status.backup.latestVerified);
  assert.equal(record.withheld.length, document.querySelectorAll("details.withheld:first-of-type li").length);
  const figures = [...document.querySelectorAll(".figures dd strong")].map((n) => Number(n.textContent));
  assert.deepEqual(figures, [
    status.containers.running,
    status.virtualMachines.running,
    status.cluster.hostsOnline,
    status.backup.latestVerified,
  ]);
  assert.equal(document.querySelector(".observed time").getAttribute("datetime"), status.verified);
  assert.equal(
    document.querySelectorAll(".withheld li").length >= Object.keys(status.withheldReasons).length - 1,
    true,
  );
  const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]').content;
  assert.doesNotMatch(csp, /unsafe|https:|data:/);
  assert.equal(document.querySelectorAll("script:not([src])").length, 0);
  assert.equal(document.querySelectorAll("[style]").length, 0);
});

test("every image is sized and described, and every local link resolves in the build", async () => {
  const document = await page();
  for (const img of document.querySelectorAll("img")) {
    assert.ok(img.hasAttribute("alt"), img.outerHTML.slice(0, 80));
    assert.ok(img.getAttribute("width") && img.getAttribute("height"), img.outerHTML.slice(0, 80));
  }
  const local = new Set();
  for (const el of document.querySelectorAll("[href], [src], [srcset]")) {
    for (const attr of ["href", "src"]) {
      const v = el.getAttribute(attr);
      if (v && v.startsWith("/") && !v.startsWith("//")) local.add(v.split("#")[0].split("?")[0]);
    }
    const srcset = el.getAttribute("srcset");
    if (srcset) for (const part of srcset.split(",")) local.add(part.trim().split(/\s+/)[0]);
  }
  for (const url of local) {
    const file = url.endsWith("/") ? `${url}index.html` : url;
    assert.ok(await exists(path.join("dist", file)), `missing ${url}`);
  }
  for (const film of [
    "/assets/hero/cashio-trailer-720p.mp4",
    "/assets/hero/cashio-trailer-1080p.mp4",
    "/assets/zenith/portal-arrival.mp4",
  ])
    assert.ok(await exists(path.join("dist", film)), film);
});

test("visible copy carries no hyphenated words or long dashes", async () => {
  const document = await page();
  for (const el of document.querySelectorAll("script, style, noscript")) el.remove();
  const text = document.body.textContent.replace(/\s+/g, " ");
  assert.doesNotMatch(text, /[–—]/);
  const hyphenated = (text.match(/\b[\w]+-[\w-]+\b/g) || []).filter((w) => w !== "james-cashio");
  assert.deepEqual(hyphenated, []);
});

test("V43 Centauri is preserved at /v43/ and stays out of the index", async () => {
  const document = new JSDOM(await read("dist/v43/index.html")).window.document;
  assert.equal(document.title, "Doug Cashio · cAshIo · V43 Centauri");
  assert.match(document.querySelector('meta[name="robots"]').content, /noindex/);
  assert.equal(document.querySelector('link[rel="canonical"]').href, "https://cashio.us/v43/");
  assert.ok(document.querySelector("#v40-root main"), "the V43 reading edition is prerendered");
});
