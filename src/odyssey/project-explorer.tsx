import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { ARTICLES } from "../lib/content";
import { BUILD_STORIES } from "../lib/build-stories";
import { PROJECTS } from "./data";
import { Arrow } from "./effects";
import { ProjectLab } from "./labs";

// Decorative studies of the instruments. The live models below own every result.
const STUDY_ART = [
  {
    body: "M72 17 99 33V62L72 78 45 62V33ZM14 36 27 29 39 36V51L27 58 14 51ZM109 29 122 22 135 29V43L122 50 109 43Z",
    detail:
      "M45 33 72 49 99 33M72 49V78M14 36 27 43 39 36M27 43V58M109 29 122 36 135 29M122 36V50M62 32 72 26 83 32 72 39Z",
    trace: "M17 69H31L54 49H72L94 28H127M72 49V69",
    nodes: [
      [27, 43],
      [72, 49],
      [122, 36],
    ],
  },
  {
    body: "M13 66 30 56 48 65V75L30 85 13 76ZM40 50 57 40 75 49V59L57 69 40 60ZM68 34 85 24 103 33V43L85 53 68 44ZM96 18 113 8 131 17V27L113 37 96 28Z",
    detail:
      "M13 66 30 76 48 65M30 76V85M40 50 57 60 75 49M57 60V69M68 34 85 44 103 33M85 44V53M96 18 113 28 131 17M113 28V37",
    trace: "M25 63H39V47H67V31H95V15H119",
    nodes: [
      [30, 63],
      [57, 47],
      [85, 31],
      [113, 15],
    ],
  },
  {
    body: "M72 11 107 25V49C107 67 89 79 72 87 55 79 37 67 37 49V25ZM72 20 98 30V49C98 61 85 72 72 78 59 72 46 61 46 49V30Z",
    detail: "M72 11V20M37 25 46 30M107 25 98 30M72 78V87M19 25v-7h13m80 0h13v7M19 70v7h13m80 0h13v-7",
    trace: "M54 49 67 61 91 34",
    nodes: [
      [54, 49],
      [67, 61],
      [91, 34],
    ],
  },
  {
    body: "M29 17 91 10 111 21V63L49 73 29 61ZM38 28 100 20 119 31V73L57 82 38 70ZM48 39 108 30 128 42V82L68 91 48 79Z",
    detail:
      "M29 17 49 29 111 21M49 29V73M38 28 57 39 119 31M57 39V82M48 39 68 51 128 42M68 51V91M77 58 116 52M77 67 112 61M77 77 100 73",
    trace: "M18 72H33L51 84 70 82 121 75",
    nodes: [
      [33, 72],
      [70, 82],
      [121, 75],
    ],
  },
  {
    body: "M73 16C111 16 116 79 73 79S32 16 73 16ZM73 25C43 25 44 70 73 70S103 25 73 25ZM15 39H26V72H15ZM119 25H130V63H119Z",
    detail:
      "M73 16V9M73 79V86M39 47H32M105 47H112M50 24 45 19M97 25 102 20M50 70 45 75M97 70 102 75M18 48h5m-5 8h5m99-21h5m-5 8h5m-5 8h5",
    trace: "M73 30V48L89 57M17 81H39M106 81H128",
    nodes: [
      [73, 48],
      [89, 57],
    ],
  },
  {
    body: "M13 25 119 15 133 27V76L26 86 13 74ZM22 31 113 23 124 32V67L34 76 22 66Z",
    detail: "M13 25 26 38 133 27M26 38V86M32 45 116 37M32 56 116 48M32 66 116 58M49 35V73M69 33V71M91 30V68",
    trace: "M26 60C34 51 42 71 50 57S63 58 70 49 78 52 84 36 96 42 103 33L119 36",
    nodes: [
      [50, 57],
      [84, 36],
      [119, 36],
    ],
  },
  {
    body: "M60 39 75 30 91 39V56L75 65 60 56ZM17 21 29 14 41 21V34L29 41 17 34ZM109 17 121 10 133 17V30L121 37 109 30ZM24 70 36 63 48 70V83L36 90 24 83ZM107 68 119 61 131 68V81L119 88 107 81Z",
    detail:
      "M60 39 75 48 91 39M75 48V65M17 21 29 28 41 21M29 28V41M109 17 121 24 133 17M121 24V37M24 70 36 77 48 70M36 77V90M107 68 119 75 131 68M119 75V88",
    trace: "M29 28 75 48 121 24M36 77 75 48 119 75M29 28 36 77M121 24 119 75",
    nodes: [
      [29, 28],
      [75, 48],
      [121, 24],
      [36, 77],
      [119, 75],
    ],
  },
];

function StudyThumbnail({ index, hero = false }: { index: number; hero?: boolean }) {
  const id = useId().replace(/:/g, "");
  const art = STUDY_ART[index];
  return (
    <i className={`ln-project-thumb lw-study-art${hero ? " lw-study-art-hero" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 144 100" fill="none" focusable="false">
        <defs>
          <linearGradient id={`lw-metal-${id}`} x1="25" y1="12" x2="110" y2="95" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4f7685" />
            <stop offset=".38" stopColor="#183448" />
            <stop offset=".72" stopColor="#081321" />
            <stop offset="1" stopColor="#315063" />
          </linearGradient>
          <radialGradient id={`lw-light-${id}`}>
            <stop stopColor="#87e7ef" stopOpacity=".18" />
            <stop offset="1" stopColor="#87e7ef" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="73" cy="58" rx="68" ry="42" fill={`url(#lw-light-${id})`} />
        <path className="lw-art-ground" d="M5 78 72 39 141 78M19 86 86 47M38 94 105 55M5 61 72 100M24 50 111 100" />
        <path className="lw-art-shadow" d={art.body} transform="translate(0 4)" />
        <path className="lw-art-body" d={art.body} fill={`url(#lw-metal-${id})`} fillRule="evenodd" />
        <path className="lw-art-etch" d={art.detail} />
        <path className="lw-art-route" d={art.trace} />
        {art.nodes.map(([x, y], i) => (
          <g key={i}>
            <circle className="lw-art-node-halo" cx={x} cy={y} r="4.4" />
            <circle className="lw-art-node" cx={x} cy={y} r={i === 1 ? "2.1" : "1.5"} />
          </g>
        ))}
        <path className="lw-art-light" d={art.trace} pathLength="100" />
      </svg>
    </i>
  );
}

export function ProjectExplorer({ motion, play }: { motion: boolean; play: () => void }) {
  const [selected, setSelected] = useState(0);
  const [horizontal, setHorizontal] = useState(false);
  const tablist = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const project = PROJECTS[selected];
  const story = BUILD_STORIES[selected];
  useEffect(() => {
    const query = matchMedia("(max-width: 900px)");
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
    <div
      className="o-projects lw-projects"
      data-study={project.id}
      data-motion={motion ? "on" : "off"}
      style={{ "--project": project.color } as CSSProperties}
    >
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
                document.getElementById(`tab-${PROJECTS[next].id}`)?.focus({ preventScroll: true });
              }}
            >
              <span className="ln-project-index">0{i + 1}</span>
              <StudyThumbnail index={i} />
              <div className="ln-project-label">
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
        <div className="lw-study-context">
          <div className="lw-study-position" role="status" aria-live="polite" aria-atomic="true">
            <span className="o-sr-only">{project.title}. </span>
            <span>Study</span>
            <b>0{selected + 1}</b>
            <span aria-hidden="true">/</span>
            <span className="o-sr-only"> of </span>
            <span>0{PROJECTS.length}</span>
          </div>
          <nav className="lw-study-navigation" aria-label="Explore project demonstrations">
            <button
              type="button"
              className="lw-study-step lw-study-previous"
              aria-label={`Previous study: ${PROJECTS[(selected + PROJECTS.length - 1) % PROJECTS.length].title}`}
              onClick={() => choose((selected + PROJECTS.length - 1) % PROJECTS.length)}
            >
              <Arrow />
              <span className="o-sr-only">Previous</span>
            </button>
            <button
              type="button"
              className="lw-study-step lw-study-next"
              aria-label={`Next study: ${PROJECTS[(selected + 1) % PROJECTS.length].title}`}
              onClick={() => choose((selected + 1) % PROJECTS.length)}
            >
              <span className="o-sr-only">Next</span>
              <Arrow />
            </button>
          </nav>
        </div>
        <div className="o-project-heading">
          <div>
            <h3>{project.title}</h3>
            <p>{project.subtitle}</p>
          </div>
          <div className="lw-heading-art" key={project.id} aria-hidden="true">
            <StudyThumbnail index={selected} hero />
          </div>
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
            {copied ? "Demo link copied ✓" : "Copy demo link"}
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
