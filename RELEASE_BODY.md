# V37.5 — CELESTIAL FORGE · THE HUMAN RECKONING

Celestial Forge puts the Cashio signature under the visitor's control. Champagne lettering and electric blue light sit within an orbital field that bends toward the pointer. Drag to turn the artwork, tap to send light, adjust the field strength, or explore six letter details. A new six-second Higgsfield film, The signature awakens, connects the cinematic identity to this interactive composition. The original Lensing world, starship, and seven working studies remain available.

## Release behavior

- `/#signature` opens Celestial Forge, with Balanced, Gold, and Ion light; Orbit and Inspect views; six letter selections; a 0–100 field-strength control; finite ignition; pause; and reset. Pointer, touch, and keyboard controls share the same experience.
- The responsive logo uses the approved metallic artwork and vector animation. `/brand/celestial-signature.gif` provides a separate eight-second animated GIF without adding an initial-page request.
- `/#film=signature` opens The signature awakens on its poster. Play, pause, replay, a scrubbable timeline, and Spark, Orbit, and Radiance frame landmarks keep playback explicit. Sculpt this light enters the interactive signature; Watch the signature awaken returns to cinema. Closing a round trip restores the original launcher.
- All three films remain silent, finite, and suspended when hidden or closed. Film bytes load only after Play or an explicit frame request. Seeking uses a bounded same-origin media copy so it also works on progressive hosts without byte ranges; the copy is released on clip change or close.
- `/#film` still opens Orbital arrival; `/#film=awakening` still opens The gate awakens and its optional Enter this world handoff. `/#lensing` retains the observatory, gate ignition, three lights and views, and optional 24-second journey.
- The prerendered, indexable homepage remains at `/`; `/odyssey.html` remains its noindexed canonical alias. First Flight, routing scenarios, the seven studies, and V35 Command Deck remain available. Existing `/#deck=…` bookmarks preserve their query and selected deck.
- Reading text stays still. Effects pause offscreen and in hidden pages; reduced motion keeps manual visual controls static and immediate. Zoomed artwork stays inside its viewing window. Keyboard, touch, global pause, and opt-in audio remain supported.

## Dated evidence

Fleet export: **28 August 2026**. Routing inventory: **21 August 2026**. The existing validity window remains unchanged. Both `status.json` snapshots retain their original bytes; this design release makes no new claims about current infrastructure. The 3D scenes and request models are illustrative and send nothing to an AI service.

`/site-release.json` records software version **37.5.0**, visual edition **Lensing**, and featured experience **Lensing Observatory**. `/event-horizon-release.json` remains its identical compatibility alias. The page title is **Cashio V37.5 — Celestial Forge | Doug Cashio**.

## Verification and release

The owner approved public release on September 6, 2026. Run the existing lint, format, source/model, artifact, browser, release consistency, whitespace, and public-repository safety gates against the production candidate. Verify the signature, all three films, frame seeking, focus round trips, observatory, reduced motion, phone and tablet layouts, and legacy links. Await responsive-image decoding before comparing static zoomed frames. Merge through the protected GitHub pull-request workflow, wait for Pages, and verify the exact public assets and released receipt on Cashio.us.

Rollback: revert the Celestial Forge release merge through the same reviewed workflow and redeploy. The pre-release production baseline is `d32ebb59bb7805acc7a4ac35a02a75d3e0496359`, reporting **37.4.0 / Lensing**. Domain and infrastructure settings are unchanged.
