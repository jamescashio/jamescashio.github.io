import { adoptStyles } from "./adopted-styles";
import ENHANCE_STYLE from "./enhance.css?inline";

/** Adopt the below the fold refinements once the first frame has painted. */
export function adoptEnhancements() {
  const apply = () => adoptStyles(ENHANCE_STYLE);
  if ("requestIdleCallback" in window) requestIdleCallback(apply, { timeout: 1200 });
  else setTimeout(apply, 200);
}
