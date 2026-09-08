import type { MouseEvent } from "react";

export const STUDY_BROWSER_ID = "study-browser";

/** Restore the chosen controls; running the study remains the visitor's action. */
export function loadStudyExample(event: MouseEvent<HTMLAnchorElement>) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  const oldURL = location.href,
    newURL = event.currentTarget.href;
  if (newURL !== oldURL) history.pushState(null, "", newURL);
  window.dispatchEvent(new HashChangeEvent("hashchange", { oldURL, newURL }));
  requestAnimationFrame(() => document.querySelector<HTMLButtonElement>("#project-panel .o-run")?.focus());
}
