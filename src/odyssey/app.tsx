import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { ARTICLES, EXPIRES_AT, LINEAGE, LINEAGE_EVIDENCE } from "../lib/content";
import { BUILD_STORIES } from "../lib/build-stories";
import { runEve } from "../components/eve-console";
import { PROJECTS } from "./data";
import { Arrow, Core, Starfield } from "./effects";
import { useInteractionSound, useMotionPreference, useSectionVisibility } from "./hooks";
import { ProjectLab } from "./labs";
import { FoldTransition } from "./event-horizon";
import { useHeroAtmosphere, useHeroCoreAlignment } from "./horizon-hooks";
import { HeroSignal } from "./hero-signal";
import { OrbitInstrument } from "./orbit-instrument";
import { MissionControl } from "./mission-control";
import { OperatorInsignia } from "./operator-insignia";
import { SystemAtlas } from "./system-atlas";
import { SovereignWorld } from "./sovereign-world";
import { BrandMark } from "./brand-mark";

function Art({
  name,
  className = "",
  eager = false,
}: {
  name: "orbit" | "sanctuary";
  className?: string;
  eager?: boolean;
}) {
  const asset = name === "orbit" ? "orbit-aurora" : name;
  return (
    <picture className={className}>
      <source
        type="image/avif"
        srcSet={`/odyssey/${asset}-800.avif 800w, /odyssey/${asset}-1672.avif 1672w`}
        sizes="100vw"
      />
      <img
        src={`/odyssey/${asset}-1672.webp`}
        srcSet={`/odyssey/${asset}-800.webp 800w, /odyssey/${asset}-1672.webp 1672w`}
        sizes="100vw"
        width="1672"
        height="941"
        alt={
          name === "orbit"
            ? "Original concept art: a cyan-lit titanium orbital ring holds a faceted gold core above a blue planet and warm sunrise."
            : "Original concept art: twin graphite computing monoliths in a sunlit stone sanctuary, with a faceted amber core between them."
        }
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
        decoding="async"
      />
    </picture>
  );
}

function ProjectExplorer({ motion, play }: { motion: boolean; play: () => void }) {
  const [selected, setSelected] = useState(0);
  const [horizontal, setHorizontal] = useState(false);
  const tablist = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const project = PROJECTS[selected];
  const story = BUILD_STORIES[selected];
  useEffect(() => {
    const query = matchMedia("(max-width: 600px)");
    const change = () => setHorizontal(query.matches);
    change();
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    const strip = tablist.current;
    if (!strip || !horizontal) return;
    const keepSelectedVisible = () => {
      const tab = strip.querySelector<HTMLElement>('[aria-selected="true"]');
      if (!tab) return;
      const outer = strip.getBoundingClientRect();
      const inner = tab.getBoundingClientRect();
      // Move only the tab strip; keep the reader's page position undisturbed.
      if (inner.left < outer.left) strip.scrollLeft += inner.left - outer.left;
      else if (inner.right > outer.right) strip.scrollLeft += inner.right - outer.right;
    };
    keepSelectedVisible();
    const observer = new ResizeObserver(keepSelectedVisible);
    observer.observe(strip);
    return () => observer.disconnect();
  }, [selected, horizontal]);
  useEffect(() => {
    const applyHash = () => {
      const match = location.hash.match(/^#build=([a-z]+)/);
      if (match) {
        const index = PROJECTS.findIndex((item) => item.id === match[1]);
        if (index >= 0) {
          setSelected(index);
          setCopied(false);
          setCopyError(false);
          document.getElementById("work")?.scrollIntoView({ behavior: "instant" });
        }
      }
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);
  function choose(index: number) {
    setSelected(index);
    setCopied(false);
    setCopyError(false);
    play();
    history.pushState(null, "", `#build=${PROJECTS[index].id}`);
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(`${location.origin}${location.pathname}#build=${project.id}`);
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  }
  return (
    <div className="o-projects" style={{ "--project": project.color } as CSSProperties}>
      <div className="o-project-index">
        <div className="o-index-label o-micro">SELECT A BUILD / 07</div>
        <div
          ref={tablist}
          role="tablist"
          aria-label="Project demonstrations"
          aria-orientation={horizontal ? "horizontal" : "vertical"}
        >
          {PROJECTS.map((item, i) => (
            <button
              key={item.id}
              id={`tab-${item.id}`}
              role="tab"
              aria-selected={i === selected}
              aria-controls="project-panel"
              tabIndex={i === selected ? 0 : -1}
              onClick={() => choose(i)}
              onKeyDown={(event) => {
                let next: number;
                if (event.key === (horizontal ? "ArrowRight" : "ArrowDown")) next = (i + 1) % PROJECTS.length;
                else if (event.key === (horizontal ? "ArrowLeft" : "ArrowUp"))
                  next = (i + PROJECTS.length - 1) % PROJECTS.length;
                else if (event.key === "Home") next = 0;
                else if (event.key === "End") next = PROJECTS.length - 1;
                else return;
                event.preventDefault();
                choose(next);
                document.getElementById(`tab-${PROJECTS[next].id}`)?.focus();
              }}
            >
              <span>0{i + 1}</span>
              <div>
                <strong>{item.title}</strong>
                <small>{item.category}</small>
              </div>
              <Arrow diagonal />
            </button>
          ))}
        </div>
        <p className="o-index-note">
          Built with purpose.
          <br />
          Explained through interaction.
        </p>
      </div>
      <div
        id="project-panel"
        role="tabpanel"
        aria-labelledby={`tab-${project.id}`}
        tabIndex={0}
        className="o-project-panel"
      >
        <div className="o-project-heading">
          <div>
            <span className="o-micro">INTERACTIVE STUDY / 0{selected + 1}</span>
            <h3>{project.title}</h3>
            <p>{project.subtitle}</p>
          </div>
          <span className="o-project-number" aria-hidden="true">
            0{selected + 1}
          </span>
        </div>
        <p className="o-lab-invitation">{project.cue}</p>
        <ProjectLab key={project.id} index={selected} motion={motion} />
        <details className="o-field-notes" key={`notes-${project.id}`}>
          <summary>
            Read the field notes<span aria-hidden="true">+</span>
          </summary>
          <p>{ARTICLES[selected].note}</p>
          <dl>
            <div>
              <dt>Input</dt>
              <dd>{story.input}</dd>
            </div>
            <div>
              <dt>Method</dt>
              <dd>{story.action}</dd>
            </div>
            <div>
              <dt>Payoff</dt>
              <dd>{story.result}</dd>
            </div>
          </dl>
        </details>
        <div className="o-project-footer">
          <span>LOCAL DEMONSTRATION / NO LIVE SYSTEM ACCESS</span>
          <button className="o-text-button" onClick={copy}>
            {copied ? "Preview link copied ✓" : "Copy this study"}
            <Arrow diagonal />
          </button>
        </div>
        {copyError && (
          <p role="status" className="o-lab-note">
            Clipboard unavailable. Copy the address from your browser to return to this study.
          </p>
        )}
      </div>
    </div>
  );
}

function EvidenceConsole({ onArt }: { onArt: () => void }) {
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [lines, setLines] = useState<string[]>([
    "E.V.E. / PUBLIC EVIDENCE ARCHIVE",
    "Fleet: 28 Aug 2026 · Routing: 21 Aug 2026",
    "Local commands. Dated facts. No connection to the estate.",
    "Type help to explore.",
  ]);
  const [destination, setDestination] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const log = useRef<HTMLDivElement>(null);
  const cursor = useRef(-1);
  useEffect(() => {
    const refresh = () => setExpired(Date.now() >= Date.parse(EXPIRES_AT));
    refresh();
    const timer = setInterval(refresh, 60_000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [lines]);
  function execute(raw: string) {
    const input = raw.trim().slice(0, 160);
    if (!input) return;
    const next = [...history, input].slice(-40);
    setHistory(next);
    cursor.current = -1;
    setCommand("");
    setDestination(null);
    if (input.toLowerCase() === "clear") {
      setLines(["Archive cleared. Type help to explore."]);
      return;
    }
    if (input.toLowerCase() === "bit") {
      setLines((current) =>
        [
          ...current,
          `> ${input}`,
          "YES. A HUMAN IS STILL IN COMMAND.",
          "I’m the faceted core in the orbital artwork. Try engage.",
        ].slice(-120),
      );
      return;
    }
    const result = runEve(input, history);
    setLines((current) => [...current, `> ${input}`, ...result.out].slice(-120));
    if (result.photo) onArt();
    if (result.go !== undefined)
      setDestination(
        ["#top", "#universe", "#universe", "#evidence", "#universe", "#lineage", "#work", "#evidence", "#contact"][
          result.go
        ],
      );
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    execute(command);
  }
  return (
    <div className="o-terminal">
      <div className="o-terminal-bar">
        <span>
          <Core />
          E.V.E.
        </span>
        <span>PUBLIC ARCHIVE / LOCAL</span>
      </div>
      <div
        className="o-console-output"
        ref={log}
        role="log"
        aria-label="E.V.E. command responses"
        aria-live="polite"
        tabIndex={0}
      >
        {lines.map((line, i) => (
          <div key={`${i}-${line}`} className={line.startsWith(">") ? "command" : ""}>
            {line}
          </div>
        ))}
      </div>
      <form onSubmit={submit}>
        <label htmlFor="eve-command">
          <span aria-hidden="true">↳</span>
          <span className="o-sr-only">E.V.E. command</span>
        </label>
        <input
          id="eve-command"
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          maxLength={160}
          autoComplete="off"
          spellCheck={false}
          placeholder="Type a command…"
          onKeyDown={(event) => {
            if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
            event.preventDefault();
            if (event.key === "ArrowUp") cursor.current = Math.min(cursor.current + 1, history.length - 1);
            else cursor.current = Math.max(cursor.current - 1, -1);
            setCommand(cursor.current < 0 ? "" : history[history.length - 1 - cursor.current] || "");
          }}
        />
        <button aria-label="Run E.V.E. command" type="submit">
          <Arrow />
        </button>
      </form>
      <div className="o-command-shortcuts">
        {["fleet", "routes", "whoami", "help"].map((text) => (
          <button key={text} onClick={() => execute(text)}>
            {text}
            <span aria-hidden="true">↵</span>
          </button>
        ))}
      </div>
      {destination && (
        <a className="o-terminal-link" href={destination}>
          Explore the corresponding section
          <Arrow />
        </a>
      )}
      <p className="o-terminal-foot">
        {expired
          ? "Export expired. Historical figures require a fresh owner-verified export."
          : "Dated export · validity ends 27 Sep 2026 · not live telemetry"}
      </p>
    </div>
  );
}

function Lineage() {
  const [selected, setSelected] = useState(1);
  const item = LINEAGE[selected];
  const evidence = LINEAGE_EVIDENCE[selected];
  return (
    <section className="o-lineage o-scene" id="lineage" aria-labelledby="lineage-title">
      <div className="o-section-top">
        <span className="o-kicker">04 / FLIGHT HERITAGE</span>
        <span className="o-micro">THE DISCIPLINE BEHIND THE DESIGN</span>
      </div>
      <div className="o-lineage-layout">
        <div className="o-lineage-copy">
          <h2 id="lineage-title">
            Built with a<br />
            <em>test pilot’s mind.</em>
          </h2>
          <p className="o-section-intro">The future rewards imagination. Flight teaches you to prove it.</p>
          <div className="o-pilots" aria-label="Flight inspirations">
            {LINEAGE.map((pilot, i) => (
              <button key={pilot.name} aria-pressed={selected === i} onClick={() => setSelected(i)}>
                {pilot.name === "K. JOHNSON" ? "Johnson" : pilot.name.charAt(0) + pilot.name.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <div className="o-flight-principle" aria-live="polite">
            <span className="o-micro">{item.craft}</span>
            <h3>{item.rule}</h3>
            <p>{item.note}</p>
            <span className="o-lab-note">
              A working principle inspired by this lineage, not a historical quotation.
            </span>
          </div>
        </div>
        <figure className="o-aircraft">
          <div>
            <img key={evidence.src} src={evidence.src} alt={evidence.alt} loading="lazy" width="1280" height="800" />
            <span className="o-aircraft-mark" aria-hidden="true">
              +<br />+
            </span>
          </div>
          <figcaption>
            <span>{evidence.credit}</span>
            <a href={evidence.sourceUrl} target="_blank" rel="noreferrer">
              Photo source
              <Arrow diagonal />
            </a>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

export function OdysseyApp() {
  const { motion, reduced, paused, setPaused } = useMotionPreference();
  const { sound, toggle, play } = useInteractionSound();
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
  useHeroAtmosphere(motion);
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
      "universe",
      "sovereign-world",
      "observatory",
      "work",
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
    { id: "universe", label: "The universe" },
    { id: "sovereign-world", label: "Starship" },
    { id: "work", label: "Selected work" },
  ];
  return (
    <div className={`odyssey event-horizon aurora ${folding ? "is-folding" : ""}`} data-motion={motion ? "on" : "off"}>
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
          <BrandMark motion={motion} />
        </a>
        <nav aria-label="Primary navigation">
          {nav.map((link) => (
            <a key={link.id} href={`#${link.id}`} aria-current={active === link.id ? "location" : undefined}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="o-header-controls">
          <MissionControl motion={motion} triggerClassName="eh-command-trigger" />
          <button
            className="o-quiet-control"
            onClick={() => setPaused(!paused)}
            aria-pressed={!motion}
            aria-label={
              reduced
                ? "Reduced motion follows your system preference"
                : motion
                  ? "Pause ambient motion"
                  : "Resume ambient motion"
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
            <BrandMark motion={motion} />
          </a>
          <button className="o-close" onClick={() => menu.current?.close()} aria-label="Close navigation">
            ×
          </button>
        </div>
        <nav>
          {[
            ...nav,
            { id: "observatory", label: "The observatory" },
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
        <p>V36 / THE HUMAN RECKONING / A HUMAN IN COMMAND</p>
      </dialog>
      <main id="o-main">
        <section className="o-hero o-scene" id="top" aria-labelledby="hero-title">
          <Art name="orbit" eager className="o-hero-art" />
          <div className="o-hero-shade" />
          <div className="eh-hero-light" aria-hidden="true" />
          <Starfield motion={motion} folding={folding} />
          <div className="o-hero-content">
            <div className="eh-release-mark">
              <b>V36</b>
              <span>THE HUMAN RECKONING / SOVEREIGN EDITION</span>
            </div>
            <span className="o-kicker">
              <i />
              DOUG CASHIO / INDEPENDENT SYSTEMS BUILDER
            </span>
            <h1 id="hero-title">
              Own the iron.
              <br />
              Shape the
              <br />
              <em>possible.</em>
            </h1>
            <p>
              I build AI systems and security tools on hardware I own.
              <br className="o-desktop-br" /> With a human in command.
            </p>
            <div className="o-hero-actions">
              <button className="o-button o-button-gold" onClick={fold} disabled={folding}>
                {folding ? "Course laid in…" : "Enter the universe"}
                <Arrow />
              </button>
              <a className="o-hero-work" href="#sovereign-world">
                Take the controls<span>Step aboard the 3D starship</span>
              </a>
            </div>
          </div>
          <button
            className="o-core-hotspot"
            onClick={fold}
            disabled={folding}
            aria-label="Bit, the human’s co-pilot. Initiate fold and explore ZeusApollo"
          >
            <HeroSignal />
            <span className="o-core-ring" />
            <span className="o-core-label">
              BIT / THE HUMAN’S CO-PILOT
              <br />
              <b>{folding ? "FOLD INITIATED" : "INITIATE FOLD ↗"}</b>
            </span>
          </button>
          <div className="o-hero-bottom">
            <span className="o-micro">
              <b>THE HUMAN RECKONING</b> / V36
            </span>
            <button onClick={viewArt} className="o-art-link">
              Original artwork
              <Arrow diagonal />
            </button>
            <a href="#universe" className="o-scroll-cue">
              SCROLL TO DISCOVER<span>↓</span>
            </a>
          </div>
        </section>
        <div className="o-principles" aria-label="Operating principles">
          <span>Own the infrastructure.</span>
          <Core />
          <span>Make the reasoning visible.</span>
          <Core />
          <span>Keep a human in command.</span>
        </div>
        <section className="o-universe o-scene" id="universe" aria-labelledby="universe-title">
          <div className="o-section-top">
            <span className="o-kicker">01 / THE UNIVERSE</span>
            <span className="o-micro">ZEUSAPOLLO × HERMES</span>
          </div>
          <div className="o-section-heading">
            <h2 id="universe-title" tabIndex={-1}>
              A world of systems.
              <br />
              <em>One accountable human.</em>
            </h2>
            <p>
              Owned compute below. Orchestration between.
              <br />
              Human judgment above.
              <br />
              <span className="o-muted">Select a node and see how the pieces connect.</span>
            </p>
          </div>
          <SystemAtlas
            motion={motion}
            selected={atlasNode}
            onSelect={(index) => {
              setAtlasNode(index);
              play();
            }}
          />
          <div className="o-fact-rail">
            <div>
              <strong>02</strong>
              <span>documented hosts</span>
            </div>
            <div>
              <strong>
                18<span>/19</span>
              </strong>
              <span>guests running at probe</span>
            </div>
            <div>
              <strong>10</strong>
              <span>public routing lanes</span>
            </div>
            <p>
              FLEET · 28 AUG 2026
              <br />
              ROUTING · 21 AUG 2026
              <br />
              <a href="#evidence">
                Inspect the dated evidence
                <Arrow diagonal />
              </a>
            </p>
          </div>
        </section>
        <section className="o-sanctuary o-scene" aria-labelledby="sanctuary-title">
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
            <a className="o-button o-button-light" href="#work">
              See the philosophy at work
              <Arrow />
            </a>
          </div>
          <span className="o-art-caption">ORIGINAL CONCEPT ART / AN IMAGINED COMPUTING SANCTUARY</span>
        </section>
        <section className="eh-world-section o-scene" id="sovereign-world" aria-labelledby="sovereign-world-title">
          <div className="o-section-top">
            <span className="o-kicker">V36 / SOVEREIGN STARSHIP</span>
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
          <SovereignWorld motion={motion} />
          <a href="#observatory" className="eh-observatory-link">
            Explore the orbital instrument
            <Arrow />
          </a>
        </section>
        <section className="eh-observatory o-scene" id="observatory" aria-labelledby="observatory-title">
          <div className="o-section-top">
            <span className="o-kicker">V36 / THE OBSERVATORY</span>
            <span className="o-micro">A VISITOR-OPERATED INSTRUMENT</span>
          </div>
          <div className="o-section-heading">
            <h2 id="observatory-title">
              A universe you can
              <br />
              <em>put your hands on.</em>
            </h2>
            <p>
              Turn the orbit. Change the perspective.
              <br />
              Keep the core in view.
              <br />
              <span className="o-muted">An interactive study of the principles behind the work.</span>
            </p>
          </div>
          <OrbitInstrument motion={motion} onSelect={() => play()} />
          <a href="#work" className="eh-observatory-link">
            Now put the thinking to work
            <Arrow />
          </a>
        </section>
        <section className="o-work o-scene" id="work" aria-labelledby="work-title">
          <div className="o-section-top">
            <span className="o-kicker">02 / SELECTED WORK</span>
            <span className="o-micro">FROM IDEA TO INSTRUMENT</span>
          </div>
          <div className="o-section-heading">
            <h2 id="work-title">
              Don’t just read it.
              <br />
              <em>Put it to work.</em>
            </h2>
            <p>
              Seven projects, opened up for you to explore.
              <br />
              Change an input. See the decision change.
              <br />
              <span className="o-muted">Every demonstration runs locally in your browser.</span>
            </p>
          </div>
          <ProjectExplorer motion={motion} play={play} />
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
              E.V.E. is the public archive. Ask for the fleet, inspect the routing inventory, or meet the operator. The
              answers come from the site’s dated export.
            </p>
            <a href="/status.json" target="_blank" rel="noreferrer" className="o-text-button">
              Read the source export
              <Arrow diagonal />
            </a>
            <div className="o-archive-dates">
              <div>
                <span>FLEET OBSERVATION</span>
                <strong>28 August 2026</strong>
              </div>
              <div>
                <span>ROUTING INVENTORY</span>
                <strong>21 August 2026</strong>
              </div>
            </div>
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
            <OperatorInsignia motion={motion} />
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
                I work where AI, security, and infrastructure meet. My approach is hands-on: own the system, understand
                the decisions, publish the evidence, and keep learning.
              </p>
              <p>
                Science fiction supplies the imagination. Flight-test discipline keeps it honest. The result is this
                small universe of useful, explainable work.
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
            A difficult problem. An ambitious idea.
            <br />A conversation worth having.
          </p>
          <a className="o-contact-email" href="mailto:doug@cashio.us">
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
      <footer className="o-footer">
        <a href="#top" className="o-brand" aria-label="Cashio, back to the beginning">
          <BrandMark motion={motion} />
        </a>
        <span>
          V36 THE HUMAN RECKONING / SOVEREIGN EDITION
          <br />
          <small>Original artwork · Local demonstrations · Dated evidence</small>
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
