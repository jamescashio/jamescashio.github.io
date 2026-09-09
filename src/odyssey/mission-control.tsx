import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { PROJECTS } from "./data";
import { STUDY_BROWSER_ID } from "./study-navigation";

type Destination = {
  id: string;
  label: string;
  description: string;
  href: string;
  kind: "Destination" | "Interactive study";
  keywords: string;
};

let panelStyles: Promise<void> | null = null;
function loadPanelStyles() {
  if (!panelStyles) {
    panelStyles = import("./mission-control-panel.css?url")
      .then(
        ({ default: href }) =>
          new Promise<void>((resolve, reject) => {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = href;
            link.dataset.missionControlPanel = "";
            link.onload = () => resolve();
            link.onerror = () => {
              link.remove();
              reject(new Error("Mission Control styles could not load"));
            };
            document.head.append(link);
          }),
      )
      .catch((error: unknown) => {
        panelStyles = null;
        throw error;
      });
  }
  return panelStyles;
}

const DESTINATIONS: Destination[] = [
  {
    id: "sovereign-world",
    label: "Sovereign Starship",
    description: "Board a 3D starship and compare local, hybrid, and cloud AI.",
    href: "#sovereign-world",
    kind: "Destination",
    keywords:
      "sovereign ai world spaceship starship ship vessel simulation compare privacy cloud hybrid local internet outage 3d",
  },
  {
    id: "top",
    label: "The event horizon",
    description: "Return to the beginning.",
    href: "#top",
    kind: "Destination",
    keywords: "home opening hero",
  },
  {
    id: "observatory",
    label: "Principles Engine",
    description: "Put the operating principles in motion.",
    href: "#observatory",
    kind: "Destination",
    keywords: "principles orbit rings rotate space interactive instrument observatory",
  },
  {
    id: "lensing",
    label: "Lensing Observatory",
    description: "Explore the orbital world, change its light, and ignite the gate.",
    href: "#lensing",
    kind: "Destination",
    keywords: "observatory planet world journey gate dawn eclipse ion 3d",
  },
  {
    id: "universe",
    label: "The system atlas",
    description: "Explore Zeus, Apollo, and human authority.",
    href: "#universe",
    kind: "Destination",
    keywords: "estate architecture compute infrastructure lab",
  },
  {
    id: "work",
    label: "Selected work",
    description: "Seven ideas you can operate.",
    href: "#work",
    kind: "Destination",
    keywords: "projects builds laboratory demos",
  },
  {
    id: "evidence",
    label: "E.V.E. evidence console",
    description: "Ask what the published evidence supports.",
    href: "#evidence",
    kind: "Destination",
    keywords: "facts proof verified source terminal",
  },
  {
    id: "lineage",
    label: "Flight lineage",
    description: "The engineering principles behind the work.",
    href: "#lineage",
    kind: "Destination",
    keywords: "aircraft aviation yeager johnson rutan hoover",
  },
  {
    id: "operator",
    label: "Meet the operator",
    description: "Doug Cashio. Curiosity with accountability.",
    href: "#operator",
    kind: "Destination",
    keywords: "about person doug profile",
  },
  {
    id: "contact",
    label: "Open a conversation",
    description: "Find Doug’s contact and professional links.",
    href: "#contact",
    kind: "Destination",
    keywords: "email linkedin github connect",
  },
  ...PROJECTS.map((project) => ({
    id: `build-${project.id}`,
    label: project.title,
    description: project.cue,
    href: `#build=${project.id}`,
    kind: "Interactive study" as const,
    keywords: `${project.category} ${project.subtitle}`,
  })),
];

const MISSIONS = [
  {
    title: "Board the starship",
    subtitle: "Take control of the boundary.",
    href: "#sovereign-world",
    number: "01",
    path: "Sovereign Starship → HERMES → Evidence",
  },
  {
    title: "Understand the estate",
    subtitle: "Follow the architecture.",
    href: "#universe",
    number: "02",
    path: "System atlas → ZeusApollo → Evidence",
  },
  {
    title: "See the evidence",
    subtitle: "Start with what is known.",
    href: "#evidence",
    number: "03",
    path: "E.V.E. → Selected work → Operator",
  },
] as const;

function MissionGlyph({ small = false }: { small?: boolean }) {
  return (
    <svg className={small ? "mc-glyph mc-glyph-small" : "mc-glyph"} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="32" cy="32" r="23" />
      <circle cx="32" cy="32" r="14" />
      <path d="M32 2v14m0 32v14M2 32h14m32 0h14M23 32l9-9 9 9-9 9-9-9Z" />
      <circle cx="32" cy="9" r="2.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function MissionControl({
  motion = true,
  triggerClassName = "",
  onNavigate,
  onFirstFlight,
}: {
  motion?: boolean;
  triggerClassName?: string;
  onNavigate?: (href: string) => void;
  onFirstFlight?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState<"idle" | "loading" | "failed">("idle");
  const mounted = useRef(false);
  const pendingLaunch = useRef(false);
  const launchGeneration = useRef(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const navigating = useRef(false);
  const uid = useId();
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const results = DESTINATIONS.filter((item) => {
    const text = `${item.label} ${item.description} ${item.keywords}`.toLocaleLowerCase();
    return terms.every((term) => text.includes(term));
  });
  const current = Math.min(active, Math.max(results.length - 1, 0));

  const cancelLaunch = useCallback(() => {
    launchGeneration.current += 1;
    pendingLaunch.current = false;
    if (mounted.current) setLoading("idle");
  }, []);

  const launch = useCallback(
    async (opener?: HTMLElement) => {
      if (dialog.current?.open) {
        search.current?.focus();
        return;
      }
      if (pendingLaunch.current || document.querySelector("dialog:modal")) return;
      returnFocus.current = opener ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
      navigating.current = false;
      const generation = ++launchGeneration.current;
      pendingLaunch.current = true;
      setLoading("loading");
      try {
        await loadPanelStyles();
        if (!mounted.current || generation !== launchGeneration.current) return;
        if (document.querySelector("dialog:modal")) {
          cancelLaunch();
          return;
        }
      } catch {
        if (mounted.current && generation === launchGeneration.current) {
          pendingLaunch.current = false;
          setLoading("failed");
        }
        return;
      }
      pendingLaunch.current = false;
      setLoading("idle");
      setQuery("");
      setActive(0);
      setOpen(true);
    },
    [cancelLaunch],
  );

  const close = useCallback(() => {
    cancelLaunch();
    dialog.current?.close();
    setOpen(false);
  }, [cancelLaunch]);

  useEffect(() => {
    mounted.current = true;
    const observer = new MutationObserver(() => {
      if (pendingLaunch.current && document.querySelector("dialog:modal")) cancelLaunch();
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["open"] });
    return () => {
      mounted.current = false;
      launchGeneration.current += 1;
      pendingLaunch.current = false;
      observer.disconnect();
    };
  }, [cancelLaunch]);

  useEffect(() => {
    const shortcut = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape" && pendingLaunch.current) {
        cancelLaunch();
        return;
      }
      if (!(event.ctrlKey || event.metaKey) || event.altKey || event.key.toLowerCase() !== "k") return;
      // A modal already on screen keeps control of its own keyboard context.
      if (document.querySelector("dialog:modal") && !dialog.current?.open) return;
      event.preventDefault();
      void launch();
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [launch, cancelLaunch]);

  useEffect(() => {
    if (!open) return;
    const panel = dialog.current;
    if (!panel) return;
    if (document.querySelector("dialog:modal")) {
      setOpen(false);
      return;
    }
    panel.showModal();
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => search.current?.focus({ preventScroll: true }));
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = priorOverflow;
      if (panel.open) panel.close();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    // Scroll the results list only. Scrolling the document also hides the dialog's close control.
    const option = document.getElementById(`${uid}-option-${current}`);
    const list = option?.closest<HTMLElement>(".mc-results");
    if (option && list) {
      const item = option.getBoundingClientRect(),
        bounds = list.getBoundingClientRect();
      if (item.top < bounds.top) list.scrollTop += item.top - bounds.top;
      else if (item.bottom > bounds.bottom) list.scrollTop += item.bottom - bounds.bottom;
    }
  }, [current, open, query, uid]);

  function navigate(href: string) {
    navigating.current = true;
    close();
    if (onNavigate) {
      onNavigate(href);
      return;
    }
    const build = href.match(/^#build=([a-z]+)$/)?.[1];
    if (window.location.hash !== href) window.location.hash = href;
    else if (build) window.dispatchEvent(new HashChangeEvent("hashchange"));
    const target = document.getElementById(build ? STUDY_BROWSER_ID : href.slice(1));
    target?.scrollIntoView({ behavior: motion && !build ? "smooth" : "instant", block: "start" });
    // Move keyboard users into the destination after the dialog releases focus.
    requestAnimationFrame(() => {
      const focusTarget = build ? document.getElementById(`tab-${build}`) : target?.querySelector<HTMLElement>("h1,h2");
      if (focusTarget) {
        if (!focusTarget.hasAttribute("tabindex")) focusTarget.setAttribute("tabindex", "-1");
        focusTarget.focus({ preventScroll: true });
      }
    });
  }

  function searchKeys(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (results.length) setActive((current + (event.key === "ArrowDown" ? 1 : results.length - 1)) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (results[current]) navigate(results[current].href);
    }
  }

  function dialogKeys(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const controls = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => element.tabIndex >= 0 && element.getClientRects().length > 0);
    const first = controls[0];
    const last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  return (
    <>
      <button
        className={`mc-trigger ${motion ? "" : "mc-still"} ${triggerClassName}`}
        type="button"
        onClick={(event) => void launch(event.currentTarget)}
        aria-haspopup="dialog"
        aria-busy={loading === "loading" || undefined}
      >
        <MissionGlyph small />
        <span>
          {loading === "loading"
            ? "Loading Mission Control…"
            : loading === "failed"
              ? "Retry Mission Control"
              : "Launch Mission Control"}
        </span>
        <kbd aria-hidden="true">⌘ / Ctrl K</kbd>
      </button>
      <span className="mc-sr-only" role="status">
        {loading === "failed"
          ? "Mission Control could not load. Select Retry Mission Control to try again."
          : loading === "loading"
            ? "Loading Mission Control. Escape cancels."
            : ""}
      </span>
      <dialog
        ref={dialog}
        className={`mc-dialog ${motion ? "mc-motion" : "mc-still"}`}
        aria-labelledby={`${uid}-title`}
        aria-describedby={`${uid}-description`}
        onKeyDown={dialogKeys}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClose={() => {
          setOpen(false);
          if (!navigating.current) returnFocus.current?.focus({ preventScroll: true });
        }}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            close();
        }}
      >
        <div className="mc-cap">
          <span>CASHIO / V37</span>
          <span>THE HUMAN RECKONING</span>
          <button type="button" className="mc-close" onClick={close}>
            Close <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="mc-heading">
          <MissionGlyph />
          <div>
            <p className="mc-eyebrow">CHOOSE YOUR TRAJECTORY</p>
            <h2 id={`${uid}-title`}>
              Mission Control<span aria-hidden="true">.</span>
            </h2>
          </div>
        </div>
        <p className="mc-description" id={`${uid}-description`}>
          Choose a starting point, or search the universe.
        </p>
        <div className="mc-search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <circle cx="10" cy="10" r="6" />
            <path d="m15 15 5 5" />
          </svg>
          <label className="mc-sr-only" htmlFor={`${uid}-search`}>
            Search destinations and studies
          </label>
          <input
            ref={search}
            id={`${uid}-search`}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls={`${uid}-results`}
            aria-activedescendant={results.length ? `${uid}-option-${current}` : undefined}
            autoComplete="off"
            spellCheck={false}
            placeholder="Where will curiosity take you?"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={searchKeys}
          />
          {query && (
            <button
              type="button"
              className="mc-clear"
              onClick={() => {
                setQuery("");
                setActive(0);
                search.current?.focus();
              }}
            >
              Clear
            </button>
          )}
        </div>
        <div className="mc-body" data-searching={query ? "true" : "false"}>
          <aside className="mc-missions" aria-label="Choose a starting point">
            <h3 className="mc-eyebrow">START HERE</h3>
            {onFirstFlight && (
              <button
                className="mc-mission mc-first-flight"
                type="button"
                onClick={() => {
                  navigating.current = true;
                  close();
                  onFirstFlight();
                }}
              >
                <span className="mc-mission-number" aria-hidden="true">
                  ↗
                </span>
                <span className="mc-mission-copy">
                  <strong>The 30-second flight</strong>
                  <span>Open the hull. Cut the cloud. Keep command.</span>
                </span>
              </button>
            )}
            {MISSIONS.map((mission) => (
              <button type="button" className="mc-mission" key={mission.number} onClick={() => navigate(mission.href)}>
                <span className="mc-mission-number" aria-hidden="true">
                  {mission.number}
                </span>
                <span className="mc-mission-copy">
                  <strong>{mission.title}</strong>
                  <span>{mission.subtitle}</span>
                  <small>{mission.path}</small>
                </span>
                <span className="mc-arrow" aria-hidden="true">
                  ↗
                </span>
              </button>
            ))}
            <p className="mc-mission-note">Every route is open. Explore at your own pace.</p>
          </aside>
          <section className="mc-directory" aria-labelledby={`${uid}-directory`}>
            <h3 className="mc-eyebrow" id={`${uid}-directory`}>
              {query ? "MATCHING DESTINATIONS" : "ALL DESTINATIONS"}
            </h3>
            <div
              className="mc-results"
              role="listbox"
              tabIndex={-1}
              id={`${uid}-results`}
              aria-label="Destinations and interactive studies"
            >
              {results.map((item, index) => (
                <button
                  type="button"
                  role="option"
                  tabIndex={-1}
                  aria-selected={current === index}
                  id={`${uid}-option-${index}`}
                  className={`mc-result ${current === index ? "mc-selected" : ""}`}
                  key={item.id}
                  onPointerMove={() => setActive(index)}
                  onClick={() => navigate(item.href)}
                >
                  <span className="mc-result-marker" aria-hidden="true">
                    {item.kind === "Interactive study" ? "◇" : "·"}
                  </span>
                  <span>
                    <strong>{item.label}</strong>
                    <span className="mc-result-description">{item.description}</span>
                  </span>
                  <span className="mc-result-kind">{item.kind === "Interactive study" ? "STUDY" : "GO"}</span>
                </button>
              ))}
            </div>
            {!results.length && (
              <div className="mc-empty">
                <span aria-hidden="true">⌁</span>
                <strong>No matching trajectory.</strong>
                <p>Try “HERMES”, “evidence”, or “architecture”.</p>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setActive(0);
                    search.current?.focus();
                  }}
                >
                  Show all destinations
                </button>
              </div>
            )}
          </section>
        </div>
        <div className="mc-footer">
          <span role="status" aria-live="polite" aria-atomic="true">
            {results.length} destination{results.length === 1 ? "" : "s"}
          </span>
          <span className="mc-key-help">
            <kbd>↑</kbd>
            <kbd>↓</kbd> navigate <kbd>↵</kbd> enter <kbd>esc</kbd> close
          </span>
        </div>
      </dialog>
    </>
  );
}
