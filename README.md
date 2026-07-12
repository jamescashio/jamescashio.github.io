# ZEUSAPOLLO v30 — “The Sleeper Has Awakened”

> *“The line between man and machine is not a wall — it is a bridge.”*

A live interactive portfolio and command-center experience showcasing Doug Cashio’s sovereign AI work through **19 public-facing fleet nodes**, a **7-model routing fabric**, and **46 autonomous jobs**.

The public repository demonstrates architecture, outcomes, and engineering discipline while intentionally withholding production addresses, ports, hostnames, container identifiers, credentials, detailed telemetry, and private deployment procedures.

## Current release

| Item | Current state |
|---|---|
| **Release** | v30 — “The Sleeper Has Awakened” |
| **Fleet** | 19 nodes |
| **Model fabric** | 7 routed model lanes |
| **Automation** | 46 active jobs |
| **Estimated inference burn** | Approximately $0.35/day |
| **Deployment** | GitHub Pages from `main` |
| **Production site** | `https://cashio.us` |

## What changed in v30

- Expanded the autonomous operations layer from 31 to 46 scheduled jobs.
- Advanced the public command deck with the “Sleeper Has Awakened” experience, richer visual depth, interactive topology, and improved section discovery.
- Expanded the Hermes console with `route`, `probe`, and `vetting` demonstrations.
- Updated the vision-and-voice lane and retained seven capability-based routing lanes.
- Added the public-safe `/ai` experience and stronger AI-readiness positioning.
- Preserved the v28 privacy boundary while tightening repository governance, release consistency, and automated hygiene.

See [`CHANGELOG.md`](CHANGELOG.md) for the normalized release record and [`RELEASE_BODY.md`](RELEASE_BODY.md) for the current GitHub Release notes.

## Architecture at a glance

- **Compute fabric** — virtualized workloads, local inference, and workload isolation.
- **AI gateway** — capability- and cost-aware routing with specialized model lanes and fallback paths.
- **Automation plane** — event-driven workflows, 46 scheduled jobs, agents, tools, and verification steps.
- **Security plane** — authentication, least privilege, input validation, logging, and fail-closed behavior.
- **Storage and recovery** — backups, retained artifacts, and separated public/private data paths.
- **Observability** — detailed signals remain private; only coarse portfolio metrics are published.

## AI routing fabric

| Priority | Model lane | Role |
|---:|---|---|
| 1 | Primary | General agent tasks, briefings, and delegation |
| 2 | Coding | Local coding and delegation fallback |
| 3 | Research | Cited deep research |
| 4 | Compression | Summarization and extraction |
| 5 | Vision and voice | Visual understanding and voice workflows |
| 6 | Escalation | Complex reasoning and architecture |
| 7 | Failover | Continuity and emergency routing |

## Prime Directive governance

**Work smarter, not harder:** automate the repetitive controls and reserve human review for judgment.

- Every pull request runs the public-site safety gate.
- Pull requests use a public-release checklist covering PII, secrets, topology, telemetry, accessibility, and release consistency.
- `CODEOWNERS` establishes a clear accountable owner.
- Dependabot maintains GitHub Actions dependencies on a controlled monthly cadence.
- Branch hygiene closes stale automation backlog and removes branches after their pull requests are closed.
- Release notes, the README, `status.json`, and the in-page release panel must agree before a tag is published.

## Public-safety posture

- Content Security Policy is defined in the primary pages.
- Public-facing telemetry is intentionally coarse and PII-scrubbed.
- Public code examples require environment-injected configuration and fail closed when authentication is missing.
- Historical HTML snapshots and detailed security journals are excluded from the active public branch.
- Pull requests scan for private addresses, common secret formats, personal email domains, backup pages, and sensitive telemetry keys.
- Operational deployment scripts, topology, credentials, and incident records belong in a private repository.

Read [`SECURITY.md`](SECURITY.md), [`PRIVACY.md`](PRIVACY.md), the [`Public Site Protection Guide`](docs/PUBLIC_SITE_PROTECTION_GUIDE.md), and [`Repository Settings`](docs/REPOSITORY_SETTINGS.md).

## Key files

| File | Purpose |
|---|---|
| `index.html` | Main portfolio and command-deck experience |
| `ai/index.html` | Public AI-readiness experience |
| `command.html` | Alternate command-center view |
| `lab.html` | Public-safe lab architecture view |
| `status.json` | Coarse public telemetry consumed by the site |
| `SECURITY.md` | Vulnerability reporting and repository scope |
| `PRIVACY.md` | Public privacy notice |
| `scripts/public_repo_guard.py` | Automated public-repository safety scanner |
| `.github/workflows/public-safety.yml` | Pull-request and `main` safety gate |
| `.github/workflows/branch-hygiene.yml` | Stale pull-request and branch cleanup |
| `RELEASE_BODY.md` | Curated body used by the release workflow |
| `CHANGELOG.md` | Normalized version history |

## Release flow

1. Update `CHANGELOG.md`, `RELEASE_BODY.md`, `status.json`, and the release line in this README.
2. Confirm the site and public telemetry agree on approved coarse metrics.
3. Run `python scripts/public_repo_guard.py`.
4. Merge through a reviewed pull request after required checks pass.
5. Publish the current release tag, such as `v30`.
6. GitHub Actions creates or updates the GitHub Release from `RELEASE_BODY.md`.

## Contributors

- **jamescashio** — architect and operator
- **Claude** — AI pair programmer
- **google-labs-jules[bot]** — security auditor and automated PR contributor

## License

Source-visible portfolio project. **All rights reserved.** No reuse or redistribution rights are granted unless explicitly authorized by the owner.
