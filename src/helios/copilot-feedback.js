import { $ } from "./dom.js";
import { routeExample } from "./studies.js";

/** One pending routing reply, always tied to the inputs the visitor last chose. */
export function setupCopilotFeedback({ getRequest, say }) {
  let timer = 0;
  const keyOf = (request) => `${request.intent}:${request.privateData}:${request.sources}`;
  $("#hermes-controls").addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("#route-btn")) return;
    clearTimeout(timer);
  });
  $("#route-btn").addEventListener("click", () => {
    clearTimeout(timer);
    const request = getRequest();
    const key = keyOf(request);
    const result = routeExample(request.intent, request.privateData, request.sources);
    say("THINKING", "Qualifying the route…", "think", 900);
    timer = window.setTimeout(() => {
      if (keyOf(getRequest()) !== key) return;
      if (result.code === "HOLD")
        say("HELD FOR A HUMAN", "Private input. I will not send this anywhere. The decision is yours.", "alert", 2600);
      else say("ROUTED", `${result.lane} lane. Every step is on the panel; nothing left this page.`, "yes", 2400);
    }, 900);
  });
  $("#trace-btn").addEventListener("click", () =>
    say("TRACE", "Following one request from intent to review. Conceptual, not live.", "think", 3000),
  );
  $("#eve-form").addEventListener("submit", () =>
    say("ASK THE EVIDENCE", "Every answer has a date and a boundary.", "think", 1600),
  );
}
