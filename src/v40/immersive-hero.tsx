import type { MouseEventHandler } from "react";
import { discoveryRoutes } from "./discovery-routes";
import { posterSources } from "./poster-sources.ts";
type HeroView = {
  wide: boolean;
  scene: string;
  turnScene: () => void;
  chooseScene: (scene: string) => void;
  heroMove: MouseEventHandler<HTMLElement>;
  heroLeave: MouseEventHandler<HTMLElement>;
  boardShip: MouseEventHandler<HTMLAnchorElement>;
  observedShortDate: string;
  observedDate: string;
  fleetLine: string;
  telemetry: Array<{ label: string; value: string | number }>;
  discovery: string | null;
  closeDiscovery: () => void;
  foldScene: () => void;
  foldCount: number;
  heroQuip: string | null;
  cameraClose: boolean;
  toggleCamera: () => void;
};
const scenes = [
  { id: "orbit", label: "Orbit", caption: "Excellent view. Deeply unreasonable parking." },
  { id: "signal", label: "Signal", caption: "Big ideas. Questionable cable management." },
  { id: "constellation", label: "Constellation", caption: "Connect the dots. The universe misplaced the manual." },
];
// The cinema card uses text free artwork so its label never sits on top of the trailer's title art.
const pathImage = (r: { stops: Array<{ image: string }> }, i: number) =>
  i === 2 ? "/v40/assets/zenith-threshold-poster.webp" : r.stops[0].image;
function ContinuumStill() {
  return (
    <svg className="continuum-still" viewBox="0 0 1600 820" fill="none" aria-hidden="true">
      <ellipse
        cx="1170"
        cy="370"
        rx="300"
        ry="210"
        stroke="#edbd6c"
        strokeOpacity=".38"
        transform="rotate(-30 1170 370)"
      />
      <ellipse
        cx="1170"
        cy="370"
        rx="335"
        ry="190"
        stroke="#72e5f4"
        strokeOpacity=".48"
        transform="rotate(23 1170 370)"
      />
      <circle cx="1170" cy="370" r="320" stroke="#edbd6c" strokeOpacity=".2" strokeDasharray="2 14" />
    </svg>
  );
}
// Instrument overlay drawn in the poster's own 1920 x 1080 space, so it tracks the planet through every camera move.
function HeroHud() {
  return (
    <div className="hero-hud" aria-hidden="true">
      <svg className="hud-track" viewBox="0 0 1920 1080" fill="none">
        <circle cx="1508" cy="508" r="360" stroke="#72e5f4" strokeOpacity=".38" strokeWidth="1.5" />
        <circle
          cx="1508"
          cy="508"
          r="372"
          stroke="#edbd6c"
          strokeOpacity=".55"
          strokeWidth="8"
          strokeDasharray="1.5 21.87"
        />
        <circle
          cx="1508"
          cy="508"
          r="381"
          stroke="#ffd98f"
          strokeOpacity=".82"
          strokeWidth="18"
          strokeDasharray="3 236.39"
        />
        <circle
          cx="1508"
          cy="508"
          r="402"
          stroke="#72e5f4"
          strokeOpacity=".2"
          strokeWidth="2"
          strokeDasharray="118 39.86"
        />
        <path
          className="hud-lock"
          d="M1273 380V368H1285M1309 368H1321V380M1321 404V416H1309M1285 416H1273V404"
          stroke="#ffe0a1"
          strokeWidth="2.5"
        />
      </svg>
      <span className="hud-orbiter" />
    </div>
  );
}
export function ImmersiveHero({ v }: { v: HeroView }) {
  const scene = scenes.find((s) => s.id === v.scene) || scenes[0];
  return (
    <section
      id="top"
      className="continuum-hero immersive-hero orbital-observatory"
      aria-label="Introduction"
      data-screen-label="Home"
      data-scene={scene.id}
      data-camera={v.cameraClose ? "close" : "wide"}
      onMouseMove={v.heroMove}
      onMouseLeave={v.heroLeave}
    >
      <div className="hero-planet" aria-hidden="true">
        <div className="hero-flight-camera">
          <img
            className="hero-live-poster"
            src="/v41/first-light-observatory-1920.webp"
            srcSet="/v41/first-light-observatory-960.webp 960w, /v41/first-light-observatory-1920.webp 1920w"
            sizes="100vw"
            width="1920"
            height="1080"
            fetchPriority="high"
            alt=""
          />
          <HeroHud />
        </div>
        <div className="flight-atmosphere" />
      </div>
      <div className="continuum-horizon" aria-hidden="true" />
      <div className="continuum-arrival">
        <span>cAshIo / V43</span>
        <span>Starfall</span>
        <span className="continuum-arrival-end">
          <i aria-hidden="true" /> Built after hours
        </span>
      </div>
      <div id="hero-content" className="continuum-composition">
        <div className="continuum-visual">
          <div className="continuum-stage" data-scene={scene.id}>
            <canvas id="hero-stars" aria-hidden="true" />
            <ContinuumStill />
            <img
              className="flight-signature"
              src="/brand/celestial-840.webp"
              srcSet="/brand/celestial-420.webp 420w, /brand/celestial-840.webp 840w"
              sizes="(max-width: 600px) 200px, 340px"
              width="840"
              height="315"
              alt=""
              aria-hidden="true"
            />
            <div className="continuum-reticle" aria-hidden="true">
              <span>THE HORIZON IS YOURS</span>
            </div>
          </div>
        </div>
        <div className="continuum-copy">
          <p className="continuum-eyebrow">
            <span /> A little order. A lot of universe.
          </p>
          <h1>
            The machines
            <br /> can think. <br />
            <span>You still decide.</span>
          </h1>
          <p className="aurum-manifesto">Imagination, with intention.</p>
          <p className="continuum-intro">
            I’m Doug Cashio. I build local AI experiments and original worlds after hours. Board a starship, try a
            decision, or explore what I’m making.
          </p>
          <a href="#flight=tour" className="continuum-primary tour-launch">
            <span className="tour-launch-symbol" aria-hidden="true">
              ▷
            </span>
            <span className="tour-launch-copy">
              <strong>Play the 30 second tour</strong>
              <small>Board. Cut the cloud. Take command.</small>
            </span>
            <span className="tour-launch-arrow" aria-hidden="true">
              ↗
            </span>
          </a>
          <div className="continuum-actions tour-alternatives">
            <a href="#flight=board" onClick={v.boardShip} className="continuum-secondary">
              Board the starship <span aria-hidden="true">↗</span>
            </a>
            <a href="#studies" className="continuum-secondary">
              Try an experiment <span aria-hidden="true">↗</span>
            </a>
          </div>
          <p className="continuum-footnote">
            <strong>Your pace. Your command.</strong> Four scenes · sound off · pause any time.
          </p>
          <a href="/cashio.html#logo-reveal" className="hero-logo-reveal">
            <span aria-hidden="true">▷ </span>Watch the logo reveal · 15 seconds
          </a>
        </div>
        <div className="continuum-scene-deck">
          <div className="flight-camera-control">
            <span>{v.cameraClose ? "Close approach" : "Wide orbit"}</span>
            <button
              type="button"
              aria-pressed={v.cameraClose}
              onClick={v.toggleCamera}
              aria-label={v.cameraClose ? "Pull back from the horizon" : "Fly closer to the horizon"}
            >
              {v.cameraClose ? "Pull back" : "Fly closer"} <span aria-hidden="true">↗</span>
            </button>
          </div>
          <details className="scene-tools" open={v.wide}>
            <summary>
              Play with the universe <span aria-hidden="true">＋</span>
            </summary>
            <div className="continuum-scene-controls" role="group" aria-label="Light study form">
              {scenes.map((s, i) => (
                <button key={s.id} type="button" aria-pressed={scene.id === s.id} onClick={() => v.chooseScene(s.id)}>
                  <span aria-hidden="true">0{i + 1}</span>
                  {s.label}
                </button>
              ))}
            </div>
            <div className="continuum-stage-bottom">
              <button type="button" onClick={v.turnScene} aria-label="Rotate the light study">
                Rotate <span aria-hidden="true">↻</span>
              </button>
              <span className="continuum-art-label">Interactive artwork</span>
              <button type="button" onClick={v.foldScene}>
                Fold space <span aria-hidden="true">✦</span>
              </button>
            </div>
            <p className="continuum-scene-caption" aria-live="polite">
              {v.heroQuip || scene.caption}
            </p>
          </details>
        </div>
      </div>
      <div className="continuum-launchpad">
        <div className="continuum-launch-heading">
          <span className="continuum-label">Three ways into the universe</span>
          {/* One finder: Plot a course opens Mission Control, where the guided routes now live. */}
          <button id="discovery-launch" type="button" data-mission-open="" aria-haspopup="dialog">
            Plot a course <span aria-hidden="true">↗</span>
          </button>
        </div>
        <div className="continuum-paths">
          {discoveryRoutes.map((r, i) => (
            <a key={r.id} href={["#rooms", "#studies", "#eagle-film"][i]}>
              <img
                src={pathImage(r, i)}
                srcSet={posterSources(pathImage(r, i))}
                sizes="(max-width: 600px) 80px, 33vw"
                alt=""
                width="640"
                height="360"
                loading="lazy"
                decoding="async"
              />
              <span>
                <small>
                  0{i + 1} / {r.label}
                </small>
                <strong>{["Find your world", "Make something click", "Enter the cinema"][i]}</strong>
                <span className="continuum-path-description">
                  {
                    [
                      "Explore four interactive worlds",
                      "Try seven interactive experiments",
                      "House Cashio and original films",
                    ][i]
                  }
                </span>
              </span>
              <span className="continuum-path-arrow" aria-hidden="true">
                ↗
              </span>
            </a>
          ))}
        </div>
      </div>
      <div className="continuum-observation" aria-label="Dated lab observation">
        <a className="continuum-observation-date" href="#evidence">
          <span className="continuum-label">Observation desk</span>
          <strong>My lab, observed {v.observedDate}</strong>
          <span>{v.fleetLine}</span>
        </a>
        <dl className="continuum-readings">
          {v.telemetry.map((m) => (
            <div key={m.label}>
              <dt>{m.label}</dt>
              <dd>{m.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <a className="continuum-next" href="#eagle-film">
        <span>
          <span className="continuum-label">Up next / 01</span> Watch House Cashio
        </span>
        <span>
          61 seconds <span aria-hidden="true">↓</span>
        </span>
      </a>
    </section>
  );
}
