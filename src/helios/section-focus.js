/** Reveal the destination and move keyboard focus with its visible heading. */
export function focusSection(id, shouldScroll = true) {
  const target = document.getElementById(id);
  if (!target) return;
  // A shared address opens the workbench before focus or the fragment can land inside hidden content.
  let revealed = false;
  const workbench = /** @type {HTMLDetailsElement | null} */ (
    target.querySelector(":scope > .wrap > details.workbench-disclosure")
  );
  if (workbench && !workbench.open) {
    workbench.open = true;
    revealed = true;
  }
  for (let parent = target; parent; parent = parent.parentElement) {
    if (parent instanceof HTMLDetailsElement && !parent.open) {
      parent.open = true;
      revealed = true;
    }
  }
  const heading = /** @type {HTMLElement} */ (
    target.querySelector("h1,h2,h3") || (target.matches("details") ? target.querySelector("summary") : target)
  );
  if (!heading.matches("summary")) heading.setAttribute("tabindex", "-1");
  heading.focus({ preventScroll: true });
  // Move focus and its heading together. Smooth scrolling can drift as skipped sections lay out after resize.
  if (shouldScroll || revealed) target.scrollIntoView({ behavior: "instant", block: "start" });
  return heading;
}
