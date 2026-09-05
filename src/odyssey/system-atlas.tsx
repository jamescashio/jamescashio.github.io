import { useId } from "react";
import { ATLAS } from "./data";

const ROUTES = ["M50 42V13", "M50 13V42", "M50 42C50 58 25 55 25 73", "M50 42C50 58 75 55 75 73"] as const;

function AtlasGlyph({ kind }: { kind: number }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" className="sa-node-glyph">
      {kind === 0 ? (
        <>
          <path className="sa-glyph-surface" d="M32 5 55 18v28L32 59 9 46V18Z" />
          <path className="sa-glyph-fine" d="M32 9 51 20v24L32 55 13 44V20Z" />
          <circle className="sa-glyph-bright" cx="32" cy="24" r="7" />
          <path className="sa-glyph-main" d="M20 44v-3c0-11 24-11 24 0v3M24 47h16" />
          <path className="sa-glyph-fine" d="M5 23v18M59 23v18M28 2h8M28 62h8" />
        </>
      ) : kind === 1 ? (
        <>
          <path className="sa-glyph-surface" d="M32 3 55 18l-4 30-19 13-19-13-4-30Z" />
          <path className="sa-glyph-shade" d="M32 3v24l19 21 4-30ZM32 27v34L13 48Z" />
          <path className="sa-glyph-main" d="M32 3v24m0 34V27M9 18l23 9 23-9M13 48l19-21 19 21" />
          <path className="sa-glyph-bright" d="m32 17 11 13-11 16-11-16Z" />
          <path className="sa-glyph-fine" d="m32 23 6 7-6 9-6-9Z" />
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
  const index = Number.isInteger(selected) && selected >= 0 && selected < ATLAS.length ? selected : 0;
  const node = ATLAS[index];
  const uid = useId();
  return (
    <div className="o-atlas-layout sa-system-atlas" data-selected={node.id} data-atlas-motion={motion ? "on" : "off"}>
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
          <path className="sa-route-active" key={node.id} pathLength="1" d={ROUTES[index]} />
          <path className="sa-route-junction" d="m50 49-1.5 1.5L50 52l1.5-1.5Z" />
        </svg>
        {ATLAS.map((item, i) => (
          <button
            key={item.id}
            style={{ left: `${item.x}%`, top: `${item.y}%` }}
            className={`o-atlas-node sa-node ${index === i ? "selected" : ""} ${item.id}`}
            aria-pressed={index === i}
            onClick={() => onSelect(i)}
            type="button"
          >
            <span className="o-node-icon sa-node-face">
              <span className="sa-node-bezel" aria-hidden="true" />
              <AtlasGlyph kind={i} />
            </span>
            <strong>{item.name}</strong>
            <small>{item.role}</small>
          </button>
        ))}
        <span className="o-atlas-caption o-micro">CONCEPTUAL RELATIONSHIPS / SELECT A NODE</span>
      </div>
      <div className="o-atlas-readout sa-readout" aria-live="polite" aria-atomic="true">
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
