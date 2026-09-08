import { useId } from "react";
import { InstrumentMaterials, MachinedBezel } from "./study-engravings";

export function RouteInstrument({ step, code }: { step: number; code: string }) {
  const id = useId();
  return (
    <div className="lv-route-instrument lv-instrument" data-route-step={step} aria-hidden="true">
      <div className="lv-instrument-caption">
        <span>ROUTE QUALIFICATION</span>
        <span>{String(step).padStart(2, "0")} / 05</span>
      </div>
      <svg viewBox="0 0 560 164" fill="none">
        <InstrumentMaterials id={id} />
        <defs>
          <radialGradient id={`${id}-core-light`}>
            <stop stopColor="#77e7e7" stopOpacity=".22" />
            <stop offset="1" stopColor="#77e7e7" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="280" cy="94" rx="134" ry="94" fill={`url(#${id}-core-light)`} />
        <path
          className="lv-grid-line"
          d="M24 44h512M24 94h512M24 144h512M80 24v145M180 24v145M280 24v145M380 24v145M480 24v145"
        />
        <path className="lv-machine-rule" d="M20 53V25h28m464 0h28v28M20 131v28h28m464 0h28v-28" />
        <path className="lv-route-bed" d="M83 94h133m128 0h133" />
        <path
          className="lv-circuit-engraving"
          d="M82 77h47l24-24h47m-118 59h48l22 23h48m160-82h46l24 24h47m-117 58h46l24-23h47"
        />
        {[53, 135].map((y) => (
          <g key={y}>
            <circle className="lv-terminal" cx="200" cy={y} r="3" />
            <circle className="lv-terminal" cx="360" cy={y} r="3" />
          </g>
        ))}
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
        <MachinedBezel x={280} y={94} radius={68} />
        <g className="lv-core-orbit lv-continuous">
          <path className="lv-orbit-bright" d="M234 51a63 63 0 0 1 89-3m3 91a63 63 0 0 1-88 0" />
          <circle className="lv-reading-point" cx="326" cy="51" r="2.5" />
        </g>
        <ellipse className="lv-core-platform" cx="280" cy="139" rx="43" ry="9" />
        <path
          d="M242 137v5c12 11 64 11 76 0v-5c-13 10-63 10-76 0Z"
          fill={`url(#${id}-titanium)`}
          stroke="#729397"
          strokeWidth=".7"
        />
        <g className="lv-core-prism">
          <path
            className="lv-core-face"
            style={{ fill: `url(#${id}-titanium)` }}
            d="m280 49 35 23-7 45-28 21-28-21-7-45Z"
          />
          <path className="lv-core-lit-facet" d="m280 49 0 40 35-17Z" />
          <path className="lv-core-dark-facet" d="m280 89 28 28-28 21Z" />
          <path className="lv-core-fold" d="m280 49 0 40 35-17m-35 17-28 28m28-28 28 28m-28-28v49m-35-66 35 17" />
          <path
            d="m275 58-24 16 24 11Zm11 3v21l20-10Zm-33 22 4 26 16-17Zm35 36-4 9v-25l17 15Z"
            fill="#05132166"
            stroke="#bcd9d168"
            strokeWidth=".65"
          />
          <path
            key={`core-${step}`}
            className="ln-etch-response lv-draw"
            pathLength="1"
            d="m280 55 28 19-7 38-21 18-21-18-7-38Z"
          />
          <circle className="lv-core-pin" cx="280" cy="89" r="4" />
        </g>
        {step > 0 && (
          <path
            key={`packet-${step}`}
            className={`lv-route-packet lv-continuous ${step === 5 ? "lv-packet-complete" : ""}`}
            d={step === 5 ? "M344 94h133" : "M83 94h133"}
            pathLength="1"
          />
        )}
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
      </svg>
      <div className="lv-object-labels">
        <span>INTENT</span>
        <span>POLICY CORE</span>
        <span>{step === 5 ? code : "DECISION"}</span>
      </div>
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

export function CascadeInstrument({
  level,
  severity,
  confidence,
}: {
  level: number;
  severity: number;
  confidence: number;
}) {
  const id = useId();
  const stages = ["Bounded check", "More evidence", "Human decision"];
  return (
    <div className="lv-cascade lv-instrument">
      <div className="lv-instrument-caption" aria-hidden="true">
        <span>AUTHORITY CASCADE</span>
        <span>ILLUSTRATIVE POLICY</span>
      </div>
      <svg className="lv-cascade-deck" viewBox="0 0 560 214" fill="none" aria-hidden="true">
        <InstrumentMaterials id={id} />
        <path
          className="lv-grid-line"
          d="m20 154 260-125 260 125-260 57ZM80 126l260 125M152 93l260 125M208 57l260 125M480 126 220 251M408 93 148 218M352 57 92 182"
        />
        <path className="lv-cascade-channel" d="M94 155h56l33-33h97l32-32h154" />
        <path
          key={level}
          className="lv-cascade-current lv-draw"
          pathLength="1"
          d={level === 0 ? "M40 155h54" : level === 1 ? "M94 155h56l33-33h97" : "M94 155h56l33-33h97l32-32h154"}
        />
        {[
          { x: 94, y: 145 },
          { x: 280, y: 112 },
          { x: 466, y: 80 },
        ].map(({ x, y }, i) => (
          <g
            key={i}
            className={`lv-decision-station ${i === level ? "lv-station-selected" : ""}`}
            transform={`translate(${x} ${y})`}
          >
            <ellipse className="lv-station-projection" cy="13" rx="57" ry="20" />
            <path className="lv-station-side" d="m-44 0 44 21 44-21v14L0 35-44 14Z" />
            <path
              className="lv-station-top"
              style={{ fill: `url(#${id}-${i === level ? "champagne" : "titanium"})` }}
              d="m-44 0 44-21L44 0 0 21Z"
            />
            <path
              d="m-34 0 34-16L34 0 0 16Zm-2 9 0 9m7-6v9m7-6v9m7-6v9m7-6v9m12-3 27-13"
              stroke={i === level ? "#e9d2a0" : "#789cab"}
              strokeWidth=".7"
            />
            <path className="lv-station-edge" d="m-44 8 44 21 44-21" />
            <path className="lv-station-beam" d="M-23-49-37-4 0 14 37-4 23-49Z" />
            <g className="lv-station-symbol" transform="translate(-23 -71)">
              <svg width="46" height="46" viewBox="0 0 60 60">
                <StageSymbol stage={i} />
              </svg>
            </g>
            <path
              key={`station-${i}-${level}`}
              className={`ln-etch-response ${i === level ? "lv-draw" : ""}`}
              pathLength="1"
              d="m-21-51 21-12 21 12v25L0-14-21-26Z"
            />
            {i === level && <ellipse className="lv-station-pulse lv-continuous" cy="3" rx="49" ry="22" />}
          </g>
        ))}
      </svg>
      <div className="lv-decision-labels" role="group" aria-label={`Current stage: ${stages[level]}`}>
        {stages.map((label, i) => (
          <span key={label} className={level === i ? "lv-decision-selected" : ""}>
            <small>0{i + 1}</small>
            <strong>{label}</strong>
            {level === i && <b>SELECTED</b>}
          </span>
        ))}
      </div>
      <div className="lv-cascade-readout" aria-hidden="true">
        <span>
          CONSEQUENCE <b>{severity}%</b>
          <i>
            <em style={{ width: `${severity}%` }} />
          </i>
        </span>
        <span>
          EVIDENCE CONFIDENCE <b>{confidence}%</b>
          <i>
            <em style={{ width: `${confidence}%` }} />
          </i>
        </span>
      </div>
    </div>
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
  const id = useId();
  const review = reachable && !auth;
  return (
    <div className={`lv-exposure lv-instrument ${review ? "lv-exposure-review" : ""}`} aria-hidden="true">
      <div className="lv-instrument-caption">
        <span>BOUNDARY EXAMINATION</span>
        <span>SYNTHETIC</span>
      </div>
      <svg viewBox="0 0 560 205" fill="none">
        <defs>
          <radialGradient id={`${id}-boundary-light`}>
            <stop stopColor={review ? "#fa927a" : "#77e7e7"} stopOpacity=".17" />
            <stop offset="1" stopColor="#071522" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${id}-shield-metal`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor={review ? "#6c4b42" : "#386575"} />
            <stop offset=".48" stopColor="#142b3a" />
            <stop offset="1" stopColor="#081422" />
          </linearGradient>
        </defs>
        <ellipse cx="280" cy="103" rx="135" ry="102" fill={`url(#${id}-boundary-light)`} />
        <path
          className="lv-grid-line"
          d="M25 54h510M25 108h510M25 162h510M70 22v160M175 22v160M280 22v160M385 22v160M490 22v160"
        />
        <path className="lv-machine-rule" d="M89 108h101m180 0h101" />
        <circle className="lv-machine-rule" cx="280" cy="103" r="81" />
        <circle className="lv-fine-ring" cx="280" cy="103" r="70" />
        <MachinedBezel x={280} y={103} radius={87} />
        <g className="lv-boundary-sweep lv-continuous">
          <path className="lv-boundary-sector" d="M280 103V27a76 76 0 0 1 54 22Z" />
          <path className="lv-boundary-scan" d="M280 103V27" />
        </g>
        {Array.from({ length: 24 }, (_, i) => (
          <path key={i} className="lv-gauge-tick" d="M280 24v5" transform={`rotate(${i * 15} 280 103)`} />
        ))}
        <path className="lv-shield-depth" d="m280 47 45 16v37c0 34-28 53-45 62-17-9-45-28-45-62V63Z" />
        <path
          className="lv-shield"
          style={{ fill: `url(#${id}-shield-metal)` }}
          d="m280 49 38 14v33c0 30-25 47-38 55-13-8-38-25-38-55V63Z"
        />
        <path className="lv-shield-inset" d="m280 57 30 11v27c0 26-20 41-30 48-10-7-30-22-30-48V68Z" />
        <path
          d="m246 66 34-13 34 13-7 2-27-10-27 10Zm34 75v7c-15-10-30-24-35-41l6-2c6 17 15 26 29 36Z"
          fill={review ? "#e6a08065" : "#b0dcd45c"}
        />
        <path d="M257 72v11m6-14v10m34-10v10m6-7v11m-42 40 9 7m20 0 9-7" stroke="#c4ded075" strokeWidth=".85" />
        <path
          key={`${auth}-${reachable}`}
          className="lv-shield-mark lv-draw"
          pathLength="1"
          d={auth ? "m263 98 12 12 24-30" : "M280 79v26m0 14v3"}
        />
        <circle className={reachable ? "lv-state-lit" : "lv-state-muted"} cx="76" cy="108" r="19" />
        {reachable && <path className="lv-boundary-probe lv-continuous" d="M98 108h91" pathLength="1" />}
        <path className="lv-chip-line" d="M65 108h22m-11-11v22m-8-18 16 14m-16 0 16-14" />
        <path
          className={`lv-asset-boundary ${critical ? "lv-asset-critical" : ""}`}
          d="m481 76 29 17v36l-29 17-29-17V93Z"
        />
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
  const id = useId();
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
      <div className="lv-object-labels lv-evidence-names">
        {sources.map((source) => (
          <span key={source.id} className={chosen.includes(source.id) ? "lv-source-name-selected" : ""}>
            {source.label}
          </span>
        ))}
      </div>
      <svg viewBox="0 20 560 195" fill="none">
        <InstrumentMaterials id={id} />
        <path className="lv-grid-line" d="M25 47h510M25 99h510M25 151h510" />
        <ellipse className="lv-assembly-orbit" cx="280" cy="170" rx="211" ry="28" />
        <path className="lv-assembly-bed" d="M109 126v24l141 39m209-63v24l-141 39M284 126v52" />
        {sources.map((source, i) => {
          const x = 105 + i * 175;
          const active = chosen.includes(source.id);
          return (
            <g key={source.id} className={active ? "lv-source-selected" : "lv-source-idle"}>
              <ellipse className="lv-source-dock" cx={x + 4} cy="115" rx="48" ry="11" />
              <path
                d={`m${x - 43} 114 47-11 47 11v6l-47 12-47-12Z`}
                fill={`url(#${id}-${active ? "champagne" : "titanium"})`}
                stroke={active ? "#edc991" : "#5e8393"}
                strokeWidth=".65"
              />
              <path className="lv-source-shadow" d={`M${x - 36} 45h60v73h-60Z`} />
              <path className="lv-source-middle" d={`M${x - 31} 40h57l14 14v59h-71Z`} />
              <path
                className="lv-source-sheet"
                style={{ fill: `url(#${id}-${active ? "champagne" : "titanium"})` }}
                d={`M${x - 27} 36h50l14 14v59h-64Z`}
              />
              <path d={`M${x - 21} 42h39m-39 1v59h51M${x + 24} 38v11h11`} stroke="#d5e6da80" strokeWidth=".7" />
              <path
                key={`doc-${source.id}-${active}`}
                className={`ln-etch-response ${active ? "lv-draw" : ""}`}
                pathLength="1"
                d={`M${x - 28} 49v46m2-43v8m0 3v8m0 3v8m0 3v8`}
              />
              <path
                className="lv-source-fold"
                d={`M${x + 23} 36v14h14M${x - 13} 61h32m-32 11h32m-32 11h23M${x - 13} 94h14`}
              />
              <circle className={active ? "lv-step-lit" : "lv-step-unlit"} cx={x + 29} cy="94" r="4" />
            </g>
          );
        })}
        {composed && (
          <g key={chosen.join("-")}>
            {sources
              .filter((source) => chosen.includes(source.id))
              .map((source) => {
                const i = sources.findIndex((item) => item.id === source.id);
                const path = i === 1 ? "M284 126v52" : i === 0 ? "M109 126v24l141 39" : "M459 126v24l-141 39";
                return (
                  <g key={source.id}>
                    <path className="lv-source-link lv-draw" pathLength="1" d={path} />
                    <path className="lv-source-packet lv-continuous" pathLength="1" d={path} />
                  </g>
                );
              })}
          </g>
        )}
        <g className={`lv-brief-core ${composed ? "lv-brief-composed" : ""}`}>
          <path d="m280 171 37 16-37 16-37-16Z" />
          <path className="lv-brief-core-depth" d="m243 187 37 16 37-16v8l-37 16-37-16Z" />
          <path className="lv-brief-core-mark" d={composed ? "m269 186 8 5 17-9" : "M269 187h22"} />
        </g>
      </svg>
    </div>
  );
}

export function ObservationClock({ age, stale }: { age: number; stale: boolean }) {
  const id = useId();
  const circumference = 2 * Math.PI * 59;
  return (
    <div className={`lv-observation-clock ${stale ? "lv-clock-stale" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 160 160" fill="none">
        <defs>
          <radialGradient id={`${id}-dial`}>
            <stop offset=".58" stopColor="#0a1828" />
            <stop offset=".78" stopColor="#203746" />
            <stop offset=".9" stopColor="#0d1c2c" />
            <stop offset="1" stopColor="#3e596c" />
          </radialGradient>
        </defs>
        <circle className="lv-clock-face" cx="80" cy="80" r="73" />
        <circle cx="80" cy="80" r="73" fill={`url(#${id}-dial)`} />
        <circle className="lv-clock-inner" cx="80" cy="80" r="48" />
        {Array.from({ length: 48 }, (_, i) => (
          <path
            key={i}
            className={`${i < 24 ? "lv-clock-tick" : "lv-clock-expired-tick"} ${i < age ? "lv-clock-tick-passed" : ""}`}
            d={`M80 10v${i % 6 === 0 ? 8 : 4}`}
            transform={`rotate(${i * 7.5} 80 80)`}
          />
        ))}
        <circle className="lv-clock-track" cx="80" cy="80" r="59" />
        <circle
          className="lv-clock-elapsed"
          cx="80"
          cy="80"
          r="59"
          strokeDasharray={`${(circumference * age) / 48} ${circumference}`}
          transform="rotate(-90 80 80)"
        />
        <g className="lv-clock-needle" style={{ transform: `rotate(${age * 7.5}deg)` }}>
          <path d="m80 15 3 6-3 6-3-6Z" />
          <path d="M80 31v5" />
        </g>
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
          <linearGradient id={`${id}-scope-glass`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#173140" />
            <stop offset=".42" stopColor="#091b29" />
            <stop offset="1" stopColor="#040d17" />
          </linearGradient>
          <clipPath id={`${id}-exception`}>
            <rect x="34" y="24" width="496" height={y(threshold) - 24} />
          </clipPath>
          <clipPath id={`${id}-scope`}>
            <rect x="34" y="24" width="496" height="166" />
          </clipPath>
          <linearGradient id={`${id}-scan`}>
            <stop stopColor="#77e7e7" stopOpacity="0" />
            <stop offset="1" stopColor="#77e7e7" stopOpacity=".1" />
          </linearGradient>
        </defs>
        <path className="lv-scope-housing" d="m34 18-6 6v166l6 6h496l6-6V24l-6-6Z" />
        <path className="lv-scope-bevel" d="m28 190 6 6h496l6-6M28 24l6-6h496l6 6" />
        <rect className="lv-scope-bed" x="34" y="24" width="496" height="166" fill={`url(#${id}-scope-glass)`} />
        <path className="lv-scope-glass-edge" d="M34 44V24h476m20 146v20H54" />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((pin) => (
          <path key={pin} className="lv-scope-contact" d={`M${50 + pin * 38.5} 9v5`} />
        ))}
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
        <path className="lv-signal-echo" d={line} />
        {[0, 10, 20, 30, 40, 50, 60].map((sample) => (
          <g key={sample} className="lv-signal-sample">
            <path d={`M${x(sample)} ${y(values[sample]) + 5}V188`} />
            <circle cx={x(sample)} cy={y(values[sample])} r="2.2" />
          </g>
        ))}
        <path
          key={`replay-${deviation}-${corroborated}`}
          className="lv-signal-runner lv-continuous"
          d={line}
          pathLength="1"
        />
        <g clipPath={`url(#${id}-scope)`}>
          <g key={`scan-${deviation}-${corroborated}`} className="lv-scope-scan lv-continuous">
            <rect x="-25" y="24" width="59" height="166" fill={`url(#${id}-scan)`} />
            <path d="M34 24v166" />
          </g>
        </g>
        <path className="lv-reading-guide" d={`M530 ${y(deviation)}V190`} />
        <circle
          key={`reading-${deviation}-${corroborated}`}
          className="lv-reading-halo lv-continuous"
          cx="530"
          cy={y(deviation)}
          r="12"
        />
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
