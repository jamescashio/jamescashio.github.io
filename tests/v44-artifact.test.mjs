import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
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

test("V44 Navigator is the built Drummer front door with seven stations in order", async () => {
  const document = await page();
  const receipt = JSON.parse(await read("public/v40/site-release.json"));
  assert.equal(document.title, `Doug Cashio · cAshIo · Local AI workshop · V44 ${receipt.presentation.name}`);
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

test("the contact card shows the signature without its painted ground, so no box or oval reads around it", async () => {
  const document = new JSDOM(await read("dist/index.html")).window.document;
  const signature = document.querySelector("#contact img.signature");
  assert.equal(signature.getAttribute("src"), "/brand/platinum/signature-clear-840.webp");
  assert.match(
    signature.getAttribute("srcset"),
    /signature-clear-420\.webp 420w, \/brand\/platinum\/signature-clear-840\.webp 840w/,
  );
  for (const [width, height, budget] of [
    [420, 194, 50_000],
    [840, 387, 130_000],
  ]) {
    const bytes = await readFile(new URL(`../dist/brand/platinum/signature-clear-${width}.webp`, import.meta.url));
    // An extended WebP whose header says it carries alpha, at the approved artwork's own shape.
    assert.equal(bytes.subarray(12, 16).toString("latin1"), "VP8X");
    assert.equal(bytes[20] & 0x10, 0x10, "the file carries transparency");
    assert.equal(1 + bytes.readUIntLE(24, 3), width);
    assert.equal(1 + bytes.readUIntLE(27, 3), height);
    assert.ok(bytes.length < budget, `${width} px clear signature is ${bytes.length} bytes`);
  }
  // The old treatment hid the ground with a blend and an oval mask; neither is needed now.
  const styles = await Promise.all(
    [...document.querySelectorAll('link[rel="stylesheet"]')].map((link) => read(`dist${link.getAttribute("href")}`)),
  );
  const rule = styles.join("\n").match(/\.signature\{[^}]*\}/)?.[0] ?? "";
  assert.ok(rule, "the signature has its rule");
  assert.doesNotMatch(rule, /mask|mix-blend-mode/);
});

test("a world card and its room share a name, and the passage script comes after the styles that opt in", async () => {
  const document = new JSDOM(await read("dist/index.html")).window.document;
  const door = (
    await Promise.all(
      [...document.querySelectorAll('link[rel="stylesheet"]')].map((link) => read(`dist${link.getAttribute("href")}`)),
    )
  ).join("\n");
  const rooms = ["starship", "principles", "studios", "heritage"];
  assert.deepEqual(
    [...document.querySelectorAll(".world[data-world]")].map((card) => card.dataset.world),
    rooms,
  );
  // Both pages opt in, and only where the visitor has not asked for less motion.
  const optIn = /@media ?\(prefers-reduced-motion:\s*no-preference\)\{@view-transition\{navigation:auto\}\}/;
  assert.match(door, optIn);
  for (const room of rooms) {
    const card = document.querySelector(`.world[data-world="${room}"]`);
    assert.equal(card.querySelector("a").getAttribute("href"), `/rooms/${room}/interactive/`);
    assert.ok(door.includes(`.world[data-world=${room}]{view-transition-name:world-${room}}`), `${room} card is named`);
    for (const edition of ["", "interactive/"]) {
      const page = new JSDOM(await read(`dist/rooms/${room}/${edition}index.html`)).window.document;
      const sheets = await Promise.all(
        [...page.querySelectorAll('link[rel="stylesheet"]')].map((link) => read(`dist${link.getAttribute("href")}`)),
      );
      const css = sheets.join("\n");
      if (edition) {
        assert.match(css, optIn);
        assert.ok(
          css.includes(`html[data-room=${room}] main>section.room{view-transition-name:world-${room}}`),
          `${room} interactive room is named`,
        );
      } else {
        // A reading edition runs no script, so it could not end a passage toward a page that takes no part.
        // It takes no part itself and simply opens.
        assert.doesNotMatch(css, /view-transition/, `${room} reading edition takes no part in the passage`);
      }
      // A room is set in the front door's faces and preloads those, not the older edition's.
      assert.match(css, /--display:\s*"Cashio Display"/);
      assert.match(css, /font-family:Cashio Display;src:url\(\/fonts\/oxanium-latin-variable\.woff2\)/);
      const fonts = [...page.querySelectorAll('link[rel="preload"][as="font"]')].map((link) =>
        link.getAttribute("href"),
      );
      assert.deepEqual(fonts, ["/fonts/oxanium-latin-variable.woff2", "/fonts/exo2-500.woff2"]);
    }
  }
  // The browser reads the opt in as it starts the body. A script in the head makes it finish the stylesheets
  // first; before them, or in the body, it would not. So the passage script is the last thing in the head.
  const heads = [
    document,
    ...(await Promise.all(rooms.map((room) => read(`dist/rooms/${room}/interactive/index.html`)))),
  ]
    .map((page) => (typeof page === "string" ? new JSDOM(page).window.document : page))
    .map((page) => page.head);
  for (const head of heads) {
    const last = head.lastElementChild;
    assert.equal(last.tagName, "SCRIPT");
    assert.equal(last.getAttribute("src"), "/passage.js");
    for (const attribute of ["async", "defer", "type"]) assert.equal(last.hasAttribute(attribute), false);
    assert.equal(head.querySelectorAll('script[src="/passage.js"]').length, 1);
    assert.ok(head.querySelector('link[rel="stylesheet"]'));
  }
  const passage = await read("dist/passage.js");
  // It ends a passage toward any page but the front door and the interactive rooms, and any passage for a
  // paused visitor, and it answers for the promise an ended passage rejects.
  assert.match(passage, /addEventListener\("pageswap"/);
  assert.ok(passage.includes(String.raw`path === "/" || /^\/rooms\/[a-z]+\/interactive\/$/.test(path)`));
  assert.match(passage, /getItem\("cashio-v40-motion"\) === "off"/);
  assert.match(passage, /ready\.catch\(function \(\) \{\}\);\s*passage\.skipTransition\(\)/);
  // Every page that opts in loads it: a page whose stylesheets opt in without the script would hand a
  // passage to pages that take no part.
  const optsIn = new Map();
  const pages = (await readdir("dist", { recursive: true })).filter((name) => name.endsWith(".html"));
  assert.ok(pages.length > 20);
  let takingPart = 0;
  for (const name of pages) {
    const page = new JSDOM(await read(`dist/${name}`)).window.document;
    let opts = false;
    for (const link of page.querySelectorAll('link[rel="stylesheet"][href^="/assets/"]')) {
      const href = link.getAttribute("href");
      if (!optsIn.has(href)) optsIn.set(href, /@view-transition/.test(await read(`dist${href}`)));
      opts ||= optsIn.get(href);
    }
    for (const style of page.querySelectorAll("style")) opts ||= /@view-transition/.test(style.textContent);
    if (!opts) continue;
    takingPart += 1;
    assert.ok(page.head.querySelector('script[src="/passage.js"]'), `${name} opts in without the passage script`);
  }
  assert.equal(takingPart, 5, "the front door and the four interactive rooms");
  // The jump: the front door ends on a screen of the world's light and the room opens out of the same one,
  // so both hold the same four lights. The room's half is marked by the passage script and styled only in
  // the interactive rooms' own sheet.
  const jump = await read("src/v44/jump.ts");
  const roomPassage = await read("src/v40/room-passage.css");
  for (const room of rooms) {
    const light = jump.match(new RegExp(`${room}: \\[([\\d.]+), ([\\d.]+), ([\\d.]+)\\]`));
    assert.ok(light, `${room} has a light on the front door`);
    const rgb = light
      .slice(1)
      .map((v) => Math.round(Number(v) * 255))
      .join(" ");
    assert.ok(
      roomPassage.includes(`html[data-room="${room}"] {\n  --jump-rgb: ${rgb};`),
      `${room} keeps its light, ${rgb}`,
    );
  }
  assert.equal(document.querySelectorAll("body > .fold[aria-hidden='true']").length, 1);
  assert.match(passage, /getItem\("cashio-jump"\)/);
  assert.match(passage, /removeItem\("cashio-jump"\)/);
  assert.match(passage, /hasAttribute\("data-jump"\)/);
  assert.match(jump, /sessionStorage\.setItem\(ARRIVING, world\)/);
  assert.match(jump, /const ARRIVING = "cashio-jump";/);
  // A reading edition carries no script at all.
  for (const room of rooms)
    assert.equal(new JSDOM(await read(`dist/rooms/${room}/index.html`)).window.document.scripts.length, 0);
  // Paused motion ends a passage at once, and the widest screens get one more step.
  assert.match(door, /html\[data-motion=off\]::view-transition-group\(\*\)/);
  assert.match(door, /@media ?\(min-width:\s*3200px\)\{:root\{--frame-max:\s*2040px\}/);
});
