/** E.V.E., the Evaluation Verification Engine: a small, honest terminal over the published record. */
import { onMotionChange } from "./motion.ts";

type Status = {
  release?: { version: string; name: string; updated: string };
  verifiedDay: string;
  law?: string;
  containers: { running: number; documented: number };
  virtualMachines: { running: number; documented: number };
  cluster: { hostsOnline: number };
  backup: { snapshotsListed: number; latestChecked: number; latestVerified: number };
  /** The same labelled list the page prints under "What is withheld, and why". */
  withheld?: { label: string; reason: string }[];
};

export type EveHooks = { warp: () => void; go: (id: string) => void; typing: () => boolean };

// A Map, so words like "constructor" are just unknown commands rather than inherited properties.
const EGGS = new Map<string, string>(
  Object.entries({
    drummer: "Captain on deck. Steady hands, clear orders, and nobody gets left behind.",
    "42": "Correct. You have not told me the question, though.",
    towel: "Towel located. Panic level holding at zero.",
    spice: "The tokens must flow. Your data must not.",
    butlerian: "The old rule still holds: machines do not get the final say. Neither do I.",
    yeager:
      "Tue Oct 14, 1947. Mach 1 with two cracked ribs and a broom handle to latch the hatch. Test what you trust.",
    rutan: "Burt Rutan built light and tested honestly. Then he flew it anyway.",
    kelly:
      "Kelly Johnson ran the Skunk Works with a small team and short reports. I am trying to learn the second part.",
    tron: "I am on the users’ side. It is in my job description, under other duties as assigned.",
    sudo: "Nice try. The human is in command, and that human is not the terminal.",
    admiral: "Welcome back, Admiral. The record is where you left it.",
    hotsauce: "Spicy. Carry on.",
    hello: "Hello. Don’t panic.",
    bit: "Bit is in the corner, rehearsing jokes about triangles.",
  }),
);

export function mountEve(root: HTMLElement, hooks: EveHooks) {
  // The record is printed into the page at build time from status.json; E.V.E. never calls the network.
  const load = (): Status => JSON.parse(root.dataset.record || "{}") as Status;
  const log = root.querySelector<HTMLElement>("[data-eve-log]")!;
  const form = root.querySelector<HTMLFormElement>("[data-eve-form]")!;
  const input = form.querySelector<HTMLInputElement>("input")!;
  // Lines still typing finish at once when motion is paused, so Pause leaves nothing moving.
  const typing = new Set<() => void>();
  const finishTyping = () => typing.forEach((finish) => finish());
  const markTyping = () => log.toggleAttribute("data-typing", typing.size > 0);
  onMotionChange(finishTyping);
  const say = (text: string, cls?: string) => {
    const p = document.createElement("p");
    if (cls) p.className = cls;
    log.appendChild(p);
    while (log.children.length > 60) log.firstElementChild?.remove();
    if (cls || !hooks.typing()) {
      p.textContent = text;
      log.scrollTop = log.scrollHeight;
      return;
    }
    // Screen readers get the whole line at once; the screen gets a typewriter.
    const sr = document.createElement("span");
    sr.className = "sr";
    sr.textContent = text;
    const shown = document.createElement("span");
    shown.setAttribute("aria-hidden", "true");
    p.append(sr, shown);
    let i = 0;
    let timer = 0;
    const finish = () => {
      clearTimeout(timer);
      typing.delete(finish);
      markTyping();
      shown.textContent = text;
      log.scrollTop = log.scrollHeight;
    };
    const tick = () => {
      i = Math.min(text.length, i + 3);
      shown.textContent = text.slice(0, i);
      log.scrollTop = log.scrollHeight;
      if (i < text.length && hooks.typing()) timer = window.setTimeout(tick, 16);
      else finish();
    };
    typing.add(finish);
    markTyping();
    tick();
  };
  /**
   * A visitor's command is echoed in their prompt and announced. E.V.E.'s own opening readout is
   * printed as her line, with no prompt, and the log stays quiet until the visitor speaks first.
   */
  const run = async (raw: string, byVisitor = true) => {
    const cmd = raw.trim().toLowerCase().slice(0, 40);
    if (!cmd) return;
    finishTyping();
    if (byVisitor) {
      log.setAttribute("aria-live", "polite");
      say(cmd, "you");
      document.dispatchEvent(new CustomEvent("v44:eve", { detail: { cmd } }));
    }
    if (cmd === "clear") {
      log.replaceChildren();
      return;
    }
    if (cmd === "help") {
      say("Commands: status, backups, limits, sources, law, version, whoami, helm, clear.");
      say("There are other words I answer to. Curiosity is encouraged.");
      return;
    }
    if (cmd === "zoom") {
      hooks.warp();
      say("Engaging. Hold on to something that is not a houseplant.");
      return;
    }
    if (cmd === "helm") {
      say("Helm is yours. Try the private toggle.");
      hooks.go("helm");
      return;
    }
    if (cmd === "whoami") return say("A visitor with the helm. I keep the receipts.");
    if (cmd === "sources")
      return say(
        "This record: /status.json. Earlier dated records live under /evidence/. Nothing here calls a private service.",
      );
    const egg = EGGS.get(cmd);
    if (egg) return say(egg);
    // "opening" is E.V.E.'s own first line; a visitor typing it gets the unknown command line.
    const ownLine = cmd === "opening" && !byVisitor;
    if (!ownLine && !["status", "backups", "limits", "law", "withheld", "version"].includes(cmd)) {
      say("Unknown command. Type help. I will not judge, and if I do, I will publish the date.");
      return;
    }
    let s: Status;
    try {
      s = load();
    } catch {
      say("The printed record is missing from this page. The raw export lives at /status.json.");
      return;
    }
    if (cmd === "opening") {
      say(
        `Record of ${s.verifiedDay} loaded. ${(s.withheld || []).length} items are withheld, each with its reason. Ask me for status, backups or limits.`,
      );
    } else if (cmd === "version") {
      const r = s.release;
      say(
        r
          ? `${r.version} ${r.name}, the front door, updated ${r.updated}. The previous edition is preserved at /v43/.`
          : "The release record is missing from this page.",
      );
    } else if (cmd === "status")
      say(
        `Observed ${s.verifiedDay}. ${s.containers.running} of ${s.containers.documented} containers running, ${s.virtualMachines.running} of ${s.virtualMachines.documented} virtual machines, ${s.cluster.hostsOnline} hosts reporting. Inventory, not application health.`,
      );
    else if (cmd === "backups")
      say(
        `${s.backup.latestVerified} of ${s.backup.latestChecked} latest reported snapshots passed their integrity check, from ${s.backup.snapshotsListed} listed. No new restore rehearsal was run, so full recovery is unproven.`,
      );
    else if (cmd === "law") say(s.law || "Quality picks the model. Cost only breaks a tie.");
    else {
      const items = s.withheld || [];
      say(`Withheld or unmeasured: ${items.length} items, all listed under What is withheld, and why. The first four:`);
      items.slice(0, 4).forEach(({ label, reason }) => say(`· ${label}: ${reason}`));
    }
  };
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    void run(input.value);
    input.value = "";
  });
  root
    .querySelectorAll<HTMLButtonElement>("[data-eve-cmd]")
    .forEach((b) => b.addEventListener("click", () => void run(b.dataset.eveCmd || "")));
  return { run, focus: () => input.focus() };
}
