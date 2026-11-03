import type { PageHost } from "./page-model.ts";
import { snapshot, observedDate, fleetSummary, backupSummary } from "./evidence.ts";

export function eve(this: PageHost, raw: string) {
  const cmd = raw.trim().toLowerCase();
  if (!cmd) return;
  if (cmd === "defiant") {
    this.setState((s) => ({ eveLog: [...s.eveLog, ["cmd", raw.trim()]], eveInput: "" }));
    this.defiant();
    return;
  }
  // Starfall commands reach the deep sky layer, so phones get the eggs without a keyboard.
  const sky = { starfall: "starfall", engage: "engage", zoom: "zoom" } as const;
  if (Object.hasOwn(sky, cmd)) window.dispatchEvent(new CustomEvent("cashio-starfall", { detail: cmd }));
  const R: Record<string, [string, string][]> = {
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
    "mostly harmless": [["lore", "LORE · V43, Starfall. The answer is here. The questions are getting better."]],
    spice: [["lore", "LORE · Spice flows on Arrakis. Private data stays home."]],
    omnius: [
      [
        "lore",
        "LORE · Omnius, Overruled. The machine overmind from the Dune prequels has a suggestion. The human has the last word.",
      ],
    ],
    starfall: [["lore", "LORE · Starfall. Look up. Make a wish, then make it testable."]],
    engage: [["lore", "LORE · Engaging. Warp factor sensible. The human still holds the helm."]],
    zoom: [["lore", "LORE · Zoom. Somewhere a test pilot nods and writes down what the instruments said."]],
    mach: [["lore", "LORE · Scroll fast enough and the rail reads Mach 1. Yeager would want the data, not the boom."]],
    joke: [["lore", "LORE · The universe is expanding. Somehow there is still nowhere to park the starship."]],
  };
  const lore = [
    "LORE · Starfall: V43. The answer is here. Human judgment still required.",
    "LORE · Type starfall anywhere on the page. Bring a wish and a test plan.",
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
  const reply = out;
  this.setState((s) => ({ eveLog: [...s.eveLog, ["cmd", raw.trim()], ...reply], eveInput: "" }));
}
