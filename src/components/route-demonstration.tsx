import { useEffect, useRef, useState } from "react";
import { ROUTE_EXAMPLES } from "@/lib/build-stories";
import { ROUTING_STAGES } from "@/lib/content";
import { useDeck } from "@/lib/store";

export function RouteDemonstration() {
  const [selection, setSelection] = useState(0);
  const [step, setStep] = useState(-1);
  const timer = useRef<number | null>(null);
  const active = useDeck((state) => state.deck === 5);
  const example = ROUTE_EXAMPLES[selection];
  const complete = step >= ROUTING_STAGES.length;
  const running = step >= 0 && !complete;

  useEffect(() => {
    if (!active || !running) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finish = () => setStep(ROUTING_STAGES.length);
    if (motion.matches) {
      finish();
      return;
    }
    timer.current = window.setTimeout(() => setStep((current) => current + 1), 520);
    const onMotion = (event: MediaQueryListEvent) => {
      if (event.matches) finish();
    };
    motion.addEventListener("change", onMotion);
    return () => {
      if (timer.current != null) window.clearTimeout(timer.current);
      motion.removeEventListener("change", onMotion);
    };
  }, [active, running, step]);

  return (
    <section className="za-route-demo" aria-labelledby="route-demo-title">
      <div className="za-demo-heading">
        <div>
          <span className="za-kicker">TRY THE ROUTING LAW</span>
          <h4 id="route-demo-title" className="za-display">
            ONE REQUEST. FIVE DECISIONS.
          </h4>
        </div>
        <span className="za-demo-label">INTERACTIVE EXAMPLE</span>
      </div>
      <div className="za-demo-options" role="group" aria-label="Choose a routing example">
        {ROUTE_EXAMPLES.map((item, index) => (
          <button
            key={item.name}
            type="button"
            aria-pressed={selection === index}
            onClick={() => {
              setSelection(index);
              setStep(-1);
            }}
          >
            {item.name}
          </button>
        ))}
      </div>
      <p className="za-demo-request">
        <span className="za-mono">REQUEST</span>
        {example.request}
      </p>
      <ol className="za-demo-route" aria-label="Routing decisions">
        {ROUTING_STAGES.map(([number, label], index) => (
          <li
            key={number}
            className={step >= index ? "reached" : ""}
            aria-current={step === index ? "step" : undefined}
          >
            <span>{number}</span>
            <b>{label}</b>
            <i aria-hidden>{step > index ? "✓" : step === index ? "·" : "—"}</i>
          </li>
        ))}
      </ol>
      <div className="za-demo-result" role="status" aria-live="polite" aria-atomic="true">
        {complete ? (
          <>
            <span className="za-mono text-accent">{example.lane}</span>
            <strong>{example.reason}</strong>
            <p>{example.response}</p>
          </>
        ) : running ? (
          <>
            <span className="za-mono text-cyan">DECISION {step + 1} / 5</span>
            <strong>{example.checks[step]}</strong>
          </>
        ) : (
          <>
            <span className="za-mono text-cyan">YOU HAVE THE CONTROLS</span>
            <strong>Choose a request. See why its route changes.</strong>
          </>
        )}
      </div>
      <div className="za-demo-footer">
        <button type="button" className="za-btn-ghost" onClick={() => setStep(0)} disabled={running}>
          {running ? "ROUTING…" : complete ? "REPLAY EXAMPLE" : "RUN DEMONSTRATION"}
          <span aria-hidden>↗</span>
        </button>
        <p>Illustrative workflow. Runs in your browser. No request is sent to a model.</p>
      </div>
    </section>
  );
}
