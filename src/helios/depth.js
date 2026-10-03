import { $$ } from "./dom.js";

const KEY = "cashio-depth";

/**
 * Plain English is the default reading. "With technical detail" reveals short engineer notes beside the same copy,
 * so one page serves both audiences without changing what a first visit sees.
 */
export function setupDepth() {
  const control = /** @type {HTMLElement | null} */ (document.querySelector(".depth-switch"));
  if (!control) return;
  const options = /** @type {HTMLButtonElement[]} */ ($$(".depth-opt", control));
  const notes = /** @type {HTMLElement[]} */ ($$("[data-tech]"));
  /** @param {string} depth */
  const apply = (depth) => {
    const tech = depth === "tech";
    document.documentElement.dataset.depth = tech ? "tech" : "plain";
    for (const option of options) option.setAttribute("aria-pressed", String(option.dataset.depth === depth));
    for (const note of notes) note.hidden = !tech;
  };
  /** @returns {string} */
  const stored = () => {
    try {
      return localStorage.getItem(KEY) === "tech" ? "tech" : "plain";
    } catch {
      return "plain";
    }
  };
  apply(stored());
  control.hidden = false;
  for (const option of options)
    option.addEventListener("click", () => {
      const depth = option.dataset.depth === "tech" ? "tech" : "plain";
      apply(depth);
      try {
        localStorage.setItem(KEY, depth);
      } catch {
        /* Private browsing keeps the choice for this visit only. */
      }
    });
}
