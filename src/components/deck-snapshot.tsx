import type { RefObject } from "react";
import { EXPIRES_SHORT, PVE, VERIFIED_LONG } from "@/lib/content";
import { getSound } from "@/lib/sound";
import { useDeck } from "@/lib/store";
import { BitBriefing } from "./bit-briefing";
import { FlightMap } from "./flight-map";
import { Kicker, Ticker, type SecRef } from "./deck-primitives";

export const IDENTITY_LINE = "DOUG CASHIO · ENTERPRISE AI + SECURITY SYSTEMS · OWNER-OPERATOR";

export function DeckSnapshot({
  s0,
  copyCol,
  onEngage,
  onEve,
  onFlight,
  onStill,
  onNavigate,
}: {
  s0: SecRef;
  copyCol: RefObject<HTMLDivElement | null>;
  onEngage: () => void;
  onEve: () => void;
  onFlight?: () => void;
  onStill?: () => void;
  onNavigate?: (deck: number) => void;
}) {
  const mode = useDeck((state) => state.mode);
  const tour = useDeck((state) => state.tour);
  const set = useDeck((state) => state.set);
  return (
    <section
      ref={s0}
      data-deck={0}
      tabIndex={-1}
      aria-label="SNAPSHOT deck"
      className="za-mobile-rail-clearance za-snapshot relative min-h-[100dvh] px-5 pb-32 pt-24 md:px-10 lg:px-14"
    >
      <span id="deck=snapshot" aria-hidden="true" className="pointer-events-none absolute left-0 top-0" />
      <div ref={copyCol} className="za-bracket za-snapshot-column max-w-[38rem] p-2">
        <Kicker>ZEUSAPOLLO · SOVEREIGN AI UNDER HUMAN COMMAND</Kicker>
        <p className="za-snapshot-identity za-mono">{IDENTITY_LINE}</p>
        <h1 tabIndex={-1} className="za-display za-snapshot-headline">
          OWN THE IRON AND THE <span className="za-shimmer-text">ROUTE</span>.
        </h1>
        <p className="za-snapshot-lede">
          I run AI and security systems on servers I own, and I publish the evidence that they work.
        </p>
        <div data-hud-clear className="za-snapshot-actions">
          {mode === "technical" ? (
            <>
              <button
                type="button"
                className="za-btn za-flight-launch"
                onClick={onFlight ?? onEngage}
                aria-label={tour ? "Stop the guided flight" : "Take the 30-second flight"}
              >
                <span className="za-flight-number" aria-hidden>
                  {tour ? "Ⅱ" : "30"}
                  <small>SEC</small>
                </span>
                <span>
                  {tour ? "STOP THE FLIGHT" : "TAKE THE 30-SECOND FLIGHT"}
                  <small>See the system. Follow a decision. Inspect the proof.</small>
                </span>
                <span className="za-flight-arrow" aria-hidden>
                  ↗
                </span>
              </button>
              <div className="za-snapshot-secondary">
                <button type="button" className="za-btn-ghost" onClick={onEngage}>
                  EXPLORE THE DECKS<span aria-hidden>↓</span>
                </button>
                <button type="button" className="za-btn-ghost" onClick={onEve}>
                  OPEN E.V.E. CONSOLE<span aria-hidden>↗</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <button type="button" className="za-btn" onClick={onStill}>
                ARM THE STILL
              </button>
              <button type="button" className="za-btn-ghost" onClick={onEngage}>
                READ THE BRIEF
              </button>
            </>
          )}
        </div>
        <BitBriefing index={0} />
        <div data-hud-clear className="za-snapshot-modes">
          <span className="za-mode-caption za-mono">CHOOSE YOUR VIEW</span>
          <div className="za-mode-options">
            <button
              type="button"
              aria-pressed={mode === "technical"}
              onClick={() => {
                set({ mode: "technical", shown: [0] });
                getSound().prompt();
              }}
            >
              <b>TECHNICAL</b>
              <span>Explore the systems</span>
            </button>
            <button
              type="button"
              aria-pressed={mode === "executive"}
              onClick={() => {
                set({ mode: "executive", shown: [0, 8] });
                getSound().prompt();
              }}
            >
              <b>EXECUTIVE</b>
              <span>Read the business brief</span>
            </button>
          </div>
        </div>
        <p className="za-snapshot-copy">
          Owned hardware. Observable decisions. Published evidence. Every claim here is measured and dated.
        </p>
        <p className="za-critical-telemetry za-snapshot-measured za-mono">
          MEASURED 28 AUGUST 2026 · 18 OF 19 SERVICES UP · BOTH MACHINES HEALTHY
        </p>
        <div data-hud-clear className="za-chip za-critical-telemetry za-snapshot-status">
          <span className="za-lock-pip" />
          E.V.E. ONLINE · READ-ONLY · DATED EXPORT · VERIFIED {VERIFIED_LONG} · VALID THRU {EXPIRES_SHORT}
        </div>
        <div data-hud-clear className="za-snapshot-facts">
          {[
            ["ZEUS", "12/13", "AT 28 AUG PROBE"],
            ["APOLLO", "6/6", "AT 28 AUG PROBE"],
            ["FLEET", "18/19", "AT 28 AUG PROBE"],
            ["HOSTS", "2", "CLUSTER QUORATE"],
            ["PVE", PVE, "VERSION AT PROBE"],
          ].map(([name, value, detail]) => (
            <div key={name}>
              <span className="za-critical-telemetry za-fact-label za-mono">{name}</span>
              <strong className="za-critical-telemetry za-display">{value}</strong>
              <span className="sr-only"> · </span>
              <small className="za-critical-telemetry za-mono">{detail}</small>
            </div>
          ))}
        </div>
        <Ticker />
      </div>
      {mode === "technical" && <FlightMap onNavigate={onNavigate ?? onEngage} />}
    </section>
  );
}
