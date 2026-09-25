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
      value: "01",
      unit: "operator console",
      summary: "The console where I sit.",
      body: "A locally installed agent runtime, placed beside HERMES rather than replacing it yet. It is the console I run read only checks from. Its provider and skill counts stay private.",
      evidence: "Local metadata probe · last audit",
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
        " scheduled jobs were enabled at the last audit. Routing itself has not been verified end to end yet.",
      evidence: "Last audit · routing not verified",
    },
    zeus: {
      name: "Zeus",
      role: "Owned compute",
      value: "1",
      unit: "of two servers I own",
      summary: "Physical ownership. Visible evidence.",
      body:
        "The first of two servers in my house. Together they ran " +
        FLEET.lxc +
        " containers at this dated observation; the split between them stays private. Guest runtime does not establish application availability or failover readiness.",
      evidence: "Fleet observation · " + FLEET.observedLong,
    },
    apollo: {
      name: "Apollo",
      role: "Owned compute",
      value: "2",
      unit: "of two servers I own",
      summary: "A second host in the same estate.",
      body: "The second server in the same cluster. The cluster was quorate at the dated observation; quorum alone does not establish workload failover. Private service locations are withheld.",
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
