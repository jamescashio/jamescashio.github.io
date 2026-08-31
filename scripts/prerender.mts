import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { CashioApp } from "../src/app";

const ROOT_MARKER = /\bid\s*=\s*(["'])root\1/gi;
const EMPTY_ROOT = /<div([^>]*\bid\s*=\s*(["'])root\2[^>]*)>\s*<\/div>/i;

export function renderCashioApp() {
  return renderToString(createElement(CashioApp));
}

export function injectPrerenderedApp(documentHtml: string, appHtml: string) {
  const rootMarkers = documentHtml.match(ROOT_MARKER) ?? [];
  const emptyRoot = documentHtml.match(EMPTY_ROOT);

  if (rootMarkers.length !== 1 || !emptyRoot) {
    throw new Error("Expected exactly one empty root marker in the built document");
  }

  return documentHtml.replace(EMPTY_ROOT, `<div${emptyRoot[1]} data-prerendered="v35">${appHtml}</div>`);
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
