## 2024-05-15 - [DOM XSS Prevention via innerHTML]
**Vulnerability:** Found multiple instances where `innerHTML` was used to manipulate the DOM, including injecting user-controlled text like `taskName` in `lab.html`. This pattern leads to DOM-based Cross-Site Scripting (XSS).
**Learning:** Even simple DOM updates like adding log messages or resetting content can introduce vulnerabilities if `innerHTML` is used instead of safe alternatives, especially when user inputs or variables are part of the string.
**Prevention:** Always use safe DOM methods like `document.createElement`, `document.createTextNode`, and `.appendChild` for adding content. Use `textContent` for resetting or changing text content. Never use `innerHTML` unless absolutely necessary, and never with untrusted data.

## 2024-05-24 - [Hardcoded LiteLLM API Key]
**Vulnerability:** Found a hardcoded API key (`LITELLM_KEY`) in `scripts/zeusapollo_swarm.py`. Hardcoding secrets into source code is a critical vulnerability that can lead to unauthorized access and resource abuse if the code is exposed.
**Learning:** Hardcoding secrets is never acceptable, even in bridge/swarm scripts or internal tools. API keys should be decoupled from the codebase entirely.
**Prevention:** Always load secrets via environment variables (`os.environ.get("...")`) with a structured fallback to a secure local configuration file (e.g., `/root/.hermes/config/auth.json`), similar to the `SWARM_API_KEY` logic.
