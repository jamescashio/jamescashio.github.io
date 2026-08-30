import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { DECKS, TELEMETRY } from "@/lib/content";
import { getSound } from "@/lib/sound";
import { useDeck } from "@/lib/store";

export type SecRef = RefObject<HTMLElement | null>;

export function Kicker({ children }: { children: string }) {
  return <div className="za-kicker mb-3">{children}</div>;
}

export function Title({ children }: { children: ReactNode }) {
  return (
    <h2 tabIndex={-1} className="za-display text-[clamp(2rem,5vw,4.4rem)] text-ink">
      {children}
    </h2>
  );
}

export function CountUp({ to, armed = true }: { to: number; armed?: boolean }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!armed) {
      setValue(0);
      return;
    }
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let startedAt = 0;
    let settled = false;
    const cancel = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };
    const run = (time: number) => {
      frame = 0;
      const progress = Math.min(1, (time - startedAt) / 920);
      setValue(Math.round(to * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(run);
      else settled = true;
    };
    const start = () => {
      if (motion.matches || settled || frame) return;
      setValue(0);
      startedAt = performance.now();
      frame = requestAnimationFrame(run);
    };
    const settle = () => {
      cancel();
      settled = true;
      setValue(to);
    };
    const onMotion = (event: MediaQueryListEvent) => {
      if (event.matches) settle();
      else start();
    };
    motion.addEventListener("change", onMotion);
    if (motion.matches) settle();
    else start();
    return () => {
      cancel();
      motion.removeEventListener("change", onMotion);
    };
  }, [to, armed]);
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
      tabIndex={-1}
      aria-label={`${DECKS[index].name} deck`}
      className={`za-mobile-rail-clearance relative min-h-[92dvh] px-5 py-24 md:px-10 lg:px-14 ${className}`}
    >
      <div className={shown ? "za-rise" : "translate-y-6 opacity-0"}>{children}</div>
    </section>
  );
}

export function Ticker() {
  const items = [...TELEMETRY, ...TELEMETRY];
  return (
    <div data-hud-clear className="za-ticker mt-10 max-w-xl border-y border-line py-2">
      <div className="za-critical-telemetry za-ticker-track za-mono tracking-[0.2em] text-cyan">
        {items.map((item, index) => (
          <span key={`${item}-${index}`} className="flex items-center gap-3">
            <span className="za-lock-pip" />
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
  sources,
  width,
  height,
  deferUntilNear = false,
  placeholderSrc,
}: {
  src: string;
  alt: string;
  className?: string;
  fade?: "bottom" | "right" | "left";
  chip?: ReactNode;
  sources?: readonly { srcSet: string; type: string; media?: string; sizes?: string }[];
  width?: number;
  height?: number;
  deferUntilNear?: boolean;
  placeholderSrc?: string;
}) {
  const figureRef = useRef<HTMLElement>(null);
  const [isNear, setIsNear] = useState(!deferUntilNear);
  useEffect(() => {
    if (!deferUntilNear || isNear) return;
    const figure = figureRef.current;
    if (!figure || typeof window.IntersectionObserver !== "function") {
      setIsNear(true);
      return;
    }
    const observer = new window.IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        setIsNear(true);
      },
      { rootMargin: "640px 0px" },
    );
    observer.observe(figure);
    return () => observer.disconnect();
  }, [deferUntilNear, isNear]);

  const deferred = deferUntilNear && !isNear;
  const image = (
    <img
      src={deferred ? (placeholderSrc ?? src) : src}
      data-src={deferred ? src : undefined}
      alt={alt}
      className="za-plate-img"
      loading="lazy"
      decoding="async"
      fetchPriority={deferred ? "low" : undefined}
      width={width}
      height={height}
    />
  );
  return (
    <figure ref={figureRef} data-hud-clear className={`za-plate ${className}`} onMouseEnter={() => getSound().tick()}>
      {sources ? (
        <picture
          className="za-plate-picture"
          style={
            placeholderSrc
              ? {
                  backgroundImage: `url("${placeholderSrc}")`,
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "cover",
                }
              : undefined
          }
        >
          {sources.map((source) => (
            <source
              key={`${source.media ?? "default"}-${source.type}`}
              type={source.type}
              media={source.media}
              sizes={source.sizes}
              srcSet={deferred ? undefined : source.srcSet}
              data-srcset={deferred ? source.srcSet : undefined}
            />
          ))}
          {image}
        </picture>
      ) : (
        image
      )}
      <span className={`za-plate-fade ${fade}`} aria-hidden />
      <span className="za-plate-scan" aria-hidden />
      <span className="za-plate-bezel" aria-hidden />
      <span className="za-plate-tick tl" aria-hidden />
      <span className="za-plate-tick br" aria-hidden />
      {chip ? <figcaption className="za-chip za-plate-chip">{chip}</figcaption> : null}
    </figure>
  );
}
