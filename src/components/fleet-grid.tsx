import { useEffect, useId, useMemo, useState } from "react";
import { NAMED_ROLES, PVE } from "@/lib/content";

type Point = { x: number; y: number };

/**
 * The Grid starmap: the 28 August probe drawn as a fleet map.
 *
 * Two host rings hold the 19 documented guest slots (13 on Zeus, one of them the
 * stopped guest; 6 on Apollo). The seven observed role families orbit the quorum
 * core on curved routes with packets in flight. Roles are never attributed to a
 * host, because the public export withholds that mapping on purpose.
 */

type Layout = {
  width: number;
  height: number;
  core: Point;
  zeus: Point & { ring: number };
  apollo: Point & { ring: number };
  roleAngles: readonly number[];
  roleRx: number;
  roleRy: number;
  /** Trunk endpoints leave the hubs on the axis that faces the core. */
  vertical: boolean;
};

const ZEUS_SLOTS = 13;
const APOLLO_SLOTS = 6;
const STOPPED_SLOT = 8; // the one documented guest that was stopped at the probe

/** Wide map: hosts left and right of the quorum core. */
const LANDSCAPE: Layout = {
  width: 1000,
  height: 444,
  core: { x: 500, y: 222 },
  zeus: { x: 160, y: 222, ring: 78 },
  apollo: { x: 840, y: 222, ring: 66 },
  roleAngles: [-146, -104, -62, -22, 154, 108, 62],
  roleRx: 230,
  roleRy: 170,
  vertical: false,
};

/** Tall map for phones: hosts above and below the core, roles to either side. */
const PORTRAIT: Layout = {
  width: 560,
  height: 860,
  core: { x: 280, y: 440 },
  zeus: { x: 280, y: 150, ring: 78 },
  apollo: { x: 280, y: 720, ring: 66 },
  roleAngles: [-150, -30, 180, 0, 150, 30, 90],
  roleRx: 185,
  roleRy: 108,
  vertical: true,
};

function polar(center: Point, radius: number, degrees: number): Point {
  const a = (degrees * Math.PI) / 180;
  return { x: round(center.x + Math.cos(a) * radius), y: round(center.y + Math.sin(a) * radius) };
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}

/** Quadratic route that bows away from the straight line so packets visibly arc. */
function route(from: Point, to: Point, bow: number) {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const cx = round(mx + (-dy / len) * bow);
  const cy = round(my + (dx / len) * bow);
  return `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;
}

type FleetGridProps = {
  hover: number | null;
  lock: number | null;
  onHover: (index: number | null) => void;
  onLock: (index: number) => void;
};

function usePortraitMap() {
  const [portrait, setPortrait] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(max-width: 767px)");
    const sync = () => setPortrait(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  return portrait;
}

export function FleetGrid({ hover, lock, onHover, onLock }: FleetGridProps) {
  const uid = useId().replace(/:/g, "");
  const layout = usePortraitMap() ? PORTRAIT : LANDSCAPE;
  const { core: CORE, zeus: ZEUS, apollo: APOLLO } = layout;
  const roles = useMemo(
    () =>
      NAMED_ROLES.map((role, index) => {
        const angle = layout.roleAngles[index] ?? -90;
        const a = (angle * Math.PI) / 180;
        const point = {
          x: round(CORE.x + Math.cos(a) * layout.roleRx),
          y: round(CORE.y + Math.sin(a) * layout.roleRy),
        };
        const below = point.y > CORE.y;
        return { ...role, index, point, below, path: route(point, CORE, index % 2 ? 34 : -34) };
      }),
    [CORE, layout],
  );
  const zeusSlots = useMemo(
    () => Array.from({ length: ZEUS_SLOTS }, (_, i) => polar(ZEUS, ZEUS.ring, -90 + (360 / ZEUS_SLOTS) * i)),
    [ZEUS],
  );
  const apolloSlots = useMemo(
    () => Array.from({ length: APOLLO_SLOTS }, (_, i) => polar(APOLLO, APOLLO.ring, -90 + (360 / APOLLO_SLOTS) * i)),
    [APOLLO],
  );
  const trunkZeus = layout.vertical
    ? route({ x: ZEUS.x, y: ZEUS.y + 36 }, { x: CORE.x, y: CORE.y - 50 }, -26)
    : route({ x: ZEUS.x + 36, y: ZEUS.y }, { x: CORE.x - 50, y: CORE.y }, -26);
  const trunkApollo = layout.vertical
    ? route({ x: CORE.x, y: CORE.y + 50 }, { x: APOLLO.x, y: APOLLO.y - 36 }, -26)
    : route({ x: CORE.x + 50, y: CORE.y }, { x: APOLLO.x - 36, y: APOLLO.y }, -26);
  const focus = hover ?? lock;

  return (
    <figure className="za-fleet-grid" aria-label="Fleet map of the 28 August 2026 probe">
      <svg viewBox={`0 0 ${layout.width} ${layout.height}`} role="img" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id={`${uid}-core`} cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="rgba(255,149,0,0.55)" />
            <stop offset="0.55" stopColor="rgba(255,149,0,0.12)" />
            <stop offset="1" stopColor="rgba(255,149,0,0)" />
          </radialGradient>
          <radialGradient id={`${uid}-host`} cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="rgba(0,249,255,0.35)" />
            <stop offset="1" stopColor="rgba(0,249,255,0)" />
          </radialGradient>
          <filter id={`${uid}-glow`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* grid floor */}
        <g className="za-fleet-floor" aria-hidden>
          {Array.from({ length: Math.floor(layout.height / 46) }, (_, i) => (
            <line key={`h${i}`} x1="0" x2={layout.width} y1={40 + i * 46} y2={40 + i * 46} />
          ))}
          {Array.from({ length: Math.floor(layout.width / 50) + 1 }, (_, i) => (
            <line key={`v${i}`} y1="0" y2={layout.height} x1={i * 50} x2={i * 50} />
          ))}
        </g>

        {/* trunks between hosts and the quorum core */}
        <g className="za-fleet-trunks">
          <path d={trunkZeus} />
          <path d={trunkApollo} />
          <circle className="za-fleet-packet is-trunk" r="3.4">
            <animateMotion dur="3.6s" repeatCount="indefinite" path={trunkZeus} />
          </circle>
          <circle className="za-fleet-packet is-trunk" r="3.4">
            <animateMotion dur="3.6s" begin="1.8s" repeatCount="indefinite" path={trunkApollo} />
          </circle>
          <circle className="za-fleet-packet is-trunk is-return" r="2.6">
            <animateMotion
              dur="4.4s"
              begin="0.9s"
              repeatCount="indefinite"
              keyPoints="1;0"
              keyTimes="0;1"
              path={trunkZeus}
            />
          </circle>
          <circle className="za-fleet-packet is-trunk is-return" r="2.6">
            <animateMotion
              dur="4.4s"
              begin="2.7s"
              repeatCount="indefinite"
              keyPoints="1;0"
              keyTimes="0;1"
              path={trunkApollo}
            />
          </circle>
        </g>

        {/* host rings */}
        {[
          { host: ZEUS, slots: zeusSlots, name: "ZEUS", tally: "12 OF 13 AT PROBE" },
          { host: APOLLO, slots: apolloSlots, name: "APOLLO", tally: "6 OF 6 AT PROBE" },
        ].map(({ host, slots, name, tally }) => (
          <g key={name} className="za-fleet-host">
            <circle cx={host.x} cy={host.y} r={host.ring + 30} fill={`url(#${uid}-host)`} />
            <circle className="za-fleet-orbit" cx={host.x} cy={host.y} r={host.ring} />
            <g className="za-fleet-spokes">
              {slots.map((p, i) => (
                <line key={i} x1={host.x} y1={host.y} x2={p.x} y2={p.y} />
              ))}
            </g>
            <circle className="za-fleet-hub" cx={host.x} cy={host.y} r="30" />
            <circle className="za-fleet-hub-ring" cx={host.x} cy={host.y} r="30" />
            <text className="za-fleet-hub-name" x={host.x} y={host.y + 5} textAnchor="middle">
              {name}
            </text>
            {slots.map((p, i) => {
              const stopped = name === "ZEUS" && i === STOPPED_SLOT;
              return (
                <g key={i} className={`za-fleet-slot ${stopped ? "is-stopped" : ""}`}>
                  <circle cx={p.x} cy={p.y} r="6" filter={stopped ? undefined : `url(#${uid}-glow)`} />
                  {stopped ? <circle cx={p.x} cy={p.y} r="10" className="za-fleet-slot-halo" /> : null}
                </g>
              );
            })}
            <text className="za-fleet-tally" x={host.x} y={host.y + host.ring + 40} textAnchor="middle">
              {tally}
            </text>
          </g>
        ))}

        {/* named role routes */}
        <g className="za-fleet-routes">
          {roles.map((role) => (
            <g
              key={role.name + role.role}
              className={`za-fleet-role ${focus === role.index ? "is-focus" : ""} ${lock === role.index ? "is-lock" : ""} ${
                focus != null && focus !== role.index ? "is-dim" : ""
              }`}
            >
              <path className="za-fleet-route" d={role.path} />
              <circle className="za-fleet-packet" r="2.8">
                <animateMotion
                  dur={`${4.2 + (role.index % 3) * 0.7}s`}
                  begin={`${role.index * 0.55}s`}
                  repeatCount="indefinite"
                  path={role.path}
                />
              </circle>
            </g>
          ))}
        </g>

        {/* quorum core */}
        <g className="za-fleet-core">
          <circle cx={CORE.x} cy={CORE.y} r="92" fill={`url(#${uid}-core)`} />
          <circle className="za-fleet-ping" cx={CORE.x} cy={CORE.y} r="44" />
          <circle className="za-fleet-ping delay" cx={CORE.x} cy={CORE.y} r="44" />
          <circle className="za-fleet-core-ring" cx={CORE.x} cy={CORE.y} r="44" />
          <circle className="za-fleet-core-heart" cx={CORE.x} cy={CORE.y} r="9" />
          <text className="za-fleet-core-name" x={CORE.x} y={CORE.y - 54} textAnchor="middle">
            QUORUM
          </text>
          <text className="za-fleet-core-sub" x={CORE.x} y={CORE.y + 66} textAnchor="middle">
            {`2 HOSTS · PVE ${PVE}`}
          </text>
        </g>
      </svg>

      {/* Interactive role markers sit in HTML so they are real buttons with real focus. */}
      <div className="za-fleet-markers" aria-label="Observed role families">
        {roles.map((role) => (
          <button
            key={role.name + role.role}
            type="button"
            aria-pressed={lock === role.index}
            aria-label={`${role.name} · ${role.role}`}
            className={`za-fleet-marker ${role.below ? "is-below" : ""} ${focus === role.index ? "is-focus" : ""} ${
              lock === role.index ? "is-lock" : ""
            }`}
            style={{ left: `${(role.point.x / layout.width) * 100}%`, top: `${(role.point.y / layout.height) * 100}%` }}
            onMouseEnter={() => onHover(role.index)}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover(role.index)}
            onBlur={() => onHover(null)}
            onClick={() => onLock(role.index)}
          >
            <span className="za-fleet-marker-dot" aria-hidden />
            <span className="za-fleet-marker-label" aria-hidden>
              <b>{String(role.index + 1).padStart(2, "0")}</b> {role.name}
            </span>
          </button>
        ))}
      </div>

      <figcaption className="za-fleet-legend za-mono">
        <span>
          <i className="is-lit" /> GUEST SLOT AT PROBE
        </span>
        <span>
          <i className="is-stopped" /> STOPPED GUEST
        </span>
        <span>
          <i className="is-route" /> OBSERVED ROLE FAMILY · SELECT TO TRACE
        </span>
        <span className="text-dim">12 ROLES NOT ITEMIZED · PUBLIC-SAFE</span>
      </figcaption>
    </figure>
  );
}
