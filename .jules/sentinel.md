## 2024-05-15 - [DOM XSS Prevention via innerHTML]
**Vulnerability:** Found multiple instances where `innerHTML` was used to manipulate the DOM, including injecting user-controlled text like `taskName` in `lab.html`. This pattern leads to DOM-based Cross-Site Scripting (XSS).
**Learning:** Even simple DOM updates like adding log messages or resetting content can introduce vulnerabilities if `innerHTML` is used instead of safe alternatives, especially when user inputs or variables are part of the string.
**Prevention:** Always use safe DOM methods like `document.createElement`, `document.createTextNode`, and `.appendChild` for adding content. Use `textContent` for resetting or changing text content. Never use `innerHTML` unless absolutely necessary, and never with untrusted data.

## 2024-06-15 - [DOM XSS Prevention in command.html]
**Vulnerability:** Found two instances in `command.html` where `innerHTML` was used to manipulate the DOM, appending strings dynamically using string interpolation with untrusted variables (`evt.event`, `evt.detail`, `n.name`, `n.role`). This pattern leads to DOM-based Cross-Site Scripting (XSS).
**Learning:** Re-emphasized the danger of using string interpolation combined with `innerHTML`, which directly parses and executes potentially malicious content. Proper usage of `document.createElement`, `textContent`, and `appendChild` mitigates this risk while providing equivalent layout capabilities.
**Prevention:** Always use safe DOM methods instead of `innerHTML`, especially inside dynamic rendering blocks iterating over objects.
