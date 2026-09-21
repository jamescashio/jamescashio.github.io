import { gsap } from "gsap";
import { $, $$ } from "./dom.js";

export function setupPrivacy({ loadRequest, traceRequest, motion }) {
  $("#request-privacy").addEventListener("click", (event) => {
    const button = event.target.closest("[data-request-private]");
    if (!button) return;
    loadRequest({ privateData: button.dataset.requestPrivate === "true" }, true);
  });
  $("#pv-trace").addEventListener("click", () =>
    loadRequest({ intent: "analyze", privateData: true, sources: true }, true),
  );
  $("#st-trace").addEventListener("click", () => traceRequest());
  const pv = { pick: null };
  $$("[data-pv]").forEach((b) =>
    b.addEventListener("click", () => {
      pv.pick = b.dataset.pv;
      $$("[data-pv]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    }),
  );
  $("#pv-reveal").addEventListener("click", () => {
    loadRequest({ intent: "analyze", privateData: true, sources: true });
    $("#pv-trace").hidden = false;
    $("#pv-answer").textContent = "Human review";
    const res = $("#pv-result");
    res.hidden = false;
    $("#pv-text").innerHTML =
      `<strong>${pv.pick === "human" ? "Correct." : pv.pick === "keep" ? "Not this time." : "Revealed."}</strong> Private input always holds the external route for human review. Your prediction: ${pv.pick === "human" ? "Human review" : pv.pick === "keep" ? "Keep Research" : "none yet"}.`;
    if (motion()) gsap.from(res, { y: 10, opacity: 0, duration: 0.5, ease: "expo.out" });
  });

  return { getPrediction: () => pv.pick };
}
