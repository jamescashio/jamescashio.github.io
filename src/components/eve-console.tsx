import { useEffect, useRef, type FormEvent } from "react";
import {
  BOOT,
  DECKS,
  EXPIRES_SHORT,
  PVE,
  RELEASE,
  SERVICE_FAMILIES,
  VERIFIED_LONG,
  WITHHELD,
  daysLeft,
  exportState,
} from "@/lib/content";

export const INTRO = BOOT;

export interface EveResult {
  out: string[];
  bad?: boolean;
  go?: number;
  photo?: boolean;
  alert?: boolean;
}

const COMMANDS = [
  "help",
  "status / sitrep",
  "current",
  "fleet",
  "lanes",
  "cost / withheld",
  "verify",
  "whoami",
  "talk",
  "photo",
  "history",
  "clear",
];

function currentLines(): string[] {
  const left = daysLeft();
  if (exportState() === "VALID") {
    return [
      `EXPORT VALID · ${left} DAY${left === 1 ? "" : "S"} LEFT`,
      `VERIFIED ${VERIFIED_LONG} · VALID THROUGH ${EXPIRES_SHORT}`,
      "READ-ONLY · DATED EXPORT · NOT LIVE TELEMETRY",
    ];
  }
  return [
    `EXPORT EXPIRED · VALIDITY ENDED ${EXPIRES_SHORT}`,
    `LAST VERIFIED ${VERIFIED_LONG}`,
    "TREAT EVERY FIGURE AS HISTORY UNTIL A NEW OWNER-VERIFIED EXPORT IS PUBLISHED",
  ];
}

export function runEve(raw: string, history: string[] = []): EveResult {
  const command = raw.trim().toLowerCase().replace(/\s+/g, " ");

  if (command === "help" || command === "?") {
    return {
      out: ["AVAILABLE COMMANDS", ...COMMANDS.map((item) => `· ${item}`), "LOCAL ONLY · NO NETWORK CALLS"],
    };
  }

  if (command === "status" || command === "sitrep") {
    return {
      out: [
        ...currentLines(),
        "18/19 AT 28 AUG PROBE · ZEUS 12/13 · APOLLO 6/6",
        "2 PROXMOX HOSTS ONLINE · CLUSTER QUORATE",
        "ROUTING INVENTORY 21 AUGUST 2026 · 10 PUBLIC LANES · 36 PRIVATE CATALOG ENTRIES",
      ],
    };
  }

  if (command === "current") return { out: currentLines() };

  if (command === "fleet") {
    return {
      out: [
        "ZEUS · 12/13 AT 28 AUG PROBE · PROXMOX HOST",
        "APOLLO · 6/6 AT 28 AUG PROBE · PROXMOX HOST",
        SERVICE_FAMILIES.toUpperCase(),
      ],
    };
  }

  if (command === "lanes" || command === "routes") {
    return {
      out: [
        "ROUTING INVENTORY 21 AUGUST 2026 · 10 PUBLIC LANES · 36 PRIVATE CATALOG ENTRIES",
        "DEEPSEEK V4 FLASH · DEEPSEEK V4 PRO",
        "QUALITY PICKS THE MODEL · COST ONLY BREAKS A TIE",
      ],
      go: 2,
    };
  }

  if (command === "cost") {
    return {
      out: [
        "WITHHELD · NO FRESH PUBLIC COST MEASUREMENT",
        "A FIGURE WITH NO FRESH MEASUREMENT IS OMITTED, NEVER PUBLISHED STALE",
      ],
    };
  }

  if (command === "withheld") {
    return { out: ["WITHHELD FROM THE PUBLIC EXPORT", ...WITHHELD.map((item) => `· ${item.toUpperCase()}`)] };
  }

  if (command === "verify") {
    return {
      out: [
        `${RELEASE} · VERIFIED ${VERIFIED_LONG}`,
        `PROXMOX VE ${PVE} · 2 HOSTS ONLINE · QUORATE`,
        "OWNER-RUN READ-ONLY PROBE · PUBLIC-SAFE DATED EXPORT",
        ...currentLines(),
      ],
    };
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
    return { out: ["CHANNEL LOCK · OPEN", "DOUG@CASHIO.US"], go: 8 };
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

  const deck = DECKS.findIndex(
    (item) => command === item.id || command === item.name.toLowerCase() || command === `deck ${item.num}`,
  );
  if (deck >= 0) return { out: [`NAVIGATING · ${DECKS[deck].name}`], go: deck };

  if (command === "red alert") {
    return { out: ["RED ALERT · LOCAL CINEMA ONLY · NO SYSTEM ACTION"], alert: true };
  }

  return { out: [`UNKNOWN COMMAND · ${command.toUpperCase()}`, "TYPE HELP FOR THE LOCAL COMMAND LIST"], bad: true };
}

export function EveConsole({
  lines,
  value,
  onChange,
  onRun,
}: {
  lines: string[];
  value: string;
  onChange: (value: string) => void;
  onRun: (value: string) => void;
}) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [lines]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onRun(value);
  };

  return (
    <div className="za-panel relative overflow-hidden" data-eve-console>
      <div className="za-boot-scan" aria-hidden />
      <div className="relative flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <span className="za-critical-telemetry za-mono tracking-[0.18em] text-cyan" data-eve-safety-boundary>
          E.V.E. CONSOLE · SAFE MODE
        </span>
        <span className="za-critical-telemetry za-mono tracking-[0.16em] text-green" data-eve-safety-boundary>
          NO EGRESS
        </span>
      </div>
      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-label="E.V.E. command output"
        className="relative h-[min(42vh,360px)] min-h-64 overflow-y-auto px-4 py-4 za-mono text-[11px] leading-6 text-muted"
      >
        {lines.map((line, index) => (
          <div
            key={`${index}-${line}`}
            className={`za-bootline whitespace-pre-wrap break-words ${line.startsWith("$ ") ? "text-accent" : ""}`}
            style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
          >
            {line}
          </div>
        ))}
      </div>
      <form className="relative flex items-center gap-2 border-t border-line bg-void/75 px-4 py-1.5" onSubmit={submit}>
        <label htmlFor="eve-command" className="sr-only">
          E.V.E. command
        </label>
        <span className="za-mono text-[12px] text-cyan" aria-hidden>
          doug@zeus:~$
        </span>
        <input
          id="eve-command"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          className="min-h-11 min-w-[44px] flex-1 bg-transparent za-mono text-[12px] text-ink placeholder:text-dim"
          placeholder="type help"
          suppressHydrationWarning
        />
        <button type="submit" className="za-chip min-h-11 min-w-11 hover:border-cyan hover:text-cyan">
          RUN
        </button>
      </form>
    </div>
  );
}
