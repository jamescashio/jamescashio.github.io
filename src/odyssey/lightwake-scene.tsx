import { useEffect, useId, useRef, useState } from "react";

const LIGHTS = [
  { id: "dawn", label: "Dawn", detail: "Champagne light across the edge of a world." },
  { id: "eclipse", label: "Eclipse", detail: "Quiet shadows. A bright signal in the dark." },
  { id: "ion", label: "Ion", detail: "Electric blue. The atmosphere answers." },
] as const;

export function LightwakeControls() {
  const [light, setLight] = useState<(typeof LIGHTS)[number]["id"]>("dawn");
  const [intensity, setIntensity] = useState(60);
  const panel = useRef<HTMLDetailsElement>(null);
  const id = useId();
  useEffect(() => {
    const element = panel.current;
    const hero = element?.closest<HTMLElement>(".o-hero");
    if (!element || !hero) return;
    const measure = () => hero.style.setProperty("--lw-panel-height", `${element.getBoundingClientRect().height}px`);
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();
    return () => {
      observer.disconnect();
      hero.style.removeProperty("--lw-panel-height");
    };
  }, []);
  useEffect(() => {
    const hero = panel.current?.closest<HTMLElement>(".o-hero");
    if (!hero) return;
    hero.dataset.lightwakeLight = light;
    hero.style.setProperty("--lw-intensity", String(intensity / 100));
  }, [light, intensity]);
  return (
    <details className="lw-light-controls" ref={panel}>
      <summary className="lw-light-heading">
        <span>Atmosphere</span>
        <span>
          {LIGHTS.find((item) => item.id === light)?.label} <b aria-hidden="true">+</b>
        </span>
      </summary>
      <div className="lw-light-options">
        <div className="lw-light-choices" role="group" aria-label="Orbital scene lighting">
          {LIGHTS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={light === item.id}
              aria-label={`${item.label} scene lighting`}
              onClick={() => setLight(item.id)}
            >
              <span className={`lw-light-symbol lw-light-symbol-${item.id}`} aria-hidden="true" />
              {item.label}
            </button>
          ))}
        </div>
        <label className="lw-light-intensity" htmlFor={id}>
          <span>Light intensity</span>
          <input
            id={id}
            type="range"
            min="0"
            max="100"
            value={intensity}
            onChange={(event) => setIntensity(Number(event.currentTarget.value))}
          />
          <output>{intensity}%</output>
        </label>
        <p className="lw-light-description" role="status">
          {LIGHTS.find((item) => item.id === light)?.detail}
        </p>
      </div>
    </details>
  );
}

export function LightwakeAtmosphere() {
  return (
    <div className="lw-atmosphere" aria-hidden="true">
      <div className="lw-horizon-glow" />
      <svg
        className="lw-aurora"
        viewBox="0 0 1672 941"
        fill="none"
        preserveAspectRatio="xMidYMax slice"
        focusable="false"
      >
        <path className="lw-aurora-haze" d="M-80 846C210 683 328 878 612 766S1130 630 1770 704" />
        <path className="lw-aurora-ribbon" pathLength="1" d="M-80 846C210 683 328 878 612 766S1130 630 1770 704" />
        <path className="lw-aurora-filament" pathLength="1" d="M-80 868C196 706 356 895 628 785S1154 660 1770 723" />
      </svg>
      <div className="lw-core-halo" />
    </div>
  );
}

export function ExperienceGlyph({ kind }: { kind: "film" | "signature" | "flight" | "orbit" }) {
  return (
    <svg className="lw-experience-glyph" viewBox="0 0 56 32" fill="none" aria-hidden="true" focusable="false">
      <path className="lw-glyph-rule" d="M2 25h52M10 3v26m36-26v26" />
      {kind === "film" ? (
        <>
          <ellipse cx="28" cy="16" rx="22" ry="11" />
          <path className="lw-glyph-gold" d="m25 10 9 6-9 6Z" />
        </>
      ) : kind === "signature" ? (
        <>
          <ellipse cx="28" cy="16" rx="22" ry="9" transform="rotate(-14 28 16)" />
          <path className="lw-glyph-gold" d="m28 4 9 23-9-6-9 6Z" />
          <circle cx="45" cy="10" r="2" />
        </>
      ) : kind === "orbit" ? (
        <>
          <circle cx="28" cy="16" r="9" />
          <ellipse className="lw-glyph-gold" cx="28" cy="16" rx="22" ry="7" transform="rotate(-24 28 16)" />
          <circle cx="47" cy="8" r="2" fill="currentColor" />
        </>
      ) : (
        <>
          <path d="M4 20h12m-8-5h10m-4-5h10" />
          <path className="lw-glyph-gold" d="m20 18 20-13-5 13 14 9-21-5-9 4Z" />
        </>
      )}
    </svg>
  );
}
