## 2026-05-02 - [Fix DOM-based XSS in lab.html]
**Vulnerability:** A classic DOM-based XSS was found in `lab.html`'s `executeBurn` function where `taskName` was read from DOM and directly injected into `log.innerHTML`.
**Learning:** Even internal testing pages can contain DOM-based XSS when utilizing `.innerHTML` for logging.
**Prevention:** Avoid `innerHTML` combined with dynamic user input. Use `.textContent`, or sanitize the input strings before inserting into the DOM.
