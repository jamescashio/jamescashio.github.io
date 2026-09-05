import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { JSDOM } from "jsdom";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const asset = (path) => new URL(`../${path}`, import.meta.url);

function imageDimensions(buffer, extension) {
  if (extension === "avif") {
    const ispe = buffer.indexOf(Buffer.from("ispe"));
    assert.ok(ispe >= 0, "AVIF must contain an image spatial extents box");
    return { width: buffer.readUInt32BE(ispe + 8), height: buffer.readUInt32BE(ispe + 12) };
  }

  assert.equal(buffer.toString("ascii", 0, 4), "RIFF");
  assert.equal(buffer.toString("ascii", 8, 12), "WEBP");
  const codec = buffer.toString("ascii", 12, 16);
  if (codec === "VP8 ") {
    assert.equal(buffer.toString("hex", 23, 26), "9d012a", "WebP must contain a VP8 frame header");
    return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
  }
  if (codec === "VP8X") {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3),
    };
  }
  assert.equal(codec, "VP8L", `unsupported WebP codec ${codec}`);
  assert.equal(buffer[20], 0x2f, "WebP lossless data must contain its signature byte");
  return {
    width: 1 + (((buffer[22] & 0x3f) << 8) | buffer[21]),
    height: 1 + (((buffer[24] & 0x0f) << 10) | (buffer[23] << 2) | (buffer[22] >> 6)),
  };
}

const requiredWorkflowCommands = [
  "npm ci",
  "npm run lint",
  "npm run format:check",
  "npm run test:node",
  "npm run test:odyssey",
  "npm run build",
  "npm run test:artifact",
  "npm run test:release",
  "python scripts/public_repo_guard.py",
  "python scripts/check_release_consistency.py",
  "python -m py_compile",
  "python scripts/check_committed_whitespace.py",
];
const requiredPagesCommands = requiredWorkflowCommands.toSpliced(
  7,
  0,
  "npm run check:layout:runtime:pinned",
  "npm run check:v36:runtime:pinned",
);

function assertOrdered(text, markers, boundary, label) {
  let position = -1;
  for (const marker of markers) {
    const next = text.indexOf(marker, position + 1);
    assert.ok(next > position, `${label} must run ${marker} in release-gate order`);
    position = next;
  }
  assert.ok(text.indexOf(boundary) > position, `${label} must complete every gate before ${boundary}`);
}

function expandScript(scripts, name, seen = new Set()) {
  assert.ok(!seen.has(name), `npm script cycle at ${name}`);
  const nextSeen = new Set(seen).add(name);
  return scripts[name].split(" && ").flatMap((command) => {
    const match = command.match(/^npm run (\S+)$/);
    return match && scripts[match[1]] ? expandScript(scripts, match[1], nextSeen) : [command];
  });
}

test("V36 software gates preserve the independent V35 dated evidence", async () => {
  const packageJson = JSON.parse(await read("package.json"));
  assert.equal(packageJson.version, "36.0.0");
  const lock = JSON.parse(await read("package-lock.json"));
  assert.equal(lock.version, packageJson.version);
  assert.equal(lock.packages[""].version, packageJson.version);
  for (const dependency of [
    "@eslint/js",
    "eslint",
    "eslint-plugin-react-hooks",
    "eslint-plugin-react-refresh",
    "globals",
    "prettier",
    "typescript-eslint",
  ]) {
    assert.ok(packageJson.devDependencies[dependency], `${dependency} must be a direct dev dependency`);
  }
  assert.equal(packageJson.scripts.lint, "eslint . --max-warnings 0");
  const formattingScope =
    '"src/**/*.{ts,tsx,css}" "tests/**/*.mjs" "scripts/**/*.{mjs,mts}" "*.{js,json,md,ts}" "docs/**/*.md" ".github/**/*.{md,yml,yaml}" "public/**/*.json"';
  assert.equal(packageJson.scripts.format, `prettier --write ${formattingScope}`);
  assert.equal(packageJson.scripts["format:check"], `prettier --check ${formattingScope}`);
  const expandedTest = expandScript(packageJson.scripts, "test");
  assert.deepEqual(expandedTest, [
    packageJson.scripts["test:node"],
    packageJson.scripts["test:odyssey"],
    "tsc --noEmit",
    "vite build",
    "node --import tsx scripts/prerender.mts",
    "node --import tsx scripts/prerender-odyssey.mts",
    packageJson.scripts["test:artifact"],
    packageJson.scripts["test:release"],
  ]);
  assert.match(expandedTest[0], /^node --import tsx --test /);
  assert.match(expandedTest[0], /tests\/prerender\.test\.mjs/);
  assert.doesNotMatch(expandedTest[0], /tests\/release-gates\.test\.mjs/);
  assert.equal(packageJson.scripts["test:artifact"], "node --import tsx --test tests/release-gates.test.mjs");
  assert.match(expandedTest[6], /tests\/release-gates\.test\.mjs/);
  assert.match(expandedTest[7], /^python -m unittest /);
  assert.deepEqual(expandScript(packageJson.scripts, "verify"), [
    packageJson.scripts.lint,
    packageJson.scripts["format:check"],
    packageJson.scripts["test:node"],
    packageJson.scripts["test:odyssey"],
    "tsc --noEmit",
    "vite build",
    "node --import tsx scripts/prerender.mts",
    "node --import tsx scripts/prerender-odyssey.mts",
    packageJson.scripts["test:artifact"],
    "node scripts/check_layout_runtime.mjs",
    "node scripts/check_v36_runtime.mjs",
    packageJson.scripts["test:release"],
    "python scripts/public_repo_guard.py",
    "python scripts/check_release_consistency.py",
    "python scripts/check_committed_whitespace.py",
  ]);
  assert.equal(
    expandScript(packageJson.scripts, "verify").filter((command) => command === "vite build").length,
    1,
    "verify must build once before checking the built layout",
  );

  const status = JSON.parse(await read("status.json"));
  const publicStatus = JSON.parse(await read("public/status.json"));
  assert.deepEqual(status, publicStatus);
  assert.equal(status.release, "V35 ALL TENS");
  assert.equal(status.revised, "2026-08-28");
  assert.equal(status.verified, "2026-08-28");
  assert.equal(status.expires, "2026-09-27");
  assert.deepEqual(status.containers, { running: 18, documented: 19, stopped: 1, zeus: 12, apollo: 6 });
  assert.equal(status.routingVerified, "2026-08-21");
});

test("the responsive command poster assets meet their exact dimensions and byte budgets", async () => {
  const expected = [
    ["public/plates/command-desktop.avif", "avif", 1440, 810, 45_000],
    ["public/plates/command-desktop.webp", "webp", 1440, 810, 70_000],
    ["public/plates/command-mobile.avif", "avif", 768, 432, 15_000],
    ["public/plates/command-mobile.webp", "webp", 768, 432, 25_000],
  ];
  let combinedBytes = 0;

  for (const [path, extension, width, height, cap] of expected) {
    const [buffer, metadata] = await Promise.all([readFile(asset(path)), stat(asset(path))]);
    assert.deepEqual(imageDimensions(buffer, extension), { width, height }, `${path} dimensions`);
    assert.ok(metadata.size <= cap, `${path} must be at most ${cap} bytes; received ${metadata.size}`);
    combinedBytes += metadata.size;
  }

  assert.ok(
    combinedBytes <= 155_000,
    `responsive command assets must total at most 155000 bytes; received ${combinedBytes}`,
  );
});

test("the V35 archive preloads only its critical font and responsive AVIF poster", async () => {
  const dom = new JSDOM(await read("command-deck.html"));
  const preloads = [...dom.window.document.querySelectorAll('link[rel="preload"]')];
  const fonts = preloads.filter((link) => link.getAttribute("as") === "font");
  const images = preloads.filter((link) => link.getAttribute("as") === "image");

  assert.deepEqual(
    fonts.map((link) => link.getAttribute("href")),
    ["/fonts/orbitron-900.woff2"],
  );
  for (const font of fonts) {
    assert.equal(font.getAttribute("type"), "font/woff2");
    assert.ok(font.hasAttribute("crossorigin"), `${font.getAttribute("href")} must use anonymous CORS`);
  }

  assert.equal(images.length, 1, "one image format must own responsive poster preload discovery");
  assert.deepEqual(
    {
      href: images[0].getAttribute("href"),
      type: images[0].getAttribute("type"),
      srcset: images[0].getAttribute("imagesrcset"),
      sizes: images[0].getAttribute("imagesizes"),
      priority: images[0].getAttribute("fetchpriority"),
    },
    {
      href: "/plates/command-desktop.avif",
      type: "image/avif",
      srcset: "/plates/command-mobile.avif 768w, /plates/command-desktop.avif 1440w",
      sizes: "100vw",
      priority: "high",
    },
  );
  assert.equal(preloads.length, 2, "WebP, JPEG, and noncritical fonts must not be preloaded");
});

test("the built V35 archive retains its real command deck, critical shell and deferred assets", async () => {
  const dom = new JSDOM(await read("dist/command-deck.html"));
  const document = dom.window.document;
  const roots = [...document.querySelectorAll("#root")];

  assert.equal(roots.length, 1, "the built document must expose exactly one app root");
  assert.equal(roots[0].getAttribute("data-prerendered"), "v35");
  assert.match(roots[0].textContent ?? "", /OWN THE IRON/);
  assert.equal(roots[0].querySelectorAll("section[data-deck]").length, 9);
  assert.ok(roots[0].querySelector('[aria-label="CONTACT deck"]'));
  assert.equal(roots[0].children.length, 1, "the root must contain only the shared React tree");

  const scripts = [...document.querySelectorAll('script[type="module"][src]')];
  const styles = [...document.querySelectorAll('link[rel="stylesheet"][href]')];
  assert.equal(scripts.length, 1);
  assert.equal(styles.length, 0, "the complete stylesheet must wait for intent-aware client activation");
  assert.equal(document.querySelectorAll("style[data-critical-shell]").length, 1);
  assert.match(scripts[0].getAttribute("src") ?? "", /^\/assets\/[\w-]+\.js$/);
  assert.equal(document.querySelector('script[src="/legacy-route.js"]'), null, "archive must not redirect to itself");
  const criticalRoute = document.querySelector("script[data-critical-route]");
  assert.ok(criticalRoute, "the built document must retain the synchronous pre-paint route helper");
  const criticalRouteHash = createHash("sha256")
    .update(criticalRoute.textContent ?? "")
    .digest("base64");
  const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute("content") ?? "";
  assert.ok(
    csp.includes(`'sha256-${criticalRouteHash}'`),
    "the built pre-paint route helper must retain its exact CSP hash",
  );
  const entryPath = scripts[0].getAttribute("src")?.replace(/^\//, "");
  assert.ok(entryPath);
  const entry = await read(`dist/${entryPath}`);
  assert.equal(entry.match(/assets\/main-[\w-]+\.css/g)?.length, 1);
});

test("the homepage and Odyssey alias ship the same complete V36 story with a usable V35 archive", async () => {
  let homeMarkup;
  for (const entry of ["index.html", "odyssey.html"]) {
    const document = new JSDOM(await read(`dist/${entry}`)).window.document;
    const root = document.querySelector('#odyssey-root[data-prerendered="odyssey"]');
    assert.ok(root, `${entry} must contain the real server-rendered story`);
    assert.equal(document.querySelectorAll("#odyssey-root").length, 1);
    assert.equal(document.querySelector("#root"), null);
    assert.equal(root.querySelectorAll("h1").length, 1);
    assert.equal(root.querySelectorAll('[role="tab"]').length, 7);
    assert.equal(root.querySelectorAll('[role="tab"][aria-selected="true"]').length, 1);
    assert.match(root.textContent, /THE HUMAN RECKONING/);
    assert.doesNotMatch(root.textContent, /DESIGN PREVIEW/);
    assert.match(root.textContent, /28 August 2026/);
    assert.match(root.textContent, /21 August 2026/);
    assert.ok(root.querySelector('a[href="mailto:doug@cashio.us"]'));
    assert.ok(root.querySelector('input[id="eve-command"]'));
    assert.ok(root.querySelector('a[href="/command-deck.html"]'));
    assert.equal(root.querySelectorAll("img:not([width]):not([height])").length, 0);
    assert.equal(root.querySelectorAll("audio[autoplay]").length, 0);
    assert.equal(document.querySelector('link[rel="canonical"]')?.href, "https://cashio.us/");
    const robots = document.querySelector('meta[name="robots"]')?.content ?? "";
    if (entry === "index.html") assert.doesNotMatch(robots, /noindex|nofollow/i);
    else assert.match(robots, /noindex/i);
    const compatibility = document.querySelector('head script[src="/legacy-route.js"]');
    assert.ok(compatibility, "legacy fragments must be handled before the page activates");
    for (const attr of ["type", "async", "defer"]) assert.equal(compatibility.hasAttribute(attr), false);
    const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content ?? "";
    assert.match(csp, /script-src 'self'/);
    assert.doesNotMatch(csp, /unsafe-eval/);
    const modules = [...document.querySelectorAll('script[type="module"][src]')];
    assert.ok(modules.length >= 1, "Vite must emit the entrypoint and its shared modules");
    assert.equal(
      new Set(modules.map((script) => script.src)).size,
      modules.length,
      "module scripts must not be duplicated",
    );
    for (const element of [...modules, ...document.querySelectorAll('link[rel="stylesheet"][href]')]) {
      const path = element.getAttribute("src") ?? element.getAttribute("href");
      assert.match(path, /^\/assets\/[\w.-]+\.(?:js|css)$/);
      assert.ok((await stat(asset(`dist${path}`))).size > 0, `${path} must exist in the promoted artifact`);
    }
    if (homeMarkup === undefined) homeMarkup = root.innerHTML;
    else assert.equal(root.innerHTML, homeMarkup, "the alias must render the same approved experience");
  }
});

test("V36 release manifests agree without redating the independent evidence archive", async () => {
  const manifest = JSON.parse(await read("public/site-release.json"));
  assert.equal(manifest.experienceVersion, "36.0.0");
  assert.equal(manifest.releaseName, "THE HUMAN RECKONING");
  assert.equal(manifest.status, "released");
  assert.equal(manifest.published, true);
  assert.equal(manifest.entry, "/");
  assert.equal(manifest.legacyEntry, "/command-deck.html");
  assert.deepEqual(manifest.evidenceArchive, {
    release: "V35 ALL TENS",
    fleetObserved: "2026-08-28",
    routingObserved: "2026-08-21",
  });
  assert.deepEqual(JSON.parse(await read("public/event-horizon-release.json")), manifest);
  for (const name of ["site-release.json", "event-horizon-release.json", "status.json", "legacy-route.js"])
    assert.equal(await read(`dist/${name}`), await read(`public/${name}`));
});

test("legacy deck links preserve their exact query and fragment while V36 study links remain on the homepage", async () => {
  const script = await read("public/legacy-route.js");
  const search = "?source=shared&return=%2Fproof";
  for (const hash of [
    "#deck=snapshot",
    "#deck=grid",
    "#deck=routing",
    "#deck=iron",
    "#deck=lineage",
    "#deck=builds&article=7",
    "#deck=operator",
    "#deck=eve",
    "#deck=contact",
    "",
    "#top",
    "#build=signal",
    "#observatory",
    "#operator",
  ]) {
    const redirects = [];
    const location = { hash, search, replace: (target) => redirects.push(target) };
    vm.runInNewContext(script, { window: { location } });
    assert.deepEqual(redirects, hash.startsWith("#deck=") ? [`/command-deck.html${search}${hash}`] : [], hash);
  }
});

test("original Odyssey artwork meets responsive dimensions and transfer budgets", async () => {
  for (const name of ["orbit", "sanctuary"]) {
    for (const [width, height, cap] of [
      [800, 450, 25_000],
      [1672, 941, 65_000],
    ]) {
      const path = `public/odyssey/${name}-${width}.avif`;
      const buffer = await readFile(asset(path));
      assert.deepEqual(imageDimensions(buffer, "avif"), { width, height });
      assert.ok(buffer.length <= cap, `${path} exceeds its transfer budget`);
    }
  }
});

test("public metadata and redirect fallback keep fleet and routing provenance distinct", async () => {
  const fleetExpected = ["28 August 2026", "18/19 AT 28 AUG PROBE", "DATED EXPORT"];
  const routingExpected = "ROUTING INVENTORY 21 AUGUST 2026";
  for (const path of ["command-deck.html", "public/lab.html"]) {
    const text = await read(path);
    for (const marker of fleetExpected) assert.match(text, new RegExp(marker), `${path} must include ${marker}`);
    assert.match(text, new RegExp(routingExpected), `${path} must date 10/36 as routing inventory`);
    assert.doesNotMatch(text, /19(?:\/| of )19|\bCURRENT\b|\bonline\b/i, path);
  }
});

test("release checklist separates the fresh fleet export from routing provenance and names V34 installation", async () => {
  const template = await read(".github/pull_request_template.md");
  assert.match(
    template,
    /^- \[ \] The 28 August 2026 fleet export remains 18\/19 containers \(Zeus 12\/13; Apollo 6\/6\), with 2 hosts online and the cluster quorate\.$/m,
  );
  assert.match(
    template,
    /^- \[ \] The routing inventory remains separately dated 21 August 2026, with 10 public lanes and 36 private catalog entries; unmeasured figures remain withheld\.$/m,
  );
  assert.doesNotMatch(template, /21 August 2026[^\r\n]*(?:19\/19|containers)/);

  const workflow = await read(".github/workflows/public-safety.yml");
  assert.match(workflow, /- name: Install dependencies/);
  assert.doesNotMatch(workflow, /- name: Install V33 dependencies/);
});

test("Pages refuses artifact upload unless GitHub Actions owns the Pages source after every release gate", async () => {
  const packageJson = JSON.parse(await read("package.json"));
  const workflow = await read(".github/workflows/pages.yml");
  assert.match(workflow, /node-version:\s*22/);
  assert.match(workflow, /python-version:\s*["']3\.12["']/);
  assert.match(workflow, /fetch-depth:\s*0/);
  assert.equal(
    packageJson.scripts["check:layout:runtime:pinned"],
    "node scripts/check_layout_runtime.mjs --expected-browser-major=147",
  );
  assert.match(workflow, /browser-actions\/setup-chrome@v2/);
  assert.match(workflow, /chrome-version:\s*["']?147\.0\.7727\.57["']?/);
  assert.match(workflow, /CHROME_PATH:\s*\$\{\{\s*steps\.setup_chrome\.outputs\.chrome-path\s*\}\}/);
  assert.match(workflow, /npm run check:layout:runtime:pinned/);
  assert.equal(
    packageJson.scripts["check:v36:runtime:pinned"],
    "node scripts/check_v36_runtime.mjs --expected-browser-major=147",
  );
  assert.match(workflow, /npm run check:v36:runtime:pinned/);

  const workflowOnlySourceGuard = 'test "$(gh api repos/${GITHUB_REPOSITORY}/pages --jq .build_type)" = "workflow"';
  const buildJob = workflow.slice(workflow.indexOf("  build:"), workflow.indexOf("  deploy:"));
  const deployJob = workflow.slice(workflow.indexOf("  deploy:"));
  const missingWorkflowOnlyControls = [
    workflow.includes("permissions: {}") &&
    /permissions:\s*\n\s+contents:\s*read\s*\n\s+pages:\s*read/.test(buildJob) &&
    /permissions:\s*\n\s+pages:\s*write\s*\n\s+id-token:\s*write/.test(deployJob)
      ? null
      : "least-sufficient job permissions",
    workflow.includes("GH_TOKEN: ${{ github.token }}") ? null : "job token",
    workflow.includes(workflowOnlySourceGuard) ? null : "workflow-only Pages source guard",
    workflow.includes("actions/configure-pages@v5") ? null : "configure-pages v5",
    workflow.includes("actions/upload-pages-artifact@v5") ? null : "upload-pages-artifact v5",
    /actions\/upload-pages-artifact@v5[\s\S]{0,280}include-hidden-files:\s*true/.test(workflow)
      ? null
      : "hidden Pages artifact inclusion",
  ].filter(Boolean);
  assert.deepEqual(missingWorkflowOnlyControls, []);
  assert.doesNotMatch(workflow, /actions\/upload-pages-artifact@v[34]/);
  assert.doesNotMatch(workflow, /jekyll/i);
  assertOrdered(
    workflow,
    [...requiredPagesCommands, workflowOnlySourceGuard, "actions/configure-pages@v5"],
    "actions/upload-pages-artifact@v5",
    "Pages",
  );
});

test("Public Site Safety preserves report upload and enforcement after every gate", async () => {
  const workflow = await read(".github/workflows/public-safety.yml");
  assert.match(workflow, /node-version:\s*22/);
  assert.match(workflow, /python-version:\s*["']3\.12["']/);
  assert.match(workflow, /fetch-depth:\s*0/);
  assertOrdered(workflow, requiredPagesCommands, "Upload safety report", "Public Site Safety");
  assert.match(workflow, /chrome-version:\s*["']?147\.0\.7727\.57["']?/);
  const upload = workflow.indexOf("Upload safety report");
  const enforcement = workflow.indexOf("Enforce validation results");
  assert.ok(upload >= 0 && enforcement > upload, "report upload must precede fail-closed enforcement");
  assert.match(workflow, /path:\s*public-safety-report\.txt/);
  assert.match(workflow, /if:\s*always\(\)/);
  const enforcementBlock = workflow.slice(enforcement);
  for (const step of [
    "install",
    "lint",
    "format",
    "node_tests",
    "odyssey_tests",
    "build",
    "artifact_tests",
    "layout_runtime",
    "v36_runtime",
    "release_tests",
    "safety_scan",
    "release_consistency",
    "python_syntax",
    "whitespace",
  ]) {
    assert.match(enforcementBlock, new RegExp(`steps\\.${step}\\.outcome != 'success'`));
  }
});

test("tag publication derives V36 from software metadata and validates one built artifact before publishing", async () => {
  const workflow = await read(".github/workflows/release.yml");
  assert.match(workflow, /require\('\.\/package\.json'\)\.version\.split\('\.'\)\[0\]/);
  assert.doesNotMatch(workflow, /EXPECTED_TAG[^\n]*status\.json/);
  assert.match(workflow, /node-version:\s*22/);
  assertOrdered(workflow, requiredWorkflowCommands, "softprops/action-gh-release@v3", "GitHub Release");
  assert.equal((workflow.match(/run: npm run build/g) ?? []).length, 1);
});
