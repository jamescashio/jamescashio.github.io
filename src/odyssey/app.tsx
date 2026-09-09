import { useExperienceController } from "./experience-controller";
import { ExperienceOverlays } from "./experience-overlays";
import { HeroSection } from "./hero-section";
import { BoundaryComparison } from "./boundary-comparison";
import { useEffect, useRef, useState } from "react";
import { Arrow, Core } from "./effects";
import { useInteractionSound, useMotionPreference, useSectionVisibility } from "./hooks";
import { FoldTransition } from "./event-horizon";
import { useHeroAtmosphere, useHeroCoreAlignment } from "./horizon-hooks";
import { OrbitInstrument } from "./orbit-instrument";
import { MissionControl } from "./mission-control";
import { OperatorSection } from "./operator-section";
import { SystemAtlas } from "./system-atlas";
import { SovereignWorld } from "./sovereign-world";
import { BrandMark } from "./brand-mark";
import { Art } from "./artwork";
import { ProjectExplorer } from "./project-explorer";
import { BuildStory } from "./build-story";
import { FLEET_EVIDENCE } from "./fleet-evidence";
import { EvidenceSection } from "./evidence-section";
import { Lineage } from "./flight-heritage";
export function OdysseyApp() {
  const { motion, reduced, paused, setPaused } = useMotionPreference();
  const { sound, toggle, play } = useInteractionSound();
  const scenes = useExperienceController(motion);
  const { flight, signature, lensing, film, ambientMotion, startFlight, openFilm, openSignature } = scenes;
  const [folding, setFolding] = useState(false);
  const [foldOrigin, setFoldOrigin] = useState<{ x: number; y: number } | undefined>(undefined);
  const [atlasNode, setAtlasNode] = useState(1);
  const [active, setActive] = useState("top");
  const progress = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const menu = useRef<HTMLDialogElement>(null);
  const menuOpener = useRef<HTMLButtonElement>(null);
  const art = useRef<HTMLDialogElement>(null);
  const artOpener = useRef<HTMLElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useSectionVisibility();
  useHeroAtmosphere(ambientMotion);
  useHeroCoreAlignment();
  useEffect(() => {
    document.documentElement.style.scrollBehavior = motion ? "smooth" : "auto";
    return () => {
      document.documentElement.style.scrollBehavior = "";
    };
  }, [motion]);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!motion && folding) {
      clearTimeout(timer.current);
      setFolding(false);
      document.getElementById("universe")?.scrollIntoView({ behavior: "instant" });
      document.getElementById("universe-title")?.focus({ preventScroll: true });
    }
  }, [motion, folding]);
  useEffect(() => {
    let frame = 0;
    let activeSection = "top";
    const sections = [
      "top",
      "work",
      "universe",
      "sovereign-world",
      "observatory",
      "evidence",
      "lineage",
      "operator",
      "contact",
    ]
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => Boolean(element));
    const update = () => {
      const total = document.documentElement.scrollHeight - innerHeight;
      let current = "top";
      for (const element of sections) {
        if (element.getBoundingClientRect().top < innerHeight * 0.4) current = element.id;
      }
      if (progress.current)
        progress.current.style.transform = `scaleX(${total > 0 ? Math.min(1, Math.max(0, scrollY / total)) : 0})`;
      if (current !== activeSection) {
        activeSection = current;
        setActive(current);
      }
      frame = 0;
    };
    const scroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", scroll);
    return () => {
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", scroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  function fold() {
    play();
    if (!motion) {
      document.getElementById("universe")?.scrollIntoView({ behavior: "instant" });
      document.getElementById("universe-title")?.focus({ preventScroll: true });
      return;
    }
    clearTimeout(timer.current);
    const anchor = document.querySelector(".o-core-hotspot")?.getBoundingClientRect();
    if (anchor) setFoldOrigin({ x: anchor.left + anchor.width / 2, y: anchor.top + anchor.height / 2 });
    // Begin the finite alignment at each ring's actual pose, without a rotation jump.
    for (const orbit of document.querySelectorAll<SVGElement>(
      ".lf-core-orbit-a, .lf-core-orbit-b, .ah-signal-tracker",
    )) {
      const pose = getComputedStyle(orbit).transform;
      orbit.style.setProperty("--lf-lock-from", pose === "none" ? "rotate(0deg)" : pose);
    }
    setFolding(true);
    timer.current = setTimeout(() => {
      document.getElementById("universe")?.scrollIntoView({ behavior: "smooth" });
      timer.current = setTimeout(() => {
        setFolding(false);
        document.getElementById("universe-title")?.focus({ preventScroll: true });
      }, 750);
    }, 900);
  }
  function viewArt() {
    artOpener.current = document.activeElement as HTMLElement;
    art.current?.showModal();
  }
  async function copyEmail() {
    setCopied(false);
    try {
      await navigator.clipboard.writeText("doug@cashio.us");
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  }
  const nav = [
    { id: "work", label: "Selected work" },
    { id: "sovereign-world", label: "Starship" },
    { id: "universe", label: "The universe" },
  ];
  return (
    <div
      className={`odyssey event-horizon aurora lightfold lensing lightwake ${folding ? "is-folding" : ""}`}
      data-motion={motion ? "on" : "off"}
      data-overlay={flight || signature || lensing || film ? "open" : "closed"}
    >
      <a className="o-skip" href="#o-main">
        Skip to content
      </a>
      <div className="o-scroll-progress" ref={progress} aria-hidden="true" />
      <FoldTransition active={folding && motion} origin={foldOrigin} />
      <span className="o-sr-only" role="status">
        {folding ? "Crossing the threshold. Opening the system atlas." : ""}
      </span>
      <header className="o-header">
        <a href="#top" className="o-brand" aria-label="Cashio, back to the beginning">
          <BrandMark motion={ambientMotion} eager />
        </a>
        <nav aria-label="Primary navigation">
          {nav.map((link) => (
            <a key={link.id} href={`#${link.id}`} aria-current={active === link.id ? "location" : undefined}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="o-header-controls">
          <MissionControl motion={motion} triggerClassName="eh-command-trigger" onFirstFlight={startFlight} />
          <button
            className="o-quiet-control"
            onClick={() => setPaused(!paused)}
            aria-pressed={!motion}
            aria-label={
              reduced
                ? "Motion off — follows your system preference"
                : motion
                  ? "Motion on — pause ambient motion"
                  : "Motion off — resume ambient motion"
            }
            title={
              reduced
                ? "Your system requests reduced motion"
                : motion
                  ? "Pause ambient motion"
                  : "Resume ambient motion"
            }
            disabled={reduced}
          >
            <span aria-hidden="true">{motion ? "Ⅱ" : "▷"}</span>
            <span>Motion {motion ? "on" : "off"}</span>
          </button>
          <button
            className="o-quiet-control o-sound"
            onClick={toggle}
            aria-pressed={sound}
            aria-label={sound ? "Turn interaction sound off" : "Turn interaction sound on"}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path d="M4 9h4l5-4v14l-5-4H4Z" />
              <path d={sound ? "M17 8c3 2 3 6 0 8M20 4c6 5 6 11 0 16" : "m17 9 5 6m0-6-5 6"} />
            </svg>
          </button>
          <a className="o-header-hail" href="#contact">
            Let’s talk
            <Arrow diagonal />
          </a>
          <button
            ref={menuOpener}
            className="o-menu-button"
            aria-label="Open navigation"
            onClick={() => menu.current?.showModal()}
          >
            <span />
            <span />
          </button>
        </div>
      </header>
      <dialog ref={menu} className="o-menu" aria-label="Site navigation" onClose={() => menuOpener.current?.focus()}>
        <div>
          <a href="#top" className="o-brand" onClick={() => menu.current?.close()}>
            <BrandMark motion={ambientMotion} />
          </a>
          <button className="o-close" onClick={() => menu.current?.close()} aria-label="Close navigation">
            ×
          </button>
        </div>
        <nav>
          {[
            ...nav,
            { id: "lensing", label: "Lensing Observatory" },
            { id: "observatory", label: "Principles Engine" },
            { id: "evidence", label: "Evidence archive" },
            { id: "lineage", label: "Flight heritage" },
            { id: "operator", label: "The operator" },
            { id: "contact", label: "Make contact" },
          ].map((link, i) => (
            <a key={link.id} href={`#${link.id}`} onClick={() => menu.current?.close()}>
              <span>0{i + 1}</span>
              {link.label}
              <Arrow diagonal />
            </a>
          ))}
        </nav>
        <p>V37.13 / CONTINUUM / A HUMAN IN COMMAND</p>
      </dialog>
      <main id="o-main">
        <HeroSection scenes={scenes} folding={folding} fold={fold} paused={paused} viewArt={viewArt} />
        <div className="o-principles" role="group" aria-label="Operating principles">
          <span>Own the infrastructure.</span>
          <Core />
          <span>Make the reasoning visible.</span>
          <Core />
          <span>Keep a human in command.</span>
        </div>
        <section className="o-work o-scene" id="work" aria-labelledby="work-title">
          <div className="o-section-top">
            <span className="o-kicker">01 / SELECTED WORK</span>
            <span className="o-micro">BUILT. OPERATED. EXPLAINED.</span>
          </div>
          <div className="o-section-heading">
            <h2 id="work-title" tabIndex={-1}>
              Try a decision.
              <br />
              <em>See what changes.</em>
            </h2>
            <p>
              One document. The same task. Now change its privacy boundary.
              <br />
              Predict the route, then test the rule yourself.
            </p>
          </div>
          <BoundaryComparison motion={ambientMotion} />
          <div className="perspective-study-intro">
            <span className="o-kicker">GO DEEPER / SEVEN WORKING STUDIES</span>
            <p>Change the inputs. Inspect the rule. Follow the evidence.</p>
          </div>
          <ProjectExplorer motion={ambientMotion} play={play} />
          <BuildStory />
        </section>
        <section className="o-universe o-scene" id="universe" aria-labelledby="universe-title">
          <div className="o-section-top">
            <span className="o-kicker">02 / THE UNIVERSE</span>
            <span className="o-micro">ZEUSAPOLLO × HERMES</span>
          </div>
          <div className="o-section-heading">
            <h2 id="universe-title" tabIndex={-1}>
              A world of systems.
              <br />
              <em>One accountable human.</em>
            </h2>
            <p>
              Zeus and Apollo are the hardware I own and operate.
              <br />
              HERMES is the orchestration layer. I remain accountable for the decisions.
              <br />
              <span className="o-muted">Select a node to see its role and the evidence behind it.</span>
            </p>
          </div>
          <SystemAtlas
            motion={ambientMotion}
            selected={atlasNode}
            onSelect={(index) => {
              setAtlasNode(index);
              play();
            }}
          />
          <div className="o-fact-rail">
            <div>
              <strong>{FLEET_EVIDENCE.proxmox.hostsOnline.toString().padStart(2, "0")}</strong>
              <span>hosts at observation</span>
            </div>
            <div>
              <strong>{FLEET_EVIDENCE.containers.running}</strong>
              <span>LXC containers running</span>
            </div>
            <div>
              <strong>{FLEET_EVIDENCE.virtualMachines.running.toString().padStart(2, "0")}</strong>
              <span>QEMU virtual machine running</span>
            </div>
            <p>
              FLEET · {FLEET_EVIDENCE.verifiedLong.toUpperCase()}
              <br />
              ROUTING · NOT VERIFIED
              <br />
              <a href="#evidence">
                Inspect the dated evidence
                <Arrow diagonal />
              </a>
            </p>
          </div>
        </section>
        <section className="o-sanctuary o-scene" id="sanctuary" aria-labelledby="sanctuary-title">
          <Art name="sanctuary" />
          <div className="o-sanctuary-copy">
            <span className="o-kicker">THE PHILOSOPHY</span>
            <h2 id="sanctuary-title">
              Technology should
              <br />
              extend our reach.
              <br />
              <em>Not replace our judgment.</em>
            </h2>
            <div className="parallax-sanctuary-actions">
              <button
                className="o-button o-button-light parallax-sanctuary-film"
                type="button"
                onClick={(event) => openFilm(event.currentTarget, "sanctuary")}
              >
                Enter the sanctuary
                <Arrow />
              </button>
              <span>A FIFTEEN-SECOND FILM · THEN STEP INSIDE</span>
              <a href="#work">
                See the philosophy at work <Arrow diagonal />
              </a>
            </div>
          </div>
          <span className="o-art-caption">ORIGINAL CONCEPT ART / AN IMAGINED COMPUTING SANCTUARY</span>
        </section>
        <section className="eh-world-section o-scene" id="sovereign-world" aria-labelledby="sovereign-world-title">
          <div className="o-section-top">
            <span className="o-kicker">V37 / SOVEREIGN STARSHIP</span>
            <span className="o-micro">ONE SHIP. THREE WAYS TO THINK.</span>
          </div>
          <div className="o-section-heading">
            <h2 id="sovereign-world-title">
              Your ship.
              <br />
              <em>Your intelligence.</em>
            </h2>
            <p>
              Step aboard. Open the hull. Trace twelve AI requests.
              <br />
              Cut the cloud link. See what stays with you.
            </p>
          </div>
          <SovereignWorld motion={ambientMotion} />
          <a href="#observatory" className="eh-observatory-link">
            Explore the Principles Engine
            <Arrow />
          </a>
        </section>
        <section className="eh-observatory o-scene" id="observatory" aria-labelledby="observatory-title">
          <div className="o-section-top">
            <span className="o-kicker">V37 / THE PRINCIPLES ENGINE</span>
            <span className="o-micro">A VISITOR-OPERATED INSTRUMENT</span>
          </div>
          <div className="o-section-heading">
            <h2 id="observatory-title">
              Put the principles
              <br />
              <em>in motion.</em>
            </h2>
            <p>
              Turn the instrument. Choose a principle.
              <br />
              See the design decision behind it.
            </p>
          </div>
          <OrbitInstrument motion={ambientMotion} onSelect={() => play()} />
          <a href="#work" className="eh-observatory-link">
            Now put the thinking to work
            <Arrow />
          </a>
        </section>
        <EvidenceSection onArt={viewArt} />
        <Lineage />
        <OperatorSection motion={ambientMotion} onExplore={openSignature} />
        <section className="o-contact o-scene" id="contact" aria-labelledby="contact-title">
          <div className="o-contact-orbit" aria-hidden="true" />
          <span className="o-kicker">06 / OPEN A CHANNEL</span>
          <h2 id="contact-title">
            <span className="ah-contact-first">What could we</span>
            <br />
            <em>build next?</em>
          </h2>
          <p>
            Tell me what you want to build and your hardest constraint.
            <br />
            AI spending, private data, or a system that needs to be easier to understand—start there.
          </p>
          <a
            className="o-contact-email"
            href="mailto:doug@cashio.us?subject=An%20idea%20from%20Cashio&amp;body=What%20I%20want%20to%20build%3A%0A%0AMy%20hardest%20constraint%3A%0A%0AThe%20study%20or%20idea%20that%20caught%20my%20attention%3A%0A"
          >
            doug@cashio.us
            <Arrow diagonal />
          </a>
          <button className="o-text-button" onClick={copyEmail}>
            {copied ? "Email address copied ✓" : "Copy email address"}
          </button>
          <span className="o-sr-only" role="status">
            {copied ? "Email address copied to your clipboard." : ""}
          </span>
          {copyError && (
            <p className="o-lab-note" role="status">
              Clipboard unavailable. Select doug@cashio.us above and copy it directly.
            </p>
          )}
          <p className="o-release-note">
            The Human Reckoning. Inspired by the Butlerian Jihad in Frank Herbert’s{" "}
            <a
              href="https://penguinrandomhousehighereducation.com/book/?isbn=9780441005901"
              target="_blank"
              rel="noreferrer"
            >
              <cite>Dune</cite>
            </a>
            .
            <br />
            Powerful tools. Human judgment in command.
          </p>
          <div className="o-contact-signoff">
            <Core />
            <span>A HUMAN IN COMMAND.</span>
          </div>
        </section>
      </main>
      <ExperienceOverlays scenes={scenes} motion={motion} reduced={reduced} />
      <footer className="o-footer">
        <a href="#top" className="o-brand" aria-label="Cashio, back to the beginning">
          <BrandMark motion={ambientMotion} />
        </a>
        <span>
          V37.13 / CONTINUUM
          <br />
          <small>Crafted with GPT-6 Astra · Directed by Doug Cashio</small>
        </span>
        <div>
          <a href="/command-deck.html">
            V35 command deck
            <Arrow diagonal />
          </a>
          <a href="https://github.com/jamescashio/jamescashio.github.io" target="_blank" rel="noreferrer">
            View source
            <Arrow diagonal />
          </a>
          <a href="#top">Back to orbit ↑</a>
          <a
            href="https://github.com/jamescashio/jamescashio.github.io/blob/main/PRIVACY.md"
            target="_blank"
            rel="noreferrer"
          >
            Privacy <Arrow diagonal />
          </a>
        </div>
      </footer>
      <dialog
        ref={art}
        className="o-art-dialog"
        aria-label="Original Odyssey artwork"
        onClose={() => artOpener.current?.focus()}
      >
        <button className="o-close" aria-label="Close artwork" onClick={() => art.current?.close()}>
          ×
        </button>
        <Art name="orbit" />
        <div>
          <span className="o-kicker">ODYSSEY / ORIGINAL CONCEPT ART</span>
          <p>An engineered orbit. A faceted co-pilot. A human at the center.</p>
          <small>
            Created with OpenAI image generation for this design. This is an imagined scene, not a photograph of the
            estate.
          </small>
        </div>
      </dialog>
    </div>
  );
}
