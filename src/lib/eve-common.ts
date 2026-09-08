import { COST_EVIDENCE } from "./cost-evidence";

/** Browser-local replies shared by the current evidence console and historical command deck. */
export interface EveReply {
  out: string[];
  bad?: boolean;
  photo?: boolean;
  alert?: boolean;
  contact?: boolean;
}

export const WITHHELD = [
  "Current AI operating cost per day and month (historical sample: type cost)",
  "Automation job counts",
  "DNS query sample figures",
  "Backup verification figures",
  "Security update counts",
];

/** Deep cuts. Nothing here is listed in help, nothing here changes state, and
 * nothing here leaves the browser. The surface of the site stays professional;
 * anyone who goes looking in the console finds the shelf the work was built on. */
const LORE: Record<string, string[]> = {
  "butlerian jihad": [
    "FIRST LAW OF THE HOUSE",
    "THOU SHALT NOT MAKE A MACHINE IN THE LIKENESS OF A HUMAN MIND.",
    "SO THE MACHINES HERE ARE NOT MINDS. THEY ARE INSTRUMENTS, THEY ARE DATED,",
    "AND EVERY ONE OF THEM ANSWERS TO A NAMED HUMAN.",
  ],
  ix: [
    "HOUSE IX · MACHINE CULTURE UNDER LICENCE",
    "BUILD THE INSTRUMENT. DOCUMENT THE INSTRUMENT. KEEP THE OPERATOR IN THE LOOP.",
    "THE INTERFACE YOU ARE READING IS THE IXIAN HALF OF THAT BARGAIN.",
  ],
  omnius: ["NO SOVEREIGN MACHINE INTELLIGENCE IS RESIDENT ON THIS FLEET.", "THAT IS THE WHOLE POINT."],
  "master control": ["END OF LINE."],
  mcp: ["END OF LINE."],
  tron: ["I FIGHT FOR THE USER.", "SO DOES EVERY ROUTE ON THIS PAGE."],
  flynn: ["THE ONLY WAY TO WIN IS NOT TO PLAY.", "SO WE PUBLISH THE EVIDENCE INSTEAD."],
  bit: ["YES.", "NO.", "BIT IS IN THE CORNER. BIT ONLY EVER HAD TWO ANSWERS."],
  beltalowda: ["OYE, BELTALOWDA.", "THE SHIP IS OWNED. THE AIR IS PAID FOR. THE WORK IS OURS."],
  epstein: ["THE EPSTEIN DRIVE BURNS FOR AS LONG AS YOU CAN STAND THE THRUST.", "SO DOES A GOOD BUILD."],
  "tea earl grey hot": ["REPLICATOR OFFLINE. THIS DECK IS READ ONLY.", "BRING YOUR OWN."],
  engage: ["MAKE IT SO.", "COURSE LAID IN. THE DECKS ARE YOURS."],
  "make it so": ["AYE, CAPTAIN.", "THAT PHRASE MEANS EXECUTE HERE TOO, NOT PROPOSE."],
  "the line must be drawn here": ["THIS FAR. NO FURTHER.", "THE EVIDENCE BOUNDARY IS THE LINE."],
  yeager: ["THE X-1 DID NOT BREAK THE SOUND BARRIER BY GUESSING WHERE IT WAS.", "IT MEASURED, THEN IT WENT."],
  "kelly johnson": [
    "KEEP IT SIMPLE, STUPID. BE QUICK, BE QUIET, BE ON TIME.",
    "FOURTEEN RULES BUILT THE BLACKBIRD. THIS FLEET RUNS ON FEWER.",
  ],
  rutan: ["IF IT LOOKS WRONG AND IT FLIES RIGHT, IT IS RIGHT.", "PROTEUS IS ON DECK 05."],
  hoover: ["THE SMOOTHEST HANDS IN AVIATION SHUT THE ENGINES OFF AND LANDED ANYWAY.", "PLAN FOR THE DEAD STICK."],
  skunkworks: ["BE QUICK, BE QUIET, BE ON TIME.", "ONE OPERATOR, SHORT CHAIN, NO COMMITTEE."],
  xyzzy: ["NOTHING HAPPENS.", "A HOLLOW VOICE SAYS: TYPE HELP."],
  sudo: ["THERE IS NO PRIVILEGE TO ESCALATE. THIS CONSOLE READS A STATIC FILE.", "NICE TRY THOUGH."],
  "42": ["THE ANSWER IS DATED 28 AUGUST 2026 AND EXPIRES 27 SEPTEMBER 2026.", "THE QUESTION IS ON DECK 03."],
};

export function runCommonEve(command: string, history: string[] = []): EveReply | null {
  if (command === "cost") {
    return {
      out: [
        `HISTORICAL PROVIDER USAGE · $${COST_EVIDENCE.usdPerDay.toFixed(2)}/DAY`,
        `SAMPLE · ${COST_EVIDENCE.sampleLabel.toUpperCase()} · PUBLISHED 26 JULY IN V31`,
        `EXCLUDES · ${COST_EVIDENCE.excludes.toUpperCase()}`,
        "CURRENT SPEND AND SAVINGS COMPARISON REMAIN UNVERIFIED",
      ],
    };
  }

  if (command === "withheld") {
    return { out: ["WITHHELD FROM THE PUBLIC EXPORT", ...WITHHELD.map((item) => `· ${item.toUpperCase()}`)] };
  }

  if (command === "whoami") {
    return {
      out: [
        "DOUG CASHIO · PENSACOLA",
        "PRINCIPAL SOLUTIONS CONSULTANT AND INDEPENDENT SYSTEMS BUILDER",
        "OWNER · OPERATOR · HUMAN ACCOUNTABLE",
      ],
    };
  }

  if (command === "talk" || command === "contact") {
    return { out: ["CHANNEL LOCK · OPEN", "DOUG@CASHIO.US"], contact: true };
  }

  if (command === "photo") {
    return { out: ["CINEMA VIEW · PRESS ESC OR EXIT CINEMA"], photo: true };
  }

  if (command === "history") {
    return {
      out: history.length
        ? history.map((item, index) => `${String(index + 1).padStart(2, "0")} · ${item}`)
        : ["NO COMMAND HISTORY"],
    };
  }

  if (command === "red alert") {
    return { out: ["RED ALERT · LOCAL CINEMA ONLY · NO SYSTEM ACTION"], alert: true };
  }

  const lore = Object.prototype.hasOwnProperty.call(LORE, command) ? LORE[command] : null;
  if (lore) return { out: lore };

  return null;
}
