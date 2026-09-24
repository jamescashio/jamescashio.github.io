import { FLEET } from "./fleet.js";
import { $ } from "./dom.js";

/**
 * E.V.E., the Evaluation Verification Engine. Listed commands answer only from the dated export.
 * Unlisted commands are lore: labelled as such, never mixed with evidence, and never a system claim.
 */
export const EVIDENCE = {
  help: [
    "Commands: fleet · hosts · kernel · backups · atlas · dsh · hermes · routes · archive · cost · clear · help",
    `Every reply is a dated fact from the published export. No live telemetry. Page revised ${FLEET.pageRevised}.`,
    "Some commands are not listed. Pilots find them.",
  ],
  fleet: [
    `observation: ${FLEET.observedLong} at ${FLEET.observedCentral} (${FLEET.observedUtc})`,
    `hosts at the observation: ${FLEET.hosts} responded, ${FLEET.quorate ? "quorate" : "quorum not observed"}`,
    `lxc_running: ${FLEET.lxc} (zeus ${FLEET.zeus}, apollo ${FLEET.apollo}) · qemu_running: ${FLEET.qemu}`,
    `method: ${FLEET.method} · run by the owner`,
  ],
  kernel: [
    "withheld: exact kernel and package versions stay out of the public record",
    "a public security record shows what was observed, never a map for an attacker",
  ],
  backups: [
    `freshness: ${FLEET.backups.guestsOk} of ${FLEET.backups.guestsTotal} guests ok on ${FLEET.backups.freshnessLong}`,
    `restore_tested: ${FLEET.backups.restoreTested} · freshness is a file age check, not a restore drill`,
  ],
  atlas: [
    `primary model: runs locally · active context ${FLEET.atlas.context}`,
    "inference host for recurring work · model name and private catalog withheld",
  ],
  dsh: [
    `DeepSeek Harness: ${FLEET.dsh.skills} skills · ${FLEET.dsh.providers} providers · operator console`,
    `operating brief dated ${FLEET.dsh.agentsDate} · coexists with HERMES`,
  ],
  hermes: [
    `scheduled jobs: ${FLEET.hermes.jobs} enabled of ${FLEET.hermes.records} records · budget period ${FLEET.hermes.budgetPeriod}`,
    "verified route count: withheld as unknown",
  ],
  routes: [
    "routingVerified: null",
    "lanes.public: null · lanes.privateCatalog: null",
    "withheld: no authoritative live end to end route verification was established",
    "the HERMES study on this page is a model that runs in your browser, not this record",
  ],
  archive: [
    `${FLEET.prior.release} · fleet observed ${FLEET.prior.fleetLong} · ${FLEET.prior.method} · lxc ${FLEET.prior.lxc} (zeus ${FLEET.prior.zeus}, apollo ${FLEET.prior.apollo}) · qemu ${FLEET.prior.qemu}`,
    `${FLEET.archive.release} · fleet observed ${FLEET.archive.fleetLong} · routing observed ${FLEET.archive.routingLong}`,
    `lxc_running: ${FLEET.archive.lxc} · qemu: ${FLEET.archive.qemu.toLowerCase()} · public lanes: ${FLEET.archive.lanes}`,
    `original expiry ${FLEET.archive.expiry}; that expiry does not extend the later observation`,
  ],
  cost: [
    `status: ${FLEET.cost.status} · no current spend measurement is published`,
    `the ${FLEET.cost.archivedRelease} sample from ${FLEET.cost.archivedSample} stays in its archived export`,
    "rule in force: quality picks the model, cost only breaks a tie",
  ],
  hosts: [
    `zeus: ${FLEET.zeus} LXC at observation · apollo: ${FLEET.apollo} LXC at observation · ${FLEET.qemu} QEMU VM in the cluster`,
    "quorum observed; quorum alone does not establish workload failover",
    "private service locations are withheld from the public record",
  ],
};

/** Unlisted replies. Each one is labelled lore so it can never be read as evidence. */
export const LORE = {
  butlerian: [
    "lore · In Dune, the Butlerian Jihad ended the age of thinking machines.",
    "lore · This workshop keeps the machines and keeps the human in command. That is the Human Reckoning.",
  ],
  ix: [
    "lore · The Ixians built machines at the edge of what was allowed.",
    "lore · House rule here: build the machine, never hand it the throne.",
  ],
  spice: ["lore · Spice flows. Private data stays home."],
  yeager: [
    "lore · October 14, 1947. Bell X-1, Mach 1.06, over the Mojave.",
    "lore · He flew the card and reported what the machine did. So does E.V.E.",
  ],
  johnson: [
    "lore · Kelly Johnson ran the Skunk Works on fourteen rules.",
    "lore · Rule one gave the program manager practically complete control. One accountable human.",
  ],
  rutan: [
    "lore · Burt Rutan, June 21, 2004. SpaceShipOne reached space on private money.",
    "lore · Small team, strange shapes, flight test proof.",
  ],
  hoover: [
    "lore · Bob Hoover flew chase for Yeager on October 14, 1947.",
    "lore · Energy management over raw power. A good lesson for AI budgets, too.",
  ],
  epstein: ["lore · The Expanse gave the Epstein drive. Local inference is this workshop's Epstein drive."],
  engage: ["lore · Order received. The human decided; the machine will do the work."],
  "make it so": ["lore · Order received. The human decided; the machine will do the work."],
  admiral: [
    `lore · Welcome back, Admiral. Fleet observed ${FLEET.observedLong}: ${FLEET.lxc} containers, ${FLEET.qemu} VM, ${FLEET.hosts} hosts.`,
    "lore · Command is yours. It always was.",
  ],
  bit: ["lore · Bit here. I point the way. You make the call."],
  eve: ["lore · Evaluation Verification Engine. I only say what the evidence says, and I say when it is old."],
  sudo: ["denied · A human is in command, and it is the one who built this. Try help."],
};

export function evidenceReply(input) {
  const cmd = String(input).trim().toLowerCase().replace(/\s+/g, " ");
  if (Object.hasOwn(EVIDENCE, cmd)) return EVIDENCE[cmd];
  if (Object.hasOwn(LORE, cmd)) return LORE[cmd];
  return [`unknown command: ${cmd}. Try help.`];
}

export function setupEvidenceConsole({ motion }) {
  const out = $("#eve-out");
  const intro = out.innerHTML;
  $("#eve-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const inp = $("#eve-in");
    const cmd = inp.value.trim().toLowerCase();
    if (!cmd) return;
    inp.value = "";
    if (cmd === "clear") {
      out.innerHTML = intro;
      return;
    }
    const add = (h, lore = false) => {
      const s = document.createElement("span");
      s.textContent = h;
      if (lore) s.className = "lore";
      out.appendChild(s);
    };
    add("↳ " + cmd);
    const lines = evidenceReply(cmd);
    const lore = Object.hasOwn(LORE, cmd.replace(/\s+/g, " "));
    lines.forEach((l, i) =>
      setTimeout(
        () => {
          add(l, lore);
          out.scrollTop = out.scrollHeight;
          if (i === lines.length - 1) {
            add(" ");
          }
        },
        motion() ? 140 * (i + 1) : 0,
      ),
    );
  });
}
