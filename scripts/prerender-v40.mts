import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { JSDOM } from "jsdom";

const environment = new JSDOM("<!doctype html><html><body></body></html>");
Object.assign(globalThis, { window: environment.window, document: environment.window.document });
// The reading edition uses the compact composition so it remains readable on every screen.
Object.defineProperty(environment.window, "innerWidth", { value: 390 });
const { V40Page } = await import("../src/v40/page.jsx");
const markup = renderToStaticMarkup(
  React.createElement(V40Page, {
    heroFilm: "Orbital arrival",
    scanlines: true,
    starDensity: 220,
    techDetail: false,
  }),
);
const dom = new JSDOM(`<body>${markup}</body>`);
for (const control of dom.window.document.querySelectorAll("button,input,select,textarea")) {
  control.setAttribute("disabled", "");
  control.setAttribute("aria-describedby", "reading-notice");
}
const rules = new Map<string, string>();
for (const element of dom.window.document.querySelectorAll("[style]")) {
  const declarations = element.getAttribute("style")!;
  const name = "v40-s-" + createHash("sha256").update(declarations).digest("hex").slice(0, 12);
  rules.set(name, declarations);
  element.classList.add(name);
  element.removeAttribute("style");
}
const fallbackCss = [...rules].map(([name, declarations]) => `.${name}{${declarations}}`).join("\n");
const filename = "v40-reading-" + createHash("sha256").update(fallbackCss).digest("hex").slice(0, 12) + ".css";
await writeFile("dist/assets/" + filename, fallbackCss);
let html = await readFile("dist/index.html", "utf8");
html = html.replace('<div id="v40-root"></div>', `<div id="v40-root">${dom.window.document.body.innerHTML}</div>`);
html = html.replace("</head>", `<link rel="stylesheet" href="/assets/${filename}"></head>`);
html = html.replace(
  "The reading edition is being prepared.",
  "The page above remains readable without JavaScript. Interactive demonstrations need JavaScript.",
);
await writeFile("dist/index.html", html);
console.log("V40 reading edition created with external CSS and the existing strict security policy.");
