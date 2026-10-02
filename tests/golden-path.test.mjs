import test from "node:test";
import assert from "node:assert/strict";
import { briefRecords, briefText } from "../src/helios/decision-brief.js";
import { FLEET } from "../src/helios/fleet.js";
import { CLIPS, nextFilm } from "../src/odyssey/film-catalog.ts";
import { ZENITH_COLLECTIONS } from "../src/helios/zenith-films.ts";
import { FILM_DESTINATIONS } from "../src/helios/film-destinations.js";

test("a saved brief keeps the observation date, source and limited scope", () => {
  const text = briefText(FLEET, ["fleet", "authority"]);
  assert.match(text, /20 containers and 1 virtual machine/);
  assert.match(text, /September 26, 2026/);
  assert.match(text, /does not establish service health or recovery/);
  assert.match(text, /Source: Dated export/);
  assert.match(text, /https:\/\/cashio.us\/evidence\/status.json/);
  assert.match(text, /accountable person/);
  assert.doesNotMatch(text, /THE UNKNOWN|routing counts/);
  assert.doesNotMatch(text, /October 1, 2026/);
});
test("unknowns cannot become verified claims and empty input cannot produce a brief", () => {
  assert.equal(briefText(FLEET, []), null);
  assert.equal(briefText(FLEET, ["<script>unknown</script>"]), null);
  const text = briefText(FLEET, ["routing"]);
  assert.match(text, /remain unverified/);
  assert.match(text, /Not a live system check or permission to act/);
  assert.doesNotMatch(text, /THE OBSERVATION|containers|virtual machine/);
});
test("portable briefs ignore extra fields and duplicate records and preserve a readable order", () => {
  const records = briefRecords(FLEET, ["authority", "fleet", "fleet", "routing", "secret"]);
  assert.deepEqual(
    records.map((record) => record.title),
    ["The observation", "The unknown", "The boundary"],
  );
  assert.equal(briefRecords(FLEET, ["fleet"])[0].body, records[0].body);
});
test("featured cinema continues across the three curated moments without losing the rest", () => {
  const collections = [{ label: "Original", clips: CLIPS }, ...ZENITH_COLLECTIONS];
  assert.equal(nextFilm("zenith-starship-blue-hour", collections), "zenith-armillary-nocturne");
  assert.equal(nextFilm("zenith-armillary-nocturne", collections), "zenith-threshold");
  assert.equal(nextFilm("zenith-threshold", collections), "zenith-starship-blue-hour");
  assert.equal(nextFilm("zenith-starship-dockside", collections), "zenith-starship-flyby");
  assert.equal(nextFilm("no-such-film", collections), null);
  assert.equal(nextFilm("intro", [{ label: "Single", clips: { intro: CLIPS.intro } }]), null);
});
test("all twenty-one films have searchable titles and safe exact routes", () => {
  assert.equal(FILM_DESTINATIONS.length, 21);
  assert.equal(new Set(FILM_DESTINATIONS.map((film) => film[2])).size, 21);
  for (const [title, description, href] of FILM_DESTINATIONS) {
    assert.ok(title.length > 0 && description.includes("sound off"));
    assert.match(href, /^#film=[a-z-]+$/);
  }
  assert.equal(FILM_DESTINATIONS.find(([title]) => title === "Threshold")[2], "#film=zenith-threshold");
});
