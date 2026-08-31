import { useEffect, useRef } from "react";
import { CRAFT, DECKS, DECK_SHORT, validityShort } from "@/lib/content";
import type { Mode } from "@/lib/store";
import { FlightControl } from "./flight-control";

type SharedChromeProps = {
  deck: number;
  hudClassName: string;
  mode: Mode;
};

export type DesktopCommandRailProps = SharedChromeProps & {
  audio: boolean;
  elapsedMs: number;
  onDeckHover: () => void;
  onNavigate: (deck: number) => void;
  onStopFlight: () => void;
  onToggleAudio: () => void;
  onToggleFlight: () => void;
  onToggleRail: () => void;
  railOpen: boolean;
  tour: boolean;
};

export function DesktopCommandRail({
  audio,
  deck,
  elapsedMs,
  hudClassName,
  mode,
  onDeckHover,
  onNavigate,
  onStopFlight,
  onToggleAudio,
  onToggleFlight,
  onToggleRail,
  railOpen,
  tour,
}: DesktopCommandRailProps) {
  return (
    <aside
      className={`za-command-rail fixed left-0 top-0 z-40 hidden h-dvh flex-col bg-void/90 backdrop-blur-md transition-[width] duration-300 md:flex ${hudClassName} ${
        railOpen ? "w-[220px]" : "w-[68px]"
      }`}
    >
      <button
        type="button"
        className="za-lcars-cap warm mx-0 mt-0 h-16 px-3 text-left text-[13px]"
        onClick={() => onNavigate(0)}
        aria-label={`${railOpen ? "ZEUSAPOLLO" : "ZA"} · Go to Snapshot deck`}
      >
        {railOpen ? "ZEUSAPOLLO" : "ZA"}
      </button>
      <nav aria-label="Command decks" className="mt-2 flex flex-1 flex-col gap-1 px-2">
        {DECKS.map((item, index) => {
          if (mode === "executive" && index !== 0 && index !== 8) return null;
          const selected = deck === index;
          return (
            <button
              key={item.id}
              type="button"
              aria-label={`${item.num} ${item.name} · Go to ${item.name} deck`}
              aria-current={selected ? "page" : undefined}
              onClick={() => onNavigate(index)}
              onMouseEnter={onDeckHover}
              className={`za-rail-deck relative flex min-h-11 items-center gap-3 rounded-r-[22px] px-3 py-2 text-left transition-colors ${
                selected ? "bg-accent text-on-accent" : "bg-white/5 text-dim hover:bg-cyan/15 hover:text-ink"
              }`}
            >
              <span className="za-mono w-5 text-[10px]">{item.num}</span>
              {railOpen && <span className="za-mono text-[10px] tracking-[0.16em]">{item.name}</span>}
              {!railOpen && (
                <span className="za-rail-preview" aria-hidden>
                  <b className="za-mono">{item.name}</b>
                  <i>{item.tag}</i>
                </span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="flex flex-col gap-1 p-2">
        <FlightControl
          active={tour}
          compact={!railOpen}
          elapsedMs={elapsedMs}
          onStart={onToggleFlight}
          onStop={onStopFlight}
          className={railOpen ? "w-[204px] rounded-r-[22px]" : "rounded-r-[22px]"}
        />
        <button
          type="button"
          className="za-btn-ghost rounded-r-[22px] px-2 py-2 text-[10px]"
          onClick={onToggleAudio}
          aria-label={audio ? "Mute selection audio · AUDIO" : "Arm selection audio · ARM AUDIO"}
          aria-pressed={audio}
        >
          {audio ? "◉" : "○"} {railOpen && (audio ? "AUDIO" : "ARM AUDIO")}
        </button>
        <button
          type="button"
          className="za-lcars-cap cool min-h-11 px-3 text-[11px]"
          onClick={onToggleRail}
          aria-label={railOpen ? "Stow command rail" : "Expand command rail"}
        >
          {railOpen ? "STOW" : "▸"}
        </button>
      </div>
    </aside>
  );
}

export type CommandHeaderProps = {
  audio: boolean;
  clock: string;
  craftIndex: number;
  /** The deck the scroller has settled on. This trails the pressed deck during
   * a long glide, so the chip never names a deck that is not on screen yet. */
  arrivedDeck: number;
  hudClassName: string;
  railOpen?: boolean;
  onNavigateCraft: (craft: number) => void;
  onOpenNavigator: (opener: HTMLElement) => void;
  onToggleAudio: () => void;
  tour: boolean;
};

export function CommandHeader({
  audio,
  clock,
  craftIndex,
  arrivedDeck,
  hudClassName,
  railOpen = false,
  onNavigateCraft,
  onOpenNavigator,
  onToggleAudio,
  tour,
}: CommandHeaderProps) {
  return (
    <header
      className={`za-command-header pointer-events-none fixed left-0 right-0 top-0 z-50 flex items-center justify-between gap-3 px-4 py-3 md:left-[68px] ${railOpen ? "md:!left-[220px]" : ""} ${hudClassName}`}
    >
      <div className="pointer-events-auto za-chip" aria-live="polite">
        DECK {String(arrivedDeck + 1).padStart(2, "0")} · {DECKS[arrivedDeck].name}
      </div>
      <div className="pointer-events-auto hidden items-center gap-0.5 xl:flex">
        {CRAFT.map((craft, index) => (
          <button
            key={craft[0]}
            type="button"
            aria-label={`Warp to ${craft[0]}`}
            aria-current={index === craftIndex ? "true" : undefined}
            title={craft[0]}
            onClick={() => onNavigateCraft(index)}
            className={`za-lcars-pip ${index === craftIndex ? "on" : index < craftIndex ? "past" : ""}`}
          >
            <span className="za-lcars-pip-mark" style={{ width: index === craftIndex ? 26 : 14 }} aria-hidden />
          </button>
        ))}
      </div>
      <div className="pointer-events-auto flex items-center gap-2">
        {tour ? <span className="za-chip min-h-11 text-accent">AUTOPILOT</span> : null}
        <span className="za-chip !hidden md:!inline-flex min-h-11">
          <span className="za-lock-pip" />
          {validityShort()}
        </span>
        <span className="za-chip !hidden lg:!inline-flex">SD {clock}</span>
        <button
          type="button"
          className={`za-chip pointer-events-auto min-h-11 ${audio ? "border-cyan text-cyan" : ""}`}
          onClick={onToggleAudio}
          aria-pressed={audio}
          aria-label={audio ? "Mute selection audio · AUDIO ARMED" : "Arm selection audio · AUDIO OFF"}
          title={audio ? "Mute selection audio" : "Arm selection audio"}
        >
          {audio ? (
            <span className="za-eq !hidden sm:!flex" aria-hidden>
              <span />
              <span />
              <span />
              <span />
              <span />
            </span>
          ) : null}
          <span className="za-audio-mark sm:hidden" aria-hidden>
            {audio ? "◉" : "○"}
          </span>
          <span className="za-audio-copy hidden sm:inline">{audio ? "AUDIO ARMED" : "AUDIO OFF"}</span>
        </button>
        <button
          type="button"
          className="za-chip pointer-events-auto min-h-11 min-w-11 hover:border-cyan hover:text-cyan"
          aria-label="Open deck navigator"
          onClick={(event) => onOpenNavigator(event.currentTarget)}
        >
          ⌘K
        </button>
      </div>
    </header>
  );
}

export type MobileCommandNavigationProps = SharedChromeProps & {
  onNavigate: (deck: number) => void;
  onOpenNavigator: (opener: HTMLElement) => void;
};

export function MobileCommandNavigation({
  deck,
  hudClassName,
  mode,
  onNavigate,
  onOpenNavigator,
}: MobileCommandNavigationProps) {
  // Bring the active chip into view, but only when the deck actually changes.
  // An inline callback ref would be a new function on every render, so React
  // would detach and reattach it each time the parent updated, including the
  // once a second clock tick, and drag the strip back under anyone scrolling
  // toward decks 07 to 09. Guarded for jsdom, which has no scrollIntoView.
  const activeChip = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    const node = activeChip.current;
    if (typeof node?.scrollIntoView !== "function") return;
    node.scrollIntoView({ block: "nearest", inline: "center" });
  }, [deck]);
  // Every deck is reachable from the phone rail. The strip scrolls sideways and
  // keeps the current deck in view, rather than hiding decks 07 to 09 behind GO.
  const visibleDecks = DECKS.filter((_, index) => (mode === "executive" ? index === 0 || index === 8 : true));
  return (
    <nav
      aria-label="Mobile command decks"
      className={`za-mobile-rail-safe za-mobile-rail-scroll fixed bottom-0 left-0 right-0 z-40 flex items-stretch gap-1 overflow-x-auto border-t border-line bg-void/90 px-2 pt-2 backdrop-blur md:hidden ${hudClassName}`}
    >
      {visibleDecks.map((item) => {
        const index = DECKS.findIndex((deckItem) => deckItem.id === item.id);
        return (
          <button
            key={item.id}
            type="button"
            aria-label={`${item.num} ${DECK_SHORT[item.id]} · Go to ${item.name}`}
            aria-current={deck === index ? "page" : undefined}
            ref={deck === index ? activeChip : undefined}
            onClick={() => onNavigate(index)}
            className={`za-mono min-h-11 min-w-11 shrink-0 rounded-md px-3 py-2 text-[10px] tracking-[0.12em] ${
              deck === index ? "bg-accent/15 text-accent" : "text-dim"
            }`}
          >
            {item.num} {DECK_SHORT[item.id]}
          </button>
        );
      })}
      <button
        type="button"
        aria-label="Open deck navigator · GO"
        className="za-mono ml-auto min-h-11 min-w-11 shrink-0 rounded-md px-3 py-2 text-[10px] text-cyan"
        onClick={(event) => onOpenNavigator(event.currentTarget)}
      >
        GO
      </button>
    </nav>
  );
}

export type MobileFlightControlProps = {
  active: boolean;
  elapsedMs: number;
  onStart: () => void;
  onStop: () => void;
};

export function MobileFlightControl({ active, elapsedMs, onStart, onStop }: MobileFlightControlProps) {
  return (
    <FlightControl
      active={active}
      elapsedMs={elapsedMs}
      onStart={onStart}
      onStop={onStop}
      className="za-mobile-flight-control fixed bottom-[calc(env(safe-area-inset-bottom,0px)+4.25rem)] left-3 z-40 w-[min(18rem,calc(100vw-1.5rem))] md:hidden"
    />
  );
}
