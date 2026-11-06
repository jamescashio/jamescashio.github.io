import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { routeExample } from "../src/odyssey/data.ts";
import { route } from "../src/v44/route.ts";
import { POSTERS, columnFor, posterFor, projectPoster } from "../src/v44/layout.ts";
import { checkStatus, fillStatus, longDate, statusTokens, transcript, withheldList } from "../scripts/v44-status.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (p) => readFile(path.join(root, p), "utf8");

test("the helm keeps the Odyssey routing rule for every input", () => {
  // The rule is the lane and code each input reaches, and the length of the trail; each edition words it in its own voice.
  const rule = ({ lane, code, steps }) => ({ lane, code, steps: steps.length });
  for (const intent of ["draft", "research", "analyze"])
    for (const privateData of [false, true])
      for (const sources of [false, true]) {
        const input = { intent, privateData, sources };
        assert.deepEqual(rule(route(input)), rule(routeExample(input)), JSON.stringify(input));
      }
  assert.equal(route({ intent: "research", privateData: true, sources: true }).code, "HOLD", "privacy wins");
});

test("the gate stays on screen and clear of the headline at every size, where the poster puts it", async () => {
  const html = await read("index.html");
  // The poster each screen gets, in the order the <picture> offers them.
  const posterAt = (w, h) => (w <= h ? (h <= 600 ? "gate-short" : "gate-portrait") : w / h >= 2 ? "gate-wide" : "gate");
  for (const poster of POSTERS) {
    for (const [w] of poster.sizes) assert.match(html, new RegExp(`/v44/${poster.id}-${w}\\.webp`), poster.id);
    // On its own shape a poster projects onto itself: the live gate and the painting are one scene.
    const self = projectPoster(poster, 1000 * poster.aspect, 1000);
    for (const [a, b] of [
      [self.ring, poster.layout.ring],
      [self.sun, poster.layout.sun],
      [self.planet, poster.layout.planet],
    ])
      a.forEach((v, i) => assert.ok(Math.abs(v - b[i]) < 1e-9, `${poster.id} projects onto itself`));
  }
  assert.equal(posterFor("/v44/gate-wide-2400.webp").id, "gate-wide");
  assert.equal(posterFor("/v44/gate-portrait-720.webp").id, "gate-portrait");
  assert.equal(posterFor("/v44/gate-1600.webp").id, "gate");
  for (const [w, h, position] of [
    [320, 568, [0.5, 0.5]],
    [375, 667, [0.5, 0.5]],
    [390, 844, [0.5, 0.5]],
    [834, 1194, [0.5, 0.3]],
    [1024, 768, [0.72, 0.5]],
    [1180, 820, [0.72, 0.5]],
    [1440, 900, [0.72, 0.5]],
    [1366, 768, [0.5, 0.5]],
    [1920, 1080, [0.5, 0.5]],
    [3822, 1600, [0.5, 0.5]],
  ]) {
    const poster = POSTERS.find((p) => p.id === posterAt(w, h));
    const L = projectPoster(poster, w, h, position);
    const aspect = w / h;
    const [cx, cy, R, tilt] = L.ring;
    assert.ok(R > 0.08 && R <= 0.38, `${w}x${h} radius ${R}`);
    assert.ok(tilt > 0.3 && tilt < 0.7);
    assert.ok(Math.abs(cy) < 0.36, `${w}x${h} vertical centre ${cy}`);
    assert.ok(cx - R > -aspect / 2 - 0.05 && cx + R < aspect / 2 + 0.05, `${w}x${h} ring leaves the screen`);
    if (aspect >= 0.9) {
      const { left, right } = columnFor(w);
      const ringLeftPx = (cx - R) * h + w / 2;
      assert.ok(ringLeftPx > left + (right - left) * 0.42, `${w}x${h} ring crowds the headline`);
    } else {
      assert.ok(cy > 0.1, "phones keep the gate above the headline");
    }
  }
});

test("evidence placeholders fill from status.json and refuse to publish a missing figure", async () => {
  const status = JSON.parse(await read("status.json"));
  const tokens = statusTokens(root);
  assert.equal(tokens.get("{{status.containers.running}}"), String(status.containers.running));
  assert.equal(tokens.get("{{status.backup.latestVerified}}"), String(status.backup.latestVerified));
  assert.equal(tokens.get("{{status.verifiedDay}}"), longDate(status.verified));
  assert.equal(longDate("2026-11-04"), "Wed Nov 4, 2026");
  assert.equal(longDate("2026-11-05"), "Thu Nov 5, 2026");
  assert.throws(() => longDate("2026-02-30"));
  assert.throws(() => longDate("2026-13-04"));
  assert.throws(() => longDate("2026-1-4"));
  // The page and E.V.E. share one labelled withheld list, so their counts cannot disagree.
  assert.equal(tokens.get("{{status.withheldCount}}"), String(withheldList(status).length));
  assert.equal((tokens.get("{{status.withheld}}").match(/<li>/g) || []).length, withheldList(status).length);
  assert.ok(withheldList(status).every(({ label, reason }) => label && reason));
  assert.deepEqual(
    transcript("WEBVTT\n\n00:00.000 --> 00:01.000\nIn a world...\n\n00:01.000 --> 00:02.000\nDon't panic."),
    ["In a world...", "Don't panic."],
  );
  assert.deepEqual(
    transcript(
      "WEBVTT\n\nNOTE a note\n\nSTYLE\n::cue { color: lime }\n\ncue-1\n00:00.000 --> 00:01.000 line:90%\nHello.\nAgain.",
    ),
    ["Hello. Again."],
  );
  const filled = fillStatus(await read("index.html"), root);
  assert.doesNotMatch(filled, /\{\{status\./);
  const record = JSON.parse(
    filled
      .match(/data-record="([^"]+)"/)[1]
      .replaceAll("&quot;", '"')
      .replaceAll("&#39;", "'")
      .replaceAll("&amp;", "&"),
  );
  assert.equal(record.backup.latestChecked, status.backup.latestChecked);
  assert.equal(record.containers.documented, status.containers.documented);
  assert.deepEqual(record.withheld, withheldList(status));
  assert.doesNotMatch(filled, /\{\{film\./);

  const fake = await mkdtemp(path.join(tmpdir(), "v44-status-"));
  await mkdir(path.join(fake, "public/evidence"), { recursive: true });
  await writeFile(
    path.join(fake, "public/status.json"),
    JSON.stringify({ ...status, containers: { ...status.containers, running: null } }),
  );
  assert.throws(() => statusTokens(fake), /containers\.running/);

  // Malformed figures stop the build: missing, negative, fractional, text, or more than the inventory allows.
  const broken = [
    { backup: { ...status.backup, snapshotsListed: undefined } },
    { containers: { ...status.containers, running: -1 } },
    { containers: { ...status.containers, running: status.containers.documented + 1 } },
    { virtualMachines: { ...status.virtualMachines, running: 1.5 } },
    { backup: { ...status.backup, latestVerified: "banana" } },
    { backup: { ...status.backup, latestVerified: status.backup.latestChecked + 1 } },
    { backup: { ...status.backup, latestChecked: status.backup.snapshotsListed + 1 } },
    { cluster: { ...status.cluster, hostsOnline: null } },
    { verified: "2026-02-30" },
    { withheldReasons: undefined },
    { withheldReasons: {} },
    { withheldReasons: { routingVerified: "" } },
  ];
  for (const change of broken) assert.throws(() => checkStatus({ ...status, ...change }), JSON.stringify(change));
  assert.equal(checkStatus(status), status);
});

test("the front door source keeps a strict policy and makes no network calls of its own", async () => {
  const html = await read("index.html");
  const csp = html.match(/Content-Security-Policy"\s+content="([^"]+)"/)[1];
  assert.match(csp, /script-src 'self';/);
  assert.match(csp, /style-src 'self';/);
  assert.doesNotMatch(csp, /unsafe|https:/);
  assert.doesNotMatch(html, /\sstyle="/, "no inline style attributes");
  for (const file of [
    "main.ts",
    "stations.ts",
    "plates.ts",
    "toast.ts",
    "sky.ts",
    "eve.ts",
    "bit.ts",
    "cinema.ts",
    "route.ts",
    "motion.ts",
    "layout.ts",
    "legacy.ts",
    "dom.ts",
    "events.ts",
    "nebula.ts",
  ])
    assert.doesNotMatch(await read(`src/v44/${file}`), /\bfetch\(|XMLHttpRequest|WebSocket|sendBeacon/, file);
});
