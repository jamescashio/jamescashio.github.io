import assert from "node:assert/strict";
import test from "node:test";

import { EXPIRES_AT, daysLeft, exportState, nextValidityRefreshAt, validityShort } from "../src/lib/content.ts";

test("the V34 dated export remains valid through the end of 2 October in Chicago", () => {
  assert.equal(EXPIRES_AT, "2026-10-03T05:00:00Z");
  const finalMillisecond = Date.parse("2026-10-03T04:59:59.999Z");
  assert.equal(daysLeft(finalMillisecond), 1);
  assert.equal(exportState(finalMillisecond), "VALID");
  assert.equal(validityShort(finalMillisecond), "EXPORT VALID · 1D LEFT");
});

test("the V34 dated export expires exactly after the inclusive Chicago date boundary", () => {
  const boundary = Date.parse("2026-10-03T05:00:00.000Z");
  assert.equal(daysLeft(boundary), 0);
  assert.equal(exportState(boundary), "EXPIRED");
  assert.equal(validityShort(boundary), "EXPORT EXPIRED");
});

test("validity refreshes at each expiry-anchored local day and then at exact expiry", () => {
  const beforeDayBoundary = Date.parse("2026-10-02T04:59:59.000Z");
  const dayBoundary = Date.parse("2026-10-02T05:00:00.000Z");
  const expiry = Date.parse(EXPIRES_AT);

  assert.equal(nextValidityRefreshAt(beforeDayBoundary), dayBoundary);
  assert.equal(nextValidityRefreshAt(dayBoundary), expiry);
  assert.equal(nextValidityRefreshAt(expiry - 1), expiry);
  assert.equal(nextValidityRefreshAt(expiry), null);
});
