import { useEffect, useRef, useState, type FormEvent } from "react";
import { EXPIRES_AT } from "../lib/content";
import { runEve } from "../components/eve-console";
import { Arrow, Core } from "./effects";

export function EvidenceConsole({ onArt }: { onArt: () => void }) {
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [lines, setLines] = useState<string[]>([
    "E.V.E. / PUBLIC EVIDENCE ARCHIVE",
    "Fleet: 28 Aug 2026 · Routing: 21 Aug 2026",
    "Local commands. Dated facts. No connection to the estate.",
    "Type help to explore.",
  ]);
  const [destination, setDestination] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const log = useRef<HTMLDivElement>(null);
  const cursor = useRef(-1);
  useEffect(() => {
    const refresh = () => setExpired(Date.now() >= Date.parse(EXPIRES_AT));
    refresh();
    const timer = setInterval(refresh, 60_000);
    return () => clearInterval(timer);
  }, []);
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
      setLines(["Archive cleared. Type help to explore."]);
      return;
    }
    if (input.toLowerCase() === "bit") {
      setLines((current) =>
        [
          ...current,
          `> ${input}`,
          "YES. A HUMAN IS STILL IN COMMAND.",
          "I’m the faceted core in the orbital artwork. Try engage.",
        ].slice(-120),
      );
      return;
    }
    const result = runEve(input, history);
    setLines((current) => [...current, `> ${input}`, ...result.out].slice(-120));
    if (result.photo) onArt();
    if (result.go !== undefined)
      setDestination(
        ["#top", "#universe", "#universe", "#evidence", "#universe", "#lineage", "#work", "#evidence", "#contact"][
          result.go
        ],
      );
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
        <span>PUBLIC ARCHIVE / LOCAL</span>
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
        {["fleet", "routes", "whoami", "help"].map((text) => (
          <button key={text} onClick={() => execute(text)}>
            {text}
            <span aria-hidden="true">↵</span>
          </button>
        ))}
      </div>
      {destination && (
        <a className="o-terminal-link" href={destination}>
          Explore the corresponding section
          <Arrow />
        </a>
      )}
      <p className="o-terminal-foot">
        {expired
          ? "Export expired. Historical figures require a fresh owner-verified export."
          : "Dated export · validity ends 27 Sep 2026 · not live telemetry"}
      </p>
    </div>
  );
}
