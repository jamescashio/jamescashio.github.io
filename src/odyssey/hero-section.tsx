import { useState, type MouseEvent } from "react";
import { Arrow, Starfield } from "./effects";
import { Art } from "./artwork";
import { HeroCinema } from "./hero-cinema";
import { LightwakeAtmosphere, LightwakeControls, ExperienceGlyph } from "./lightwake-scene";
import { HeroSignal } from "./hero-signal";
import type { useExperienceController } from "./experience-controller";

export function HeroSection({
  scenes,
  folding,
  fold,
  paused,
  viewArt,
}: {
  scenes: ReturnType<typeof useExperienceController>;
  folding: boolean;
  fold: () => void;
  paused: boolean;
  viewArt: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  const { ambientMotion, flight, signature, lensing, film, startFlight, openFilm, openSignature, openLensing } = scenes;
  const [sceneControlsOpen, setSceneControlsOpen] = useState(false);
  return (
    <section className="o-hero o-scene" id="top" aria-labelledby="hero-title" data-lightwake-light="dawn">
      <Art name="orbit" eager className="o-hero-art" />
      <div className="o-hero-shade" />
      <div className="eh-hero-light" aria-hidden="true" />
      <Starfield motion={ambientMotion} folding={folding} />
      <LightwakeAtmosphere />
      <div className="o-hero-content">
        <div className="eh-release-mark">
          <b>V37.17</b>
          <span>CONTINUUM · PERSPECTIVE</span>
        </div>
        <span className="o-kicker">
          <i />
          DOUG CASHIO / AI · SECURITY · IMAGINATION
        </span>
        <h1 id="hero-title">
          Own the iron.
          <br />
          Shape the
          <br />
          <em>possible.</em>
        </h1>
        <p>
          I build local AI and security tools that put privacy and human judgment first.
          <br className="o-desktop-br" /> Your data. Your budget. Your call.
        </p>
        <div className="o-hero-actions">
          <button
            className="o-button o-button-gold lens-enter continuum-first-flight"
            type="button"
            onClick={startFlight}
          >
            <span className="lens-enter-glyph" aria-hidden="true">
              ◉
            </span>
            <span>
              Take the 30-second flight<small>OPEN THE HULL. CUT THE CLOUD. KEEP COMMAND.</small>
            </span>
            <Arrow />
          </button>
          <a href="#boundary-comparison" className="o-text-button flight-work-link">
            Try one decision <Arrow diagonal />
          </a>
          <a href="#smart-routing" className="cashio-intro-link">
            See what I built ↗
          </a>
        </div>
        <div className="lens-hero-notes">
          <span>30 seconds.</span>
          <i />
          <span>Sound off.</span>
          <i />
          <span>Your pace.</span>
        </div>
        <details className="perspective-discover" id="hero-experiences">
          <summary>
            Explore more of the universe <span aria-hidden="true">＋</span>
          </summary>
          <div className="lens-discover-links">
            <a className="polish-meet" href="/cashio.html">
              Meet cAshIo <span>THE PERSONAL WORKSPACE ↗</span>
            </a>
            <button className="lens-film-link" type="button" onClick={(event) => openFilm(event.currentTarget)}>
              <ExperienceGlyph kind="film" />
              <span>Watch Lightwake</span>
              <small>8-SECOND FILM</small>
            </button>
            <button className="o-signature-link" type="button" onClick={openSignature}>
              <ExperienceGlyph kind="signature" />
              <span>Sculpt the logo</span>
              <small>TURN & IGNITE</small>
            </button>
            <button
              className="lens-observatory-link"
              type="button"
              onClick={(event) => openLensing(event.currentTarget)}
            >
              <ExperienceGlyph kind="orbit" />
              <span>Lensing Observatory</span>
              <small>EXPLORE THE ORBIT</small>
            </button>
          </div>
        </details>
      </div>
      <details className="polish-scene-tools" onToggle={(event) => setSceneControlsOpen(event.currentTarget.open)}>
        <summary>
          Scene controls <span aria-hidden="true">+</span>
        </summary>
        {sceneControlsOpen && <HeroCinema blocked={paused || flight !== null || signature || lensing || film} />}
        <LightwakeControls />
      </details>
      <button className="o-core-hotspot" onClick={fold} disabled={folding}>
        <HeroSignal />
        <span className="o-core-ring" />
        <span className="o-core-label">
          BIT / HUMAN CO-PILOT
          <br />
          <b>{folding ? "FOLD INITIATED" : "INITIATE FOLD ↗"}</b>
        </span>
      </button>
      <div className="o-hero-bottom">
        <span className="o-micro">
          <b>AN ORIGINAL ORBITAL WORLD</b> / 03
        </span>
        <button onClick={viewArt} className="o-art-link">
          Original artwork
          <Arrow diagonal />
        </button>
        <a href="#work" className="o-scroll-cue">
          SCROLL TO DISCOVER<span>↓</span>
        </a>
      </div>
    </section>
  );
}
