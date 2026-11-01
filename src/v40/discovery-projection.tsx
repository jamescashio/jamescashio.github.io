import { useId } from "react";

// An original public-content map. Its four beacons represent the four real
// destinations on the selected path, never a live or private system inventory.
export function DiscoveryProjection({
  stops,
  index,
  onSelect,
}: {
  stops: { title: string }[];
  index: number;
  onSelect: (index: number) => void;
}) {
  const id = useId().replaceAll(":", "");
  const points = [
    [120, 168],
    [300, 80],
    [480, 168],
    [300, 296],
  ];
  return (
    <div className="discovery-projection" role="group" aria-label="Holographic destination map">
      <svg viewBox="0 0 600 400" preserveAspectRatio="none" fill="none" aria-hidden="true">
        <defs>
          <radialGradient id={id + "-aura"}>
            <stop stopColor="#efb42a" stopOpacity=".3" />
            <stop offset="1" stopColor="#efb42a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={id + "-beam"} x1="300" y1="40" x2="300" y2="300" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffcc55" stopOpacity="0" />
            <stop offset="1" stopColor="#ffcc55" stopOpacity=".14" />
          </linearGradient>
          <filter id={id + "-glow"} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>
        <ellipse cx="300" cy="220" rx="290" ry="170" fill={"url(#" + id + "-aura)"} />
        <path d="M120 300 275 56 325 56 480 300Z" fill={"url(#" + id + "-beam)"} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <ellipse
            key={i}
            cx="300"
            cy={238 + i * 8}
            rx={238 - i * 18}
            ry={87 - i * 6}
            stroke={i === 0 ? "#f6cd83" : "#efbd48"}
            strokeOpacity={i === 0 ? ".8" : ".18"}
            strokeDasharray={i % 2 ? "2 7" : undefined}
          />
        ))}
        {Array.from({ length: 48 }, (_, i) => {
          const angle = (i / 48) * Math.PI * 2;
          return (
            <path
              key={i}
              d={`M${300 + Math.cos(angle) * 252} ${238 + Math.sin(angle) * 95}l${Math.cos(angle) * 8} ${Math.sin(angle) * 4}`}
              stroke={i % 4 ? "#cca23f" : "#ffe0a5"}
              strokeOpacity={i % 4 ? ".4" : ".9"}
            />
          );
        })}
        {points.map(([x, y], i) => (
          <g key={i} stroke={i === index ? "#ffdd96" : "#f2c459"}>
            <path
              d={`M300 210 300 ${y + 28} ${x} ${y}`}
              strokeOpacity={i === index ? ".95" : ".22"}
              strokeWidth={i === index ? 2 : 1}
            />
            <ellipse cx={x} cy={y + 28} rx="28" ry="7" strokeOpacity=".45" />
            <path d={`M${x} ${y + 10}v18`} strokeDasharray="2 4" strokeOpacity=".7" />
          </g>
        ))}
        {Array.from({ length: 100 }, (_, i) => (
          <circle
            key={i}
            cx={18 + ((i * 137.5) % 564)}
            cy={40 + ((i * 67.3) % 305)}
            r={i % 7 === 0 ? 1.4 : 0.65}
            fill={i % 3 ? "#e9c674" : "#ffda9c"}
            opacity={i % 4 === 0 ? ".8" : ".35"}
          />
        ))}
        <ellipse
          cx="300"
          cy="210"
          rx="63"
          ry="24"
          stroke="#f3cb6d"
          strokeWidth="6"
          filter={"url(#" + id + "-glow)"}
          opacity=".65"
        />
        <ellipse cx="300" cy="210" rx="63" ry="24" stroke="#f7d992" />
        <ellipse cx="300" cy="210" rx="49" ry="17" stroke="#ffe0a6" strokeDasharray="2 5" />
        <path d="m300 182 9 19 22 9-22 8-9 19-9-19-22-8 22-9Z" fill="#f1ede2" fillOpacity=".8" />
        <circle
          key={index}
          className="discovery-projection-pulse"
          cx="300"
          cy="210"
          r="65"
          stroke="#ebe5d6"
          opacity="0"
        />
      </svg>
      <p className="discovery-projection-label">
        Content constellation <span>Choose a beacon</span>
      </p>
      {stops.map((stop, i) => (
        <button
          type="button"
          key={stop.title}
          className={"discovery-beacon discovery-beacon-" + i}
          aria-label={"Preview " + stop.title}
          aria-pressed={index === i}
          onClick={() => onSelect(i)}
        >
          <span aria-hidden="true">0{i + 1}</span>
        </button>
      ))}
      <p className="discovery-projection-caption">Four destinations. Your next move.</p>
    </div>
  );
}
