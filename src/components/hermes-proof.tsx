import { ROUTING_STAGES } from "@/lib/content";

export function HermesProof() {
  return (
    <div className="za-hermes-proof" aria-label="Hermes orchestrator proof schematic">
      <div className="za-kicker">ARTICLE 01 · OWNER-BUILT PROOF</div>
      <p className="za-display mt-2 text-lg text-cyan">HERMES ROUTE LOCK</p>
      <svg className="za-hermes-schematic" viewBox="0 0 640 86" role="img" aria-hidden>
        <path className="za-hermes-spine" d="M28 43 H612" />
        {ROUTING_STAGES.map(([n], index) => {
          const x = 28 + index * 146;
          return (
            <g key={n} className="za-hermes-node" style={{ animationDelay: `${index * 160}ms` }}>
              <rect x={x - 22} y="18" width="44" height="50" rx="6" />
              <text x={x} y="48" textAnchor="middle">
                {n}
              </text>
            </g>
          );
        })}
        <circle className="za-hermes-packet" r="4" cx="0" cy="0" />
      </svg>
      <ol className="za-hermes-stages">
        {ROUTING_STAGES.map(([n, label, detail], index) => (
          <li key={n} className="za-hermes-stage" style={{ animationDelay: `${index * 180}ms` }}>
            <span className="za-law-dot" />
            <span className="za-mono text-accent">{n}</span>
            <span className="font-display tracking-wide">{label}</span>
            <span className="za-mono hidden text-dim sm:inline">{detail}</span>
          </li>
        ))}
      </ol>
      <p className="za-mono mt-4 text-[10px] tracking-[0.16em] text-dim">
        QUALITY PICKS THE MODEL · COST ONLY BREAKS A TIE · HUMAN HOLDS THE LEASH
      </p>
    </div>
  );
}
