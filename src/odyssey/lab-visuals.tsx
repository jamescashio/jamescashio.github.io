import { useId } from "react";

export function RouteInstrument({ step, code }: { step: number; code: string }) {
  return (
    <div className="lv-route-instrument lv-instrument" aria-hidden="true">
      <div className="lv-instrument-caption">
        <span>ROUTE QUALIFICATION</span>
        <span>{String(step).padStart(2, "0")} / 05</span>
      </div>
      <svg viewBox="0 0 560 190" fill="none">
        <path
          className="lv-grid-line"
          d="M24 44h512M24 94h512M24 144h512M80 24v145M180 24v145M280 24v145M380 24v145M480 24v145"
        />
        <path className="lv-machine-rule" d="M20 53V25h28m464 0h28v28M20 131v28h28m464 0h28v-28" />
        <path className="lv-route-bed" d="M83 94h133m128 0h133" />
        <path
          key={`in-${step}`}
          className={`lv-energized ${step > 0 ? "lv-energized-active lv-draw" : ""}`}
          pathLength="1"
          d="M83 94h133"
        />
        <path
          key={`out-${step}`}
          className={`lv-energized ${step === 5 ? "lv-energized-active lv-draw" : ""}`}
          pathLength="1"
          d="M344 94h133"
        />
        <circle className="lv-machine-rule" cx="280" cy="94" r="63" />
        <circle className="lv-fine-ring" cx="280" cy="94" r="54" />
        <path className="lv-core-face" d="m280 54 32 20-6 45-26 16-26-16-6-45Z" />
        <path className="lv-core-fold" d="m280 54 0 33 32-13m-32 13-26 32m26-32 26 32m-26-32v48m-32-61 32 13" />
        <path className="lv-chip-face" d="m48 69 25 13v25l-25 13-25-13V82Z" />
        <path className="lv-chip-line" d="m37 88 11-6 11 6-11 6Zm0 10 11 6 11-6" />
        <path
          className={`lv-chip-face ${step === 5 ? "lv-complete-face" : ""}`}
          d="m512 69 25 13v25l-25 13-25-13V82Z"
        />
        <path className="lv-chip-line" d={step === 5 ? "m500 94 8 8 17-19" : "M500 86h24m-24 8h24m-24 8h15"} />
        {[130, 165, 200, 360, 400].map((x, index) => (
          <rect
            key={x}
            className={step > index ? "lv-step-lit" : "lv-step-unlit"}
            x={x - 2}
            y="91"
            width="5"
            height="6"
          />
        ))}
        <text className="lv-svg-label" x="48" y="153" textAnchor="middle">
          INTENT
        </text>
        <text className="lv-svg-label" x="280" y="176" textAnchor="middle">
          POLICY CORE
        </text>
        <text className="lv-svg-label" x="512" y="153" textAnchor="middle">
          {step === 5 ? code : "DECISION"}
        </text>
      </svg>
    </div>
  );
}

export function StageSymbol({ stage }: { stage: number }) {
  return (
    <svg viewBox="0 0 60 60" fill="none" aria-hidden="true">
      <path className="lv-stage-hull" d="m30 3 24 14v27L30 57 6 44V17Z" />
      {stage === 0 ? (
        <path d="m17 29 9 9 18-20M18 46h24" />
      ) : stage === 1 ? (
        <>
          <circle cx="27" cy="26" r="10" />
          <path d="m35 34 10 11M19 13l-6 6m28-6 6 6" />
        </>
      ) : (
        <>
          <circle cx="30" cy="21" r="7" />
          <path d="M16 44v-4c0-13 28-13 28 0v4M24 48h12" />
        </>
      )}
    </svg>
  );
}

export function ExposureInstrument({
  reachable,
  auth,
  critical,
}: {
  reachable: boolean;
  auth: boolean;
  critical: boolean;
}) {
  const review = reachable && !auth;
  return (
    <div className={`lv-exposure lv-instrument ${review ? "lv-exposure-review" : ""}`} aria-hidden="true">
      <div className="lv-instrument-caption">
        <span>BOUNDARY EXAMINATION</span>
        <span>SYNTHETIC</span>
      </div>
      <svg viewBox="0 0 560 205" fill="none">
        <path
          className="lv-grid-line"
          d="M25 54h510M25 108h510M25 162h510M70 22v160M175 22v160M280 22v160M385 22v160M490 22v160"
        />
        <path className="lv-machine-rule" d="M89 108h101m180 0h101" />
        <circle className="lv-machine-rule" cx="280" cy="103" r="81" />
        <circle className="lv-fine-ring" cx="280" cy="103" r="70" />
        {Array.from({ length: 24 }, (_, i) => (
          <path key={i} className="lv-gauge-tick" d="M280 24v5" transform={`rotate(${i * 15} 280 103)`} />
        ))}
        <path className="lv-shield" d="m280 49 38 14v33c0 30-25 47-38 55-13-8-38-25-38-55V63Z" />
        <path
          key={`${auth}-${reachable}`}
          className="lv-shield-mark lv-draw"
          pathLength="1"
          d={auth ? "m263 98 12 12 24-30" : "M280 79v26m0 14v3"}
        />
        <circle className={reachable ? "lv-state-lit" : "lv-state-muted"} cx="76" cy="108" r="19" />
        <path className="lv-chip-line" d="M65 108h22m-11-11v22m-8-18 16 14m-16 0 16-14" />
        <path className="lv-chip-face" d="m481 87 18 10v24l-18 10-18-10V97Z" />
        <path className="lv-chip-line" d="m470 99 11 6 11-6m-11 6v18m-11-14 8 4m-8 3 8 4" />
        <text className="lv-svg-label" x="76" y="161" textAnchor="middle">
          PUBLIC VIEW
        </text>
        <text className="lv-svg-label" x="481" y="161" textAnchor="middle">
          ASSET
        </text>
      </svg>
      <div className="lv-exposure-states">
        <span>
          <b>REACHABILITY</b>
          {reachable ? "Observed" : "Unconfirmed"}
        </span>
        <span>
          <b>AUTH BOUNDARY</b>
          {auth ? "Observed" : "Unconfirmed"}
        </span>
        <span>
          <b>BUSINESS CONTEXT</b>
          {critical ? "Critical" : "Standard"}
        </span>
      </div>
    </div>
  );
}

export function EvidencePillars({ chosen, composed }: { chosen: string[]; composed: boolean }) {
  const sources = [
    { id: "fleet", label: "FLEET" },
    { id: "routing", label: "ROUTING" },
    { id: "authority", label: "AUTHORITY" },
  ];
  return (
    <div className="lv-evidence-graphic lv-instrument" aria-hidden="true">
      <div className="lv-instrument-caption">
        <span>EVIDENCE ASSEMBLY</span>
        <span>{chosen.length} / 03 SELECTED</span>
      </div>
      <svg viewBox="0 0 560 170" fill="none">
        <path className="lv-grid-line" d="M25 47h510M25 99h510M25 151h510" />
        {sources.map((source, i) => {
          const x = 105 + i * 175;
          const active = chosen.includes(source.id);
          return (
            <g key={source.id} className={active ? "lv-source-selected" : "lv-source-idle"}>
              <path className="lv-source-shadow" d={`M${x - 36} 45h60v73h-60Z`} />
              <path className="lv-source-sheet" d={`M${x - 27} 36h50l14 14v59h-64Z`} />
              <path
                className="lv-source-fold"
                d={`M${x + 23} 36v14h14M${x - 13} 61h32m-32 11h32m-32 11h23M${x - 13} 94h14`}
              />
              <text className="lv-svg-label" x={x + 4} y="133" textAnchor="middle">
                {source.label}
              </text>
              <circle className={active ? "lv-step-lit" : "lv-step-unlit"} cx={x + 29} cy="94" r="4" />
            </g>
          );
        })}
        {composed && (
          <path
            key={chosen.join("-")}
            className="lv-source-link lv-draw"
            pathLength="1"
            d="M109 144v13h350v-13M284 144v20"
          />
        )}
      </svg>
    </div>
  );
}

export function ObservationClock({ age, stale }: { age: number; stale: boolean }) {
  const circumference = 2 * Math.PI * 59;
  return (
    <div className={`lv-observation-clock ${stale ? "lv-clock-stale" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 160 160" fill="none">
        <circle className="lv-clock-face" cx="80" cy="80" r="73" />
        {Array.from({ length: 48 }, (_, i) => (
          <path
            key={i}
            className={i < 24 ? "lv-clock-tick" : "lv-clock-expired-tick"}
            d={`M80 10v${i % 6 === 0 ? 8 : 4}`}
            transform={`rotate(${i * 7.5} 80 80)`}
          />
        ))}
        <circle className="lv-clock-track" cx="80" cy="80" r="59" />
        <circle
          key={age}
          className="lv-clock-elapsed"
          cx="80"
          cy="80"
          r="59"
          strokeDasharray={`${(circumference * age) / 48} ${circumference}`}
          transform="rotate(-90 80 80)"
        />
        <path className="lv-clock-limit" d="M75 144h10l-5 6Z" />
      </svg>
      <span className="lv-clock-value">
        {age}
        <small>HOURS</small>
      </span>
    </div>
  );
}

export function SignalInstrument({ deviation, corroborated }: { deviation: number; corroborated: boolean }) {
  const id = useId();
  const threshold = 30;
  const x = (n: number) => 34 + (n / 60) * 496;
  const y = (n: number) => 180 - n * 1.35;
  const values = Array.from({ length: 61 }, (_, i) => {
    if (i <= 26) return Math.sin(i * 0.67) * 1.65;
    const p = (i - 26) / 34;
    return deviation * (p * p * (3 - 2 * p)) + Math.sin(i * 0.68) * 2.5 * (1 - p);
  });
  const line = values.map((value, i) => `${i ? "L" : "M"}${x(i).toFixed(2)} ${y(value).toFixed(2)}`).join(" ");
  const area = `${line}L530 180H34Z`;
  const exceeded = deviation >= threshold;
  return (
    <div className={`o-signal lv-signal lv-instrument ${exceeded ? "lv-signal-exception" : ""}`}>
      <div className="lv-instrument-caption">
        <span>SYNTHETIC LINE SIGNAL</span>
        <span>ILLUSTRATIVE SEQUENCE</span>
      </div>
      <div className="lv-signal-reading">
        <div>
          <span>SELECTED DEVIATION</span>
          <strong>
            {deviation}
            <small>%</small>
          </strong>
        </div>
        <div className="lv-signal-state">
          <i aria-hidden="true" />
          <span>{exceeded ? "REVIEW THRESHOLD REACHED" : "BELOW REVIEW THRESHOLD"}</span>
        </div>
      </div>
      <svg viewBox="0 0 560 230" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-signal-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#77e7e7" stopOpacity=".23" />
            <stop offset="1" stopColor="#77e7e7" stopOpacity=".015" />
          </linearGradient>
          <clipPath id={`${id}-exception`}>
            <rect x="34" y="24" width="496" height={y(threshold) - 24} />
          </clipPath>
        </defs>
        <rect className="lv-scope-bed" x="34" y="24" width="496" height="166" />
        {Array.from({ length: 13 }, (_, i) => (
          <path key={i} className="lv-scope-grid" d={`M${34 + (i * 496) / 12} 24V190`} />
        ))}
        {[0, 20, 40, 60, 80, 100].map((value) => (
          <g key={value}>
            <path className="lv-scope-grid" d={`M34 ${y(value)}H530`} />
            <text className="lv-axis-text" x="25" y={y(value) + 3} textAnchor="end">
              {value}
            </text>
          </g>
        ))}
        <path className="lv-scope-baseline" d="M34 180H530" />
        <path d={area} fill={`url(#${id}-signal-fill)`} />
        <path d={area} className="lv-exception-area" clipPath={`url(#${id}-exception)`} />
        <path className="lv-threshold-line" d={`M34 ${y(threshold)}H530`} />
        <text className="lv-threshold-label" x="44" y={y(threshold) - 7}>
          EXAMPLE REVIEW THRESHOLD · 30%
        </text>
        <path key={`trace-${deviation}`} className="lv-signal-trace lv-draw" d={line} pathLength="1" />
        <path className="lv-reading-guide" d={`M530 ${y(deviation)}V190`} />
        <circle className="lv-reading-ring" cx="530" cy={y(deviation)} r="6" />
        <circle className="lv-reading-point" cx="530" cy={y(deviation)} r="2.5" />
        {corroborated && (
          <g key={`support-${deviation}`} className="lv-corroboration lv-acquire">
            <path d={`m${x(48)} ${y(values[48]) - 10} 10 10-10 10-10-10Z`} />
            <path d={`M${x(48)} ${y(values[48]) + 13}v20`} />
            <circle cx={x(48)} cy={y(values[48]) + 37} r="3" />
          </g>
        )}
        {[0, 15, 30, 45, 60].map((sample) => (
          <g key={sample}>
            <path className="lv-axis-tick" d={`M${x(sample)} 190v5`} />
            <text className="lv-axis-text" x={x(sample)} y="209" textAnchor="middle">
              {String(sample).padStart(2, "0")}
            </text>
          </g>
        ))}
        <text className="lv-axis-text" x="282" y="225" textAnchor="middle">
          ILLUSTRATIVE SAMPLE ORDER
        </text>
      </svg>
      <div className="lv-signal-footer">
        <span>
          <i className="lv-legend-baseline" aria-hidden="true" />
          Example baseline <b>0%</b>
        </span>
        <span>
          <i className="lv-legend-threshold" aria-hidden="true" />
          Review threshold <b>30%</b>
        </span>
        <span className={corroborated ? "lv-supported" : ""}>
          <i className="lv-legend-support" aria-hidden="true" />
          {corroborated ? "Second observation added" : "Awaiting corroboration"}
        </span>
      </div>
    </div>
  );
}
