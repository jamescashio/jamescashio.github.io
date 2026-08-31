import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";
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
  "npm run build",
  "npm run test:release",
  "python scripts/public_repo_guard.py",
  "python scripts/check_release_consistency.py",
  "python -m py_compile",
  "python scripts/check_committed_whitespace.py",
];
const requiredPagesCommands = requiredWorkflowCommands.toSpliced(5, 0, "npm run check:layout:runtime:pinned");

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

test("package metadata and deterministic local gates define the V35 release", async () => {
  const packageJson = JSON.parse(await read("package.json"));
  assert.equal(packageJson.version, "35.0.0");
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
    '"src/**/*.{ts,tsx}" "tests/**/*.mjs" "scripts/**/*.mjs" "*.{js,json,md,ts}" "docs/**/*.md" ".github/**/*.{md,yml,yaml}" "public/**/*.json"';
  assert.equal(packageJson.scripts.format, `prettier --write ${formattingScope}`);
  assert.equal(packageJson.scripts["format:check"], `prettier --check ${formattingScope}`);
  const expandedTest = expandScript(packageJson.scripts, "test");
  assert.deepEqual(expandedTest, [
    packageJson.scripts["test:node"],
    "tsc --noEmit",
    "vite build",
    "node --import tsx scripts/prerender.mts",
    packageJson.scripts["test:release"],
  ]);
  assert.match(expandedTest[0], /^node --import tsx --test /);
  assert.match(expandedTest[0], /tests\/prerender\.test\.mjs/);
  assert.match(expandedTest[4], /^python -m unittest /);
  assert.deepEqual(expandScript(packageJson.scripts, "verify"), [
    packageJson.scripts.lint,
    packageJson.scripts["format:check"],
    packageJson.scripts["test:node"],
    "tsc --noEmit",
    "vite build",
    "node --import tsx scripts/prerender.mts",
    "node scripts/check_layout_runtime.mjs",
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

test("the document preloads only the critical fonts and one responsive AVIF poster", async () => {
  const dom = new JSDOM(await read("index.html"));
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

test("the built document contains one real prerendered command deck with external hashed assets", async () => {
  const dom = new JSDOM(await read("dist/index.html"));
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
  assert.equal(styles.length, 1);
  assert.match(scripts[0].getAttribute("src") ?? "", /^\/assets\/index-[\w-]+\.js$/);
  assert.match(styles[0].getAttribute("href") ?? "", /^\/assets\/index-[\w-]+\.css$/);
});

test("public metadata and redirect fallback keep fleet and routing provenance distinct", async () => {
  const fleetExpected = ["28 August 2026", "18/19 AT 28 AUG PROBE", "DATED EXPORT"];
  const routingExpected = "ROUTING INVENTORY 21 AUGUST 2026";
  for (const path of ["index.html", "public/lab.html"]) {
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
  assert.match(workflow, /- name: Install V35 dependencies/);
  assert.doesNotMatch(workflow, /- name: Install V33 dependencies/);
});

test("Pages blocks artifact upload on the complete Node 22 and Python 3.12 gate chain", async () => {
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
  assertOrdered(workflow, requiredPagesCommands, "actions/upload-pages-artifact@v3", "Pages");
});

test("Public Site Safety preserves report upload and enforcement after every gate", async () => {
  const workflow = await read(".github/workflows/public-safety.yml");
  assert.match(workflow, /node-version:\s*22/);
  assert.match(workflow, /python-version:\s*["']3\.12["']/);
  assert.match(workflow, /fetch-depth:\s*0/);
  assertOrdered(workflow, requiredWorkflowCommands, "Upload safety report", "Public Site Safety");
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
    "build",
    "release_tests",
    "safety_scan",
    "release_consistency",
    "python_syntax",
    "whitespace",
  ]) {
    assert.match(enforcementBlock, new RegExp(`steps\\.${step}\\.outcome != 'success'`));
  }
});
