import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import vm from "node:vm";
import ts from "typescript";
import { JSDOM } from "jsdom";

const html = await readFile(new URL("../public/storm/index.html", import.meta.url), "utf8");
const script = [...new JSDOM(html).window.document.scripts]
  .map((node) => node.textContent)
  .find((text) => text.includes("function renderDaily("));
const tree = ts.createSourceFile("storm.js", script, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
function find(predicate) {
  let found;
  function visit(node) {
    if (!found && predicate(node)) found = node;
    if (!found) ts.forEachChild(node, visit);
  }
  visit(tree);
  assert.ok(found, "the real storm renderer is present");
  return found.getText(tree);
}
const escapeCode = find((node) => ts.isVariableDeclaration(node) && node.name.getText(tree) === "esc");
const esc = vm.runInNewContext("(" + escapeCode.slice(escapeCode.indexOf("=") + 1) + ")");
const gnum = (value) => parseInt(String(value || "0"), 10) || 0;

test("weather forecast strings remain text, including temperatures and markup-shaped labels", () => {
  const doc = new JSDOM('<div id="days"></div>').window.document;
  const marker = '<img src=x onerror="window.injected=true">';
  const context = vm.createContext({
    $,
    esc,
    gnum,
    reduce: true,
    drawGust() {},
    lastDaily: null,
    requestAnimationFrame() {},
  });
  function $(id) {
    return doc.getElementById(id);
  }
  vm.runInContext(
    find((node) => ts.isFunctionDeclaration(node) && node.name?.text === "renderDaily"),
    context,
  );
  const half = {
    extended: { gusts: "20 mph", wind: "10 mph", rainValue: 0 },
    rainProbabilityValue: 10,
    displayTemperature: marker,
  };
  context.renderDaily([{ dayOfWeek: marker, displayDate: "October 30", day: half, night: half }]);
  assert.equal(doc.querySelectorAll("img,svg[onload],script").length, 0);
  assert.ok(doc.getElementById("days").textContent.includes(marker));
  context.renderDaily([
    {
      dayOfWeek: "Friday",
      displayDate: "October 30",
      day: { ...half, displayTemperature: "74°" },
      night: { ...half, displayTemperature: "65°" },
    },
  ]);
  assert.ok(doc.getElementById("days").textContent.includes("74° / 65°"));
});

test("evacuation-zone popups do not interpret provider fields as HTML", () => {
  const code = find(
    (node) =>
      ts.isArrowFunction(node) &&
      node.parameters.length === 1 &&
      node.parameters[0].name.getText(tree) === "l" &&
      node.getText(tree).includes("l.feature.properties.EZone"),
  );
  const popup = vm.runInNewContext("(" + code + ")", { esc });
  const doc = new JSDOM('<div id="popup"></div>').window.document;
  const marker = '<img src=x onerror="window.injected=true">';
  doc.getElementById("popup").innerHTML = popup({ feature: { properties: { EZone: marker, County_Nam: marker } } });
  assert.equal(doc.querySelectorAll("img,script").length, 0);
  assert.ok(doc.getElementById("popup").textContent.includes(marker));
  assert.match(popup({ feature: { properties: { EZone: "A", County_Nam: "ESCAMBIA" } } }), /Evacuation Zone A/);
});

test("alert windows remain text throughout the alert-to-timeline path", () => {
  const doc = new JSDOM('<div id="alerts"></div><div id="chips"></div><div id="timeline"></div>').window.document;
  const marker = '<img id="provider-markup" src="https://example.invalid/probe">';
  const context = vm.createContext({
    $: (id) => doc.getElementById(id),
    esc,
    ALCOL: () => "#ffffff",
    alarmCheck() {},
    fmtEp: String,
    renderTicker() {},
    renderThreats() {},
    lastWin: null,
    cpa: { d: 10, h: 1 },
    fmtH: () => "Friday, 6 PM CDT",
    requestAnimationFrame() {},
  });
  for (const name of ["renderTimeline", "renderAlerts"]) {
    vm.runInContext(
      find((node) => ts.isFunctionDeclaration(node) && node.name?.text === name),
      context,
    );
  }
  function alertFor(window) {
    return [
      {
        name: "Hurricane Warning",
        affectedAreas: [
          {
            startDateTimeEpoch: 1,
            endDateTimeEpoch: 2,
            text: `Window for Tropical Storm force winds: ${window}\n - end\nWindow for Hurricane force winds: ${window}\n\n`,
          },
        ],
      },
    ];
  }
  context.renderAlerts(alertFor(marker));
  assert.equal(context.lastWin.ts, marker);
  assert.equal(context.lastWin.hu, marker);
  assert.equal(doc.querySelectorAll("img,script,iframe").length, 0);
  assert.ok(doc.getElementById("timeline").textContent.includes(marker));
  context.renderAlerts(alertFor("Friday evening until Saturday morning"));
  assert.ok(doc.getElementById("timeline").textContent.includes("Friday evening until Saturday morning"));
});

test("map scripts require integrity metadata and retain load-failure feedback", () => {
  const doc = new JSDOM("<head></head>").window.document;
  const failures = [];
  const context = vm.createContext({ document: doc, fail: (message) => failures.push(message) });
  vm.runInContext(
    find((node) => ts.isFunctionDeclaration(node) && node.name?.text === "addScript"),
    context,
  );
  let loaded = 0;
  const integrity = "sha384-" + "A".repeat(64);
  context.addScript("https://example.invalid/map.js", integrity, () => loaded++);
  const element = doc.querySelector("script");
  assert.equal(element.integrity, integrity);
  assert.equal(element.crossOrigin, "anonymous");
  assert.equal(loaded, 0);
  element.onload();
  assert.equal(loaded, 1);
  element.onerror();
  assert.match(failures[0], /map library blocked/);
});

test("the built storm policy trusts only its exact inline script bytes", async () => {
  const { secureStormHtml } = await import("../scripts/secure-storm.mjs");
  const secured = secureStormHtml(html);
  const doc = new JSDOM(secured).window.document;
  const policy = doc.querySelector('meta[http-equiv="Content-Security-Policy"]').content;
  const scriptDirective = policy.split(";").find((part) => part.trim().startsWith("script-src "));
  assert.ok(
    scriptDirective && !scriptDirective.includes("'unsafe-inline'") && !scriptDirective.includes("'unsafe-eval'"),
  );
  for (const script of doc.querySelectorAll("script:not([src])")) {
    const digest = createHash("sha256").update(script.textContent).digest("base64");
    assert.ok(scriptDirective.includes("'sha256-" + digest + "'"));
    assert.ok(
      !scriptDirective.includes(
        "'sha256-" +
          createHash("sha256")
            .update(script.textContent + ";alert(1)")
            .digest("base64") +
          "'",
      ),
    );
  }
  assert.ok(policy.includes("object-src 'none'") && policy.includes("base-uri 'none'"));
});
