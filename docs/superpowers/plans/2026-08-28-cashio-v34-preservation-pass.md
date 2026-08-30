# Cashio.us V34 Preservation Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a verified local Cashio.us preview that preserves the V33 identity while fixing responsive deck drift, layout collisions, accessibility state, and initial main-thread blocking.

**Architecture:** Keep the existing React/Zustand command deck and Three.js custom element. Extend the existing navigation transition boundary for layout reflow, make control semantics explicit at component boundaries, add narrowly scoped responsive classes, and change stage scheduling without rewriting the renderer.

**Tech Stack:** React 19, TypeScript, Zustand, Tailwind/CSS, Three.js, Node test runner, JSDOM, Vite, Lighthouse.

**Spec:** `docs/superpowers/specs/2026-08-28-cashio-v34-preservation-pass-design.md`

## Global Constraints

- Preserve the V33 MACH ONE Bit/Dune/LCARS identity, content, nine decks, craft lineage, opt-in audio, reduced motion, and dated public-safe claims.
- Do not push, merge, publish, or change production/Cloudflare/GitHub Pages state.
- Existing canonical hashes remain `#deck=<id>` and Builds may append `&article=<1-7>`.
- Existing flight beats remain at 0, 7.5, 15, and 22.5 seconds, with Contact at 30 seconds.
- Production behavior changes require a failing test observed before implementation.

---

### Task 1: Responsive deck-state preservation

**Files:**

- Modify: `tests/deck-navigation.test.mjs`
- Modify: `tests/a11y-performance.test.mjs`
- Modify: `src/lib/deck-navigation.ts`
- Modify: `src/components/command-deck.tsx`

**Interfaces:**

- `consumeScrollDeck(state, candidateDeck)` produces `{ writeHash, updateDeck, state }`.
- `CommandDeck` captures the active deck on resize and re-anchors the scroller after layout settles.

- [ ] **Step 1: Write the failing state-boundary test**

Add a test asserting that an intermediate candidate during restoration returns `updateDeck: false`, while the target candidate returns `updateDeck: true` and clears restoration.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --import tsx --test tests/deck-navigation.test.mjs`

Expected: FAIL because `consumeScrollDeck` does not yet expose `updateDeck`.

- [ ] **Step 3: Add the JSDOM responsive-layout regression**

Extend `mountCommandDeck` with responsive section geometry. Start on Contact at desktop geometry, change only viewport geometry to mobile, dispatch `resize`, run the controlled layout-settle timer/frame, and assert `#deck=contact`, store deck `8`, Contact header state, and a re-anchored scroller.

- [ ] **Step 4: Verify the integration test is RED**

Run: `node --import tsx --test tests/a11y-performance.test.mjs --test-name-pattern="resize preserves"`

Expected: FAIL because the resize handler only remeasures visual overlays.

- [ ] **Step 5: Implement the minimal navigation and resize fix**

Add `updateDeck` to the transition result. In `onScroll`, refuse intermediate deck/store/hash changes while restoring. Add a debounced resize anchor that calls the existing programmatic-scroll suppression, waits for responsive layout to settle, scrolls to the captured deck, and then lets `onScroll` consume the target.

- [ ] **Step 6: Verify GREEN and the full navigation suite**

Run: `node --import tsx --test tests/deck-navigation.test.mjs tests/a11y-performance.test.mjs`

Expected: all tests pass with no warnings.

### Task 2: Accessible states, focus routing, and collision-safe controls

**Files:**

- Modify: `tests/a11y-performance.test.mjs`
- Modify: `tests/flight-experience.test.mjs`
- Modify: `src/components/decks.tsx`
- Modify: `src/components/command-chrome.tsx`
- Modify: `src/components/deck-navigator.tsx`
- Modify: `src/components/flight-control.tsx`
- Modify: `src/components/black-box-receipt.tsx`
- Modify: `src/components/deck-primitives.tsx`
- Modify: `src/components/command-deck.tsx`
- Modify: `src/styles.css`

**Interfaces:**

- `FlightControl` accepts `compact?: boolean` while retaining its full accessible name.
- `DeckNavigator.onSelect` identifies selection separately from dismissal.
- Each `section[data-deck]` is a programmatically focusable named destination.

- [ ] **Step 1: Write failing semantic and focus tests**

Assert one pressed presentation mode, one current destination in each navigation surface, visible-label text in GO/audio accessible names, compact flight output, selection focus on the Contact heading, and unchanged Escape/opener restoration.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --import tsx --test tests/a11y-performance.test.mjs tests/flight-experience.test.mjs`

Expected: FAIL on absent `aria-pressed`, `aria-current`, visible-label names, compact rendering, and destination focus.

- [ ] **Step 3: Implement minimal component semantics and focus routing**

Add the missing states/names, distinguish navigator selection from dismissal, make deck headings focusable destinations, and retain the current focus trap and Escape behavior.

- [ ] **Step 4: Implement the compact desktop flight control and mobile clearance**

Collapsed desktop rail renders a 52 px `30S` control. Expanded rail keeps the full inactive/active control. Mobile decks reserve top space for the fixed control.

- [ ] **Step 5: Add Contact/receipt readability classes and mobile Builds ordering**

Add `.za-contact-copy`, `.za-contact-meta`, `.za-receipt-claim`, `.za-receipt-status`, `.za-build-map`, `.za-build-details`, and `.za-build-selector`. Use an opaque gradient scrim, 11 px meaningful mobile microtype, detail-first mobile order, and a contained snap selector.

- [ ] **Step 6: Verify focused and full component tests**

Run: `node --import tsx --test tests/a11y-performance.test.mjs tests/flight-experience.test.mjs tests/hud-layout.test.mjs`

Expected: all tests pass and existing dialog/flight behavior remains green.

### Task 3: Intent-gated cinematic rendering and adaptive loops

**Files:**

- Modify: `tests/a11y-performance.test.mjs`
- Modify: `tests/animation-timing.test.mjs`
- Modify: `src/lib/stage-load-scheduler.ts`
- Modify: `src/lib/animation-timing.ts`
- Modify: `src/components/command-deck.tsx`
- Modify: `src/components/bit-mascot.tsx`
- Modify: `src/lib/viewscreen-stage.js`
- Modify: `src/styles.css`

**Interfaces:**

- `scheduleStageLoad` waits for first paint, remembers early intent, starts on deliberate intent, and retains a bounded long fallback.
- `shouldRenderFrame(now, previous, minimumInterval)` prevents redundant high-frequency work without stopping requestAnimationFrame scheduling.

- [ ] **Step 1: Replace eager-scheduler expectations with failing intent/fallback tests**

Assert that idle/second-frame alone does not call `load`, early pointer intent is remembered until paint, pointer/keyboard/wheel/touch intent starts once, cancellation removes all schedules/listeners, and only the long fallback starts a stationary visitor.

- [ ] **Step 2: Add failing frame-throttle tests**

Use literal timestamps to assert the first frame renders, frames below the interval skip, and the boundary frame renders.

- [ ] **Step 3: Run focused tests and verify RED**

Run: `node --import tsx --test tests/a11y-performance.test.mjs tests/animation-timing.test.mjs`

Expected: FAIL because idle currently starts the stage and no frame-throttle helper exists.

- [ ] **Step 4: Implement the scheduler and poster transition**

Remove eager idle/zero-delay loading, remember deliberate intent, add a 12-second stationary fallback, render `/plates/command.jpg` as the real source poster, and fade the live stage over it when ready.

- [ ] **Step 5: Gate continuous work**

Run the sound-level frame loop only while audio is armed. Apply the tested frame throttle to Bit and the viewscreen while keeping reduced motion single-frame and existing hidden-tab behavior.

- [ ] **Step 6: Verify focused tests and craft regressions**

Run: `node --import tsx --test tests/a11y-performance.test.mjs tests/animation-timing.test.mjs tests/craft-lineage.test.mjs tests/audio-policy.test.mjs`

Expected: all tests pass with the same craft ordering and opt-in audio policy.

### Task 4: Windows line endings and full verification

**Files:**

- Create: `.gitattributes`
- Modify only if verification reveals a scoped defect: files from Tasks 1–3

- [ ] **Step 1: Add the LF policy**

Create `.gitattributes` with `* text=auto eol=lf`, explicit CRLF for Windows command scripts if any, and binary declarations for image/audio/font files.

- [ ] **Step 2: Run the complete repository gate**

Run: `npm run verify`

Expected: lint, formatting, 82+ Node tests, TypeScript/Vite build, 49 Python tests, public repository guard, release-consistency guard, and whitespace guard pass. If the sandbox blocks Vite configuration access, rerun only the build with the approved elevated `npm.cmd run build` prefix.

- [ ] **Step 3: Measure the preview**

Run mobile and desktop Lighthouse against the local production preview three times and record the medians. Compare with mobile 65 and desktop 61; do not claim improvement without the measured result.

- [ ] **Step 4: Run in-app browser QA**

Verify 1440×900, 390×844, and 320 px states for Snapshot, Builds, E.V.E., Contact, resize/hash stability, Back/Forward, dialog focus, destination focus, audio off, mobile overflow, and clean console logs.

- [ ] **Step 5: Compare against the accepted audit captures**

Capture the same nine states and inspect source/preview side by side. Preserve the identity, aircraft/craft behavior after stage activation, content hierarchy, and opt-in audio; fix visible regressions before handoff.
