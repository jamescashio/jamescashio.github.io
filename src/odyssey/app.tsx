import { lazy, useEffect, useRef, useState, type MouseEvent } from "react";
import { Arrow, Core, Starfield } from "./effects";
import { useInteractionSound, useMotionPreference, useSectionVisibility } from "./hooks";
import { FoldTransition } from "./event-horizon";
import { useHeroAtmosphere, useHeroCoreAlignment } from "./horizon-hooks";
import { HeroSignal } from "./hero-signal";
import { OrbitInstrument } from "./orbit-instrument";
import { MissionControl } from "./mission-control";
import { OperatorInsignia } from "./operator-insignia";
import { SystemAtlas } from "./system-atlas";
import { SovereignWorld } from "./sovereign-world";
import { BrandMark } from "./brand-mark";
import { Art } from "./artwork";
import { HeroCinema } from "./hero-cinema";
import { ExperienceGlyph, LightwakeAtmosphere, LightwakeControls } from "./lightwake-scene";
import { ProjectExplorer } from "./project-explorer";
import { BuildStory } from "./build-story";
import { SceneBoundary } from "./scene-boundary";
import { FLEET_EVIDENCE } from "./fleet-evidence";
import { EvidenceConsole } from "./evidence-console";
import { AuditStory } from "./audit-story";
import { Lineage } from "./flight-heritage";
import type { LensingClip } from "./lensing-film";
const FirstFlight = lazy(() => import("./first-flight"));
const BrandStudio = lazy(() => import("./brand-studio"));
const LensingObservatory = lazy(() => import("./lensing-observatory"));
const LensingFilm = lazy(() => import("./lensing-film"));

function resolveLauncher(opener: HTMLElement | null, fallback: string) {
  return opener?.isConnected &&
    opener !== document.body &&
    opener !== document.documentElement &&
    opener.getClientRects().length
    ? opener
    : ([...document.querySelectorAll<HTMLElement>(fallback)].find((element) => element.getClientRects().length) ??
        null);
}

export function OdysseyApp() {
  const { motion, reduced, paused, setPaused } = useMotionPreference();
  const { sound, toggle, play } = useInteractionSound();
  const [flight, setFlight] = useState<string | null>(null);
  const [signature, setSignature] = useState(false);
  const [lensing, setLensing] = useState(false);
  const [film, setFilm] = useState(false);
  const [filmClip, setFilmClip] = useState<LensingClip>("lightwake");
  const [filmRouteRevision, setFilmRouteRevision] = useState(0);
  const [lensArrival, setLensArrival] = useState(false);
  const filmOpener = useRef<HTMLElement | null>(null);
  const lensOpener = useRef<HTMLElement | null>(null);
  const ambientMotion = motion && flight === null && !signature && !lensing && !film;
  function openFilm(opener: HTMLElement, clip: LensingClip = "lightwake") {
    filmOpener.current = opener;
    setFilmClip(clip);
    setFilm(true);
  }
  function openLensing(opener: HTMLElement) {
    lensOpener.current = opener;
    setLensArrival(false);
    setLensing(true);
  }
  function enterFilmWorld() {
    lensOpener.current = resolveLauncher(filmOpener.current, ".lens-film-link");
    setLensArrival(true);
    setFilm(false);
    setLensing(true);
    if (/^#film(?:=(?:awakening|signature|lightwake|sanctuary))?$/.test(location.hash))
      history.replaceState(null, "", location.pathname + location.search);
  }
  const signatureOpener = useRef<HTMLElement | null>(null);
  function watchSignature() {
    filmOpener.current = resolveLauncher(signatureOpener.current, ".o-signature-link");
    setSignature(false);
    setFilmClip("signature");
    setFilm(true);
    if (location.hash === "#signature") history.replaceState(null, "", location.pathname + location.search);
  }
  function sculptFilmLight() {
    signatureOpener.current = resolveLauncher(filmOpener.current, ".lens-film-link");
    setFilm(false);
    setSignature(true);
    if (/^#film(?:=(?:awakening|signature|lightwake|sanctuary))?$/.test(location.hash))
      history.replaceState(null, "", location.pathname + location.search);
  }
  function openSignature(event: MouseEvent<HTMLButtonElement>) {
    signatureOpener.current = event.currentTarget;
    setSignature(true);
  }
  const flightOpener = useRef<HTMLElement | null>(null);
  function startFlight(event?: MouseEvent<HTMLButtonElement>) {
    flightOpener.current = event?.currentTarget ?? (document.activeElement as HTMLElement);
    setFlight("board");
  }
  useEffect(() => {
    const readFlight = () => {
      const value = location.hash.match(/^#flight=(board|hull|blackout|permission)$/)?.[1];
      setFlight(value ?? null);
      setSignature(location.hash === "#signature");
      setLensing(location.hash === "#lensing");
      setLensArrival(false);
      const filmRoute = /^#film(?:=(?:awakening|signature|lightwake|sanctuary))?$/.test(location.hash);
      setFilm(filmRoute);
      if (filmRoute) setFilmRouteRevision((revision) => revision + 1);
      setFilmClip(
        location.hash === "#film"
          ? "arrival"
          : location.hash === "#film=awakening"
            ? "awakening"
            : location.hash === "#film=signature"
              ? "signature"
              : location.hash === "#film=sanctuary"
                ? "sanctuary"
                : "lightwake",
      );
    };
    readFlight();
    window.addEventListener("hashchange", readFlight);
    return () => window.removeEventListener("hashchange", readFlight);
  }, []);
  function dismissScene(kind: "film" | "lensing" | "signature" | "flight") {
    const scene = {
      film: {
        close: () => setFilm(false),
        opener: filmOpener.current,
        fallback: ".lens-film-link",
        route: /^#film(?:=(?:awakening|signature|lightwake|sanctuary))?$/,
      },
      lensing: {
        close: () => setLensing(false),
        opener: lensOpener.current,
        fallback: ".lens-observatory-link",
        route: /^#lensing$/,
      },
      signature: {
        close: () => setSignature(false),
        opener: signatureOpener.current,
        fallback: ".o-signature-link",
        route: /^#signature$/,
      },
      flight: {
        close: () => setFlight(null),
        opener: flightOpener.current,
        fallback: ".continuum-first-flight, .lens-flight-link, .lens-enter",
        route: /^#flight=/,
      },
    }[kind];
    scene.close();
    if (scene.route.test(location.hash)) history.replaceState(null, "", location.pathname + location.search);
    requestAnimationFrame(() => resolveLauncher(scene.opener, scene.fallback)?.focus({ preventScroll: true }));
  }
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
        <p>V37.12 / CONTINUUM / A HUMAN IN COMMAND</p>
      </dialog>
      <main id="o-main">
        <section className="o-hero o-scene" id="top" aria-labelledby="hero-title" data-lightwake-light="dawn">
          <Art name="orbit" eager className="o-hero-art" />
          <div className="o-hero-shade" />
          <div className="eh-hero-light" aria-hidden="true" />
          <Starfield motion={ambientMotion} folding={folding} />
          <LightwakeAtmosphere />
          <div className="o-hero-content">
            <div className="eh-release-mark">
              <b>V37.12</b>
              <span>CONTINUUM</span>
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
              I build AI and security tools that make complex decisions clear.
              <br className="o-desktop-br" /> Where data goes. What it costs. When a human takes over.
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
              <a href="#work" className="o-text-button flight-work-link">
                Explore the working studies <Arrow diagonal />
              </a>
            </div>
            <div className="lens-hero-notes">
              <span>Privacy.</span>
              <i />
              <span>Resilience.</span>
              <i />
              <span>Human control.</span>
            </div>
            <div className="lens-discover-links">
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
          </div>
          <HeroCinema blocked={paused || flight !== null || signature || lensing || film} />
          <LightwakeControls />
          <button
            className="o-core-hotspot"
            onClick={fold}
            disabled={folding}
            aria-label="Bit, the human’s co-pilot. Initiate fold and explore ZeusApollo"
          >
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
              Seven experiments in AI, security, and systems design.
              <br />
              Start with HERMES: match the work to a route, then test the privacy boundary.
              <br />
              <a className="o-text-button" href="#smart-routing">
                Read the 26¢/day story and its dated evidence <Arrow diagonal />
              </a>
            </p>
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
              <br />
              <span className="o-muted">A spacecraft you can explore. An AI boundary you control.</span>
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
              Ownership, evidence, and human authority shape the work.
              <br />
              Select a principle to see how it changes a design decision.
              <br />
              <span className="o-muted">The orbit is the metaphor. The decisions are the point.</span>
            </p>
          </div>
          <OrbitInstrument motion={ambientMotion} onSelect={() => play()} />
          <a href="#work" className="eh-observatory-link">
            Now put the thinking to work
            <Arrow />
          </a>
        </section>
        <section className="o-evidence o-scene" id="evidence" aria-labelledby="evidence-title">
          <div className="o-evidence-copy">
            <span className="o-kicker">03 / THE EVIDENCE</span>
            <h2 id="evidence-title">
              Trust has
              <br />a <em>timestamp.</em>
            </h2>
            <p>A beautiful dashboard is a beginning. Evidence needs a source, a date, and a clear boundary.</p>
            <p className="o-muted">
              E.V.E. reads the latest dated observation. Ask for the fleet, see what remains unverified, or compare the
              historical archive. Guest runtime describes a process state; it does not establish application health,
              successful recovery, or failover readiness.
            </p>
            <a href="/status.json" target="_blank" rel="noreferrer" className="o-text-button">
              Read the latest dated export
              <Arrow diagonal />
            </a>
            <div className="o-archive-dates">
              <div>
                <span>FLEET OBSERVATION</span>
                <strong>{FLEET_EVIDENCE.verifiedLong}</strong>
              </div>
              <div>
                <span>ROUTING INVENTORY</span>
                <strong>Not verified</strong>
              </div>
            </div>
            <a href={FLEET_EVIDENCE.archive.url} target="_blank" rel="noreferrer" className="o-text-button">
              Compare the August archive <Arrow diagonal />
            </a>
            <AuditStory />
          </div>
          <EvidenceConsole onArt={viewArt} />
        </section>
        <Lineage />
        <section className="o-operator o-scene" id="operator" aria-labelledby="operator-title">
          <div className="o-section-top">
            <span className="o-kicker">05 / THE OPERATOR</span>
            <span className="o-micro">PENSACOLA, FLORIDA</span>
          </div>
          <div className="o-operator-layout">
            <OperatorInsignia motion={ambientMotion} onExplore={openSignature} />
            <div className="o-operator-copy">
              <span className="o-kicker">DOUG CASHIO</span>
              <h2 id="operator-title">
                Endlessly curious.
                <br />
                <em>Personally accountable.</em>
              </h2>
              <p className="o-operator-lead">
                Principal Solutions Consultant.
                <br />
                Independent systems builder.
              </p>
              <p>
                I turn difficult system choices into something people can understand and test: where AI should run, what
                information it can use, and which decisions need a person.
              </p>
              <p>
                This is my independent workshop. I own and operate the hardware, build the tools, and publish what I can
                verify. Science fiction supplies the imagination. Flight-test discipline keeps it honest.
              </p>
              <div className="o-operator-links">
                <a href="https://www.linkedin.com/in/dougcashio" target="_blank" rel="noreferrer">
                  LinkedIn
                  <Arrow diagonal />
                </a>
                <a href="https://github.com/jamescashio" target="_blank" rel="noreferrer">
                  GitHub
                  <Arrow diagonal />
                </a>
                <a href="https://www.credly.com/users/james-cashio/badges/credly" target="_blank" rel="noreferrer">
                  Credentials
                  <Arrow diagonal />
                </a>
              </div>
            </div>
          </div>
        </section>
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
      {film && (
        <SceneBoundary name="Cinema" onClose={() => dismissScene("film")}>
          <LensingFilm
            key={`${filmClip}-${filmRouteRevision}`}
            motion={motion}
            initialClip={filmClip}
            onExplore={enterFilmWorld}
            onSignature={sculptFilmLight}
            onWork={() => {
              setFilm(false);
              history.replaceState(null, "", location.pathname + location.search + "#work");
              requestAnimationFrame(() => {
                const heading = document.getElementById("work-title");
                heading?.focus({ preventScroll: true });
                heading?.scrollIntoView({ block: "start", behavior: "instant" });
              });
            }}
            onClose={() => dismissScene("film")}
          />
        </SceneBoundary>
      )}
      {lensing && (
        <SceneBoundary name="Lensing Observatory" onClose={() => dismissScene("lensing")}>
          <LensingObservatory
            motion={motion}
            reduced={reduced}
            initialPreset={lensArrival ? { light: "eclipse", view: "gate", resonance: true } : undefined}
            onClose={() => dismissScene("lensing")}
          />
        </SceneBoundary>
      )}
      {signature && (
        <SceneBoundary name="Celestial signature" onClose={() => dismissScene("signature")}>
          <BrandStudio motion={motion} onWatch={watchSignature} onClose={() => dismissScene("signature")} />
        </SceneBoundary>
      )}
      {flight !== null && (
        <SceneBoundary name="First Flight" onClose={() => dismissScene("flight")}>
          <FirstFlight
            key={flight}
            motion={motion}
            initialStep={flight}
            onClose={(destination) => {
              setFlight(null);
              if (destination) {
                location.hash = destination;
                requestAnimationFrame(() => {
                  const target = document.getElementById(destination.startsWith("build=") ? "work" : destination);
                  target?.scrollIntoView({ behavior: "instant" });
                  const heading = target?.querySelector<HTMLElement>("h2");
                  heading?.setAttribute("tabindex", "-1");
                  heading?.focus({ preventScroll: true });
                });
              } else {
                dismissScene("flight");
              }
            }}
          />
        </SceneBoundary>
      )}
      <footer className="o-footer">
        <a href="#top" className="o-brand" aria-label="Cashio, back to the beginning">
          <BrandMark motion={ambientMotion} />
        </a>
        <span>
          V37.12 / CONTINUUM
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
