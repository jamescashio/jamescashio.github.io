# cashio.us V38 Helios · deploy notes
Doug Cashio, Principal Solutions Consultant at OpenText · September 18, 2026

## What this folder is
A single page site with vendored libraries. No build step. Drop the whole `v38/` folder into `public/` of jamescashio/jamescashio.github.io. Vite copies `public/` verbatim into `dist/`, so the existing Pages workflow publishes it at https://cashio.us/v38/ with no change to the React app, the prerender, or the tests.

## Why the libraries are vendored
The live edge CSP is `script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com`. A CDN script would be blocked silently. Everything loads from `vendor/` under the same origin. Fonts come from fonts.googleapis.com and fonts.gstatic.com, both already allowed by the live style-src and font-src.

Pinned: gsap 3.15.0 (core, ScrollTrigger, SplitText), lenis 1.3.25, three 0.185.1 (module plus core chunk).

## Go live in three steps
1. Branch `release/v38-helios`, copy this folder to `public/v38/`, commit, open the PR. The public repo guard and whitespace checks will run; this folder has no secrets, no absolute paths, no analytics.
2. Merge, wait for Pages, verify https://cashio.us/v38/ in a private window: ignition runs, Bit greets, fold works, hangar swaps aircraft, E.V.E. answers `fleet`.
3. To make V38 the front door, add one line to `public/legacy-route.js` redirecting `/` to `/v38/` (or swap the prerendered index). Do this only after the /v38/ route has been reviewed live. Rollback is deleting the redirect line.

## Slots that still need the owner
- `[DEGREE AND YEAR]` on the Embry-Riddle card in the credentials section.
- Release name (Helios is a placeholder) in the hero status chip and footer.
- The DSH fleet facts (atlas, evidence, E.V.E.) when the harness output is pasted back.
- Higgsfield renders per `Higgsfield-Asset-Pack-V38.md`.
