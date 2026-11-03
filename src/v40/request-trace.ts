import type { PageHost } from "./page-model.ts";

export function startTrace(this: PageHost) {
  if (this.state.tracing) return;
  clearInterval(this.traceTimer);
  const tp = this.state.tracePrivate,
    caps = this.traceCaps(tp),
    t0 = Date.now();
  const tags = ["INTENT", "QUALIFY", tp ? "HOLD" : "COMPUTE", "REVIEW"];
  const stamp = () => `[${((Date.now() - t0) / 1000).toFixed(2).padStart(5, " ")}]`;
  this.setState({ tracing: true, traceStep: 0, traceLog: [[stamp(), tags[0], caps[0]]] });
  this.runPacket(0, tp);
  let i = 0;
  this.traceTimer = setInterval(() => {
    i += 1;
    if (i > 3) {
      clearInterval(this.traceTimer);
      this.setState((s) => ({
        tracing: false,
        traceLog: [
          ...s.traceLog,
          [
            stamp(),
            "DONE",
            tp
              ? "A person holds the decision. Nothing left the lab."
              : "Route complete · Workhorse · no request was sent.",
          ],
        ],
      }));
      return;
    }
    this.setState((s) => ({ traceStep: i, traceLog: [...s.traceLog, [stamp(), tags[i], caps[i]]] }));
    this.runPacket(i, tp);
  }, 1800);
}

export function traceCaps(tp: boolean) {
  return [
    "Intent · the operator asks for a draft.",
    "Qualify · HERMES reads the request and checks the boundary.",
    tp
      ? "Hold · private input. The route stops at the console for a person."
      : "Compute · the job runs on Zeus or Apollo.",
    "Review · the result returns to the operator console.",
  ];
}

export function runPacket(this: PageHost, step: number, tp: boolean) {
  const seq: [string, number][][] = tp
    ? [[["opHe", 1]], [], [["dshHe", -1]], [["opDsh", -1]]]
    : [
        [["opHe", 1]],
        [],
        [
          ["heZe", 1],
          ["heAp", 1],
        ],
        [["dshHe", -1]],
      ];
  seq[step].forEach(([edge, dir], j) => this.animPk(j ? "map-pk-b" : "map-pk-a", edge, dir));
}

export function animPk(this: PageHost, id: string, edge: string, dir: number, dur = 1400) {
  if (this.reduce || document.hidden) return;
  const el = document.getElementById(id);
  if (!el) return;
  const packetTimers = (this.pkT = this.pkT || {});
  clearTimeout(packetTimers[id]);
  const [p0, c, p1] = this.edgeDefs[edge],
    A = dir > 0 ? p0 : p1,
    B = dir > 0 ? p1 : p0,
    t0 = Date.now();
  el.setAttribute("opacity", "1");
  const tick = () => {
    if (this.reduce || document.hidden) {
      el.setAttribute("opacity", "0");
      return;
    }
    const p = Math.min(1, (Date.now() - t0) / dur),
      e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2,
      u = 1 - e;
    el.setAttribute(
      "transform",
      `translate(${u * u * A[0] + 2 * u * e * c[0] + e * e * B[0]} ${u * u * A[1] + 2 * u * e * c[1] + e * e * B[1]})`,
    );
    packetTimers[id] = p < 1 ? setTimeout(tick, 16) : setTimeout(() => el.setAttribute("opacity", "0"), 300);
  };
  tick();
}
