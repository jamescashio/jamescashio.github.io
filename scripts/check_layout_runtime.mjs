import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  connectCdp,
  desktopEveAcceptanceFailures,
  mobileCinemaAcceptanceFailures,
  mobileFlightAcceptanceFailures,
  runWithLayoutCleanup,
} from "./layout-runtime-support.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const SAFE_AREA_PX = 20;

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
  await stat(path.join(DIST, "index.html"));
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
    processHandle.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`browser exited before layout verification (${code ?? "unknown"})`));
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
        'document.readyState === "complete" && (!document.fonts || document.fonts.status === "loaded") && document.querySelectorAll(".za-lcars-pip").length === 8 && Boolean(document.querySelector(".za-mobile-rail-safe"))',
      returnByValue: true,
    });
    if (result.result.value) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("timed out waiting for the command deck layout");
}

async function settleViewport(send, width, mobile, height = 844) {
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });
  await send("Runtime.evaluate", {
    expression: "new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))",
    awaitPromise: true,
  });
}

async function emulateReducedMotion(send, reduced) {
  await send("Emulation.setEmulatedMedia", {
    media: "",
    features: [{ name: "prefers-reduced-motion", value: reduced ? "reduce" : "no-preference" }],
  });
  await send("Runtime.evaluate", {
    expression: `new Promise((resolve, reject) => {
      const expected = ${reduced};
      let attempts = 0;
      const verify = () => {
        if (matchMedia("(prefers-reduced-motion: reduce)").matches === expected) {
          requestAnimationFrame(() => requestAnimationFrame(resolve));
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

async function main() {
  const resources = {};
  const runGateWithCleanup = (operation) => runWithLayoutCleanup(operation, resources, { browserExitTimeoutMs: 5_000 });
  await runGateWithCleanup(async () => {
    const server = (resources.server = await serveDist());
    const targetUrl = `http://127.0.0.1:${server.address().port}/`;
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
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await waitForApp(send);
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
        const expectedControls = ["TECHNICAL", "EXECUTIVE", "DESCEND THE DECKS", "OPEN E.V.E. CONSOLE"];
        const failures = [];
        if (pips.length !== 8) failures.push("expected eight aircraft pips");
        pips.forEach((pip, index) => {
          if (pip.width < 24 || pip.height < 24) failures.push("pip " + (index + 1) + " measured " + pip.width + "x" + pip.height);
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
        if (controls.length !== expectedControls.length) failures.push("expected exactly four Snapshot controls, found " + controls.length);
        const controlRects = controls.map((control) => {
          const rect = control.getBoundingClientRect();
          const style = getComputedStyle(control);
          return { label: control.textContent.trim().replace(/\\s+/g, " "), top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, width: rect.width, height: rect.height, disabled: control.disabled, displayed: style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0" };
        });
        expectedControls.forEach((expected) => {
          if (!controlRects.some((control) => control.label.startsWith(expected))) failures.push("missing Snapshot control " + expected);
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
        if (actionStyle?.display !== "grid" || gridColumns.length !== 2 || actionButtons.length !== 2) failures.push("Snapshot actions must render as one two-column grid");
        if (actionRects.length === 2 && Math.abs(actionRects[0].top - actionRects[1].top) > 0.5) failures.push("Snapshot action buttons must share one row");
        if (document.documentElement.scrollWidth > innerWidth) failures.push("document width " + document.documentElement.scrollWidth + "px exceeds viewport " + innerWidth + "px");
        return { ok: failures.length === 0, failures, viewport: [innerWidth, innerHeight], pips, rail: { height: railRect.height, top: railRect.top, bottom: railRect.bottom, paddingBottom: railPadding }, clearance, controls: controlRects, actionGrid: { display: actionStyle?.display, columns: gridColumns, buttons: actionRects.map((rect) => ({ top: rect.top, width: rect.width, height: rect.height })) } };
      })()`,
        returnByValue: true,
      });
      if (evaluated.exceptionDetails) {
        throw new Error(evaluated.exceptionDetails.exception?.description ?? evaluated.exceptionDetails.text);
      }
      snapshotGeometry.push(evaluated.result.value);
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

        await send("Runtime.evaluate", {
          expression: `(() => {
            window.__zaLayoutEscape = null;
            window.addEventListener("keydown", (event) => {
              if (event.key !== "Escape") return;
              setTimeout(() => { window.__zaLayoutEscape = { defaultPrevented: event.defaultPrevented }; }, 0);
            }, { once: true });
          })()`,
        });
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
              await new Promise((resolve) => requestAnimationFrame(resolve));
              if (!document.querySelector('[role="dialog"]') && document.activeElement === opener) break;
            }
            return {
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
    for (const [width, height] of [
      [1280, 720],
      [1440, 900],
    ]) {
      await settleViewport(send, width, false, height);
      await send("Page.navigate", { url: "about:blank" });
      await send("Page.navigate", { url: targetUrl });
      await waitForApp(send);
      const eveNavigation = await send("Runtime.evaluate", {
        expression: `(() => {
          const button = document.querySelector('button[aria-label="Go to E.V.E. deck"]');
          if (!button) return false;
          button.click();
          return true;
        })()`,
        returnByValue: true,
      });
      if (!eveNavigation.result.value) throw new Error(`desktop E.V.E. rail control is missing at ${width}x${height}`);
      for (let attempt = 0; attempt < 80; attempt++) {
        const active = await send("Runtime.evaluate", {
          expression: `(() => {
            const main = document.querySelector("#main-content");
            const section = document.querySelector('section[data-deck="7"]');
            const landing = section ? Math.max(0, section.offsetTop - 8) : -1;
            return (
              location.hash === "#deck=eve" &&
              main?.getAttribute("data-active-deck") === "7" &&
              Math.abs(main.scrollTop - landing) <= 1
            );
          })()`,
          returnByValue: true,
        });
        if (active.result.value) break;
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      await send("Runtime.evaluate", {
        expression: "new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))",
        awaitPromise: true,
      });
      const eveLayoutEvaluation = await send("Runtime.evaluate", {
        expression: `(() => {
          const input = document.querySelector("#eve-command");
          const promptSurface = input?.closest("form");
          const main = document.querySelector("#main-content");
          if (!input || !promptSurface || !main) return { error: "desktop E.V.E. prompt structure is missing" };
          const rectOf = (element) => {
            const rect = element.getBoundingClientRect();
            return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height };
          };
          const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
          const inputRect = input.getBoundingClientRect();
          const promptRect = promptSurface.getBoundingClientRect();
          const inputStyle = getComputedStyle(input);
          const inputHitAtCenter = document.elementsFromPoint(
            inputRect.left + inputRect.width / 2,
            inputRect.top + inputRect.height / 2,
          ).includes(input);
          const coveringSurfaces = [...document.querySelectorAll(".za-command-header, .za-mobile-rail-safe, .za-corner-hud, .za-mobile-flight-control")]
            .filter((element) => {
              const style = getComputedStyle(element);
              if (
                !["fixed", "sticky"].includes(style.position) ||
                style.pointerEvents === "none" ||
                style.opacity === "0"
              )
                return false;
              const rect = element.getBoundingClientRect();
              return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden" && overlaps(rect, promptRect);
            })
            .map((element) => element.getAttribute("aria-label") || element.className || element.tagName);
          return {
            viewport: [innerWidth, innerHeight],
            hash: location.hash,
            activeDeck: main.getAttribute("data-active-deck"),
            inputVisible:
              inputRect.width > 0 &&
              inputRect.height > 0 &&
              inputStyle.display !== "none" &&
              inputStyle.visibility !== "hidden" &&
              inputStyle.opacity !== "0",
            input: rectOf(input),
            promptSurface: rectOf(promptSurface),
            inputHitAtCenter,
            coveringSurfaces,
            documentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
            mainClientWidth: main.clientWidth,
            mainScrollWidth: main.scrollWidth,
          };
        })()`,
        returnByValue: true,
      });
      const eveLayout = eveLayoutEvaluation.result.value;
      eveLayout.failures = eveLayout.error ? [eveLayout.error] : desktopEveAcceptanceFailures(eveLayout);
      eveLayout.ok = eveLayout.failures.length === 0;
      desktopEveScenarios.push(eveLayout);
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
    await emulateReducedMotion(send, false);
    const normalMotionEvaluation = await send("Runtime.evaluate", {
      expression: `(() => {
        const elements = {
          routing: document.querySelector('.za-routing-progress, #routing-lane-detail > div.mt-8 > div'),
          hud: document.querySelector('.za-airframe-progress, .za-airframe-details > div:last-child > div'),
          rail: document.querySelector('.za-command-rail, aside:has(nav[aria-label="Command decks"])'),
          pip: document.querySelector('.za-lcars-pip-mark'),
        };
        const missing = Object.entries(elements).filter(([, element]) => !element).map(([name]) => name);
        const seconds = (value) => value.split(',').reduce((maximum, part) => {
          const token = part.trim();
          const milliseconds = token.endsWith('ms') ? parseFloat(token) : parseFloat(token) * 1000;
          return Math.max(maximum, Number.isFinite(milliseconds) ? milliseconds : 0);
        }, 0);
        return {
          missing,
          transitions: Object.fromEntries(Object.entries(elements).filter(([, element]) => element).map(([name, element]) => {
            const style = getComputedStyle(element);
            return [name, { durationMs: seconds(style.transitionDuration), delayMs: seconds(style.transitionDelay), property: style.transitionProperty }];
          })),
        };
      })()`,
      returnByValue: true,
    });
    const normalMotion = normalMotionEvaluation.result.value;
    await emulateReducedMotion(send, true);
    const reducedMotionEvaluation = await send("Runtime.evaluate", {
      expression: `(async () => {
        const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
        const settle = async () => { await nextFrame(); await nextFrame(); };
        const elements = () => ({
          routing: document.querySelector('.za-routing-progress, #routing-lane-detail > div.mt-8 > div'),
          hud: document.querySelector('.za-airframe-progress, .za-airframe-details > div:last-child > div'),
          rail: document.querySelector('.za-command-rail, aside:has(nav[aria-label="Command decks"])'),
          pip: document.querySelector('.za-lcars-pip-mark'),
        });
        const seconds = (value) => value.split(',').reduce((maximum, part) => {
          const token = part.trim();
          const milliseconds = token.endsWith('ms') ? parseFloat(token) : parseFloat(token) * 1000;
          return Math.max(maximum, Number.isFinite(milliseconds) ? milliseconds : 0);
        }, 0);
        const transitionOf = (element) => {
          const style = getComputedStyle(element);
          return { durationMs: seconds(style.transitionDuration), delayMs: seconds(style.transitionDelay), property: style.transitionProperty };
        };
        const rectOf = (element) => {
          const rect = element.getBoundingClientRect();
          return { width: rect.width, height: rect.height };
        };
        const snapshot = () => Object.fromEntries(Object.entries(elements()).map(([name, element]) => [name, element ? rectOf(element) : null]));
        const failures = [];
        const initial = elements();
        Object.entries(initial).forEach(([name, element]) => {
          if (!element) failures.push(name + ' reduced-motion element is missing');
          else {
            const transition = transitionOf(element);
            if (transition.durationMs !== 0 || transition.delayMs !== 0) {
              failures.push(name + ' transition remains ' + transition.durationMs + 'ms + ' + transition.delayMs + 'ms delay (' + transition.property + ')');
            }
          }
        });

        const routingButtons = [...document.querySelectorAll('button[aria-controls="routing-lane-detail"]')];
        routingButtons.at(-1)?.click();
        document.querySelector('button[aria-label="Expand command rail"]')?.click();
        [...document.querySelectorAll('.za-lcars-pip')].at(-1)?.click();
        await settle();
        const scroller = document.querySelector('#main-content');
        if (scroller) {
          scroller.scrollTo({ top: (scroller.scrollHeight - scroller.clientHeight) / 2, behavior: 'auto' });
          scroller.dispatchEvent(new Event('scroll'));
        }
        await settle();
        document.querySelector('.za-corner-hud')?.classList.remove('yield');
        await nextFrame();

        const changed = elements();
        const routingPercent = parseFloat(changed.routing?.style.width ?? 'NaN');
        const routingExpected = changed.routing?.parentElement ? changed.routing.parentElement.clientWidth * routingPercent / 100 : NaN;
        const hudPercent = parseFloat(changed.hud?.style.width ?? 'NaN');
        const hudExpected = changed.hud?.parentElement ? changed.hud.parentElement.clientWidth * hudPercent / 100 : NaN;
        const changedGeometry = snapshot();
        if (!Number.isFinite(routingExpected) || Math.abs(changedGeometry.routing.width - routingExpected) > 0.5) {
          failures.push('routing progress did not resolve immediately to its inline width');
        }
        if (!Number.isFinite(hudExpected) || hudPercent <= 0 || Math.abs(changedGeometry.hud.width - hudExpected) > 0.5) {
          failures.push('HUD progress did not resolve immediately to its inline width');
        }
        if (Math.abs(changedGeometry.rail.width - 220) > 0.5) failures.push('desktop rail did not resolve immediately to 220px');
        const selectedPip = document.querySelector('.za-lcars-pip.on .za-lcars-pip-mark');
        const selectedPipRect = selectedPip?.getBoundingClientRect();
        if (!selectedPipRect || Math.abs(selectedPipRect.width - 26) > 0.5 || Math.abs(selectedPipRect.height - 8) > 0.5) {
          failures.push('selected aircraft pip did not resolve immediately to 26x8px');
        }

        return {
          failures,
          ok: failures.length === 0,
          transitions: Object.fromEntries(Object.entries(changed).filter(([, element]) => element).map(([name, element]) => [name, transitionOf(element)])),
          changedGeometry,
        };
      })()`,
      awaitPromise: true,
      returnByValue: true,
    });
    const reducedMotion = reducedMotionEvaluation.result.value;
    const settledReducedGeometry = reducedMotion.changedGeometry;
    await emulateReducedMotion(send, false);
    await new Promise((resolve) => setTimeout(resolve, 600));
    const restoredMotionEvaluation = await send("Runtime.evaluate", {
      expression: `(() => {
        const elements = {
          routing: document.querySelector('.za-routing-progress, #routing-lane-detail > div.mt-8 > div'),
          hud: document.querySelector('.za-airframe-progress, .za-airframe-details > div:last-child > div'),
          rail: document.querySelector('.za-command-rail, aside:has(nav[aria-label="Command decks"])'),
          pip: document.querySelector('.za-lcars-pip-mark'),
        };
        const seconds = (value) => value.split(',').reduce((maximum, part) => {
          const token = part.trim();
          const milliseconds = token.endsWith('ms') ? parseFloat(token) : parseFloat(token) * 1000;
          return Math.max(maximum, Number.isFinite(milliseconds) ? milliseconds : 0);
        }, 0);
        const geometry = Object.fromEntries(Object.entries(elements).map(([name, element]) => {
          if (!element) return [name, null];
          const rect = element.getBoundingClientRect();
          return [name, { width: rect.width, height: rect.height }];
        }));
        const transitions = Object.fromEntries(Object.entries(elements).filter(([, element]) => element).map(([name, element]) => {
          const style = getComputedStyle(element);
          return [name, { durationMs: seconds(style.transitionDuration), delayMs: seconds(style.transitionDelay), property: style.transitionProperty }];
        }));
        return { geometry, transitions };
      })()`,
      returnByValue: true,
    });
    const restoredMotion = restoredMotionEvaluation.result.value;
    await emulateReducedMotion(send, true);
    const finalReducedEvaluation = await send("Runtime.evaluate", {
      expression: `(() => Object.fromEntries(Object.entries({
        routing: document.querySelector('.za-routing-progress, #routing-lane-detail > div.mt-8 > div'),
        hud: document.querySelector('.za-airframe-progress, .za-airframe-details > div:last-child > div'),
        rail: document.querySelector('.za-command-rail, aside:has(nav[aria-label="Command decks"])'),
        pip: document.querySelector('.za-lcars-pip-mark'),
      }).map(([name, element]) => {
        if (!element) return [name, null];
        const style = getComputedStyle(element);
        const toMs = (value) => value.split(',').reduce((maximum, part) => Math.max(maximum, part.trim().endsWith('ms') ? parseFloat(part) : parseFloat(part) * 1000), 0);
        return [name, { durationMs: toMs(style.transitionDuration), delayMs: toMs(style.transitionDelay) }];
      })))()`,
      returnByValue: true,
    });
    const finalReducedMotion = finalReducedEvaluation.result.value;
    const restoredMotionFailures = [];
    for (const [name, transition] of Object.entries(restoredMotion.transitions)) {
      if (transition.durationMs <= 0) restoredMotionFailures.push(`${name} normal-motion transition was not restored`);
    }
    for (const [name, geometry] of Object.entries(restoredMotion.geometry)) {
      const settled = settledReducedGeometry[name];
      if (
        !geometry ||
        !settled ||
        Math.abs(geometry.width - settled.width) > 0.5 ||
        Math.abs(geometry.height - settled.height) > 0.5
      ) {
        restoredMotionFailures.push(`${name} replayed stale geometry after normal motion was restored`);
      }
    }
    for (const [name, transition] of Object.entries(finalReducedMotion)) {
      if (!transition || transition.durationMs !== 0 || transition.delayMs !== 0) {
        restoredMotionFailures.push(`${name} transition survived the second reduced-motion change`);
      }
    }
    restoredMotion.ok = restoredMotionFailures.length === 0;
    restoredMotion.failures = restoredMotionFailures;
    console.log(
      JSON.stringify(
        {
          bitFocus,
          cinemas,
          decodedAssets,
          desktopLayout,
          desktopEveScenarios,
          eveFocus,
          flights,
          finalReducedMotion,
          normalMotion,
          reducedMotion,
          restoredMotion,
          snapshotGeometry,
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
    assert.equal(desktopLayout.ok, true, desktopLayout.failures.join("; "));
    assert.equal(bitFocus.ok, true, "Bit control must retain a visible keyboard focus indicator");
    assert.equal(eveFocus.ok, true, "E.V.E. command input must retain a visible keyboard focus indicator");
    assert.deepEqual(
      normalMotion.missing,
      [],
      `Normal-motion acceptance elements are missing: ${normalMotion.missing}`,
    );
    Object.entries(normalMotion.transitions).forEach(([name, transition]) =>
      assert.ok(transition.durationMs > 0, `${name} must preserve its normal-motion transition`),
    );
    assert.equal(reducedMotion.ok, true, `Reduced-motion acceptance failed: ${reducedMotion.failures.join("; ")}`);
    assert.equal(
      restoredMotion.ok,
      true,
      `Live motion preference acceptance failed: ${restoredMotion.failures.join("; ")}`,
    );
    desktopEveScenarios.forEach((scenario) =>
      assert.equal(
        scenario.ok,
        true,
        `Desktop E.V.E. acceptance failed at ${scenario.viewport?.join("x")}: ${scenario.failures.join("; ")}`,
      ),
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
