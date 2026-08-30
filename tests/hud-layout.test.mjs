import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const { eveConsoleLogHeight, shouldYieldAirframeHud } = await import("../src/lib/hud-layout.ts");

test("the mobile E.V.E. log yields a 20px safe margin above the fixed command rail", () => {
  for (const width of [320, 390]) {
    assert.equal(
      eveConsoleLogHeight({ width, height: 844 }),
      240,
      `${width}px must lift the 44px prompt clear of the rail that begins at y=784`,
    );
  }
});

test("the full HUD yields when it would cover marked controls", () => {
  assert.equal(
    shouldYieldAirframeHud({ width: 1440, height: 900 }, [{ left: 1110, top: 760, right: 1370, bottom: 885 }]),
    true,
  );
});

test("the full HUD yields before it reaches a marked control", () => {
  assert.equal(
    shouldYieldAirframeHud({ width: 1440, height: 900 }, [{ left: 980, top: 620, right: 1100, bottom: 690 }]),
    true,
    "the airframe must compress before its lower edge reaches the protected control",
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

test("the mobile Bit yields before narrow Snapshot actions enter its protected zone", () => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 320, height: 844 },
  ]) {
    assert.equal(
      shouldYieldAirframeHud(viewport, [{ left: 12, top: 580, right: 248, bottom: 640 }]),
      true,
      `${viewport.width}px Snapshot actions must remain outside Bit's protected zone`,
    );
  }
});

test("the 640–767px Bit HUD clears the persistent mobile deck rail", async () => {
  const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  const narrowBand = css.match(/@media \(min-width: 640px\) and \(max-width: 767px\) \{[\s\S]*?\n\}/)?.[0] ?? "";
  assert.match(narrowBand, /\.za-corner-hud\s*\{[^}]*bottom:\s*5rem;/);
});
