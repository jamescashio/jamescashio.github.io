import { gsap } from "gsap";
import { $, $$ } from "./dom.js";

export function setupPrivacy({ loadRequest, traceRequest, motion, onReveal }) {
  $("#request-privacy").addEventListener("click", (event) => {
    const button = event.target.closest("[data-request-private]");
    if (!button) return;
    loadRequest({ privateData: button.dataset.requestPrivate === "true" }, true);
  });
  $("#pv-trace").addEventListener("click", () =>
    loadRequest({ intent: "analyze", privateData: true, sources: true }, true),
  );
  $("#st-trace").addEventListener("click", () => traceRequest());
  // The first prediction is the one that counts; a later change is acknowledged, not scored as a call.
  const pv = { pick: null, first: null };
  const result = $("#pv-result");
  const signal = $("#pv-signal");
  function resetResult() {
    gsap.killTweensOf([result, signal]);
    gsap.set([result, signal], { clearProps: "transform,opacity" });
    $("#pv-route").dataset.revealed = "false";
    $("#pv-answer").textContent = "Your call.";
    $("#pv-boundary").textContent = "Same task. Same sources. A different boundary.";
    result.hidden = true;
    $("#pv-text").replaceChildren();
    $("#pv-live").textContent = "";
    $("#pv-trace").hidden = true;
  }
  // A prediction is the whole question, so choosing one reveals the answer at once.
  $$("[data-pv]").forEach((b) =>
    b.addEventListener("click", () => {
      resetResult();
      pv.pick = b.dataset.pv;
      pv.first ??= pv.pick;
      $$("[data-pv]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      reveal();
    }),
  );
  $("#pv-reveal").addEventListener("click", () => reveal());
  function reveal() {
    loadRequest({ intent: "analyze", privateData: true, sources: true });
    gsap.killTweensOf([result, signal]);
    $("#pv-trace").hidden = false;
    $("#pv-answer").textContent = "Human review";
    $("#pv-boundary").textContent = "External processing waits for a person.";
    $("#pv-route").dataset.revealed = "true";
    result.hidden = false;
    const lead = document.createElement("strong");
    lead.textContent =
      pv.pick === "human"
        ? pv.first === "human"
          ? "You called it."
          : "Now you have it."
        : pv.pick === "keep"
          ? "Not quite. Privacy wins."
          : "The answer: human review.";
    $("#pv-text").replaceChildren(
      lead,
      " This model holds private input for a person, even when sources are required. Your prediction: " +
        (pv.pick === "human" ? "Human review." : pv.pick === "keep" ? "Research." : "none yet."),
    );
    $("#pv-live").textContent = $("#pv-text").textContent;
    if (motion()) {
      gsap.fromTo(result, { y: 6 }, { y: 0, duration: 0.35, ease: "power2.out", clearProps: "transform" });
      gsap.fromTo(
        signal,
        { x: 0, opacity: 1 },
        { x: 49, opacity: 0, duration: 0.8, ease: "power2.inOut", clearProps: "transform,opacity" },
      );
    }
    onReveal?.(pv.pick);
  }

  return { getPrediction: () => pv.pick };
}
