## 2024-05-15 - [DOM XSS Prevention via innerHTML]
**Vulnerability:** Found multiple instances where `innerHTML` was used to manipulate the DOM, including injecting user-controlled text like `taskName` in `lab.html`. This pattern leads to DOM-based Cross-Site Scripting (XSS).
**Learning:** Even simple DOM updates like adding log messages or resetting content can introduce vulnerabilities if `innerHTML` is used instead of safe alternatives, especially when user inputs or variables are part of the string.
**Prevention:** Always use safe DOM methods like `document.createElement`, `document.createTextNode`, and `.appendChild` for adding content. Use `textContent` for resetting or changing text content. Never use `innerHTML` unless absolutely necessary, and never with untrusted data.

## 2024-05-17 - [API Key Timing Attack Prevention]
**Vulnerability:** Found the API key being verified using standard string equality (`==`) in `scripts/zeusapollo_swarm.py`, which is susceptible to timing attacks. An attacker could potentially guess the API key by measuring the time it takes for the server to reject incorrect keys.
**Learning:** Standard string equality checks return `False` as soon as a character mismatch is found. This means the time it takes to process the request can leak information about how many characters at the beginning of the string were correct.
**Prevention:** When comparing cryptographic secrets, authentication tokens, or API keys, always use `secrets.compare_digest()` to ensure the comparison is done in constant time, preventing timing attacks.
