# v20 LCARS Command Refit — Review Notes

This branch is intentionally review-only. It does **not** replace `index.html` or `lab.html` yet.

## What changed

- Added `v20-lcars-command-refit.html` as a stable preview page.
- Kept the DS9 / Defiant LCARS command-bridge aesthetic.
- Removed fragile audio behavior from the preview: no hum, no Web Audio, no speech synthesis.
- Preserved the portfolio story: professional summary, career arc, competencies, credentials, testimonials, speaking, and lab.
- Rebuilt the lab as a structured command-center showcase instead of a plain card stack.
- Added the Cashio Design Doctrine exhibit: Rutan × Johnson proof cards and closing doctrine statement.

## Recommended next step

Review the preview page first. If approved, fold the layout and lab section back into `index.html` and `lab.html` in a follow-up commit.

## Design intent

The lab should read as proof-of-work behind the consultant:

- AI orchestration fabric
- Local-first security boundary
- Observability mesh
- Knowledge layer
- Automation plane
- Customer translation
- Public-safe routing matrix

## Safety / public-facing guardrails

The preview avoids:

- Private IPs or endpoints
- Secrets or runbooks
- Exact operational topology details
- Browser audio / background hum
