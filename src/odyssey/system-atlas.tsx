import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { ATLAS } from "./data";

const ROUTES = ["M50 42V13", "M50 13V42", "M50 42C50 58 25 55 25 73", "M50 42C50 58 75 55 75 73"] as const;
const RETURN_ROUTES = ["M25 73C25 55 50 58 50 42V13", "M75 73C75 55 50 58 50 42V13"] as const;
type Trace = { step: number; destination: 2 | 3; playing: boolean; complete: boolean };
const STEP_MS = 2000;

function AtlasGlyph({ kind }: { kind: number }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" className="sa-node-glyph">
      {kind === 0 ? (
        <>
          <path className="sa-glyph-surface" d="M32 5 55 18v28L32 59 9 46V18Z" />
          <path className="sa-glyph-fine" d="M32 9 51 20v24L32 55 13 44V20Z" />
          <circle className="sa-glyph-bright" cx="32" cy="24" r="7" />
          <path className="sa-glyph-main" d="M20 44v-3c0-11 24-11 24 0v3M24 47h16" />
          <path className="sa-glyph-shade" d="m32 5 23 13v28L32 59v-5l18-11V21L32 10Z" />
          <path className="sa-glyph-fine" d="M5 23v18M59 23v18M28 2h8M28 62h8" />
        </>
      ) : kind === 1 ? (
        <>
          <path className="sa-glyph-surface" d="M32 3 55 18l-4 30-19 13-19-13-4-30Z" />
          <path className="sa-glyph-shade" d="M32 3v24l19 21 4-30ZM32 27v34L13 48Z" />
          <path className="sa-glyph-main" d="M32 3v24m0 34V27M9 18l23 9 23-9M13 48l19-21 19 21" />
          <path className="sa-glyph-bright" d="m32 17 11 13-11 16-11-16Z" />
          <path className="sa-glyph-fine" d="m32 23 6 7-6 9-6-9Z" />
          <path className="sa-glyph-fine" d="m17 20 15-9 15 9M18 46l14 10 14-10M27 30h10m-5-5v11" />
        </>
      ) : (
        <>
          <path className="sa-glyph-surface" d="m13 13 20-7 20 9v36l-20 8-20-9Z" />
          <path className="sa-glyph-shade" d="m33 22 20-7v36l-20 8Z" />
          <path className="sa-glyph-main" d="m13 13 20 9 20-7M33 22v37" />
          {kind === 2 ? (
            <>
              <path className="sa-glyph-bright" d="m17 21 12 5v5l-12-5Zm0 10 12 5v5l-12-5Zm0 10 12 5v5l-12-5Z" />
              <path className="sa-glyph-fine" d="m38 26 10-4m-10 11 10-4m-10 11 10-4m-10 11 10-4" />
              <path className="sa-glyph-main" d="m21 14 12-4 12 5-12 4Z" />
            </>
          ) : (
            <>
              <path className="sa-glyph-bright" d="m18 22 4 2v24l-4-2Zm7 3 4 2v24l-4-2Z" />
              <path className="sa-glyph-fine" d="M39 27v22m5-24v22m5-24v22M17 17l12 5" />
              <path className="sa-glyph-main" d="m21 13 12 5 12-4" />
            </>
          )}
          <path className="sa-glyph-fine" d="M8 19v32l22 10M57 20v32l-17 7" />
          <path className="sa-glyph-fine" d="m17 12 16 7 16-5M36 54l13-5M17 48l12 5" />
        </>
      )}
    </svg>
  );
}

export function SystemAtlas({
  selected,
  onSelect,
  motion = true,
}: {
  selected: number;
  onSelect: (index: number) => void;
  motion?: boolean;
}) {
  const selectedIndex = Number.isInteger(selected) && selected >= 0 && selected < ATLAS.length ? selected : 0;
  const [trace, setTrace] = useState<Trace | null>(null);
  const [visible, setVisible] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [reduced, setReduced] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const elapsed = useRef(0);
  const lastSelection = useRef(selectedIndex);
  const index = trace ? [0, 1, trace.destination, 0][trace.step] : selectedIndex;
  const node = ATLAS[index];
  const uid = useId();
  const enabled = motion && visible && !hidden && !reduced;
  const running = enabled && Boolean(trace?.playing);
  const visualRunning = enabled && (!trace || trace.playing);
  const route = trace
    ? [ROUTES[1], ROUTES[trace.destination], RETURN_ROUTES[trace.destination - 2], ROUTES[0]][trace.step]
    : ROUTES[index];
  const routeKey = trace ? `trace-${trace.step}-${trace.destination}` : node.id;
  const compute = ATLAS[trace?.destination ?? (selectedIndex === 3 ? 3 : 2)].name;
  const steps = [
    ["Human intent", "A person defines the request and its boundaries."],
    ["HERMES qualifies", `The conceptual route passes through qualification toward ${compute}.`],
    [`${compute} · example compute`, "This chosen host illustrates execution, not a published service location."],
    ["Human review", "The example returns evidence to a person for the consequential decision."],
  ];

  useEffect(() => {
    const element = root.current;
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const preferences = () => setReduced(query.matches);
    const visibility = () => setHidden(document.hidden);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.06 });
    preferences();
    visibility();
    if (element) observer.observe(element);
    query.addEventListener("change", preferences);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      observer.disconnect();
      query.removeEventListener("change", preferences);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);

  useEffect(() => {
    if (lastSelection.current !== selectedIndex) {
      lastSelection.current = selectedIndex;
      elapsed.current = 0;
      setTrace(null);
    }
  }, [selectedIndex]);

  useEffect(() => {
    if (!running) return;
    let frame = 0;
    let previous = performance.now();
    const carriers = root.current?.querySelectorAll<SVGPathElement>(".sa-route-carrier");
    const advance = (now: number) => {
      // Visibility events stop scheduling; this guard also rejects a queued
      // frame before React has applied the hidden-page state.
      if (document.hidden) return;
      elapsed.current += now - previous;
      previous = now;
      carriers?.forEach((carrier) => {
        carrier.style.strokeDashoffset = String((-Math.min(elapsed.current, STEP_MS) / STEP_MS) * 100);
      });
      if (root.current) root.current.dataset.traceElapsed = String(Math.round(elapsed.current));
      if (elapsed.current >= STEP_MS) {
        elapsed.current = 0;
        setTrace((current) =>
          current && current.playing
            ? current.step === 3
              ? { ...current, playing: false, complete: true }
              : { ...current, step: current.step + 1 }
            : current,
        );
      } else frame = requestAnimationFrame(advance);
    };
    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
  }, [running, trace?.step]);

  function controlTrace() {
    if (!trace || trace.complete || reduced) {
      elapsed.current = 0;
      setTrace({ step: 0, destination: selectedIndex === 3 ? 3 : 2, playing: !reduced, complete: false });
    } else setTrace({ ...trace, playing: !trace.playing && !reduced });
  }
  function stepTrace(delta: number) {
    if (!trace) return;
    const step = Math.max(0, Math.min(3, trace.step + delta));
    elapsed.current = 0;
    setTrace({ ...trace, step, playing: false, complete: step === 3 });
  }
  return (
    <div
      ref={root}
      className="o-atlas-layout sa-system-atlas"
      data-selected={node.id}
      data-atlas-motion={motion && !reduced ? "on" : "off"}
      data-trace-step={trace?.step}
      data-trace-state={trace ? (trace.complete ? "complete" : running ? "playing" : "paused") : "idle"}
      data-trace-elapsed={Math.round(elapsed.current)}
      style={{ "--play-state": visualRunning ? "running" : "paused" } as CSSProperties}
    >
      <div className="sa-trace">
        <span className="o-micro">CONCEPTUAL REQUEST / {compute.toUpperCase()}</span>
        <p role="status" aria-atomic="true">
          {trace ? (
            <>
              <strong>
                0{trace.step + 1} / 04 · {steps[trace.step][0]}
              </strong>
              <br />
              {steps[trace.step][1]}
            </>
          ) : (
            "Follow one example from human intent to human review. No request is sent."
          )}
        </p>
        <div className="sa-trace-controls" role="group" aria-label="Explore the conceptual request">
          <button type="button" onClick={controlTrace}>
            {!trace
              ? "Trace a request"
              : trace.complete
                ? "Replay trace"
                : reduced
                  ? "Restart trace"
                  : trace.playing
                    ? "Pause trace"
                    : "Resume trace"}
          </button>
          <button
            type="button"
            onClick={() => stepTrace(-1)}
            disabled={!trace || trace.step === 0}
            aria-label="Previous trace step"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => stepTrace(1)}
            disabled={!trace || trace.step === 3}
            aria-label="Next trace step"
          >
            →
          </button>
        </div>
        <small>
          {reduced
            ? "Step through at your own pace."
            : trace?.playing && !enabled
              ? "Motion suspended. You can still step manually."
              : trace?.complete
                ? "Trace complete. Choose a node or replay."
                : "About 8 seconds · conceptual, not live routing"}
        </small>
      </div>
      <div className="o-atlas sa-chart" aria-label="Explore the public system architecture">
        <div className="sa-chart-label" aria-hidden="true">
          <span>SYSTEM ATLAS</span>
          <span>CONCEPTUAL VIEW</span>
        </div>
        <svg className="sa-engraving" viewBox="0 0 600 600" preserveAspectRatio="none" fill="none" aria-hidden="true">
          <defs>
            <radialGradient id={`${uid}-plate`} cx="50%" cy="43%" r="64%">
              <stop offset="0" stopColor="#fbfeff" />
              <stop offset=".63" stopColor="#e6f1f5" />
              <stop offset="1" stopColor="#d1e4ec" />
            </radialGradient>
            <linearGradient id={`${uid}-metal`} x1=".1" y1="0" x2=".9" y2="1" gradientUnits="objectBoundingBox">
              <stop offset="0" stopColor="#729db1" stopOpacity=".75" />
              <stop offset=".45" stopColor="#c4dde7" stopOpacity=".42" />
              <stop offset="1" stopColor="#39768f" stopOpacity=".66" />
            </linearGradient>
          </defs>
          <rect
            x=".5"
            y=".5"
            width="599"
            height="599"
            fill={`url(#${uid}-plate)`}
            stroke="#729bad"
            strokeOpacity=".32"
          />
          <path
            className="sa-engraved-fine"
            d="M22 100V65h35M543 65h35v35M22 500v35h35M543 535h35v-35M80 22h70m300 0h70M80 578h70m300 0h70"
          />
          <path className="sa-engraved-fine sa-construction" d="M300 43v492M42 252h516M150 396v103M450 396v103" />
          <ellipse className="sa-engraved-outer" cx="300" cy="286" rx="244" ry="213" stroke={`url(#${uid}-metal)`} />
          <ellipse className="sa-engraved-fine" cx="300" cy="286" rx="232" ry="201" />
          <ellipse className="sa-engraved-fine sa-construction" cx="300" cy="286" rx="186" ry="158" />
          <ellipse className="sa-engraved-fine" cx="300" cy="252" rx="90" ry="75" />
          <ellipse className="sa-core-orbit" cx="300" cy="252" rx="103" ry="85" />
          <path className="sa-engraved-fine" d="M56 286h13m462 0h13M300 73v13m0 400v13M285 286h30m-15-15v30" />
          {Array.from({ length: 60 }, (_, tick) => {
            const angle = (tick / 60) * Math.PI * 2;
            const major = tick % 5 === 0;
            const inner = major ? 0.935 : 0.967;
            const x = Math.cos(angle) * 244;
            const y = Math.sin(angle) * 213;
            return (
              <path
                key={tick}
                className={major ? "sa-scale-major" : "sa-scale-minor"}
                d={`M${(300 + x * inner).toFixed(3)} ${(286 + y * inner).toFixed(3)}L${(300 + x).toFixed(3)} ${(286 + y).toFixed(3)}`}
              />
            );
          })}
          <path className="sa-orbital-accent" d="M79 200C111 133 182 87 266 76M521 372c-32 67-103 113-187 124" />
          <g className="sa-fasteners">
            <circle cx="22" cy="22" r="3" />
            <circle cx="578" cy="22" r="3" />
            <circle cx="22" cy="578" r="3" />
            <circle cx="578" cy="578" r="3" />
            <path d="m20 20 4 4m552-4 4 4M20 576l4 4m552-4 4 4" />
          </g>
        </svg>
        <svg className="sa-routes" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none" aria-hidden="true">
          <path className="sa-route-bed" d="M50 13V42M50 42C50 58 25 55 25 73M50 42C50 58 75 55 75 73" />
          <path className="sa-route-wire" d="M50 13V42M50 42C50 58 25 55 25 73M50 42C50 58 75 55 75 73" />
          <path className="sa-route-active" key={routeKey} pathLength="1" d={route} />
          <path
            className="sa-route-carrier"
            key={`${routeKey}-carrier`}
            pathLength="100"
            d={route}
            style={trace ? { strokeDashoffset: (-elapsed.current / STEP_MS) * 100 } : undefined}
          />
          <path
            className="sa-route-carrier sa-route-carrier-tail"
            key={`${routeKey}-tail`}
            pathLength="100"
            d={route}
            style={trace ? { strokeDashoffset: (-elapsed.current / STEP_MS) * 100 } : undefined}
          />
          <path className="sa-route-junction" d="m50 49-1.5 1.5L50 52l1.5-1.5Z" />
        </svg>
        {ATLAS.map((item, i) => (
          <button
            key={item.id}
            style={{ left: `${item.x}%`, top: `${item.y}%` }}
            className={`o-atlas-node sa-node ${index === i ? "selected" : ""} ${item.id}`}
            aria-pressed={index === i}
            onClick={() => {
              elapsed.current = 0;
              setTrace(null);
              onSelect(i);
            }}
            type="button"
          >
            <span className="o-node-icon sa-node-face">
              <span className="sa-node-bezel" aria-hidden="true" />
              {index === i && <span className="sa-node-acquisition" key={routeKey} aria-hidden="true" />}
              <AtlasGlyph kind={i} />
            </span>
            <strong>{item.name}</strong>
            <small>{item.role}</small>
          </button>
        ))}
        <span className="o-atlas-caption o-micro">SELECT A NODE TO EXPLORE</span>
      </div>
      <div className="o-atlas-readout sa-readout" aria-live={trace ? "off" : "polite"} aria-atomic="true">
        <span className="o-micro">
          0{index + 1} / {node.role}
        </span>
        <h3>{node.name}</h3>
        <div className="o-atlas-value">
          {node.value}
          <span>{node.unit}</span>
        </div>
        <h4>{node.summary}</h4>
        <p>{node.body}</p>
        <div className="o-evidence-stamp">
          <i />
          {node.evidence}
        </div>
      </div>
    </div>
  );
}
