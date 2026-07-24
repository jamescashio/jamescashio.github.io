# ZEUSAPOLLO v31.2 — “Fleet Awakening”

cashio.us is Doug Cashio’s interactive portfolio for independently built enterprise AI, cybersecurity, automation, and sovereign homelab work.

The public site shows sanitized proof and architectural roles while withholding addresses, ports, credentials, customer information, private access paths, and detailed operational telemetry.

## Current release

| Item | Current public state |
|---|---|
| **Release** | v31.2 — “Fleet Awakening” |
| **Architecture inventory** | Owner reviewed 07-24-2026 |
| **Hosts** | 2 personal homelab hosts |
| **Documented roles** | 19 public-safe service roles |
| **Owner-reviewed active roles** | 18 roles, including Athena |
| **Decommissioned** | 1 service — Home-Asst |
| **Model routes** | 10 configured routes |
| **Automation** | 31 last-reported jobs |
| **Estimated inference burn** | Approximately $0.35/day, last reported |
| **Deployment** | GitHub Pages from `main` |
| **Production site** | `https://cashio.us` |

The inventory is an owner-reviewed public architecture map, not streaming health telemetry or a remote-control surface. It describes public-safe roles and boundaries while operational state remains private.

## Model routing fabric

| Route | Configured model |
|---|---|
| Primary | DeepSeek V4 Pro |
| Premium | Claude Sonnet 5 |
| Research | Grok 4.5 |
| Coding | GLM 5.2 |
| Extraction | Gemma 4 26B A4B, local |
| Vision | Gemini 3.6 Flash |
| Voice | Grok 4.6 Voice TTS, owner-reported route name |
| Failover 1 | DeepSeek V4 Flash |
| Failover 2 | GLM 5.2 |
| Failover 3 | Gemini 3.6 Flash |

These are configured routes, not live-traffic claims or a universal model ranking. The route catalog was reconciled on 07-24-2026. Current official documentation confirms DeepSeek V4 Pro and V4 Flash, Claude Sonnet 5, Gemini 3.6 Flash, Grok 4.5, and the xAI Voice/TTS API. The Grok 4.6 Voice TTS label is the owner-reported route name; xAI does not currently publish that numeric voice alias.

## Public-safety posture

- No private network addresses, ports, credentials, customer data, employer-confidential material, or access procedures are published.
- The architecture inventory is dated and owner reviewed; it does not claim live service health.
- The page performs no live infrastructure calls; interactive demonstrations remain browser local.
- Public contact information is limited to the cashio.us domain and linked professional profiles.
- Reduced-motion support, keyboard navigation, semantic labels, and a restrictive Content Security Policy are retained.

## Key files

| File | Purpose |
|---|---|
| `index.html` | Production portfolio and interactive command deck |
| `assets/sovereign-star-chart-v1.webp` | Original 32 KB cinematic atmosphere, optimized for the command deck |
| `status.json` | Coarse, owner-reviewed public architecture contract |
| `README.md` | Current public architecture and release summary |
| `CHANGELOG.md` | Public-facing release history |
| `RELEASE_BODY.md` | Current v31.2 release notes |
| `SECURITY.md` | Vulnerability reporting and repository boundaries |
| `PRIVACY.md` | Public privacy notice |
| `scripts/public_repo_guard.py` | Automated public-repository safety scanner |
| `scripts/check_release_consistency.py` | Cross-file release consistency checker |

## Release flow

1. Reconcile the owner-reviewed public architecture inventory.
2. Keep `index.html`, `status.json`, `README.md`, `CHANGELOG.md`, and `RELEASE_BODY.md` consistent.
3. Run the public-safety and release-consistency checks.
4. Merge the reviewed release branch into `main`.
5. GitHub Pages publishes `https://cashio.us`.

## License

Source-visible portfolio project. **All rights reserved.** No reuse or redistribution rights are granted unless explicitly authorized by the owner.
