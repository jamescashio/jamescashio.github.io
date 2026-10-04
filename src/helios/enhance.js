import { adoptStyles } from "./adopted-styles";
import ENHANCE_STYLE from "./enhance.css?inline";
import { setupDepth } from "./depth.js";
import { setupFlourish } from "./flourish.js";

/** Adopt the below the fold refinements once the first frame has painted. */
export function adoptEnhancements() {
  const apply = () => {
    adoptStyles(ENHANCE_STYLE);
    // The reading depth switch appears only once its styles exist, so it never flashes unstyled.
    setupDepth();
    setupFlourish();
  };
  if ("requestIdleCallback" in window) requestIdleCallback(apply, { timeout: 1200 });
  else setTimeout(apply, 200);
}
