import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { computeWorldOutcome } from "../src/odyssey/sovereign-model";
import { PILOTS } from "../src/helios/heritage-data.js";
import { PRINCIPLES } from "../src/helios/principles-data.js";
import { frontDoorHref } from "../src/v44/legacy.ts";

/** Static reading pages share the exact authored content used by the deferred interactive rooms. */
const root = new JSDOM(await readFile("dist/v39/index.html", "utf8")).window.document;
const versions = JSON.parse(await readFile("dist/v38/asset-versions.json", "utf8"));
// Reading editions use the same room stylesheet, without needing JavaScript.
const roomStyles = (await readdir("dist/assets")).filter((name) => /^room-content-[\w-]+\.css$/.test(name));
if (roomStyles.length !== 1) throw new Error("Expected one deferred room stylesheet");
const roomIds = ["starship", "principles", "studios", "heritage"];
const roomEntries = (await readdir("dist/assets")).filter((name) => /^v40Rooms-[\w-]+\.js$/.test(name));
if (roomEntries.length !== 1) throw new Error("Expected one V40 room entry");
for (const id of roomIds) {
  const source = await readFile(`src/helios/rooms/${id}.html`, "utf8");
  const doc = new JSDOM("<!doctype html><html lang='en'><head></head><body></body></html>").window.document;
  doc.documentElement.dataset.room = id;
  doc.documentElement.className = "motion-off";
  doc.body.className = "static-room";
  for (const element of root.head.querySelectorAll(
    "meta,link[rel='stylesheet'],link[rel='icon'],link[rel='preload']",
  )) {
    if (/^(og:|twitter:)/.test(element.getAttribute("property") || element.getAttribute("name") || "")) continue;
    // A room is set in the front door's faces, so it preloads those and not the older edition's.
    if (element.getAttribute("as") === "font") continue;
    doc.head.append(element.cloneNode(true));
  }
  for (const href of ["/fonts/oxanium-latin-variable.woff2", "/fonts/exo2-500.woff2"]) {
    const font = doc.createElement("link");
    font.rel = "preload";
    font.href = href;
    font.setAttribute("as", "font");
    font.type = "font/woff2";
    font.setAttribute("crossorigin", "");
    doc.head.append(font);
  }
  const roomStyle = doc.createElement("link");
  roomStyle.rel = "stylesheet";
  roomStyle.href = "/assets/" + roomStyles[0];
  doc.head.append(roomStyle);
  const title = root.querySelector(`#${id}`)!.getAttribute("data-room-title")!;
  doc.title = `${title} · cAshIo`;
  doc
    .querySelector('meta[name="description"]')!
    .setAttribute("content", `Read ${title}, from Doug Cashio's hobby lab.`);
  const canonical = doc.createElement("link");
  canonical.rel = "canonical";
  canonical.href = `https://cashio.us/rooms/${id}/`;
  doc.head.append(canonical);
  appendShareCard(doc, id, title);
  const notice = doc.createElement("header");
  notice.className = "room-bar";
  // The same header as the front door: its mark and wordmark, then the world number, title, a quiet mode link and motion control.
  notice.innerHTML = `<div class="room-bar-inner"><div class="room-bar-lead"><a class="room-wordmark" href="/" aria-label="Doug Cashio, back to the front door"><img src="/brand/platinum/icon.svg?v=c-red-top-20261105" width="30" height="30" alt=""><img class="room-wordmark-word" src="/brand/platinum/wordmark.svg" width="104" height="24" alt=""></a><a class="room-back" href="${frontDoorHref("#rooms")}">← Back to the four rooms</a></div><div class="room-bar-title"><span class="room-world">World ${String(roomIds.indexOf(id) + 1).padStart(2, "0")} of 04</span><h1 class="display room-title">${title}</h1><p id="reading-mode" class="room-status">Controls are inactive in this reading edition. It shows the artwork, one example state and all of the text. Open the interactive room to change the inputs and explore the results.</p></div><div class="room-bar-actions"><a class="room-mode-link room-mode-primary" href="/rooms/${id}/interactive/">Open the interactive room →</a></div></div>`;
  const main = doc.createElement("main");
  main.innerHTML = source;
  for (const image of main.querySelectorAll("img")) {
    const version = versions[image.getAttribute("src") || ""];
    if (version) image.setAttribute("src", version.url);
  }
  const localAnchors = new Set([...main.querySelectorAll("[id]")].map((node) => node.id));
  for (const link of main.querySelectorAll("a[href^='#']")) {
    const href = link.getAttribute("href")!;
    if (!localAnchors.has(href.slice(1))) link.setAttribute("href", frontDoorHref(href));
  }
  for (const control of main.querySelectorAll("button,input,select,textarea")) {
    if (!control.hasAttribute("disabled")) control.setAttribute("data-reading-disabled", "");
    control.setAttribute("disabled", "");
    control.setAttribute("aria-describedby", "reading-mode");
  }
  // A reading page has no changing results to announce.
  for (const node of main.querySelectorAll("[aria-live],[role='status'],[role='log']")) {
    node.removeAttribute("aria-live");
    node.removeAttribute("role");
    node.removeAttribute("aria-atomic");
  }
  for (const node of main.querySelectorAll("[tabindex],[role='button']")) {
    node.removeAttribute("tabindex");
    node.removeAttribute("role");
    // Without its role, a generic element may not carry a name or widget state (ARIA prohibits it).
    if (!node.matches("a,button,input,select,textarea"))
      for (const attribute of [
        "aria-label",
        "aria-roledescription",
        "aria-valuenow",
        "aria-valuetext",
        "aria-valuemin",
        "aria-valuemax",
      ])
        node.removeAttribute(attribute);
  }
  for (const node of main.querySelectorAll("[data-count]")) node.textContent = node.getAttribute("data-count");
  const exampleStyles = id === "starship" ? renderStarshipExample(main) : "";
  if (id === "heritage")
    placeBeforeEnd(
      main,
      id,
      readingList(
        doc,
        "All four lessons",
        Object.values(PILOTS).map((pilot) => [pilot.kick, pilot.head, pilot.body, pilot.source, pilot.sourceLabel]),
      ),
    );
  if (id === "principles")
    placeBeforeEnd(
      main,
      id,
      readingList(
        doc,
        "All three principles",
        PRINCIPLES.map((principle) => [`${principle.n} / ${principle.tag}`, principle.title, principle.body]),
      ),
    );
  for (const details of main.querySelectorAll("details")) details.open = true;
  if (exampleStyles) {
    // A reading edition runs no script to draw its example bars, and its policy refuses style attributes,
    // so one style block carries their widths and the policy admits exactly that block by its hash.
    const style = doc.createElement("style");
    style.textContent = exampleStyles;
    doc.head.append(style);
    const policy = doc.querySelector('meta[http-equiv="Content-Security-Policy"]')!;
    const content = policy.getAttribute("content")!;
    const hash = createHash("sha256").update(exampleStyles).digest("base64");
    if (!content.includes("style-src 'self';")) throw new Error("Reading edition policy has an unexpected style-src");
    policy.setAttribute("content", content.replace("style-src 'self';", `style-src 'self' 'sha256-${hash}';`));
  }
  doc.body.append(notice, main);
  await mkdir(`dist/rooms/${id}`, { recursive: true });
  await writeFile(`dist/rooms/${id}/index.html`, "<!doctype html>\n" + doc.documentElement.outerHTML + "\n");
  const interactive = doc.cloneNode(true) as Document;
  // Restore the authored controls, roles and live regions; the reading copy deliberately removes them.
  const interactiveMain = interactive.querySelector("main")!;
  interactiveMain.innerHTML = source;
  for (const link of interactiveMain.querySelectorAll("a[href^='#']")) {
    const href = link.getAttribute("href")!;
    if (!localAnchors.has(href.slice(1))) link.setAttribute("href", frontDoorHref(href));
  }
  for (const image of interactiveMain.querySelectorAll("img")) {
    const version = versions[image.getAttribute("src") || ""];
    if (version) image.setAttribute("src", version.url);
  }
  for (const control of interactiveMain.querySelectorAll("button,input,select,textarea")) {
    if (control.hasAttribute("disabled")) continue;
    control.setAttribute("data-reading-disabled", "");
    control.setAttribute("disabled", "");
  }
  interactive.querySelector("#reading-mode")!.textContent =
    "Interactive room. Controls require JavaScript. The artwork and text remain available below.";
  const opener = interactive.querySelector(`header a[href="/rooms/${id}/interactive/"]`)!;
  opener.setAttribute("href", `/rooms/${id}/`);
  opener.classList.remove("room-mode-primary");
  opener.textContent = "Reading edition";
  const entry = interactive.createElement("script");
  entry.type = "module";
  entry.src = "/assets/" + roomEntries[0];
  interactive.body.append(entry);
  const roomCss = (await readdir("dist/assets")).filter((name) => /^v40Rooms-[\w-]+\.css$/.test(name));
  for (const name of roomCss) {
    const link = interactive.createElement("link");
    link.rel = "stylesheet";
    link.href = "/assets/" + name;
    interactive.head.append(link);
  }
  // After every stylesheet: the browser finishes them before it starts the body, so it always knows the room
  // takes part in the passage from a world card. See public/passage.js.
  const passage = interactive.createElement("script");
  passage.src = "/passage.js";
  interactive.head.append(passage);
  await mkdir(`dist/rooms/${id}/interactive`, { recursive: true });
  await writeFile(
    `dist/rooms/${id}/interactive/index.html`,
    "<!doctype html>\n" + interactive.documentElement.outerHTML + "\n",
  );
}
/** Each world gets its own social card, so a shared link previews that world rather than a blank card. */
function appendShareCard(doc: Document, id: string, title: string) {
  const shareCards: Record<string, string> = {
    starship: "Step aboard. Trace twelve requests, cut the cloud link and see which decisions stay yours.",
    principles: "Turn an instrument and watch a principle change a real decision.",
    studios: "Light, signatures and short films from Doug Cashio's workshop. Films start muted.",
    heritage: "Four aviation pioneers and the test pilot questions behind the workshop.",
  };
  const properties: Array<[string, string, string]> = [
    ["property", "og:type", "website"],
    ["property", "og:site_name", "cAshIo"],
    ["property", "og:title", `${title} · cAshIo`],
    ["property", "og:description", shareCards[id]],
    ["property", "og:url", `https://cashio.us/rooms/${id}/interactive/`],
    ["property", "og:image", `https://cashio.us/v42/share/${id}.jpg`],
    ["property", "og:image:width", "1200"],
    ["property", "og:image:height", "630"],
    ["property", "og:image:alt", `${title}, a world in Doug Cashio's cAshIo workshop.`],
    ["name", "twitter:card", "summary_large_image"],
    ["name", "twitter:title", `${title} · cAshIo`],
    ["name", "twitter:description", shareCards[id]],
    ["name", "twitter:image", `https://cashio.us/v42/share/${id}.jpg`],
  ];
  for (const [key, name, content] of properties) {
    const meta = doc.createElement("meta");
    meta.setAttribute(key, name);
    meta.setAttribute("content", content);
    doc.head.append(meta);
  }
}

/** The full list sits before the room's closing links, so every page still ends with its way back. */
function placeBeforeEnd(main: Element, id: string, section: Element) {
  const end = main.querySelector(`#${id} .room-end`);
  if (end) end.before(section);
  else main.querySelector(`#${id}`)!.append(section);
}

/** Without JavaScript the picker shows one entry; the reading edition also lists every entry in full. */
function readingList(doc: Document, heading: string, items: string[][]) {
  const section = doc.createElement("section");
  section.className = "wrap stack sg-16 reading-all";
  const title = doc.createElement("h2");
  title.className = "display fs-28-36";
  title.textContent = heading;
  const grid = doc.createElement("div");
  grid.className = "grid-box cols-fit-200 gap-12";
  for (const [kicker, head, body, href, label] of items) {
    const card = doc.createElement("article");
    card.className = "soft stack p-16 sg-6";
    for (const [tag, className, text] of [
      ["span", "mono c-gd", kicker],
      ["strong", "", head],
      ["p", "muted copy-note m-0", body],
    ]) {
      const node = doc.createElement(tag);
      if (className) node.className = className;
      node.textContent = text;
      card.append(node);
    }
    if (href) {
      const link = doc.createElement("a");
      link.href = href;
      link.textContent = `${label} ↗`;
      card.append(link);
    }
    grid.append(card);
  }
  section.append(title, grid);
  return section;
}

/**
 * The reading edition shows the interactive room's default example: mixed sensitivity, connected, private egress off.
 * Counts come from the same shared model the interactive room uses, so the two can never disagree.
 */
function renderStarshipExample(main: Element): string {
  const example = { sensitivity: "mixed", connected: true, allowPrivateEgress: false } as const;
  const selected = "hybrid";
  const names = { sovereign: "Sovereign / local", hybrid: "Hybrid", cloud: "Cloud" } as const;
  const rows = main.querySelector("#cmp-rows")!;
  rows.replaceChildren();
  for (const architecture of ["sovereign", "hybrid", "cloud"] as const) {
    const outcome = computeWorldOutcome({ ...example, architecture });
    const row = main.ownerDocument.createElement("div");
    row.className = architecture === selected ? "cmp on" : "cmp";
    const label = main.ownerDocument.createElement("strong");
    label.textContent = names[architecture];
    row.append(label);
    for (const value of [outcome.local, outcome.cloud, outcome.held]) {
      const cell = main.ownerDocument.createElement("span");
      cell.textContent = String(value);
      row.append(cell);
    }
    rows.append(row);
  }
  // The request bars are drawn by script in the interactive room; give the reading edition the same proportions.
  const shown = computeWorldOutcome({ ...example, architecture: selected });
  const rules = [];
  for (const [key, value] of [
    ["local", shown.local],
    ["cloud", shown.cloud],
    ["held", shown.held],
  ] as const) {
    rules.push(`#b-${key}{transform:scaleX(${value / 12})}`);
    main.querySelector(`#n-${key}`)!.textContent = String(value);
  }
  return rules.join("");
}

// Start from the authored index so regenerating a reading edition stays idempotent.
const sitemap = await readFile("public/sitemap.xml", "utf8");
// Reading editions share the home page's release date.
const lastmod = sitemap.match(/<loc>https:\/\/cashio\.us\/<\/loc>\s*<lastmod>([\d-]+)<\/lastmod>/)?.[1];
await writeFile(
  "dist/sitemap.xml",
  sitemap.replace(
    "</urlset>",
    roomIds
      .map(
        (id) =>
          `  <url>\n    <loc>https://cashio.us/rooms/${id}/</loc>\n` +
          (lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : "") +
          "  </url>\n",
      )
      .join("") + "</urlset>",
  ),
);
console.log("Prerendered four room reading editions from their shared authored content.");
