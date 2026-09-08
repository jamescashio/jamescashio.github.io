import { useEffect, useRef, useState, type FormEvent } from "react";
import { FLEET_EVIDENCE } from "./fleet-evidence";
import { runPublicEve, type EveDestination } from "./public-console";
import { Arrow, Core } from "./effects";

export function EvidenceConsole({ onArt }: { onArt: () => void }) {
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [lines, setLines] = useState<string[]>([
    "E.V.E. / PUBLIC EVIDENCE",
    `Fleet: ${FLEET_EVIDENCE.verifiedLong} · Routing: not verified`,
    "Local commands. Dated facts. No connection to the estate.",
    "Type help to explore.",
  ]);
  const [destination, setDestination] = useState<EveDestination | null>(null);
  const log = useRef<HTMLDivElement>(null);
  const cursor = useRef(-1);
  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [lines]);
  function execute(raw: string) {
    const input = raw.trim().slice(0, 160);
    if (!input) return;
    const next = [...history, input].slice(-40);
    setHistory(next);
    cursor.current = -1;
    setCommand("");
    setDestination(null);
    if (input.toLowerCase() === "clear") {
      setLines(["Console cleared. Type help to explore."]);
      return;
    }
    const result = runPublicEve(input, history);
    setLines((current) => [...current, `> ${input}`, ...result.out].slice(-120));
    if (result.photo) onArt();
    if (result.destination) setDestination(result.destination);
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    execute(command);
  }
  return (
    <div className="o-terminal">
      <div className="o-terminal-bar">
        <span>
          <Core />
          E.V.E.
        </span>
        <span>DATED EVIDENCE / LOCAL</span>
      </div>
      <div
        className="o-console-output"
        ref={log}
        role="log"
        aria-label="E.V.E. command responses"
        aria-live="polite"
        tabIndex={0}
      >
        {lines.map((line, i) => (
          <div key={`${i}-${line}`} className={line.startsWith(">") ? "command" : ""}>
            {line}
          </div>
        ))}
      </div>
      <form onSubmit={submit}>
        <label htmlFor="eve-command">
          <span aria-hidden="true">↳</span>
          <span className="o-sr-only">E.V.E. command</span>
        </label>
        <input
          id="eve-command"
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          maxLength={160}
          autoComplete="off"
          spellCheck={false}
          placeholder="Type a command…"
          onKeyDown={(event) => {
            if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
            event.preventDefault();
            if (event.key === "ArrowUp") cursor.current = Math.min(cursor.current + 1, history.length - 1);
            else cursor.current = Math.max(cursor.current - 1, -1);
            setCommand(cursor.current < 0 ? "" : history[history.length - 1 - cursor.current] || "");
          }}
        />
        <button aria-label="Run E.V.E. command" type="submit">
          <Arrow />
        </button>
      </form>
      <div className="o-command-shortcuts">
        {["fleet", "routes", "archive", "help"].map((text) => (
          <button key={text} onClick={() => execute(text)}>
            {text}
            <span aria-hidden="true">↵</span>
          </button>
        ))}
      </div>
      {destination && (
        <a className="o-terminal-link" href={destination.href}>
          {destination.label}
          <Arrow />
        </a>
      )}
      <p className="o-terminal-foot">
        Observation: {FLEET_EVIDENCE.verifiedLong}. No live telemetry or future health guarantee.
      </p>
    </div>
  );
}
