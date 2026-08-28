# Task 3 Report: Intent-Gated Cinematic Rendering and Adaptive Loops

Date: 2026-08-28

## Scope and hashes

- Approved starting HEAD: `27e2326a158b08f4a3a09a554dbd3e6ec9e29cce`
- Branch: `preview/v34-preservation-pass-20260828`
- Scope: Task 3 files only; `.npm-cache/` remained untouched and untracked.
- Final Task 3 commit hash is recorded in Git history and in the parent-agent handoff after the commit; it cannot be self-embedded in the commit that contains this report.

## RED evidence

Command:

`node --import tsx --test tests/a11y-performance.test.mjs tests/animation-timing.test.mjs`

Observed ordinary RED, exit 1. The failures directly exposed the missing behavior:

- Early pointer intent was forgotten before paint: expected one import, observed zero.
- Generic idle eagerly loaded the stage: expected zero imports, observed one.
- Wheel and touch intent were not registered: expected one import, observed zero.
- Only two intent listeners existed instead of pointer, keyboard, wheel, and touch.
- The 12-second stationary fallback did not exist.
- The real `/plates/command.jpg` poster was absent.
- `shouldRenderFrame` was undefined.
- A separate quiet/reduced-motion test proved one frame loop remained perpetually scheduled while audio was off.

One pre-existing navigation timing assertion also failed during the first combined RED/GREEN runs (`#deck=routing` observed while `#deck=iron` was expected). Its isolated rerun passed 1/1, and it passed in both subsequent complete Task 3 runs. No Task 3 navigation source was changed.

## Implemented behavior

- The stage scheduler observes deliberate `pointerdown`, `keydown`, `wheel`, and `touchstart` intent.
- Intent before first paint is remembered. The stage starts once after the two-frame first-paint boundary.
- Idle and the second frame alone do not start the stage.
- A stationary visitor starts the cinematic stage only through the bounded 12-second fallback.
- Starting or cancelling removes all pending schedules and all four intent listeners.
- The existing `/plates/command.jpg` is rendered immediately as a decorative source poster. The live viewscreen fades over it only after the stage module is ready; reduced motion removes the transition.
- `shouldRenderFrame(now, previous, minimumInterval)` renders the first frame, skips sub-interval work, and includes the interval boundary.
- Bit and viewscreen rendering are capped at 30 work frames per second while their `requestAnimationFrame` scheduling remains appropriate. Bit's reduced-motion path renders one frame; the viewscreen retains its existing one-frame reduced-motion and hidden-tab pause paths.
- The sound-level frame loop exists only while audio is armed and is cancelled immediately when audio is disarmed.
- Aircraft ordering, the 30-second flight behavior, and opt-in/muted-default audio policy were not changed. Per-aircraft incremental construction was deliberately not implemented.

## Files

- `tests/a11y-performance.test.mjs`
- `tests/animation-timing.test.mjs`
- `src/lib/stage-load-scheduler.ts`
- `src/lib/animation-timing.ts`
- `src/components/command-deck.tsx`
- `src/components/bit-mascot.tsx`
- `src/lib/viewscreen-stage.js`
- `src/styles.css`
- `.superpowers/sdd/2026-08-28-cashio-v34-preservation-pass/task-3-report.md`

## GREEN and verification evidence

- Required Task 3 suite: 49/49 passed, exit 0.
  - `node --import tsx --test tests/a11y-performance.test.mjs tests/animation-timing.test.mjs tests/craft-lineage.test.mjs tests/audio-policy.test.mjs`
- Focused scheduler/timing suite: 38/38 passed on the fresh rerun, exit 0.
- Navigation timing assertion isolated rerun: 1/1 passed, exit 0.
- `npm.cmd run lint`: passed, exit 0.
- `npm.cmd run format:check`: passed, exit 0.
- `npx.cmd tsc --noEmit`: passed, exit 0.
- `git diff --check`: passed, exit 0.
- Scoped `npm.cmd run build`: TypeScript completed, but Vite hit the known restricted-sandbox configuration-access failure: `Cannot read directory "../../../../../..": Access is denied` and could not resolve `vite.config.ts`. Per the brief, the elevated final build gate remains Task 4 work.

## Concerns and boundaries

- The isolated navigation timing flake is recorded above; it was not reproduced in the final two complete Task 3 runs.
- Performance measurement and the decision about aircraft batching remain Task 4 work.
- No push, publication, deployment, merge, production, GitHub Pages, or Cloudflare action occurred.
