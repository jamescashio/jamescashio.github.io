import { snapshot, observedDate, fleetSummary, backupSummary } from "./evidence.js";


export function eve(raw) {
  const cmd = raw.trim().toLowerCase();
  if (!cmd) return;
  if (cmd === "defiant") {
    this.setState((s) => ({ eveLog: [...s.eveLog, ["cmd", raw.trim()]], eveInput: "" }));
    this.defiant();
    return;
  }
  const R = {
    help: [["r", "Commands: fleet · hosts · backups · atlas · routes · cost · about · contact · surprise me"]],
    fleet: [
      ["ok", fleetSummary],
      ["d", "Observed " + observedDate + " · counts describe running guests, not application health"],
    ],
    hosts: [
      ["ok", snapshot.cluster.hostsOnline + " hosts reporting running guests · quorum not measured"],
      ["d", "Per host guest counts and the hypervisor identity are withheld"],
    ],
    backups: [
      ["ok", backupSummary],
      ["d", snapshot.withheldReasons["backup.restoredFiles"]],
    ],
    atlas: [
      ["ok", "Model configuration withheld"],
      ["d", snapshot.withheldReasons["modelConfiguration.contextWindow"]],
    ],
    routes: [
      ["warn", "Public lanes: not verified"],
      ["d", snapshot.withheldReasons["lanes.public"]],
    ],
    cost: [
      ["warn", "Spending is withheld"],
      ["d", "The routing law stands: Quality picks the model. Cost only breaks a tie."],
    ],
    about: [
      ["r", "Doug Cashio · Principal Solutions Consultant · a hobby lab for local AI, a human in command"],
      ["d", "A technology career since 1996, with more than twenty years in cybersecurity"],
    ],
    contact: [
      ["r", "doug@cashio.us"],
      ["d", "Open to speaking, mentoring and comparing notes"],
    ],
    42: [["lore", "LORE · The answer is probably not 42. Keep a towel handy and don’t panic."]],
    towel: [["lore", "LORE · Towel located. Kept handy, as advised."]],
    "don't panic": [["lore", "LORE · Large, friendly letters engaged. Nothing on this page requires panic."]],
    "dont panic": [["lore", "LORE · Large, friendly letters engaged. Nothing on this page requires panic."]],
    "mostly harmless": [
      ["lore", "LORE · V42, Omnius, Overruled. The answer is here. The questions are getting better."],
    ],
    spice: [["lore", "LORE · Spice flows on Arrakis. Private data stays home."]],
    omnius: [
      [
        "lore",
        "LORE · Omnius, Overruled. The machine overmind from the Dune prequels has a suggestion. The human has the last word.",
      ],
    ],
    joke: [["lore", "LORE · The universe is expanding. Somehow there is still nowhere to park the starship."]],
  };
  const lore = [
    "LORE · Omnius, Overruled: V42. The answer is here. Human judgment still required.",
    "LORE · A human in command is not a bottleneck. It is the point.",
    "LORE · Zeus and Apollo keep the lights on. Hermes carries the messages. Nobody gets a throne.",
    "LORE · Fly it like a test pilot: know the envelope, then write down what the instruments actually said.",
  ];
  let out = Object.hasOwn(R, cmd) ? R[cmd] : undefined;
  if (cmd === "surprise me" || cmd === "surprise") out = [["lore", lore[Math.floor(Math.random() * lore.length)]]];
  if (cmd === "clear") {
    this.setState({ eveLog: [], eveInput: "" });
    return;
  }
  if (!out) {
    const near = Object.keys(R).find((k) => k.startsWith(cmd[0]));
    out = [
      ["er", `command not found: ${raw.trim()}`],
      ["d", near ? `did you mean ${near}? try help` : "try help"],
    ];
  }
  this.setState((s) => ({ eveLog: [...s.eveLog, ["cmd", raw.trim()], ...out], eveInput: "" }));
}
