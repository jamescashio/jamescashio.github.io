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
      body: "A locally installed agent runtime, placed beside HERMES rather than replacing it yet. I use it to run read only checks and review their results.",
      evidence: "Local metadata probe · last audit",
    },
    hermes: {
      name: "HERMES",
      role: "Job scheduler",
      value: String(FLEET.hermes.jobs),
      unit: "enabled scheduled jobs",
      summary: "The scheduler turns a task into a job.",
      body:
        FLEET.hermes.jobs +
        " of " +
        FLEET.hermes.records +
        " scheduled jobs were enabled at the " +
        FLEET.auditLong +
        " audit. The HERMES study explores the routing rule in your browser.",
      evidence: "Audit · " + FLEET.auditLong + " · routing not verified",
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
        " containers at this dated observation; the split between them stays private. The dated record below explains what was measured.",
      evidence: "Fleet observation · " + FLEET.observedLong,
    },
    apollo: {
      name: "Apollo",
      role: "Owned compute",
      value: "2",
      unit: "of two servers I own",
      summary: "The second server in the cluster.",
      body: "This server and Zeus agreed on cluster state at the dated observation. That does not establish whether workloads can fail over.",
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
      $("#atlas-inspect-link").textContent = `Inspect ${n.name}: role and evidence →`;
      $("#nd-value").textContent = n.value;
      $("#nd-unit").textContent = n.unit;
      $("#nd-summary").textContent = n.summary;
      $("#nd-body").textContent = n.body;
      $("#nd-evidence").textContent = n.evidence;
      // Announce the choice in one short line instead of the whole card.
      $("#nd-live").textContent = `${n.name} selected. ${n.summary}`;
    }),
  );
}
