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
