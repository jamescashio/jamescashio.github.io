import { FLEET } from "./fleet.js";
import { gsap } from "gsap";
import { $, $$ } from "./dom.js";

export function setupAtlas({ scenes, motion, say }) {
  const NODES = {
    operator: {
      name: "The operator",
      role: "Authority",
      value: "Human",
      unit: "in command",
      summary: "A person owns the consequential decision.",
      body: "Policy defines what automation may do. Escalation preserves the evidence and returns decisions beyond that boundary to an accountable person.",
      evidence: "Published operating philosophy",
    },
    dsh: {
      name: "DSH",
      role: "Operator console",
      value: String(FLEET.dsh.skills),
      unit: "skills · " + FLEET.dsh.providers + " providers",
      summary: "The DeepSeek Harness is where I sit.",
      body:
        "A locally installed agent runtime with " +
        FLEET.dsh.skills +
        " skills and " +
        FLEET.dsh.providers +
        " configured providers, placed beside HERMES rather than replacing it yet. It collected the " +
        FLEET.observedLong +
        " record on this page through a read-only bridge. Its operating brief is dated " +
        FLEET.dsh.agentsDate +
        ".",
      evidence: "Local metadata probe · " + FLEET.observedLong,
    },
    hermes: {
      name: "HERMES",
      role: "Orchestration",
      value: String(FLEET.hermes.jobs),
      unit: "enabled scheduled jobs",
      summary: "Intent becomes a qualified route.",
      body:
        FLEET.hermes.jobs +
        " of " +
        FLEET.hermes.records +
        " scheduled jobs were enabled on the orchestration host at the " +
        FLEET.observedLong +
        " observation, budget period " +
        FLEET.hermes.budgetPeriod +
        ". No live end to end route verification was established, so routing stays unverified. The HERMES study lets you explore a browser-only routing model.",
      evidence: "Audit · " + FLEET.observedLong + " · routing withheld",
    },
    zeus: {
      name: "Zeus",
      role: "Owned compute",
      value: String(FLEET.zeus),
      unit: "LXC containers at observation",
      summary: "Physical ownership. Visible evidence.",
      body:
        FLEET.zeus +
        " LXC containers were running at this dated observation. Guest runtime does not establish application availability or failover readiness.",
      evidence: "Fleet observation · " + FLEET.observedLong,
    },
    apollo: {
      name: "Apollo",
      role: "Owned compute",
      value: String(FLEET.apollo),
      unit: "LXC containers at observation",
      summary: "A second host in the same estate.",
      body:
        FLEET.apollo +
        " LXC containers were running at this dated observation. The two-host cluster was quorate; quorum alone does not establish workload failover. Private service locations are withheld.",
      evidence: "Fleet observation · " + FLEET.observedLong,
    },
  };
  $$("[data-node]").forEach((b) =>
    b.addEventListener("click", () => {
      const n = NODES[b.dataset.node];
      scenes.selectAtlas(b.dataset.node);
      if (motion())
        gsap.fromTo(
          "#nd-name, #nd-value, #nd-summary, #nd-body",
          { y: 10, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: "expo.out", overwrite: true },
        );
      say(n.role.toUpperCase(), n.summary, "think", 1400);
      $$("[data-node]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      $("#nd-role").textContent = n.role;
      $("#nd-name").textContent = n.name;
      $("#atlas-inspect-link").textContent = `Inspect ${n.name}: role and evidence ↗`;
      $("#nd-value").textContent = n.value;
      $("#nd-unit").textContent = n.unit;
      $("#nd-summary").textContent = n.summary;
      $("#nd-body").textContent = n.body;
      $("#nd-evidence").textContent = n.evidence;
    }),
  );
}
