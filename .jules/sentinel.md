## 2024-05-15 - [DOM XSS Prevention via innerHTML]
**Vulnerability:** Found multiple instances where `innerHTML` was used to manipulate the DOM, including injecting user-controlled text like `taskName` in `lab.html`. This pattern leads to DOM-based Cross-Site Scripting (XSS).
**Learning:** Even simple DOM updates like adding log messages or resetting content can introduce vulnerabilities if `innerHTML` is used instead of safe alternatives, especially when user inputs or variables are part of the string.
**Prevention:** Always use safe DOM methods like `document.createElement`, `document.createTextNode`, and `.appendChild` for adding content. Use `textContent` for resetting or changing text content. Never use `innerHTML` unless absolutely necessary, and never with untrusted data.

## 2024-05-16 - [Safe DOM Manipulation & Double Escaping Prevention]
**Vulnerability:** Extensive use of `innerHTML` in `index.html` and `command.html` for dynamic data insertion (e.g., latency metrics and event streams), leading to DOM-based XSS risks.
**Learning:** Replacing `innerHTML` with `document.createTextNode` or `textContent` automatically handles encoding. A common mistake is manually pre-escaping HTML entities (like `<` to `&lt;`) before passing them to `createTextNode` or `textContent`, which results in double-escaping and incorrect display in the UI.
**Prevention:** Avoid `innerHTML` entirely for dynamic data. Use `textContent` or `document.createElement()`. Do not manually escape input when using these safe DOM APIs, as the browser natively treats the input as literal text, providing built-in XSS protection without double-escaping.
