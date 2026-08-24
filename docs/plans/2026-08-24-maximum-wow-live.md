# Cashio.us V33 Maximum-Wow Live Release Plan

## Spec

The binding source is Doug Cashio's approved eight-point maximum-wow pass from 08-24-2026. This release preserves the V32 Dune/LCARS command-deck look and the Bit-centered identity while making the existing story easier to enter, share, read, and operate.

## Global Constraints

- Preserve the existing palette, typography, Bit mascot, aircraft viewscreen, command-deck layout, copy tone, and the exact hero line `OWN THE IRON AND THE ROUTE.` This is a focused enhancement, not a redesign.
- The identity line must be exactly `DOUG CASHIO · ENTERPRISE AI + SECURITY SYSTEMS · OWNER-OPERATOR`.
- The visible tour control must say `RUN THE 30-SECOND FLIGHT` while idle and expose four beats in this order: thesis, routing law, strongest build, E.V.E./contact. It must stop at approximately 30 seconds and must never enable audio; audio remains off unless the visitor explicitly arms it.
- Every deck must have a stable shareable URL hash. The selected article on Deck 06 must also be represented in the hash. Invalid hashes must fall back safely without breaking navigation. Back/forward and `hashchange` must restore the corresponding deck/article.
- The final contact deck must contain a `BLACK BOX RECEIPT` with exactly three dated, public-safe claims drawn from the existing 08-21-2026 snapshot and an explicit copy/share-link control.
- Normal dim text must use `#687f97` or a higher-contrast equivalent that preserves the subdued blue-grey look.
- Mystery/glyph controls need explicit accessible names. The deck navigator must move focus inside when opened, trap Tab/Shift+Tab, close on Escape, and return focus to its opener. Aircraft pips must expose at least 24 by 24 CSS-pixel hit targets while the visible pip marks remain visually small.
- On mobile, every deck must reserve the fixed rail height plus `env(safe-area-inset-bottom)`, and the rail itself must include the safe-area inset.
- Below-fold plate images, including rack, operator, and fold, must use native lazy loading. The viewscreen module must not be requested until after the first screen has painted; reduced-motion and browser fallbacks must remain functional.
- Split the largest React implementation modules by responsibility without changing behavior. Keep the viewscreen renderer cohesive unless a safe responsibility boundary is demonstrated.
- Add ESLint and Prettier check scripts. GitHub workflows must use `npm ci`; both pull-request safety and Pages deployment must run lint, format, the full test suite, build, public repository guard, and release consistency before deployment.
- Follow strict TDD for each behavior change: add or amend focused tests, run them and capture an expected RED failure, implement the smallest change, then capture GREEN. Run the full suite once per task before commit.
- Keep all public claims dated and scoped. Do not publish `RELEASE_BODY.md` content from the abandoned V33 candidate or expose private topology, credentials, provider accounting, or operational secrets.
- Preserve reduced motion, opt-in audio, responsive legibility, root Pages base `/`, `CNAME`, `status.json` truth-contract behavior, and existing release guards.

## Task 1: Add deterministic deep links and the 30-second flight model

Create focused, browser-independent navigation and flight-plan modules under `src/lib/` and test them first.

Acceptance criteria:

1. Add Node tests that initially fail for parsing/formatting hashes for all nine `DECKS`, Deck 06 article selection, invalid/unknown values, and query preservation outside the hash.
2. Use a canonical hash form that is human-readable and stable. It must encode a deck id, and only encode an article when the build deck has a selected article. Parsing must clamp or reject invalid article indices without throwing.
3. Add Node tests that initially fail for a four-beat, 30-second flight plan with the ordered labels `THESIS`, `ROUTING LAW`, `STRONGEST BUILD`, and `E.V.E. / CONTACT`. The strongest-build beat must select Article 01, `HERMES ORCHESTRATOR`. The completion handoff must land on contact without creating a fifth advertised beat.
4. Add pure helper(s) that make tour start/stop/restart deterministic and make it impossible for tour state to arm audio.
5. Wire initial hash, deck changes, build-article changes, and `hashchange` into `CommandDeck` without introducing navigation loops. Manual navigation stops the flight; the flight's own programmatic navigation does not stop itself.
6. Update `package.json`'s Node test list for the new test files. Run focused RED/GREEN evidence and the full existing suite, then commit.

## Task 2: Add the visible wow story, identity line, and Black Box Receipt

Build the approved visitor-facing elements using the Task 1 interfaces. Extract new UI responsibilities into focused components instead of growing `command-deck.tsx` and `decks.tsx` further.

Acceptance criteria:

1. Add focused source/behavior tests that initially fail for the exact identity line, exact `RUN THE 30-SECOND FLIGHT` label, the four visible beat labels/progress state, and the `BLACK BOX RECEIPT` contract.
2. Add the identity line immediately above the hero title. Keep `OWN THE IRON AND THE ROUTE.` byte-for-byte unchanged.
3. Replace the hidden/glyph-only desktop tour affordance with a visible command labeled `RUN THE 30-SECOND FLIGHT`. While running, expose its current beat and an explicit stop/restart affordance. Keep animation restrained and consistent with the existing command deck.
4. The four-beat experience must use the Task 1 plan and finish at contact at approximately 30 seconds. It may briefly stage E.V.E. within the fourth beat before completing at contact. It must not call the audio arm path.
5. Add a focused `BlackBoxReceipt` component to the final contact deck. Show exactly these three dated claims, formatted consistently with the site:
   - `08-21-2026 · 19/19 PUBLISHED CONTAINERS RUNNING AT PROBE`
   - `08-21-2026 · 2 PROXMOX HOSTS QUORATE`
   - `08-21-2026 · 10 PUBLIC LANES · 36 PRIVATE CATALOG`
6. The receipt control must use the current canonical deck/article URL. Prefer the Web Share API only after a deliberate click and fall back to copying. Announce success/failure in a polite live region; do not make a network call.
7. Run focused RED/GREEN evidence and the full suite, then commit.

## Task 3: Fix accessibility, mobile rail clearance, and first-paint performance

Implement the audited accessibility, responsive, and loading fixes without altering the palette or interaction character.

Acceptance criteria:

1. Add focused tests that initially fail for the dim token, explicit control labels, 24-pixel pip hit targets, focus-cycle helper behavior, mobile safe-area reservation, lazy plate loading, and post-paint stage-load scheduling.
2. Move the normal dim token to `#687f97`. Do not reduce any already-higher-contrast text token.
3. Give every glyph-only rail/header/palette control a stable `aria-label` and preserve `aria-pressed` where stateful. Do not make global single-character shortcuts fire while focus is in an editable or interactive control.
4. Extract deck-navigator focus behavior into a focused hook/helper: focus the current deck button or first control on open; trap forward/backward Tab; Escape closes; return focus to the opener that launched it.
5. Wrap each aircraft's visible pip inside a minimum 24 by 24 hit target. Keep the visible mark at its current small dimensions and visual treatment.
6. Reserve the fixed mobile navigation height and `env(safe-area-inset-bottom)` on every deck and footer. Include the inset in the rail itself. Verify no CTA can sit beneath the rail at 390 by 844.
7. Set below-fold plate images to `loading="lazy"` and retain async decoding. Keep important selected-aircraft evidence lazy unless it is already visible.
8. Load `viewscreen-stage.js` only after the first screen has painted, using a tested scheduler with `requestAnimationFrame` plus an idle/timeout fallback and clean cancellation. User intent may accelerate the deferred load, but module loading must not happen during the initial render/effect turn.
9. Run focused RED/GREEN evidence and the full suite, then commit.

## Task 4: Split UI responsibilities and enforce clean release gates

Refactor the two oversized React modules around the seams introduced by Tasks 1-3, then add deterministic lint/format/release checks.

Acceptance criteria:

1. Add or amend structural tests first so they fail while `command-deck.tsx` and `decks.tsx` still own chrome, dialog, shared deck primitives, and receipt responsibilities.
2. Extract command chrome/navigation/dialog components from `command-deck.tsx` into focused modules with typed props. Extract shared deck primitives and visitor-facing receipt/flight UI from `decks.tsx` into focused modules. Keep orchestration in `CommandDeck`; do not rewrite the cohesive WebGL renderer solely to reduce line count.
3. Preserve all public exports and rendered behavior used by existing tests. Avoid copy/paste duplication and keep each new file responsible for one coherent concern.
4. Add ESLint with TypeScript, React hooks, and React refresh support. Exclude the hand-authored WebGL renderer from TypeScript-oriented lint only where necessary.
5. Add Prettier plus `format` and `format:check` scripts. Format and check maintained TypeScript/TSX, test JavaScript, configuration, JSON, and workflow YAML while excluding generated/binary assets and the hand-authored renderer. The committed tree must pass `npm run lint` and `npm run format:check` without warnings.
6. Add a `verify` script that runs lint, format check, full tests, build, `python scripts/public_repo_guard.py`, `python scripts/check_release_consistency.py`, and `git diff --check` through cross-platform-safe package scripts or explicit workflow steps.
7. Change GitHub dependency installation from `npm install` to `npm ci`. Both `.github/workflows/public-safety.yml` and `.github/workflows/pages.yml` must run lint, format check, the full test suite, build, both Python guards, and Python syntax checks before any Pages artifact deploys.
8. Update release metadata from V32 to V33 only where required by the existing truth-contract checks. Preserve the 08-21-2026 measurement date and existing validity policy unless a test demonstrates the current release date contract requires a scoped update.
9. Run focused RED/GREEN evidence, `npm run verify`, and a clean-tree check, then commit.

## Final Verification

After all tasks are reviewed, run a whole-branch review against the merge base. Then run fresh local verification: `npm ci`, lint, format check, full tests, production build, both release guards, Python syntax, `git diff --check`, dependency audit, and production-bundle size reporting. Serve the production build and verify desktop, 390 by 844 mobile, keyboard-only dialog focus, reduced motion, hash/back-forward behavior, article deep links, the full 30-second flight, opt-in audio, the receipt copy/share fallback, no horizontal overflow, and a clean console. Only after these checks pass, push the release branch, open a pull request, wait for required checks, squash merge, wait for Pages, and verify the live site plus exact deployed assets.
