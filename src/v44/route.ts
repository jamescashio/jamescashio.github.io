/**
 * The helm's teaching model. Deliberately the same rule as the Odyssey routing example
 * (src/odyssey/data.ts, routeExample); a test keeps the two in step.
 */
export type Intent = "draft" | "research" | "analyze";
export type RouteInput = { intent: Intent; privateData: boolean; sources: boolean };
export type Route = { lane: string; code: "HOLD" | "EVIDENCE" | "QUALIFIED"; detail: string; steps: string[] };

export function route(input: RouteInput): Route {
  if (input.privateData)
    return {
      lane: "Human review",
      code: "HOLD",
      detail: "The privacy boundary comes first. Confirm an authorized processing route before any external execution.",
      steps: [
        "Intent identified",
        "Private input detected",
        "External route held",
        "Reason preserved",
        "Operator decision required",
      ],
    };
  if (input.intent === "research" || input.sources)
    return {
      lane: "Research",
      code: "EVIDENCE",
      detail:
        "Attributable evidence is part of the request. Route to research, then review the sources and their limits.",
      steps: [
        "Evidence requirement found",
        "Public input accepted",
        "Research lane selected",
        "Sources requested",
        "Operator reviews evidence",
      ],
    };
  const analyze = input.intent === "analyze";
  return {
    lane: analyze ? "Synthesis" : "Workhorse",
    code: "QUALIFIED",
    detail: analyze
      ? "A synthesis task needs connected reasoning. Preserve the assumptions and send the result for review."
      : "Routine drafting fits a general work lane. Greater expense needs a reason.",
    steps: [
      "Intent identified",
      "Public input accepted",
      analyze ? "Synthesis lane selected" : "Workhorse lane selected",
      "Decision recorded",
      "Operator reviews the draft",
    ],
  };
}

const CODE_LABEL: Record<Route["code"], string> = {
  HOLD: "Held for a person",
  EVIDENCE: "Evidence required",
  QUALIFIED: "Qualified",
};

export function mountHelm(form: HTMLFormElement, result: HTMLElement) {
  const lane = result.querySelector<HTMLElement>("[data-helm-lane]")!;
  const code = result.querySelector<HTMLElement>("[data-helm-code]")!;
  const detail = result.querySelector<HTMLElement>("[data-helm-detail]")!;
  const steps = result.querySelector<HTMLOListElement>("[data-helm-steps]")!;
  // The route map draws the same decision: a packet rides the chosen lane, or stops at the gate when held.
  const map = result.querySelector<SVGSVGElement>("[data-route-map]");
  const read = (): RouteInput => {
    const data = new FormData(form);
    return {
      intent: (data.get("intent") as Intent) || "draft",
      privateData: data.has("privateData"),
      sources: data.has("sources"),
    };
  };
  const render = (animate: boolean) => {
    const r = route(read());
    lane.textContent = r.lane;
    code.textContent = CODE_LABEL[r.code];
    detail.textContent = r.detail;
    result.dataset.code = r.code;
    if (map) {
      map.dataset.route = r.code === "HOLD" ? "hold" : r.code === "EVIDENCE" ? "research" : r.lane.toLowerCase();
      if (animate) {
        // A fresh packet starts its ride from the beginning; the old one would keep its finished state.
        map.classList.add("ride");
        const packet = map.querySelector(".route-packet");
        packet?.replaceWith(packet.cloneNode(true));
      }
    }
    steps.replaceChildren(
      ...r.steps.map((s) => {
        const li = document.createElement("li");
        li.textContent = s;
        return li;
      }),
    );
    if (!animate) return;
    steps.classList.remove("run");
    requestAnimationFrame(() => steps.classList.add("run"));
    document.dispatchEvent(new CustomEvent("v44:route", { detail: r }));
  };
  form.addEventListener("change", () => render(true));
  form.addEventListener("submit", (e) => e.preventDefault());
  render(false);
}
