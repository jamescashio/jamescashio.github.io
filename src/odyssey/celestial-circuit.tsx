import { useEffect, useId, useRef, type CSSProperties } from "react";

export type CircuitMode = "all" | "runners" | "code";
export type CelestialLight = "balanced" | "gold" | "ion";

// Registered to the celestial artwork, including the A's star and the I's crown.
const LETTERS = [
  "M411 333H333C260 333 214 379 214 439C214 505 265 544 334 544H393",
  "M512 552L678 150H692L854 552M630 430H741",
  "M1055 341H980C926 341 911 378 934 400C959 427 1051 425 1061 478C1071 524 1033 543 957 543",
  "M1171 273V548M1171 376C1195 354 1231 346 1260 352C1311 359 1327 393 1327 435V548",
  "M1451 173V548L1426 590H1550L1518 548V173",
  "M1718 340C1596 340 1594 544 1718 544C1843 544 1845 340 1718 340Z",
];
const ORBIT =
  "M190 439C330 207 707 115 1122 133C1520 141 1808 228 1852 371C1904 533 1489 701 983 696C508 690 123 556 159 464C165 451 177 443 190 439Z";
const CROWN = "M1318 100C1318 48 1650 48 1650 100C1650 152 1318 152 1318 100Z";
const GLINTS = [
  [219, 438],
  [684, 431],
  [1055, 340],
  [1171, 273],
  [1484, 70],
  [1486, 623],
  [1815, 439],
];

/** CSS owns ambient motion; finite visitor signals use one cancellable animation generation. */
export function CelestialCircuit({
  detailed,
  animated,
  signal = 0,
  focusLetter,
}: {
  detailed: boolean;
  animated: boolean;
  signal?: number;
  focusLetter?: number;
}) {
  const id = useId().replace(/:/g, "");
  const pulse = useRef<SVGGElement>(null);
  const pulses = useRef<Animation[]>([]);
  const seenSignal = useRef(signal);
  const selected = Math.max(0, Math.min(5, focusLetter ?? 1));

  useEffect(() => {
    if (seenSignal.current === signal) return;
    seenSignal.current = signal;
    pulses.current.forEach((animation) => animation.cancel());
    pulses.current = [];
    if (!animated || signal <= 0) return;
    pulse.current?.querySelectorAll<SVGPathElement>(".celestial-flare").forEach((path, index) => {
      const animation = path.animate(
        [
          { strokeDashoffset: "14", opacity: 0 },
          { opacity: 0.94, offset: 0.16 },
          { opacity: 0.8, offset: 0.72 },
          { strokeDashoffset: "-100", opacity: 0 },
        ],
        {
          duration: index < 6 ? 1900 : 2600,
          delay: index < 6 ? Math.abs(index - selected) * 90 : 700,
          easing: "cubic-bezier(.2,.6,.35,1)",
          fill: "both",
        },
      );
      animation.onfinish = () => animation.cancel();
      pulses.current.push(animation);
    });
  }, [signal, animated, selected]);

  useEffect(() => {
    pulses.current.forEach((animation) => {
      if (animation.playState === "idle" || animation.playState === "finished") return;
      if (animated) animation.play();
      else animation.pause();
    });
  }, [animated]);

  useEffect(() => () => pulses.current.forEach((animation) => animation.cancel()), []);

  return (
    <svg
      className="cashio-circuit celestial-circuit"
      viewBox="0 0 2055 765"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <mask id={`celestial-orbit-${id}`} maskUnits="userSpaceOnUse" x="0" y="0" width="2055" height="765">
          <path fill="white" d="M0 0H2055V765H0Z" />
          <g stroke="black" strokeWidth="86" strokeLinejoin="round" strokeLinecap="round">
            {LETTERS.map((path) => (
              <path key={path} d={path} />
            ))}
          </g>
          <path fill="black" d="M1310 60H1656V130L1535 178V553L1622 630H1342L1424 548V178L1310 130Z" />
        </mask>
      </defs>
      <g className="celestial-orbits">
        <g mask={`url(#celestial-orbit-${id})`}>
          <path className="celestial-orbit-rail" d={ORBIT} />
          {[0, 1, 2].map((index) => (
            <g
              key={index}
              style={{ "--duration": `${18 + index * 4}s`, "--delay": `${-index * 7 - 2}s` } as CSSProperties}
            >
              <path className="celestial-orbit-tail celestial-motion" d={ORBIT} pathLength="100" />
              <path className="celestial-orbit-point celestial-motion" d={ORBIT} pathLength="100" />
            </g>
          ))}
        </g>
        <path className="celestial-crown celestial-motion" d={CROWN} pathLength="100" />
        {detailed && (
          <path
            className="celestial-crown celestial-crown-inner celestial-motion"
            d="M1358 98C1358 68 1609 68 1609 98C1609 128 1358 128 1358 98Z"
            pathLength="100"
          />
        )}
      </g>
      <g className="celestial-runners">
        {LETTERS.map((path, index) => (
          <g
            key={path}
            className={index === 1 || index === 4 ? "celestial-gold" : undefined}
            style={{ "--duration": `${5.8 + index * 0.47}s`, "--delay": `${-index * 1.43}s` } as CSSProperties}
          >
            <path className="celestial-tail celestial-motion" d={path} pathLength="100" />
            <path className="celestial-head celestial-motion" d={path} pathLength="100" />
          </g>
        ))}
      </g>
      <g className="celestial-stars">
        {GLINTS.map(([x, y], index) => (
          <g key={index} transform={`translate(${x} ${y})`}>
            <path
              className="celestial-glint celestial-motion"
              d="M-19 0H19M0-23V23"
              style={{ "--duration": `${5.4 + index * 0.6}s`, "--delay": `${-index * 1.7}s` } as CSSProperties}
            />
          </g>
        ))}
      </g>
      {detailed && focusLetter !== undefined && (
        <g className="celestial-selection">
          <path className="celestial-selection-halo" d={LETTERS[selected]} />
          <path className="celestial-selection-edge" d={LETTERS[selected]} />
        </g>
      )}
      <g ref={pulse} className="celestial-pulse">
        {LETTERS.map((path) => (
          <path key={path} className="celestial-flare" d={path} pathLength="100" />
        ))}
        <g mask={`url(#celestial-orbit-${id})`}>
          <path className="celestial-flare" d={ORBIT} pathLength="100" />
        </g>
        <path className="celestial-flare" d={CROWN} pathLength="100" />
      </g>
    </svg>
  );
}
