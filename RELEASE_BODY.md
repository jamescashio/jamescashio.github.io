## 🚀 v28 — “Kwisatz Haderach”

**Release date:** July 2, 2026  
**Status:** Maximum Warp

v28 is the full consistency-and-polish release for the ZeusApollo command deck. It aligns the site, telemetry, release notes, and public architecture story around the current fleet: **19 nodes**, **7 routed models**, **31 autonomous jobs**, and an estimated **$0.35/day** inference burn.

### ✨ Experience and presentation

- Added a downloadable **fleet card** with live telemetry values.
- Replaced the decorative barcode with a verified, scannable QR code for `cashio.us`.
- Added a `/` command palette for fast command-deck navigation.
- Improved breadcrumbing, above-the-fold wayfinding, console discovery, and interactive trace replay.
- Reworked release notes and fleet copy so all visible counts and claims agree.

### 🧠 Sovereign AI fabric

- Expanded the model fabric from five to seven routed models.
- Added **GLM 5.2** as the local coding and delegation fallback.
- Added **Claude Opus 4.8** as the escalation lane through the Atlas proxy.
- Standardized DeepSeek V4-Pro as the Atlas-routed primary path.
- Preserved specialized lanes for cited research, compression, vision/TTS, and emergency failover.

### 🛰️ Fleet and operations

- Standardized current-state reporting at **19 nodes** and **31 active cron jobs**.
- Migrated current DNS references from AdGuard to **Technitium DNS**.
- Added live topology and status-driven values sourced from `status.json`.
- Preserved GitHub Pages deployment from `main` with no application build step.

### 🛡️ Security and quality

- Continued DOM-XSS remediation across interactive output paths.
- Kept the primary page’s public telemetry PII-scrubbed.
- Maintained Content Security Policy controls and defensive browser headers where applicable.
- Corrected the LinkedIn vanity URL and completed a metadata/SEO consistency pass.

### 📊 Release baseline

| Metric | v28 baseline |
|---|---:|
| Fleet nodes | 19 |
| Routed models | 7 |
| Autonomous cron jobs | 31 |
| Estimated daily inference burn | ~$0.35 |
| Cost reduction vs. launch baseline | 11.4× |
| Cost reduction vs. Opus-primary baseline | 7.2× |

### 📁 Primary files

- `index.html` — production portfolio and command deck
- `status.json` — public telemetry source
- `README.md` — current architecture and release overview
- `CHANGELOG.md` — normalized version history
- `.github/workflows/release.yml` — tag-triggered GitHub Release workflow

---

*Built and operated by Doug Cashio with AI-assisted engineering and automated security review.*
