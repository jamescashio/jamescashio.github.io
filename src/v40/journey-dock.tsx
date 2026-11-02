const stops = [
  { id: "eagle-film", label: "Watch", mark: "▷", sections: ["eagle-film", "films", "showcase"] },
  { id: "rooms", label: "Worlds", mark: "◎", sections: ["rooms", "workshop"] },
  { id: "studies", label: "Try", mark: "⌘", sections: ["studies", "work", "universe"] },
  { id: "top", label: "Top", mark: "↑", sections: ["top"] },
];

/** A short path back to the essentials, revealed after the cinematic opening. */
export function JourneyDock({ active }: { active: string }) {
  return (
    <nav className="journey-dock" aria-label="Quick destinations" hidden={active === "top"}>
      {stops.map((stop) => (
        <a
          key={stop.id}
          href={"#" + stop.id}
          aria-current={stop.sections.includes(active) ? "location" : undefined}
          onClick={() => {
            const target = document.getElementById(stop.id);
            if (target) {
              target.tabIndex = -1;
              target.focus({ preventScroll: true });
            }
          }}
        >
          <span aria-hidden="true">{stop.mark}</span>
          {stop.label}
        </a>
      ))}
    </nav>
  );
}
