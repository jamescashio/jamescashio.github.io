import type { MouseEventHandler } from "react";

type HeroView = {
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
};
import { HeroPlanet } from "./hero-reel.jsx";
import { presentation, observedMonth } from "./evidence.ts";

export function ContinuumPrinciples() {
  return (
    <div className="continuum-principles" aria-label="Lab principles">
      <span>
        <b>Dated evidence</b>
        {observedMonth} observation
      </span>
      <span>
        <b>Read only</b>Inventory probe
      </span>
      <span>
        <b>Quality first</b>Quality picks the model
      </span>
      <span>
        <b>Human in command</b>Cost only breaks a tie
      </span>
    </div>
  );
}

const scenes = [
  { id: "orbit", label: "Orbit", caption: "A little universe. Entirely yours to explore." },
  { id: "signal", label: "Signal", caption: "A thread of light. A human at the center." },
  { id: "constellation", label: "Constellation", caption: "Different ideas. One connected world." },
];

function OrbitalStill() {
  return (
    <svg className="continuum-still" viewBox="0 0 600 600" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="continuum-globe">
          <stop stopColor="#468d9c" />
          <stop offset=".7" stopColor="#102d43" />
          <stop offset="1" stopColor="#071321" />
        </radialGradient>
        <linearGradient id="continuum-ring">
          <stop stopColor="#78e7ef" />
          <stop offset=".5" stopColor="#fff0c5" />
          <stop offset="1" stopColor="#b48b53" />
        </linearGradient>
      </defs>
      <circle cx="300" cy="300" r="180" stroke="#72b9cc" strokeOpacity=".22" />
      <circle cx="300" cy="300" r="196" stroke="#84b9c7" strokeDasharray="1 7" />
      <circle cx="300" cy="300" r="119" fill="url(#continuum-globe)" stroke="#66dbe7" strokeOpacity=".45" />
      {[0, 30, 60, 90, 120, 150].map((a) => (
        <ellipse
          key={a}
          cx="300"
          cy="300"
          rx="119"
          ry="39"
          stroke="#7be7ef"
          strokeOpacity=".2"
          transform={"rotate(" + a + " 300 300)"}
        />
      ))}
      <ellipse cx="300" cy="300" rx="203" ry="67" stroke="url(#continuum-ring)" transform="rotate(-23 300 300)" />
      <ellipse cx="300" cy="300" rx="182" ry="65" stroke="#65c4d8" strokeOpacity=".45" transform="rotate(62 300 300)" />
      <circle cx="127" cy="375" r="4" fill="#ffe1a8" />
      <circle cx="469" cy="230" r="4" fill="#ffe1a8" />
      <path d="M300 85v24M300 491v24M85 300h24M491 300h24" stroke="#85c6d1" strokeOpacity=".6" />
    </svg>
  );
}

export function ContinuumHero({ v }: { v: HeroView }) {
  const scene = scenes.find((s) => s.id === v.scene) || scenes[0];
  return (
    <section
      id="top"
      className="continuum-hero orbital-observatory"
      aria-label="Introduction"
      data-screen-label="Home"
      onMouseMove={v.heroMove}
      onMouseLeave={v.heroLeave}
    >
      <HeroPlanet />
      <div className="continuum-grid" aria-hidden="true" />
      <div className="continuum-arrival">
        <span>cAshIo / V42</span>
        <span>
          {presentation.name} · {presentation.subtitle}
        </span>
        <span className="continuum-arrival-end">Human in command</span>
      </div>
      <div id="hero-content" className="continuum-composition">
        <div className="continuum-copy">
          <p className="continuum-eyebrow">
            <span /> The workshop after hours
          </p>
          <h1>
            The machines <br />
            can think. <br />
            <span>You still decide.</span>
          </h1>
          <p className="continuum-intro">
            I’m Doug Cashio. I build local AI experiments and original worlds after hours. Board a starship, try a
            decision, or explore what I’m making.
          </p>
          <div className="continuum-actions">
            <a href="#flight=board" onClick={v.boardShip} className="continuum-primary">
              <span>Board the starship</span>
              <span aria-hidden="true">↗</span>
            </a>
            <a href="#studies" className="continuum-secondary">
              Try an experiment <span aria-hidden="true">↗</span>
            </a>
          </div>
          <p className="continuum-footnote">A 30 second starship tour · 12 illustrated requests · sound off</p>
          <a href="/cashio.html#logo-reveal" className="hero-logo-reveal">
            <span aria-hidden="true">▷ </span>Watch the logo reveal · 15 seconds
          </a>
        </div>
        <div className="continuum-visual">
          <div className="continuum-stage" data-scene={scene.id}>
            <div className="continuum-stage-heading">
              <span>CONTINUUM / 0{scenes.indexOf(scene) + 1}</span>
              <span>Interactive light study</span>
            </div>
            <canvas id="hero-stars" aria-hidden="true" />
            <OrbitalStill />
            <span className="continuum-coordinate continuum-coordinate-a" aria-hidden="true">
              IMAGINATION
            </span>
            <span className="continuum-coordinate continuum-coordinate-b" aria-hidden="true">
              INTENTION
            </span>
            <div className="continuum-stage-bottom">
              <span>Original generative artwork</span>
              <button type="button" onClick={v.turnScene} aria-label="Rotate the light study">
                Rotate <span aria-hidden="true">↻</span>
              </button>
            </div>
          </div>
          <div className="continuum-scene-controls" role="group" aria-label="Light study form">
            {scenes.map((s) => (
              <button key={s.id} type="button" aria-pressed={scene.id === s.id} onClick={() => v.chooseScene(s.id)}>
                {s.label}
              </button>
            ))}
          </div>
          <p className="continuum-scene-caption" aria-live="polite">
            {scene.caption}
          </p>
        </div>
      </div>
      <div className="continuum-observation" aria-label="Dated lab observation">
        <a className="continuum-observation-date" href="#evidence">
          <span className="continuum-label">Observation desk · {v.observedShortDate}</span>
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
