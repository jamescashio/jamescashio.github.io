import { useEffect, useId, useRef, useState } from "react";
import {
  affectedModules,
  escalationExample,
  exposureExample,
  GRAPH_EDGES,
  GRAPH_NODES,
  routeExample,
  type RouteInput,
} from "./data";
import { Arrow } from "./effects";
import {
  EvidencePillars,
  ExposureInstrument,
  ObservationClock,
  RouteInstrument,
  SignalInstrument,
  StageSymbol,
} from "./lab-visuals";

function Range({
  label,
  value,
  onChange,
  unit = "%",
  max = 100,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  unit?: string;
  max?: number;
}) {
  const id = useId();
  return (
    <div className="o-range">
      <label htmlFor={id}>
        {label}
        <output>
          {value}
          {unit}
        </output>
      </label>
      <input id={id} type="range" min="0" max={max} value={value} onChange={(event) => onChange(+event.target.value)} />
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="o-toggle">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="o-switch" aria-hidden="true" />
    </label>
  );
}

function Result({
  title,
  children,
  status = "EXAMPLE OUTPUT",
}: {
  title: string;
  children: React.ReactNode;
  status?: string;
}) {
  return (
    <div className="o-result" role="status">
      <span className="o-micro">{status}</span>
      <h4>{title}</h4>
      <p>{children}</p>
    </div>
  );
}

function HermesLab({ motion }: { motion: boolean }) {
  const [input, setInput] = useState<RouteInput>({ intent: "draft", privateData: false, sources: false });
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const output = routeExample(input);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    if (!motion && running) {
      timers.current.forEach(clearTimeout);
      setStep(5);
      setRunning(false);
    }
  }, [motion, running]);
  function update(next: RouteInput) {
    timers.current.forEach(clearTimeout);
    setInput(next);
    setStep(0);
    setRunning(false);
  }
  function run() {
    timers.current.forEach(clearTimeout);
    setStep(motion ? 1 : 5);
    setRunning(motion);
    if (motion)
      timers.current = [2, 3, 4, 5].map((n) =>
        setTimeout(
          () => {
            setStep(n);
            if (n === 5) setRunning(false);
          },
          (n - 1) * 260,
        ),
      );
  }
  return (
    <>
      <RouteInstrument step={step} code={output.code} />
      <fieldset className="o-segment">
        <legend>Choose the work</legend>
        {(
          [
            ["draft", "Draft"],
            ["research", "Research"],
            ["analyze", "Analyze"],
          ] as const
        ).map(([id, name]) => (
          <button
            key={id}
            type="button"
            aria-pressed={input.intent === id}
            onClick={() => update({ ...input, intent: id })}
          >
            {name}
          </button>
        ))}
      </fieldset>
      <Toggle
        label="Contains private information"
        checked={input.privateData}
        onChange={(privateData) => update({ ...input, privateData })}
      />
      <Toggle
        label="Requires attributable sources"
        checked={input.sources}
        onChange={(sources) => update({ ...input, sources })}
      />
      <button className="o-button o-button-gold o-run" onClick={run} disabled={running}>
        {running ? "Qualifying the route…" : step === 5 ? "Run the route again" : "Route this request"}
        <Arrow />
      </button>
      <ol className="o-steps" aria-label="Routing decisions">
        {output.steps.map((text, i) => (
          <li className={step > i ? "complete" : ""} key={text}>
            <span>{step > i ? "✓" : `0${i + 1}`}</span>
            {text}
          </li>
        ))}
      </ol>
      <Result title={step === 5 ? output.lane : running ? "Decision in progress" : "Your intent. A reasoned route."}>
        {step === 5
          ? output.detail
          : "Choose a task and its boundaries, then run the five-step demonstration. No request leaves this page."}
      </Result>
    </>
  );
}

function CascadeLab() {
  const [severity, setSeverity] = useState(25);
  const [confidence, setConfidence] = useState(90);
  const result = escalationExample(severity, confidence);
  return (
    <>
      <div className="lv-cascade lv-instrument">
        <div className="lv-instrument-caption" aria-hidden="true">
          <span>AUTHORITY CASCADE</span>
          <span>ILLUSTRATIVE POLICY</span>
        </div>
        <div className="o-escalation lv-escalation" aria-label={`Current stage: ${result.title}`}>
          {["Bounded check", "More evidence", "Human decision"].map((name, i) => (
            <div key={name} className={i === result.level ? "selected" : ""}>
              <span>0{i + 1}</span>
              <span className="lv-stage-icon" key={`${name}-${result.level}`}>
                <StageSymbol stage={i} />
              </span>
              <strong>{name}</strong>
            </div>
          ))}
        </div>
        <div className="lv-cascade-readout" aria-hidden="true">
          <span>
            CONSEQUENCE <b>{severity}%</b>
          </span>
          <span>
            EVIDENCE CONFIDENCE <b>{confidence}%</b>
          </span>
        </div>
      </div>
      <Range label="Consequence of being wrong" value={severity} onChange={setSeverity} />
      <Range label="Confidence in the evidence" value={confidence} onChange={setConfidence} />
      <Result title={result.title}>{result.body}</Result>
      <p className="o-lab-note">
        Illustrative thresholds: human review at consequence ≥70% or confidence &lt;40%. These are demonstration rules,
        not production policy.
      </p>
    </>
  );
}

function ExposureLab() {
  const [reachable, setReachable] = useState(true);
  const [auth, setAuth] = useState(false);
  const [critical, setCritical] = useState(true);
  const result = exposureExample(reachable, auth, critical);
  return (
    <>
      <ExposureInstrument reachable={reachable} auth={auth} critical={critical} />
      <Toggle label="Observed from the public internet" checked={reachable} onChange={setReachable} />
      <Toggle label="Authentication boundary observed" checked={auth} onChange={setAuth} />
      <Toggle label="Business-critical asset" checked={critical} onChange={setCritical} />
      <Result title={result.level}>{result.body}</Result>
      <p className="o-lab-note">
        Synthetic scenario. This demonstrates triage logic; it does not scan a target or establish a real finding.
      </p>
    </>
  );
}

const BRIEF_FACTS = [
  {
    id: "fleet",
    label: "Fleet evidence",
    fact: "18 of 19 documented guests were running at the 28 August 2026 probe.",
    consequence: "The estate has a documented baseline; present availability needs a fresh observation.",
    source: "Fleet export · 28 Aug 2026",
  },
  {
    id: "routing",
    label: "Routing inventory",
    fact: "The 21 August 2026 public routing inventory describes 10 model lanes.",
    consequence: "Lane purpose is documented; inventory alone does not prove current provider health.",
    source: "Routing inventory · 21 Aug 2026",
  },
  {
    id: "authority",
    label: "Human authority",
    fact: "The published operating model keeps consequential decisions with an accountable human.",
    consequence: "Any expansion of automation should preserve that decision boundary.",
    source: "Published operating philosophy",
  },
] as const;

function BriefingLab() {
  const [chosen, setChosen] = useState<string[]>(["fleet", "authority"]);
  const [brief, setBrief] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const text = BRIEF_FACTS.filter((fact) => brief.includes(fact.id));
  async function copy() {
    try {
      await navigator.clipboard.writeText(
        text.map((fact) => `${fact.fact}\nSo what: ${fact.consequence}\nSource: ${fact.source}`).join("\n\n") +
          "\n\nNext decision: obtain a fresh read-only snapshot before changing the published baseline.",
      );
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  }
  return (
    <>
      <EvidencePillars chosen={chosen} composed={text.length > 0} />
      <div className="o-brief-header">
        <span className="o-micro">01 / SELECT YOUR EVIDENCE</span>
        <span>{chosen.length} sources</span>
      </div>
      {BRIEF_FACTS.map((fact) => (
        <Toggle
          key={fact.id}
          label={fact.label}
          checked={chosen.includes(fact.id)}
          onChange={(checked) => {
            setChosen((current) => (checked ? [...current, fact.id] : current.filter((id) => id !== fact.id)));
            setBrief([]);
            setCopied(false);
            setCopyError(false);
          }}
        />
      ))}
      <button
        className="o-button o-button-gold o-run"
        disabled={!chosen.length}
        onClick={() => {
          setBrief([...chosen]);
          setCopied(false);
        }}
      >
        Compose the brief
        <Arrow />
      </button>
      <div className="o-brief-output" role="status">
        <span className="o-micro">02 / THE DECISION BRIEF</span>
        {text.length ? (
          <>
            <h4>Evidence before expansion.</h4>
            {text.map((fact) => (
              <div key={fact.id}>
                <p>{fact.fact}</p>
                <p className="o-muted">{fact.consequence}</p>
                <span className="o-micro">{fact.source}</span>
              </div>
            ))}
            <strong>Next decision</strong>
            <p>Obtain a fresh read-only snapshot before changing the published baseline.</p>
          </>
        ) : (
          <p>
            Select the published facts to include. The brief separates the observation, its implication, and the next
            decision.
          </p>
        )}
      </div>
      {text.length > 0 && (
        <button className="o-text-button" onClick={copy}>
          {copied ? "Brief copied ✓" : "Copy your brief"}
          <Arrow diagonal />
        </button>
      )}
      {copyError && (
        <p className="o-lab-note" role="status">
          Clipboard unavailable. Select the brief above and copy it directly.
        </p>
      )}
      <p className="o-lab-note">
        Assembled locally from published statements. This is a structured example, not a generated AI response.
      </p>
    </>
  );
}

function DashboardLab() {
  const [age, setAge] = useState(0);
  const stale = age >= 24;
  return (
    <>
      <div className={`o-freshness ${stale ? "stale" : ""}`}>
        <ObservationClock age={age} stale={stale} />
        <div>
          <span className="o-micro">SYNTHETIC OBSERVATION</span>
          <h4>{stale ? "Refresh required." : "Within its window."}</h4>
          <p>The observation stays the same. Its age changes how confidently it can be used.</p>
        </div>
      </div>
      <div className={`lv-freshness-timeline ${stale ? "lv-timeline-stale" : ""}`} aria-hidden="true">
        <div>
          <i style={{ left: `${(age / 48) * 100}%` }} />
          <b />
        </div>
        <span>OBSERVED</span>
        <span>24H REVIEW WINDOW</span>
        <span>48H</span>
      </div>
      <Range label="Time since the example observation" value={age} max={48} onChange={setAge} unit=" h" />
      <Result title={stale ? "The evidence is stale." : "The evidence has a date."}>
        {stale
          ? "After this example’s 24-hour window, a fresh observation is required. A green historical result cannot stand in for current health."
          : "The example is inside a 24-hour freshness window. Display the collection time, source, and scope alongside the result."}
      </Result>
      <p className="o-lab-note">
        This clock is simulated. Actual published fleet evidence is dated 28 August 2026; the example window does not
        validate that export.
      </p>
    </>
  );
}

function SignalLab() {
  const [deviation, setDeviation] = useState(15);
  const [corroborated, setCorroborated] = useState(false);
  const title = deviation < 30 ? "Continue observation" : corroborated ? "Operator review" : "Corroborate the signal";
  return (
    <>
      <SignalInstrument deviation={deviation} corroborated={corroborated} />
      <Range label="Deviation from the example baseline" value={deviation} onChange={setDeviation} />
      <Toggle label="A second observation supports it" checked={corroborated} onChange={setCorroborated} />
      <Result title={title}>
        {deviation < 30
          ? "The selected deviation stays below this example’s review threshold. Keep observing and preserve context."
          : corroborated
            ? "An exception has supporting context. Give the accountable line owner the evidence and a decision to make."
            : "One signal is not enough to establish the cause. Gather a second observation before recommending a consequential response."}
      </Result>
      <p className="o-lab-note">
        Fictional signal and threshold, created for this demonstration. No plant, customer, or live operational data is
        used.
      </p>
    </>
  );
}

function GraphLab() {
  const [selected, setSelected] = useState("policy");
  const arrowId = useId();
  const affected = affectedModules(selected);
  const current = GRAPH_NODES.find((node) => node.id === selected)!;
  return (
    <>
      <div className="lv-graph-instrument lv-instrument">
        <div className="lv-instrument-caption" aria-hidden="true">
          <span>DEPENDENCY ATLAS</span>
          <span>05 MODULES</span>
        </div>
        <div className="o-code-graph lv-code-graph">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <marker id={arrowId} viewBox="0 0 6 6" refX="5" refY="3" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0 0 6 3 0 6Z" fill="context-stroke" />
              </marker>
            </defs>
            <path className="lv-graph-grid" d="M0 25h100M0 50h100M0 75h100M25 0v100M50 0v100M75 0v100" />
            <ellipse className="lv-graph-orbit" cx="50" cy="48" rx="45" ry="39" />
            {GRAPH_EDGES.map(([a, b]) => {
              const from = GRAPH_NODES.find((node) => node.id === a)!;
              const to = GRAPH_NODES.find((node) => node.id === b)!;
              return (
                <path
                  key={`${selected}-${a}-${b}`}
                  d={`M${from.x} ${from.y}Q${(from.x + to.x) / 2} ${(from.y + to.y) / 2 - 8} ${to.x} ${to.y}`}
                  pathLength="1"
                  markerEnd={`url(#${arrowId})`}
                  className={`lv-graph-link ${[selected, ...affected].includes(a) && [selected, ...affected].includes(b) ? "affected lv-draw" : ""}`}
                />
              );
            })}
          </svg>
          {GRAPH_NODES.map((node) => (
            <button
              key={node.id}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              aria-pressed={node.id === selected}
              className={node.id === selected ? "selected" : affected.includes(node.id) ? "affected" : ""}
              onClick={() => setSelected(node.id)}
            >
              <i aria-hidden="true">
                <svg viewBox="0 0 30 30" fill="none">
                  <path d="m15 4 9 5v12l-9 5-9-5V9Z" />
                  <path d="m10 12 5-3 5 3-5 3Zm5 3v7m-5-6 5 3 5-3" />
                </svg>
              </i>
              {node.label}
            </button>
          ))}
        </div>
      </div>
      <div className="o-graph-legend">
        <span>
          <i />
          Selected module
        </span>
        <span>
          <i />
          Dependent module
        </span>
      </div>
      <Result title={`${current.label}: ${affected.length} dependent ${affected.length === 1 ? "module" : "modules"}`}>
        {affected.length
          ? `A change here can affect ${GRAPH_NODES.filter((node) => affected.includes(node.id))
              .map((node) => node.label)
              .join(", ")}. Follow both direct and indirect dependencies, then review the affected contracts.`
          : "No other module in this example depends on the selected module. Its own dependencies still deserve review."}
      </Result>
      <p className="o-lab-note">
        Select any module. This synthetic graph demonstrates transitive impact; it is not a scan of a real codebase.
      </p>
    </>
  );
}

export function ProjectLab({ index, motion }: { index: number; motion: boolean }) {
  return (
    <div className="o-lab lv-lab" data-lab={index} data-lab-motion={motion ? "on" : "off"}>
      {index === 0 ? (
        <HermesLab motion={motion} />
      ) : index === 1 ? (
        <CascadeLab />
      ) : index === 2 ? (
        <ExposureLab />
      ) : index === 3 ? (
        <BriefingLab />
      ) : index === 4 ? (
        <DashboardLab />
      ) : index === 5 ? (
        <SignalLab />
      ) : (
        <GraphLab />
      )}
    </div>
  );
}
