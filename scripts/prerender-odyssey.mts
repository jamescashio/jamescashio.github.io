import { readFile, writeFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { OdysseyApp } from "../src/odyssey/app";

const marker = '<div id="odyssey-root"></div>';
const content = `<div id="odyssey-root" data-prerendered="odyssey">${renderToString(createElement(OdysseyApp))}</div>`;
for (const target of ["dist/index.html", "dist/odyssey.html"]) {
  const document = await readFile(target, "utf8");
  if (!document.includes(marker)) throw new Error(`Odyssey prerender root missing in ${target}`);
  await writeFile(target, document.replace(marker, content));
}
