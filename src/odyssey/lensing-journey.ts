import { useEffect, useRef, useState } from "react";
import type { LensingLight, LensingView } from "./lensing-renderer";

export const JOURNEY = [
  {
    light: "dawn",
    view: "orbit",
    title: "A world worth discovering.",
    note: "Arrival",
    description: "First light catches the architecture of an imagined world.",
  },
  {
    light: "ion",
    view: "surface",
    title: "Follow the electric horizon.",
    note: "The horizon",
    description: "Ocean, atmosphere and orbital traffic. Detail rewards a closer look.",
  },
  {
    light: "eclipse",
    view: "gate",
    title: "There is always a way beyond.",
    note: "Beyond",
    description: "The planet falls into shadow. The gateway comes into its own.",
  },
] satisfies { light: LensingLight; view: LensingView; title: string; note: string; description: string }[];

export const CHAPTER_MS = 8_000;

/** One finite journey. Pause and visibility preserve the remaining chapter time. */
export function useLensingJourney(animate: boolean) {
  const [step, setStep] = useState<{ index: number; id: number } | null>(null);
  const [complete, setComplete] = useState(false);
  const [visible, setVisible] = useState(() => !document.hidden);
  const clock = useRef({ id: 0, remaining: CHAPTER_MS });
  const sequence = useRef(0);
  const running = animate && visible;

  useEffect(() => {
    const changed = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", changed);
    return () => document.removeEventListener("visibilitychange", changed);
  }, []);

  useEffect(() => {
    if (!step || complete || !running) return;
    const current = clock.current;
    const started = performance.now();
    let expired = false;
    const timer = setTimeout(() => {
      expired = true;
      if (step.index === JOURNEY.length - 1) setComplete(true);
      else {
        const id = ++sequence.current;
        clock.current = { id, remaining: CHAPTER_MS };
        setStep({ index: step.index + 1, id });
      }
    }, current.remaining);
    return () => {
      clearTimeout(timer);
      if (!expired) current.remaining = Math.max(0, current.remaining - (performance.now() - started));
    };
  }, [step, complete, running]);

  function jump(index: number) {
    if (index < 0 || index >= JOURNEY.length) return;
    const id = ++sequence.current;
    clock.current = { id, remaining: CHAPTER_MS };
    setComplete(false);
    setStep({ index, id });
  }
  function stop() {
    setStep(null);
    setComplete(false);
  }
  return { step, complete, running: running && !complete, jump, stop };
}
