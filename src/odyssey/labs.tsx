import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { PROJECTS } from "./data";
import { defaultExperiment, parseExperiment, shareExperiment } from "./study-experiment";
import { HermesLab } from "./studies/hermes";
export type ProjectLabHandle = { getShareFragment: () => string };

type StudyModule = typeof import("./secondary-studies");
let readyStudies: StudyModule | undefined;
let pendingStudies: Promise<StudyModule> | undefined;
function prepareStudies() {
  pendingStudies ??= Promise.all([import("./secondary-study-styles.css"), import("./secondary-studies")])
    .then(([, module]) => {
      readyStudies = module;
      return module;
    })
    .catch((error: unknown) => {
      pendingStudies = undefined;
      throw error;
    });
  return pendingStudies;
}

export function ProjectLab({
  index,
  motion,
  shareRef,
  onSettingsChange,
}: {
  index: number;
  motion: boolean;
  shareRef?: Ref<ProjectLabHandle>;
  onSettingsChange?: () => void;
}) {
  const study = PROJECTS[index].id;
  const [studies, setStudies] = useState(readyStudies);
  const [loadError, setLoadError] = useState(false);
  useEffect(() => {
    if (study === "hermes" || readyStudies) {
      setStudies(readyStudies);
      return;
    }
    let current = true;
    setLoadError(false);
    void prepareStudies()
      .then((module) => current && setStudies(module))
      .catch(() => current && setLoadError(true));
    return () => {
      current = false;
    };
  }, [study]);
  const [input, setInput] = useState(() => defaultExperiment(study));
  useImperativeHandle(shareRef, () => ({ getShareFragment: () => shareExperiment(input) }), [input]);
  useEffect(() => onSettingsChange?.(), [input, onSettingsChange]);
  useEffect(() => {
    const restore = () => {
      const saved = parseExperiment(location.hash);
      if (saved?.study === study) setInput(saved);
    };
    restore();
    window.addEventListener("hashchange", restore);
    return () => window.removeEventListener("hashchange", restore);
  }, [study]);
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let visible = false;
    const update = () => setActive(visible && !document.hidden);
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        update();
      },
      { threshold: 0 },
    );
    observer.observe(element);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  return (
    <div
      ref={root}
      className="o-lab lv-lab"
      data-lab={index}
      data-lab-motion={motion ? "on" : "off"}
      data-lab-active={active ? "on" : "off"}
    >
      {input.study === "hermes" ? (
        <HermesLab motion={motion} input={input} onChange={setInput} />
      ) : !studies ? (
        <div className="o-study-loading" role="status">
          <p>
            {loadError
              ? "This instrument couldn’t open. Reload it with your settings, or choose HERMES."
              : "Preparing your instrument…"}
          </p>
          {loadError && (
            <button
              className="o-text-button"
              onClick={() => {
                // A failed native module import can stay cached until a new document.
                // Preserve the visitor's experiment before requesting that document.
                history.replaceState(null, "", shareExperiment(input));
                location.reload();
              }}
            >
              Reload this study ↗
            </button>
          )}
        </div>
      ) : (
        <studies.SecondaryStudy input={input} onChange={setInput} />
      )}
    </div>
  );
}
