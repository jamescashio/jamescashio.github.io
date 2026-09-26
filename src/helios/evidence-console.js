import { FLEET } from "./fleet.js";
import { $ } from "./dom.js";

/**
 * E.V.E., the Evaluation Verification Engine. Listed commands answer only from the dated export.
 * Unlisted commands are lore: labelled as such, never mixed with evidence, and never a system claim.
 */
export const EVIDENCE = {
  help: [
    "Commands: fleet · hosts · kernel · backups · atlas · dsh · hermes · routes · archive · cost · clear · help",
    `Listed commands read the dated export. Easter egg replies are marked lore. Record revised ${FLEET.pageRevised}.`,
    "Keys: ↑ recalls a command · Tab completes one. Some commands are not listed. Pilots find them.",
  ],
  fleet: [
    `Observation: ${FLEET.observedLong}`,
    `Hosts at the observation: ${FLEET.hosts} responded, ${FLEET.quorate ? "and they agreed on cluster state" : "but cluster agreement was not confirmed"}`,
    `Running guests: ${FLEET.lxc} containers and ${FLEET.qemu} virtual machine · per host split withheld`,
    `Method: ${FLEET.method} · run by the owner`,
  ],
  kernel: [
    `Public record policy: ${FLEET.pageRevised}`,
    "Withheld: exact kernel and package versions stay out of the public record",
    "A public security record shows what was observed, never a map for an attacker",
  ],
  backups: [
    `Integrity: ${FLEET.backups.integrity} · checked ${FLEET.backups.checkedLong}`,
    "Coverage counts withheld · a restore drill is a separate test",
  ],
  atlas: [
    `Observation: ${FLEET.auditLong}`,
    `Local AI model · context window: ${FLEET.atlas.context.toLocaleString("en-US")} tokens`,
    "Tokens are pieces of text. This window holds the instructions, conversation and reply together.",
    "Inference host for recurring work · model name and private catalog withheld",
  ],
  dsh: [
    `Audit: ${FLEET.auditLong} · operating brief: ${FLEET.consoleBriefLong}`,
    "DSH: operator console · provider and skill counts withheld",
    "Coexists with HERMES",
  ],
  hermes: [
    `Observation: ${FLEET.auditLong}`,
    `Scheduled jobs: ${FLEET.hermes.jobs} enabled of ${FLEET.hermes.records} records · budget period ${FLEET.hermes.budgetPeriod}`,
    "Verified route count: withheld as unknown",
  ],
  routes: [
    `Observation: ${FLEET.auditLong}`,
    "Routing verification: not established at this observation.",
    "Route totals and the private catalog are not published.",
    "The raw export preserves these unknowns for inspection.",
    "The HERMES study on this page is a model that runs in your browser, not this record",
  ],
  archive: [
    `${FLEET.prior.release} · fleet observed ${FLEET.prior.fleetLong} · ${FLEET.prior.method} · ${FLEET.prior.lxc} containers · ${FLEET.prior.qemu} virtual machine`,
    `${FLEET.archive.release} · fleet observed ${FLEET.archive.fleetLong} · routing observed ${FLEET.archive.routingLong}`,
    `${FLEET.archive.release} counts: ${FLEET.archive.lxc} containers running · virtual machines ${FLEET.archive.qemu.toLowerCase()} · public lanes: ${FLEET.archive.lanes}`,
    `That record lists an expiry of ${FLEET.archive.expiry}. Newer observations replace it; its expiry does not extend them`,
  ],
  cost: [
    `Public record: ${FLEET.pageRevised}`,
    `Status: ${FLEET.cost.status} · no current spend measurement is published`,
    `The ${FLEET.cost.archivedRelease} sample from ${FLEET.cost.archivedSample} stays in its archived export`,
    "Rule in force: quality picks the model, cost only breaks a tie",
  ],
  hosts: [
    `Observation: ${FLEET.observedLong}`,
    `Zeus and Apollo: ${FLEET.hosts} hosts, one cluster · ${FLEET.lxc} containers and ${FLEET.qemu} VM between them`,
    "The two hosts agreed on cluster state. That does not prove applications would survive a host failure.",
    "Private service locations are withheld from the public record",
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
  expanse: ["lore · The Expanse gave us the Epstein drive. Local inference is this workshop's Epstein drive."],
  engage: ["lore · Order received. The human decided; the machine will do the work."],
  "make it so": ["lore · Order received. The human decided; the machine will do the work."],
  admiral: [
    `lore · Welcome back, Admiral. Fleet observed ${FLEET.observedLong}: ${FLEET.lxc} containers, ${FLEET.qemu} VM, ${FLEET.hosts} hosts.`,
    "lore · Command is yours. It always was.",
  ],
  bit: ["lore · Bit here. I point the way. You make the call."],
  eve: ["lore · Evaluation Verification Engine. I only say what the evidence says, and I say when it is old."],
  42: [
    "lore · The answer is 42. The question is still being computed, somewhere in Zeus.",
    "lore · Meanwhile the rule stands: quality picks the model, cost only breaks a tie.",
  ],
  towel: ["lore · Towel located. Human in command. Don't panic."],
  sudo: ["denied · A human is in command, and it is the one who built this. Try help."],
  cashio: ["lore · cAshIo. Look at the capitals."],
  whoami: ["lore · You: a guest with read only access. Doug: the human in command."],
  ls: ["lore · Everything public is already on this page. The rest stays home."],
  exit: ["lore · A static page has no exit. Close the tab, or say hello on the way out."],
  nmap: ["lore · Nothing to scan here but HTML. Private addresses stay out of the public record."],
  "rm -rf /": ["denied · Nothing here to delete. A human is in command."],
  hal: ["lore · This machine opens the doors when a person asks. That is the whole idea."],
  "open the pod bay doors": ["lore · This machine opens the doors when a person asks. That is the whole idea."],
  hello: ["lore · Hello, pilot. Type fleet for the dated record, or find Doug's email in the contact section below."],
};
/** Plain questions a visitor might type find the matching lore reply. */
const ASKS = {
  hi: "hello",
  hey: "hello",
  contact: "hello",
  who: "whoami",
  doug: "whoami",
  "who are you": "eve",
  "what is your name": "eve",
  "what's your name": "eve",
  "your name": "eve",
  "what is the meaning of life": "42",
};
/** The two server names answer with the dated host record. */
const ALIASES = { zeus: "hosts", apollo: "hosts" };

/** Commands ignore case, extra spaces and a closing question mark. */
const normalize = (input) =>
  String(input)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\s*[?!]+$/, "");
const loreKey = (cmd) => (Object.hasOwn(ASKS, cmd) ? ASKS[cmd] : cmd);

export function evidenceReply(input) {
  const cmd = normalize(input);
  if (Object.hasOwn(ALIASES, cmd)) return EVIDENCE[ALIASES[cmd]];
  if (Object.hasOwn(EVIDENCE, cmd)) return EVIDENCE[cmd];
  if (Object.hasOwn(LORE, loreKey(cmd))) return LORE[loreKey(cmd)];
  return [`unknown command: ${cmd}. Try help.`];
}

/** Hidden commands a visitor can stumble into; surprise me picks one and names it. */
const SURPRISES = ["yeager", "johnson", "rutan", "hoover", "butlerian", "ix", "spice", "expanse", "bit", "eve"];

export function setupEvidenceConsole({ motion }) {
  const out = $("#eve-out");
  const inp = $("#eve-in");
  const intro = out.innerHTML;
  const history = [];
  let cursor = 0;
  const known = [...Object.keys(EVIDENCE), "clear", "surprise me"];
  const add = (text, className = "") => {
    const line = document.createElement("span");
    line.textContent = text;
    if (className) line.className = className;
    out.appendChild(line);
  };
  const pendingReplies = new Set();
  // Surprises come from a shuffled deck, so every hidden command appears once before any repeats.
  let deck = [];
  function run(raw) {
    let cmd = normalize(raw);
    if (!cmd) return;
    history.push(cmd);
    cursor = history.length;
    if (cmd === "clear") {
      pendingReplies.forEach(clearTimeout);
      pendingReplies.clear();
      out.innerHTML = intro;
      return;
    }
    add("↳ " + cmd);
    let hint = "";
    if (cmd === "surprise me") {
      if (!deck.length) deck = [...SURPRISES].sort(() => Math.random() - 0.5);
      cmd = deck.pop();
      hint = `hidden command found: ${cmd} · ${SURPRISES.length - deck.length} of ${SURPRISES.length} surprises. There are more to find.`;
    }
    const lines = [...evidenceReply(cmd)];
    const reply = document.createElement("div");
    reply.className = "eve-reply";
    out.appendChild(reply);
    const lore = Object.hasOwn(LORE, loreKey(cmd)) && !Object.hasOwn(EVIDENCE, cmd);
    if (hint) lines.push(hint);
    lines.forEach((line, i) => {
      const timer = setTimeout(
        () => {
          pendingReplies.delete(timer);
          const item = document.createElement("span");
          item.textContent = line;
          if (lore) item.className = "lore";
          reply.appendChild(item);
          out.scrollTop = out.scrollHeight;
        },
        motion() ? 140 * (i + 1) : 0,
      );
      pendingReplies.add(timer);
    });
  }
  $("#eve-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const value = inp.value;
    inp.value = "";
    run(value);
  });
  document
    .querySelectorAll("[data-eve]")
    .forEach((chip) => chip.addEventListener("click", () => run(chip.dataset.eve)));
  inp.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" && history.length) {
      e.preventDefault();
      cursor = Math.max(0, cursor - 1);
      inp.value = history[cursor];
    } else if (e.key === "ArrowDown" && history.length) {
      e.preventDefault();
      cursor = Math.min(history.length, cursor + 1);
      inp.value = history[cursor] ?? "";
    } else if (e.key === "Tab" && inp.value.trim()) {
      const match = known.find((command) => command.startsWith(inp.value.trim().toLowerCase()));
      if (match) {
        e.preventDefault();
        inp.value = match;
      }
    }
  });
}
