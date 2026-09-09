import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkPerspective } from "./perspective-runtime.mjs";
import { captureWorkshop, checkJourney, checkFlightEnding, measureJourney } from "./journey-runtime.mjs";

import {
  browserExitDiagnostic,
  browserVersionAcceptanceFailures,
  connectCdp,
  runWithLayoutCleanup,
} from "./layout-runtime-support.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.resolve(ROOT, process.env.CASHIO_TEST_DIST || "dist");
const RELEASE_NAME = "THE HUMAN RECKONING";
const PAGE_TITLE = "Cashio V37.13 — Continuum | Doug Cashio";
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
    ".mp4": "video/mp4",
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
      assert.match(rootHtml, /data-prerendered="odyssey"/, "root must contain the prerendered V37 page");
      assert.ok(rootHtml.includes(`<title>${PAGE_TITLE}</title>`), "root title must identify V37.13 Continuum");
      assert.match(rootHtml, /Own the iron/, "hero heading must exist before JavaScript");
      assert.doesNotMatch(
        rootHtml,
        /<meta\b[^>]*\bcontent=["'][^"']*(?:noindex|nofollow)/i,
        "released homepage must permit indexing",
      );
      const receiptResponse = await fetch(`${base}/site-release.json`);
      assert.equal(receiptResponse.status, 200, "current release receipt must exist");
      const receipt = await receiptResponse.json();
      const packageJson = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
      assert.equal(receipt.experienceVersion, packageJson.version, "receipt and package versions must match");
      assert.equal(receipt.experienceVersion, "37.13.0", "current receipt must be the V37.13 release");
      assert.equal(receipt.published, true, "release must be explicitly published");
      assert.equal(receipt.releaseName, RELEASE_NAME);
      assert.equal(receipt.visualEdition, "Lensing");
      assert.equal(receipt.featuredExperience, "Lensing Observatory");
      assert.equal(receipt.status, "released");
      assert.equal(receipt.entry, "/");
      assert.equal(receipt.legacyEntry, "/command-deck.html");
      assert.deepEqual(receipt.evidenceArchive, {
        release: "V35 ALL TENS",
        fleetObserved: "2026-08-28",
        routingObserved: "2026-08-21",
      });
      report.release = receipt;
      report.checks.push({ name: "Root prerender, release identity, and indexing", passed: true });

      const evidenceResponse = await fetch(`${base}/status.json`);
      assert.equal(evidenceResponse.status, 200);
      const evidence = await evidenceResponse.json();
      assert.deepEqual(evidence.containers, { running: 19, documented: 19, stopped: 0, zeus: 14, apollo: 5 });
      assert.deepEqual(evidence.virtualMachines, { running: 1, documented: 1, stopped: 0 });
      assert.deepEqual(evidence.lanes, { public: null, privateCatalog: null });
      assert.equal(evidence.routingVerified, null);
      assert.equal(evidence.expires, null);
      assert.deepEqual(receipt.evidenceSnapshot, {
        url: "/status.json",
        fleetObserved: evidence.verified,
        observedAtUtc: evidence.provenance.observedAtUtc,
        routingObserved: null,
      });
      const archiveResponse = await fetch(`${base}${evidence.archive.url}`);
      assert.equal(archiveResponse.status, 200);
      const archiveText = await archiveResponse.text();
      assert.equal(archiveText, await readFile(path.join(ROOT, "public", evidence.archive.url), "utf8"));
      assert.equal(JSON.parse(archiveText).verified, "2026-08-28");
      report.checks.push({
        name: "Latest fleet export, unknown routing, and unchanged historical download",
        passed: true,
      });

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
      // Send values as protocol arguments instead of constructing JavaScript from them.
      const evaluateFunction = async (functionDeclaration, values) => {
        const context = await send("Runtime.evaluate", { expression: "globalThis" });
        const objectId = context.result.objectId;
        assert.ok(objectId, "the current page must expose its execution context");
        try {
          const result = await send("Runtime.callFunctionOn", {
            objectId,
            functionDeclaration,
            arguments: values.map((value) => ({ value })),
            returnByValue: true,
            awaitPromise: true,
          });
          if (result.exceptionDetails)
            throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
          return result.result.value;
        } finally {
          await send("Runtime.releaseObject", { objectId });
        }
      };
      const waitFor = async (expression, description, timeout = 15_000) => {
        const end = Date.now() + timeout;
        while (Date.now() < end) {
          if (await (typeof expression === "function" ? expression() : evaluate(expression))) return;
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
      const pressKey = async (key, windowsVirtualKeyCode) => {
        await send("Input.dispatchKeyEvent", {
          type: key === "Enter" ? "keyDown" : "rawKeyDown",
          key,
          code: key,
          windowsVirtualKeyCode,
          ...(key === "Enter" ? { text: "\r", unmodifiedText: "\r" } : {}),
        });
        await send("Input.dispatchKeyEvent", { type: "keyUp", key, code: key, windowsVirtualKeyCode });
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

      if (argument("capture-workshop") === "true") {
        await captureWorkshop({ navigate, evaluate, click, waitFor, send, report });
        return;
      }
      if (argument("journey-only") === "true") {
        await checkJourney({ navigate, evaluate, click, pressKey, waitFor, send, report });
        await checkFlightEnding({ navigate, evaluate, click, pressKey, waitFor, send, report });
        return;
      }
      if (argument("measure-journey") === "true") {
        await measureJourney({ navigate, evaluate, click, pressKey, waitFor, send, report });
        return;
      }
      for (const width of [1440, 390, 320]) {
        await navigate(`/?runtime=v36-${width}`, width, width === 1440 ? 1000 : 844);
        const result = await layout();
        assert.match(result.heading, /Own the iron\..*Shape the possible\./);
        assert.equal(result.title, PAGE_TITLE);
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
        await click('[aria-label="Motion on — pause ambient motion"]');
        await waitFor(`document.querySelector('.event-horizon')?.dataset.motion === 'off'`, "manual motion pause");
        assert.equal(
          await evaluate(
            `document.querySelector('[aria-label="Motion off — resume ambient motion"]')?.getAttribute('aria-pressed')`,
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

      const studyCases = [
        {
          id: "hermes",
          fragment: "#build=hermes&intent=analyze&private=1&sources=1",
          toggles: [true, true],
          intent: "Analyze",
          run: true,
          result: "Human review",
        },
        {
          id: "cascade",
          fragment: "#build=cascade&severity=25&confidence=74",
          ranges: ["25", "74"],
          result: "Gather evidence",
        },
        {
          id: "exposure",
          fragment: "#build=exposure&reachable=1&auth=1&critical=1",
          toggles: [true, true, true],
          result: "Review the boundary",
        },
        {
          id: "briefing",
          fragment: "#build=briefing&facts=routing",
          toggles: [false, true, false],
          run: true,
          result: "Evidence before expansion.",
        },
        { id: "dashboards", fragment: "#build=dashboards&age=24", ranges: ["24"], result: "The evidence is stale." },
        {
          id: "signal",
          fragment: "#build=signal&deviation=30&corroborated=1",
          ranges: ["30"],
          toggles: [true],
          result: "Operator review",
        },
        {
          id: "graphify",
          fragment: "#build=graphify&module=adapter",
          module: "Adapter",
          result: "Adapter: 2 dependent modules",
        },
      ];
      for (const study of studyCases) {
        await navigate(`/?runtime=v37-settings-${study.id}${study.fragment}`, 320, 844);
        await waitFor(
          `document.querySelector('#tab-${study.id}')?.getAttribute('aria-selected') === 'true'`,
          `${study.id} selected`,
        );
        if (study.ranges)
          await waitFor(
            `JSON.stringify([...document.querySelectorAll('.o-lab input[type="range"]')].map(input=>input.value)) === ${JSON.stringify(JSON.stringify(study.ranges))}`,
            `${study.id} range settings restored`,
          );
        if (study.toggles)
          await waitFor(
            `JSON.stringify([...document.querySelectorAll('.o-lab input[type="checkbox"]')].map(input=>input.checked)) === ${JSON.stringify(JSON.stringify(study.toggles))}`,
            `${study.id} toggle settings restored`,
          );
        if (study.intent)
          await waitFor(
            `document.querySelector('.o-segment [aria-pressed="true"]')?.textContent.trim() === ${JSON.stringify(study.intent)}`,
            `${study.id} intent setting restored`,
          );
        // Selecting the tab and restoring its saved controls are separate effects.
        // Wait for each requested setting, as above for range and toggle controls.
        if (study.module)
          await waitFor(
            `document.querySelector('.o-code-graph [aria-pressed="true"]')?.textContent.trim() === ${JSON.stringify(study.module)}`,
            `${study.id} module setting restored`,
          );
        if (study.run) await click(".o-run");
        await waitFor(
          `document.querySelector('.o-lab').textContent.includes(${JSON.stringify(study.result)})`,
          `${study.id} reproduced outcome`,
        );
        if (study.id === "briefing") {
          const result = await evaluate(`document.querySelector('.o-brief-output').textContent`);
          assert.match(result, /did not establish a current routing inventory/);
          assert.doesNotMatch(result, /19 LXC|10 model lanes/);
        }
        await click(".o-field-notes summary");
        assert.ok(await evaluate(`document.querySelector('.o-field-notes').open`));
        const note = await evaluate(`document.querySelector('.o-field-notes').textContent`);
        for (const label of ["Rule", "Try this", "Boundary"]) assert.ok(note.includes(label));
        const result = await layout();
        assert.ok(result.scrollWidth <= 321 && result.bodyWidth <= 321, `${study.id} notes and output fit 320px`);
        // Replace only the clipboard in this isolated test page; never touch the user's clipboard.
        await evaluate(
          `Object.defineProperty(navigator, 'clipboard', {configurable:true,value:{writeText:async(text)=>{window.__copiedStudy=text}}})`,
        );
        await click(".o-project-footer button");
        await waitFor(
          `document.querySelector('.o-project-footer button').textContent.includes('Settings link copied')`,
          "settings copy confirmation",
        );
        assert.equal(await evaluate(`window.__copiedStudy`), `${base}/${study.fragment}`);
      }
      report.checks.push({
        name: "Seven reproducible experiments, inspectable notes, and 320px settings sharing",
        passed: true,
      });

      await navigate("/?runtime=v37-share-history#build=cascade&severity=25&confidence=74", 390, 844);
      await waitFor(
        `document.querySelector('.o-lab input[type="range"]')?.value === '25' && document.querySelectorAll('.o-lab input[type="range"]')[1]?.value === '74'`,
        "initial saved cascade settings",
      );
      await send("Page.navigate", {
        url: `${base}/?runtime=v37-share-history#build=cascade&severity=70&confidence=39`,
      });
      await waitFor(
        `document.querySelector('.o-lab input[type="range"]')?.value === '70'`,
        "same-study hash restores settings",
      );
      await evaluate("history.back()");
      await waitFor(
        `document.querySelector('.o-lab input[type="range"]')?.value === '25'`,
        "back restores earlier settings",
      );
      await evaluate("history.forward()");
      await waitFor(
        `document.querySelector('.o-lab input[type="range"]')?.value === '70'`,
        "forward restores later settings",
      );
      await evaluate(
        `Object.defineProperty(navigator, 'clipboard', {configurable:true,value:{writeText:async()=>{throw new Error('Test clipboard denied')}}})`,
      );
      await click(".o-project-footer button");
      await waitFor(`!!document.querySelector('.o-share-fallback input')`, "manual copy fallback");
      assert.equal(
        await evaluate(`document.querySelector('.o-share-fallback input').value`),
        `${base}/#build=cascade&severity=70&confidence=39`,
      );
      await click(".o-share-fallback input");
      assert.ok(
        await evaluate(
          `(() => {const input=document.querySelector('.o-share-fallback input');return input.selectionStart===0&&input.selectionEnd===input.value.length})()`,
        ),
        "fallback link selects completely",
      );
      assert.ok((await layout()).scrollWidth <= 391, "manual copy fallback fits a phone");
      await click('.o-lab input[type="range"]');
      await pressKey("Home", 36);
      await waitFor(
        `document.querySelector('.o-lab input[type="range"]').value === '0' && !document.querySelector('.o-share-fallback')`,
        "editing settings clears stale copy feedback",
      );
      report.checks.push({
        name: "Same-study restore, back/forward, manual copy fallback, and stale feedback reset",
        passed: true,
      });

      await navigate("/?runtime=v37-current-evidence#evidence", 390, 844);
      const factValues = await evaluate(
        `[...document.querySelectorAll('.o-fact-rail strong')].map(item => item.textContent)`,
      );
      assert.deepEqual(factValues, ["02", "19", "01"]);
      assert.match(await evaluate(`document.querySelector('.o-archive-dates').textContent`), /7 September 2026/);
      assert.equal(await evaluate(`document.querySelector('.o-audit-story').open`), false);
      await click(".o-audit-story summary");
      await waitFor(`document.querySelector('.o-audit-story').open`, "real audit case expands");
      assert.deepEqual(
        await evaluate(
          `[...document.querySelectorAll('.o-audit-story tbody tr')].map(row => [...row.children].map(cell => cell.textContent.trim()))`,
        ),
        [
          ["LXC running", "18", "19"],
          ["QEMU running", "Not recorded", "1"],
          ["Public lanes", "10", "Not verified"],
        ],
      );
      assert.deepEqual(
        await evaluate(`[...document.querySelectorAll('.o-audit-story time')].map(time => time.dateTime)`),
        ["2026-08-28", "2026-09-07", "2026-08-21"],
      );
      assert.match(
        await evaluate(`document.querySelector('.o-audit-story').textContent`),
        /does not mean no VM existed[\s\S]*not a demonstration of live AI routing/,
      );
      assert.ok((await layout()).scrollWidth <= 391, "expanded audit comparison fits a phone");
      await pressKey("Enter", 13);
      await waitFor(`!document.querySelector('.o-audit-story').open`, "keyboard closes the audit case");
      report.checks.push({
        name: "Real audit case preserves record scopes, independent dates, unknown routing, and keyboard disclosure",
        passed: true,
      });
      await click(".o-command-shortcuts button:nth-child(1)");
      await waitFor(
        `document.querySelector('.o-console-output').textContent.includes('19 LXC CONTAINERS')`,
        "current fleet response",
      );
      await click(".o-command-shortcuts button:nth-child(2)");
      await waitFor(
        `document.querySelector('.o-console-output').textContent.includes('Public lanes: Not verified')`,
        "unverified routing response",
      );
      const responses = await evaluate(`document.querySelector('.o-console-output').textContent`);
      assert.match(responses, /1 QEMU VIRTUAL MACHINE/);
      assert.match(responses, /ZEUS · 14 CONTAINERS · APOLLO · 5 CONTAINERS/);
      assert.doesNotMatch(responses, /18\/19|10 PUBLIC LANES|36 PRIVATE CATALOG|Public lanes: 0|VALID THROUGH/);
      await click(".o-command-shortcuts button:nth-child(3)");
      await waitFor(
        `document.querySelector('.o-console-output').textContent.includes('V35 HISTORICAL ARCHIVE')`,
        "explicit archive response",
      );
      assert.match(
        await evaluate(`document.querySelector('.o-console-output').textContent`),
        /28 August 2026 · Routing: 21 August 2026/,
      );
      report.checks.push({
        name: "Visible fleet, current console aliases, and explicit archive comparison",
        passed: true,
      });

      for (const [command, href, target] of [
        ["lineage", "#lineage", "#lineage"],
        ["builds", "#work", "#work"],
        ["operator", "#operator", "#operator"],
        ["routing", "#build=hermes", "#project-panel"],
      ]) {
        await click("#eve-command");
        await send("Input.insertText", { text: command });
        await pressKey("Enter", 13);
        await waitFor(
          `document.querySelector('.o-terminal-link')?.getAttribute('href') === ${JSON.stringify(href)}`,
          `${command} names its real destination`,
        );
        await click(".o-terminal-link");
        await waitFor(
          () =>
            evaluateFunction(
              `function(expectedHash, selector) {
                const element = document.querySelector(selector);
                if (!element || location.hash !== expectedHash) return false;
                const rect = element.getBoundingClientRect();
                return rect.top < innerHeight && rect.bottom > 100;
              }`,
              [href, target],
            ),
          `${command} opens the corresponding visible section`,
        );
        if (command === "routing")
          await waitFor(
            `document.querySelector('#tab-hermes')?.getAttribute('aria-selected') === 'true'`,
            "routing opens the HERMES study",
          );
      }
      for (const command of ["constructor", "__proto__"]) {
        await click("#eve-command");
        await send("Input.insertText", { text: command });
        await pressKey("Enter", 13);
        await waitFor(
          `document.querySelector('.o-console-output')?.textContent.includes(${JSON.stringify(`UNKNOWN COMMAND · ${command.toUpperCase()}`)}) && !document.querySelector('.o-terminal-link')`,
          "unknown object keys produce text without breaking the console",
        );
      }
      await click(".o-command-shortcuts button:nth-child(1)");
      await waitFor(
        `document.querySelector('.o-console-output')?.lastElementChild.textContent === 'DATED EXPORT · NO LIVE SYSTEM ACCESS'`,
        "normal commands remain usable after unusual input",
      );
      report.checks.push({
        name: "E.V.E. section links, HERMES model destination, and resilient unknown-command handling",
        passed: true,
      });

      await navigate("/?runtime=v37-current-brief#build=briefing", 320, 844);
      await waitFor(
        `document.querySelector('#tab-briefing')?.getAttribute('aria-selected') === 'true' && !!document.querySelector('.o-lab[data-lab="3"] .o-run:not(:disabled)')`,
        "briefing deep link and deferred instrument controls",
      );
      await click(".o-run");
      await waitFor(
        `document.querySelector('.o-brief-output').textContent.includes('19 LXC containers and 1 QEMU virtual machine')`,
        "brief uses current container and VM scopes",
      );
      const brief = await evaluate(`document.querySelector('.o-brief-output').textContent`);
      assert.match(brief, /7 September 2026/);
      assert.doesNotMatch(brief, /18 of 19|10 model lanes|28 August/);
      const briefLayout = await layout();
      assert.ok(
        briefLayout.scrollWidth <= 321 && briefLayout.bodyWidth <= 321,
        "composed brief must fit a narrow phone",
      );
      report.checks.push({ name: "320px composed briefing uses the current dated export", passed: true });

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
      await waitFor(
        `!!document.querySelector('#operator .cashio-brand-mark svg')`,
        "visible signature receives its circuit detail",
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
          `document.querySelector('[aria-label="Motion off — follows your system preference"]')?.disabled`,
        ),
        true,
      );
      report.checks.push({ name: "System reduced motion stops ambient and request-flow controls", passed: true });

      await navigate("/?runtime=v37-sanctuary-keyboard#film=sanctuary");
      await waitFor(`document.querySelector('.lensing-film[data-clip="sanctuary"]')?.open`, "Sanctuary dialog");
      assert.equal(await evaluate(`document.querySelector('.lensing-film video')?.paused`), true);
      // A chapter selection explicitly loads a paused frame. All subsequent
      // timeline changes must come from native keyboard input, not JS seeks.
      await click('[aria-label="Seek to Awakening"]');
      const pausedSeek = `(() => {
        const panel = document.querySelector('.lensing-film');
        const video = panel?.querySelector('video');
        const range = panel?.querySelector('[aria-label="Seek film"]');
        return panel?.dataset.playback === 'paused' && video?.readyState >= 2 && video.paused && !video.seeking
          && Math.abs(video.currentTime - Number(range?.value)) <= 0.015;
      })()`;
      await waitFor(pausedSeek, "Sanctuary chapter frame", 30_000);
      assert.ok(await evaluate(`document.querySelector('.lensing-film video').currentTime >= 4.9`));
      await evaluate(`document.querySelector('.lensing-film-scrubber').focus()`);
      assert.equal(await evaluate(`document.activeElement?.matches('.lensing-film-scrubber')`), true);
      await pressKey("Home", 36);
      await waitFor(
        `${pausedSeek} && document.querySelector('.lensing-film video').currentTime < 0.015`,
        "keyboard Home selects the paused opening frame",
      );
      for (let index = 0; index < 15; index++) {
        await pressKey("ArrowRight", 39);
        await waitFor(pausedSeek, `paused keyboard step ${index + 1}`);
      }
      const keyboardForward = await evaluate(`(() => {
        const video = document.querySelector('.lensing-film video');
        const range = document.querySelector('.lensing-film-scrubber');
        return {time: video.currentTime, range: Number(range.value), paused: video.paused};
      })()`);
      assert.ok(
        keyboardForward.time >= 0.1,
        `small keyboard steps must accumulate: ${JSON.stringify(keyboardForward)}`,
      );
      assert.ok(Math.abs(keyboardForward.time - keyboardForward.range) <= 0.015);
      for (let index = 0; index < 5; index++) {
        await pressKey("ArrowLeft", 37);
        await waitFor(pausedSeek, `paused reverse keyboard step ${index + 1}`);
      }
      const keyboardReverse = await evaluate(`document.querySelector('.lensing-film video').currentTime`);
      assert.ok(keyboardReverse < keyboardForward.time - 0.03, "ArrowLeft must select earlier paused frames");
      await pressKey("End", 35);
      await waitFor(
        `${pausedSeek} && (() => {const v = document.querySelector('.lensing-film video'); return v.duration - v.currentTime < 0.08;})()`,
        "keyboard End selects the paused final frame",
      );
      const keyboardEnd = await evaluate(`(() => {
        const video = document.querySelector('.lensing-film video');
        return {time: video.currentTime, duration: video.duration, paused: video.paused};
      })()`);
      await delay(200);
      assert.ok(
        await evaluate(`(() => {
          const v = document.querySelector('.lensing-film video');
          return v.paused && Math.abs(v.currentTime - ${keyboardEnd.time}) <= 0.001;
        })()`),
        "keyboard seeking must never start playback",
      );
      await pressKey("Escape", 27);
      await waitFor(
        `!document.querySelector('.lensing-film') && !location.hash && document.body.style.overflow !== 'hidden' && document.activeElement?.matches('.lens-film-link')`,
        "film Escape restores the page and launcher focus",
      );
      report.checks.push({
        name: "Sanctuary native keyboard scrubbing advances decoded media without autoplay",
        passed: true,
        evidence: { forward: keyboardForward, reverse: keyboardReverse, end: keyboardEnd },
      });

      await navigate("/?runtime=v37-continuum#film=sanctuary", 390, 844);
      await waitFor(`document.querySelector('.lensing-film[data-clip="sanctuary"]')?.open`, "Continuum film");
      assert.equal(
        await evaluate(
          `performance.getEntriesByType('resource').some(entry => /sanctuary-(world|renderer)/.test(entry.name))`,
        ),
        false,
        "the chamber must not load before its explicit entry",
      );
      await click(".lensing-film-enter-world");
      await waitFor(
        `document.querySelector('.sanctuary-world canvas')?.dataset.ready === 'true'`,
        "Sanctuary 3D chamber",
        30_000,
      );
      const chamber = await evaluate(`(() => {
        const world = document.querySelector('.sanctuary-world');
        const canvas = world.querySelector('canvas');
        return { ...canvas.dataset, modals: document.querySelectorAll('dialog:modal').length,
          video: !!document.querySelector('.lensing-film video'), focused: document.activeElement?.matches('.sanctuary-world-return'),
          overflow: world.scrollWidth > world.clientWidth + 1 || document.documentElement.scrollWidth > innerWidth + 1 };
      })()`);
      assert.equal(chamber.modals, 1);
      assert.equal(chamber.video, false, "entering the chamber releases the film player");
      assert.equal(chamber.focused, true);
      assert.equal(chamber.overflow, false);
      assert.ok(Number(chamber.pixels) <= 2_000_000 && Number(chamber.triangles) > 1000);
      assert.equal(chamber.running, "false", "reduced motion never starts the awakening");
      assert.equal(await evaluate(`document.querySelector('.sanctuary-world-awaken').disabled`), true);
      await evaluate(`document.fonts.ready.then(() => true)`);
      await waitFor(
        `document.querySelector('.sanctuary-world')?.dataset.ready === 'true' && getComputedStyle(document.querySelector('.sanctuary-world canvas')).opacity === '1'`,
        "completed poster-to-chamber reveal",
      );
      // Readiness can precede the first ResizeObserver delivery on a busy GPU.
      // Let that initial work settle, then independently verify an idle window.
      let previousFrame = "";
      let quietSince = Date.now();
      const settleDeadline = Date.now() + 5000;
      while (Date.now() - quietSince < 400) {
        assert.ok(Date.now() < settleDeadline, "the chamber must settle without continuous painting");
        const currentFrame = await evaluate(`document.querySelector('.sanctuary-world canvas').dataset.frame`);
        if (currentFrame !== previousFrame) {
          previousFrame = currentFrame;
          quietSince = Date.now();
        }
        await delay(100);
      }
      const stillFrame = await evaluate(`document.querySelector('.sanctuary-world canvas').dataset.frame`);
      await delay(300);
      assert.equal(await evaluate(`document.querySelector('.sanctuary-world canvas').dataset.frame`), stillFrame);
      await click(".sanctuary-world-elements button:nth-child(2)");
      await waitFor(
        `document.querySelector('.sanctuary-world canvas').dataset.selection === 'left'`,
        "select owned intelligence",
      );
      await evaluate(`document.querySelector('.sanctuary-world canvas').focus()`);
      await pressKey("ArrowRight", 39);
      await waitFor(
        `document.querySelector('.sanctuary-world canvas').dataset.yaw !== ${JSON.stringify(chamber.yaw)}`,
        "manual camera works under reduced motion",
      );
      await pressKey("Home", 36);
      await waitFor(
        `document.querySelector('.sanctuary-world canvas').dataset.yaw === ${JSON.stringify(chamber.yaw)}`,
        "reset chamber camera",
      );
      await evaluate(`document.querySelector('.sanctuary-world-light input').focus()`);
      await pressKey("End", 35);
      await waitFor(
        `document.querySelector('.sanctuary-world canvas').dataset.light === '100'`,
        "manual chamber light",
      );
      await click(".sanctuary-world-return");
      await waitFor(
        `document.querySelector('.lensing-film')?.dataset.view === 'film' && !!document.querySelector('.lensing-film video')`,
        "return to the film",
      );
      assert.equal(await evaluate(`document.querySelector('.lensing-film video').preload`), "none");
      assert.equal(await evaluate(`document.querySelector('.lensing-film video').currentTime`), 0);
      assert.equal(
        await evaluate(
          `performance.getEntriesByType('resource').some(entry => entry.name.includes('inner-light.mp4'))`,
        ),
        false,
        "returning to the still poster must not request film bytes",
      );
      assert.equal(await evaluate(`document.querySelector('.lensing-film video').paused`), true);
      await pressKey("Escape", 27);
      await waitFor(
        `!document.querySelector('.lensing-film') && document.body.style.overflow !== 'hidden'`,
        "close Continuum",
      );
      report.checks.push({
        name: "Continuum chamber loads on request, supports still controls, and releases cleanly",
        passed: true,
        evidence: chamber,
      });

      await navigate("/?runtime=v37-flight-labels", 320, 844);
      await click(".continuum-first-flight");
      await waitFor(`document.querySelector('.first-flight')?.open`, "First Flight dialog");
      const accessibleButtons = async () =>
        (await send("Accessibility.getFullAXTree")).nodes
          .filter((node) => !node.ignored && node.role?.value === "button")
          .map((node) => node.name?.value.replace(/\s+/g, " ").trim());
      const phoneNames = await accessibleButtons();
      for (const name of ["01 Board", "02 Hull", "03 Blackout", "04 Command"])
        assert.ok(phoneNames.includes(name), `phone speech input must match the visible label: ${name}`);
      await click(".ff-chapters button:nth-child(3)");
      await waitFor(
        `document.querySelector('.ff-chapters button:nth-child(3)')?.getAttribute('aria-current') === 'step'`,
        "Blackout chapter selection",
      );
      assert.deepEqual(
        await evaluate(
          `[...document.querySelectorAll('.ff-telemetry strong')].map(element => Number(element.textContent))`,
        ),
        [12, 0, 0],
        "the named Blackout chapter must show the local continuity outcome",
      );
      await evaluate(`(() => {
        const style = document.createElement('style'); style.id = 'runtime-text-spacing';
        style.textContent = '* { line-height:1.5 !important; letter-spacing:.12em !important; word-spacing:.16em !important; } p { margin-bottom:2em !important; }';
        document.head.append(style);
      })()`);
      const chapterSpacing = await evaluate(`[...document.querySelectorAll('.ff-chapters button')].map(button => {
        const rect = button.getBoundingClientRect();
        return {width:rect.width, height:rect.height, clipped:button.scrollWidth > button.clientWidth + 1};
      })`);
      assert.ok(chapterSpacing.every((button) => button.width >= 44 && button.height >= 44 && !button.clipped));
      await evaluate(`document.getElementById('runtime-text-spacing').remove()`);
      await send("Emulation.setDeviceMetricsOverride", {
        width: 1440,
        height: 1000,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await waitFor(
        `getComputedStyle(document.querySelector('.ff-chapter-name')).display !== 'none'`,
        "full chapter names after desktop resize",
      );
      const desktopNames = await accessibleButtons();
      for (const name of ["01 Board", "02 Open the hull", "03 Cut the cloud", "04 Human command"])
        assert.ok(desktopNames.includes(name), `desktop speech input must match the visible label: ${name}`);
      await pressKey("Escape", 27);
      await waitFor(`!document.querySelector('.first-flight')`, "close First Flight");
      // Closing the dialog and restoring its opener happen on separate frames.
      await waitFor(
        `document.activeElement?.classList.contains('continuum-first-flight')`,
        "First Flight focus returns to its invitation",
      );
      report.checks.push({
        name: "First Flight speech labels, phone text spacing, outcome, resize, and focus restoration",
        passed: true,
        evidence: {
          phoneNames: phoneNames.filter((name) => /^0[1-4] /.test(name)),
          desktopNames: desktopNames.filter((name) => /^0[1-4] /.test(name)),
          chapterSpacing,
        },
      });

      await navigate("/?runtime=v37-case-study#build=graphify", 320, 844);
      await waitFor(
        `document.querySelector('#tab-graphify')?.getAttribute('aria-selected') === 'true'`,
        "Graphify before comparison",
      );
      const comparison = [];
      for (const privateData of [false, true]) {
        await click(`.o-story-comparison a:nth-child(${privateData ? 2 : 1})`);
        await waitFor(
          `document.activeElement?.classList.contains('o-run') && document.querySelector('.o-toggle input')?.checked === ${privateData}`,
          "comparison controls and keyboard focus",
        );
        const state = await evaluate(`(() => {
          const button = document.querySelector('.o-run'); const rect = button.getBoundingClientRect();
          return {intent:document.querySelector('.o-segment [aria-pressed="true"]').textContent,
            sources:document.querySelectorAll('.o-toggle input')[1].checked,
            result:document.querySelector('.o-result h4').textContent,
            visible:rect.top >= document.querySelector('.o-header').getBoundingClientRect().bottom && rect.bottom <= innerHeight};
        })()`);
        assert.deepEqual(state, {
          intent: "Analyze",
          sources: true,
          result: "Your intent. A reasoned route.",
          visible: true,
        });
        await click(".o-run");
        const outcome = privateData ? "Human review" : "Research";
        await waitFor(
          `document.querySelector('.o-result h4')?.textContent === ${JSON.stringify(outcome)}`,
          "comparison result",
        );
        comparison.push({ privateData, outcome, ...state });
        if (!privateData) {
          await click(".o-toggle");
          await click(".o-story-comparison a:first-child");
          await waitFor(
            `!document.querySelector('.o-toggle input').checked && document.querySelector('.o-result h4').textContent === 'Your intent. A reasoned route.' && document.activeElement?.classList.contains('o-run')`,
            "same comparison link resets edited inputs without running",
          );
        }
      }
      report.checks.push({
        name: "HERMES comparison presets, visible keyboard entry, explicit execution, and repeat reset",
        passed: true,
        evidence: comparison,
      });

      await checkPerspective({ navigate, evaluate, click, pressKey, waitFor, report, send });
      await checkJourney({ navigate, evaluate, click, pressKey, waitFor, report, send });
      await checkFlightEnding({ navigate, evaluate, click, pressKey, waitFor, report, send });

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
          `document.querySelector('#operator')?.textContent.includes('DOUG CASHIO') && document.querySelectorAll('#work [role="tab"]').length === 7`,
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
      assert.equal(await evaluate("document.title"), PAGE_TITLE, "Odyssey alias must retain V37.13 Continuum");
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
