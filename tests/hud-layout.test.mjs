import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const { shouldYieldAirframeHud } = await import("../src/lib/hud-layout.ts");

test("the full HUD yields when it would cover marked controls", () => {
  assert.equal(
    shouldYieldAirframeHud({ width: 1440, height: 900 }, [{ left: 1110, top: 760, right: 1370, bottom: 885 }]),
    true,
  );
});

test("the HUD stays full when critical content is clear", () => {
  assert.equal(
    shouldYieldAirframeHud({ width: 1440, height: 900 }, [{ left: 420, top: 720, right: 900, bottom: 885 }]),
    false,
  );
});

test("the mobile Bit HUD yields when it would cover marked content", () => {
  assert.equal(
    shouldYieldAirframeHud({ width: 390, height: 844 }, [{ left: 230, top: 650, right: 386, bottom: 780 }]),
    true,
  );
  assert.equal(
    shouldYieldAirframeHud({ width: 390, height: 844 }, [{ left: 20, top: 300, right: 220, bottom: 520 }]),
    false,
  );
});

test("the 640–767px Bit HUD clears the persistent mobile deck rail", async () => {
  const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  const narrowBand = css.match(/@media \(min-width: 640px\) and \(max-width: 767px\) \{[\s\S]*?\n\}/)?.[0] ?? "";
  assert.match(narrowBand, /\.za-corner-hud\s*\{[^}]*bottom:\s*5rem;/);
});
