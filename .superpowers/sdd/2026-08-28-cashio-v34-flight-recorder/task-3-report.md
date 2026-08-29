# Task 3 — Faster semantic motion and inactive-loop discipline

## Delivered

- Added the V34 motion contract: deck copy is 380 ms, article acquisition is 560 ms, and stage warp decays in 680 ms.
- Tightened deck/article transition styling, retaining a single semantic entrance treatment and removing blur from article acquisition.
- Added `data-active-deck` ownership to the command scroller. Inactive ticker, packet, heartbeat, flow, shimmer, and hub-glow animation is paused; Builds' canvas also stops its frame loop unless Builds is both active and visible.
- Bit draws a complete static state when its console-owning deck is active rather than retaining a requestAnimationFrame loop.
- Preserved intentional stage loading, 30 fps throttling, hidden-tab deferral, reduced-motion rendering, 30-second flight timing, history/focus, HUD safe zones, and audio-off default.

## Changed files

- `tests/animation-timing.test.mjs`
- `tests/a11y-performance.test.mjs`
- `tests/flight-experience.test.mjs`
- `src/lib/animation-timing.ts`
- `src/components/command-deck.tsx`
- `src/components/build-envelope.tsx`
- `src/components/bit-mascot.tsx`
- `src/lib/viewscreen-stage.js`
- `src/styles.css`

## Test-first evidence

### RED

Command:

```text
npm run test:node -- --test-name-pattern "semantic motion completes|inactive deck work stands down|leaving Builds stands down|guided flight uses"
```

Expected failures observed before production edits:

- `semantic motion completes within the approved readable bounds`: `motionDurationMs` was `undefined`.
- `inactive deck work stands down without rewriting the selected article`: `deckAnimationState` was `undefined`.
- `leaving Builds stands down its deck-owned motion without changing the selected article`: `data-active-deck` was absent.
- `flight-experience.test.mjs` failed to import the missing `motionDurationMs` export.

### GREEN

The same focused command passed all 124 Node tests after implementation, including the four new motion checks.

## Final verification

- `npm run test:node` — PASS, 124/124.
- `npm run lint` — PASS.
- `npm run format:check` — PASS.
- `npm run build` — PASS. Vite retained its existing large deferred viewscreen chunk warning (632.43 kB minified / 164.67 kB gzip); no dependency or chunking change was made in this scoped task.
- `npm run test:release` — PASS, 50 tests.
- `python scripts/public_repo_guard.py` — PASS.
- `python scripts/check_release_consistency.py` — PASS.
- `python scripts/check_committed_whitespace.py` — PASS.
- `git diff --check` — PASS.

## Rendered browser QA

Used the in-app browser against the local Vite preview.

- At 1440×900, Snapshot and Builds navigation landed with the target heading in the first viewport; Builds Article 7 selected successfully.
- At 1280×720, Builds and Contact landed with their headings in the first viewport. Builds Article 7 remained selected after moving to Contact, and inactive Snapshot ticker animation computed as `paused`.
- At 1280×720, E.V.E.'s command input ended at y=698.45 within the 720 px viewport.
- No browser console `error` entries were reported.
- The in-app browser exposes no reduced-motion emulation capability. Reduced-motion complete-state behavior remains covered by the existing automated reduced-motion rendering test, which passed.

## Self-review and concerns

- Scope is limited to the nine requested source/test files plus this report. `.npm-cache/` remains untracked and unstaged.
- No route, dependency, public fact, particle system, or always-on audio behavior changed.
- Existing Python release-marker checks still search for prior V33 motion snippets. Compatibility notes preserve those historical markers while the executable V34 timing contract is the source of truth.
- No publish, push, merge, tag, or external release action was performed.

## Review correction — focused follow-up

### Delivered

- Replaced the incomplete inactive-deck selector with direct descendant and separately scoped `*::before` / `*::after` selectors for every deck. This pauses all deck-owned CSS animation work, including hub glow and plate-scan pseudo-elements.
- Made deck copy, article acquisition, and warp-flash CSS consume the executable `motionDurationMs` values through root custom properties. The stage already consumes the same V34 warp contract; the dead V33 compatibility comments were removed.
- Added a fail-closed release consistency check for the executable V34 motion contract, inactive-deck pseudo-element coverage, and obsolete V33 markers; extended the Python release test to prove a substituted dead warp marker is rejected.
- Added owned cinematic timer handles, a pulse generation guard, keyed warp-flash remounting, and unmount cleanup. Earlier rapid-navigation callbacks cannot clear the latest flash or cinematic state.
- Tightened Builds canvas scheduling so inactive, hidden, or reduced-motion states draw a static frame without retaining or reacquiring `requestAnimationFrame` work.

### Changed files

- `scripts/check_release_consistency.py`
- `src/components/build-envelope.tsx`
- `src/components/command-deck.tsx`
- `src/lib/viewscreen-stage.js`
- `src/styles.css`
- `tests/a11y-performance.test.mjs`
- `tests/test_v32_release.py`

### Test-first evidence

#### RED

Focused Node and Python commands failed before the correction:

```text
node --import tsx --test tests/a11y-performance.test.mjs --test-name-pattern "leaving Builds|rapid deck navigation"
python -m unittest tests.test_v32_release.V34ReleaseContractTests.test_every_airframe_change_kicks_the_bounded_v34_warp_fov_and_bloom tests.test_v32_release.V34ReleaseContractTests.test_scan_band_rise_and_route_shimmer_contract
```

- Inactive animation coverage failed because `.za-plot-scan` was not present in the rendered test surface, then the correctly targeted current-deck hail scan showed why computed inactive-state assertions must target inactive owners.
- Rapid navigation failed because the flash DOM node was reused, so its CSS animation could not restart.
- Python failed because `dt * 1.05` survived in the V33 compatibility comment and CSS still contained the 900 ms marker comment.
- The first runtime canvas test also exposed that it needed to synchronize the component's mutation observer after the hash-driven deck state transition; after correcting the harness to drive that real observer boundary, it verified pending rAF ownership and cleanup.

#### GREEN

```text
node --import tsx --test tests/a11y-performance.test.mjs --test-name-pattern "leaving Builds|rapid deck navigation|Builds canvas owns"
```

PASS: 53/53 Node tests. The three added runtime checks prove computed inactive state for deck animation owners, latest-pulse survival through a stale callback plus unmount cleanup, and Builds canvas observer/visibility/rAF ownership without selection mutation.

```text
python -m unittest tests.test_v32_release.V34ReleaseContractTests.test_motion_guard_rejects_a_dead_v33_warp_marker tests.test_v32_release.V34ReleaseContractTests.test_every_airframe_change_kicks_the_bounded_v34_warp_fov_and_bloom tests.test_v32_release.V34ReleaseContractTests.test_scan_band_rise_and_route_shimmer_contract
```

PASS: 3/3.

`python scripts/check_release_consistency.py` — PASS.

### Full verification

- `npm run test:node` — PASS, 126/126.
- `npm run lint` — PASS.
- `npm run format:check` — PASS.
- `npm run build` — PASS; existing deferred viewscreen chunk warning remains 632.43 kB minified / 164.67 kB gzip.
- `python -m unittest tests.test_v32_release tests.test_public_repo_guard tests.test_committed_whitespace` — PASS.
- `python scripts/check_release_consistency.py` — PASS.
- `python scripts/public_repo_guard.py` — PASS.
- `python scripts/check_committed_whitespace.py` — PASS.
- `git diff --check` — PASS.

### Rendered-browser evidence and blocker

The local Vite server started successfully at `http://127.0.0.1:5173/`, but the required in-app browser controller returned `Browser is not available: iab`. No standalone browser or Playwright substitute was used. Therefore Snapshot/Builds pseudo-element computed styles, rapid navigation continuity, Article 7, E.V.E., and console checks could not be re-run in this correction environment. Existing automated Article 7, E.V.E., reduced-motion, and console-adjacent runtime coverage passed; full rendered browser recheck remains a controller follow-up.

### Correction self-review

- The obsolete marker comments are removed; the V34 guard now validates executable constants, CSS variable wiring, <=700 ms stage warp, and each inactive deck's element/pseudo-element pause coverage.
- Reduced-motion runtime browser emulation remains unavailable, as explicitly deferred to Task 4. Automated complete-state coverage remains green.
- `.npm-cache/` remains untracked and unstaged. No dated copy, identity, dependency, route, particle system, or audio-default behavior changed.
- Focused correction commit: `c2c66675e2f894ea1b649260057c103215eda423` (`fix: harden V34 motion ownership`).

## Review correction round 2 — cinematic timer probe

### Delivered

- Corrected the non-user-visible `data-cine` test probe to reflect the actual Zustand `cine` letterbox state rather than the unrelated chapter-overlay state.
- Extended the rapid-navigation regression to retain and invoke the cleared first-generation 1100 ms callback, prove it cannot clear the newer letterbox, then invoke the live latest callback and prove the latest letterbox clears.
- Preserved the existing keyed warp restart, stale 680 ms warp callback, and unmount cleanup assertions.

### Test-first evidence

#### RED

```text
node --import tsx --test tests/a11y-performance.test.mjs --test-name-pattern "rapid deck navigation"
```

Before the production probe correction, the focused test failed with:

```text
AssertionError: the latest cinematic timeout must clear its letterbox
'true' !== 'false'
```

This demonstrated that `data-cine={chapOn}` did not observe the actual cinematic timer outcome.

#### GREEN

The same focused command passed: 53/53 Node tests. It now verifies `cine` is true initially and after the stale cleared 1100 ms callback, then false after the live latest 1100 ms callback.

### Full verification

- `npm run test:node` — PASS, 126/126.
- `npm run lint` — PASS.
- `npm run format:check` — PASS.
- `npm run build` — PASS; existing deferred viewscreen chunk warning remains 632.43 kB minified / 164.67 kB gzip.
- `python -m unittest tests.test_v32_release tests.test_public_repo_guard tests.test_committed_whitespace` — PASS.
- `python scripts/check_release_consistency.py` — PASS.
- `python scripts/public_repo_guard.py` — PASS.
- `python scripts/check_committed_whitespace.py` — PASS.
- `git diff --check` — PASS.

### Scope and residual gap

- Only `src/components/command-deck.tsx`, `tests/a11y-performance.test.mjs`, and this report changed in this round.
- Reduced-motion runtime browser emulation remains deferred as approved. `.npm-cache/` remains untracked and unstaged.
