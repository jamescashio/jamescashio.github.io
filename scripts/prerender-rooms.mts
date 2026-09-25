import { mkdir, readFile, writeFile } from "node:fs/promises";
import { JSDOM } from "jsdom";

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
  notice.innerHTML = `<a href="/#rooms">← Back to the four rooms</a><h1 class="syne fs-32">${title}</h1><p id="reading-mode">Controls are inactive in this reading edition. It shows the artwork and one example state. Open the interactive room to change the inputs and explore the results.</p><a class="btn gold" href="/#${id}">Open the interactive room →</a>`;
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
  }
  for (const node of main.querySelectorAll("[data-count]")) node.textContent = node.getAttribute("data-count");
  for (const details of main.querySelectorAll("details")) details.open = true;
  doc.body.append(notice, main);
  await mkdir(`dist/rooms/${id}`, { recursive: true });
  await writeFile(`dist/rooms/${id}/index.html`, "<!doctype html>\n" + doc.documentElement.outerHTML + "\n");
}
const sitemap = await readFile("dist/sitemap.xml", "utf8");
await writeFile(
  "dist/sitemap.xml",
  sitemap.replace(
    "</urlset>",
    roomIds.map((id) => `<url><loc>https://cashio.us/rooms/${id}/</loc></url>`).join("\n") + "\n</urlset>",
  ),
);
console.log("Prerendered four room reading editions from their shared authored content.");
