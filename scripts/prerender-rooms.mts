import { mkdir, readFile, writeFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { computeWorldOutcome } from "../src/odyssey/sovereign-model";
import { PILOTS } from "../src/helios/heritage-data.js";
import { PRINCIPLES } from "../src/helios/principles-data.js";

/** Static reading pages share the exact authored content used by the deferred interactive rooms. */
const root = new JSDOM(await readFile("dist/index.html", "utf8")).window.document;
const versions = JSON.parse(await readFile("dist/v38/asset-versions.json", "utf8"));
const roomIds = ["starship", "principles", "studios", "heritage"];
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
    doc.head.append(element.cloneNode(true));
  }
  const title = root.querySelector(`#${id}`)!.getAttribute("data-room-title")!;
  doc.title = `${title} · cAshIo`;
  doc
    .querySelector('meta[name="description"]')!
    .setAttribute("content", `Read ${title}, from Doug Cashio's after-hours hobby lab.`);
  const canonical = doc.createElement("link");
  canonical.rel = "canonical";
  canonical.href = `https://cashio.us/rooms/${id}/`;
  doc.head.append(canonical);
  const notice = doc.createElement("header");
  notice.className = "wrap stack p-22-30 sg-16";
  notice.innerHTML = `<a href="/#rooms">← Back to the four rooms</a><h1 class="syne fs-32">${title}</h1><p id="reading-mode">Controls are inactive in this reading edition. It shows the artwork, one example state and all of the text. Open the interactive room to change the inputs and explore the results.</p><a class="btn gold" href="/#${id}">Open the interactive room →</a>`;
  const main = doc.createElement("main");
  main.innerHTML = source;
  for (const image of main.querySelectorAll("img")) {
    const version = versions[image.getAttribute("src") || ""];
    if (version) image.setAttribute("src", version.url);
  }
  for (const link of main.querySelectorAll("a[href^='#']")) link.setAttribute("href", "/" + link.getAttribute("href"));
  for (const control of main.querySelectorAll("button,input,select,textarea")) {
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
  if (id === "starship") renderStarshipExample(main);
  if (id === "heritage")
    main.querySelector(`#${id}`)!.append(
      readingList(
        doc,
        "All four lessons",
        Object.values(PILOTS).map((pilot) => [pilot.kick, pilot.head, pilot.body, pilot.source, pilot.sourceLabel]),
      ),
    );
  if (id === "principles")
    main.querySelector(`#${id}`)!.append(
      readingList(
        doc,
        "All three principles",
        PRINCIPLES.map((principle) => [`${principle.n} / ${principle.tag}`, principle.title, principle.body]),
      ),
    );
  for (const details of main.querySelectorAll("details")) details.open = true;
  doc.body.append(notice, main);
  await mkdir(`dist/rooms/${id}`, { recursive: true });
  await writeFile(`dist/rooms/${id}/index.html`, "<!doctype html>\n" + doc.documentElement.outerHTML + "\n");
}
/** Without JavaScript the picker shows one entry; the reading edition also lists every entry in full. */
function readingList(doc: Document, heading: string, items: string[][]) {
  const section = doc.createElement("section");
  section.className = "wrap stack sg-16 reading-all";
  const title = doc.createElement("h2");
  title.className = "syne fs-28-36";
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
function renderStarshipExample(main: Element) {
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
  for (const [key, value] of [
    ["local", shown.local],
    ["cloud", shown.cloud],
    ["held", shown.held],
  ] as const) {
    (main.querySelector(`#b-${key}`) as HTMLElement).style.transform = `scaleX(${value / 12})`;
    main.querySelector(`#n-${key}`)!.textContent = String(value);
  }
}

const sitemap = await readFile("dist/sitemap.xml", "utf8");
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
