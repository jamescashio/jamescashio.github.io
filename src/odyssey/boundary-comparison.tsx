import { useEffect, useId, useRef, useState } from "react";
import { routeExample } from "./data";
import { shareExperiment } from "./study-experiment";
import { loadStudyExample } from "./study-navigation";
import { InstrumentMaterials } from "./study-engravings";

const publicRequest = { study: "hermes", intent: "analyze", sources: true, privateData: false } as const;
const privateRequest = { ...publicRequest, privateData: true };

/** A paired view of the existing model, with a prediction before the second result. */
export function BoundaryComparison() {
  const id = useId();
  const [prediction, setPrediction] = useState<"research" | "human" | null>(null);
  const [revealed, setRevealed] = useState(false);
  const firstChoice = useRef<HTMLInputElement>(null);
  const verdict = useRef<HTMLDivElement>(null);
  const previousReveal = useRef(false);
  useEffect(() => {
    if (previousReveal.current !== revealed) {
      (revealed ? verdict.current : firstChoice.current)?.focus({ preventScroll: true });
      previousReveal.current = revealed;
    }
  }, [revealed]);
  const before = routeExample(publicRequest),
    after = routeExample(privateRequest);
  return (
    <section
      id="boundary-comparison"
      className="o-boundary-comparison"
      data-revealed={revealed}
      aria-labelledby="build-story-title"
    >
      <header>
        <span className="o-kicker">THE PRIVACY TEST / ABOUT 20 SECONDS</span>
        <h3 id="build-story-title">One change. Who decides?</h3>
        <p>Analyze a document and require sources. Now make that document private.</p>
      </header>
      <div className="o-boundary-pair">
        {[false, true].map((privateData) => {
          const visible = !privateData || revealed;
          return (
            <div className="o-boundary-route" key={String(privateData)} data-private={privateData}>
              <span className="o-boundary-label">{privateData ? "02 / PRIVATE DOCUMENT" : "01 / PUBLIC DOCUMENT"}</span>
              <svg viewBox="0 0 360 96" aria-hidden="true">
                <InstrumentMaterials id={`${id}-${privateData}`} />
                <path className="o-boundary-grid" d="M8 24H352 M8 72H352 M88 12V84 M180 12V84 M272 12V84" />
                <path className="o-boundary-bed" d="M36 48H320" />
                <path className="o-boundary-track" d="M36 48H320" />
                <path className="o-boundary-signal" pathLength="1" d={privateData ? "M36 48H180" : "M36 48H320"} />
                <path className="o-boundary-document" d="M20 25h28l10 10v36H20Z M48 25v12h10 M28 46h22 M28 55h16" />
                <ellipse cx="180" cy="76" rx="30" ry="6" fill="#020a11" stroke="#43515e" />
                <circle className="o-boundary-halo" cx="180" cy="48" r="32" />
                <g className="o-boundary-core">
                  <path fill={`url(#${id}-${privateData}-champagne)`} d="m180 18 25 16-5 32-20 15-20-15-5-32Z" />
                  <path className="o-boundary-facet" d="m180 18 0 29 25-13Z" />
                  <path className="o-boundary-facet-dark" d="m180 47 20 19-20 15Z" />
                  <path fill="none" d="m155 34 25 13 25-13 M180 47v34 M160 66l20-19 20 19" />
                </g>
                {privateData ? (
                  <path
                    className="o-boundary-destination"
                    d="M302 35v-7a12 12 0 0 1 24 0v7 M298 35h32v29h-32Z M314 44v10"
                  />
                ) : (
                  <g className="o-boundary-destination">
                    <circle cx="313" cy="46" r="18" />
                    <path d="m326 60 12 12 M305 46h16 M313 38v16" />
                  </g>
                )}
                <circle className="o-boundary-pulse" cx={privateData ? 180 : 280} cy="48" r="4" />
                {privateData && <path className="o-boundary-stop" d="M228 31V65 M235 31V65" />}
              </svg>
              <strong>{visible ? (privateData ? after.lane : before.lane) : "Your call."}</strong>
              <p>
                {privateData
                  ? revealed
                    ? "External execution is held. A person must authorize the route."
                    : "The work and source requirement stay the same. Only privacy changes."
                  : "Attributable sources select the research route."}
              </p>
            </div>
          );
        })}
      </div>
      <div className="o-boundary-decision">
        {!revealed ? (
          <>
            <fieldset>
              <legend>Predict the private document’s route</legend>
              <div className="o-boundary-choices">
                <label>
                  <input
                    ref={firstChoice}
                    type="radio"
                    name={id}
                    checked={prediction === "research"}
                    onChange={() => setPrediction("research")}
                  />
                  Keep Research
                </label>
                <label>
                  <input
                    type="radio"
                    name={id}
                    checked={prediction === "human"}
                    onChange={() => setPrediction("human")}
                  />
                  Human review
                </label>
              </div>
            </fieldset>
            <button
              className="o-button o-button-gold"
              type="button"
              disabled={!prediction}
              onClick={() => setRevealed(true)}
            >
              Reveal the private route <span aria-hidden="true">↗</span>
            </button>
          </>
        ) : (
          <div
            className="o-boundary-verdict"
            ref={verdict}
            tabIndex={-1}
            role="region"
            aria-label="Private document result"
          >
            <span className="o-kicker">
              {prediction === "human" ? "YOU FOUND THE BOUNDARY" : "PRIVACY CHANGES THE ANSWER"}
            </span>
            <strong>Privacy takes priority.</strong>
            <p>
              The document stays behind the boundary. A person must authorize an external route—even when the task
              requires sources. Try changing the inputs in HERMES below.
            </p>
            <button
              className="o-text-button"
              type="button"
              onClick={() => {
                setRevealed(false);
                setPrediction(null);
              }}
            >
              Try the comparison again ↺
            </button>
          </div>
        )}
      </div>
      <nav className="o-story-comparison" aria-label="Compare HERMES privacy decisions">
        <a className="o-text-button" href={shareExperiment(publicRequest)} onClick={loadStudyExample}>
          1. Load a public request ↗
        </a>
        <a className="o-text-button" href={shareExperiment(privateRequest)} onClick={loadStudyExample}>
          2. Load the private version ↗
        </a>
      </nav>
      <p className="o-boundary-note">Browser-only illustration. No document is uploaded and no AI request is sent.</p>
    </section>
  );
}
