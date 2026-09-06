import { useEffect, useRef, useState } from "react";
import { BrandCircuit, type CircuitMode } from "./brand-circuit";

/** The owner's circuit identity, animated only while visible and motion is enabled. */
export function BrandMark({
  motion,
  large = false,
  studio = false,
  magnified = false,
  mode = "all",
  charged = false,
  signal = 0,
  focusLetter,
}: {
  motion: boolean;
  large?: boolean;
  studio?: boolean;
  magnified?: boolean;
  mode?: CircuitMode;
  charged?: boolean;
  signal?: number;
  focusLetter?: number;
}) {
  const frame = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    for (const animation of frame.current?.getAnimations({ subtree: true }) ?? []) {
      if (animation.effect?.getTiming().iterations === Infinity) animation.updatePlaybackRate(charged ? 2.4 : 1);
    }
  }, [charged]);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const preference = () => setReduced(query.matches);
    preference();
    query.addEventListener("change", preference);
    const observer = new IntersectionObserver((entries) => {
      const entry = entries.at(-1);
      if (entry) setVisible(entry.isIntersecting);
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
      data-animated={motion && visible && pageVisible && !reduced ? "true" : "false"}
      data-mode={mode}
      data-charged={charged ? "true" : "false"}
      data-detail={studio ? "studio" : large ? "large" : "compact"}
    >
      <img
        src="/brand/cashio-v37-420.webp"
        srcSet="/brand/cashio-v37-420.webp 420w, /brand/cashio-v37-840.webp 840w, /brand/cashio-v37-1680.webp 1680w, /brand/cashio-v37-2172.webp 2172w"
        sizes={
          studio
            ? magnified
              ? "(max-width: 700px) 270vw, 1768px"
              : "(max-width: 1100px) 92vw, 1040px"
            : large
              ? "(max-width: 600px) 190px, 420px"
              : "(max-width: 360px) 110px, (max-width: 600px) 138px, (max-width: 1100px) 170px, 210px"
        }
        width="840"
        height="280"
        alt="Cashio AI"
        decoding="async"
      />
      <BrandCircuit detailed={large || studio} signal={signal} focusLetter={focusLetter} />
    </span>
  );
}
