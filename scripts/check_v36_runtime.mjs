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
  runWithLayoutCleanup,
} from "./layout-runtime-support.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const RELEASE_NAME = "THE HUMAN RECKONING";
const report = { passed: false, checks: [], failures: [], errors: [], warnings: [] };
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const argument = (name) =>
  process.argv
    .slice(2)
    .find((value) => value.startsWith(`--${name}=`))
    ?.split("=")
    .slice(1)
    .join("=");

function browserExecutable() {
  const executable = [
    process.env.CHROME_PATH,
    process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES, "Google", "Chrome", "Application", "chrome.exe"),
    process.env["PROGRAMFILES(X86)"] &&
      path.join(process.env["PROGRAMFILES(X86)"], "Microsoft", "Edge", "Application", "msedge.exe"),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/microsoft-edge",
  ]
    .filter(Boolean)
    .find((candidate) => existsSync(candidate));
  assert.ok(executable, "Chrome or Edge is required; set CHROME_PATH for a nonstandard installation");
  return executable;
}

async function serveDist() {
  await stat(path.join(DIST, "index.html"));
  const types = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".avif": "image/avif",
    ".webp": "image/webp",
    ".png": "image/png",
    ".gif": "image/gif",
    ".jpg": "image/jpeg",
    ".woff2": "font/woff2",
  };
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url ?? "/", "http://127.0.0.1").pathname);
      const file = path.resolve(DIST, pathname === "/" ? "index.html" : pathname.replace(/^\/+/, ""));
      if (!file.startsWith(`${DIST}${path.sep}`)) throw new Error("invalid path");
      const body = await readFile(file);
      response.writeHead(200, {
        "Content-Type": types[path.extname(file)] ?? "application/octet-stream",
        "Cache-Control": "no-store",
      });
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

function devtoolsEndpoint(browser) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timed out waiting for Chrome debugging endpoint")), 10_000);
    let stderr = "";
    browser.stderr.setEncoding("utf8");
    browser.stderr.on("data", (chunk) => {
      stderr += chunk;
      const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        clearTimeout(timer);
        resolve(match[1]);
      }
    });
    browser.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    browser.once("exit", (code, signal) => {
      clearTimeout(timer);
      reject(new Error(browserExitDiagnostic(code, signal, stderr)));
    });
  });
}

async function pageDebugger(endpoint) {
  const targetUrl = `http://127.0.0.1:${new URL(endpoint).port}/json/list`;
  for (let attempt = 0; attempt < 100; attempt++) {
    const targets = await fetch(targetUrl)
      .then((response) => response.json())
      .catch(() => []);
    const target = targets.find((item) => item.type === "page" && item.url === "about:blank");
    if (target?.webSocketDebuggerUrl) return target.webSocketDebuggerUrl;
    await delay(50);
  }
  throw new Error("timed out waiting for V36 browser target");
}

async function run() {
  const resources = {};
  await runWithLayoutCleanup(
    async () => {
      resources.server = await serveDist();
      const base = `http://127.0.0.1:${resources.server.address().port}`;
      const rootHtml = await fetch(`${base}/`).then((response) => response.text());
      assert.match(rootHtml, /data-prerendered="odyssey"/, "root must contain the prerendered V36 page");
      assert.match(
        rootHtml,
        /<title>[^<]*THE HUMAN RECKONING[^<]*<\/title>/,
        "root title must identify the approved release",
      );
      assert.match(rootHtml, /Own the iron/, "hero heading must exist before JavaScript");
      assert.doesNotMatch(rootHtml, /<meta\b[^>]*\bcontent=["'][^"']*noindex/i, "live root must be indexable");
      const receiptResponse = await fetch(`${base}/site-release.json`);
      assert.equal(receiptResponse.status, 200, "current release receipt must exist");
      const receipt = await receiptResponse.json();
      const packageJson = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
      assert.equal(receipt.experienceVersion, packageJson.version, "receipt and package versions must match");
      assert.equal(receipt.experienceVersion, "36.0.0", "current receipt must be the approved V36 release");
      assert.equal(receipt.releaseName, RELEASE_NAME);
      assert.equal(receipt.status, "released");
      assert.equal(receipt.published, true);
      assert.equal(receipt.entry, "/");
      assert.equal(receipt.legacyEntry, "/command-deck.html");
      assert.deepEqual(receipt.evidenceArchive, {
        release: "V35 ALL TENS",
        fleetObserved: "2026-08-28",
        routingObserved: "2026-08-21",
      });
      report.release = receipt;
      report.checks.push({ name: "Root prerender, release identity, and indexing", passed: true });

      resources.profile = await mkdtemp(path.join(tmpdir(), "cashio-v36-"));
      resources.browser = spawn(
        browserExecutable(),
        [
          "--headless=new",
          "--hide-scrollbars",
          "--no-first-run",
          "--no-default-browser-check",
          "--remote-debugging-port=0",
          `--user-data-dir=${resources.profile}`,
          "about:blank",
        ],
        { stdio: ["ignore", "ignore", "pipe"] },
      );
      const endpoint = await devtoolsEndpoint(resources.browser);
      const { socket, send } = await connectCdp(await pageDebugger(endpoint), { commandTimeoutMs: 20_000 });
      resources.socket = socket;
      socket.on("message", (data) => {
        const message = JSON.parse(String(data));
        if (message.method === "Runtime.exceptionThrown") report.errors.push(message.params.exceptionDetails);
        if (message.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(message.params.type)) {
          const text = message.params.args.map((value) => value.value ?? value.description ?? "").join(" ");
          (message.params.type === "error" ? report.errors : report.warnings).push(text);
        }
      });
      report.browser = await send("Browser.getVersion");
      assert.deepEqual(
        browserVersionAcceptanceFailures(
          report.browser,
          argument("expected-browser-major") ?? process.env.EXPECTED_BROWSER_MAJOR,
        ),
        [],
      );
      await send("Runtime.enable");
      await send("Page.enable");

      const evaluate = async (expression) => {
        const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
        if (result.exceptionDetails)
          throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
        return result.result.value;
      };
      const waitFor = async (expression, description, timeout = 15_000) => {
        const end = Date.now() + timeout;
        while (Date.now() < end) {
          if (await evaluate(expression)) return;
          await delay(80);
        }
        throw new Error(`timed out waiting for ${description}`);
      };
      const navigate = async (suffix, width = 1440, height = 1000) => {
        await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
        await send("Page.navigate", { url: `${base}${suffix}` });
        await waitFor(
          `location.href === ${JSON.stringify(`${base}${suffix}`)} && document.readyState === 'complete' && document.fonts.status === 'loaded' && !!document.querySelector('.event-horizon')`,
          "V36 page and fonts",
        );
      };
      const click = async (selector) => {
        await evaluate(
          `document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({block:'center',behavior:'instant'})`,
        );
        await delay(120);
        const point = await evaluate(`(() => {
        const element = document.querySelector(${JSON.stringify(selector)});
        if (!element || element.disabled) return null;
        const rect = element.getBoundingClientRect();
        const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
        return rect.width && rect.height && element.contains(document.elementFromPoint(x,y)) ? {x,y} : null;
      })()`);
        assert.ok(point, `click target must be visible, enabled, and unobscured: ${selector}`);
        await send("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", clickCount: 1 });
        await send("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", clickCount: 1 });
      };
      const layout = () =>
        evaluate(`(() => {
      const visible = element => { const r = element.getBoundingClientRect(); return r.width && r.height && getComputedStyle(element).visibility !== 'hidden'; };
      const controls = [...document.querySelectorAll('.o-header button, .sw-world button, .sw-sensitivity select, .sw-architectures label, .sw-check-setting')]
        .filter(visible).map(element => { const r = element.getBoundingClientRect(); return {name:element.getAttribute('aria-label') || element.textContent.trim(),width:r.width,height:r.height}; });
      return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,controls,
        heading:document.querySelector('h1')?.innerText.replace(/\\s+/g,' ').trim(),title:document.title,
        audioOff:document.querySelector('[aria-label="Turn interaction sound on"]')?.getAttribute('aria-pressed') === 'false'};
    })()`);

      for (const width of [1440, 390, 320]) {
        await navigate(`/?runtime=v36-${width}`, width, width === 1440 ? 1000 : 844);
        const result = await layout();
        assert.match(result.heading, /Own the iron\..*Shape the possible\./);
        assert.ok(result.title.includes(RELEASE_NAME));
        assert.ok(
          result.scrollWidth <= width + 1 && result.bodyWidth <= width + 1,
          `${width}px root must not overflow`,
        );
        assert.ok(result.controls.length >= 20, "responsive check must find the actual controls");
        assert.deepEqual(
          result.controls.filter((control) => control.width < 43.5 || control.height < 43.5),
          [],
          "visible controls need 44px touch targets",
        );
        assert.ok(result.audioOff, "interaction sound must remain opt-in");
        const initialAssets = await evaluate(
          `performance.getEntriesByType('resource').map(entry=>entry.name).filter(name=>/world-renderer-|three(?:\\.module)?-/.test(name))`,
        );
        assert.deepEqual(initialAssets, [], "3D must remain unloaded before the visitor boards");
        await click('[aria-label="Pause ambient motion"]');
        await waitFor(`document.querySelector('.event-horizon')?.dataset.motion === 'off'`, "manual motion pause");
        assert.equal(
          await evaluate(
            `document.querySelector('[aria-label="Resume ambient motion"]')?.getAttribute('aria-pressed')`,
          ),
          "true",
        );
        report.checks.push({
          name: `${width}px layout, control targets, opt-in effects, and motion switch`,
          passed: true,
          evidence: result,
        });
      }

      await navigate("/?runtime=v36-route#build=signal");
      await waitFor(
        `document.querySelector('#tab-signal')?.getAttribute('aria-selected') === 'true' && !!document.querySelector('.lv-signal')`,
        "Signal deep link",
      );
      await click("#tab-graphify");
      await waitFor(
        `location.hash === '#build=graphify' && document.querySelector('#tab-graphify')?.getAttribute('aria-selected') === 'true'`,
        "study selection updates the URL",
      );
      report.checks.push({ name: "Study deep link and native tab interaction", passed: true });

      await navigate("/?runtime=v36-operator#operator");
      await waitFor(
        `(() => {const r = document.querySelector('#operator').getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0})()`,
        "operator anchor position",
      );
      assert.ok(
        await evaluate(
          `!!document.querySelector('#operator .hc-identity') && !!document.querySelector('#operator .o-operator-copy')`,
        ),
      );
      report.checks.push({ name: "Operator native anchor and readable biography", passed: true });

      // Board after visiting a lower section: this also guards against stale visibility-observer batches.
      await click(".sw-world-launch button");
      await waitFor(`!!document.querySelector('.sw-world-ready')`, "starship ready", 30_000);
      await evaluate(`document.querySelector('.sw-world-canvas').scrollIntoView({block:'center',behavior:'instant'})`);
      await delay(1000);
      const canvas = await evaluate(
        `(() => {const c=document.querySelector('.sw-world-canvas'),r=c.getBoundingClientRect();return {x:r.left+scrollX,y:r.top+scrollY,width:r.width,height:r.height,scale:1}})()`,
      );
      assert.ok(canvas.width > 250 && canvas.height > 300);
      const capture = await send("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: true,
        clip: canvas,
      });
      // Read the composited screenshot; preserveDrawingBuffer=false makes delayed WebGL readPixels misleading.
      const paint = await evaluate(`(async () => {
      const image = new Image(); image.src = 'data:image/png;base64,${capture.data}'; await image.decode();
      const sample = document.createElement('canvas'); sample.width=64; sample.height=32;
      const context=sample.getContext('2d'); context.drawImage(image,0,0,64,32);
      const pixels=context.getImageData(0,0,64,32).data;
      let minimum=255,maximum=0,bright=0,colors=new Set();
      for(let i=0;i<pixels.length;i+=4){const level=Math.max(pixels[i],pixels[i+1],pixels[i+2]);minimum=Math.min(minimum,level);maximum=Math.max(maximum,level);if(level>80)bright++;colors.add([pixels[i]>>3,pixels[i+1]>>3,pixels[i+2]>>3].join(','));}
      return {minimum,maximum,bright,samples:pixels.length/4,colors:colors.size,posterAbsent:!document.querySelector('.sw-world-fallback'),canvasVisible:getComputedStyle(document.querySelector('.sw-world-canvas')).visibility==='visible'};
    })()`);
      assert.ok(paint.posterAbsent && paint.canvasVisible, "paint must come from the live canvas, not its poster");
      assert.ok(
        paint.maximum - paint.minimum > 60 && paint.bright > 30 && paint.colors > 30,
        `starship geometry must actually paint: ${JSON.stringify(paint)}`,
      );
      assert.equal(
        await evaluate(`document.querySelector('.sw-flow-control button').getAttribute('aria-pressed')`),
        "false",
        "request flow must not autoplay",
      );
      await click('[aria-label="Rotate world left"]');
      await waitFor(
        `[...document.querySelectorAll('.sw-view-presets button')].every(button=>button.getAttribute('aria-pressed')==='false')`,
        "manual camera selection",
      );
      report.checks.push({
        name: "Opt-in starship paints visible geometry and accepts camera input",
        passed: true,
        evidence: paint,
      });

      for (const width of [390, 320]) {
        await send("Emulation.setDeviceMetricsOverride", { width, height: 844, deviceScaleFactor: 1, mobile: false });
        await delay(250);
        const result = await layout();
        assert.ok(
          result.scrollWidth <= width + 1 && result.bodyWidth <= width + 1,
          `${width}px launched ship must not overflow`,
        );
        assert.deepEqual(
          result.controls.filter((control) => control.width < 43.5 || control.height < 43.5),
          [],
          "launched camera controls need 44px touch targets",
        );
        report.checks.push({ name: `${width}px launched ship resize and control targets`, passed: true });
      }

      await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
      await waitFor(
        `document.querySelector('.event-horizon')?.dataset.motion === 'off' && document.querySelector('.sw-flow-control button')?.disabled`,
        "reactive system reduced motion",
      );
      assert.equal(
        await evaluate(
          `document.querySelector('[aria-label="Reduced motion follows your system preference"]')?.disabled`,
        ),
        true,
      );
      report.checks.push({ name: "System reduced motion stops ambient and request-flow controls", passed: true });

      await send("Emulation.setScriptExecutionDisabled", { value: true });
      await navigate("/?runtime=v36-no-js", 320, 844);
      const noJs = await layout();
      assert.match(noJs.heading, /Own the iron\./);
      assert.ok(noJs.scrollWidth <= 321 && noJs.bodyWidth <= 321, "no-JavaScript root must remain responsive");
      await evaluate(
        `document.querySelector('.sw-world-fallback').scrollIntoView({block:'center',behavior:'instant'})`,
      );
      await waitFor(`document.querySelector('.sw-world-fallback img')?.naturalWidth > 0`, "no-JavaScript ship poster");
      assert.ok(
        await evaluate(
          `document.querySelector('#operator')?.textContent.includes('DOUG CASHIO') && document.querySelector('#work')?.textContent.includes('Seven projects')`,
        ),
        "no-JavaScript root must retain content",
      );
      report.checks.push({ name: "320px no-JavaScript home page remains readable", passed: true });
      await send("Emulation.setScriptExecutionDisabled", { value: false });

      const query = "?runtime=v36-legacy&keep=a%2Bb";
      await send("Page.navigate", { url: `${base}/${query}#deck=eve` });
      await waitFor(
        `location.pathname === '/command-deck.html' && location.search === ${JSON.stringify(query)} && location.hash === '#deck=eve' && !!document.querySelector('#root[data-prerendered="v35"]')`,
        "legacy deck redirect with query and hash intact",
      );
      report.checks.push({ name: "Legacy deck bookmark preserves query and hash", passed: true });
      await navigate("/odyssey.html?runtime=v36-alias");
      assert.ok((await evaluate("document.title")).includes(RELEASE_NAME), "Odyssey alias must retain V36");
      report.checks.push({ name: "Odyssey alias remains available", passed: true });
      assert.deepEqual(report.errors, [], "no runtime exceptions or console errors");
      report.checks.push({ name: "No runtime errors", passed: true });
    },
    resources,
    { browserExitTimeoutMs: 5000 },
  );
  report.passed = true;
}

try {
  await run();
} catch (error) {
  report.failures.push(error.stack ?? String(error));
  process.exitCode = 1;
}
console.log(JSON.stringify(report, null, 2));
