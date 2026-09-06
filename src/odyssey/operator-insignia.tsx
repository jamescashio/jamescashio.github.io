import { useEffect, useRef, useState, type MouseEvent } from "react";
import { BrandMark } from "./brand-mark";
import { Core } from "./effects";

/** The owner's mark inside an original orbital frame. All motion follows the page's controls. */
export function OperatorInsignia({
  motion,
  onExplore,
}: {
  motion: boolean;
  onExplore: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reduced, setReduced] = useState(true);
  const [signal, setSignal] = useState(0);
  const [energized, setEnergized] = useState(false);
  const signalRemaining = useRef(3400);
  const signalGeneration = useRef(0);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const preference = () => setReduced(query.matches);
    const visibility = () => setPageVisible(!document.hidden);
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (entry) setVisible(entry.isIntersecting);
      },
      { threshold: 0.01 },
    );
    preference();
    visibility();
    if (panel.current) observer.observe(panel.current);
    query.addEventListener("change", preference);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      observer.disconnect();
      query.removeEventListener("change", preference);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  const animated = motion && visible && pageVisible && !reduced;
  useEffect(() => {
    if (!energized || !animated) return;
    const started = performance.now();
    const generation = signalGeneration.current;
    const timer = setTimeout(() => setEnergized(false), signalRemaining.current);
    return () => {
      clearTimeout(timer);
      if (generation === signalGeneration.current)
        signalRemaining.current = Math.max(0, signalRemaining.current - (performance.now() - started));
    };
  }, [energized, animated, signal]);
  const resetDepth = () => {
    panel.current?.style.setProperty("--hc-depth-x", "0deg");
    panel.current?.style.setProperty("--hc-depth-y", "0deg");
  };
  return (
    <div
      ref={panel}
      className="ah-insignia hc-identity"
      data-animated={animated ? "true" : "false"}
      data-energized={energized ? "true" : "false"}
      onPointerMove={(event) => {
        if (!animated || event.pointerType !== "mouse") return;
        const bounds = event.currentTarget.getBoundingClientRect();
        const x = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width) * 2 - 1));
        const y = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height) * 2 - 1));
        event.currentTarget.style.setProperty("--hc-depth-x", `${-y * 3.5}deg`);
        event.currentTarget.style.setProperty("--hc-depth-y", `${x * 3.5}deg`);
      }}
      onPointerLeave={resetDepth}
    >
      <div className="ah-insignia-cap hc-identity-cap">
        <span>HOUSE CASHIO</span>
        <Core />
      </div>
      <div className="hc-identity-scene" aria-hidden="true">
        <svg className="hc-identity-drawing" viewBox="0 0 400 400" fill="none">
          <g className="hc-identity-grid">
            <path d="M200 20v44m0 272v44M20 200h35m290 0h35M60 60l27 27m226 226 27 27M60 340l27-27m226-226 27-27" />
            <circle cx="200" cy="200" r="176" />
            <circle cx="200" cy="200" r="147" />
            <path d="M41 117h31m256 166h31M108 354v-16M292 62V46" />
          </g>
          <g className="hc-identity-ticks">
            {Array.from({ length: 60 }, (_, index) => (
              <path
                key={index}
                d={index % 5 === 0 ? "M200 26v10" : "M200 26v3"}
                transform={`rotate(${index * 6} 200 200)`}
              />
            ))}
          </g>
          <circle className="hc-identity-track" cx="200" cy="200" r="158" />
          <g className="hc-identity-motion hc-identity-outer">
            <circle cx="200" cy="200" r="167" pathLength="100" strokeDasharray="21 7 3 69" />
            <path d="M200 29v9m147 69-8 5m-264 176 9-5" />
          </g>
          <g className="hc-identity-motion hc-identity-inner">
            <circle cx="200" cy="200" r="138" pathLength="100" strokeDasharray="17 8 4 71" />
            <circle cx="200" cy="62" r="3" />
          </g>
          <g className="hc-identity-motion hc-identity-signal">
            <circle
              className="hc-identity-signal-tail"
              cx="200"
              cy="200"
              r="158"
              pathLength="100"
              strokeDasharray="7 93"
              transform="rotate(-115 200 200)"
            />
            <circle className="hc-identity-signal-halo" cx="200" cy="42" r="10" />
            <circle className="hc-identity-signal-point" cx="200" cy="42" r="4.5" />
            <circle className="hc-identity-signal-center" cx="200" cy="42" r="1.6" />
          </g>
          <path className="hc-identity-lens" d="M76 130h248l22 22v79l-22 22H76l-22-22v-79Z" />
          <path className="hc-identity-lens-edge" d="M89 130H76l-22 22v16m270 85h13l9-9v-22M96 258h72m64-134h70" />
          <path className="hc-identity-channels" d="M98 267h69l17 17m118-17h-69l-17 17M200 324v15" />
          <g className="hc-identity-resonance-grid">
            <ellipse cx="200" cy="200" rx="185" ry="76" transform="rotate(-31 200 200)" />
            <ellipse cx="200" cy="200" rx="185" ry="76" transform="rotate(31 200 200)" />
          </g>
          {signal > 0 && (
            <g key={signal} className="hc-identity-command">
              <path className="hc-identity-command-path" d="M200 302v-34l-39-28v-45h39" pathLength="100" />
              <path
                className="hc-identity-command-path hc-identity-command-return"
                d="M200 195h39v45l-39 28v34"
                pathLength="100"
              />
              <ellipse
                className="hc-identity-command-orbit"
                cx="200"
                cy="200"
                rx="185"
                ry="76"
                pathLength="100"
                transform="rotate(-31 200 200)"
              />
              <ellipse
                className="hc-identity-command-orbit hc-identity-command-orbit-gold"
                cx="200"
                cy="200"
                rx="185"
                ry="76"
                pathLength="100"
                transform="rotate(31 200 200)"
              />
            </g>
          )}
          <ellipse className="hc-identity-core-shadow" cx="200" cy="316" rx="25" ry="5" />
          <g className="hc-identity-motion hc-identity-bit">
            <path className="hc-identity-bit-face" d="m200 275 22 13-5 25-17 10-17-10-5-25Z" />
            <path className="hc-identity-bit-shade" d="m200 275 0 25-17 13-5-25Zm0 25 22-12-5 25-17 10Z" />
            <path
              className="hc-identity-bit-edge"
              d="m200 275 0 25 22-12m-22 12-22-12m22 12-17 13m17-13 17 13m-17-13v23"
            />
          </g>
          <g className="hc-identity-stars">
            <path d="m304 87 2 6 6 2-6 2-2 6-2-6-6-2 6-2ZM78 288l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" />
            <circle cx="115" cy="89" r="1.5" />
            <circle cx="307" cy="301" r="1.4" />
          </g>
          <path className="hc-identity-corners" d="M21 54V21h33m292 0h33v33m0 292v33h-33M54 379H21v-33" />
        </svg>
        <div className="hc-identity-brand">
          <BrandMark motion={animated} large signal={signal} charged={energized && animated} />
        </div>
        <span className="hc-identity-authority">A HUMAN IN COMMAND</span>
      </div>
      <div className="hc-identity-signal-control">
        <button
          className="hc-identity-energize"
          type="button"
          disabled={!animated}
          onClick={() => {
            signalGeneration.current += 1;
            signalRemaining.current = 3400;
            setSignal((previous) => previous + 1);
            setEnergized(true);
          }}
        >
          <span className="hc-identity-signal-glyph" aria-hidden="true">
            ◇
          </span>
          Energize the signature
          <span aria-hidden="true">↗</span>
        </button>
        <span className="o-sr-only" role="status">
          {energized ? "Your signal is traveling through the Cashio signature." : ""}
        </span>
      </div>
      <button className="hc-identity-explore" type="button" onClick={onExplore}>
        Explore the celestial signature <span aria-hidden="true">↗</span>
      </button>
      <div className="ah-insignia-foot hc-identity-foot">
        <span>OWNER · BUILDER · OPERATOR</span>
        <span>IMAGINATION, WITH INTENTION.</span>
      </div>
    </div>
  );
}
