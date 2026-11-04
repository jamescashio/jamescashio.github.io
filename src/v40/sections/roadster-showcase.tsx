import { useEffect, useRef, useState } from "react";
import type { RoadsterController, RoadsterView } from "../roadster-inspection";

const views = [
  {
    id: "body",
    label: "Body",
    title: "Every line, intentional.",
    text: "Pearl white surfaces, a bronze canopy, and a low, sculpted silhouette. An independent reconstruction, ready to inspect.",
  },
  {
    id: "wheels",
    label: "Wheels",
    title: "The detail earns a closer look.",
    text: "Machined faces meet dark spokes and a deep barrel. Move around the front wheel to see how the surfaces catch the light.",
  },
  {
    id: "thrusters",
    label: "Thrusters",
    title: "A very unreasonable departure.",
    text: "Ten concept thrusters are modeled across the car. This rear view reveals the nozzle bank. An exploration of the idea, not a flight capability claim.",
  },
] as const;

export function RoadsterShowcase() {
  const [open, setOpen] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [view, setView] = useState<RoadsterView>("body");
  const canvas = useRef<HTMLCanvasElement>(null);
  const viewer = useRef<RoadsterController | null>(null);
  const launch = useRef<HTMLButtonElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const selected = views.find((item) => item.id === view)!;

  useEffect(() => {
    if (!open || !canvas.current) return;
    const surface = canvas.current;
    const abort = new AbortController();
    close.current?.focus({ preventScroll: true });
    setPhase("loading");
    void import("../roadster-inspection")
      .then(({ createRoadsterInspection }) => {
        if (abort.signal.aborted) return;
        return createRoadsterInspection(surface, abort.signal, () => setPhase("error"));
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

  function choose(next: RoadsterView) {
    setView(next);
    viewer.current?.view(next);
  }
  function leave() {
    setOpen(false);
    setView("body");
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
          <div className="roadster-inspection" data-phase={phase} data-view={view}>
            <div className="roadster-inspection-top">
              <span>STUDIO / INSPECT</span>
              <button type="button" ref={close} onClick={leave}>
                Close 3D <span aria-hidden="true">×</span>
              </button>
            </div>
            <canvas
              ref={canvas}
              tabIndex={phase === "ready" ? 0 : -1}
              aria-label="Roadster 3D view. Drag horizontally or use arrow keys to orbit. Use plus and minus to zoom. Views below show the same details."
            />
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
                onClick={() => choose(item.id)}
              >
                <span>0{index + 1}</span>
                {item.label}
              </button>
            ))}
          </div>
          <div className="roadster-view-note" aria-live="polite">
            <h3>{selected.title}</h3>
            <p>{selected.text}</p>
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
