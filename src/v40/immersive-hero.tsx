import type { MouseEventHandler } from "react";
import { discoveryRoutes } from "./discovery-routes";
import { posterSources } from "./poster-sources.ts";
import { presentation, versionLabel } from "./evidence.ts";
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
        stroke="#e2e6ee"
        strokeOpacity=".38"
        transform="rotate(-30 1170 370)"
      />
      <ellipse
        cx="1170"
        cy="370"
        rx="335"
        ry="190"
        stroke="#3578ff"
        strokeOpacity=".48"
        transform="rotate(23 1170 370)"
      />
      <circle cx="1170" cy="370" r="320" stroke="#e2e6ee" strokeOpacity=".2" strokeDasharray="2 14" />
    </svg>
  );
}
// Instrument overlay drawn in the poster's own 1920 x 1080 space, so it tracks the planet through every camera move.
function HeroHud() {
  return (
    <div className="hero-hud" aria-hidden="true">
      <svg className="hud-track" viewBox="0 0 1920 1080" fill="none">
        <defs>
          <linearGradient id="hero-orbit-trail" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="var(--cyan)" stopOpacity="0" />
            <stop offset="1" stopColor="var(--cyan)" stopOpacity=".5" />
          </linearGradient>
        </defs>
        <circle cx="1508" cy="508" r="360" stroke="#3578ff" strokeOpacity=".38" strokeWidth="1.5" />
        <circle
          cx="1508"
          cy="508"
          r="372"
          stroke="#e2e6ee"
          strokeOpacity=".55"
          strokeWidth="8"
          strokeDasharray="1.5 21.87"
        />
        <circle
          cx="1508"
          cy="508"
          r="381"
          stroke="#e2e6ee"
          strokeOpacity=".82"
          strokeWidth="18"
          strokeDasharray="3 236.39"
        />
        <circle
          cx="1508"
          cy="508"
          r="402"
          stroke="#3578ff"
          strokeOpacity=".2"
          strokeWidth="2"
          strokeDasharray="118 39.86"
        />
        <path
          className="hud-lock"
          d="M1273 380V368H1285M1309 368H1321V380M1321 404V416H1309M1285 416H1273V404"
          stroke="#f5f5f7"
          strokeWidth="2.5"
        />
        <circle cx="1508" cy="508" r="342" stroke="var(--cyan)" strokeOpacity=".12" />
        <g className="hud-orbiter">
          <path
            d="M1326.77 217.97 A342 342 0 0 1 1508 166"
            stroke="url(#hero-orbit-trail)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="1508" cy="166" r="7" fill="var(--cyan)" fillOpacity=".1" />
          <circle cx="1508" cy="166" r="2.8" fill="var(--accent-light)" fillOpacity=".9" />
        </g>
      </svg>
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
        <span>cAshIo / {versionLabel}</span>
        <span>{presentation.name}</span>
        <a className="continuum-arrival-current" href="/">
          Archive edition · Current site&nbsp;→
        </a>
        <span className="continuum-arrival-end">
          <i aria-hidden="true" /> Built after hours
        </span>
      </div>
      <div id="hero-content" className="continuum-composition">
        <div className="continuum-visual">
          <div className="continuum-stage" data-scene={scene.id}>
            <canvas id="hero-stars" aria-hidden="true" />
            <ContinuumStill />
            <figure className="flight-signature-plaque" aria-hidden="true">
              <img
                className="flight-signature"
                src="/brand/platinum/signature-840.webp"
                srcSet="/brand/platinum/signature-420.webp 420w, /brand/platinum/signature-840.webp 840w"
                sizes="(max-width: 600px) calc(100vw - 54px), (max-width: 1179px) 272px, (max-height: 800px) 292px, 322px"
                width="840"
                height="387"
                alt=""
              />
              <figcaption className="continuum-reticle">THE HORIZON IS YOURS</figcaption>
            </figure>
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
            I’m Doug Cashio. This is my after-hours workshop for local AI experiments, original films, and worlds you
            can explore.
          </p>
          <a href="#flight=tour" className="continuum-primary tour-launch" aria-describedby="tour-expectations">
            <span className="tour-launch-symbol" aria-hidden="true">
              ▷
            </span>
            <span className="tour-launch-copy">
              <span className="tour-launch-kicker">Start here</span>
              <strong>Play the 30 second tour</strong>
              <small>Make a decision. Keep your mission card.</small>
            </span>
            <span className="tour-launch-arrow" aria-hidden="true">
              ↗
            </span>
          </a>
          <p id="tour-expectations" className="continuum-footnote">
            Four scenes. <strong>Sound off. Pause any time.</strong>
          </p>
          <nav className="continuum-actions tour-alternatives" aria-label="Other ways to begin">
            <a href="#flight=board" onClick={v.boardShip} className="continuum-secondary">
              <span>
                <strong>Board the starship</strong>
                <small>Explore at your pace</small>
              </span>
              <span aria-hidden="true">↗</span>
            </a>
            <a href="#studies" className="continuum-secondary">
              <span>
                <strong>Try an experiment</strong>
                <small>Change an input. See why.</small>
              </span>
              <span aria-hidden="true">↗</span>
            </a>
          </nav>
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
          <button type="button" className="scene-motion-control" data-motion-toggle="" aria-pressed="false">
            Pause motion
          </button>
        </div>
      </div>
      <div className="continuum-launchpad">
        <div className="continuum-launch-heading">
          <span className="continuum-label">Or follow your curiosity</span>
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
                <strong>{["Explore the worlds", "Try the experiments", "Enter the cinema"][i]}</strong>
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
