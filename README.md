# cashio.us V35 ALL TENS

The public command console for ZeusApollo, Doug Cashio's owner run AI infrastructure. This repository builds and publishes [cashio.us](https://cashio.us).

Release revision **28 August 2026**. Read-only, dated fleet export **28 August 2026**, valid through **27 September 2026** in America/Chicago. Routing inventory remains separately dated **21 August 2026**.

## What the site is

A single page console with nine decks (Snapshot, Grid, Routing, Iron, Lineage, Builds, Operator, E.V.E., Contact) that presents a dated, owner verified picture of a two host Proxmox fleet and the model routing that runs on it. Every published figure comes from `status.json`, the single source of truth, and carries the date it was measured. Figures with no fresh measurement are withheld rather than published stale.

Bit, the deck guide in the corner, and E.V.E. (Evaluation Verification Engine), the browser local console, are part of the identity and stay in every release. Audio is effects only, off by default, and armed only by a deliberate action.

## Locked public snapshot

| Item                    | V35 public state                                   |
| ----------------------- | -------------------------------------------------- |
| Proxmox VE              | 9.2.11                                             |
| Containers              | 18 of 19 at 28 Aug probe · Zeus 12/13 · Apollo 6/6 |
| Hosts                   | 2 online · quorate at the 28 Aug probe             |
| Public capability lanes | 10 · routing inventory 21 Aug                      |
| Private catalog entries | 36 · routing inventory 21 Aug                      |
| Cost                    | Withheld                                           |

The 10 public lanes and the 36 private catalog entries count different things and are never merged.

## Stack

Vite 6, React 19 and Three.js in `src/`, with the viewscreen stage split into typed modules under `src/lib/stage`. Static assets ship as AVIF and WebP plates with JPEG fallbacks, and airframe cues as Opus in WebM with PCM fallbacks. Provenance for every recording lives in `public/sfx/provenance.json`.

## Public safety boundaries

No tracking, analytics, cookies, production API calls, private addresses, ports, credentials, access paths, or live looking counters. E.V.E. is read-only and limited to the dated export. `/lab.html` redirects to `/`; `/command.html` is the explicitly marked May 2026 historical archive; `/grid.html` and `/index-v44.html` carry archive markers for superseded release URLs.

## Supported local commands

```powershell
npm ci
npm run verify
```

`npm run verify` runs the supported lint, formatting, Node source/artifact,
build, runtime-layout, release, public-safety, release-consistency, and
committed-whitespace gates. The reproducible audio tool remains available as
`python scripts/build_audio_cues.py`.

## Publishing

GitHub Pages publishes only the already-verified `dist` artifact through
`.github/workflows/pages.yml`; no branch or Jekyll publisher is supported.
The repository's live Pages source must separately be set to **GitHub Actions**
by an authorized owner before deployment. That action-time repository setting is
manual and is not changed by this code. Custom domain `cashio.us`.

`main` is protected: pull requests only, squash merges only. Publishing is gated on owner approval, PR review, merge, Pages completion, cache purge and live HTTPS verification. Do not redesign.

## Release line

`CHANGELOG.md` records the canonical public releases and `RELEASE_BODY.md` carries the current release notes. Unpublished prototype numbering is intentionally omitted from both.

## Contributors

Doug Cashio, owner and operator. AI pair programmers assist under owner review; every merge is a human decision.
