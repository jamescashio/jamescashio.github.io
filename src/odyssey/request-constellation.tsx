import { useId, type CSSProperties } from "react";
import { flightRequests } from "./flight-requests";
import type { WorldInput } from "./sovereign-model";

export function RequestConstellation({ input, motion }: { input: WorldInput; motion: boolean }) {
  const requests = flightRequests(input);
  const id = useId();
  const slots = { local: 0, cloud: 0, held: 0 };
  const columns = { local: 42, cloud: 156, held: 270 };
  const bays = [
    { route: "local", x: 18, color: "#82efeb", label: "ONBOARD" },
    { route: "cloud", x: 132, color: "#ffd499", label: "CLOUD" },
    { route: "held", x: 246, color: "#ffb59f", label: "HELD" },
  ] as const;
  const signature = requests.map((request) => `${request.id}:${request.route}`).join("|");
  return (
    <figure className="ff-constellation" data-motion={motion ? "on" : "off"}>
      <figcaption>
        <span>Twelve requests. One decision.</span>
        <small>◆ Private · ● Public</small>
      </figcaption>
      <svg viewBox="0 0 360 116" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={`${id}-deck`} x1="0" y1="0" x2=".8" y2="1">
            <stop stopColor="#203d4c" />
            <stop offset=".45" stopColor="#0b2030" />
            <stop offset="1" stopColor="#07111c" />
          </linearGradient>
          <linearGradient id={`${id}-bevel`} x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#607d88" />
            <stop offset="1" stopColor="#1b3444" />
          </linearGradient>
        </defs>
        <path d="M102 46h30m84 0h30" className="ff-route-track" />
        {bays.map(({ route, x, color, label }) => {
          const occupied = requests.some((request) => request.route === route);
          return (
            <g key={route} className="ff-routing-dock" data-occupied={occupied} style={{ color }}>
              <path d={`M${x} 77l8 10h68l8-10v7l-8 10h-68l-8-10Z`} fill={`url(#${id}-bevel)`} />
              <path
                d={`M${x} 17l8-9h68l8 9v60l-8 10h-68l-8-10Z`}
                fill={`url(#${id}-deck)`}
                className="ff-dock-surface"
              />
              <path d={`M${x + 7} 19l5-5h60l5 5m-70 56l5 6h60l5-6`} className="ff-dock-etch" />
              <path d={`M${x + 12} 31h60m-60 15h60m-60 15h60m-40-40v51m20-51v51`} className="ff-dock-grid" />
              <path d={`M${x + 11} 9h14m34 0h14`} className="ff-dock-terminal" />
              {occupied && (
                <path
                  key={signature}
                  d={`M${x + 42} 8h34l8 9v60l-8 10h-68l-8-10v-60l8-9Z`}
                  pathLength="1"
                  className="ff-dock-arrival"
                />
              )}
              <text x={x + 42} y="112" textAnchor="middle">
                {label}
              </text>
            </g>
          );
        })}
        {requests.map((request) => {
          const slot = slots[request.route]++;
          const x = columns[request.route] + (slot % 3) * 18;
          const y = 23 + Math.floor(slot / 3) * 15;
          return (
            <g
              key={request.id}
              className={`ff-request ff-request-${request.route}`}
              data-request-id={request.id}
              data-route={request.route}
              data-private={request.sensitive}
              style={
                {
                  transform: `translate(${x}px, ${y}px)`,
                  "--packet-delay": `${(request.id % 6) * 26}ms`,
                } as CSSProperties
              }
            >
              <circle r="9" className="ff-request-halo" />
              <g key={`${request.route}-${slot}`} className="ff-packet-arrival">
                {request.sensitive ? (
                  <>
                    <path d="M0-5.5 5.5 0 0 5.5-5.5 0Z" />
                    <path d="M0-5.5V0h5.5Z" fill="#e0ffff" opacity=".75" />
                    <path d="M-5.5 0H0v5.5Z" fill="#0c3944" opacity=".55" />
                  </>
                ) : (
                  <>
                    <circle r="5" fill="none" stroke="currentColor" strokeWidth=".8" opacity=".65" />
                    <circle r="3.3" />
                    <path d="M-2-2a2.8 2.8 0 0 1 4 0" fill="none" stroke="#fff7e6" strokeWidth=".8" />
                  </>
                )}
              </g>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
