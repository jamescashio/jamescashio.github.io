/**
 * Finds the first element matching a selector, typed as an HTMLElement unless the caller narrows it.
 * @template {Element} [T=HTMLElement]
 * @param {string} s CSS selector.
 * @param {ParentNode} [r] Search root; the document by default.
 * @returns {T | null}
 */
export const $ = (s, r = document) => /** @type {T | null} */ (r.querySelector(s));
/**
 * Finds every element matching a selector as an array.
 * @template {Element} [T=HTMLElement]
 * @param {string} s CSS selector.
 * @param {ParentNode} [r] Search root; the document by default.
 * @returns {T[]}
 */
export const $$ = (s, r = document) => /** @type {T[]} */ (Array.from(r.querySelectorAll(s)));
/**
 * Presses the button whose data attribute holds the value and releases the others.
 * @param {ParentNode} group Element holding the buttons.
 * @param {string} attr Data attribute name, such as "data-mode".
 * @param {string} val Value of the pressed button.
 */
export function press(group, attr, val) {
  $$("[" + attr + "]", group).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset[attr.slice(5)] === val)));
}
/**
 * The nearest element at or above an event's target that matches a selector, or null.
 * @param {Event} event
 * @param {string} selector
 * @returns {HTMLElement | null}
 */
export const closestTarget = (event, selector) =>
  event.target instanceof Element ? /** @type {HTMLElement | null} */ (event.target.closest(selector)) : null;
