import { useEffect, useState, type ReactNode, type RefObject } from "react";
import { TELEMETRY } from "@/lib/content";
import { getSound } from "@/lib/sound";
import { useDeck } from "@/lib/store";

export type SecRef = RefObject<HTMLElement | null>;

export function Kicker({ children }: { children: string }) {
  return <div className="za-kicker mb-3">{children}</div>;
}

export function Title({ children }: { children: ReactNode }) {
  return <h2 className="za-display text-[clamp(2rem,5vw,4.4rem)] text-ink">{children}</h2>;
}

export function CountUp({ to }: { to: number }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setValue(to);
      return;
    }
    let frame = 0;
    const startedAt = performance.now();
    const run = (time: number) => {
      const progress = Math.min(1, (time - startedAt) / 920);
      setValue(Math.round(to * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(run);
    };
    frame = requestAnimationFrame(run);
    return () => cancelAnimationFrame(frame);
  }, [to]);
  return <>{value}</>;
}

export function DeckShell({
  index,
  sRef,
  children,
  className = "",
}: {
  index: number;
  sRef: SecRef;
  children: ReactNode;
  className?: string;
}) {
  const shown = useDeck((state) => state.shown.includes(index));
  return (
    <section
      ref={sRef}
      data-deck={index}
      className={`za-mobile-rail-clearance relative min-h-[92dvh] px-5 py-24 md:px-10 lg:px-14 ${className}`}
    >
      <div className={shown ? "za-rise" : "translate-y-6 opacity-0"}>{children}</div>
    </section>
  );
}

export function Ticker() {
  const items = [...TELEMETRY, ...TELEMETRY];
  return (
    <div className="za-ticker mt-10 max-w-xl border-y border-line py-2">
      <div className="za-ticker-track za-mono text-[10px] tracking-[0.2em] text-cyan">
        {items.map((item, index) => (
          <span key={`${item}-${index}`} className="flex items-center gap-3">
            <span className="h-1 w-1 rounded-full bg-green shadow-[0_0_8px_var(--color-green)]" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Plate({
  src,
  alt,
  className = "",
  fade = "bottom",
  chip,
}: {
  src: string;
  alt: string;
  className?: string;
  fade?: "bottom" | "right" | "left";
  chip?: ReactNode;
}) {
  return (
    <figure data-hud-clear className={`za-plate ${className}`} onMouseEnter={() => getSound().tick()}>
      <img src={src} alt={alt} className="za-plate-img" loading="lazy" decoding="async" />
      <span className={`za-plate-fade ${fade}`} aria-hidden />
      <span className="za-plate-scan" aria-hidden />
      <span className="za-plate-bezel" aria-hidden />
      <span className="za-plate-tick tl" aria-hidden />
      <span className="za-plate-tick br" aria-hidden />
      {chip ? <figcaption className="za-chip za-plate-chip">{chip}</figcaption> : null}
    </figure>
  );
}
