export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
export function press(group, attr, val) {
  $$("[" + attr + "]", group).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset[attr.slice(5)] === val)));
}
