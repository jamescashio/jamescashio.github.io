import { useEffect, useRef, useState } from "react";
import type { RoadsterController, RoadsterFinish, RoadsterView } from "../roadster-inspection";

const views = [
  {
    id: "body",
    label: "Body",
    title: "Every line, intentional.",
    text: "Follow the light from the low nose to the rear haunches. Platinum bodywork and smoked glass make the silhouette easy to read.",
    detail: "Look for the continuous line above the front wheel.",
    component: "Windshield",
    componentText:
      "The smoked windshield is a separate curved panel. Move the studio light across it to distinguish the broad center from the angled edges; the blue trace follows the original panel geometry.",
  },
  {
    id: "wheels",
    label: "Wheels",
    title: "The detail earns a closer look.",
    text: "Machined faces meet dark spokes and a deep barrel. Move around the front wheel to see how the surfaces catch the light.",
    detail: "Look for the beveled edges around each spoke.",
    component: "Wheel face",
    componentText:
      "Six modeled aero faces surround the front hub. The blue trace follows these faces, while the dark barrel remains behind them. Moving the light makes the face and bevel easier to distinguish.",
  },
  {
    id: "thrusters",
    label: "Thrusters",
    title: "A very unreasonable departure.",
    text: "Ten concept thrusters are modeled across the car. This rear view reveals the nozzle bank. An exploration of the idea, not a flight capability claim.",
    detail: "Look for the nozzle lips nested inside the rear fascia.",
    component: "Nozzle bank",
    componentText:
      "Four rear nozzle bodies sit across the fascia. The blue trace isolates this bank from the surrounding bodywork. These are concept components, with no claim of tested thrust or flight capability.",
  },
] as const;

/** Frame only an explicitly requested inspection or control, never ordinary page scrolling. */
function revealInspection(surface: HTMLCanvasElement, control?: HTMLElement) {
  const stage = surface.getBoundingClientRect();
  const top = Math.max(0, document.querySelector("header")?.getBoundingClientRect().bottom || 0) + 12;
  const dock = document.querySelector("nav.journey-dock")?.getBoundingClientRect();
  // The section observer may reveal the mobile dock after this requested scroll.
  const dockReserve =
    dock && matchMedia("(max-width: 1179px)").matches
      ? dock.height > 0
        ? Math.max(70, dock.height + Math.max(0, innerHeight - dock.bottom))
        : 70
      : 0;
  const bottom = innerHeight - dockReserve - 12;
  const action = control?.getBoundingClientRect();
  const visible = Math.max(0, Math.min(stage.bottom, bottom) - Math.max(stage.top, top));
  if (visible >= stage.height * (control ? 0.75 : 1) && (!action || (action.top >= top && action.bottom <= bottom)))
    return;
  let destination = top;
  if (action) {
    destination = Math.min(destination, bottom - (action.bottom - stage.top));
    destination = Math.max(destination, top - (action.top - stage.top));
  }
  const distance = stage.top - destination;
  if (Math.abs(distance) > 1) window.scrollBy({ top: distance, behavior: "instant" });
}

export function RoadsterShowcase() {
  const [open, setOpen] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [view, setView] = useState<RoadsterView>("body");
  const [finish, setFinish] = useState<RoadsterFinish>("studio");
  const [detailOpen, setDetailOpen] = useState(false);
  const [sweeping, setSweeping] = useState(false);
  const [motionAllowed, setMotionAllowed] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const viewer = useRef<RoadsterController | null>(null);
  const launch = useRef<HTMLButtonElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const hotspot = useRef<HTMLButtonElement>(null);
  const lightInput = useRef<HTMLInputElement>(null);
  const lightOutput = useRef<HTMLOutputElement>(null);
  const lightPointer = useRef(false);
  const selected = views.find((item) => item.id === view)!;

  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMotionAllowed(!query.matches && document.documentElement.dataset.motion !== "off");
    update();
    query.addEventListener("change", update);
    document.addEventListener("cashio-motion", update);
    return () => {
      query.removeEventListener("change", update);
      document.removeEventListener("cashio-motion", update);
    };
  }, []);

  useEffect(() => {
    if (!open || !canvas.current) return;
    const surface = canvas.current;
    lightPointer.current = false;
    const abort = new AbortController();
    let lightMoving = false;
    close.current?.focus({ preventScroll: true });
    revealInspection(surface);
    setPhase("loading");
    void import("../roadster-inspection")
      .then(({ createRoadsterInspection }) => {
        if (abort.signal.aborted) return;
        return createRoadsterInspection(
          surface,
          abort.signal,
          () => {
            setPhase("error");
            setSweeping(false);
          },
          {
            lighting: (angle, active) => {
              const value = Math.round(angle);
              if (lightInput.current) lightInput.current.value = String(value);
              if (lightOutput.current) lightOutput.current.textContent = `${value}°`;
              if (lightMoving !== active) {
                lightMoving = active;
                setSweeping(active);
              }
            },
            hotspot: (point) => {
              const button = hotspot.current;
              if (!button) return;
              const half = button.offsetWidth / 2;
              button.style.left = `${Math.max(half + 12, Math.min(surface.clientWidth - half - 12, point.x * surface.clientWidth))}px`;
              button.style.top = `${Math.max(100, Math.min(surface.clientHeight - 110, point.y * surface.clientHeight - 40))}px`;
              button.dataset.anchored = String(point.anchored);
            },
          },
        );
      })
      .then((controller) => {
        if (!controller) return;
        if (abort.signal.aborted) controller.dispose();
        else {
          viewer.current = controller;
          setPhase("ready");
        }
      })
      .catch(() => {
        if (!abort.signal.aborted) setPhase("error");
      });
    return () => {
      abort.abort();
      viewer.current?.dispose();
      viewer.current = null;
    };
  }, [open, attempt]);

  function choose(next: RoadsterView, control?: HTMLElement) {
    setDetailOpen(false);
    setView(next);
    viewer.current?.view(next);
    if (canvas.current && control) revealInspection(canvas.current, control);
  }
  function inspectDetail() {
    const next = !detailOpen;
    if (next) viewer.current?.view(view);
    viewer.current?.detail(next);
    setDetailOpen(next);
  }
  function appearance(next: RoadsterFinish) {
    viewer.current?.finish(next);
    setFinish(next);
  }
  function revealLight(control: HTMLElement) {
    if (!lightPointer.current && canvas.current)
      revealInspection(canvas.current, control.closest<HTMLElement>(".roadster-lighting-controls") || control);
  }
  function leave() {
    lightPointer.current = false;
    setOpen(false);
    setView("body");
    setFinish("studio");
    setDetailOpen(false);
    setSweeping(false);
    requestAnimationFrame(() => launch.current?.focus({ preventScroll: true }));
  }

  return (
    <section
      id="roadster-studio"
      className="roadster-showcase"
      aria-labelledby="roadster-studio-title"
      onKeyDown={(event) => {
        if (open && event.key === "Escape") {
          event.preventDefault();
          leave();
        }
      }}
    >
      <div className="roadster-intro">
        <p className="roadster-kicker">From the workshop / Independent design study</p>
        <div className="roadster-heading">
          <h2 id="roadster-studio-title">
            Roadster <em>Studio</em>
          </h2>
          <p>
            A roadster. Ten thrusters.
            <br />
            One unreasonable departure.
          </p>
        </div>
      </div>
      <div className="roadster-plate" data-inspecting={open}>
        <div className="roadster-stage">
          <img
            src="/images/roadster-studio-960.webp"
            srcSet="/images/roadster-studio-640.webp 640w, /images/roadster-studio-960.webp 960w, /images/roadster-studio-1600.webp 1600w"
            sizes="(max-width: 760px) calc(100vw - 36px), (max-width: 1400px) calc(100vw - 160px), 1200px"
            width="1600"
            height="900"
            loading="lazy"
            decoding="async"
            alt="Pearl white Roadster concept with bronze glass and sculpted wheels, rendered from the interactive CAD model."
          />
          {!open && (
            <button
              type="button"
              className="roadster-cta"
              ref={launch}
              onClick={() => {
                setPhase("loading");
                setOpen(true);
              }}
            >
              <span>
                <strong>Inspect the Roadster</strong>
                <small>Interactive 3D · Load 7 MB</small>
              </span>
              <span aria-hidden="true">↗</span>
            </button>
          )}
        </div>
        {!open && (
          <>
            <span className="roadster-stage-label" aria-hidden="true">
              DESIGN STUDY / 01
            </span>
            <span className="roadster-orbit" aria-hidden="true" />
          </>
        )}
        {open && (
          <div className="roadster-inspection" data-phase={phase} data-view={view} data-finish={finish}>
            <div className="roadster-inspection-top">
              <span>{finish === "blueprint" ? "OUTLINE / CONCEPT" : "STUDIO / INSPECT"}</span>
              <button type="button" ref={close} onClick={leave}>
                Close 3D <span aria-hidden="true">×</span>
              </button>
            </div>
            <canvas
              key={attempt}
              ref={canvas}
              tabIndex={phase === "ready" ? 0 : -1}
              aria-label="Roadster 3D view. Drag horizontally or use arrow keys to orbit. Use plus and minus to zoom. Views below show the same details."
            />
            <button
              type="button"
              className="roadster-hotspot"
              ref={hotspot}
              disabled={phase !== "ready"}
              aria-label={`Inspect ${selected.component.toLowerCase()} detail`}
              aria-expanded={detailOpen}
              aria-controls="roadster-component-note"
              onClick={inspectDetail}
            >
              <span aria-hidden="true">{detailOpen ? "−" : "+"}</span> {selected.component}
            </button>
            {phase !== "ready" && (
              <div className="roadster-load" role="status">
                <strong>{phase === "loading" ? "Opening the studio…" : "The 3D view could not open here."}</strong>
                <p>
                  {phase === "loading"
                    ? "Preparing the original design. Your inspection starts when you are ready."
                    : "The original image and full Studio are still available."}
                </p>
                {phase === "error" && (
                  <button
                    type="button"
                    onClick={() => {
                      setView("body");
                      setFinish("studio");
                      setDetailOpen(false);
                      setSweeping(false);
                      setAttempt((value) => value + 1);
                    }}
                  >
                    Try 3D again
                  </button>
                )}
              </div>
            )}
            {phase === "ready" && (
              <div className="roadster-camera-tools" role="group" aria-label="Roadster camera">
                <button type="button" aria-label="Orbit Roadster left" onClick={() => viewer.current?.orbit(-1)}>
                  ←
                </button>
                <button type="button" aria-label="Orbit Roadster right" onClick={() => viewer.current?.orbit(1)}>
                  →
                </button>
                <button type="button" aria-label="Zoom Roadster in" onClick={() => viewer.current?.zoom(-1)}>
                  +
                </button>
                <button type="button" aria-label="Zoom Roadster out" onClick={() => viewer.current?.zoom(1)}>
                  −
                </button>
                <button type="button" aria-label="Reset Roadster view" onClick={() => choose(view)}>
                  Reset
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {open && (
        <div className="roadster-inspection-details">
          <div className="roadster-views" role="group" aria-label="Inspect Roadster details">
            {views.map((item, index) => (
              <button
                type="button"
                key={item.id}
                aria-pressed={view === item.id}
                disabled={phase !== "ready"}
                onClick={(event) => choose(item.id, event.currentTarget)}
              >
                <span aria-hidden="true">0{index + 1}</span>
                {item.label}
              </button>
            ))}
          </div>
          <div className="roadster-lighting" data-sweeping={sweeping}>
            <div className="roadster-lighting-heading">
              <label htmlFor="roadster-light-angle">Move the light</label>
              <output ref={lightOutput} htmlFor="roadster-light-angle" aria-live="off">
                0°
              </output>
            </div>
            <div className="roadster-lighting-controls">
              <input
                ref={lightInput}
                id="roadster-light-angle"
                type="range"
                min="-80"
                max="80"
                step="1"
                defaultValue="0"
                disabled={phase !== "ready" || finish !== "studio"}
                aria-describedby="roadster-light-help"
                onFocus={(event) => {
                  const control = event.currentTarget;
                  // Native focus may center the range after the focus event finishes.
                  requestAnimationFrame(() => {
                    if (control.isConnected) revealLight(control);
                  });
                }}
                onKeyDown={(event) => {
                  lightPointer.current = false;
                  if (
                    ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(
                      event.key,
                    )
                  )
                    revealLight(event.currentTarget);
                }}
                onPointerDown={() => {
                  lightPointer.current = true;
                }}
                onPointerUp={(event) => {
                  lightPointer.current = false;
                  revealLight(event.currentTarget);
                }}
                onPointerCancel={() => {
                  lightPointer.current = false;
                }}
                onBlur={() => {
                  lightPointer.current = false;
                }}
                onLostPointerCapture={() => {
                  lightPointer.current = false;
                }}
                onInput={(event) => {
                  viewer.current?.light(Number(event.currentTarget.value));
                  revealLight(event.currentTarget);
                }}
              />
              <button
                type="button"
                disabled={phase !== "ready" || finish !== "studio" || !motionAllowed}
                onClick={(event) => {
                  revealLight(event.currentTarget);
                  viewer.current?.sweep();
                }}
              >
                {sweeping ? "Stop sweep" : "Sweep light"}
              </button>
              <button
                type="button"
                disabled={phase !== "ready" || finish !== "studio"}
                onClick={(event) => {
                  viewer.current?.light(0);
                  revealLight(event.currentTarget);
                }}
              >
                Reset light
              </button>
            </div>
            <p id="roadster-light-help">
              {finish === "blueprint"
                ? "Return to Studio to adjust the lighting."
                : !motionAllowed
                  ? "Motion paused. Drag the light or use arrow keys."
                  : "One slow pass. Stop any time."}
            </p>
          </div>
          <div className="roadster-inspection-options">
            <div className="roadster-appearance">
              <p id="roadster-finish-note">
                {finish === "blueprint" ? "Same geometry. Outline view." : "Surface rendering"}
              </p>
              <div role="group" aria-label="Roadster rendering" aria-describedby="roadster-finish-note">
                <button
                  type="button"
                  aria-pressed={finish === "studio"}
                  disabled={phase !== "ready"}
                  onClick={() => appearance("studio")}
                >
                  Studio
                </button>
                <button
                  type="button"
                  aria-pressed={finish === "blueprint"}
                  disabled={phase !== "ready"}
                  onClick={() => appearance("blueprint")}
                >
                  Blueprint
                </button>
              </div>
            </div>
          </div>
          <div className="roadster-view-note" aria-live="polite">
            <h3>{selected.title}</h3>
            <p>{selected.text}</p>
            <p className="roadster-detail-cue">{selected.detail}</p>
            <div id="roadster-component-note" className="roadster-component-note" hidden={!detailOpen}>
              <h4>{selected.component} / In detail</h4>
              <p>{selected.componentText}</p>
            </div>
            {finish === "blueprint" && (
              <p className="roadster-concept-note">
                Outline study of the concept geometry, not a manufacturing drawing.
              </p>
            )}
          </div>
        </div>
      )}
      <div className="roadster-caption">
        <p>
          {open
            ? "Drag to find an angle. Nothing moves until you ask."
            : "Inspect the body, wheels and thrusters here, then enter the full studio to explore further."}
        </p>
        <a
          href="https://roadster-studio.hotsaucecashio.chatgpt.site/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Explore Roadster Studio, opens in a new tab"
        >
          Explore Roadster Studio <span aria-hidden="true">↗</span>
        </a>
      </div>
    </section>
  );
}
