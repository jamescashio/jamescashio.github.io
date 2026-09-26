/**
 * Styles owned by script, applied as constructable stylesheets.
 * The home page's Content Security Policy allows no inline style elements or style attributes;
 * a constructed sheet is CSSOM, which that policy permits.
 */
export type AdoptedStyles = { update(css: string): void; remove(): void };

export function adoptStyles(css: string): AdoptedStyles {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(css);
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  return {
    update: (next) => sheet.replaceSync(next),
    remove() {
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter((entry) => entry !== sheet);
    },
  };
}
