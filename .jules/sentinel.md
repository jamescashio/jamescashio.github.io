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

## 2026-05-29 - [Conditional CSP Headers in FastAPI]
**Vulnerability:** Adding strict `Content-Security-Policy` (CSP) headers (e.g., `default-src 'none'; frame-ancestors 'none'`) globally across all endpoints in a FastAPI application breaks the built-in OpenAPI documentation pages (`/docs`, `/redoc`), as they rely on inline scripts, external styles, and specific framing mechanisms.
**Learning:** Implementing security headers globally without considering framework-specific endpoints (like Swagger UI) results in a broken developer experience and often leads to the rollback of the security control entirely.
**Prevention:** When adding restrictive Content-Security-Policy headers to FastAPI applications, ensure OpenAPI documentation endpoints (`/docs`, `/redoc`, `/openapi.json`) are conditionally excluded to avoid breaking the Swagger UI and ReDoc pages.

## 2024-05-30 - [DOM XSS Prevention in Event Ticker and Node List]
**Vulnerability:** Found `innerHTML` used in `command.html` for both the event ticker (`entry.innerHTML = ...`) and the node list rendering (`item.innerHTML = ...`). The node list rendering was particularly vulnerable as it injected dynamic JSON data (from `status.json`) into the DOM.
**Learning:** Even when populating simple lists or tickers from external or dynamic sources (like JSON files), using `innerHTML` introduces a significant risk of DOM XSS if the data source is compromised or tampered with.
**Prevention:** Always use secure DOM creation methods (`document.createElement`, `textContent`, `classList.add`, and `appendChild`) instead of `innerHTML` when rendering lists or components with dynamic data.
## 2024-06-06 - Hardcoded LiteLLM API Key and Insecure Config Paths
**Vulnerability:** A hardcoded `LITELLM_KEY` was found embedded directly in `scripts/zeusapollo_swarm.py`, leaking an internal proxy API key. Additionally, configuration was reading from an absolute root path (`/root/.hermes/config/auth.json`), which caused potential permission errors or hardcoded dependency assumptions.
**Learning:** Hardcoded credentials and strictly absolute paths to user home directories (`/root/`) frequently appear in ad-hoc networking bridge scripts between models. This highlights a gap in environment-agnostic security assumptions.
**Prevention:** Always load secrets via environment variables (e.g. `os.environ.get`) and fall back to local JSON/YAML config files located using `os.path.expanduser("~/.hermes/...")` instead of absolute path hardcoding.

## 2024-06-08 - [FastAPI Unhandled Exception Stack Trace Leakage]
**Vulnerability:** FastAPI endpoints in `zeusapollo_swarm.py` and `zeusapollo_bridge.py` lacked top-level exception handling. If an unhandled exception occurred, the internal error could potentially leak stack traces or internal system states to the client depending on the environment configuration, or cause the process to crash ungracefully.
**Learning:** Unhandled exceptions in backend API routes are a common source of information disclosure. Default exception handlers may leak implementation details (like file paths, library versions, or specific database query failures) that aid attackers in reconnaissance.
**Prevention:** Always include top-level `try/except Exception as e:` blocks in FastAPI endpoints to catch generic exceptions, log them securely on the server side, and raise a sanitized `HTTPException` (e.g., `500 Internal Server Error`) to the client to fail securely.

## 2024-06-09 - [Missing Security Headers in Secondary Bridge Script]
**Vulnerability:** `scripts/zeusapollo_bridge.py`, a secondary bridge script used for speculative decoding, was missing basic security headers (like Content-Security-Policy, X-Frame-Options, X-Content-Type-Options) while the primary swarm script already possessed them.
**Learning:** It is easy to overlook baseline security measures when creating secondary, internal, or highly specialized scripts (such as for speculative decoding). However, any exposed HTTP endpoint requires consistent baseline security headers to prevent attacks like clickjacking or content sniffing.
**Prevention:** Always implement a security middleware applying strict HTTP headers (including CSP, HSTS, and X-Frame-Options) across all API surfaces, regardless of their primary intent or network positioning.

## 2026-06-11 - [Path-Based Security Bypass via URL Prefix Matching]
**Vulnerability:** The security middleware in `scripts/zeusapollo_swarm.py` relied solely on the URL prefix matching `startswith("/v1/")` to apply authentication, rate limiting, and CORS checks. Endpoints without this prefix (like the `/route` endpoint) were unintentionally exposed to unauthenticated public access.
**Learning:** Using an allow-list or prefix-based approach for applying security controls is prone to bypass vulnerabilities when new routes are added or when routes purposefully exclude the prefix but require protection.
**Prevention:** Always implement a deny-by-default approach for security middleware. Apply authentication and rate-limiting to ALL endpoints, and explicitly exclude known public paths (e.g., `/health`, `/docs`) using an explicit exclusion list rather than conditionally protecting based on prefixes.
