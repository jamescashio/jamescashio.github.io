# Changelog

All notable public-facing changes to the ZeusApollo portfolio and command deck are recorded here.

The project’s earlier development history remains available in Git. **v28 is the first release normalized into this changelog format.**

## [v30] — 2026-07-12

### Added

- “The Sleeper Has Awakened” command-deck experience with richer depth, motion, and interactive presentation.
- Expanded Hermes console demonstrations for `route`, `probe`, and `vetting` workflows.
- Public AI-readiness experience under `/ai`.
- Repository governance controls: `CODEOWNERS`, a pull-request safety checklist, Dependabot maintenance, and automated branch hygiene.
- Documented repository settings and recommended branch-protection policy.

### Changed

- Increased the public automation baseline from 31 to 46 autonomous jobs.
- Updated the vision-and-voice lane while preserving seven capability-based routing lanes.
- Aligned `README.md`, `RELEASE_BODY.md`, `status.json`, and release automation to v30.
- Replaced the one-off v28 publisher with the current v30 publisher while preserving the generic tag-triggered release workflow.
- Reduced safety-workflow checkout depth and added concurrency controls to avoid duplicate work.

### Security and privacy

- Preserved coarse, privacy-safe public telemetry with detailed state retained privately.
- Kept public bridge examples topology-neutral, environment-configured, and fail closed.
- Added automated cleanup for stale pull requests and closed-PR branches.
- Added a review gate for PII, secrets, private topology, operational telemetry, and historical backup artifacts.

### Operational notes

- GitHub Pages continues to deploy from `main`.
- v30 is the current public release baseline: **19 nodes**, **7 model lanes**, **46 autonomous jobs**, and approximately **$0.35/day** estimated inference burn.
- Repository-level branch protection and About metadata require repository-admin settings and are documented in `docs/REPOSITORY_SETTINGS.md`.

## [v28] — 2026-07-02

### Added

- Downloadable fleet card generated from current telemetry.
- Verified QR code linking to `https://cashio.us`.
- `/` command palette and improved command-deck wayfinding.
- Seven-model routing view with dedicated primary, coding, research, compression, vision/TTS, escalation, and failover lanes.
- Live topology and fleet values sourced from `status.json`.
- Normalized release documentation through `README.md`, `RELEASE_BODY.md`, and this changelog.

### Changed

- Standardized public fleet reporting at 19 nodes, 7 models, and 31 autonomous cron jobs.
- Standardized the estimated inference burn at approximately $0.35/day.
- Updated the primary routing narrative to DeepSeek V4-Pro through the Atlas gateway.
- Replaced current-state AdGuard references with Technitium DNS.
- Reworked the public release-notes panel and architecture copy for consistency.
- Updated metadata, social-card copy, structured data, and navigation language.

### Fixed

- Corrected the LinkedIn vanity URL.
- Removed conflicting node, model, pricing, and automation counts across the primary page.
- Continued remediation of unsafe dynamic HTML rendering paths associated with DOM-XSS findings.
- Corrected telemetry naming so the current DNS platform is represented consistently.

### Security

- Preserved a restrictive Content Security Policy in the primary page.
- Kept public telemetry PII-scrubbed.
- Continued automated security review through Sentinel/Jules pull requests.

### Operational notes

- GitHub Pages continues to deploy from `main`.
- Version tags matching `v*` trigger `.github/workflows/release.yml`.
- The release workflow uses `RELEASE_BODY.md` as the curated GitHub Release description.

## Historical development

Versions before v28 were documented through commit history, in-page release notes, and individual release files rather than a single normalized changelog. Those records remain in the repository history and should not be rewritten retroactively without validating their original dates and scope.
