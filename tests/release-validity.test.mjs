import assert from "node:assert/strict";
import test from "node:test";

import { EXPIRES_AT, daysLeft, exportState, validityShort } from "../src/lib/content.ts";

test("the V34 dated export remains valid through the end of 27 September in Chicago", () => {
  assert.equal(EXPIRES_AT, "2026-09-28T05:00:00Z");
  const finalMillisecond = Date.parse("2026-09-28T04:59:59.999Z");
  assert.equal(daysLeft(finalMillisecond), 1);
  assert.equal(exportState(finalMillisecond), "VALID");
  assert.equal(validityShort(finalMillisecond), "EXPORT VALID · 1D LEFT");
});

test("the V34 dated export expires exactly after the inclusive Chicago date boundary", () => {
  const boundary = Date.parse("2026-09-28T05:00:00.000Z");
  assert.equal(daysLeft(boundary), 0);
  assert.equal(exportState(boundary), "EXPIRED");
  assert.equal(validityShort(boundary), "EXPORT EXPIRED");
});
