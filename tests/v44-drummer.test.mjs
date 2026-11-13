import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { routeExample } from "../src/odyssey/data.ts";
import { decodeRoute, encodeRoute, route, shareHref } from "../src/v44/route.ts";
import { POSTERS, columnFor, posterFor, projectPoster } from "../src/v44/layout.ts";
import { ageInWords } from "../src/v44/age.ts";
import { PIXELS_AT_MOST, affordsStep, beatFor, ceilingScale, startScale, stepped } from "../src/v44/sharpness.ts";
import { FRAGMENT_SHADER } from "../src/v44/shader.ts";
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

test("a shared route reads back as the input that wrote it, and ignores anything else", () => {
  for (const intent of ["draft", "research", "analyze"])
    for (const privateData of [false, true])
      for (const sources of [false, true]) {
        const input = { intent, privateData, sources };
        assert.deepEqual(decodeRoute(encodeRoute(input)), input, JSON.stringify(input));
      }
  assert.equal(encodeRoute({ intent: "research", privateData: true, sources: false }), "research.private");
  for (const junk of [null, "", "banana", "draft.banana", "private", "draft.private.private", "DRAFT", "draft."])
    assert.equal(decodeRoute(junk), null, String(junk));
  // The link is the page's own address with only the route added: an earlier query or hash does not ride along.
  assert.equal(
    shareHref({ intent: "analyze", privateData: false, sources: true }, "https://cashio.us/?gl=force#doug"),
    "https://cashio.us/?route=analyze.sources#helm",
  );
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

test("the record says how old it is in plain words, and says nothing it cannot know", () => {
  const noon = (y, m, d) => new Date(y, m - 1, d, 12);
  assert.equal(ageInWords("2026-11-06", noon(2026, 11, 6)), "today");
  assert.equal(ageInWords("2026-11-06", noon(2026, 11, 7)), "yesterday");
  assert.equal(ageInWords("2026-11-06", noon(2026, 11, 12)), "6 days ago");
  // Late on the visitor's own evening is still the same calendar day.
  assert.equal(ageInWords("2026-11-06", new Date(2026, 10, 6, 23, 59)), "today");
  assert.equal(ageInWords("2026-10-31", noon(2026, 11, 2)), "2 days ago", "across a month and a clock change");
  assert.equal(ageInWords("2026-11-06", noon(2026, 11, 5)), null, "a record dated ahead of the visitor's clock");
  for (const bad of ["", "Fri Nov 6, 2026", "2026-13-01", "2026-02-30", "2026-11-6"])
    assert.equal(ageInWords(bad, noon(2026, 11, 12)), null, bad);
});

test("the live gate climbs to the screen's own pixels on a GPU that can carry them, and no further", () => {
  // An ultrawide at 90 percent zoom: 3822 by 1600 CSS pixels over a 3440 by 1440 panel.
  const [w, h, dpr] = [3822, 1600, 0.9];
  const start = startScale(dpr, false, w * h);
  assert.ok(start * start * w * h <= 2.1e6 + 1, "every device starts inside the old backing store");
  const top = ceilingScale(dpr, false, w * h);
  assert.equal(Math.round(w * top), 3440);
  assert.equal(Math.round(h * top), 1440);
  // Cheap frames climb a step at a time and stop exactly at the ceiling.
  let scale = start;
  let steps = 0;
  while (scale < top && steps++ < 20) scale = stepped(scale, top, 1);
  assert.equal(scale, top);
  assert.ok(steps <= 4, `native in ${steps} steps`);
  // A frame near the budget earns nothing, and a learned limit holds the ceiling down.
  assert.equal(stepped(start, top, 4.5), start);
  assert.equal(affordsStep(3.7), true);
  assert.equal(affordsStep(3.8), false);
  assert.equal(ceilingScale(dpr, false, w * h, 0.7), 0.7);
  // A 4K screen at 150 percent is drawn pixel for pixel; a larger panel stops at the pixel ceiling.
  assert.equal(ceilingScale(1.5, false, 2560 * 1440), 1.5);
  const big = ceilingScale(2, false, 2560 * 1440);
  assert.ok(Math.abs(big * big * 2560 * 1440 - PIXELS_AT_MOST) < 1);
  // Phones keep a little in hand, as before.
  assert.equal(ceilingScale(3, true, 390 * 844), 1.6);
  assert.ok(Math.abs(startScale(3, true, 390 * 844) - 1.36) < 1e-9);
});

test("the gate is paced in the display's own beats, so no refresh rate reads as slow", () => {
  const near = (a, b) => assert.ok(Math.abs(a - b) < 0.01, `${a} is about ${b}`);
  // At the gate: sixty frames a second at most.
  near(beatFor(1000 / 60, 1000 / 60), 16.67);
  near(beatFor(1000 / 60, 1000 / 75), 13.33);
  near(beatFor(1000 / 60, 1000 / 120), 16.67);
  near(beatFor(1000 / 60, 1000 / 144), 20.83);
  near(beatFor(1000 / 60, 1000 / 240), 16.67);
  // Behind the reading: thirty.
  near(beatFor(1000 / 30, 1000 / 60), 33.33);
  near(beatFor(1000 / 30, 1000 / 144), 34.72);
  for (const hz of [50, 60, 75, 90, 100, 120, 144, 165, 240]) {
    const beat = beatFor(1000 / 60, 1000 / hz);
    assert.ok(beat >= 1000 / hz - 0.001 && beat <= 23, `${hz} Hz draws every ${beat.toFixed(1)} ms`);
  }
});

test("the gate is drawn as a hoop with depth, with every edge one pixel sharp", () => {
  // The deck, the far side's inner wall and the near side's outer wall are all in the shader.
  for (const part of ["float face =", "float innerWall =", "float outerWall =", "float depth ="])
    assert.ok(FRAGMENT_SHADER.includes(part), part);
  // Edges are measured in pixels of the backing store, not in fractions of the ring.
  assert.match(FRAGMENT_SHADER, /float px = [\d.]+ \/ \(uRes\.y \* scale\);/);
  // GLSL ES 1.00 leaves a falling smoothstep undefined, so the shader never writes one.
  assert.doesNotMatch(FRAGMENT_SHADER, /smoothstep\(\s*1\.0\s*,\s*0/);
});
