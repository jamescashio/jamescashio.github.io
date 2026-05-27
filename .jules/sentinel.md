## 2024-05-15 - [DOM XSS Prevention via innerHTML]
**Vulnerability:** Found multiple instances where `innerHTML` was used to manipulate the DOM, including injecting user-controlled text like `taskName` in `lab.html`. This pattern leads to DOM-based Cross-Site Scripting (XSS).
**Learning:** Even simple DOM updates like adding log messages or resetting content can introduce vulnerabilities if `innerHTML` is used instead of safe alternatives, especially when user inputs or variables are part of the string.
**Prevention:** Always use safe DOM methods like `document.createElement`, `document.createTextNode`, and `.appendChild` for adding content. Use `textContent` for resetting or changing text content. Never use `innerHTML` unless absolutely necessary, and never with untrusted data.

## 2026-05-21 - [Timing Attack Risk on API Key Verification]
**Vulnerability:** Used standard string equality (`==`) to verify the `X-API-Key` header against the expected `API_KEY` in Python. Standard string equality short-circuits on the first mismatched character, allowing an attacker to determine the secret via a timing attack by measuring the response time.
**Learning:** Even internal or local scripts verifying secrets (e.g., bridge endpoints) are vulnerable to side-channel timing attacks if they use non-constant time comparisons for cryptographic secrets or tokens.
**Prevention:** Always use `secrets.compare_digest()` (or an equivalent constant-time comparison function) instead of standard string equality (`==`) when validating API keys, passwords, or authentication tokens.

## 2024-05-25 - [Subdomain Bypass via Unanchored startswith in Referer Validation]
**Vulnerability:** The Referer validation in `scripts/zeusapollo_swarm.py` used `referer.startswith(allowed)` to verify if the referer was from an allowed origin. This permits a subdomain bypass attack, where a malicious origin like `http://localhost:11235.malicious.com` would falsely pass validation because it starts with the string `http://localhost:11235`.
**Learning:** String prefix checks for URLs/origins are insufficient because domain boundaries aren't respected. The malicious actor controls the suffix of the domain name.
**Prevention:** Never use unanchored `startswith()` checks for validating CORS origins or Referer headers. Always use exact equality matching (`referer == allowed`) or ensure the prefix includes a path separator (`referer.startswith(allowed + '/')`).

## 2024-05-27 - [Missing Content-Security-Policy in FastAPI apps]
**Vulnerability:** The FastAPI application lacked a `Content-Security-Policy` header, leaving the application more susceptible to cross-site scripting (XSS) or code injection attacks, especially if dynamic content is rendered.
**Learning:** Even backend APIs should implement a strict CSP (`default-src 'none'`) to mitigate accidental exposures or vulnerabilities. However, doing so globally in FastAPI breaks auto-generated documentation pages (Swagger UI and ReDoc) because they rely on inline scripts and styles.
**Prevention:** When applying strict Content-Security-Policy headers in FastAPI applications via middleware, conditionally exclude the OpenAPI documentation endpoints (`/docs`, `/redoc`, `/openapi.json`) to maintain functionality while securing the rest of the application.
