## 2024-05-15 - [DOM XSS Prevention via innerHTML]
**Vulnerability:** Found multiple instances where `innerHTML` was used to manipulate the DOM, including injecting user-controlled text like `taskName` in `lab.html`. This pattern leads to DOM-based Cross-Site Scripting (XSS).
**Learning:** Even simple DOM updates like adding log messages or resetting content can introduce vulnerabilities if `innerHTML` is used instead of safe alternatives, especially when user inputs or variables are part of the string.
**Prevention:** Always use safe DOM methods like `document.createElement`, `document.createTextNode`, and `.appendChild` for adding content. Use `textContent` for resetting or changing text content. Never use `innerHTML` unless absolutely necessary, and never with untrusted data.

## 2024-05-24 - [DOM XSS Vulnerability in Voice Transmission]
**Vulnerability:** Found an instance in `index.html` within the `runVoice()` function where `innerHTML` was used to insert user input directly into the DOM (`out.innerHTML = ... "${text}" ...`).
**Learning:** Hardcoded templates that interpolate untrusted user input and are rendered via `innerHTML` bypass basic HTML escaping and create critical XSS vulnerabilities.
**Prevention:** Construct DOM nodes dynamically using safe manipulation methods (`document.createElement`, `document.createTextNode`, `appendChild`) rather than raw string interpolation for user-provided data.
