/**
 * The helm's teaching model. Deliberately the same rule as the Odyssey routing example
 * (src/odyssey/data.ts, routeExample): the same input always reaches the same lane and code, and a
 * test keeps the two in step. The wording is this edition's own.
 */
export type Intent = "draft" | "research" | "analyze";
export type RouteInput = { intent: Intent; privateData: boolean; sources: boolean };
/** `id` names the lane for code (the route map, Bit's lines); `lane` is the words a visitor reads. */
export type LaneId = "hold" | "research" | "workhorse" | "synthesis";
export type Route = {
  id: LaneId;
  lane: string;
  code: "HOLD" | "EVIDENCE" | "QUALIFIED";
  detail: string;
  steps: string[];
};

export function route(input: RouteInput): Route {
  if (input.privateData)
    return {
      id: "hold",
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
      id: "research",
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
    id: analyze ? "synthesis" : "workhorse",
    lane: analyze ? "Synthesis" : "Workhorse",
    code: "QUALIFIED",
    detail: analyze
      ? "A synthesis task needs connected reasoning. Preserve the assumptions and send the result for review."
      : "Routine drafting fits a capable general lane. A costlier one needs a reason.",
    steps: [
      "Intent identified",
      "Public input accepted",
      analyze ? "Synthesis lane selected" : "Workhorse lane selected",
      "Decision recorded",
      analyze ? "Operator reviews the analysis" : "Operator reviews the draft",
    ],
  };
}

/** A concrete task for each kind of work, so the route reads as a decision about something real. */
const EXAMPLES: Record<Intent, string> = {
  draft: "a first draft of a project update.",
  research: "what changed in a public standard, with the sources cited.",
  analyze: "compare two backup plans and the risks each one leaves.",
};

const CODE_LABEL: Record<Route["code"], string> = {
  HOLD: "Held for a person",
  EVIDENCE: "Evidence required",
  QUALIFIED: "Suggested lane",
};

export function mountHelm(form: HTMLFormElement, result: HTMLElement) {
  const lane = result.querySelector<HTMLElement>("[data-helm-lane]")!;
  const code = result.querySelector<HTMLElement>("[data-helm-code]")!;
  const detail = result.querySelector<HTMLElement>("[data-helm-detail]")!;
  const steps = result.querySelector<HTMLOListElement>("[data-helm-steps]")!;
  // The route map draws the same decision: a packet rides the chosen lane, or stops at the gate when held.
  const map = (form.closest(".helm-grid") || result).querySelector<SVGSVGElement>("[data-route-map]");
  const example = result.querySelector<HTMLElement>("[data-helm-example]");
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
    if (example) example.textContent = `Example task: ${EXAMPLES[read().intent]}`;
    if (map) {
      map.dataset.route = r.id;
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
