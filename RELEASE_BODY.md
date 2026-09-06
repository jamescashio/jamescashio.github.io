# V37 — LIGHTFOLD · THE HUMAN RECKONING

Lightfold turns the Cashio.us homepage into an interactive journey through Doug Cashio’s work in AI, security, and human command. The orbital instrument aligns before a visitor-triggered transition; First Flight brings visitors inside the starship, then lets them change a routing decision and see where the same twelve illustrative requests go. Cyan, champagne gold, original orbital artwork, and the owner’s animated Cashio identity carry the design.

The original release name nods to the Butlerian Jihad in Frank Herbert’s _Dune_. Powerful tools. Human judgment in command.

## Release behavior

- Prerendered V37 homepage at `/`, with `/odyssey.html` as a compatible alias.
- Four First Flight chapters with cinematic camera framing, a responsive primary decision control, and exact scenario sharing.
- Detailed ship armor and service bays, a progressive hull reveal, and animated routing bays that preserve each request’s identity.
- Living Circuit logo exploration with six selectable letters, touch and keyboard panning, selectable styles, and an explicit energize action.
- Seven working interactive studies, a responsive orbital operator identity, and a first view delivered directly in the HTML.
- V35 command deck preserved at `/command-deck.html`; old `/#deck=…` bookmarks keep their selected deck.
- Keyboard and touch controls, reduced-motion support, a global motion switch, and offscreen/hidden animation suspension.
- The 3D simulation is local and illustrative. No infrastructure mutation or AI-service request is performed.
- Audio remains optional. Existing Cloudflare policy and deployment settings are preserved.

## Dated public evidence

**Fleet export:** 28 August 2026. **Routing inventory:** 21 August 2026. **Validity window:** through 27 September 2026 in America/Chicago, or until the next owner-verified architecture change.

Both existing `status.json` files retain their V35 evidence identity and bytes. `/site-release.json` independently records website version 37.0.0, visual edition Lightfold, and the First Flight experience. No fleet counts, routing observations, or current infrastructure claims are refreshed by this release.

## Verification and deployment

`npm run verify` checks source, models, the production artifact, legacy and V37 browser behavior, release metadata, and repository safety. The retained `check:v36:runtime` command now validates V37. Protected pull-request checks must pass before merge; GitHub Pages deploys the verified `dist` artifact. Completion requires verification against the public HTTPS site and the authoritative Pages deployment.

Rollback: revert the V37 release merge through a reviewed pull request and redeploy the resulting V36 artifact. The pre-release production commit is `92fbb9e35621587deb95098b8ff9c83d3737cc23`. Confirm `/site-release.json` reports 36.0.0 and verify the homepage plus preserved command-deck bookmarks after rollback.
