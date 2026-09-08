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
