# ZEUSAPOLLO v32 — “The Bridge”

cashio.us is Doug Cashio’s interactive sovereign AI portfolio: personally owned infrastructure, quality-first model routing, cybersecurity, auditable automation, disciplined cost, and human command.

The public site shows sanitized proof and architectural roles while withholding addresses, ports, credentials, customer information, private access paths, and detailed operational telemetry.

## Current release

| Item | Current public state |
|---|---|
| **Release** | v32 — “The Bridge” |
| **Status export** | Verified 07-30-2026; expires 08-29-2026 |
| **Hosts** | 2 core homelab hosts, plus Athena at the edge |
| **Local inference host** | Atlas, standalone from the Proxmox quorum and 19-container total |
| **Documented roles** | 19 public-safe service roles |
| **Owner-reported healthy** | 19 services |
| **Maintenance** | 0 containers stopped at verification time |
| **Unreported** | 0 services |
| **Backup chain** | 18 of 19 containers inside 24 hours at verification time |
| **Patch posture** | 0 security updates due at verification time |
| **Automation health** | 71 of 71 jobs at last Hermes report (07-22-2026); zero errors |
| **Model routes** | 10 configured routes |
| **Automation** | 71 last-reported jobs |
| **Observed AI operating cost** | $0.26/day; $6.49 estimated monthly run rate |
| **Deployment** | GitHub Pages from `main` |
| **Production site** | `https://cashio.us` |

The v32 container figures come from an owner-run live verification over cluster SSH on 07-30-2026; automation and cost figures are Hermes-generated, public-safe, and sampled—not streaming telemetry. The export remains valid for 30 days or until the next architecture change. Athena is separately owner-confirmed active as a physical Home Assistant edge node and cluster quorum device, and is not included in the 19-container count. Atlas is separately documented as a standalone local-inference host and is not included in the Proxmox quorum or container total. The site never converts a current page-view date into a claim of live telemetry.

## Model routing fabric

| Route | Configured model |
|---|---|
| Tier 0 — classify/draft | Kimi K3 |
| Tier 1 — workhorse | DeepSeek V4 Flash |
| Tier 2 — exception | DeepSeek V4 Pro |
| Tier 3A — multimodal | Gemini 3.6 Flash |
| Tier 3B — adversarial | Grok 4.5 |
| Tier 4A — synthesis | Sol 5.6 Luna |
| Tier 4B — research | Sonar Pro |
| Tier 5 — adjudication | GPT-5.6 Sol |
| Local fallback | Gemma 4 26B |
| Gateway fabric | Atlas LiteLLM, OpenRouter, ZenMux |

These are configured lanes, not live-traffic claims or a universal model ranking. Hermes reconciled route roles, public model names, fallbacks, and provider state on 07-22-2026. Deprecated DeepSeek aliases were migrated to their current V4 names.

## Public-safety posture

- No private network addresses, ports, credentials, customer data, employer-confidential material, or access procedures are published.
- Service states are date bounded and automatically become historical after expiration.
- The page performs no live infrastructure calls; interactive demonstrations remain browser local.
- Public contact information is limited to the cashio.us domain and linked professional profiles.
- Reduced-motion support, keyboard navigation, semantic labels, and a restrictive Content Security Policy are retained.

## Key files

| File | Purpose |
|---|---|
| `index.html` | Production portfolio and interactive command deck |
| `status.json` | Coarse, dated public status contract |
| `README.md` | Current public architecture and release summary |
| `CHANGELOG.md` | Public-facing release history |
| `RELEASE_BODY.md` | Current v32 release notes |
| `SECURITY.md` | Vulnerability reporting and repository boundaries |
| `PRIVACY.md` | Public privacy notice |
| `scripts/public_repo_guard.py` | Automated public-repository safety scanner |
| `scripts/check_release_consistency.py` | Cross-file release consistency checker |

## Release flow

1. Reconcile the dated public status export.
2. Keep `index.html`, `status.json`, `README.md`, `CHANGELOG.md`, and `RELEASE_BODY.md` consistent.
3. Run the public-safety and release-consistency checks.
4. Merge the reviewed release branch into `main`.
5. GitHub Pages publishes `https://cashio.us`.

## License

Source-visible portfolio project. **All rights reserved.** No reuse or redistribution rights are granted unless explicitly authorized by the owner.
