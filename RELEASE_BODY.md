# V36 — THE HUMAN RECKONING

The approved Sovereign Starship experience is now the main Cashio.us homepage. Explore a real 3D ship, compare illustrative local, hybrid, and cloud request routing, and try seven interactive studies. Champagne gold, midnight blue, original orbital artwork, and the animated Cashio identity carry the new design.

The original release name nods to the Butlerian Jihad in Frank Herbert’s _Dune_. Powerful tools. Human judgment in command.

## Release behavior

- Prerendered V36 homepage at `/`, with `/odyssey.html` as a compatible alias.
- V35 command deck preserved at `/command-deck.html`; old `/#deck=…` bookmarks keep their selected deck.
- Keyboard and touch controls, reduced-motion support, a global motion switch, and offscreen/hidden animation suspension.
- The 3D simulation is local and illustrative. No infrastructure mutation or AI-service request is performed.
- Audio remains optional. Existing Cloudflare policy and deployment settings are preserved.

## Dated public evidence

**Fleet export:** 28 August 2026. **Routing inventory:** 21 August 2026. **Validity window:** through 27 September 2026 in America/Chicago, or until the next owner-verified architecture change.

Both existing `status.json` files retain their V35 evidence identity and bytes. The new `/site-release.json` independently records website version 36.0.0. No fleet counts, routing observations, or current infrastructure claims are refreshed by this release.

## Verification and deployment

`npm run verify` checks source, models, the production artifact, legacy and V36 browser behavior, release metadata, and repository safety. Protected pull-request checks must pass before merge; GitHub Pages deploys the verified `dist` artifact. Completion is confirmed against the public HTTPS site and the authoritative Pages deployment.

Rollback: revert the V36 release merge through a reviewed pull request and redeploy the resulting known-good artifact. The pre-release production commit is recorded in the release evidence.
