import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { connectCdp, runWithLayoutCleanup } from "./layout-runtime-support.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const SAFE_AREA_PX = 20;
const CTA_RAIL_GAP_PX = 24;

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

async function main() {
  const resources = {};
  await runWithLayoutCleanup(async () => {
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
    await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await waitForApp(send);
    const desktopEvaluation = await send("Runtime.evaluate", {
      expression: `([...document.querySelectorAll(".za-lcars-pip")].map((element) => {
        const rect = element.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      }))`,
      returnByValue: true,
    });
    const desktopPips = desktopEvaluation.result.value;
    await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    const evaluated = await send("Runtime.evaluate", {
      expression: `(() => {
        document.documentElement.style.setProperty("--za-safe-area-inset-bottom", "${SAFE_AREA_PX}px");
        const rail = document.querySelector(".za-mobile-rail-safe");
        const railRect = rail.getBoundingClientRect();
        const pips = ${JSON.stringify(desktopPips)};
        const clearance = [...document.querySelectorAll("section[data-deck], footer")].map((element) => ({
          tag: element.tagName,
          deck: element.getAttribute("data-deck"),
          paddingBottom: parseFloat(getComputedStyle(element).paddingBottom),
        }));
        const cta = [...document.querySelectorAll('section[data-deck="0"] button')].find((button) => button.textContent.includes("DESCEND"));
        const failures = [];
        if (pips.length !== 8) failures.push("expected eight aircraft pips");
        pips.forEach((pip, index) => {
          if (pip.width < 24 || pip.height < 24) failures.push("pip " + (index + 1) + " measured " + pip.width + "x" + pip.height);
        });
        if (railRect.height < 80) failures.push("rail height " + railRect.height + "px is below 60px + mocked 20px inset");
        const railPadding = parseFloat(getComputedStyle(rail).paddingBottom);
        if (railPadding < 20) failures.push("rail bottom padding " + railPadding + "px does not include mocked inset");
        clearance.forEach((item) => {
          if (item.paddingBottom < 176) failures.push(item.tag + " deck=" + item.deck + " padding " + item.paddingBottom + "px is below 6rem + 60px + 20px");
        });
        const ctaBottom = cta?.getBoundingClientRect().bottom ?? Infinity;
        if (ctaBottom > railRect.top - ${CTA_RAIL_GAP_PX}) failures.push("Snapshot CTA bottom " + ctaBottom + "px leaves less than ${CTA_RAIL_GAP_PX}px before rail top " + railRect.top + "px");
        return { ok: failures.length === 0, failures, viewport: [innerWidth, innerHeight], pips, rail: { height: railRect.height, top: railRect.top, paddingBottom: railPadding }, clearance, ctaBottom };
      })()`,
      returnByValue: true,
    });
    if (evaluated.exceptionDetails) {
      throw new Error(evaluated.exceptionDetails.exception?.description ?? evaluated.exceptionDetails.text);
    }
    const result = evaluated.result.value;
    await send("Runtime.evaluate", {
      expression: `([...document.querySelectorAll('button[aria-label="Run the 30-second flight"]')].find((button) => button.getClientRects().length > 0)?.click())`,
    });
    await new Promise((resolve) => setTimeout(resolve, 50));
    const flightEvaluation = await send("Runtime.evaluate", {
      expression: `(() => {
        const panel = [...document.querySelectorAll('section[aria-label="30-second flight status"]')].find((element) => element.getClientRects().length > 0);
        const copy = document.querySelector('section[data-deck="0"] .za-bracket');
        if (!panel || !copy) return { ok: false, reason: "active mobile flight panel or Snapshot copy is missing" };
        const panelRect = panel.getBoundingClientRect();
        const copyRect = copy.getBoundingClientRect();
        const gap = copyRect.top - panelRect.bottom;
        return {
          ok: gap >= 8,
          gap,
          panel: { top: panelRect.top, bottom: panelRect.bottom, height: panelRect.height },
          copyTop: copyRect.top,
        };
      })()`,
      returnByValue: true,
    });
    const flight = flightEvaluation.result.value;
    await send("Runtime.evaluate", {
      expression: `([...document.querySelectorAll('button[aria-label="Stop the 30-second flight"]')].find((button) => button.getClientRects().length > 0)?.click())`,
    });
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
    console.log(JSON.stringify({ bitFocus, eveFocus, flight, mobile390: result, mobile320: narrowResult }, null, 2));
    assert.equal(bitFocus.ok, true, "Bit control must retain a visible keyboard focus indicator");
    assert.equal(eveFocus.ok, true, "E.V.E. command input must retain a visible keyboard focus indicator");
    assert.equal(flight.ok, true, "Active mobile flight status must not overlap the Snapshot content");
    assert.equal(result.ok, true, result.failures.join("; "));
    assert.equal(narrowResult.ok, true, narrowResult.failures.join("; "));
  }, resources);
}

await main();
