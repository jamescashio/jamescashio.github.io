## 2024-05-15 - [DOM XSS Prevention via innerHTML]
**Vulnerability:** Found multiple instances where `innerHTML` was used to manipulate the DOM, including injecting user-controlled text like `taskName` in `lab.html`. This pattern leads to DOM-based Cross-Site Scripting (XSS).
**Learning:** Even simple DOM updates like adding log messages or resetting content can introduce vulnerabilities if `innerHTML` is used instead of safe alternatives, especially when user inputs or variables are part of the string.
**Prevention:** Always use safe DOM methods like `document.createElement`, `document.createTextNode`, and `.appendChild` for adding content. Use `textContent` for resetting or changing text content. Never use `innerHTML` unless absolutely necessary, and never with untrusted data.

## 2024-05-19 - [Timing Attack Prevention on API Keys]
**Vulnerability:** Found standard string equality (`==`) being used to compare authentication tokens (`X-API-Key`) in `scripts/zeusapollo_swarm.py`. This pattern introduces a timing attack vulnerability where an attacker can theoretically determine the length and value of the correct token based on response time.
**Learning:** Python's standard string comparison compares character by character and returns early upon the first mismatch. In security contexts involving secrets, this early return causes varying response times depending on how many characters match the secret prefix.
**Prevention:** Always use `secrets.compare_digest()` from Python's standard library when comparing cryptographic secrets, authentication tokens, or API keys, as it performs a constant-time comparison to prevent timing attacks.
