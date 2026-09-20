# V38.2 Helios release

The 09-20-2026 refinement deepens three existing instruments and improves typography without changing their models. The atlas has faceted node emblems, responsive route geometry and a restartable eight-second trace. The request flow has a dimensional ship, command core, external relay and an always-visible twelve-request manifest. The principles instrument has a metallic 3D armillary, capped at 30 fps, and a complete authored SVG fallback. Keyboard rotation, reset and principle selection work in either rendering mode. Existing self-hosted fonts gain more open headlines, larger small labels and a clearer reading rhythm.

The three scenes stop when offscreen or the document is hidden, honor manual and system motion settings, and preserve a static explanation. The engine shares the existing lazy Three.js dependency. Its lighting is procedural, and the graphic pass adds no external image or font request. Context loss reveals the vector fallback. Static request dots and manifest colors match the same twelve-request model. None of the graphics imply live routing or measured speed.

The owner requested this continuation through Gloves Off Website and added typography to the same scope. Publication follows the ongoing, previously authorized release workflow. The V38.1 signature, flight and studies below are preserved.

The approved refinement makes the existing orbital world fully operable: the first invitation opens the flight inside V38, seven studies expose their promised controls, shared scenarios retain exact inputs, and mobile navigation and motion-off content remain available. Original artwork, Unbounded and Instrument Sans typography, Bit, quiet startup and evidence dates are preserved.

The owner approved publication on 09-19-2026 and requested a thorough polish pass before release. The House Cashio signature retains the original artwork, uses a same-origin asset path with a JPEG recovery path, resets repeated ignition cleanly, and links to the preserved Celestial Forge. Browser verification includes image decoding and the actual studio journey.

## Identity and release gates

- Public entry: `/v38/`, receipt `/v38/site-release.json`, experience `38.2.0`, release ID `helios-38.2.0-20260920`.
- Plain-root navigation retains the established V38 redirect. Existing fragments and query links retain V37.17. The shared package and compatibility receipts keep that version, with a matching `frontDoor` reference to V38.2.
- Evidence remains the inherited September 18, 2026 record for V38 and the corresponding earlier observations for legacy views. No UI test verifies infrastructure or routing health.
- Rollback baseline: `24234b0fe2cd54910f1fc491c09ab7b2c2efa4f6`. Roll back by reverting this release through the checked pull-request and Pages path, then verify the resulting public artifact.

Build and run lint, formatting, model and artifact tests, Python release tests, public-data and consistency checks, legacy browser checks and `npm run test:helios`. The Helios runner starts and closes a loopback server unless `HELIOS_URL` supplies another target. `CHROME_PATH` selects the workflow's pinned browser. Pages and Public Site Safety run these interactions before accepting a deployment artifact.

The polish matrix covers 1440, 768, 390 and 320 pixels; all studies; navigation and keyboard focus; shared scenarios; saved cards; system reduced motion; WebGL fallback; the lower-page artwork; atlas, principles, hangar, evidence console and contact; and the signature's image, recovery, ignition and studio link. Automated accessibility scans supplement visual review. Physical devices and a complete screen-reader review are separate from these browser checks.

## Workflow review

The preflight's mutable-action references are replaced with exact commits resolved from their existing version tags. Checkouts do not persist credentials. The privileged tag-release job no longer restores the dependency cache. Existing action versions, permissions, release destinations, review requirements and scheduled behavior are preserved. Secret scanning, actionlint and the offline workflow audit are rerun on the final tracked content.

The offline workflow audit retains two reviewed findings without suppressing either rule: its low-confidence cache warning assumes automatic caching in newer setup-node versions, but the pinned v4 [implementation](https://github.com/actions/setup-node/blob/49933ea5288caeca8642d1e84afbd3f7d6820020/src/main.ts) restores a cache only when the `cache` input is nonempty, and this job sets it to an empty string. The informational suggestion to replace the pinned release action with the runner's GitHub CLI is deferred; its existing publication behavior is preserved.

## Publication verification

Merge the reviewed pull request with its expected head SHA after checks and review threads are resolved. Wait for the Pages build and deployment to succeed. Verify the public receipt, HTML indexing, absence of preview markers, and the delivered asset hashes against that build. Exercise the live desktop and mobile journeys, including the House Cashio signature, and take fresh public performance measurements. The local preview score is not a production performance claim.

Keep the final merge commit, workflow URL and delivered-byte evidence in the release receipt outside the public source; do not infer deployment completion from a local build or from the release metadata alone.
