## 2024-05-15 - [DOM XSS Prevention via innerHTML]
**Vulnerability:** Found multiple instances where `innerHTML` was used to manipulate the DOM, including injecting user-controlled text like `taskName` in `lab.html`. This pattern leads to DOM-based Cross-Site Scripting (XSS).
**Learning:** Even simple DOM updates like adding log messages or resetting content can introduce vulnerabilities if `innerHTML` is used instead of safe alternatives, especially when user inputs or variables are part of the string.
**Prevention:** Always use safe DOM methods like `document.createElement`, `document.createTextNode`, and `.appendChild` for adding content. Use `textContent` for resetting or changing text content. Never use `innerHTML` unless absolutely necessary, and never with untrusted data.

## 2024-05-24 - [Hardcoded Secrets and Timing Attacks]
**Vulnerability:** Found a hardcoded application secret (`LITELLM_KEY`) in the source code. Also found standard string comparison (`==`) being used to verify API keys, which is vulnerable to timing attacks.
**Learning:** Hardcoded secrets compromise the security of the application and should be avoided. In Python, when comparing cryptographic secrets, authentication tokens, or API keys, using standard string equality allows an attacker to deduce the secret byte-by-byte by measuring the time taken for the comparison to fail.
**Prevention:** Application secrets and API keys should be loaded from environment variables with a structured fallback to the local configuration file (e.g., `/root/.hermes/config/auth.json`). Always use `secrets.compare_digest()` instead of standard string equality (`==`) when comparing secrets to prevent timing attacks.
