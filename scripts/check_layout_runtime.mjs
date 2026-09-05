import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  browserExitDiagnostic,
  browserVersionAcceptanceFailures,
  connectCdp,
  criticalTelemetryAcceptanceFailures,
  desktopEveAcceptanceFailures,
  flightTelemetryAcceptanceFailures,
  mobileCinemaAcceptanceFailures,
  mobileFlightAcceptanceFailures,
  motionPreferenceAcceptanceFailures,
  normalizeMotionTransitionLists,
  runWithLayoutCleanup,
  tickerTelemetryAcceptanceFailures,
  touchTargetAcceptanceFailures,
  validityGeometryAcceptanceFailures,
  visualPaintEvidence,
} from "./layout-runtime-support.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const SAFE_AREA_PX = 20;
const MOTION_PIP_LABEL = "Warp to P-51D MUSTANG";
const MOTION_CAPTURE_SOURCE = `() => {
  const normalizeTransition = ${normalizeMotionTransitionLists.toString()};
  const pipButton = [...document.querySelectorAll('.za-lcars-pip')]
    .find((element) => element.getAttribute('aria-label') === ${JSON.stringify(MOTION_PIP_LABEL)});
  const elements = {
    routing: document.querySelector('.za-routing-progress'),
    hud: document.querySelector('.za-airframe-progress'),
    rail: document.querySelector('.za-command-rail'),
    pip: pipButton?.querySelector('.za-lcars-pip-mark') ?? null,
  };
  const samples = Object.fromEntries(Object.entries(elements).map(([name, element]) => {
    if (!element) return [name, null];
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return [name, {
      rect: { width: rect.width, height: rect.height },
      transition: normalizeTransition(
        style.transitionProperty,
        style.transitionDuration,
        style.transitionDelay,
      ),
    }];
  }));
  return {
    elements: samples,
    pipTargetSelected: pipButton?.matches('.on[aria-current="true"]') === true,
  };
}`;

function expectedBrowserMajor() {
  const cliPrefix = "--expected-browser-major=";
  const cliValue = process.argv.slice(2).find((argument) => argument.startsWith(cliPrefix));
  return cliValue ? cliValue.slice(cliPrefix.length) : process.env.EXPECTED_BROWSER_MAJOR;
}

function browserExecutable() {
  const candidates = [
    process.env.CHROME_PATH,
    process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES, "Google", "Chrome", "Application", "chrome.exe"),
    process.env["PROGRAMFILES(X86)"] &&
      path.join(process.env["PROGRAMFILES(X86)"], "Microsoft", "Edge", "Application", "msedge.exe"),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/microsoft-edge",
  ].filter(Boolean);
  const executable = candidates.find((candidate) => existsSync(candidate));
  assert.ok(executable, "Chrome or Edge is required; set CHROME_PATH when installed outside standard locations");
  return executable;
}

function contentType(file) {
  return (
    {
      ".css": "text/css; charset=utf-8",
      ".html": "text/html; charset=utf-8",
      ".avif": "image/avif",
      ".js": "text/javascript; charset=utf-8",
      ".jpg": "image/jpeg",
      ".svg": "image/svg+xml",
      ".webp": "image/webp",
      ".woff2": "font/woff2",
    }[path.extname(file).toLowerCase()] ?? "application/octet-stream"
  );
}

async function serveDist() {
  await stat(path.join(DIST, "command-deck.html"));
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url ?? "/", "http://127.0.0.1").pathname);
      const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
      const file = path.resolve(DIST, relative);
      if (file !== DIST && !file.startsWith(`${DIST}${path.sep}`)) throw new Error("invalid path");
      const body = await readFile(file);
      response.writeHead(200, { "Content-Type": contentType(file), "Cache-Control": "no-store" });
      response.end(body);
    } catch {
      response.writeHead(404).end("not found");
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return server;
}

function devtoolsEndpoint(processHandle) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timed out waiting for browser debugging endpoint")), 10_000);
    let buffer = "";
    processHandle.stderr.setEncoding("utf8");
    processHandle.stderr.on("data", (chunk) => {
      buffer += chunk;
      const match = buffer.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (!match) return;
      clearTimeout(timer);
      resolve(match[1]);
    });
    processHandle.once("exit", (code, signal) => {
      clearTimeout(timer);
      reject(new Error(browserExitDiagnostic(code, signal, buffer)));
    });
  });
}

async function pageDebugger(browserEndpoint, targetUrl) {
  const endpoint = `http://127.0.0.1:${new URL(browserEndpoint).port}/json/list`;
  for (let attempt = 0; attempt < 100; attempt++) {
    const targets = await fetch(endpoint)
      .then((response) => response.json())
      .catch(() => []);
    const target = targets.find((item) => item.type === "page" && item.url.startsWith(targetUrl));
    if (target?.webSocketDebuggerUrl) return target.webSocketDebuggerUrl;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("timed out waiting for the layout-check page target");
}

async function waitForApp(send) {
  for (let attempt = 0; attempt < 100; attempt++) {
    const result = await send("Runtime.evaluate", {
      expression:
        'document.readyState === "complete" && (!document.fonts || document.fonts.status === "loaded") && document.querySelector("#root")?.dataset.clientActivated === "true" && !document.querySelector("style[data-critical-shell]") && document.querySelectorAll(".za-lcars-pip").length === 8 && Boolean(document.querySelector(".za-mobile-rail-safe"))',
      returnByValue: true,
    });
    if (result.result.value) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("timed out waiting for the command deck layout");
}

async function waitForCriticalShell(send) {
  for (let attempt = 0; attempt < 100; attempt++) {
    const result = await send("Runtime.evaluate", {
      expression:
        'document.readyState !== "loading" && Boolean(document.querySelector("#root[data-prerendered=\\"v35\\"]")) && !document.querySelector("#root")?.dataset.clientActivated && Boolean(document.querySelector("style[data-critical-shell]")) && window.__v35CriticalActivationHeld === true',
      returnByValue: true,
    });
    if (result.result.value) return;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error("timed out waiting for the prerendered critical shell");
}

async function captureCriticalGeometry(send) {
  const evaluation = await send("Runtime.evaluate", {
    expression: `(() => {
      const selectors = [
        ".za-bracket",
        "section[data-deck=\\"0\\"] h1",
        ".za-snapshot-lede",
        ".za-snapshot-copy",
        "section[data-deck=\\"0\\"] .za-critical-telemetry",
        ".za-snapshot-modes",
        ".za-snapshot-actions",
        ".za-flight-launch",
        ".za-snapshot-secondary button",
        ".za-bracket > .za-chip",
        "section[data-deck=\\"0\\"] .za-snapshot-facts > div",
        ".za-command-header",
        ".za-command-header > .pointer-events-auto:last-child",
        ".za-validity-chip",
        ".za-clock-chip",
        '.za-command-header button[aria-label*="selection audio"]',
        '.za-command-header button[aria-label="Open deck navigator"]',
        ".za-command-rail",
        ".za-command-rail > nav",
        ".za-command-rail > nav > button:first-child",
        ".za-mobile-flight-control",
        ".za-mobile-rail-scroll",
        ".za-corner-hud",
        ".za-airframe",
        ".za-bit-control",
      ];
      const values = {};
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (!element) {
          values[selector] = null;
          continue;
        }
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        values[selector] = {
          rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
          style: {
            display: style.display,
            position: style.position,
            boxSizing: style.boxSizing,
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            lineHeight: style.lineHeight,
            padding: style.padding,
            margin: style.margin,
            gap: style.gap,
            gridTemplateColumns: style.gridTemplateColumns,
            borderRadius: style.borderRadius,
          },
        };
      }
      return values;
    })()`,
    returnByValue: true,
  });
  return evaluation.result.value;
}

function criticalGeometryFailures(before, after, width) {
  const failures = [];
  for (const [selector, initial] of Object.entries(before)) {
    const activated = after[selector];
    if (!initial || !activated) {
      failures.push(`${width}px ${selector} must exist before and after activation`);
      continue;
    }
    const initialHidden = initial.style.display === "none" || (initial.rect.width === 0 && initial.rect.height === 0);
    const activatedHidden =
      activated.style.display === "none" || (activated.rect.width === 0 && activated.rect.height === 0);
    if (initialHidden && activatedHidden) continue;
    for (const property of [
      "display",
      "position",
      "boxSizing",
      "fontFamily",
      "fontSize",
      "fontWeight",
      "lineHeight",
      "padding",
      "gap",
      "gridTemplateColumns",
    ]) {
      if (initial.style[property] !== activated.style[property])
        failures.push(`${width}px ${selector} ${property}: ${initial.style[property]} -> ${activated.style[property]}`);
    }
    const initialRadius = Number.parseFloat(initial.style.borderRadius);
    const activatedRadius = Number.parseFloat(activated.style.borderRadius);
    const pillThreshold =
      Math.min(initial.rect.width, initial.rect.height, activated.rect.width, activated.rect.height) / 2;
    const equivalentPills = initialRadius >= pillThreshold && activatedRadius >= pillThreshold;
    if (initial.style.borderRadius !== activated.style.borderRadius && !equivalentPills)
      failures.push(
        `${width}px ${selector} borderRadius: ${initial.style.borderRadius} -> ${activated.style.borderRadius}`,
      );
    for (const edge of ["left", "top", "width", "height"]) {
      if (selector === ".za-bracket" && edge === "height") continue;
      const delta = Math.abs(initial.rect[edge] - activated.rect[edge]);
      if (delta > 1) failures.push(`${width}px ${selector} ${edge} shifted ${delta.toFixed(3)}px`);
    }
  }
  return failures;
}

async function runCriticalShellParity(send, targetUrl, width, height, mobile) {
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });
  await send("Emulation.setEmulatedMedia", {
    media: "screen",
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  await send("Page.navigate", { url: `${targetUrl}?critical-parity-${width}` });
  await waitForCriticalShell(send);
  await send("Runtime.evaluate", {
    expression: "document.fonts ? document.fonts.ready : Promise.resolve()",
    awaitPromise: true,
  });
  const before = await captureCriticalGeometry(send);
  await send("Runtime.evaluate", { expression: "window.__v35ReleaseCriticalActivation()" });
  try {
    await waitForApp(send);
  } catch (error) {
    const diagnostic = await send("Runtime.evaluate", {
      expression: `({
        readyState: document.readyState,
        root: document.querySelector("#root")?.dataset ?? null,
        criticalShell: Boolean(document.querySelector("style[data-critical-shell]")),
        pips: document.querySelectorAll(".za-lcars-pip").length,
        mobileRail: Boolean(document.querySelector(".za-mobile-rail-safe")),
        errors: window.__v35CriticalActivationErrors ?? [],
        resources: performance.getEntriesByType("resource").map((entry) => entry.name),
      })`,
      returnByValue: true,
    });
    throw new Error(`${error.message}: ${JSON.stringify(diagnostic.result.value)}`, { cause: error });
  }
  await send("Runtime.evaluate", {
    expression: "new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))",
    awaitPromise: true,
  });
  const after = await captureCriticalGeometry(send);
  const failures = criticalGeometryFailures(before, after, width);
  return { width, height, before, after, failures, ok: failures.length === 0 };
}

async function waitForCanonicalDeck(send, deckIndex) {
  let last = null;
  let consecutive = 0;
  for (let attempt = 0; attempt < 40; attempt++) {
    last = (
      await send("Runtime.evaluate", {
        expression: `(() => {
          const main = document.querySelector("#main-content");
          const section = document.querySelector('section[data-deck="${deckIndex}"]');
          if (!main || !section) return { present: false };
          const intendedScrollTop = Math.max(0, section.offsetTop - 8);
          const maximumScrollTop = Math.max(0, main.scrollHeight - main.clientHeight);
          const expectedScrollTop = Math.min(intendedScrollTop, maximumScrollTop);
          const expectedSectionTop = section.offsetTop - expectedScrollTop;
          const sectionTop = section.getBoundingClientRect().top;
          return {
            present: true,
            activeDeck: main.dataset.activeDeck ?? null,
            scrollTop: main.scrollTop,
            expectedScrollTop,
            sectionTop,
            expectedSectionTop,
            scrollAlignmentDelta: Math.abs(main.scrollTop - expectedScrollTop),
            sectionAlignmentDelta: Math.abs(sectionTop - expectedSectionTop),
          };
        })()`,
        returnByValue: true,
      })
    ).result.value;
    if (
      last.present &&
      last.activeDeck === String(deckIndex) &&
      last.scrollAlignmentDelta <= 1 &&
      last.sectionAlignmentDelta <= 1
    )
      consecutive += 1;
    else consecutive = 0;
    if (consecutive >= 3) return last;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return last;
}

async function runEarlyActivationAcceptance(send, targetUrl) {
  const settle = () =>
    send("Runtime.evaluate", {
      expression: "new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))",
      awaitPromise: true,
    });

  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await send("Emulation.setEmulatedMedia", {
    media: "screen",
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  const nativeRoutes = [
    ["grid", 1],
    ["routing", 2],
    ["iron", 3],
    ["lineage", 4],
    ["builds", 5],
    ["operator", 6],
    ["eve", 7],
    ["contact", 8],
    ["builds&article=7", 5],
  ];
  const directRoutes = [];
  for (const [route, deckIndex] of nativeRoutes) {
    await send("Page.navigate", {
      url: `${targetUrl}?startup-native-${deckIndex}-${encodeURIComponent(route)}#deck=${route}`,
    });
    await waitForApp(send);
    await settle();
    const settlement = await waitForCanonicalDeck(send, deckIndex);
    const observed = (
      await send("Runtime.evaluate", {
        expression: `(() => {
        const resources = performance.getEntriesByType("resource");
        const bootstrapUrl = document.querySelector('script[type="module"][src]')?.src;
        const bootstrap = resources.find((entry) => entry.name === bootstrapUrl);
        const main = resources.find((entry) => /\\/assets\\/main-[^/]+\\.js$/.test(entry.name));
        const scroller = document.querySelector("#main-content");
        const scrollerTop = scroller?.getBoundingClientRect().top ?? 0;
        const sections = [...document.querySelectorAll("section[data-deck]")];
        const nearestDeck = sections.reduce((best, section) => {
          const deck = Number(section.getAttribute("data-deck"));
          const delta = Math.abs(section.getBoundingClientRect().top - scrollerTop);
          return delta < best.delta ? { deck, delta } : best;
        }, { deck: -1, delta: Number.POSITIVE_INFINITY });
        return {
          hash: location.hash,
          nearestDeck,
          activationRequestGapMs: bootstrap && main ? main.startTime - bootstrap.responseEnd : null,
          frames: window.__v35DirectFrames ?? [],
        };
      })()`,
        returnByValue: true,
      })
    ).result.value;
    observed.route = route;
    observed.deckIndex = deckIndex;
    observed.settlement = settlement;
    directRoutes.push(observed);
  }
  const direct = directRoutes.find((route) => route.route === "iron");

  await send("Page.navigate", { url: `${targetUrl}?critical-parity-early-ctrl` });
  await waitForCriticalShell(send);
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "k", code: "KeyK", modifiers: 2 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "k", code: "KeyK", modifiers: 2 });
  await waitForApp(send);
  await settle();
  const ctrlK = (
    await send("Runtime.evaluate", {
      expression: `({
        navigatorOpen: Boolean(document.querySelector('[role="dialog"][aria-label="Deck navigator"]')),
        dialogCount: document.querySelectorAll('[role="dialog"][aria-label="Deck navigator"]').length,
      })`,
      returnByValue: true,
    })
  ).result.value;

  await send("Page.navigate", { url: `${targetUrl}?critical-parity-early-swipe` });
  await waitForCriticalShell(send);
  await send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 330, y: 420, id: 41, radiusX: 1, radiusY: 1, force: 1 }],
  });
  await send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: 100, y: 423, id: 41, radiusX: 1, radiusY: 1, force: 1 }],
  });
  await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await waitForApp(send);
  await settle();
  const swipeSettlement = await waitForCanonicalDeck(send, 1);
  const swipe = (
    await send("Runtime.evaluate", {
      expression: `({
        hash: location.hash,
        gridTop: document.querySelector('section[data-deck="1"]')?.getBoundingClientRect().top ?? null,
        scrollerTop: document.querySelector("#main-content")?.getBoundingClientRect().top ?? null,
        activeDeck: document.querySelector("#main-content")?.dataset.activeDeck ?? null,
      })`,
      returnByValue: true,
    })
  ).result.value;
  swipe.settlement = swipeSettlement;

  await send("Page.navigate", { url: `${targetUrl}?critical-parity-early-click` });
  await waitForCriticalShell(send);
  await send("Runtime.evaluate", {
    expression: `(() => {
      const button = [...document.querySelectorAll(".za-snapshot-modes button")]
        .find((candidate) => candidate.textContent?.includes("EXECUTIVE"));
      const descendant = button?.querySelector("b");
      if (!button || !descendant) throw new Error("the prerendered Executive control is missing");
      descendant.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true, pointerId: 7 }));
      button.click();
    })()`,
  });
  await waitForApp(send);
  await settle();
  const click = (
    await send("Runtime.evaluate", {
      expression: `(() => {
        const executive = [...document.querySelectorAll(".za-snapshot-modes button")]
          .find((candidate) => candidate.textContent?.includes("EXECUTIVE"));
        return {
          executivePressed: executive?.getAttribute("aria-pressed") === "true",
          pressedCount: document.querySelectorAll('.za-snapshot-modes button[aria-pressed="true"]').length,
        };
      })()`,
      returnByValue: true,
    })
  ).result.value;

  await send("Page.navigate", { url: `${targetUrl}?critical-parity-early-external` });
  await waitForCriticalShell(send);
  await send("Runtime.evaluate", {
    expression: `(() => {
      const main = document.querySelector("#main-content");
      const anchor = document.createElement("a");
      anchor.href = "https://example.net/";
      const child = document.createElement("span");
      child.textContent = "EXTERNAL TEST";
      anchor.append(child);
      main.append(anchor);
      window.__v35ExternalClicks = 0;
      anchor.addEventListener("click", (event) => {
        event.preventDefault();
        window.__v35ExternalClicks += 1;
      });
      child.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true, pointerId: 8 }));
      child.click();
    })()`,
  });
  await waitForApp(send);
  await settle();
  const external = (
    await send("Runtime.evaluate", {
      expression: `({ clickCount: window.__v35ExternalClicks ?? 0, hash: location.hash })`,
      returnByValue: true,
    })
  ).result.value;

  const visibleWrongDirectFrame = direct.frames.find(
    (frame) => frame.visibility !== "hidden" && frame.nearestDeck === 0 && frame.activated !== true,
  );
  const failures = [];
  for (const route of directRoutes) {
    const visibleNativeFrames = route.frames.filter(
      (frame) => frame.visibility !== "hidden" && frame.activated !== true && frame.present,
    );
    const nativeFrame = visibleNativeFrames[0];
    if (
      !nativeFrame ||
      nativeFrame.scrollAlignmentDelta > 1 ||
      nativeFrame.sectionAlignmentDelta > 1 ||
      nativeFrame.nearestDeck !== route.deckIndex
    )
      failures.push(`native ${route.route} startup missed the canonical first frame: ${JSON.stringify(route)}`);
  }
  if (
    direct.hash !== "#deck=iron" ||
    direct.nearestDeck.deck !== 3 ||
    direct.settlement?.activeDeck !== "3" ||
    direct.settlement?.scrollAlignmentDelta > 1 ||
    direct.settlement?.sectionAlignmentDelta > 1
  )
    failures.push(`direct Iron startup did not settle synchronously: ${JSON.stringify(direct)}`);
  if (typeof direct.activationRequestGapMs !== "number" || direct.activationRequestGapMs > 100)
    failures.push(`direct Iron activation import waited ${direct.activationRequestGapMs}ms`);
  if (visibleWrongDirectFrame)
    failures.push(`direct Iron exposed Snapshot before activation: ${JSON.stringify(visibleWrongDirectFrame)}`);
  if (!ctrlK.navigatorOpen || ctrlK.dialogCount !== 1)
    failures.push(`first Ctrl+K did not open exactly one navigator: ${JSON.stringify(ctrlK)}`);
  if (
    swipe.hash !== "#deck=grid" ||
    swipe.activeDeck !== "1" ||
    swipe.settlement?.scrollAlignmentDelta > 1 ||
    swipe.settlement?.sectionAlignmentDelta > 1
  )
    failures.push(`first swipe did not navigate exactly once to Grid: ${JSON.stringify(swipe)}`);
  if (!click.executivePressed || click.pressedCount !== 1)
    failures.push(`first descendant click did not select Executive exactly once: ${JSON.stringify(click)}`);
  if (external.clickCount !== 1)
    failures.push(`first external anchor click was not preserved exactly once: ${JSON.stringify(external)}`);

  return { directRoutes, direct, ctrlK, swipe, click, external, failures, ok: failures.length === 0 };
}

async function settleViewport(send, width, mobile, height = 844) {
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });
  await send("Runtime.evaluate", {
    expression: "new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))",
    awaitPromise: true,
  });
}

async function setValidityLayoutState(send, width, railOpen, tour) {
  await settleViewport(send, width, false, 900);
  await send("Runtime.evaluate", {
    expression: `(async () => {
      const desiredRailOpen = ${railOpen};
      const desiredTour = ${tour};
      const railToggle = document.querySelector(
        desiredRailOpen ? 'button[aria-label="Expand command rail"]' : 'button[aria-label="Stow command rail"]',
      );
      railToggle?.click();
      if (railToggle) await new Promise((resolve) => setTimeout(resolve, 360));
      document.querySelector('.za-command-rail button[aria-label="Stop the 30-second flight"]')?.click();
      await new Promise((resolve) => requestAnimationFrame(resolve));
      document.querySelector('.za-command-rail button[aria-label$="Go to Snapshot deck"]')?.click();
      const main = document.querySelector("#main-content");
      main?.scrollTo({ top: 0, left: 0, behavior: "auto" });
      main?.dispatchEvent(new Event("scroll"));
      await new Promise((resolve) => setTimeout(resolve, 180));
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      if (desiredTour) {
        document.querySelector('.za-command-rail button[aria-label="Run the 30-second flight"]')?.click();
      }
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return {
        railOpen: Boolean(document.querySelector('button[aria-label="Stow command rail"]')),
        tour: Boolean(document.querySelector('.za-command-header')?.textContent?.includes('AUTOPILOT')),
      };
    })()`,
    awaitPromise: true,
    returnByValue: true,
  });
}

async function collectValidityGeometrySample(send, viewportWidth, railOpen, tour, expectedState) {
  await setValidityLayoutState(send, viewportWidth, railOpen, tour);
  const evaluation = await send("Runtime.evaluate", {
    expression: `(async () => {
      const expectedState = ${JSON.stringify(expectedState)};
      const chip = document.querySelector("[data-validity-chip]");
      const chipLabel = document.querySelector("[data-validity-label]");
      const footer = document.querySelector("[data-validity-footer-status]");
      const footerLabel = document.querySelector("[data-validity-footer-label]");
      const header = document.querySelector(".za-command-header");
      const footerRow = footer?.parentElement;
      const footerChildren = [...(footerRow?.children ?? [])];
      const validThrough = footerRow?.querySelector("[data-validity-through]");
      const rect = (element) => {
        if (!element) return null;
        const value = element.getBoundingClientRect();
        return { left: value.left, right: value.right, top: value.top, bottom: value.bottom, width: value.width, height: value.height };
      };
      const relativeRect = (element, owner) => {
        const value = rect(element);
        const origin = rect(owner);
        if (!value || !origin) return null;
        return {
          left: value.left - origin.left,
          right: value.right - origin.left,
          top: value.top - origin.top,
          bottom: value.bottom - origin.top,
          width: value.width,
          height: value.height,
        };
      };
      const textEvidence = (element) => {
        const style = getComputedStyle(element);
        return {
          ariaHidden: Boolean(element.closest('[aria-hidden="true"]')),
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
          rect: rect(element),
          display: style.display,
          visibility: style.visibility,
          overflowX: style.overflowX,
          textOverflow: style.textOverflow,
          opacity: style.opacity,
        };
      };
      const identity = (name, element, owner) => {
        if (!element) return { name, visible: false, ariaHidden: false, accessibleText: "", rect: null, stabilityRect: null };
        const value = rect(element);
        const style = getComputedStyle(element);
        return {
          name,
          visible:
            value.width > 0 &&
            value.height > 0 &&
            style.display !== "none" &&
            !["hidden", "collapse"].includes(style.visibility) &&
            Number(style.opacity) !== 0,
          ariaHidden: Boolean(element.closest('[aria-hidden="true"]')),
          accessibleText:
            element.getAttribute("aria-label") ||
            element.textContent?.replace(/\\s+/g, " ").trim() ||
            [...element.querySelectorAll("[aria-label]")]
              .map((child) => child.getAttribute("aria-label"))
              .filter(Boolean)
              .join(" · "),
          rect: value,
          stabilityRect: relativeRect(element, owner),
        };
      };
      if (!chip || !chipLabel || !footer || !footerLabel || !header || !footerRow || !validThrough) {
        return { error: "validity geometry hooks are missing" };
      }
      if (expectedState.source === "ssr-fixture") {
        chipLabel.textContent = expectedState.headerLabel;
        footerLabel.textContent = expectedState.footerLabel;
        validThrough.textContent = expectedState.validThroughText;
      }
      const headerCluster = chip.parentElement;
      const deck = header.firstElementChild;
      const airframeStatus = header.children[1];
      const audio = header.querySelector('button[aria-label*="selection audio"]');
      const navigator = header.querySelector('button[aria-label="Open deck navigator"]');
      const autopilot = [...headerCluster.children].find((element) => element.textContent?.trim() === "AUTOPILOT");
      const clock = [...headerCluster.children].find((element) => element.textContent?.trim().startsWith("SD "));
      const headerIdentities = [
        identity("deck", deck, header),
        identity("validity", chip, header),
        identity("audio", audio, header),
        identity("navigator", navigator, header),
      ];
      if (innerWidth >= 1024) headerIdentities.push(identity("clock", clock, header));
      if (innerWidth >= 1280) headerIdentities.push(identity("airframe-status", airframeStatus, header));
      if (${tour}) headerIdentities.push(identity("autopilot", autopilot, header));
      const headerSurface = {
        rect: rect(chip),
        stabilityRect: relativeRect(chip, header),
        label: textEvidence(chipLabel),
        siblings: headerIdentities.filter((candidate) => candidate.name !== "validity"),
      };
      footer.scrollIntoView({ block: "end", inline: "nearest", behavior: "auto" });
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const footerIdentities = [
        identity("release", footerChildren[0], footerRow),
        identity("revised", footerChildren[1], footerRow),
        identity("validity", footerChildren[2], footerRow),
        identity("verified", footerChildren[3], footerRow),
        identity("valid-through", validThrough, footerRow),
        identity("zero-calls", footerChildren[5], footerRow),
      ];
      const sample = {
        label: chipLabel.textContent,
        fullState: {
          id: expectedState.id,
          source: expectedState.source,
          headerLabel: chipLabel.textContent,
          footerLabel: footerLabel.textContent,
          validThroughText: validThrough.textContent,
        },
        identities: { header: headerIdentities, footer: footerIdentities },
        header: headerSurface,
        footer: {
          rect: rect(footer),
          stabilityRect: relativeRect(footer, footerRow),
          label: textEvidence(footerLabel),
          siblings: footerIdentities.filter((candidate) => candidate.name !== "validity"),
        },
      };
      return {
        viewportWidth: innerWidth,
        railOpen: Boolean(document.querySelector('button[aria-label="Stow command rail"]')),
        tour: Boolean(header.textContent?.includes("AUTOPILOT")),
        sample,
      };
    })()`,
    awaitPromise: true,
    returnByValue: true,
  });
  if (evaluation.exceptionDetails) {
    throw new Error(evaluation.exceptionDetails.exception?.description ?? evaluation.exceptionDetails.text);
  }
  return evaluation.result.value;
}

async function setControlledValidityState(send, now, expected) {
  const evaluation = await send("Runtime.evaluate", {
    expression: `(async () => {
      window.__v35SetValidityNow(${now});
      const timerRan = window.__v35RunValidityTimer();
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return {
        timerRan,
        headerLabel: document.querySelector('[data-validity-label]')?.textContent ?? null,
        footerLabel: document.querySelector('[data-validity-footer-label]')?.textContent ?? null,
        validThroughText: document.querySelector('[data-validity-through]')?.textContent ?? null,
      };
    })()`,
    awaitPromise: true,
    returnByValue: true,
  });
  if (evaluation.exceptionDetails) {
    throw new Error(evaluation.exceptionDetails.exception?.description ?? evaluation.exceptionDetails.text);
  }
  const actual = evaluation.result.value;
  assert.equal(actual.timerRan, true, `controlled validity timer must run for ${expected.id}`);
  assert.deepEqual(
    {
      headerLabel: actual.headerLabel,
      footerLabel: actual.footerLabel,
      validThroughText: actual.validThroughText,
    },
    {
      headerLabel: expected.headerLabel,
      footerLabel: expected.footerLabel,
      validThroughText: expected.validThroughText,
    },
    `React must render the complete ${expected.id} validity tuple`,
  );
}

async function collectValidityGeometryMatrix(send) {
  const states = [
    {
      id: "ssr-placeholder",
      source: "ssr-fixture",
      headerLabel: "EXPORT STATUS · DATED",
      footerLabel: "DATED EXPORT STATUS",
      validThroughText: "VALID THRU 09-27-2026",
    },
    {
      id: "live-longest",
      source: "react-live",
      headerLabel: "EXPORT VALID · 29D LEFT",
      footerLabel: "DATED EXPORT VALID",
      validThroughText: "VALID THRU 09-27-2026",
    },
    {
      id: "live-1d",
      source: "react-live",
      headerLabel: "EXPORT VALID · 1D LEFT",
      footerLabel: "DATED EXPORT VALID",
      validThroughText: "VALID THRU 09-27-2026",
    },
    {
      id: "live-expired",
      source: "react-live",
      headerLabel: "EXPORT EXPIRED",
      footerLabel: "DATED EXPORT EXPIRED",
      validThroughText: "VALID THRU TREAT AS HISTORY",
    },
  ];
  const layouts = [768, 834, 1024, 1280].flatMap((viewportWidth) =>
    [false, true].flatMap((railOpen) => [false, true].map((tour) => ({ viewportWidth, railOpen, tour, samples: [] }))),
  );
  const collectState = async (state) => {
    for (const layout of layouts) {
      const result = await collectValidityGeometrySample(
        send,
        layout.viewportWidth,
        layout.railOpen,
        layout.tour,
        state,
      );
      assert.equal(result.error, undefined, result.error);
      assert.equal(result.viewportWidth, layout.viewportWidth);
      assert.equal(result.railOpen, layout.railOpen, `rail state must be real at ${layout.viewportWidth}px`);
      assert.equal(result.tour, layout.tour, `flight state must be real at ${layout.viewportWidth}px`);
      layout.samples.push(result.sample);
    }
  };
  await collectState(states[1]);
  await setControlledValidityState(send, Date.parse("2026-09-27T05:00:00Z"), states[2]);
  await collectState(states[2]);
  await setControlledValidityState(send, Date.parse("2026-09-28T05:00:00Z"), states[3]);
  await collectState(states[3]);
  await collectState(states[0]);
  for (const layout of layouts) {
    layout.samples.sort(
      (first, second) =>
        states.findIndex((state) => state.id === first.fullState.id) -
        states.findIndex((state) => state.id === second.fullState.id),
    );
  }
  return layouts;
}

function summarizeValidityGeometryState(state) {
  const summarizeSurface = (surfaceName) => {
    const baseline = state.samples[0][surfaceName];
    const shifts = state.samples.flatMap((sample) =>
      ["left", "right", "top", "bottom", "width", "height"].map((property) =>
        Math.abs(sample[surfaceName].rect[property] - baseline.rect[property]),
      ),
    );
    const siblingOverlaps = state.samples.flatMap((sample) =>
      sample[surfaceName].siblings.map((sibling) => {
        const surface = sample[surfaceName].rect;
        const other = sibling.rect;
        const verticalOverlap = Math.max(0, Math.min(surface.bottom, other.bottom) - Math.max(surface.top, other.top));
        const horizontalOverlap = Math.max(
          0,
          Math.min(surface.right, other.right) - Math.max(surface.left, other.left),
        );
        return verticalOverlap > 0 ? horizontalOverlap : 0;
      }),
    );
    const siblingGaps = state.samples.flatMap((sample) =>
      sample[surfaceName].siblings.flatMap((sibling) => {
        const surface = sample[surfaceName].rect;
        const other = sibling.rect;
        const verticalOverlap = Math.max(0, Math.min(surface.bottom, other.bottom) - Math.max(surface.top, other.top));
        if (verticalOverlap <= 0) return [];
        if (other.right <= surface.left) return [surface.left - other.right];
        if (other.left >= surface.right) return [other.left - surface.right];
        return [0];
      }),
    );
    return {
      rect: baseline.rect,
      maximumShift: Math.max(...shifts),
      maximumLabelOverflow: Math.max(
        ...state.samples.map((sample) =>
          Math.max(0, sample[surfaceName].label.scrollWidth - sample[surfaceName].label.clientWidth),
        ),
      ),
      maximumSiblingOverlap: Math.max(0, ...siblingOverlaps),
      minimumSiblingGap: Math.min(...siblingGaps),
      maximumViewportEscape: Math.max(
        ...state.samples.map((sample) =>
          Math.max(0, -sample[surfaceName].rect.left, sample[surfaceName].rect.right - state.viewportWidth),
        ),
      ),
      labels: state.samples.map((sample) => ({
        label: sample.label,
        clientWidth: sample[surfaceName].label.clientWidth,
        scrollWidth: sample[surfaceName].label.scrollWidth,
      })),
    };
  };
  return {
    viewportWidth: state.viewportWidth,
    railOpen: state.railOpen,
    tour: state.tour,
    header: summarizeSurface("header"),
    footer: summarizeSurface("footer"),
  };
}

function summarizeValidityGeometryDefects(states) {
  const rectFields = ["left", "right", "top", "bottom", "width", "height"];
  const delta = (actual, baseline) =>
    Math.max(...rectFields.map((property) => Math.abs((actual?.[property] ?? 0) - (baseline?.[property] ?? 0))));
  return states.flatMap((state) => {
    const baseline = state.samples[0];
    const samples = state.samples.slice(1).flatMap((sample) => {
      const surfaces = ["header", "footer"].flatMap((surfaceName) => {
        const baselineIdentities = baseline.identities[surfaceName];
        const shiftedIdentities = sample.identities[surfaceName].flatMap((identity) => {
          const original = baselineIdentities.find((candidate) => candidate.name === identity.name);
          const maximumDelta = delta(
            identity.stabilityRect ?? identity.rect,
            original?.stabilityRect ?? original?.rect,
          );
          return maximumDelta > 0.5
            ? [
                {
                  name: identity.name,
                  maximumDelta,
                  baselineText: original?.accessibleText ?? null,
                  actualText: identity.accessibleText,
                  baseline: original?.stabilityRect ?? original?.rect ?? null,
                  actual: identity.stabilityRect ?? identity.rect,
                },
              ]
            : [];
        });
        const surfaceDelta = delta(
          sample[surfaceName].stabilityRect ?? sample[surfaceName].rect,
          baseline[surfaceName].stabilityRect ?? baseline[surfaceName].rect,
        );
        return surfaceDelta > 0.5 || shiftedIdentities.length > 0
          ? [{ surface: surfaceName, surfaceDelta, shiftedIdentities }]
          : [];
      });
      return surfaces.length > 0 ? [{ state: sample.fullState.id, surfaces }] : [];
    });
    return samples.length > 0
      ? [
          {
            viewportWidth: state.viewportWidth,
            railOpen: state.railOpen,
            tour: state.tour,
            baseline: baseline.fullState.id,
            samples,
          },
        ]
      : [];
  });
}

async function collectTickerTelemetry(send, width, height, mobile) {
  await settleViewport(send, width, mobile, height);
  const evaluation = await send("Runtime.evaluate", {
    expression: `(async () => {
      const ticker = document.querySelector(".za-ticker");
      const track = ticker?.querySelector(".za-ticker-track");
      if (!ticker || !track) return { error: "telemetry ticker structure is missing" };
      // What this check protects is that the dated telemetry is visible and
      // legible in the measured viewport, not that a marquee is the thing
      // carrying it. Where the ticker is deliberately hidden, the Snapshot deck
      // states the same dated figures in a static line; accept that as the
      // carrier so the guarantee survives a layout decision.
      const carrier =
        getComputedStyle(ticker).display === "none"
          ? document.querySelector('section[data-deck="0"] .za-critical-telemetry')
          : ticker;
      if (!carrier) return { error: "no dated telemetry carrier is rendered" };
      const carrierTrack = carrier === ticker ? track : carrier;
      carrier.scrollIntoView({ block: "center", inline: "nearest", behavior: "auto" });
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const rect = carrier.getBoundingClientRect();
      const tickerStyle = getComputedStyle(carrier);
      const trackStyle = getComputedStyle(carrierTrack);
      const visible =
        rect.width > 0 &&
        rect.height > 0 &&
        rect.bottom > 0 &&
        rect.top < innerHeight &&
        tickerStyle.display !== "none" &&
        tickerStyle.visibility !== "hidden" &&
        tickerStyle.opacity !== "0" &&
        trackStyle.display !== "none" &&
        trackStyle.visibility !== "hidden" &&
        trackStyle.opacity !== "0";
      return {
        viewportWidth: innerWidth,
        viewportHeight: innerHeight,
        fontSizePx: parseFloat(trackStyle.fontSize),
        visible,
        rect: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height },
        animationName: trackStyle.animationName,
        animationDuration: trackStyle.animationDuration,
        carrier: carrier === ticker ? "ticker" : "snapshot-telemetry",
      };
    })()`,
    awaitPromise: true,
    returnByValue: true,
  });
  if (evaluation.exceptionDetails) {
    throw new Error(evaluation.exceptionDetails.exception?.description ?? evaluation.exceptionDetails.text);
  }
  const scenario = evaluation.result.value;
  scenario.failures = scenario.error ? [scenario.error] : tickerTelemetryAcceptanceFailures(scenario);
  scenario.ok = scenario.failures.length === 0;
  return scenario;
}

async function waitForCanonicalEveLanding(send, targetUrl, width, height) {
  await settleViewport(send, width, false, height);
  await send("Page.navigate", { url: "about:blank" });
  const deepLink = `${targetUrl}#deck=eve`;
  await send("Page.navigate", { url: deepLink });
  await waitForApp(send);
  let evidence;
  for (let attempt = 0; attempt < 120; attempt++) {
    const evaluation = await send("Runtime.evaluate", {
      expression: `(() => {
        const main = document.querySelector("#main-content");
        const section = document.querySelector('section[data-deck="7"]');
        const intendedScrollTop = section ? Math.max(0, section.offsetTop - 8) : Number.NaN;
        const scrollTop = main?.scrollTop ?? Number.NaN;
        const scrollAlignmentDelta = Math.abs(scrollTop - intendedScrollTop);
        const directDeepLink = location.href === ${JSON.stringify(deepLink)};
        const activeDeck = main?.getAttribute("data-active-deck") ?? null;
        return {
          directDeepLink,
          hash: location.hash,
          activeDeck,
          canonicalLandingSettled:
            directDeepLink &&
            location.hash === "#deck=eve" &&
            activeDeck === "7" &&
            Number.isFinite(scrollAlignmentDelta) &&
            scrollAlignmentDelta <= 1,
          scrollTop,
          intendedScrollTop,
          scrollAlignmentDelta,
        };
      })()`,
      returnByValue: true,
    });
    evidence = evaluation.result.value;
    if (evidence.canonicalLandingSettled) return evidence;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error(`desktop E.V.E. canonical landing did not settle at ${width}x${height}: ${JSON.stringify(evidence)}`);
}

async function collectDesktopEveScenario(send, landingEvidence) {
  const evaluation = await send("Runtime.evaluate", {
    expression: `(() => {
      const input = document.querySelector("#eve-command");
      const promptSurface = input?.closest("form");
      const runControl = promptSurface?.querySelector('button[type="submit"]');
      const main = document.querySelector("#main-content");
      if (!input || !promptSurface || !runControl || !main) {
        return { error: "desktop E.V.E. prompt structure is missing" };
      }
      const rectOf = (element) => {
        const rect = element.getBoundingClientRect();
        return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height };
      };
      const visible = (element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          style.opacity !== "0"
        );
      };
      const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
      const center = (rect) => ({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      const topmostAt = ({ x, y }) => document.elementFromPoint(x, y);
      const associatedHit = (control, hit) => {
        if (!hit) return false;
        if (hit === control || control.contains(hit)) return true;
        const label = hit instanceof HTMLLabelElement ? hit : hit.closest?.("label");
        return label?.control === control;
      };
      const inputRect = input.getBoundingClientRect();
      const promptRect = promptSurface.getBoundingClientRect();
      const runRect = runControl.getBoundingClientRect();
      const criticalTelemetryFontSizesPx = [...document.querySelectorAll("[data-eve-safety-boundary]")].map((element) =>
        parseFloat(getComputedStyle(element).fontSize),
      );
      const inputTopmostHit = associatedHit(input, topmostAt(center(inputRect)));
      const runTopmostHit = associatedHit(runControl, topmostAt(center(runRect)));
      const promptSamplePoints = [0.1, 0.5, 0.9].flatMap((yRatio) =>
        [0.1, 0.5, 0.9].map((xRatio) => ({
          x: promptRect.left + promptRect.width * xRatio,
          y: promptRect.top + promptRect.height * yRatio,
        })),
      );
      const promptSurfaceSampleHits = promptSamplePoints.map((point) => {
        const hit = topmostAt(point);
        return hit === promptSurface || (hit != null && promptSurface.contains(hit));
      });
      const labelOf = (element) =>
        element.getAttribute("aria-label") || element.id ||
        (typeof element.className === "string" && element.className.trim()) || element.tagName;
      const overlapRectOf = (a, b) => ({
        left: Math.max(a.left, b.left),
        right: Math.min(a.right, b.right),
        top: Math.max(a.top, b.top),
        bottom: Math.min(a.bottom, b.bottom),
      });
      const samplePoints = (rect) => [0.1, 0.5, 0.9].flatMap((yRatio) =>
        [0.1, 0.5, 0.9].map((xRatio) => ({
          x: rect.left + (rect.right - rect.left) * xRatio,
          y: rect.top + (rect.bottom - rect.top) * yRatio,
        })),
      );
      const coversOwnOverlap = (candidate) => {
        const overlapRect = overlapRectOf(candidate.getBoundingClientRect(), promptRect);
        return samplePoints(overlapRect).some((point) => {
          const hit = topmostAt(point);
          return hit === candidate || (hit != null && candidate.contains(hit));
        });
      };
      const paintEvidence = ${visualPaintEvidence.toString()};
      const visuallyPaints = (element) => {
        const style = getComputedStyle(element);
        const pseudoStyles = ["::before", "::after"].map((pseudo) => getComputedStyle(element, pseudo));
        const ancestorStyles = [];
        for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
          ancestorStyles.push(getComputedStyle(ancestor));
        }
        const effectiveOpacity = [style, ...ancestorStyles].every(
          (candidateStyle) => parseFloat(candidateStyle.opacity || "1") !== 0,
        );
        return paintEvidence(style, Boolean(element.textContent?.trim()), pseudoStyles, ancestorStyles) ||
          (effectiveOpacity && element.matches("img, picture, svg, canvas, video"));
      };
      const coversWhenPointerEnabled = (candidate) => {
        const value = candidate.style.getPropertyValue("pointer-events");
        const priority = candidate.style.getPropertyPriority("pointer-events");
        candidate.style.setProperty("pointer-events", "auto", "important");
        try {
          return coversOwnOverlap(candidate);
        } finally {
          if (value) candidate.style.setProperty("pointer-events", value, priority);
          else candidate.style.removeProperty("pointer-events");
        }
      };
      const fixedStickyIntersections = [...document.body.querySelectorAll("*")]
        .flatMap((surface) => {
          const style = getComputedStyle(surface);
          const surfaceRect = surface.getBoundingClientRect();
          if (
            !["fixed", "sticky"].includes(style.position) ||
            !visible(surface) ||
            !overlaps(surfaceRect, promptRect)
          ) return [];
          const candidates = [surface, ...surface.querySelectorAll("*")];
          const pointerActive = candidates.filter((candidate) => {
            const candidateStyle = getComputedStyle(candidate);
            return candidateStyle.pointerEvents !== "none" && visible(candidate) &&
              overlaps(candidate.getBoundingClientRect(), promptRect);
          });
          const coveringPointerActive = pointerActive.filter(coversOwnOverlap);
          const visualPointerNone = candidates.filter((candidate) => {
            const candidateStyle = getComputedStyle(candidate);
            return candidateStyle.pointerEvents === "none" && visible(candidate) &&
              overlaps(candidate.getBoundingClientRect(), promptRect) && visuallyPaints(candidate);
          });
          const coveringVisualPointerNone = visualPointerNone.filter(coversWhenPointerEnabled);
          if (coveringPointerActive.length === 0 && coveringVisualPointerNone.length === 0) return [];
          return [{
            label: labelOf(surface),
            position: style.position,
            rect: rectOf(surface),
            pointerActiveChildren: coveringPointerActive.map(labelOf),
            visualPointerNoneChildren: coveringVisualPointerNone.map(labelOf),
          }];
        });
      return {
        viewport: [innerWidth, innerHeight],
        inputVisible: visible(input),
        promptSurfaceVisible: visible(promptSurface),
        runVisible: visible(runControl),
        input: rectOf(input),
        promptSurface: rectOf(promptSurface),
        runControl: rectOf(runControl),
        criticalTelemetryFontSizesPx,
        inputTopmostHit,
        runTopmostHit,
        promptSurfaceSampleHits,
        fixedStickyEnumerationComplete: true,
        fixedStickyIntersections,
        documentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
        mainClientWidth: main.clientWidth,
        mainScrollWidth: main.scrollWidth,
      };
    })()`,
    returnByValue: true,
  });
  return { ...landingEvidence, ...evaluation.result.value };
}

async function setDesktopEveCoveringOverlay(send, present) {
  await send("Runtime.evaluate", {
    expression: `(() => {
      document.querySelector("#layout-eve-covering-overlay")?.remove();
      if (!${JSON.stringify(present)}) return true;
      const promptSurface = document.querySelector("#eve-command")?.closest("form");
      if (!promptSurface) return false;
      const rect = promptSurface.getBoundingClientRect();
      const overlay = document.createElement("div");
      overlay.id = "layout-eve-covering-overlay";
      overlay.setAttribute("aria-label", "Injected E.V.E. covering overlay");
      Object.assign(overlay.style, {
        position: "fixed",
        left: rect.left + "px",
        top: rect.top + "px",
        width: rect.width + "px",
        height: rect.height + "px",
        zIndex: "2147483647",
        pointerEvents: "auto",
        background: "rgba(255, 0, 0, 0.2)",
      });
      document.body.append(overlay);
      return true;
    })()`,
    returnByValue: true,
  });
}

async function setDesktopEveLocalizedChildObstruction(send, present) {
  await send("Runtime.evaluate", {
    expression: `(() => {
      document.querySelector("#layout-eve-localized-child-obstruction")?.remove();
      if (!${JSON.stringify(present)}) return true;
      const promptSurface = document.querySelector("#eve-command")?.closest("form");
      if (!promptSurface) return false;
      const rect = promptSurface.getBoundingClientRect();
      const overlay = document.createElement("div");
      overlay.id = "layout-eve-localized-child-obstruction";
      overlay.setAttribute("aria-label", "Injected pointer-none E.V.E. obstruction parent");
      Object.assign(overlay.style, {
        position: "fixed",
        left: rect.left + "px",
        top: rect.top + "px",
        width: rect.width + "px",
        height: rect.height + "px",
        zIndex: "2147483647",
        pointerEvents: "none",
      });
      const child = document.createElement("button");
      child.type = "button";
      child.setAttribute("aria-label", "Injected localized pointer-active E.V.E. obstruction");
      Object.assign(child.style, {
        position: "absolute",
        left: "8px",
        top: "17px",
        width: "40px",
        height: "20px",
        border: "0",
        padding: "0",
        pointerEvents: "auto",
        background: "rgb(255, 0, 0)",
      });
      overlay.append(child);
      document.body.append(overlay);
      return true;
    })()`,
    returnByValue: true,
  });
}

async function setDesktopEveVisualPointerNoneObstruction(send, present) {
  await send("Runtime.evaluate", {
    expression: `(() => {
      document.querySelector("#layout-eve-visual-pointer-none-obstruction")?.remove();
      document.querySelector("#layout-eve-visual-pointer-none-obstruction-style")?.remove();
      if (!${JSON.stringify(present)}) return true;
      const input = document.querySelector("#eve-command");
      if (!input) return false;
      const rect = input.getBoundingClientRect();
      const overlay = document.createElement("div");
      overlay.id = "layout-eve-visual-pointer-none-obstruction";
      overlay.setAttribute("aria-label", "Injected pseudo-element pointer-none E.V.E. obstruction");
      Object.assign(overlay.style, {
        position: "fixed",
        left: rect.left + rect.width / 2 - 40 + "px",
        top: rect.top + rect.height / 2 - 10 + "px",
        width: "80px",
        height: "20px",
        zIndex: "2147483647",
        pointerEvents: "none",
        background: "transparent",
        color: "transparent",
      });
      const style = document.createElement("style");
      style.id = "layout-eve-visual-pointer-none-obstruction-style";
      style.textContent = ${JSON.stringify(
        '#layout-eve-visual-pointer-none-obstruction::before { content: "WARNING"; display: flex; position: absolute; inset: 0; align-items: center; justify-content: center; color: rgb(255, 0, 0); text-shadow: rgb(255, 255, 255) 0 0 2px; }',
      )};
      document.head.append(style);
      document.body.append(overlay);
      return true;
    })()`,
    returnByValue: true,
  });
}

async function setReducedMotionPreference(send, reduced) {
  await send("Emulation.setEmulatedMedia", {
    media: "",
    features: [{ name: "prefers-reduced-motion", value: reduced ? "reduce" : "no-preference" }],
  });
}

async function waitForReducedMotionPreference(send, reduced, frames = 0) {
  await send("Runtime.evaluate", {
    expression: `new Promise((resolve, reject) => {
      const expected = ${reduced};
      const frames = ${frames};
      let attempts = 0;
      const finish = () => {
        let remaining = frames;
        const frame = () => {
          if (remaining-- <= 0) resolve();
          else requestAnimationFrame(frame);
        };
        frame();
      };
      const verify = () => {
        if (matchMedia("(prefers-reduced-motion: reduce)").matches === expected) {
          finish();
          return;
        }
        if (++attempts >= 60) reject(new Error("reduced-motion media preference did not update"));
        else setTimeout(verify, 25);
      };
      verify();
    })`,
    awaitPromise: true,
  });
}

async function evaluateByValue(send, expression, awaitPromise = false) {
  const evaluation = await send("Runtime.evaluate", { expression, awaitPromise, returnByValue: true });
  if (evaluation.exceptionDetails) {
    throw new Error(evaluation.exceptionDetails.exception?.description ?? evaluation.exceptionDetails.text);
  }
  return evaluation.result.value;
}

async function captureMotionElements(send) {
  return evaluateByValue(send, `(${MOTION_CAPTURE_SOURCE})()`);
}

async function captureRestoredMotionSeries(send) {
  return evaluateByValue(
    send,
    `(async () => {
      const capture = ${MOTION_CAPTURE_SOURCE};
      const schedule = [0, 16, 80, 180, 320, 470];
      const startedAt = performance.now();
      const samples = [];
      for (const atMs of schedule) {
        const remaining = atMs - (performance.now() - startedAt);
        if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
        const captured = capture();
        const observedAtMs = performance.now() - startedAt;
        samples.push({ atMs, observedAtMs, ...captured });
      }
      return samples;
    })()`,
    true,
  );
}

async function synchronizeMotionScroll(send) {
  const synchronized = await evaluateByValue(
    send,
    `(async () => {
      const scroller = document.querySelector('#main-content');
      const progress = document.querySelector('.za-airframe-progress');
      const track = progress?.parentElement;
      if (!scroller || !progress || !track) return { ok: false, reason: 'motion scroll synchronization hooks are missing' };
      scroller.dispatchEvent(new Event('scroll'));
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const maxScroll = Math.max(1, scroller.scrollHeight - scroller.clientHeight);
      const progressPercent = Math.round(Math.min(1, Math.max(0, scroller.scrollTop / maxScroll)) * 100);
      const targetWidth = \`\${progressPercent}%\`;
      const trackRect = track.getBoundingClientRect();
      const progressRect = progress.getBoundingClientRect();
      return {
        ok: progress.style.width === targetWidth,
        reason: progress.style.width === targetWidth ? null : 'real scroll listener did not synchronize HUD progress',
        progressPercent,
        targetWidth,
        rect: { width: (trackRect.width * progressPercent) / 100, height: progressRect.height },
      };
    })()`,
    true,
  );
  if (!synchronized?.ok) throw new Error(synchronized?.reason ?? "motion scroll synchronization failed");
  return synchronized;
}

async function runMotionPreferenceAcceptance(send, targetUrl) {
  await setReducedMotionPreference(send, false);
  await settleViewport(send, 1440, false, 1100);
  await send("Page.navigate", { url: targetUrl });
  await waitForApp(send);
  await waitForReducedMotionPreference(send, false, 2);

  const openedLineage = await evaluateByValue(
    send,
    `(() => {
      const control = document.querySelector('button[aria-label="05 LINEAGE · Go to LINEAGE deck"]');
      if (!control) return false;
      control.click();
      return true;
    })()`,
  );
  if (!openedLineage) throw new Error("LINEAGE rail control is missing from the motion scenario");
  for (let attempt = 0; attempt < 100; attempt++) {
    const landed = await evaluateByValue(
      send,
      `document.querySelector('#main-content')?.getAttribute('data-active-deck') === '4' && location.hash === '#deck=lineage'`,
    );
    if (landed) break;
    if (attempt === 99) throw new Error("motion scenario did not land on LINEAGE through the real rail control");
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  await new Promise((resolve) => setTimeout(resolve, 600));

  const targetBaseline = await captureMotionElements(send);
  const staticFinal = await evaluateByValue(
    send,
    `(() => {
      const routing = document.querySelector('.za-routing-progress');
      const rail = document.querySelector('.za-command-rail');
      if (!routing || !rail) return null;
      const routingRect = routing.getBoundingClientRect();
      const routingParentRect = routing.parentElement?.getBoundingClientRect();
      const railRect = rail.getBoundingClientRect();
      if (!routingParentRect) return null;
      return {
        routing: { width: routingParentRect.width, height: routingRect.height },
        rail: { width: 220, height: railRect.height },
        pip: { width: 26, height: 8 },
      };
    })()`,
  );
  if (!staticFinal) throw new Error("semantic motion hooks are missing from the target baseline");

  const hudPath = await evaluateByValue(
    send,
    `(async () => {
      const scroller = document.querySelector('#main-content');
      const section = document.querySelector('section[data-deck="4"]');
      const hud = document.querySelector('.za-corner-hud');
      const progress = document.querySelector('.za-airframe-progress');
      const routingControls = [...document.querySelectorAll('button[aria-controls="routing-lane-detail"]')];
      const routingTarget = routingControls.at(-1);
      const pipTarget = [...document.querySelectorAll('.za-lcars-pip')]
        .find((element) => element.getAttribute('aria-label') === ${JSON.stringify(MOTION_PIP_LABEL)});
      const firstPip = document.querySelector('.za-lcars-pip');
      const lineageControl = document.querySelector('button[aria-label="05 LINEAGE · Go to LINEAGE deck"]');
      if (
        !scroller || !section || !hud || !progress || routingControls.length < 2 || !routingTarget ||
        !pipTarget || !firstPip || !lineageControl
      ) return { ok: false, reason: 'LINEAGE HUD structure or real reset controls are missing' };
      const settle = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 340))));
      const collectVisiblePoints = async () => {
        const available = Math.max(120, section.offsetHeight - Math.min(scroller.clientHeight * 0.45, 480));
        const visible = [];
        for (const fraction of [0.8, 0.65, 0.5, 0.35, 0.2]) {
          const top = Math.min(scroller.scrollHeight - scroller.clientHeight, section.offsetTop + available * fraction);
          scroller.scrollTo({ top, behavior: 'auto' });
          await settle();
          const rect = progress.getBoundingClientRect();
          if (
            scroller.getAttribute('data-active-deck') === '4' &&
            !hud.classList.contains('yield') && rect.width > 0 && rect.height > 0
          ) {
            visible.push({
              top: scroller.scrollTop,
              sectionOffset: scroller.scrollTop - section.offsetTop,
              targetWidth: progress.style.width,
              rect: { width: rect.width, height: rect.height },
            });
          }
        }
        return visible;
      };
      routingTarget.click();
      document.querySelector('.za-command-rail button[aria-label="Expand command rail"]')?.click();
      pipTarget.click();
      await settle();
      await settle();
      const finalPoints = await collectVisiblePoints();
      if (!pipTarget.matches('.on[aria-current="true"]') || finalPoints.length === 0) {
        return { ok: false, reason: 'target craft did not expose a naturally visible final HUD path', points: finalPoints };
      }

      routingControls[1].click();
      document.querySelector('.za-command-rail button[aria-label="Stow command rail"]')?.click();
      firstPip.click();
      await settle();
      lineageControl.click();
      await settle();
      await settle();
      const points = await collectVisiblePoints();
      const pair = points.flatMap((start) => finalPoints.map((final) => ({ start, final })))
        .find(({ start, final }) => Math.abs(start.rect.width - final.rect.width) > 3);
      if (!pair) return { ok: false, reason: 'a distinct naturally visible LINEAGE HUD path was not found', points: [...points, ...finalPoints] };
      const { start, final } = pair;
      scroller.scrollTo({ top: start.top, behavior: 'auto' });
      await settle();
      const resetRect = progress.getBoundingClientRect();
      if (
        hud.classList.contains('yield') || resetRect.width <= 0 || resetRect.height <= 0 ||
        pipTarget.matches('.on[aria-current="true"]') || routingControls[1].getAttribute('aria-pressed') !== 'true' ||
        !document.querySelector('.za-command-rail button[aria-label="Expand command rail"]')
      ) {
        return { ok: false, reason: 'the real HUD and controls did not return to the normal-motion start state', points };
      }
      return { ok: true, start: { ...start, rect: { width: resetRect.width, height: resetRect.height } }, final };
    })()`,
    true,
  );
  if (!hudPath.ok) throw new Error(`${hudPath.reason}: ${JSON.stringify(hudPath.points ?? [])}`);
  const normalStartCapture = await captureMotionElements(send);

  const normalIntermediateCapture = await evaluateByValue(
    send,
    `(async () => {
      const capture = ${MOTION_CAPTURE_SOURCE};
      const startRects = ${JSON.stringify(
        Object.fromEntries(Object.entries(normalStartCapture.elements).map(([name, sample]) => [name, sample.rect])),
      )};
      const dimensions = { routing: ['width'], hud: ['width'], rail: ['width'], pip: ['width', 'height'] };
      const routingControls = [...document.querySelectorAll('button[aria-controls="routing-lane-detail"]')];
      const routing = routingControls.at(-1);
      const rail = document.querySelector('.za-command-rail button[aria-label="Expand command rail"]');
      const pip = [...document.querySelectorAll('.za-lcars-pip')]
        .find((element) => element.getAttribute('aria-label') === ${JSON.stringify(MOTION_PIP_LABEL)});
      const scroller = document.querySelector('#main-content');
      const section = document.querySelector('section[data-deck="4"]');
      const progress = document.querySelector('.za-airframe-progress');
      const progressTrack = progress?.parentElement;
      if (!routing || !rail || !pip || !scroller || !section || !progress || !progressTrack) {
        return { ok: false, reason: 'real motion controls are missing' };
      }
      routing.click();
      rail.click();
      pip.click();
      const startedAt = performance.now();
      return new Promise((resolve) => {
        let frameCount = 0;
        const trace = [];
        let finalRects = null;
        let expectedHudTargetWidth = null;
        const isStrictlyIntermediate = (sample) => Object.entries(dimensions).every(([name, axes]) =>
          axes.every((axis) => {
            const start = startRects[name][axis];
            const final = finalRects?.[name]?.[axis];
            const value = sample.elements[name]?.rect?.[axis];
            return (
              Number.isFinite(value) &&
              Number.isFinite(final) &&
              Math.abs(value - start) > 0.01 &&
              Math.abs(value - final) > 0.01
            );
          })
        );
        const inspect = () => {
          frameCount += 1;
          const sample = capture();
          const elapsedMs = performance.now() - startedAt;
          const hudTargetWidth = progress.style.width;
          trace.push({ elapsedMs, hudTargetWidth, rects: Object.fromEntries(Object.entries(sample.elements).map(([name, value]) => [name, value?.rect])) });
          if (hudTargetWidth === expectedHudTargetWidth && isStrictlyIntermediate(sample)) {
            resolve({
              ok: true,
              frameCount,
              elapsedMs,
              trace,
              ...sample,
            });
          } else if (frameCount >= 10 || elapsedMs >= 220) {
            resolve({ ok: false, reason: 'all four motion targets did not become intermediate together', frameCount, elapsedMs, trace, ...sample });
          } else {
            requestAnimationFrame(inspect);
          }
        };
        requestAnimationFrame(() => {
          scroller.scrollTo({ top: Math.max(0, section.offsetTop - 8), behavior: 'auto' });
          requestAnimationFrame(() => {
            scroller.scrollTo({ top: section.offsetTop + ${Number(hudPath.final.sectionOffset)}, behavior: 'auto' });
            scroller.dispatchEvent(new Event('scroll'));
            requestAnimationFrame(() => {
              const maxScroll = Math.max(1, scroller.scrollHeight - scroller.clientHeight);
              const targetProgressPercent = Math.round(Math.min(1, Math.max(0, scroller.scrollTop / maxScroll)) * 100);
              expectedHudTargetWidth = \`\${targetProgressPercent}%\`;
              const trackRect = progressTrack.getBoundingClientRect();
              const progressRect = progress.getBoundingClientRect();
              finalRects = {
                ...${JSON.stringify(staticFinal)},
                hud: { width: (trackRect.width * targetProgressPercent) / 100, height: progressRect.height },
              };
              inspect();
            });
          });
        });
      });
    })()`,
    true,
  );
  if (!normalIntermediateCapture.ok) {
    throw new Error(`${normalIntermediateCapture.reason}: ${JSON.stringify(normalIntermediateCapture)}`);
  }

  await setReducedMotionPreference(send, true);
  await waitForReducedMotionPreference(send, true, 2);
  const canonicalScroll = await synchronizeMotionScroll(send);
  const expectedFinal = { ...staticFinal, hud: canonicalScroll.rect };
  const reducedAfterInterruptCapture = await captureMotionElements(send);

  await setReducedMotionPreference(send, false);
  await waitForReducedMotionPreference(send, false, 0);
  const restoredSamples = await captureRestoredMotionSeries(send);

  await setReducedMotionPreference(send, true);
  await waitForReducedMotionPreference(send, true, 2);
  await synchronizeMotionScroll(send);
  const reducedAgainCapture = await captureMotionElements(send);

  const scenario = {
    interruptSettledWithinFrames: 2,
    pipTargetWasUnselected: targetBaseline.pipTargetSelected === false,
    pipTargetIsSelected:
      normalIntermediateCapture.pipTargetSelected === true &&
      reducedAfterInterruptCapture.pipTargetSelected === true &&
      restoredSamples.every((sample) => sample.pipTargetSelected === true) &&
      reducedAgainCapture.pipTargetSelected === true,
    normalStart: normalStartCapture.elements,
    normalIntermediate: normalIntermediateCapture.elements,
    expectedFinal,
    synchronization: canonicalScroll,
    reducedAfterInterrupt: reducedAfterInterruptCapture.elements,
    restoredSamples: restoredSamples.map(({ atMs, observedAtMs, elements }) => ({ atMs, observedAtMs, elements })),
    reducedAgain: reducedAgainCapture.elements,
  };
  const failures = motionPreferenceAcceptanceFailures(scenario);
  return {
    ...scenario,
    failures,
    hudPath,
    observedRestoreTimesMs: restoredSamples.map((sample) => sample.observedAtMs),
    ok: failures.length === 0,
  };
}

async function main() {
  const resources = {};
  const runGateWithCleanup = (operation) => runWithLayoutCleanup(operation, resources, { browserExitTimeoutMs: 5_000 });
  await runGateWithCleanup(async () => {
    const server = (resources.server = await serveDist());
    const targetUrl = `http://127.0.0.1:${server.address().port}/command-deck.html`;
    const profile = (resources.profile = await mkdtemp(path.join(tmpdir(), "cashio-layout-")));
    const browser = (resources.browser = spawn(
      browserExecutable(),
      [
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--no-first-run",
        "--no-default-browser-check",
        "--remote-debugging-port=0",
        `--user-data-dir=${profile}`,
        targetUrl,
      ],
      { stdio: ["ignore", "ignore", "pipe"] },
    ));
    const pageEndpoint = await pageDebugger(await devtoolsEndpoint(browser), targetUrl);
    const connection = await connectCdp(pageEndpoint);
    resources.socket = connection.socket;
    const { send } = connection;
    const reportedBrowserVersion = await send("Browser.getVersion");
    const expectedMajor = expectedBrowserMajor();
    const browserVersionFailures = browserVersionAcceptanceFailures(reportedBrowserVersion, expectedMajor);
    const browserVersion = {
      ...reportedBrowserVersion,
      expectedMajor: expectedMajor || null,
      failures: browserVersionFailures,
      ok: browserVersionFailures.length === 0,
    };
    await send("Runtime.enable");
    await send("Page.enable");
    await send("Page.addScriptToEvaluateOnNewDocument", {
      source: `(() => {
        if (!location.search.includes("validity-matrix")) return;
        const nativeDateNow = Date.now.bind(Date);
        let controlledNow = Date.parse("2026-08-30T12:00:00Z");
        const nativeSetTimeout = window.setTimeout.bind(window);
        const nativeClearTimeout = window.clearTimeout.bind(window);
        const validityTimers = new Map();
        Date.now = () => controlledNow;
        window.setTimeout = (callback, delay = 0, ...args) => {
          const id = nativeSetTimeout(callback, delay, ...args);
          if (Number(delay) >= 60_000) validityTimers.set(id, { callback, args });
          return id;
        };
        window.clearTimeout = (id) => {
          validityTimers.delete(id);
          return nativeClearTimeout(id);
        };
        Object.defineProperties(window, {
          __v35SetValidityNow: {
            value: (next) => { controlledNow = Number(next); },
          },
          __v35RunValidityTimer: {
            value: () => {
              const entries = [...validityTimers.entries()];
              const entry = entries.at(-1);
              if (!entry) return false;
              const [id, timer] = entry;
              validityTimers.delete(id);
              nativeClearTimeout(id);
              timer.callback(...timer.args);
              return true;
            },
          },
          __v35RestoreDateNow: {
            value: () => {
              controlledNow = nativeDateNow();
              Date.now = nativeDateNow;
            },
          },
        });
      })();`,
    });
    await send("Page.addScriptToEvaluateOnNewDocument", {
      source: `(() => {
        if (!location.search.includes("critical-parity")) return;
        const nativeSetTimeout = window.setTimeout.bind(window);
        const nativeClearTimeout = window.clearTimeout.bind(window);
        let heldActivation = null;
        const activationErrors = [];
        const heldId = 2_500_000_000;
        window.setTimeout = (callback, delay = 0, ...args) => {
          if (Number(delay) === 250 && heldActivation == null) {
            heldActivation = { callback, args };
            return heldId;
          }
          return nativeSetTimeout(callback, delay, ...args);
        };
        window.clearTimeout = (id) => {
          if (id === heldId) {
            heldActivation = null;
            return;
          }
          nativeClearTimeout(id);
        };
        Object.defineProperty(window, "__v35ReleaseCriticalActivation", {
          value: () => {
            const held = heldActivation;
            heldActivation = null;
            if (!held) throw new Error("critical activation was not held");
            held.callback(...held.args);
          },
        });
        Object.defineProperty(window, "__v35CriticalActivationHeld", {
          get: () => heldActivation != null,
        });
        addEventListener("error", (event) => activationErrors.push(event.message));
        addEventListener("unhandledrejection", (event) => activationErrors.push(String(event.reason)));
        Object.defineProperty(window, "__v35CriticalActivationErrors", { value: activationErrors });
      })();`,
    });
    await send("Page.addScriptToEvaluateOnNewDocument", {
      source: `(() => {
        if (!location.search.includes("startup-native")) return;
        const frames = [];
        Object.defineProperty(window, "__v35DirectFrames", { value: frames });
        let count = 0;
        const sample = () => {
          const root = document.querySelector("#root");
          const scroller = document.querySelector("#main-content");
          const sections = [...document.querySelectorAll("section[data-deck]")];
          if (root && scroller && sections.length) {
            const scrollerTop = scroller.getBoundingClientRect().top;
            const nearest = sections.reduce((best, section) => {
              const deck = Number(section.getAttribute("data-deck"));
              const delta = Math.abs(section.getBoundingClientRect().top - scrollerTop);
              return delta < best.delta ? { deck, delta } : best;
            }, { deck: -1, delta: Number.POSITIVE_INFINITY });
            frames.push({
              activated: root.dataset.clientActivated === "true",
              present: true,
              nearestDeck: nearest.deck,
              visibility: getComputedStyle(root).visibility,
              scrollTop: scroller.scrollTop,
              expectedScrollTop: (() => {
                const anchor = document.getElementById(location.hash.slice(1));
                const section = anchor?.closest("section[data-deck]");
                if (!section) return null;
                return Math.min(Math.max(0, section.offsetTop - 8), Math.max(0, scroller.scrollHeight - scroller.clientHeight));
              })(),
              sectionTop: (() => {
                const anchor = document.getElementById(location.hash.slice(1));
                return anchor?.closest("section[data-deck]")?.getBoundingClientRect().top ?? null;
              })(),
              anchorTop: document.getElementById(location.hash.slice(1))?.getBoundingClientRect().top ?? null,
              expectedSectionTop: (() => {
                const anchor = document.getElementById(location.hash.slice(1));
                const section = anchor?.closest("section[data-deck]");
                if (!section) return null;
                const expectedScrollTop = Math.min(Math.max(0, section.offsetTop - 8), Math.max(0, scroller.scrollHeight - scroller.clientHeight));
                return section.offsetTop - expectedScrollTop;
              })(),
              atMs: performance.now(),
            });
            const frame = frames.at(-1);
            frame.scrollAlignmentDelta = Math.abs(frame.scrollTop - frame.expectedScrollTop);
            frame.sectionAlignmentDelta = Math.abs(frame.sectionTop - frame.expectedSectionTop);
          }
          count += 1;
          if (count < 60 && root?.dataset.clientActivated !== "true") requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      })();`,
    });
    const criticalShellParity = [
      await runCriticalShellParity(send, targetUrl, 390, 844, true),
      await runCriticalShellParity(send, targetUrl, 1280, 900, false),
    ];
    for (const result of criticalShellParity) {
      if (!result.ok) console.error(JSON.stringify(result, null, 2));
      assert.equal(
        result.ok,
        true,
        `Critical shell drifted from activated geometry at ${result.width}px: ${result.failures.join("; ")}`,
      );
    }
    const earlyActivation = await runEarlyActivationAcceptance(send, targetUrl);
    assert.equal(earlyActivation.ok, true, `Early activation outcomes failed: ${earlyActivation.failures.join("; ")}`);
    await send("Emulation.setEmulatedMedia", { media: "screen", features: [] });
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await send("Page.navigate", { url: `${targetUrl}?validity-matrix` });
    await waitForApp(send);
    await send("Runtime.evaluate", {
      expression: "new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))",
      awaitPromise: true,
    });
    const validityGeometry = await collectValidityGeometryMatrix(send);
    await send("Runtime.evaluate", { expression: "window.__v35RestoreDateNow()" });
    await setValidityLayoutState(send, 1280, false, false);
    const validityGeometryFailures = validityGeometryAcceptanceFailures(validityGeometry);
    const validityGeometryResult = {
      ok: validityGeometryFailures.length === 0,
      failures: validityGeometryFailures,
      states: validityGeometry.map(summarizeValidityGeometryState),
      defectEvidence: summarizeValidityGeometryDefects(validityGeometry),
    };
    assert.equal(
      validityGeometryResult.ok,
      true,
      `Full validity-state geometry acceptance failed: ${JSON.stringify({ failures: validityGeometryResult.failures, defectEvidence: validityGeometryResult.defectEvidence })}`,
    );
    const assetEvaluation = await send("Runtime.evaluate", {
      expression: `(async () => {
        const expected = [
          { src: "/plates/command-desktop.avif", type: "image/avif", width: 1440, height: 810 },
          { src: "/plates/command-desktop.webp", type: "image/webp", width: 1440, height: 810 },
          { src: "/plates/command-mobile.avif", type: "image/avif", width: 768, height: 432 },
          { src: "/plates/command-mobile.webp", type: "image/webp", width: 768, height: 432 },
        ];
        const decoded = await Promise.all(expected.map(async (asset) => {
          try {
            const response = await fetch(asset.src, { cache: "no-store" });
            const contentType = response.headers.get("content-type")?.split(";", 1)[0] ?? null;
            const image = new Image();
            image.src = asset.src;
            await image.decode();
            return { ...asset, ok: response.ok && contentType === asset.type && image.naturalWidth === asset.width && image.naturalHeight === asset.height, status: response.status, contentType, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight };
          } catch (error) {
            return { ...asset, ok: false, error: error instanceof Error ? error.message : String(error) };
          }
        }));
        return { ok: decoded.every((asset) => asset.ok), decoded };
      })()`,
      awaitPromise: true,
      returnByValue: true,
    });
    if (assetEvaluation.exceptionDetails) {
      throw new Error(assetEvaluation.exceptionDetails.exception?.description ?? assetEvaluation.exceptionDetails.text);
    }
    const decodedAssets = assetEvaluation.result.value;
    const desktopEvaluation = await send("Runtime.evaluate", {
      expression: `(() => {
        const pips = [...document.querySelectorAll(".za-lcars-pip")].map((element) => {
          const rect = element.getBoundingClientRect();
          return { width: rect.width, height: rect.height };
        });
        const actions = document.querySelector('section[data-deck="0"] .za-snapshot-actions');
        const rect = actions?.getBoundingClientRect();
        const failures = [];
        if (!actions || !rect) failures.push("desktop Snapshot action row is missing");
        else if (rect.height < 48) failures.push("desktop Snapshot action row measured " + rect.height + "px");
        return { ok: failures.length === 0, failures, pips, actions: rect && { width: rect.width, height: rect.height } };
      })()`,
      returnByValue: true,
    });
    const desktopLayout = desktopEvaluation.result.value;
    const desktopPips = desktopLayout.pips;
    desktopLayout.failures.push(
      ...desktopPips.flatMap((pip, index) => touchTargetAcceptanceFailures(pip, `aircraft selector ${index + 1}`)),
    );
    desktopLayout.ok = desktopLayout.failures.length === 0;
    const desktopFlightEvaluation = await send("Runtime.evaluate", {
      expression: `(async () => {
        const settle = async (delay = 0) => {
          if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
          await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        };
        const rail = document.querySelector(".za-command-rail");
        const expand = rail?.querySelector('button[aria-label="Expand command rail"]');
        if (!rail || !expand) return { error: "desktop expanded flight control setup is missing" };
        expand.click();
        await settle(350);
        const start = rail.querySelector('button[aria-label="Run the 30-second flight"]');
        if (!start) return { error: "desktop flight start control is missing after expansion" };
        start.click();
        await settle();
        const status = rail.querySelector('section[aria-label="30-second flight status"]');
        const state = status?.querySelector('p[aria-live="polite"]');
        const progress = status?.querySelector('ol[aria-label="Flight progress"] [aria-current="step"]');
        const now = [...(status?.querySelectorAll(":scope > p") ?? [])].find((element) =>
          element.textContent?.trim().startsWith("NOW ·"),
        );
        const stop = status?.querySelector('button[aria-label="Stop the 30-second flight"]');
        const fontSize = (element) => element ? parseFloat(getComputedStyle(element).fontSize) : Number.NaN;
        const criticalTelemetryFontSizesPx = {
          state: fontSize(state),
          progress: fontSize(progress),
          now: fontSize(now),
        };
        stop?.click();
        await settle();
        rail.querySelector('button[aria-label="Stow command rail"]')?.click();
        await settle(350);
        return { viewport: [innerWidth, innerHeight], criticalTelemetryFontSizesPx };
      })()`,
      awaitPromise: true,
      returnByValue: true,
    });
    if (desktopFlightEvaluation.exceptionDetails) {
      throw new Error(
        desktopFlightEvaluation.exceptionDetails.exception?.description ??
          desktopFlightEvaluation.exceptionDetails.text,
      );
    }
    const desktopFlightTelemetry = desktopFlightEvaluation.result.value;
    desktopFlightTelemetry.failures = desktopFlightTelemetry.error
      ? [desktopFlightTelemetry.error]
      : flightTelemetryAcceptanceFailures(
          desktopFlightTelemetry.criticalTelemetryFontSizesPx,
          desktopFlightTelemetry.viewport?.[0],
        );
    desktopFlightTelemetry.ok = desktopFlightTelemetry.failures.length === 0;
    const tickerTelemetry = [];
    for (const [width, height, mobile] of [
      [1280, 900, false],
      [320, 844, true],
      [390, 844, true],
    ]) {
      tickerTelemetry.push(await collectTickerTelemetry(send, width, height, mobile));
    }
    const snapshotGeometry = [];
    for (const width of [320, 390]) {
      await settleViewport(send, width, true);
      const evaluated = await send("Runtime.evaluate", {
        expression: `(() => {
        document.documentElement.style.setProperty("--za-safe-area-inset-bottom", "${SAFE_AREA_PX}px");
        document.querySelector(".za-scroll")?.scrollTo({ top: 0 });
        const rail = document.querySelector(".za-mobile-rail-safe");
        const railRect = rail.getBoundingClientRect();
        const pips = ${JSON.stringify(desktopPips)};
        const clearance = [...document.querySelectorAll("section[data-deck], footer")].map((element) => ({
          tag: element.tagName,
          deck: element.getAttribute("data-deck"),
          paddingBottom: parseFloat(getComputedStyle(element).paddingBottom),
        }));
        const controls = [...document.querySelectorAll('section[data-deck="0"] .za-snapshot-modes button, section[data-deck="0"] .za-snapshot-actions button')];
        const actionRow = document.querySelector('section[data-deck="0"] .za-snapshot-actions');
        const actionButtons = [...(actionRow?.querySelectorAll("button") ?? [])];
        const actionStyle = actionRow && getComputedStyle(actionRow);
        const expectedControls = ["TECHNICAL", "EXECUTIVE", "TAKE THE 30-SECOND FLIGHT", "EXPLORE THE DECKS", "OPEN E.V.E. CONSOLE"];
        const eveInput = document.querySelector("#eve-command");
        const eveRun = eveInput?.closest("form")?.querySelector('button[type="submit"]');
        const eveTargetRect = (element) => {
          const target = element?.getBoundingClientRect();
          return target ? { width: target.width, height: target.height } : null;
        };
        const eveCriticalTelemetryFontSizesPx = [...document.querySelectorAll("[data-eve-safety-boundary]")].map((element) =>
          parseFloat(getComputedStyle(element).fontSize),
        );
        const failures = [];
        const readabilityTargets = {
          headline: 'section[data-deck="0"] h1',
          lede: '.za-snapshot-lede',
          body: '.za-snapshot-copy',
          telemetry: 'section[data-deck="0"] .za-critical-telemetry',
          technical: '.za-mode-options > button:first-child',
          executive: '.za-mode-options > button:last-child',
          descend: '.za-snapshot-actions > button:first-child',
          eve: '.za-snapshot-secondary > button:last-child',
          activeRail: 'nav[aria-label="Mobile command decks"] button[aria-current="page"]',
        };
        const readability = Object.entries(readabilityTargets).map(([name, selector]) => {
          const element = document.querySelector(selector);
          if (!element) return { name, selector, present: false };
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          const visible = style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) > 0;
          const viewportClipped = rect.left < -0.5 || rect.right > innerWidth + 0.5;
          const contentClipped = element.scrollWidth > element.clientWidth + 1;
          let ancestorClipped = false;
          let ancestor = element.parentElement;
          while (ancestor && ancestor !== document.body) {
            const ancestorStyle = getComputedStyle(ancestor);
            if (["hidden", "clip"].includes(ancestorStyle.overflowX)) {
              const boundary = ancestor.getBoundingClientRect();
              if (rect.left < boundary.left - 0.5 || rect.right > boundary.right + 0.5) ancestorClipped = true;
            }
            ancestor = ancestor.parentElement;
          }
          return {
            name,
            selector,
            present: true,
            visible,
            left: rect.left,
            right: rect.right,
            clientWidth: element.clientWidth,
            scrollWidth: element.scrollWidth,
            viewportClipped,
            contentClipped,
            ancestorClipped,
          };
        });
        readability.forEach((item) => {
          if (!item.present) failures.push("missing readability target " + item.name);
          else if (!item.visible || item.viewportClipped || item.contentClipped || item.ancestorClipped) {
            failures.push("Snapshot readability target " + item.name + " is horizontally clipped: " + JSON.stringify(item));
          }
        });
        if (pips.length !== 8) failures.push("expected eight aircraft pips");
        pips.forEach((pip, index) => {
          if (pip.width < 44 || pip.height < 44) failures.push("pip " + (index + 1) + " measured " + pip.width + "x" + pip.height);
        });
        const railPadding = parseFloat(getComputedStyle(rail).paddingBottom);
        if (railRect.height < 80) {
          failures.push("rail height " + railRect.height + "px is below 60px + mocked 20px inset");
        }
        if (railPadding < 20) {
          failures.push("rail bottom padding " + railPadding + "px does not include mocked inset");
        }
        clearance.forEach((item) => {
          if (item.paddingBottom < 176) failures.push(item.tag + " deck=" + item.deck + " padding " + item.paddingBottom + "px is below 6rem + 60px + 20px");
        });
        if (controls.length !== expectedControls.length) failures.push("expected exactly five Snapshot controls, found " + controls.length);
        const controlRects = controls.map((control) => {
          const rect = control.getBoundingClientRect();
          const style = getComputedStyle(control);
          return { label: control.textContent.trim().replace(/\\s+/g, " "), top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, width: rect.width, height: rect.height, disabled: control.disabled, displayed: style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0" };
        });
        expectedControls.forEach((expected) => {
          if (!controlRects.some((control) => control.label.includes(expected))) failures.push("missing Snapshot control " + expected);
        });
        controlRects.forEach((control) => {
          if (!control.displayed || control.disabled || control.width <= 0 || control.height <= 0) failures.push("Snapshot control " + control.label + " is not displayed, enabled, and nonzero");
          if (control.width < 44 || control.height < 44) failures.push("Snapshot control " + control.label + " measured " + control.width + "x" + control.height + "px, below 44x44");
          if (control.left < 0 || control.right > innerWidth) failures.push("Snapshot control " + control.label + " exceeds the " + innerWidth + "px viewport");
          if (control.top < 0 || control.bottom > railRect.top) failures.push("Snapshot control " + control.label + " must fit above rail: " + control.top + "px to " + control.bottom + "px, rail starts " + railRect.top + "px");
        });
        for (let i = 0; i < controlRects.length; i++) for (let j = i + 1; j < controlRects.length; j++) {
          const a = controlRects[i], b = controlRects[j];
          if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) failures.push("Snapshot controls overlap: " + a.label + " and " + b.label);
        }
        const actionRects = actionButtons.map((button) => button.getBoundingClientRect());
        const gridColumns = actionStyle?.gridTemplateColumns.trim().split(/\\s+/).filter(Boolean) ?? [];
        if (actionStyle?.display !== "flex" || actionButtons.length !== 3) failures.push("Snapshot must show a prominent flight with two secondary actions");
        if (actionRects.length === 3 && (actionRects[0].bottom > actionRects[1].top || Math.abs(actionRects[1].top - actionRects[2].top) > 0.5)) failures.push("Snapshot secondary actions must share a row below the flight");
        if (document.documentElement.scrollWidth > innerWidth) failures.push("document width " + document.documentElement.scrollWidth + "px exceeds viewport " + innerWidth + "px");
        return { ok: failures.length === 0, failures, viewport: [innerWidth, innerHeight], pips, rail: { height: railRect.height, top: railRect.top, bottom: railRect.bottom, paddingBottom: railPadding }, clearance, controls: controlRects, readability, eveControls: { input: eveTargetRect(eveInput), run: eveTargetRect(eveRun), criticalTelemetryFontSizesPx: eveCriticalTelemetryFontSizesPx }, actionGrid: { display: actionStyle?.display, columns: gridColumns, buttons: actionRects.map((rect) => ({ top: rect.top, width: rect.width, height: rect.height })) } };
      })()`,
        returnByValue: true,
      });
      if (evaluated.exceptionDetails) {
        throw new Error(evaluated.exceptionDetails.exception?.description ?? evaluated.exceptionDetails.text);
      }
      const mobileLayout = evaluated.result.value;
      mobileLayout.failures.push(
        ...touchTargetAcceptanceFailures(mobileLayout.eveControls?.input, "E.V.E. input"),
        ...touchTargetAcceptanceFailures(mobileLayout.eveControls?.run, "E.V.E. RUN control"),
        ...criticalTelemetryAcceptanceFailures(mobileLayout.eveControls?.criticalTelemetryFontSizesPx, width, "E.V.E."),
      );
      mobileLayout.ok = mobileLayout.failures.length === 0;
      snapshotGeometry.push(mobileLayout);
    }
    const flights = [];
    const cinemas = [];
    for (const width of [320, 390]) {
      await settleViewport(send, width, true);
      const flightEvaluation = await send("Runtime.evaluate", {
        expression: `(async () => {
          const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
          const settle = async () => {
            await nextFrame();
            await nextFrame();
            await new Promise((resolve) => setTimeout(resolve, 20));
          };
          const rectOf = (element) => {
            const rect = element.getBoundingClientRect();
            return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
          };
          const alphaOf = (element) => {
            const color = getComputedStyle(element).backgroundColor;
            if (color === "transparent") return 0;
            if (color.includes("/")) return Number.parseFloat(color.split("/").at(-1));
            if (color.startsWith("rgba(")) return Number.parseFloat(color.split(",").at(-1));
            return 1;
          };
          const overlaps = (first, second) =>
            first.left < second.right && first.right > second.left && first.top < second.bottom && first.bottom > second.top;
          const scroller = document.querySelector("#main-content");
          const contact = document.querySelector('section[data-deck="8"]');
          const email = contact?.querySelector('.za-hail a[href^="mailto:"]');
          const receipt = contact?.querySelector('section[aria-labelledby="black-box-receipt-heading"]');
          if (!scroller || !contact || !email || !receipt) return { error: "Contact scroll scenario is missing" };
          const selectContact = async () => {
            scroller.scrollTo({ top: Math.max(0, contact.offsetTop - 8), behavior: "auto" });
            await settle();
          };
          const contentOverlaps = (surface) =>
            [email, receipt].some((element) => overlaps(element.getBoundingClientRect(), surface.getBoundingClientRect()));
          const passReceiptBeneath = async (surface) => {
            for (let attempt = 0; attempt < 6; attempt++) {
              if (contentOverlaps(surface)) return true;
              const surfaceRect = surface.getBoundingClientRect();
              const receiptRect = receipt.getBoundingClientRect();
              scroller.scrollTop += receiptRect.top - surfaceRect.top - 8;
              scroller.dispatchEvent(new Event("scroll"));
              await settle();
            }
            return contentOverlaps(surface);
          };

          document.documentElement.style.setProperty("--za-safe-area-inset-bottom", "${SAFE_AREA_PX}px");
          await selectContact();
          const inactive = document.querySelector(".za-mobile-flight-control");
          if (!inactive) return { error: "inactive mobile flight surface is missing" };
          const inactiveBefore = rectOf(inactive);
          const inactiveAlpha = alphaOf(inactive);
          const inactiveOverlap = await passReceiptBeneath(inactive);
          const inactiveAfter = rectOf(inactive);

          inactive.click();
          await settle();
          scroller.scrollTo({ top: 0, behavior: "auto" });
          await settle();
          await selectContact();
          const active = document.querySelector(".za-mobile-flight-control");
          const stop = active?.querySelector('button[aria-label="Stop the 30-second flight"]');
          if (!active || !stop) return { error: "active mobile flight panel or STOP FLIGHT control is missing" };
          const activeBefore = rectOf(active);
          const activeAlpha = alphaOf(active);
          const activeOverlap = await passReceiptBeneath(active);
          const activeAfter = rectOf(active);
          const state = active.querySelector('p[aria-live="polite"]');
          const progress = active.querySelector('ol[aria-label="Flight progress"] [aria-current="step"]');
          const now = [...active.querySelectorAll(":scope > p")].find((element) =>
            element.textContent?.trim().startsWith("NOW ·"),
          );
          const fontSize = (element) => element ? parseFloat(getComputedStyle(element).fontSize) : Number.NaN;

          return {
            viewport: [innerWidth, innerHeight],
            activeDeck: scroller.getAttribute("data-active-deck"),
            scrollerId: scroller.id,
            scrollerScrollTop: scroller.scrollTop,
            contentPassedUnderSurface: inactiveOverlap && activeOverlap,
            inactive: {
              tagName: inactive.tagName,
              backgroundAlpha: inactiveAlpha,
              beforeScroll: inactiveBefore,
              afterScroll: inactiveAfter,
            },
            active: {
              tagName: active.tagName,
              backgroundAlpha: activeAlpha,
              beforeScroll: activeBefore,
              afterScroll: activeAfter,
              criticalTelemetryFontSizesPx: {
                state: fontSize(state),
                progress: fontSize(progress),
                now: fontSize(now),
              },
              stopControl: { tagName: stop.tagName, ...rectOf(stop) },
            },
          };
        })()`,
        awaitPromise: true,
        returnByValue: true,
      });
      if (flightEvaluation.exceptionDetails) {
        throw new Error(
          flightEvaluation.exceptionDetails.exception?.description ?? flightEvaluation.exceptionDetails.text,
        );
      }
      const flight = flightEvaluation.result.value;
      flight.failures = flight.error ? [flight.error] : mobileFlightAcceptanceFailures(flight);
      flight.ok = flight.failures.length === 0;
      flights.push(flight);

      const directionRuns = [];
      for (const shiftKey of [false, true]) {
        const openingEvaluation = await send("Runtime.evaluate", {
          expression: `(async () => {
            const opener = document.querySelector('button[data-cmd="photo"]');
            const activeFlightStarted = Boolean(document.querySelector('.za-mobile-flight-control button[aria-label="Stop the 30-second flight"]'));
            if (!opener || !activeFlightStarted) return { opened: false, activeFlightStarted };
            opener.setAttribute("data-layout-cinema-opener", "true");
            opener.focus({ preventScroll: true });
            const openedFromExactOpener = document.activeElement === opener;
            opener.click();
            await new Promise((resolve) => setTimeout(resolve, 450));
            await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            const dialog = document.querySelector('[role="dialog"][aria-label="Cinema view"]');
            const exit = [...(dialog?.querySelectorAll("button") ?? [])].find((button) => button.textContent.trim() === "EXIT CINEMA");
            if (!dialog || !exit) return { opened: false, activeFlightStarted, openedFromExactOpener };
            const rect = exit.getBoundingClientRect();
            const style = getComputedStyle(exit);
            const exposedTabStops = [...document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]')]
              .filter((element) => element.tabIndex >= 0 && !element.disabled && !element.closest('[inert], [aria-hidden="true"]'))
              .filter((element) => {
                const candidate = element.getBoundingClientRect();
                const candidateStyle = getComputedStyle(element);
                return candidate.width > 0 && candidate.height > 0 && candidateStyle.display !== "none" && candidateStyle.visibility !== "hidden";
              })
              .map((element) => element.getAttribute("aria-label") || element.textContent.trim().replace(/\\s+/g, " "));
            return {
              opened: true,
              viewport: [innerWidth, innerHeight],
              activeFlightStarted,
              openedFromExactOpener,
              skipPresent: Boolean(document.querySelector('a[href="#main-content"]')),
              flightPresent: Boolean(document.querySelector(".za-mobile-flight-control")),
              exposedTabStops,
              exit: {
                visible: rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0",
                left: rect.left,
                right: rect.right,
                top: rect.top,
                bottom: rect.bottom,
                width: rect.width,
                height: rect.height,
              },
            };
          })()`,
          awaitPromise: true,
          returnByValue: true,
        });
        const opening = openingEvaluation.result.value;
        if (!opening.opened)
          throw new Error(`PHOTO cinema failed to open for ${shiftKey ? "Shift+Tab" : "Tab"} at ${width}px`);

        await send("Runtime.evaluate", {
          expression: `(() => {
            window.__zaLayoutTab = null;
            window.addEventListener("keydown", (event) => {
              if (event.key !== "Tab") return;
              setTimeout(() => {
                const active = document.activeElement;
                window.__zaLayoutTab = {
                  defaultPrevented: event.defaultPrevented,
                  activeLabel: active?.getAttribute("aria-label") || active?.textContent?.trim().replace(/\\s+/g, " ") || null,
                };
              }, 0);
            }, { once: true });
          })()`,
        });
        await send("Input.dispatchKeyEvent", {
          type: "keyDown",
          key: "Tab",
          code: "Tab",
          modifiers: shiftKey ? 8 : 0,
          windowsVirtualKeyCode: 9,
          nativeVirtualKeyCode: 9,
        });
        await send("Input.dispatchKeyEvent", {
          type: "keyUp",
          key: "Tab",
          code: "Tab",
          modifiers: shiftKey ? 8 : 0,
          windowsVirtualKeyCode: 9,
          nativeVirtualKeyCode: 9,
        });
        await new Promise((resolve) => setTimeout(resolve, 20));
        const tabEvaluation = await send("Runtime.evaluate", {
          expression: "window.__zaLayoutTab",
          returnByValue: true,
        });

        const escapeObserverEvaluation = await send("Runtime.evaluate", {
          expression: `(async () => {
            window.__zaLayoutEscape = { observerReady: false, observed: false, defaultPrevented: false };
            window.addEventListener("keydown", (event) => {
              if (event.key !== "Escape") return;
              setTimeout(() => {
                Object.assign(window.__zaLayoutEscape, {
                  observed: true,
                  defaultPrevented: event.defaultPrevented,
                });
              }, 0);
            }, { once: true });
            window.__zaLayoutEscape.observerReady = true;
            await new Promise((resolve) => setTimeout(resolve, 0));
            return window.__zaLayoutEscape.observerReady === true;
          })()`,
          awaitPromise: true,
          returnByValue: true,
        });
        if (escapeObserverEvaluation.result.value !== true) {
          throw new Error(`Escape observer failed to become ready for ${shiftKey ? "Shift+Tab" : "Tab"} at ${width}px`);
        }
        await send("Input.dispatchKeyEvent", {
          type: "keyDown",
          key: "Escape",
          code: "Escape",
          windowsVirtualKeyCode: 27,
          nativeVirtualKeyCode: 27,
        });
        await send("Input.dispatchKeyEvent", {
          type: "keyUp",
          key: "Escape",
          code: "Escape",
          windowsVirtualKeyCode: 27,
          nativeVirtualKeyCode: 27,
        });
        const escapeEvaluation = await send("Runtime.evaluate", {
          expression: `(async () => {
            const opener = document.querySelector('[data-layout-cinema-opener="true"]');
            for (let attempt = 0; attempt < 30; attempt++) {
              await new Promise((resolve) => setTimeout(resolve, 0));
              await new Promise((resolve) => requestAnimationFrame(resolve));
              if (
                window.__zaLayoutEscape?.observerReady === true &&
                window.__zaLayoutEscape?.observed === true &&
                !document.querySelector('[role="dialog"]') &&
                document.activeElement === opener
              ) break;
            }
            return {
              observerReady: window.__zaLayoutEscape?.observerReady === true,
              observed: window.__zaLayoutEscape?.observed === true,
              defaultPrevented: window.__zaLayoutEscape?.defaultPrevented === true,
              dialogPresent: Boolean(document.querySelector('[role="dialog"]')),
              activeIsOpener: document.activeElement === opener,
            };
          })()`,
          awaitPromise: true,
          returnByValue: true,
        });
        directionRuns.push({
          opening,
          key: tabEvaluation.result.value,
          escape: escapeEvaluation.result.value,
        });
      }

      const [tabRun, shiftTabRun] = directionRuns;
      const firstExit = tabRun.opening.exit;
      const boundariesPassedEachOpening = directionRuns.every(
        ({ opening }) =>
          !opening.skipPresent &&
          !opening.flightPresent &&
          opening.exposedTabStops.length === 1 &&
          opening.exposedTabStops[0] === "EXIT CINEMA",
      );
      const allOpeningsMatchedExitGeometry = directionRuns.every(
        ({ opening }) => JSON.stringify(opening.exit) === JSON.stringify(firstExit),
      );
      const cinema = {
        viewport: tabRun.opening.viewport,
        activeFlightStarted: directionRuns.every(({ opening }) => opening.activeFlightStarted),
        skipPresent: directionRuns.some(({ opening }) => opening.skipPresent),
        flightPresent: directionRuns.some(({ opening }) => opening.flightPresent),
        exposedTabStops: tabRun.opening.exposedTabStops,
        boundariesPassedEachOpening,
        allOpeningsMatchedExitGeometry,
        escapeObserverReady: directionRuns.every(({ escape }) => escape.observerReady === true),
        exit: firstExit,
        tab: {
          ...tabRun.key,
          openedFromExactOpener: tabRun.opening.openedFromExactOpener,
          escape: tabRun.escape,
        },
        shiftTab: {
          ...shiftTabRun.key,
          openedFromExactOpener: shiftTabRun.opening.openedFromExactOpener,
          escape: shiftTabRun.escape,
        },
      };
      cinema.failures = mobileCinemaAcceptanceFailures(cinema);
      cinema.ok = cinema.failures.length === 0;
      cinemas.push(cinema);

      await send("Runtime.evaluate", {
        expression: `(async () => {
          document.querySelector('.za-mobile-flight-control button[aria-label="Stop the 30-second flight"]')?.click();
          const scroller = document.querySelector("#main-content");
          scroller?.scrollTo({ top: 0, behavior: "auto" });
          await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        })()`,
        awaitPromise: true,
      });
    }
    await send("Emulation.setDeviceMetricsOverride", { width: 320, height: 844, deviceScaleFactor: 1, mobile: true });
    const narrowEvaluation = await send("Runtime.evaluate", {
      expression: `(() => {
        const section = document.querySelector('section[data-deck="8"]');
        const contact = section?.querySelector('.za-contact-copy');
        const email = contact?.querySelector('.za-hail a[href^="mailto:"]');
        const sectionRect = section?.getBoundingClientRect();
        const contactRect = contact?.getBoundingClientRect();
        const failures = [];
        if (!section || !contact || !email || !sectionRect || !contactRect) failures.push("Contact layout is missing");
        if (document.documentElement.scrollWidth > innerWidth) failures.push("document width " + document.documentElement.scrollWidth + "px exceeds viewport " + innerWidth + "px");
        if (section && section.scrollWidth > section.clientWidth) failures.push("Contact deck content width " + section.scrollWidth + "px exceeds its " + section.clientWidth + "px box");
        if (contactRect && (contactRect.left < 0 || contactRect.right > innerWidth)) failures.push("Contact scrim spans " + contactRect.left + "px to " + contactRect.right + "px in a " + innerWidth + "px viewport");
        if (email && email.scrollWidth > email.clientWidth) failures.push("Contact email width " + email.scrollWidth + "px exceeds its " + email.clientWidth + "px box");
        return {
          ok: failures.length === 0,
          failures,
          viewport: [innerWidth, innerHeight],
          documentWidth: document.documentElement.scrollWidth,
          section: section && { clientWidth: section.clientWidth, scrollWidth: section.scrollWidth },
          contact: contactRect && { left: contactRect.left, right: contactRect.right, width: contactRect.width },
          email: email && { clientWidth: email.clientWidth, scrollWidth: email.scrollWidth },
        };
      })()`,
      returnByValue: true,
    });
    if (narrowEvaluation.exceptionDetails) {
      throw new Error(
        narrowEvaluation.exceptionDetails.exception?.description ?? narrowEvaluation.exceptionDetails.text,
      );
    }
    const narrowResult = narrowEvaluation.result.value;
    const desktopEveScenarios = [];
    let desktopEveOverlayNegative;
    let desktopEveLocalizedChildNegative;
    let desktopEveVisualPointerNoneNegative;
    for (const [width, height] of [
      [1280, 720],
      [1440, 900],
    ]) {
      const landingEvidence = await waitForCanonicalEveLanding(send, targetUrl, width, height);
      await send("Runtime.evaluate", {
        expression:
          "new Promise((resolve) => setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(resolve)), 550))",
        awaitPromise: true,
      });
      const eveLayout = await collectDesktopEveScenario(send, landingEvidence);
      eveLayout.failures = eveLayout.error ? [eveLayout.error] : desktopEveAcceptanceFailures(eveLayout);
      eveLayout.ok = eveLayout.failures.length === 0;
      desktopEveScenarios.push(eveLayout);
      if (width === 1280) {
        await setDesktopEveCoveringOverlay(send, true);
        const covered = await collectDesktopEveScenario(send, landingEvidence);
        covered.failures = covered.error ? [covered.error] : desktopEveAcceptanceFailures(covered);
        await setDesktopEveCoveringOverlay(send, false);
        const recovered = await collectDesktopEveScenario(send, landingEvidence);
        recovered.failures = recovered.error ? [recovered.error] : desktopEveAcceptanceFailures(recovered);
        desktopEveOverlayNegative = {
          covered,
          recovered,
          rejectedInput: covered.failures.some((failure) =>
            /input center must be the topmost hit target/.test(failure),
          ),
          rejectedRun: covered.failures.some((failure) => /RUN center must be the topmost hit target/.test(failure)),
          rejectedSurface: covered.failures.some((failure) => /all nine E.V.E. prompt surface samples/.test(failure)),
          rejectedFixedSticky: covered.failures.some((failure) =>
            /fixed or sticky surface must not cover/.test(failure),
          ),
        };
        await setDesktopEveLocalizedChildObstruction(send, true);
        const localizedChildCovered = await collectDesktopEveScenario(send, landingEvidence);
        localizedChildCovered.failures = localizedChildCovered.error
          ? [localizedChildCovered.error]
          : desktopEveAcceptanceFailures(localizedChildCovered);
        await setDesktopEveLocalizedChildObstruction(send, false);
        const localizedChildRecovered = await collectDesktopEveScenario(send, landingEvidence);
        localizedChildRecovered.failures = localizedChildRecovered.error
          ? [localizedChildRecovered.error]
          : desktopEveAcceptanceFailures(localizedChildRecovered);
        desktopEveLocalizedChildNegative = {
          covered: localizedChildCovered,
          recovered: localizedChildRecovered,
          rejectedFixedSticky: localizedChildCovered.failures.some((failure) =>
            /fixed or sticky surface must not cover/.test(failure),
          ),
        };
        await setDesktopEveVisualPointerNoneObstruction(send, true);
        const visualPointerNoneCovered = await collectDesktopEveScenario(send, landingEvidence);
        visualPointerNoneCovered.failures = visualPointerNoneCovered.error
          ? [visualPointerNoneCovered.error]
          : desktopEveAcceptanceFailures(visualPointerNoneCovered);
        await setDesktopEveVisualPointerNoneObstruction(send, false);
        const visualPointerNoneRecovered = await collectDesktopEveScenario(send, landingEvidence);
        visualPointerNoneRecovered.failures = visualPointerNoneRecovered.error
          ? [visualPointerNoneRecovered.error]
          : desktopEveAcceptanceFailures(visualPointerNoneRecovered);
        desktopEveVisualPointerNoneNegative = {
          covered: visualPointerNoneCovered,
          recovered: visualPointerNoneRecovered,
          rejectedFixedSticky: visualPointerNoneCovered.failures.some((failure) =>
            /fixed or sticky surface must not cover/.test(failure),
          ),
        };
      }
    }
    await settleViewport(send, 1280, false, 900);
    await send("Page.navigate", { url: `${targetUrl}?layout-focus#deck=contact` });
    await waitForApp(send);
    const eveFocusEvaluation = await send("Runtime.evaluate", {
      expression: `(() => {
        const input = document.querySelector("#eve-command");
        if (!input) return { ok: false, reason: "E.V.E. command input is missing" };
        input.focus({ preventScroll: true });
        const style = getComputedStyle(input);
        const outlineWidth = parseFloat(style.outlineWidth);
        const visibleOutline = style.outlineStyle !== "none" && outlineWidth > 0;
        const visibleShadow = style.boxShadow !== "none";
        return {
          ok: document.activeElement === input && (visibleOutline || visibleShadow),
          active: document.activeElement === input,
          outlineStyle: style.outlineStyle,
          outlineWidth,
          boxShadow: style.boxShadow,
        };
      })()`,
      returnByValue: true,
    });
    const eveFocus = eveFocusEvaluation.result.value;
    const bitFocusEvaluation = await send("Runtime.evaluate", {
      expression: `(() => {
        const button = document.querySelector(".za-bit-control");
        if (!button) return { ok: false, reason: "Bit control is missing" };
        button.focus({ preventScroll: true });
        const style = getComputedStyle(button);
        const outlineWidth = parseFloat(style.outlineWidth);
        const visibleOutline = style.outlineStyle !== "none" && outlineWidth > 0;
        const visibleShadow = style.boxShadow !== "none";
        return {
          ok: document.activeElement === button && (visibleOutline || visibleShadow),
          active: document.activeElement === button,
          outlineStyle: style.outlineStyle,
          outlineWidth,
          boxShadow: style.boxShadow,
        };
      })()`,
      returnByValue: true,
    });
    const bitFocus = bitFocusEvaluation.result.value;
    const motionPreference = await runMotionPreferenceAcceptance(send, targetUrl);
    await send("Page.addScriptToEvaluateOnNewDocument", {
      source: `(() => {
        const messages = [];
        const describe = (value) => {
          if (value instanceof Error) return value.stack || value.message;
          if (typeof value === "string") return value;
          try { return JSON.stringify(value); } catch { return String(value); }
        };
        for (const level of ["warn", "error"]) {
          const original = console[level].bind(console);
          console[level] = (...args) => {
            messages.push({ level, text: args.map(describe).join(" ") });
            original(...args);
          };
        }
        addEventListener("error", (event) => messages.push({ level: "error", text: event.message }));
        addEventListener("unhandledrejection", (event) =>
          messages.push({ level: "error", text: "unhandled rejection: " + describe(event.reason) }),
        );
        Object.defineProperty(window, "__v35BrowserMessages", { value: messages });
      })();`,
    });
    await send("Page.navigate", { url: `${targetUrl}?hydration-console#deck=eve` });
    await waitForApp(send);
    const hydrationEvaluation = await send("Runtime.evaluate", {
      expression: `(async () => {
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const messages = window.__v35BrowserMessages ?? [];
        const root = document.querySelector('#root[data-prerendered="v35"]');
        return {
          ok: messages.length === 0 && Boolean(root) && document.querySelectorAll('#root').length === 1 &&
            document.querySelectorAll('section[data-deck]').length === 9 &&
            document.querySelector('#main-content')?.dataset.activeDeck === '7',
          messages,
          markedRoots: document.querySelectorAll('#root[data-prerendered="v35"]').length,
          roots: document.querySelectorAll('#root').length,
          decks: document.querySelectorAll('section[data-deck]').length,
          activeDeck: document.querySelector('#main-content')?.dataset.activeDeck ?? null,
        };
      })()`,
      awaitPromise: true,
      returnByValue: true,
    });
    const hydrationConsole = hydrationEvaluation.result.value;
    console.log(
      JSON.stringify(
        {
          bitFocus,
          browserVersion,
          cinemas,
          criticalShellParity,
          earlyActivation,
          decodedAssets,
          desktopFlightTelemetry,
          desktopLayout,
          desktopEveLocalizedChildNegative,
          desktopEveOverlayNegative,
          desktopEveScenarios,
          desktopEveVisualPointerNoneNegative,
          eveFocus,
          flights,
          hydrationConsole,
          motionPreference,
          snapshotGeometry,
          tickerTelemetry,
          validityGeometry: validityGeometryResult,
          mobile320: narrowResult,
        },
        null,
        2,
      ),
    );
    assert.equal(
      decodedAssets.ok,
      true,
      `Every optimized poster must decode with exact MIME and dimensions: ${JSON.stringify(decodedAssets.decoded)}`,
    );
    assert.equal(browserVersion.ok, true, browserVersion.failures.join("; "));
    criticalShellParity.forEach((result) =>
      assert.equal(result.ok, true, `Critical shell parity failed at ${result.width}px: ${result.failures.join("; ")}`),
    );
    assert.equal(earlyActivation.ok, true, earlyActivation.failures.join("; "));
    assert.equal(
      hydrationConsole.ok,
      true,
      `Direct-link hydration emitted browser warnings/errors or lost its built tree: ${JSON.stringify(hydrationConsole)}`,
    );
    assert.equal(validityGeometryResult.ok, true, validityGeometryResult.failures.join("; "));
    assert.equal(desktopLayout.ok, true, desktopLayout.failures.join("; "));
    assert.equal(
      desktopFlightTelemetry.ok,
      true,
      `Desktop flight telemetry acceptance failed: ${desktopFlightTelemetry.failures.join("; ")}`,
    );
    tickerTelemetry.forEach((scenario) =>
      assert.equal(
        scenario.ok,
        true,
        `Ticker telemetry acceptance failed at ${scenario.viewportWidth}x${scenario.viewportHeight}: ${scenario.failures.join("; ")}`,
      ),
    );
    assert.equal(bitFocus.ok, true, "Bit control must retain a visible keyboard focus indicator");
    assert.equal(eveFocus.ok, true, "E.V.E. command input must retain a visible keyboard focus indicator");
    assert.equal(
      motionPreference.ok,
      true,
      `Live motion preference acceptance failed: ${motionPreference.failures.join("; ")}`,
    );
    desktopEveScenarios.forEach((scenario) =>
      assert.equal(
        scenario.ok,
        true,
        `Desktop E.V.E. acceptance failed at ${scenario.viewport?.join("x")}: ${scenario.failures.join("; ")}`,
      ),
    );
    assert.ok(desktopEveOverlayNegative, "Desktop E.V.E. covering-overlay negative scenario must run");
    assert.equal(
      desktopEveOverlayNegative.rejectedInput,
      true,
      "A real covering overlay must fail the topmost E.V.E. input hit test",
    );
    assert.equal(
      desktopEveOverlayNegative.rejectedRun,
      true,
      "A real covering overlay must fail the topmost E.V.E. RUN hit test",
    );
    assert.equal(
      desktopEveOverlayNegative.rejectedSurface,
      true,
      "A real covering overlay must fail full E.V.E. prompt-surface sampling",
    );
    assert.equal(
      desktopEveOverlayNegative.rejectedFixedSticky,
      true,
      "A real covering overlay must be enumerated as a fixed or sticky obstruction",
    );
    assert.deepEqual(
      desktopEveOverlayNegative.recovered.failures,
      [],
      "Removing the E.V.E. covering overlay must restore a clean scenario",
    );
    assert.ok(
      desktopEveLocalizedChildNegative,
      "Desktop E.V.E. localized pointer-active child negative scenario must run",
    );
    assert.equal(
      desktopEveLocalizedChildNegative.rejectedFixedSticky,
      true,
      "Every localized pointer-active descendant must be tested in its own overlap region",
    );
    assert.deepEqual(
      desktopEveLocalizedChildNegative.recovered.failures,
      [],
      "Removing the localized pointer-active obstruction must restore a clean scenario",
    );
    assert.ok(desktopEveVisualPointerNoneNegative, "Desktop E.V.E. visual pointer-none negative scenario must run");
    assert.equal(
      desktopEveVisualPointerNoneNegative.rejectedFixedSticky,
      true,
      "A visually painting pointer-none fixed surface must be rejected",
    );
    assert.deepEqual(
      desktopEveVisualPointerNoneNegative.recovered.failures,
      [],
      "Removing the visual pointer-none obstruction must restore a clean scenario",
    );
    flights.forEach((flight) =>
      assert.equal(
        flight.ok,
        true,
        `Mobile Contact flight acceptance failed at ${flight.viewport[0]}px: ${flight.failures.join("; ")}`,
      ),
    );
    cinemas.forEach((cinema) =>
      assert.equal(
        cinema.ok,
        true,
        `Mobile active-flight PHOTO cinema acceptance failed at ${cinema.viewport[0]}px: ${cinema.failures.join("; ")}`,
      ),
    );
    snapshotGeometry.forEach((result) => assert.equal(result.ok, true, result.failures.join("; ")));
    assert.equal(narrowResult.ok, true, narrowResult.failures.join("; "));
  });
}

await main();
