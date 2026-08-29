# Task 1 report — Canonical V34 truth and editorial hierarchy

## Implemented changes

- Promoted every canonical release surface to `V34 MACH ONE` / `34.0.0`, revised `2026-08-28`.
- Replaced the fleet contract with the public-safe, read-only dated export: verified 28 August 2026; valid through 27 September in America/Chicago; Proxmox 9.2.11; two hosts online and quorate; 18/19 guests running; Zeus 12/13; Apollo 6/6. The stopped guest is never identified.
- Kept routing distinct: the ten public lanes and thirty-six private catalog entries are explicitly a separate 21 August routing inventory.
- Changed visible status framing from `CURRENT`/`NOMINAL` to `DATED EXPORT`, `READ-ONLY`, and `EXPORT VALID`; updated E.V.E. to use that same static-export boundary.
- Preserved exactly seven public-safe role families, removed individual monitoring/media application names from the observed-role presentation, and removed raw host hardware detail.
- Reworked Executive mode around `ROUTE CONTROL`, `EVIDENCE BOUNDARY`, and `HUMAN AUTHORITY`; changed the flight/build hierarchy to `BUILD PROOF`; labeled Lineage interpretation as `CASHIO OPERATING LESSON`; bounded the autonomous article label; and shortened Operator copy.
- Left Contact and the Black Box Receipt source wording unchanged. The receipt regression test continues to assert its exact existing claims.
- Updated the release consistency guard, release documents, version lock, and behavioral release/render/flight tests.

## Files changed

`package.json`, `package-lock.json`, `status.json`, `public/status.json`, `README.md`, `CHANGELOG.md`, `RELEASE_BODY.md`, `scripts/check_release_consistency.py`, `src/lib/content.ts`, `src/lib/flight-plan.ts`, `src/components/command-chrome.tsx`, `src/components/command-deck.tsx`, `src/components/decks.tsx`, `src/components/eve-console.tsx`, and the six Task 1 test files named in the brief.

`src/components/command-deck.tsx` was additionally adjusted so the footer cannot render the forbidden bare `CURRENT` status label.

## TDD evidence

### RED

Command:

```text
node --import tsx --test tests/release-gates.test.mjs tests/release-validity.test.mjs tests/flight-plan.test.mjs tests/flight-experience.test.mjs tests/a11y-performance.test.mjs
```

Output:

```text
tests 69
pass 60
fail 9

command chrome frames aggregate evidence as a dated export
AssertionError: expected /18\/19 AT 28 AUG PROBE/; actual header: "...19/19 NOMINALCURRENT..."

DeckSnapshot renders V34's dated aggregate and Executive outcome hierarchy
AssertionError: expected /18\/19 AT 28 AUG PROBE/; actual snapshot: "...21 August 2026 · 19/19 RUNNING..."

FlightControl starts, stops, and restarts through real buttons
actual: "03 · STRONGEST BUILD"
expected: "03 · BUILD PROOF"

FlightControl exposes the canonical current beat at each handoff
actual: "03 · STRONGEST BUILD"
expected: "03 · BUILD PROOF"

advertises four ordered beats across a 30-second flight
actual beat: "STRONGEST BUILD"
expected beat: "BUILD PROOF"

routes the Build Proof beat to Article 01 HERMES ORCHESTRATOR
actual label: "STRONGEST BUILD"
expected label: "BUILD PROOF"

package metadata and deterministic local gates define the V34 release
actual package version: "33.0.0"
expected package version: "34.0.0"

the V34 dated export remains valid through the end of 27 September in Chicago
actual EXPIRES_AT: "2026-09-21T05:00:00Z"
expected EXPIRES_AT: "2026-09-28T05:00:00Z"

the V34 dated export expires exactly after the inclusive Chicago date boundary
actual daysLeft: -7
expected daysLeft: 0
```

These failures were expected: the then-current source still expressed the V33 dates, full 19/19 state, bare status language, V33 package metadata, and `STRONGEST BUILD` beat.

### GREEN

Command:

```text
node --import tsx --test tests/release-gates.test.mjs tests/release-validity.test.mjs tests/flight-plan.test.mjs tests/flight-experience.test.mjs tests/a11y-performance.test.mjs; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; python -m unittest tests.test_v32_release
```

Output:

```text
tests 69
pass 69
fail 0
Ran 16 tests in 0.131s
OK
```

## Full-suite evidence

- `npm run lint` — passed.
- `npm run format:check` — passed.
- `npm run test:node` — passed: 110 tests, 110 pass, 0 fail.
- `python -m unittest tests.test_v32_release tests.test_public_repo_guard tests.test_committed_whitespace` — passed: 49 tests, 49 pass, 0 fail.
- `python scripts/public_repo_guard.py` — passed.
- `git diff --check` — passed.
- Root and public status files are byte-identical: SHA-256 `B0976BF3DA586B1D6397086CFD524164AEF7AE87AB7688656A9FB0B06A7C2F34`.

`npm run test` ran the complete 110-test Node suite successfully, then its Vite build was blocked by the workspace sandbox before artifact generation:

```text
X [ERROR] Cannot read directory "../../../../../..": Access is denied.
X [ERROR] Could not resolve "...\\vite.config.ts"
failed to load config from ...\\vite.config.ts
```

As a consequence, `python scripts/check_release_consistency.py` correctly fails only because the existing `dist` artifact is still V33 and lacks `28 August 2026` and `18/19 AT 28 AUG PROBE`. It needs a successful elevated build before the final artifact/guard pass.

## Self-review and concerns

- Reviewed changed public status, content, release documents, and guard text for newly exposed guest, host-hardware, storage, utilization, network, provider, port, address, or access-path data. None was added; the only stopped-guest statement is that it remains unnamed.
- Contact and Black Box Receipt source wording were not changed; the existing rendered receipt contract remains green.
- `.npm-cache/` remains untracked and must not be staged.
- Remaining concern: build/artifact-based validation is blocked solely by the sandbox access-denied error above. Run `npm run build`, then `python scripts/check_release_consistency.py`, in an approved environment before release.

## Fix round 1 — reviewer findings

Fix commit: `a685d56296756cb2c56e76f6494a5c9f04dce9cf` (`fix: close V34 public truth gaps`).

### Implemented

- Replaced stale V33 search/social metadata in `index.html` and the `public/lab.html` redirect fallback with V34 `DATED EXPORT` language, the 28 August verification date, and `18/19 AT 28 AUG PROBE`.
- Added release-guard checks for `index.html` and `lab.html` independently in both source and `dist`. The global artifact scan no longer permits new V34 markers to mask stale claims in either surface; the preserved receipt and historical archive are not scanned by this per-file rule.
- Replaced Technical and Executive page-count promises with audience-value promises.
- Dated every Apollo aggregate surface as `6/6 AT 28 AUG PROBE`.
- Made header-validity tests deterministic with injected timestamps for both the valid and expired boundaries.

### RED

Command:

```text
node --import tsx --test tests/release-gates.test.mjs tests/flight-experience.test.mjs tests/a11y-performance.test.mjs
```

Output:

```text
tests 64
pass 59
fail 5

public metadata and redirect fallback carry only the V34 dated aggregate
AssertionError: index.html must include 28 August 2026

DeckSnapshot renders V34's dated aggregate and Executive outcome hierarchy
AssertionError: expected /Detailed evidence, build proof, and operational context/; actual choice: "Nine decks. Fleet, routing law, hardware, builds."

command chrome frames aggregate evidence as a dated export at valid and expired boundaries
valid and expired assertions failed because rendered Apollo text was "APOLLO6 RUNNING WORKLOADS" rather than `APOLLO6/6 AT 28 AUG PROBE`.
```

The five failures were intentional and traced directly to the stale public surfaces, page-count copy, and undated Apollo presentation. The header test now supplies both dates explicitly, eliminating dependence on the wall clock.

### GREEN and full verification

- Focused command above — passed: 64 tests, 64 pass, 0 fail.
- `npm run lint` — passed.
- `npm run format:check` — passed.
- `npm run test:node` — passed: 114 tests, 114 pass, 0 fail.
- `python -m unittest tests.test_v32_release tests.test_public_repo_guard tests.test_committed_whitespace` — passed: 49 tests, 49 pass, 0 fail.
- `python scripts/public_repo_guard.py` — passed.
- `git diff --check` — passed before committing the fix.

`python scripts/check_release_consistency.py` correctly fails against the stale V33 `dist` artifact, now with explicit per-file evidence for both `dist/index.html` and `dist/lab.html` (missing V34 markers and containing stale V33 claims). A sandboxed `npm run build` remains blocked by `Access is denied` while Vite reads its config, so an approved-environment build is still required before the artifact guard can pass.

## Fix round 2 — routing inventory provenance

Fix commit: `d968eda96e5a21137ea82fcb90f654a537e8c394` (`fix: preserve routing inventory provenance`).

### Implemented

- Dated each public metadata/fallback 10/36 claim as `ROUTING INVENTORY 21 AUGUST 2026`, distinct from the 28 August fleet probe.
- Updated E.V.E. `status` and `lanes`, boot/telemetry, Executive, Routing, and console summary copy so every displayed routing count is explicitly the 21 August 2026 inventory.
- Narrowed stale detection to obsolete fleet claims; a legitimate 21 August 2026 routing date is now allowed.
- Added a pure guard test that accepts correct provenance and rejects undated or falsely 28-August-tagged 10/36 claims. The preserved receipt and historical archive remain outside per-file current-surface checks.

### RED

Command:

```text
node --import tsx --test tests/release-gates.test.mjs tests/flight-experience.test.mjs; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; python -m unittest tests.test_v32_release.V34ReleaseContractTests.test_public_surface_guard_requires_separate_routing_provenance
```

Output:

```text
tests 18
pass 16
fail 2

E.V.E. status keeps routing counts on the separate 21 August 2026 inventory
AssertionError: false == true

public metadata and redirect fallback keep fleet and routing provenance distinct
AssertionError: index.html must date 10/36 as routing inventory
```

The focused Python command did not run because the preceding Node command correctly returned non-zero. The two Node failures demonstrated the missing routing date in E.V.E. status and source metadata before production edits.

### GREEN and full verification

- Focused Node command — passed: 18 tests, 18 pass, 0 fail.
- Focused guard fixture — `Ran 1 test ... OK`.
- `npm run lint` — passed.
- `npm run format:check` — passed.
- `npm run test:node` — passed: 115 tests, 115 pass, 0 fail.
- `python -m unittest tests.test_v32_release tests.test_public_repo_guard tests.test_committed_whitespace` — passed: 50 tests, 50 pass, 0 fail.
- `python scripts/public_repo_guard.py` — passed.
- `git diff --check` — passed before commit.

`python scripts/check_release_consistency.py` correctly fails only because the stale pre-build `dist/index.html` and `dist/lab.html` lack `ROUTING INVENTORY 21 AUGUST 2026` and have undated routing counts. Sandbox Vite build remains blocked by `Access is denied`; rebuild in an approved environment before final artifact verification.
