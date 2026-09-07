import { useEffect, useId, useRef, useState } from "react";
import {
  computeWorldOutcome,
  TOTAL_REQUESTS,
  type WorldArchitecture,
  type WorldInput,
  type WorldSensitivity,
} from "./sovereign-model";
import { missionHash, parseMissionHash } from "./flight-plan";
import type { WorldController } from "./world-renderer";
import { StarshipPoster } from "./starship-poster";

const ARCHITECTURES: { id: WorldArchitecture; name: string; detail: string }[] = [
  { id: "sovereign", name: "Sovereign / local", detail: "Your hardware. Your boundary." },
  { id: "hybrid", name: "Hybrid", detail: "Local privacy. Cloud options." },
  { id: "cloud", name: "Cloud", detail: "External compute. Explicit permission." },
];
const INSPECTIONS = {
  local: {
    title: "Onboard AI",
    copy: "Owned compute lives inside the ship. Its AI bay represents hardware you operate. In this model, it can handle all twelve requests onboard, even without a cloud connection.",
  },
  cloud: {
    title: "Cloud relay",
    copy: "The separate orbital relay represents an external cloud provider. A request must leave the ship to reach it. Private requests also need explicit permission in Cloud mode.",
  },
  human: {
    title: "Command bridge",
    copy: "Bit, the gold core, marks human authority. You choose the architecture and grant permission. A held request waits here for an approved route; it never leaves silently.",
  },
} as const;

function WorldFallback() {
  return <StarshipPoster className="sw-world-fallback" />;
}

const MISSIONS: { name: string; detail: string; settings: WorldInput }[] = [
  {
    name: "Routine flight",
    detail: "6 private + 6 public · hybrid",
    settings: { architecture: "hybrid", sensitivity: "mixed", connected: true, allowPrivateEgress: false },
  },
  {
    name: "Deep-space blackout",
    detail: "Same work · cloud link offline",
    settings: { architecture: "hybrid", sensitivity: "mixed", connected: false, allowPrivateEgress: false },
  },
  {
    name: "Classified mission",
    detail: "12 private · cloud permission off",
    settings: { architecture: "cloud", sensitivity: "private", connected: true, allowPrivateEgress: false },
  },
];
const CAMERA_VIEWS = [
  { id: "hero", label: "Hero view" },
  { id: "top", label: "Deck plan" },
  { id: "aft", label: "Engine view" },
] as const;

export function SovereignWorld({ motion }: { motion: boolean }) {
  const id = useId();
  const [input, setInput] = useState<WorldInput>({
    architecture: "hybrid",
    sensitivity: "mixed",
    connected: true,
    allowPrivateEgress: false,
  });
  const [phase, setPhase] = useState<"idle" | "loading" | "ready" | "unavailable">("idle");
  const [playing, setPlaying] = useState(false);
  const [propulsion, setPropulsion] = useState(50);
  const [hullProgress, setHullProgress] = useState(0);
  const [compact, setCompact] = useState(false);
  const cutaway = hullProgress > 0;
  const [cameraView, setCameraView] = useState<string>("hero");
  const [inspection, setInspection] = useState<keyof typeof INSPECTIONS>("human");
  const canvas = useRef<HTMLCanvasElement>(null);
  const launchButton = useRef<HTMLButtonElement>(null);
  const firstCameraControl = useRef<HTMLButtonElement>(null);
  const launchHadFocus = useRef(false);
  const controller = useRef<WorldController | null>(null);
  const mounted = useRef(true);
  const latest = useRef({ input, motion, playing, propulsion });
  const outcome = computeWorldOutcome(input);
  const [shared, setShared] = useState(false);
  const [shareError, setShareError] = useState(false);
  useEffect(() => {
    const query = matchMedia("(max-width: 700px)");
    const update = () => setCompact(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    latest.current.propulsion = propulsion;
  }, [propulsion]);
  useEffect(() => {
    const restore = () => {
      const scenario = parseMissionHash(location.hash);
      if (!scenario) return;
      setInput(scenario);
      requestAnimationFrame(() => document.getElementById("sovereign-world")?.scrollIntoView({ behavior: "instant" }));
    };
    restore();
    window.addEventListener("hashchange", restore);
    return () => window.removeEventListener("hashchange", restore);
  }, []);
  useEffect(() => {
    setShared(false);
    setShareError(false);
  }, [input]);
  async function shareMission() {
    const hash = missionHash(input);
    history.replaceState(null, "", hash);
    try {
      await navigator.clipboard.writeText(location.href);
      setShared(true);
    } catch {
      setShareError(true);
    }
  }

  useEffect(() => {
    latest.current = { ...latest.current, input, motion, playing };
    controller.current?.update(input, computeWorldOutcome(input));
    controller.current?.setMotion(motion);
    controller.current?.setPlaying(playing && motion);
  }, [input, motion, playing]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controller.current?.dispose();
      controller.current = null;
    };
  }, []);
  useEffect(() => {
    if (phase === "ready" && launchHadFocus.current && document.activeElement === document.body) {
      firstCameraControl.current?.focus({ preventScroll: true });
    }
  }, [phase]);

  const launch = async () => {
    if (phase === "loading" || phase === "ready") return;
    launchHadFocus.current = document.activeElement === launchButton.current;
    setPhase("loading");
    try {
      const { createSovereignWorld } = await import("./world-renderer");
      if (!mounted.current || !canvas.current) return;
      controller.current?.dispose();
      const settings = latest.current;
      controller.current = createSovereignWorld(canvas.current, settings.input, computeWorldOutcome(settings.input), {
        inspect: setInspection,
        viewChanged: () => setCameraView("custom"),
        unavailable: () => {
          if (mounted.current) {
            setPlaying(false);
            setPhase("unavailable");
          }
        },
      });
      controller.current.setMotion(settings.motion);
      controller.current.setPlaying(false);
      controller.current.setPropulsion(settings.propulsion);
      controller.current.setHullProgress(0);
      setPlaying(false);
      setHullProgress(0);
      setCameraView("hero");
      controller.current.select(inspection);
      setPhase("ready");
    } catch {
      if (mounted.current) setPhase("unavailable");
    }
  };
  const change = <K extends keyof WorldInput>(key: K, value: WorldInput[K]) =>
    setInput((previous) => ({ ...previous, [key]: value }));
  const inspectionContent = INSPECTIONS[inspection];
  const updateHull = (value: number, animate = false) => {
    setHullProgress(value);
    if (animate) controller.current?.setCutaway(value > 0);
    else controller.current?.setHullProgress(value);
  };
  const inspect = (zone: keyof typeof INSPECTIONS) => {
    setInspection(zone);
    controller.current?.select(zone);
    if (controller.current) {
      const open = zone === "local";
      updateHull(open ? 100 : 0, true);
      const view = open ? "top" : "hero";
      setCameraView(view);
      controller.current.setView(view);
    }
  };
  const frameView = (view: (typeof CAMERA_VIEWS)[number]["id"]) => {
    setCameraView(view);
    controller.current?.setView(view);
  };
  const manualCamera = (action: () => void) => {
    setCameraView("custom");
    action();
  };
  const permissionRelevant = input.architecture === "cloud" && input.sensitivity !== "public";

  return (
    <div className="sw-world">
      <div className={`sw-world-stage sw-world-${phase}`}>
        <div className="sw-stage-caption">
          <span>CSV SOVEREIGN / EXPLORER 01</span>
          <span>{input.connected ? "CLOUD RELAY CONNECTED" : "CLOUD RELAY OFFLINE"}</span>
        </div>
        <div className="sw-world-viewport">
          {phase !== "ready" && <WorldFallback />}
          <canvas ref={canvas} className="sw-world-canvas" aria-hidden="true" />
          {phase !== "ready" && (
            <div className="sw-world-launch">
              <span className="sw-launch-kicker">YOUR SHIP. YOUR INTELLIGENCE.</span>
              <button ref={launchButton} type="button" onClick={launch} disabled={phase === "loading"}>
                {phase === "loading"
                  ? "Preparing your starship…"
                  : phase === "unavailable"
                    ? "Try the starship again"
                    : "Board the starship"}
                <span aria-hidden="true">↗</span>
              </button>
              <p>
                {phase === "unavailable"
                  ? "3D rendering is unavailable here. The controls and comparison below still work."
                  : "Explore the ship. Open its hull. Follow the intelligence."}
              </p>
            </div>
          )}
        </div>
        <div className="sw-engineering" role="group" aria-label="Starship engineering">
          <span className="sw-results-kicker">ENGINEERING</span>
          <label htmlFor={`${id}-propulsion`}>
            <span>
              Propulsion <output htmlFor={`${id}-propulsion`}>{propulsion}%</output>
            </span>
            <input
              id={`${id}-propulsion`}
              type="range"
              min="0"
              max="100"
              step="1"
              value={propulsion}
              disabled={phase !== "ready"}
              aria-label="Starship propulsion"
              aria-valuetext={`${propulsion} percent`}
              onChange={(event) => {
                const value = Number(event.currentTarget.value);
                setPropulsion(value);
                controller.current?.setPropulsion(value);
              }}
            />
          </label>
          <label htmlFor={`${id}-hull`}>
            <span>
              Hull inspection <output htmlFor={`${id}-hull`}>{hullProgress}%</output>
            </span>
            <input
              id={`${id}-hull`}
              type="range"
              min="0"
              max="100"
              step="1"
              value={hullProgress}
              disabled={phase !== "ready"}
              aria-label="Hull inspection progress"
              aria-valuetext={`${hullProgress} percent open`}
              onChange={(event) => updateHull(Number(event.currentTarget.value))}
            />
          </label>
        </div>
        <div className="sw-ship-views">
          <div className="sw-view-presets" role="group" aria-label="Starship camera views">
            {CAMERA_VIEWS.map((view) => (
              <button
                key={view.id}
                ref={view.id === "hero" ? firstCameraControl : undefined}
                type="button"
                disabled={phase !== "ready"}
                aria-pressed={cameraView === view.id}
                onClick={() => frameView(view.id)}
              >
                {view.label}
              </button>
            ))}
          </div>
          <button
            className="sw-cutaway"
            type="button"
            disabled={phase !== "ready"}
            aria-pressed={cutaway}
            onClick={() => {
              const next = !cutaway;
              updateHull(next ? 100 : 0, true);
            }}
          >
            <span aria-hidden="true">◇</span> {cutaway ? "Close the hull" : "Open the hull"}
          </button>
        </div>
        <div className="sw-world-toolbar">
          <div className="sw-flow-control">
            <button
              type="button"
              disabled={phase !== "ready" || !motion}
              aria-pressed={playing && motion}
              onClick={() => setPlaying((previous) => !previous)}
            >
              <span aria-hidden="true">{playing && motion ? "Ⅱ" : "▷"}</span>
              {playing && motion ? "Pause request flow" : "Animate request flow"}
            </button>
          </div>
          <details className="sw-camera-details" open={!compact}>
            <summary>Adjust camera</summary>
            <div className="sw-camera-controls" role="group" aria-label="World camera controls">
              <button
                type="button"
                disabled={phase !== "ready"}
                onClick={() => manualCamera(() => controller.current?.rotate(-0.19))}
                aria-label="Rotate world left"
              >
                ←
              </button>
              <button
                type="button"
                disabled={phase !== "ready"}
                onClick={() => manualCamera(() => controller.current?.rotate(0.19))}
                aria-label="Rotate world right"
              >
                →
              </button>
              <button
                type="button"
                disabled={phase !== "ready"}
                onClick={() => manualCamera(() => controller.current?.rotate(0, -0.12))}
                aria-label="Lower world camera"
              >
                ↓
              </button>
              <button
                type="button"
                disabled={phase !== "ready"}
                onClick={() => manualCamera(() => controller.current?.rotate(0, 0.12))}
                aria-label="Raise world camera"
              >
                ↑
              </button>
              <button
                type="button"
                disabled={phase !== "ready"}
                onClick={() => manualCamera(() => controller.current?.zoom(-0.1))}
                aria-label="Zoom into world"
              >
                +
              </button>
              <button
                type="button"
                disabled={phase !== "ready"}
                onClick={() => manualCamera(() => controller.current?.zoom(0.1))}
                aria-label="Zoom out of world"
              >
                −
              </button>
              <button
                type="button"
                className="sw-reset-camera"
                disabled={phase !== "ready"}
                onClick={() => {
                  setCameraView("hero");
                  controller.current?.resetView();
                }}
              >
                Reset view
              </button>
            </div>
          </details>
        </div>
        <div className="sw-world-key">
          <span>
            <i className="sw-local-dot" />
            Local route
          </span>
          <span>
            <i className="sw-cloud-dot" />
            Cloud route
          </span>
          <span>
            <i className="sw-held-dot" />
            Waiting for a permitted route
          </span>
          <small>Drag to orbit · select the ship or relay</small>
        </div>
        <div className="sw-ship-inspector">
          {" "}
          <div className="sw-inspect-controls" role="group" aria-label="Inspect the starship systems">
            {(Object.keys(INSPECTIONS) as (keyof typeof INSPECTIONS)[]).map((zone) => (
              <button type="button" key={zone} aria-pressed={inspection === zone} onClick={() => inspect(zone)}>
                {INSPECTIONS[zone].title}
              </button>
            ))}
          </div>
          <details className="sw-inspection" open={!compact}>
            <summary>About {inspectionContent.title.toLowerCase()}</summary>
            <div aria-live="polite">
              <p>{inspectionContent.copy}</p>
            </div>
          </details>
        </div>
      </div>
      <p className="sw-world-status" role="status" aria-live="polite">
        {phase === "ready"
          ? "The starship is ready. Camera, hull and request-flow controls are now available."
          : phase === "loading"
            ? "Preparing the starship. Comparison controls remain available."
            : phase === "unavailable"
              ? "3D rendering is unavailable. The comparison controls and results remain fully available."
              : "The comparison is ready. Board the starship to explore it in 3D."}
      </p>
      <div className="sw-world-control-head">
        <div className="sw-mission-heading">
          <span className="sw-results-kicker">THE FLIGHT PLAN</span>
          <p>Choose a mission. Then change the architecture to compare.</p>
        </div>
        <div className="sw-mission-presets" role="group" aria-label="Mission scenarios">
          {MISSIONS.map((mission, index) => (
            <button
              key={mission.name}
              type="button"
              aria-pressed={Object.entries(mission.settings).every(
                ([key, value]) => input[key as keyof WorldInput] === value,
              )}
              onClick={() => setInput({ ...mission.settings })}
            >
              <span className="sw-mission-number" aria-hidden="true">
                0{index + 1}
              </span>
              <span>
                <strong>{mission.name}</strong>
                <small>{mission.detail}</small>
              </span>
              <span className="sw-mission-arrow" aria-hidden="true">
                ↗
              </span>
            </button>
          ))}
        </div>
        <fieldset className="sw-architectures">
          <legend>Choose the architecture</legend>
          {ARCHITECTURES.map((architecture) => (
            <label key={architecture.id} className={input.architecture === architecture.id ? "sw-selected" : ""}>
              <input
                type="radio"
                name={`${id}-architecture`}
                value={architecture.id}
                checked={input.architecture === architecture.id}
                onChange={() => change("architecture", architecture.id)}
              />
              <span>
                <strong>{architecture.name}</strong>
                <small>{architecture.detail}</small>
              </span>
            </label>
          ))}
        </fieldset>
        <div className="sw-world-settings">
          <label className="sw-sensitivity" htmlFor={`${id}-sensitivity`}>
            <span>Workload sensitivity</span>
            <select
              id={`${id}-sensitivity`}
              value={input.sensitivity}
              onChange={(event) => change("sensitivity", event.target.value as WorldSensitivity)}
            >
              <option value="mixed">Mixed · 6 private + 6 public</option>
              <option value="private">All private · 12 requests</option>
              <option value="public">All public · 12 requests</option>
            </select>
          </label>
          <label className="sw-check-setting">
            <input
              type="checkbox"
              checked={input.connected}
              onChange={(event) => change("connected", event.target.checked)}
            />
            <span>
              <strong>Internet available</strong>
              <small>{input.connected ? "Connected" : "Disconnected · test the fallback"}</small>
            </span>
          </label>
          <label className={`sw-check-setting ${permissionRelevant ? "" : "sw-not-applicable"}`}>
            <input
              type="checkbox"
              checked={input.allowPrivateEgress}
              disabled={!permissionRelevant}
              onChange={(event) => change("allowPrivateEgress", event.target.checked)}
            />
            <span>
              <strong>Permit private cloud requests</strong>
              <small>
                {permissionRelevant
                  ? "Explicit permission in this illustration"
                  : "Only applies to private requests in Cloud mode"}
              </small>
            </span>
          </label>
        </div>
      </div>
      <div className="sw-world-results">
        <div className="sw-outcome" aria-live="polite" aria-atomic="true">
          <span className="sw-results-kicker">THE SAME {TOTAL_REQUESTS}-REQUEST WORKLOAD</span>
          <div className="sw-outcome-counts">
            <div>
              <strong>{outcome.local}</strong>
              <span>Handled locally</span>
            </div>
            <div>
              <strong>{outcome.cloud}</strong>
              <span>Sent to cloud</span>
            </div>
            <div>
              <strong>{outcome.held}</strong>
              <span>Held for review</span>
            </div>
          </div>
          <p className="sw-outcome-summary">{outcome.summary}</p>
          <details className="sw-outcome-notes" open={!compact}>
            <summary>Data boundary & connection</summary>
            <dl>
              <div>
                <dt>Data boundary</dt>
                <dd>{outcome.dataHandling}</dd>
              </div>
              <div>
                <dt>Connection dependency</dt>
                <dd>{outcome.internetDependency}</dd>
              </div>
            </dl>
          </details>
        </div>
        <details className="sw-comparison" open={!compact}>
          <summary>Compare all three architectures</summary>
          <table>
            <caption>Compare all three with these same settings</caption>
            <thead>
              <tr>
                <th scope="col">Architecture</th>
                <th scope="col">Local</th>
                <th scope="col">Cloud</th>
                <th scope="col">Held</th>
              </tr>
            </thead>
            <tbody>
              {ARCHITECTURES.map((architecture) => {
                const result = computeWorldOutcome({ ...input, architecture: architecture.id });
                return (
                  <tr
                    key={architecture.id}
                    className={input.architecture === architecture.id ? "sw-comparison-selected" : ""}
                  >
                    <th scope="row">{architecture.name}</th>
                    <td>{result.local}</td>
                    <td>{result.cloud}</td>
                    <td>{result.held}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="sw-comparison-note">
            “Held” means the model has no permitted route. Moving packets show routing, not measured speed or
            throughput.
          </p>
        </details>
      </div>
      <div className="sw-share-mission">
        <div>
          <strong>A scenario worth sharing.</strong>
          <p>Send someone these exact choices. Let them try the next move.</p>
        </div>
        <button type="button" className="o-button" onClick={shareMission}>
          {shared ? "Mission link copied ✓" : "Copy this mission ↗"}
        </button>
        <span className="o-sr-only" role="status">
          {shared ? "Mission link copied to your clipboard." : ""}
        </span>
        {shareError && <p role="status">Copy the address in your browser to share these choices.</p>}
      </div>
      <p className="sw-world-boundary">
        Here, Sovereign means a fully local deployment. This is a routing illustration, not a vendor ranking or
        performance benchmark. It assumes both local and cloud models can handle this workload. No actual AI or
        infrastructure services are contacted.
        {!motion && " Motion is off. Camera controls still work; automatic request flow stays paused."}
      </p>
      <noscript>
        <p className="sw-world-boundary">
          JavaScript is required to change the scenario or launch 3D. The comparison above shows the initial mixed
          workload with an available internet connection and private cloud permission off.
        </p>
      </noscript>
    </div>
  );
}
