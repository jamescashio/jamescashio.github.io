/** Visitor type styles, applied from the header control and Mission Control. */
import { adoptStyles } from "./adopted-styles";
import { $$ } from "./dom.js";
import cockpitStyles from "./type-cockpit.css?inline";
import readableStyles from "./type-readable.css?inline";

/**
 * Visitor type styles. Signature is the shipped look and needs no extra CSS; the others load
 * their fonts only when chosen, so first paint and the style budget are untouched.
 */
const TYPE_STYLES = {
  signature: { name: "Signature", css: "" },
  cockpit: { name: "Cockpit", css: cockpitStyles },
  readable: { name: "Readable", css: readableStyles },
};

export function setupTypeStyles() {
  const button = document.getElementById("type-btn");
  const label = document.getElementById("type-name");
  const choices = $$("[data-type-choice]");
  const order = Object.keys(TYPE_STYLES);
  let style = null;
  let current = "signature";
  try {
    const saved = localStorage.getItem("cashio-type");
    if (saved && TYPE_STYLES[saved]) current = saved;
  } catch {
    /* A remembered type style is optional. */
  }
  const apply = (key, remember) => {
    current = key;
    const { name, css } = TYPE_STYLES[key];
    if (css && !style) style = adoptStyles(css);
    else style?.update(css);
    document.documentElement.dataset.type = key;
    if (label) label.textContent = name;
    button?.setAttribute("aria-label", `Aa ${name}. Change type style`);
    choices.forEach((choice) => choice.setAttribute("aria-pressed", String(choice.dataset.typeChoice === key)));
    if (remember) {
      try {
        localStorage.setItem("cashio-type", key);
      } catch {
        /* A remembered type style is optional. */
      }
    }
  };
  apply(current, false);
  button?.addEventListener("click", () => apply(order[(order.indexOf(current) + 1) % order.length], true));
  choices.forEach((choice) => choice.addEventListener("click", () => apply(choice.dataset.typeChoice, true)));
}
