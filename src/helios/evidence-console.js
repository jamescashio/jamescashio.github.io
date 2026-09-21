import { FLEET } from "./fleet.js";
import { $ } from "./dom.js";

export function setupEvidenceConsole({ motion }) {
  const EVE = {
    help: [
      "Commands: fleet · hosts · kernel · backups · atlas · dsh · hermes · routes · archive · cost · help",
      `Every reply is a dated fact from the published export. No live telemetry. Page revised ${FLEET.pageRevised}.`,
    ],
    fleet: [
      `observation: ${FLEET.observedLong} at ${FLEET.observedCentral} (${FLEET.observedUtc})`,
      `hosts at the observation: ${FLEET.hosts} responded, ${FLEET.quorate ? "quorate with an Athena QDevice" : "quorum not observed"} · pve-manager ${FLEET.pve}`,
      `lxc_running: ${FLEET.lxc} (zeus ${FLEET.zeus}, apollo ${FLEET.apollo}) · qemu_running: ${FLEET.qemu}`,
      `method: ${FLEET.method} · owner-run`,
    ],
    kernel: [
      `booted: ${FLEET.kernel.booted} on both hosts`,
      `staged: ${FLEET.kernel.staged} on both hosts, reboot pending`,
    ],
    backups: [
      `freshness: ${FLEET.backups.guestsOk} of ${FLEET.backups.guestsTotal} guests ok on ${FLEET.backups.freshnessLong}`,
      `restore_tested: ${FLEET.backups.restoreTested} · freshness is a file age check, not a restore drill`,
    ],
    atlas: [
      `primary model: ${FLEET.atlas.tag} · active context ${FLEET.atlas.context}`,
      "inference host for recurring work · private catalog withheld",
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
      "the HERMES study on this page is a browser-only model, not this record",
    ],
    archive: [
      `${FLEET.prior.release} · fleet observed ${FLEET.prior.fleetLong} · ${FLEET.prior.method} · lxc ${FLEET.prior.lxc} (zeus ${FLEET.prior.zeus}, apollo ${FLEET.prior.apollo}) · qemu ${FLEET.prior.qemu} · pve ${FLEET.prior.pve}`,
      `${FLEET.archive.release} · fleet observed ${FLEET.archive.fleetLong} · routing observed ${FLEET.archive.routingLong}`,
      `lxc_running: ${FLEET.archive.lxc} · qemu: ${FLEET.archive.qemu.toLowerCase()} · public lanes: ${FLEET.archive.lanes}`,
      `original expiry ${FLEET.archive.expiry}; that expiry does not extend the later observation`,
    ],
    cost: [
      "V31 export · sample July 21 to 22, 2026 · observed AI provider usage 26¢ per day",
      "scope: ai provider usage in the dated sample",
      "excludes: owned infrastructure, electricity, and Doug’s time",
      "not an audited bill · does not establish today’s spend or a percentage saving",
    ],
    hosts: [
      `zeus: ${FLEET.zeus} LXC at observation · apollo: ${FLEET.apollo} LXC at observation · ${FLEET.qemu} QEMU VM in the cluster`,
      "quorum observed; quorum alone does not establish workload failover",
      "private service locations are withheld from the public record",
    ],
  };
  $("#eve-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const inp = $("#eve-in");
    const cmd = inp.value.trim().toLowerCase();
    if (!cmd) return;
    const out = $("#eve-out");
    const add = (h) => {
      const s = document.createElement("span");
      s.textContent = h;
      out.appendChild(s);
    };
    add("↳ " + cmd);
    const lines = (Object.hasOwn(EVE, cmd) ? EVE[cmd] : null) || [`unknown command: ${cmd}. Try help.`];
    lines.forEach((l, i) =>
      setTimeout(
        () => {
          add(l);
          out.scrollTop = out.scrollHeight;
          if (i === lines.length - 1) {
            add(" ");
          }
        },
        motion() ? 140 * (i + 1) : 0,
      ),
    );
    inp.value = "";
  });
}
