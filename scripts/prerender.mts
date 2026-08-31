import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { CashioApp } from "../src/app";

const DIV_OPENING = /<div\b([^>]*)>/gi;
const EMPTY_DIV = /<div\b([^>]*)>\s*<\/div>/gi;
const EXACT_ROOT_ID = /(?:^|\s)id\s*=\s*(["'])root\1(?=\s|$)/i;

export function renderCashioApp() {
  return renderToString(createElement(CashioApp));
}

export function injectPrerenderedApp(documentHtml: string, appHtml: string) {
  const rootMarkers = [...documentHtml.matchAll(DIV_OPENING)].filter((match) => EXACT_ROOT_ID.test(match[1]));
  const emptyRoots = [...documentHtml.matchAll(EMPTY_DIV)].filter((match) => EXACT_ROOT_ID.test(match[1]));

  if (rootMarkers.length !== 1 || emptyRoots.length !== 1) {
    throw new Error("Expected exactly one empty root marker in the built document");
  }

  return documentHtml.replace(EMPTY_DIV, (match, attributes: string) =>
    EXACT_ROOT_ID.test(attributes) ? `<div${attributes} data-prerendered="v35">${appHtml}</div>` : match,
  );
}

export async function prerenderDist(distIndex = resolve("dist/index.html")) {
  const documentHtml = await readFile(distIndex, "utf8");
  const prerenderedHtml = injectPrerenderedApp(documentHtml, renderCashioApp());
  await writeFile(distIndex, prerenderedHtml, "utf8");
  return prerenderedHtml;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  await prerenderDist();
}
