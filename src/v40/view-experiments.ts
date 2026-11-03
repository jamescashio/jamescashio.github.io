import type { PageHost, PageState } from "./page-model.ts";

export function experimentValues(this: PageHost, s: Readonly<PageState>) {
  const lawA = "Quality picks the model.".split(" ").map((t) => ({ t }));
  const lawB = "Cost only breaks a tie.".split(" ").map((t) => ({ t }));
  const pill = (on: boolean, gold: boolean) =>
    `padding:9px 16px;border-radius:999px;cursor:pointer;font-family:var(--font-mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;transition:all .3s;border:1px solid ${on ? (gold ? "var(--accent)" : "var(--cyan)") : "var(--glass-border)"};background:${on ? (gold ? "rgba(255,149,0,.14)" : "rgba(0,249,255,.1)") : "var(--glass)"};color:${on ? (gold ? "var(--accent)" : "var(--cyan)") : "var(--text)"};box-shadow:${on ? (gold ? "0 0 18px var(--accent-glow)" : "0 0 18px var(--cyan-glow)") : "none"}`;
  const pvChoices = [
    {
      label: "Research tool",
      style: pill(s.pv === "keep", false),
      pick: () => this.setState({ pv: "keep", pvShown: true }),
    },
    {
      label: "A person",
      style: pill(s.pv === "human", true),
      pick: () => this.setState({ pv: "human", pvShown: true }),
    },
  ];
  const pvText =
    s.pv === "keep"
      ? "Not this time. The research tool still fits the task, but private input holds the external route. A person reviews it first."
      : s.pv === "human"
        ? "Yes. Private information always brings in a person. Same task, same sources, a different boundary."
        : "A person. Private input holds the external route for human review, whatever the task asks for.";
  const intents = [
    ["draft", "Draft"],
    ["research", "Research"],
    ["analyze", "Analyze"],
  ].map(([k, label]) => ({
    label,
    style: pill(s.intent === k, false),
    pick: () => this.setState({ intent: k, routed: null }),
  }));
  const tog = (on: boolean, gold: boolean) =>
    `display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px 10px 14px;border-radius:12px;cursor:pointer;font-family:var(--font-body);font-size:14px;color:var(--text);text-align:left;border:1px solid ${on ? (gold ? "var(--accent)" : "var(--cyan)") : "var(--glass-border)"};background:${on ? (gold ? "rgba(255,149,0,.08)" : "rgba(0,249,255,.06)") : "var(--glass)"};transition:all .3s`;
  const knob = (on: boolean, gold: boolean) =>
    `width:40px;height:22px;border-radius:11px;flex:0 0 auto;position:relative;background:${on ? (gold ? "var(--accent)" : "var(--cyan)") : "rgba(255,255,255,.12)"};transition:background .3s;box-shadow:${on ? (gold ? "0 0 14px var(--accent-glow)" : "0 0 14px var(--cyan-glow)") : "none"}`;
  const dot = (on: boolean) =>
    `position:absolute;top:3px;left:${on ? 21 : 3}px;width:16px;height:16px;border-radius:50%;background:${on ? "var(--void)" : "var(--text)"};transition:left .3s cubic-bezier(.23,1,.32,1)`;
  const r = s.routed;
  const L = r || {
    name: "Choose a task",
    code: "READY",
    label: "ROUTE NOT RUN",
    color: "var(--text-dim)",
    detail: "Choose a task, then follow its five step route.",
  };
  const stepDefs = r
    ? [
        [
          "Read the intent",
          `${s.intent[0].toUpperCase() + s.intent.slice(1)} · sources ${s.sources ? "required" : "optional"}`,
        ],
        [
          "Check the privacy boundary",
          s.priv ? "Private input · external route held" : "Public input · route stays open",
        ],
        ["Check the evidence requirement", s.sources ? "Attributable sources required" : "No source requirement"],
        ["Select the lane", L.label],
        ["Review", s.priv ? "A person decides" : "Result returns to the operator console"],
      ]
    : [];
  const routeSteps = stepDefs.map(([a, b], i) => ({
    n: "0" + (i + 1),
    text: `${a} · ${b}`,
    color: i === 3 ? L.color : "var(--text-dim)",
    style: `display:flex;gap:10px;align-items:baseline;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.05);animation:v40-rise .5s cubic-bezier(.23,1,.32,1) ${i * 0.12}s both`,
  }));
  const expDefs = [
    [
      "hermes",
      "Choose a route",
      "HERMES, my scheduler",
      "What wins when intent, evidence requirements, and privacy disagree?",
    ],
    ["cascade", "Know when to pause", "CASCADE", "When should automation stop and ask a person?"],
    ["exposure", "Triage an exposure", "EXPOSURE", "Which finding deserves attention first, and who is told?"],
    ["briefing", "Compose a brief", "BRIEFING", "Choose what matters. Keep the sources and the unknowns attached."],
    ["dashboards", "Age the evidence", "DASHBOARDS", "How old can an observation be before it stops counting?"],
    ["signal", "Corroborate a signal", "SIGNAL", "One signal is a rumor. When does it become evidence?"],
    ["graphify", "Trace a dependency", "GRAPHIFY", "What else moves when one piece of the system changes?"],
  ];
  const experiments = expDefs.map(([_k, name, code], i) => ({
    id: "experiment-" + i,
    selected: String(s.exp === i),
    tabindex: s.exp === i ? 0 : -1,
    num: "0" + (i + 1),
    name,
    code,
    numColor: s.exp === i ? "var(--accent)" : "var(--text-dim)",
    pick: () => this.setState({ exp: i }),
    style: `display:flex;align-items:center;gap:12px;width:100%;padding:12px 14px;border-radius:12px;cursor:pointer;text-align:left;color:var(--text);transition:all .3s;border:1px solid ${s.exp === i ? "var(--accent)" : "var(--glass-border)"};background:${s.exp === i ? "rgba(255,149,0,.08)" : "var(--surface-2)"};box-shadow:${s.exp === i ? "0 0 22px var(--accent-glow)" : "none"}`,
  }));
  const E = expDefs[s.exp];
  return { lawA, lawB, pill, pvChoices, pvText, intents, tog, knob, dot, r, L, routeSteps, experiments, E };
}
