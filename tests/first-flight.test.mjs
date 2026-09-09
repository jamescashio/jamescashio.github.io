import test from "node:test";
import assert from "node:assert/strict";
import {
  FIRST_FLIGHT,
  FLIGHT_DURATION_MS,
  flightStepIndex,
  missionHash,
  parseMissionHash,
} from "../src/odyssey/flight-plan.ts";
import { computeWorldOutcome } from "../src/odyssey/sovereign-model.ts";
import { missionRecord } from "../src/odyssey/mission-card.ts";
import { flightRecap } from "../src/odyssey/flight-recap-model.ts";

test("a flight recap compares the same workload before and after cloud loss", () => {
  const before = { architecture: "hybrid", sensitivity: "mixed", connected: true, allowPrivateEgress: false };
  const recap = flightRecap({ before, after: { ...before, connected: false } });
  assert.deepEqual([recap.before.local, recap.before.cloud, recap.before.held], [6, 6, 0]);
  assert.deepEqual([recap.after.local, recap.after.cloud, recap.after.held], [12, 0, 0]);
  assert.equal(recap.before.privateCount, recap.after.privateCount);
  assert.equal(recap.beforeLabel, "Cloud connected");
  assert.equal(recap.afterLabel, "Cloud disconnected");
  assert.equal(before.connected, true);
});

test("granting and withdrawing private-cloud permission produce opposite, honest recaps", () => {
  const before = { architecture: "cloud", sensitivity: "private", connected: true, allowPrivateEgress: false };
  const after = { ...before, allowPrivateEgress: true };
  const granted = flightRecap({ before, after }),
    withdrawn = flightRecap({ before: after, after: before });
  assert.equal(granted.before.held, 12);
  assert.equal(granted.after.cloud, 12);
  assert.equal(granted.beforeLabel, "Permission off");
  assert.equal(granted.afterLabel, "Permission on");
  assert.deepEqual(withdrawn.after, granted.before);
  assert.equal(withdrawn.afterLabel, "Permission off");
});

test("a disconnected cloud-only recap never invents local fallback or completed work", () => {
  const before = { architecture: "cloud", sensitivity: "public", connected: true, allowPrivateEgress: false };
  const recap = flightRecap({ before, after: { ...before, connected: false } });
  assert.equal(recap.before.cloud, 12);
  assert.deepEqual([recap.after.local, recap.after.cloud, recap.after.held], [0, 0, 12]);
  assert.match(recap.after.summary, /wait/);
});

test("saved flight records reproduce decisions, including offline and private-cloud boundaries", () => {
  const scenarios = [
    [{ architecture: "hybrid", sensitivity: "mixed", connected: false, allowPrivateEgress: false }, [12, 0, 0]],
    [{ architecture: "cloud", sensitivity: "private", connected: true, allowPrivateEgress: false }, [0, 0, 12]],
    [{ architecture: "cloud", sensitivity: "private", connected: true, allowPrivateEgress: true }, [0, 12, 0]],
    [{ architecture: "cloud", sensitivity: "private", connected: false, allowPrivateEgress: true }, [0, 0, 12]],
    [{ architecture: "hybrid", sensitivity: "mixed", connected: true, allowPrivateEgress: false }, [6, 6, 0]],
  ];
  for (const [input, counts] of scenarios) {
    const record = missionRecord(input);
    assert.deepEqual([record.outcome.local, record.outcome.cloud, record.outcome.held], counts);
    const link = new URL(record.url);
    assert.equal(link.origin, "https://cashio.us");
    assert.deepEqual(parseMissionHash(link.hash), input);
    assert.ok(record.filename.endsWith(".png"));
    assert.equal(record.connection.includes("OFFLINE"), !input.connected);
  }
});

test("saved cards distinguish missing connectivity from missing permission", () => {
  const input = { architecture: "cloud", sensitivity: "private", connected: true, allowPrivateEgress: false };
  const waitingForPermission = missionRecord(input);
  const waitingForConnection = missionRecord({ ...input, connected: false, allowPrivateEgress: true });
  assert.equal(waitingForPermission.outcome.held, waitingForConnection.outcome.held);
  assert.match(waitingForPermission.heldLabel, /PERMISSION/);
  assert.match(waitingForConnection.heldLabel, /CONNECTION/);
  assert.match(waitingForPermission.outcome.takeaway, /permission/);
  assert.match(waitingForConnection.outcome.takeaway, /lost connection/);
  assert.notEqual(waitingForPermission.title, waitingForConnection.title);
});

test("the thirty-second narrative agrees with the routing model at every chapter", () => {
  assert.equal(
    FIRST_FLIGHT.reduce((total, scene) => total + scene.durationMs, 0),
    FLIGHT_DURATION_MS,
  );
  assert.equal(FLIGHT_DURATION_MS, 30000);
  assert.ok(FIRST_FLIGHT.every((scene) => scene.durationMs >= 5000));
  assert.ok(FIRST_FLIGHT[2].durationMs > FIRST_FLIGHT[0].durationMs, "connection loss needs time to read and compare");
  assert.deepEqual(
    FIRST_FLIGHT.map((s) => {
      const o = computeWorldOutcome(s.input);
      return [o.local, o.cloud, o.held];
    }),
    [
      [6, 6, 0],
      [6, 6, 0],
      [12, 0, 0],
      [0, 0, 12],
    ],
  );
  assert.equal(new Set(FIRST_FLIGHT.map((s) => s.id)).size, 4);
  assert.equal(flightStepIndex("blackout"), 2);
  assert.equal(flightStepIndex("untrusted"), 0);
});
test("mission links reproduce every supported scenario and preserve its decision", () => {
  for (const architecture of ["sovereign", "hybrid", "cloud"])
    for (const sensitivity of ["mixed", "private", "public"])
      for (const connected of [true, false])
        for (const allowPrivateEgress of [true, false]) {
          const input = { architecture, sensitivity, connected, allowPrivateEgress };
          const decoded = parseMissionHash(missionHash(input));
          assert.deepEqual(decoded, input);
          assert.deepEqual(computeWorldOutcome(decoded), computeWorldOutcome(input));
        }
});
test("partial, ambiguous and extra mission parameters cannot change the model", () => {
  for (const hash of [
    "",
    "#mission=cloud",
    "#mission=cloud.private.connected",
    "#mission=cloud.private.connected.true",
    "#mission=cloud.private.connected.permitted&run=1",
    "#mission=unknown.private.connected.held",
    "#mission=cloud.private.connected.held\n",
    "#flight=board",
  ])
    assert.equal(parseMissionHash(hash), null, hash);
});
