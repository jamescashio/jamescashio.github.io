# Cashio.us V34 Flight Recorder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Produce and publish the approved V34 Flight Recorder release without changing the dated infrastructure snapshot or Cashio.us identity.

**Architecture:** Keep the current React/Zustand command deck and intent-gated Three.js stage. Tighten content at existing component boundaries, extend the tested HUD/layout contracts, and express motion state through existing deck ownership rather than adding another animation system.

**Tech Stack:** React 19, TypeScript, Zustand, Tailwind/CSS, Three.js, Node test runner, JSDOM, Python unittest, Vite, Lighthouse.

**Spec:** `docs/superpowers/specs/2026-08-28-cashio-v34-flight-recorder-design.md`

## Global Constraints

- Canonical release: `V34 MACH ONE`, package `34.0.0`, revised `2026-08-28`.
- Preserve the public-safe snapshot verified `2026-08-21`, valid through `2026-09-20` in `America/Chicago`; add no unverified public claim.
- Preserve Bit/Dune/LCARS identity, nine decks, Executive mode, hashes/history, 30-second flight timing, craft lineage, audio-off default, complete reduced motion, Contact, Black Box Receipt, and May 2026 `command.html`.
- No heavy dependency, new route, particle system, generic redesign, always-on audio, or direct production network call.
- General deck copy resolves within 300–450 ms; article acquisition within 450–620 ms; stage warp decays within 700 ms.
- Critical telemetry is at least 10 px desktop and 11 px mobile. E.V.E. prompt is visible at 1280x720. Snapshot has separate action/Bit safe zones at 390 px and 320 px.
- Every behavior change requires an observed failing test before production code. Visual-only values are verified in-browser rather than with brittle source-text assertions.
- Publication is PR-only, squash-only, public-safe, fully checked, Pages-verified, and byte-parity verified. Never force-push main.

---

### Task 1: Canonical V34 truth and editorial hierarchy

**Files:**

- Modify: `tests/release-gates.test.mjs`
- Modify: `tests/release-validity.test.mjs`
- Modify: `tests/flight-plan.test.mjs`
- Modify: `tests/flight-experience.test.mjs`
- Modify: `tests/a11y-performance.test.mjs`
- Modify: `tests/test_v32_release.py`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `status.json`
- Modify: `public/status.json`
- Modify: `src/lib/content.ts`
- Modify: `src/lib/flight-plan.ts`
- Modify: `src/components/command-chrome.tsx`
- Modify: `src/components/decks.tsx`
- Modify: `src/components/eve-console.tsx`
- Modify: `scripts/check_release_consistency.py`
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `RELEASE_BODY.md`

- [ ] Write behavioral release/render/flight tests for V34, dated export language, Executive outcomes, Builds evidence/control labels, `BUILD PROOF`, Lineage interpretation labels, and unchanged Contact/receipt.
- [ ] Run the focused tests and capture expected RED failures caused by the V33/ambiguous content.
- [ ] Implement the minimal canonical metadata, public-safe copy, and guard changes. Keep the verified/expiry facts unchanged.
- [ ] Run focused GREEN tests, then the complete Node and Python suites before committing.
- [ ] Self-review the public diff for new infrastructure detail or unsupported claims; commit the task.

### Task 2: HUD, telemetry, E.V.E., and responsive graphic polish

**Files:**

- Modify: `tests/hud-layout.test.mjs`
- Modify: `tests/a11y-performance.test.mjs`
- Modify: `tests/craft-lineage.test.mjs`
- Modify: `src/lib/hud-layout.ts`
- Modify: `src/components/command-deck.tsx`
- Modify: `src/components/decks.tsx`
- Modify: `src/lib/viewscreen-stage.js`
- Modify: `src/styles.css`

- [ ] Write behavioral tests that reproduce early HUD overlap/yield, E.V.E. first-viewport layout, and narrow Snapshot safe-zone requirements.
- [ ] Run focused tests and capture expected RED failures.
- [ ] Implement earlier clean HUD compression, non-truncating airframe text, critical telemetry sizing, protected copy/safe zones, first-viewport E.V.E. prompt, and restrained Proteus exposure.
- [ ] Verify 1440x900, 1280x720, 390x844, and 320 px rendered states in the local browser before committing.
- [ ] Run focused GREEN tests and the complete Node suite; commit the task.

### Task 3: Faster semantic motion and inactive-loop discipline

**Files:**

- Modify: `tests/animation-timing.test.mjs`
- Modify: `tests/a11y-performance.test.mjs`
- Modify: `tests/flight-experience.test.mjs`
- Modify: `src/lib/animation-timing.ts`
- Modify: `src/components/command-deck.tsx`
- Modify: `src/components/build-envelope.tsx`
- Modify: `src/components/bit-mascot.tsx`
- Modify: `src/lib/viewscreen-stage.js`
- Modify: `src/styles.css`

- [ ] Write behavior tests for the approved readable-copy/acquisition timing bounds and for inactive deck animation work standing down without changing selection.
- [ ] Run focused tests and capture expected RED failures.
- [ ] Implement the smallest timing contract and active-deck signal needed to resolve copy within 300–450 ms, article acquisition within 450–620 ms, stage warp within 700 ms, and pause secondary inactive work.
- [ ] Preserve the existing intent-gated 30 fps stage, hidden-tab behavior, reduced-motion complete state, and audio-off policy.
- [ ] Run focused GREEN tests and the complete Node suite; commit the task.

### Task 4: Release contract, full verification, and guarded publication readiness

**Files:**

- Modify only if verification reveals a scoped defect: files from Tasks 1–3 and release documents named in Task 1.
- Create/update: final QA evidence under the existing ignored output area only.

- [ ] Run lint, formatting, full Node, TypeScript/Vite build, all 49+ Python tests, public repository guard, release consistency, and committed whitespace checks.
- [ ] Run browser QA for desktop/laptop/mobile/320, deep links/history, keyboard/focus, audio-off, reduced motion, full 30-second flight, and clean console logs.
- [ ] Run three Lighthouse samples for mobile and desktop; record honest medians and regressions.
- [ ] Complete final whole-branch review against this spec and resolve every Critical/Important finding.
- [ ] Inspect the exact public diff and stage named files only; preserve `.npm-cache/` untracked.
- [ ] Stop at the external side-effect boundary if GitHub authentication is still invalid. Once re-authenticated, push the release branch, open a sanitized PR, wait for all checks, squash merge, wait for Pages, and live-verify exact artifact parity. Tag only after parity and exact release-body approval.
