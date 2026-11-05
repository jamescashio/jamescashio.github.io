// The V44 release contract's measured bar, run before Doug is asked to approve a publication:
// Lighthouse mobile performance at 90 or above on three consecutive runs, desktop at 90 or above,
// and accessibility, best practices and SEO at 100 on every run. Axe runs inside `npm run test:v44`.
// Reports are kept under artifacts/v44/<commit>/ so each verdict is tied to the code it measured.
// Run after `npm run build`; set V44_URL to audit a served build instead of a local one.
import { spawn, execFileSync } from "node:child_process";
import { once } from "node:events";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import net from "node:net";
import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";
import desktop from "lighthouse/core/config/desktop-config.js";

const commit = execFileSync("git", ["rev-parse", "--short=12", "HEAD"], { encoding: "utf8" }).trim();
const out = new URL(`../artifacts/v44/${commit}/`, import.meta.url);
await mkdir(out, { recursive: true });

let server;
let url = process.env.V44_URL;
if (!url) {
  const probe = net.createServer().listen(0, "127.0.0.1");
  await once(probe, "listening");
  const port = probe.address().port;
  await new Promise((resolve) => probe.close(resolve));
  url = `http://127.0.0.1:${port}/`;
  server = spawn(process.execPath, ["scripts/serve-helios-preview.mjs", "dist", String(port), "--indexable"], {
    stdio: ["ignore", "pipe", "inherit"],
  });
  await once(server.stdout, "data");
}

const BAR = { performance: 90, accessibility: 100, "best-practices": 100, seo: 100 };
const runs = [
  ["mobile", 1, undefined],
  ["mobile", 2, undefined],
  ["mobile", 3, undefined],
  ["desktop", 1, desktop],
];
const failures = [];
const summary = [];
try {
  for (const [form, run, config] of runs) {
    // A fresh profile per run, outside the reports, so no run inherits another's cache or lock.
    const profile = await mkdtemp(path.join(tmpdir(), "v44-audit-"));
    const chrome = await launch({
      ...(process.env.CHROME_PATH ? { chromePath: process.env.CHROME_PATH } : {}),
      userDataDir: profile,
      chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"],
      logLevel: "silent",
    });
    try {
      const result = await lighthouse(
        url,
        {
          port: chrome.port,
          output: ["json", "html"],
          logLevel: "error",
          onlyCategories: Object.keys(BAR),
        },
        config,
      );
      await writeFile(new URL(`${form}-${run}.json`, out), result.report[0]);
      await writeFile(new URL(`${form}-${run}.html`, out), result.report[1]);
      const scores = Object.fromEntries(
        Object.entries(result.lhr.categories).map(([key, value]) => [key, Math.round(value.score * 100)]),
      );
      const lcp = Math.round(result.lhr.audits["largest-contentful-paint"].numericValue);
      summary.push({ form, run, scores, lcpMs: lcp });
      console.log(`${form} ${run}: ${JSON.stringify(scores)} LCP ${lcp} ms`);
      for (const [key, floor] of Object.entries(BAR))
        if (scores[key] < floor) failures.push(`${form} run ${run}: ${key} ${scores[key]} is under ${floor}`);
    } finally {
      await chrome.kill();
      await rm(profile, { recursive: true, force: true });
    }
  }
} finally {
  if (server && server.exitCode === null) server.kill();
}
await writeFile(new URL("summary.json", out), JSON.stringify({ commit, url, bar: BAR, summary, failures }, null, 2));
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else console.log(`V44 audit passed for ${commit}. Reports: artifacts/v44/${commit}/`);
