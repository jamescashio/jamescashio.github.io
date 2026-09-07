# V37.9 — Sanctuary: The inner light

The sanctuary previously offered a quiet eight-second approach. The inner light expands it into a fifteen-second film: an approach between the monoliths, a close orbit of the awakening amber core, and a wide reveal of the illuminated chamber. Three thumbnail chapters use actual frames and seek to paused moments at 0, 5 and 10.125 seconds.

The silent 1080p film is optimized to 5.24 MB and remains optional. Desktop controls fit below the picture, mobile chapter tiles keep clear touch targets, and the other four films, Vector opening, animated identity, interactive ship, world workshop and legacy routes remain available. Production-tool credits are removed from visitor copy and public documentation.

Fix a keyboard timeline defect where a 60 ms seek tolerance swallowed every 10 ms arrow-key step. The 1 ms tolerance preserves native seeking, paused chapter selection, bounded no-range recovery, cancellation and hidden-tab pause. A persistent browser regression now exercises actual Home, End and repeated arrow-key input.

## Verification

- 394 automated tests, 15 required V37 runtime groups, legacy layout verification, lint, formatting, artifact and public-safety gates.
- 10 source-browser groups covering desktop/mobile layout, real decoded chapter frames, keyboard input, accessibility, reduced motion and player lifecycle.
- Built-asset hashes and canonical/legacy route checks; production-policy and no-range acceptance checks before merge, followed by public playback and asset verification after deployment.

Rollback: `f4c0707089ed5e31666dcb2b2774d0679d41f5d0`.
