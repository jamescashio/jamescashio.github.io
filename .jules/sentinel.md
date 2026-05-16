## 2024-05-15 - [DOM XSS Prevention via innerHTML]
**Vulnerability:** Found multiple instances where `innerHTML` was used to manipulate the DOM, including injecting user-controlled text like `taskName` in `lab.html`. This pattern leads to DOM-based Cross-Site Scripting (XSS).
**Learning:** Even simple DOM updates like adding log messages or resetting content can introduce vulnerabilities if `innerHTML` is used instead of safe alternatives, especially when user inputs or variables are part of the string.
**Prevention:** Always use safe DOM methods like `document.createElement`, `document.createTextNode`, and `.appendChild` for adding content. Use `textContent` for resetting or changing text content. Never use `innerHTML` unless absolutely necessary, and never with untrusted data.

## 2024-05-16 - [Timing Attack in API Key Validation]
**Vulnerability:** The API Gateway `zeusapollo_swarm.py` compared the incoming `X-API-Key` with the expected `API_KEY` using the standard `==` string comparison operator. This operator returns as soon as it finds a mismatched character, making it vulnerable to a timing attack where an attacker can determine the correct API key character by character based on the time it takes for the server to respond.
**Learning:** Standard string equality (`==`) in Python should never be used to compare cryptographic secrets or authentication tokens.
**Prevention:** Always use `secrets.compare_digest(a, b)` for comparing secrets, tokens, signatures, or passwords to ensure a constant-time comparison that resists timing attacks.
