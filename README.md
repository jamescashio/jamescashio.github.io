# ZEUSAPOLLO v31 — “The Grid”

cashio.us is Doug Cashio’s interactive sovereign AI portfolio: personally owned infrastructure, quality-first model routing, cybersecurity, auditable automation, and human command.

The public site shows sanitized proof and architectural roles while withholding addresses, ports, credentials, customer information, private access paths, and detailed operational telemetry.

## Current release

| Item | Current public state |
|---|---|
| **Release** | v31 — “The Grid” |
| **Status export** | Verified 08-10-2026; expires 09-09-2026 |
| **Verification method** | Owner-run live check over cluster SSH by E.V.E. (Evaluation Verification Engine) |
| **Hosts** | 2 core homelab hosts, plus Athena at the edge |
| **Gateway / local inference host** | Atlas, standalone from the Proxmox quorum and 19-container total |
| **Documented roles** | 19 public-safe service roles |
| **Verified running** | 19 of 19 containers at the 08-10-2026 live check |
| **Cluster state** | Quorate |
| **Maintenance** | 0 containers stopped at verification time |
| **Public capability lanes** | 10 |
| **Private model catalog entries** | 36 |
| **Deployment** | GitHub Pages from `main` |
| **Production site** | `https://cashio.us` |

Public capability lanes and private model catalog entries count different objects and are never merged or published as one figure.

Athena is separately owner-confirmed as an active physical Home Assistant edge node and cluster quorum device, and is not included in the 19-container count. Atlas is a standalone LiteLLM gateway and local-inference host, outside the Proxmox quorum and the container total. The export remains valid for 30 days or until the next architecture change. The site never converts a current page-view date into a claim of live telemetry.

## Withheld figures

A figure with no fresh measurement is omitted entirely rather than published stale. The following are withheld from every public surface until they are re-measured and re-dated:

- AI operating cost per day and per month
- Automation job counts
- DNS query sample figures
- Backup recovery telemetry
- Security update counts

`scripts/check_release_consistency.py` enforces this: the retired-figure guard fails the build if any withdrawn figure reappears on a published surface.

## Operational services (08-10-2026)

| Service | State |
|---|---|
| Atlas LiteLLM gateway | Operational |
| Technitium DNS · primary + secondary | Operational |
| Wazuh security monitoring | Operational |
| Prometheus monitoring | Operational |
| n8n automation | Operational |
| PBS backup service | Operational |
| Media services | Operational |

## Model routing fabric

| Lane | Configured model |
|---|---|
| 00 — free classify | Kimi K3 |
| 01 — workhorse | DeepSeek V4 Flash |
| 02 — exception | DeepSeek V4 Pro |
| 03A — multimodal | Gemini 3.6 Flash |
| 03B — adversarial | Grok 4.5 |
| 04A — synthesis | Sol 5.6 Luna |
| 04B — research | Sonar Pro |
| 05 — adjudication | GPT-5.6 Sol |
| Local fallback | Gemma 4 26B |
| Gateway fabric | Atlas LiteLLM, OpenRouter, ZenMux |

These are the ten configured public capability lanes, not live-traffic claims and not a universal model ranking. The private model catalog behind the gateway holds 36 entries and is not published.

## Public-safety posture

- No private network addresses, ports, credentials, customer data, employer-confidential material, or access procedures are published.
- Service states are date bounded and automatically become historical after expiration.
- The page performs no live infrastructure calls; interactive demonstrations remain browser local.
- Public contact information is limited to the cashio.us domain and linked professional profiles.
- Reduced-motion support, keyboard navigation, semantic labels, and a restrictive Content Security Policy are retained.
- All third-party runtime code is self-hosted. The deck's WebGL viewscreen loads three.js from `assets/js/vendor/three/`, so the CSP needs no CDN origin.

## Key files

| File | Purpose |
|---|---|
| `index.html` | Production portfolio — the V31 deck and Dyson-swarm viewscreen |
| `assets/js/deck-v31.js` | Deck logic, published figures, and the E.V.E. console |
| `assets/js/dyson-stage.js` | `<dyson-stage>` WebGL viewscreen web component |
| `assets/js/zasfx.js` | Synthesized deck audio; effects only, no ambient bed, muted until armed |
| `assets/js/bit.js` | Bit, the deck-guide companion |
| `assets/css/za-ds.css` | ZeusApollo design system (tokens, base, components) |
| `grid.html` | Archived V31 stage one — the 1982 grid front page |
| `index-v44.html` | Archived v44 “Aurora” deck |
| `command.html` | Archived v21.2a command center (banner-marked historical) |
| `lab.html` | Public architecture overview |
| `status.json` | Coarse, dated public status contract |
| `README.md` | Current public architecture and release summary |
| `CHANGELOG.md` | Public-facing release history |
| `RELEASE_BODY.md` | Current v31 release notes |
| `SECURITY.md` | Vulnerability reporting and repository boundaries |
| `PRIVACY.md` | Public privacy notice |
| `scripts/public_repo_guard.py` | Automated public-repository safety scanner |
| `scripts/check_release_consistency.py` | Cross-file release consistency and retired-figure checker |

## Release flow

1. Reconcile the dated public status export.
2. Keep `index.html`, `status.json`, `README.md`, `CHANGELOG.md`, and `RELEASE_BODY.md` consistent.
3. Run the public-safety and release-consistency checks.
4. Merge the reviewed release branch into `main`.
5. GitHub Pages publishes `https://cashio.us`; purge the Cloudflare cache afterward.

## License

Source-visible portfolio project. **All rights reserved.** No reuse or redistribution rights are granted unless explicitly authorized by the owner.
