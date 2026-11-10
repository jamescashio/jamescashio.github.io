/**
 * The helm's teaching model. Deliberately the same rule as the Odyssey routing example
 * (src/odyssey/data.ts, routeExample): the same input always reaches the same lane and code, and a
 * test keeps the two in step. The wording is this edition's own.
 */
import { toast } from "./toast.ts";

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

/**
 * A route a visitor can hand to someone else. The inputs ride in the address as one short word list
 * (`?route=research.private#helm`), and the page reads them back, so the link opens on the same decision.
 */
const INTENTS: readonly Intent[] = ["draft", "research", "analyze"];

export function encodeRoute(input: RouteInput): string {
  return [input.intent, input.privateData ? "private" : "", input.sources ? "sources" : ""].filter(Boolean).join(".");
}

/** Anything the helm did not write itself is ignored, so a mistyped or edited link opens the helm as it ships. */
export function decodeRoute(text: string | null | undefined): RouteInput | null {
  if (!text) return null;
  const [intent, ...flags] = text.split(".");
  if (!INTENTS.includes(intent as Intent)) return null;
  if (flags.some((flag, i) => (flag !== "private" && flag !== "sources") || flags.indexOf(flag) !== i)) return null;
  return { intent: intent as Intent, privateData: flags.includes("private"), sources: flags.includes("sources") };
}

/** The address that reopens the helm on this input, built from the page's own address. */
export function shareHref(input: RouteInput, base: string): string {
  const url = new URL(base);
  url.search = "";
  url.searchParams.set("route", encodeRoute(input));
  url.hash = "helm";
  return url.href;
}

export function mountHelm(form: HTMLFormElement, result: HTMLElement) {
  const lane = result.querySelector<HTMLElement>("[data-helm-lane]")!;
  const code = result.querySelector<HTMLElement>("[data-helm-code]")!;
  const detail = result.querySelector<HTMLElement>("[data-helm-detail]")!;
  const steps = result.querySelector<HTMLOListElement>("[data-helm-steps]")!;
  // Screen readers hear the decision in one line; the steps and detail are there to read, not to be recited.
  const say = result.querySelector<HTMLElement>("[data-helm-say]");
  // The route map draws the same decision: a packet rides the chosen lane, or stops at the gate when held.
  const map = (form.closest(".helm-grid") || result).querySelector<SVGSVGElement>("[data-route-map]");
  const example = result.querySelector<HTMLElement>("[data-helm-example]");
  // Read the controls themselves, which hold their state even before script switches them on.
  const checked = (name: string) => form.querySelector<HTMLInputElement>(`input[name="${name}"]`)?.checked ?? false;
  const read = (): RouteInput => ({
    intent: (form.querySelector<HTMLInputElement>('input[name="intent"]:checked')?.value as Intent) || "draft",
    privateData: checked("privateData"),
    sources: checked("sources"),
  });
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
    if (say) say.textContent = `${r.lane}. ${CODE_LABEL[r.code]}.`;
    // On a phone the drawing sits under the inputs; if it is below the screen, bring it up so the change is seen.
    if (map && matchMedia("(max-width: 759px)").matches) {
      const box = map.getBoundingClientRect();
      if (box.bottom > innerHeight)
        map.scrollIntoView({
          block: "nearest",
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        });
    }
    steps.classList.remove("run");
    requestAnimationFrame(() => steps.classList.add("run"));
    document.dispatchEvent(new CustomEvent("v44:route", { detail: r }));
  };
  // A shared link carries its inputs in the address; set the controls to them before the first reading.
  const shared = decodeRoute(new URLSearchParams(location.search).get("route"));
  if (shared) {
    form
      .querySelectorAll<HTMLInputElement>('input[name="intent"]')
      .forEach((input) => (input.checked = input.value === shared.intent));
    for (const name of ["privateData", "sources"] as const) {
      const input = form.querySelector<HTMLInputElement>(`input[name="${name}"]`);
      if (input) input.checked = shared[name];
    }
  }
  // Share hands over the decision on screen: the device's own share sheet where there is one, the clipboard elsewhere.
  result.querySelector<HTMLButtonElement>("[data-helm-share]")?.addEventListener("click", async () => {
    const input = read();
    const r = route(input);
    const href = shareHref(input, location.href);
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "Take the helm at cashio.us",
          text: `I took the helm at cashio.us. ${r.lane}: ${CODE_LABEL[r.code].toLowerCase()}.`,
          url: href,
        });
        return;
      } catch (error) {
        // Closing the share sheet is an answer, not a failure.
        if ((error as DOMException)?.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(href);
      toast(`Link copied. It opens the helm on ${r.lane}.`);
    } catch {
      // The address bar is a copy the visitor can always reach.
      history.replaceState(history.state, "", href);
      toast("Copy blocked here. The link is now in the address bar.");
    }
  });
  form.addEventListener("change", () => render(true));
  // A page restored from history keeps the visitor's inputs; the result follows them.
  addEventListener("pageshow", () => render(false));
  form.addEventListener("submit", (e) => e.preventDefault());
  render(false);
}
