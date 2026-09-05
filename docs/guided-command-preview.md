# Guided command experience — preview

This branch is a reviewable local preview. Publication has not been authorized.

## Experience

- A prominent thirty-second flight introduces the existing system, routing, builds, and E.V.E. journey.
- A custom three-waypoint flight map provides direct navigation from the opening screen.
- Deep navy, spice gold, cyan instrumentation, and an iris reading-mode accent refresh the existing command-deck identity.
- Bit supplies brief contextual guidance in the page flow. The mobile flight control, deck rail, and Bit occupy separate dock cells.
- The seven published builds gain an outcome, a request/work/payoff explanation, and an illustrative example.
- HERMES offers three deterministic, browser-local routing demonstrations. They do not execute model calls or represent production runs.
- Every build has a canonical share link and a downloadable 1200×630 PNG proof card. Clipboard failure retains a selectable link. Native modal focus and Escape behavior remain available.

## Implementation and evidence

The existing nine decks, aircraft, canonical anchors, E.V.E. data, dated fleet export, routing inventory, and opt-in audio remain intact. The full three-dimensional stage is still deferred. No dependency was added.

`experience-shell.css` is reused by the live React tree and injected into the prerendered opening shell during the build. This keeps first paint aligned with the interactive layout without loading the full application stylesheet before activation. The rest of the new styling is in `experience.css`.

Mobile rail navigation scrolls only its own horizontal strip. Non-build hash navigation retains the selected build, preventing a change in article height from moving the destination during navigation.

All new motion respects reduced motion. Route timers stop when the build deck is inactive, and the flight-map tracer pauses away from Snapshot.

## Review sequence

1. Open Snapshot at desktop and phone widths. Start and stop the flight; then run it to completion.
2. Select each waypoint, use the nine-deck navigator, and open E.V.E. from Snapshot.
3. On Builds, run each HERMES request and interrupt a run by selecting another example.
4. Select each build, expand its explanation, and open its proof card. Save the image, copy the link, and dismiss with Escape.
5. Use Executive view, the existing still and cinema controls, and the E.V.E. `sitrep` command.
6. Review with reduced motion enabled and audio left off.

## Before any public release

Review and approve the exact preview first. Re-run the repository release gates against the approved commit and retain the current production revision for rollback.

The initial live audit found a Cloudflare Web Analytics injection that the site's Content Security Policy blocked. The local source does not add that integration. Reconcile the hosting setting with the privacy notice before publication; do not weaken the Content Security Policy to allow an unreviewed injection. No Cloudflare setting has been changed for this preview.

The existing fleet and routing dates remain historical facts. A visual redesign is not a new infrastructure measurement.
