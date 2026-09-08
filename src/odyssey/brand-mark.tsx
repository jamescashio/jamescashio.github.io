import { useEffect, useRef, useState } from "react";
import { CelestialCircuit, type CircuitMode, type CelestialLight } from "./celestial-circuit";

/** The owner's circuit identity, animated only while visible and motion is enabled. */
export function BrandMark({
  motion,
  eager = false,
  large = false,
  studio = false,
  magnified = false,
  mode = "all",
  charged = false,
  signal = 0,
  focusLetter,
  light = "balanced",
}: {
  motion: boolean;
  eager?: boolean;
  large?: boolean;
  studio?: boolean;
  magnified?: boolean;
  mode?: CircuitMode;
  charged?: boolean;
  signal?: number;
  focusLetter?: number;
  light?: CelestialLight;
}) {
  const frame = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [circuitReady, setCircuitReady] = useState(eager || studio);
  const [pageVisible, setPageVisible] = useState(true);
  const [reduced, setReduced] = useState(true);
  const animated = motion && visible && pageVisible && !reduced;
  useEffect(() => {
    for (const animation of frame.current?.getAnimations({ subtree: true }) ?? []) {
      if (animation.effect?.getTiming().iterations === Infinity) animation.updatePlaybackRate(charged ? 1.7 : 1);
    }
  }, [charged]);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const preference = () => setReduced(query.matches);
    preference();
    query.addEventListener("change", preference);
    const observer = new IntersectionObserver((entries) => {
      const entry = entries.at(-1);
      if (entry) {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) setCircuitReady(true);
      }
    });
    if (frame.current) observer.observe(frame.current);
    const change = () => setPageVisible(!document.hidden);
    change();
    document.addEventListener("visibilitychange", change);
    return () => {
      observer.disconnect();
      query.removeEventListener("change", preference);
      document.removeEventListener("visibilitychange", change);
    };
  }, []);
  return (
    <span
      ref={frame}
      className="cashio-brand-mark"
      data-animated={animated ? "true" : "false"}
      data-mode={mode}
      data-light={light}
      data-charged={charged ? "true" : "false"}
      data-detail={studio ? "studio" : large ? "large" : "compact"}
    >
      <img
        src="/brand/celestial-420.webp"
        srcSet="/brand/celestial-420.webp 420w, /brand/celestial-840.webp 840w, /brand/celestial-1680.webp 1680w"
        sizes={
          studio
            ? magnified
              ? "(max-width: 700px) 270vw, 1768px"
              : "(max-width: 1100px) 92vw, 1040px"
            : large
              ? "(max-width: 600px) 190px, 420px"
              : "(max-width: 360px) 110px, (max-width: 600px) 138px, (max-width: 1100px) 170px, 210px"
        }
        width="2055"
        height="765"
        alt="Cashio AI"
        decoding="async"
        loading={eager || studio ? "eager" : "lazy"}
      />
      {circuitReady && (
        <CelestialCircuit detailed={large || studio} animated={animated} signal={signal} focusLetter={focusLetter} />
      )}
    </span>
  );
}
