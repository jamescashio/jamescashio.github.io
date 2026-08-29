import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

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

test("package metadata and deterministic local gates define the V34 release", async () => {
  const packageJson = JSON.parse(await read("package.json"));
  assert.equal(packageJson.version, "34.0.0");
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
    packageJson.scripts["test:release"],
  ]);
  assert.match(expandedTest[0], /^node --import tsx --test /);
  assert.match(expandedTest[3], /^python -m unittest /);
  assert.deepEqual(expandScript(packageJson.scripts, "verify"), [
    packageJson.scripts.lint,
    packageJson.scripts["format:check"],
    packageJson.scripts["test:node"],
    "tsc --noEmit",
    "vite build",
    packageJson.scripts["test:release"],
    "python scripts/public_repo_guard.py",
    "python scripts/check_release_consistency.py",
    "python scripts/check_committed_whitespace.py",
  ]);

  const status = JSON.parse(await read("status.json"));
  const publicStatus = JSON.parse(await read("public/status.json"));
  assert.deepEqual(status, publicStatus);
  assert.equal(status.release, "V34 MACH ONE");
  assert.equal(status.revised, "2026-08-28");
  assert.equal(status.verified, "2026-08-28");
  assert.equal(status.expires, "2026-09-27");
  assert.deepEqual(status.containers, { running: 18, documented: 19, stopped: 1, zeus: 12, apollo: 6 });
  assert.equal(status.routingVerified, "2026-08-21");
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
  assert.match(workflow, /- name: Install V34 dependencies/);
  assert.doesNotMatch(workflow, /- name: Install V33 dependencies/);
});

test("Pages blocks artifact upload on the complete Node 22 and Python 3.12 gate chain", async () => {
  const workflow = await read(".github/workflows/pages.yml");
  assert.match(workflow, /node-version:\s*22/);
  assert.match(workflow, /python-version:\s*["']3\.12["']/);
  assert.match(workflow, /fetch-depth:\s*0/);
  assertOrdered(workflow, requiredWorkflowCommands, "actions/upload-pages-artifact@v3", "Pages");
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
