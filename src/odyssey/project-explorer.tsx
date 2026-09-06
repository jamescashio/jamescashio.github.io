import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ARTICLES } from "../lib/content";
import { BUILD_STORIES } from "../lib/build-stories";
import { PROJECTS } from "./data";
import { Arrow } from "./effects";
import { ProjectLab } from "./labs";

const STUDY_TRACES = [
  "M8 36h22l9-13 13 26 13-26 9 13h22M52 8v8m0 40v8",
  "M9 53h20V39h23V25h23V12h20M19 49v8m23-22v8m23-22v8m20-22v8",
  "M52 9 77 19v18c0 13-14 23-25 28-11-5-25-15-25-28V19ZM40 35l8 8 17-19",
  "M12 16h18v25H12Zm62 0h18v25H74ZM43 31h18v25H43ZM21 45v12h17m45-12v12H66",
  "M52 13a23 23 0 1 1-23 23 23 23 0 0 1 23-23ZM52 20v16l12 8M10 36h9m66 0h9",
  "M8 47c10-9 13 7 24-1s16 5 24-8 14-22 23-14 12-4 17-8M8 55h88M8 32h88",
  "M15 24 49 13 87 26 73 55 29 57 15 24ZM49 13 73 55M15 24 73 55M29 57 49 13",
];

function StudyThumbnail({ index }: { index: number }) {
  return (
    <i className="ln-project-thumb" aria-hidden="true">
      <svg viewBox="0 0 104 72" fill="none" focusable="false">
        <path className="ln-thumb-grid" d="M0 18h104M0 36h104M0 54h104M26 0v72M52 0v72M78 0v72" />
        <path className="ln-thumb-frame" d="M4 17V4h17m62 0h17v13M4 55v13h17m62 0h17V55" />
        <path className="ln-thumb-trace" d={STUDY_TRACES[index]} />
        <path className="ln-thumb-response" d={STUDY_TRACES[index]} pathLength="1" />
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
