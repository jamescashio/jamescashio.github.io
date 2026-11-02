import { snapshot, observedDate, observedMonth, fleetSummary } from "./evidence.ts";


export function systemValues(s, pill) {
  const nodeInfo = {
    hermes: {
      title: "HERMES",
      role: "Job scheduler",
      value: "Withheld",
      unit: "scheduler counts await a fresh probe",
      summary: "The scheduler turns a task into a job.",
      body: snapshot.withheldReasons["scheduler.enabled"],
      evidence: observedMonth + " · Scheduler and routing not measured",
      color: "accent",
    },
    operator: {
      title: "THE OPERATOR",
      role: "Authority",
      value: "1",
      unit: "human in command",
      summary: "A person keeps the final say.",
      body: "Private information always brings in a person. The operator approves anything that would leave the lab.",
      evidence: "Design rule · published in the dated export",
      color: "amber",
    },
    dsh: {
      title: "DSH",
      role: "Operator console",
      value: "DSH",
      unit: "where I watch and approve",
      summary: "My operator console, where I run everything from.",
      body: "Requests are watched and approved here. Held routes wait at this console for a person.",
      evidence: "Conceptual operator console · October 2026",
      color: "cyan",
    },
    zeus: {
      title: "ZEUS",
      role: "My server",
      value: String(snapshot.cluster.hostsOnline),
      unit: "hosts reporting running guests",
      summary: "One of the two servers that do the computing.",
      body: fleetSummary + ". Observed " + observedDate + ". Per host guest counts are withheld.",
      evidence: "Fleet observation · " + observedDate,
      color: "cyan",
    },
    apollo: {
      title: "APOLLO",
      role: "My server",
      value: String(snapshot.containers.running),
      unit: "containers across both hosts",
      summary: "One of the two servers that do the computing.",
      body: fleetSummary + ". Observed " + observedDate + ". Per host guest counts are withheld.",
      evidence: "Fleet observation · " + observedDate,
      color: "purple",
    },
  };
  const N = nodeInfo[s.node];
  const ts = s.traceStep,
    tp = s.tracePrivate;
  const litNow = (k) =>
    s.node === k ||
    (ts === 0 && k === "operator") ||
    (ts === 1 && k === "hermes") ||
    (ts === 2 && (tp ? k === "dsh" : k === "zeus" || k === "apollo")) ||
    (ts === 3 && (k === "operator" || k === "dsh"));
  const pos = { operator: [50, 13.33], dsh: [16, 36], hermes: [50, 50], zeus: [25, 84], apollo: [75, 84] };
  const nodes = [
    ["operator", "The operator", "Authority", "◆", "var(--amber)"],
    ["dsh", "DSH", "Console", "▣", "var(--cyan)"],
    ["hermes", "HERMES", "Orchestration", "✦", "var(--accent)"],
    ["zeus", "Zeus", "My server", "▤", "var(--cyan)"],
    ["apollo", "Apollo", "My server", "▤", "var(--purple)"],
  ].map(([k, name, detail, glyph, color]) => {
    const on = litNow(k),
      big = k === "hermes",
      sz = big ? 64 : 48;
    const ring = `position:absolute;inset:-1px;border-radius:inherit;border:1px solid ${color};pointer-events:none;`;
    return {
      name,
      detail,
      glyph,
      pressed: String(s.node === k),
      pick: () => this.setState({ node: k }),
      style: `position:absolute;left:${pos[k][0]}%;top:${pos[k][1]}%;transform:translate(-50%,-${sz / 2 + 6}px);display:flex;flex-direction:column;align-items:center;gap:4px;background:none;border:none;cursor:pointer;color:var(--text);padding:6px;z-index:2`,
      core: `position:relative;width:${sz}px;height:${sz}px;border-radius:${big ? 18 : 14}px;display:grid;place-items:center;font-size:${big ? 26 : 20}px;color:${color};background:radial-gradient(circle at 50% 25%, rgba(255,255,255,.09), transparent 70%),var(--surface);border:1px solid ${on ? color : "var(--glass-border)"};box-shadow:${on ? `0 0 32px ${color}, inset 0 0 16px rgba(255,255,255,.08)` : "var(--shadow-card)"};transform:scale(${on ? 1.08 : 1});transition:all .5s cubic-bezier(.23,1,.32,1)`,
      pulse: on ? ring + "animation:v40-ping 1.8s cubic-bezier(.23,1,.32,1) infinite" : "display:none",
      pulse2: on ? ring + "animation:v40-ping 1.8s cubic-bezier(.23,1,.32,1) .9s infinite" : "display:none",
    };
  });
  const edgeLit = tp ? [["opHe"], ["opHe"], ["dshHe"], ["opDsh"]] : [["opHe"], ["opHe"], ["heZe", "heAp"], ["dshHe"]];
  const edgeColor = {
    opHe: "var(--amber)",
    opDsh: "var(--amber)",
    dshHe: "var(--accent)",
    heZe: "var(--cyan)",
    heAp: "var(--purple)",
  };
  const edgeState = (k) => {
    if (ts < 0) return "idle";
    if (edgeLit[ts].includes(k)) return "on";
    for (let i = 0; i < ts; i++) if (edgeLit[i].includes(k)) return "past";
    return "off";
  };
  const edgeVals = (k) => {
    const st = edgeState(k),
      c = edgeColor[k];
    return {
      flow: `stroke:${c};stroke-width:${st === "on" ? 2.4 : 1.5};stroke-dasharray:3 9;animation:v40-dash ${st === "on" ? 0.6 : 1.8}s linear infinite;opacity:${st === "on" ? 1 : st === "past" ? 0.45 : st === "idle" ? 0.3 : 0.06};transition:opacity .5s`,
      glow: `stroke:${c};stroke-width:9;opacity:${st === "on" ? 0.2 : 0};transition:opacity .5s`,
    };
  };
  const tagColor = {
    READY: "var(--text-dim)",
    INTENT: "var(--amber)",
    QUALIFY: "var(--accent)",
    COMPUTE: "var(--cyan)",
    HOLD: "var(--accent)",
    REVIEW: "var(--green)",
    DONE: "var(--green)",
  };
  const traceLog = s.traceLog.map(([stamp, tag, text]) => ({
    ts: stamp,
    tag,
    text,
    color: tagColor[tag] || "var(--cyan)",
    style:
      "white-space:pre-wrap;word-break:break-word;color:var(--text);animation:v40-rise .4s cubic-bezier(.23,1,.32,1) both",
  }));
  const wire = (active, color) => (active ? color : "rgba(255,255,255,.14)");
  const traceOutcomeL = this.lane("draft", tp, false);
  const stageLabels = ["Intent", "Qualify", tp ? "Hold" : "Compute", "Review"];
  const stages = stageLabels.map((label, i) => ({
    n: "0" + (i + 1),
    label,
    style: `display:flex;flex-direction:column;gap:2px;padding:8px 10px;border-radius:8px;border:1px solid ${ts === i ? "var(--cyan)" : "var(--glass-border)"};background:${ts >= i && ts >= 0 ? "rgba(0,249,255,.08)" : "var(--glass)"};color:${ts >= i && ts >= 0 ? "var(--cyan)" : "var(--text-dim)"};transition:all .4s`,
  }));
  const captions = [
    "Intent · the operator asks for a draft.",
    "Qualify · HERMES reads the request and checks the boundary.",
    tp
      ? "Hold · private input. The route stops at the console for a person."
      : "Compute · the job runs on Zeus or Apollo.",
    "Review · the result returns to the operator console.",
  ];
  const traceChoices = [
    ["Public input", false],
    ["Private input", true],
  ].map(([label, v]) => ({
    label,
    pressed: String(tp === v),
    style: pill(tp === v, v),
    pick: () => {
      clearInterval(this.traceTimer);
      Object.values(this.pkT || {}).forEach((t) => clearTimeout(t));
      document.querySelectorAll("[id^=map-pk-]").forEach((el) => el.setAttribute("opacity", "0"));
      this.setState({ tracePrivate: v, traceStep: -1, tracing: false });
    },
  }));
  return { N, ts, tp, nodes, edgeVals, traceLog, wire, traceOutcomeL, stages, captions, traceChoices };
}
