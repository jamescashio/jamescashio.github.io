import { useEffect, useRef } from "react";
import { DECKS } from "@/lib/content";
import { nextFocusIndex } from "@/lib/deck-focus";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function DeckNavigator({
  deck,
  onSelect,
  onClose,
}: {
  deck: number;
  onSelect: (deck: number) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const currentDeckRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const first = dialog?.querySelector<HTMLElement>(FOCUSABLE);
    (currentDeckRef.current ?? first)?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center bg-void/80 pt-[12vh] backdrop-blur-md"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Deck navigator"
        className="w-[min(580px,90vw)] overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface shadow-[var(--shadow-panel)]"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            onClose();
            return;
          }
          if (event.key !== "Tab") return;
          const controls = [...(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])];
          const currentIndex = controls.indexOf(document.activeElement as HTMLElement);
          const nextIndex = nextFocusIndex(currentIndex, controls.length, event.shiftKey);
          if (nextIndex >= 0) {
            event.preventDefault();
            controls[nextIndex].focus();
          }
        }}
      >
        <div className="flex items-center gap-2 border-b border-line px-5 py-3 za-mono text-[11px] tracking-[0.16em] text-cyan">
          <span className="text-accent">▸</span> GO TO DECK
          <button
            type="button"
            className="za-btn-ghost ml-auto min-h-10 px-3 py-2 text-[9px]"
            aria-label="Close deck navigator"
            onClick={onClose}
          >
            CLOSE · ESC
          </button>
        </div>
        <div className="grid p-2">
          {DECKS.map((item, index) => (
            <button
              key={item.id}
              ref={index === deck ? currentDeckRef : undefined}
              type="button"
              aria-label={`Go to ${item.name} deck`}
              className={`flex w-full gap-4 rounded-[var(--radius-sm)] px-3 py-2.5 text-left ${
                index === deck ? "bg-accent/15 text-ink" : "hover:bg-white/5"
              }`}
              onClick={() => {
                onSelect(index);
                onClose();
              }}
            >
              <span className="za-mono text-accent">{item.num}</span>
              <span className="font-display tracking-wide">{item.name}</span>
              <span className="ml-auto hidden za-mono text-[10px] text-dim sm:inline">{item.tag}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-4 border-t border-line px-5 py-2 za-mono text-[9px] tracking-[0.14em] text-dim">
          <span>1–9 JUMP</span>
          <span className="text-green">CURRENT</span>
          <span className="text-red">R RED ALERT</span>
          <span>A AUDIO</span>
          <span>T AUTOPILOT</span>
          <span>⌘K PALETTE</span>
        </div>
      </div>
    </div>
  );
}
