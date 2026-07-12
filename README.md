# ZEUSAPOLLO v28 — “Kwisatz Haderach”

> *“The line between man and machine is not a wall — it is a bridge.”*

A live interactive portfolio and command-center experience showcasing Doug Cashio’s sovereign AI infrastructure: **19 nodes**, a **7-model routing fabric**, and **31 autonomous jobs** operating across two Proxmox hosts, an Apple Silicon inference node, and supporting edge systems.

## Current release

| Item | Current state |
|---|---|
| **Release** | v28 — “Kwisatz Haderach” |
| **Fleet** | 19 nodes |
| **Model fabric** | 7 routed models |
| **Automation** | 31 active cron jobs |
| **Estimated inference burn** | Approximately $0.35/day |
| **Deployment** | GitHub Pages from `main` |
| **Production site** | `https://cashio.us` |

## What changed in v28

- Added a scannable fleet-card QR code and downloadable telemetry card.
- Added the `/` command palette and expanded interactive command-deck navigation.
- Expanded the AI fabric to seven models with Atlas-routed orchestration.
- Added live topology and status-driven metrics sourced from `status.json`.
- Replaced AdGuard references with Technitium DNS across the current fleet narrative.
- Completed a consistency pass across metadata, cost claims, model counts, release notes, and UI copy.
- Continued DOM-XSS hardening by replacing unsafe dynamic HTML construction in the primary experience.

See [`CHANGELOG.md`](CHANGELOG.md) for the normalized release record and [`RELEASE_BODY.md`](RELEASE_BODY.md) for the current GitHub Release notes.

## Architecture at a glance

- **Zeus** — infrastructure, security, orchestration, and control-plane services.
- **Apollo** — AI, media, backup, and supporting workloads.
- **Atlas** — Apple Silicon local inference and sovereign LiteLLM routing.
- **Hermes / Omnius / n8n** — agents, tools, workflows, and autonomous operations.
- **Technitium / PBS / Genesis / Athena** — DNS, backup, storage, and edge services.

## AI routing fabric

| Priority | Model | Role |
|---:|---|---|
| 1 | DeepSeek V4-Pro | Primary agent tasks, briefings, and delegation |
| 2 | GLM 5.2 | Local coding and delegation fallback |
| 3 | Perplexity Sonar Pro | Cited deep research |
| 4 | Gemini 2.5 Flash | Compression and web extraction |
| 5 | Grok 4.3 | Vision and Eve voice/TTS workflows |
| 6 | Claude Opus 4.8 | Escalation for complex reasoning and architecture |
| 7 | Qwen 3.7 Plus | Emergency failover |

## Security posture

- Content Security Policy is defined in the primary page.
- Public-facing telemetry is intentionally limited and PII-scrubbed.
- Dynamic UI output in the primary experience avoids direct `innerHTML` assignment.
- Automated security reviews and corrective pull requests are part of the repository workflow.
- Internal bridge and orchestration services should remain private, authenticated, and network-restricted.

## Key files

| File | Purpose |
|---|---|
| `index.html` | Main portfolio and command-deck experience |
| `command.html` | Alternate command-center view |
| `lab.html` | Lab-focused experience |
| `status.json` | Public fleet telemetry consumed by the site |
| `RELEASE_BODY.md` | Curated body used by the tag-triggered release workflow |
| `CHANGELOG.md` | Normalized version history |
| `scripts/create_release.sh` | Local release/tag helper |
| `.github/workflows/release.yml` | GitHub Release automation for `v*` tags |

## Release flow

1. Update `CHANGELOG.md`, `RELEASE_BODY.md`, and the release line in this README.
2. Confirm the site and telemetry agree on node, model, automation, and cost figures.
3. Commit the release-note changes to `main`.
4. Create and push a version tag such as `v28`.
5. GitHub Actions publishes the release using `RELEASE_BODY.md`.

## Contributors

- **jamescashio** — architect and operator
- **Claude** — AI pair programmer
- **google-labs-jules[bot]** — security auditor and automated PR contributor

## License

Source-visible portfolio project. **All rights reserved.** No reuse or redistribution rights are granted unless explicitly authorized by the owner.
