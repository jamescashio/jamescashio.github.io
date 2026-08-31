# Cashio.us V35 Preservation-First Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a verified V35 that preserves the command-deck identity while closing the remaining navigation, accessibility, reduced-motion, performance, code-hygiene, and deployment-safety gaps.

**Architecture:** Make URL restoration and live motion state deterministic, prerender the real React tree at build time and hydrate it on the client, then remove unsupported repository debris and enforce workflow-only Pages publishing. Each behavior change begins with a failing automated test and ends with a focused commit and independent review.

**Tech Stack:** React 19, TypeScript, Zustand, Vite 6, Tailwind CSS 4, Node test runner, JSDOM, Chrome DevTools Protocol, Python unittest, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-08-30-cashio-v35-preservation-first-design.md`

## Global Constraints

- Preserve the current hero, Bit, nine-deck information architecture, command rails, 30-second flight, aircraft imagery, E.V.E. console, and opt-in audio policy.
- Preserve every dated public claim and its provenance; do not change fleet, routing, version, or validity figures.
- Add no runtime framework or compatibility dependency; React remains the renderer.
- Preserve canonical hashes and the current visual design at every supported viewport.
- Reduced-motion changes must never replay one-shot entrance motion or collapse the airframe HUD.
- Production remains on verified V34; no merge, push, Pages-setting mutation, or publication belongs to an implementation task.
- All edited files must pass the existing public-safety, release-consistency, formatting, lint, responsive-browser, and accessibility gates.

---

### Task 1: Deterministic direct links and accessible control names

**Files:**

- Modify: `src/lib/deck-navigation.ts`
- Modify: `src/components/command-deck.tsx`
- Modify: `src/components/command-chrome.tsx`
- Modify: `tests/deck-navigation.test.mjs`
- Modify: `tests/a11y-performance.test.mjs`

**Interfaces:**

- Produces: `NavigationOrigin` including `"restore"` and `shouldAnimateNavigation(origin, reducedMotion)`.
- Preserves: existing manual, flight, and browser-history behavior.

- [ ] **Step 1: Add failing navigation tests**

Extend the navigation contract with literal expectations:

```js
assert.equal(navigation.shouldStopFlightForNavigation("restore"), false);
assert.equal(navigation.hashWriteModeForNavigation("restore"), null);
assert.equal(navigation.shouldWriteHashForNavigation("restore"), false);
assert.equal(navigation.shouldAnimateNavigation("restore", false), false);
assert.equal(navigation.shouldAnimateNavigation("manual", false), true);
assert.equal(navigation.shouldAnimateNavigation("manual", true), false);
```

Add a component test that mounts `?entry=proof#deck=builds&article=1` with normal motion and deferred smooth scrolling, then asserts the initial landing is synchronous, creates no cinematic/chapter/sweep/warp effect, and selects the requested article.

- [ ] **Step 2: Add a failing label-in-name test**

For both deck navigation surfaces, assert that each normalized visible label is contained in its accessible name. Assert that the airframe role-button derives its name from visible text plus an `sr-only` action phrase rather than replacing visible text with `aria-label`.

- [ ] **Step 3: Verify RED**

Run:

```powershell
node --import tsx --test tests/deck-navigation.test.mjs tests/a11y-performance.test.mjs
```

Expected: failures for the missing `restore` origin, animated initial landing, numeric label mismatch, and airframe replacement label.

- [ ] **Step 4: Implement the minimal navigation behavior**

Add `"restore"` to `NavigationOrigin`. Return no hash write and no animation for restore. In `CommandDeck`, use restore only for the initial hash, land with direct `scrollTop`, suppress sound and cinematic effects, clear any stale visual pulse, and leave later `hashchange` navigation on the existing `"hash"` path.

- [ ] **Step 5: Implement literal label containment**

Prefix rail and mobile accessible names with the visible numeric label. Include the visible LCARS cap text in its label. Remove the airframe replacement `aria-label`, retain its visible identity, add `title`, and append `Open airframe deck` as screen-reader-only text.

- [ ] **Step 6: Verify GREEN and commit**

Run the focused tests, then `npm run lint` and `npm run format:check`. Commit as:

```text
fix: make V35 entry and control names deterministic
```

### Task 2: Settle live motion changes without collapsing the HUD

**Files:**

- Modify: `src/components/command-deck.tsx`
- Modify: `src/styles.css`
- Modify: `tests/a11y-performance.test.mjs`

**Interfaces:**

- Produces: persistent `za-motion-preference-settled` root state after the first media-query change.
- Preserves: normal interactive routing, HUD, rail, and craft-pip transitions.

- [ ] **Step 1: Add a focused failing component test**

Mount with normal motion, toggle reduced motion on and off through the real test media-query listener, and assert that the command-deck root acquires and retains `za-motion-preference-settled`.

- [ ] **Step 2: Verify both RED signals**

Run the focused component test and the real browser gate:

```powershell
node --import tsx --test tests/a11y-performance.test.mjs
npm run check:layout:runtime
```

Expected browser failures include the zero-sized restored/reduced-again `.za-airframe-progress` rectangle.

- [ ] **Step 3: Implement the minimal motion-settling state**

Record that the preference has changed inside the existing `matchMedia` change handler and retain that state for the page session. Add the root class and a scoped CSS rule that disables only `.za-rise` animation beneath the settled root. Do not disable the audited interactive transitions.

- [ ] **Step 4: Verify GREEN and commit**

Run the focused component test and the complete runtime layout gate. Commit as:

```text
fix: settle HUD geometry across motion changes
```

### Task 3: Prerender and hydrate the real React command deck

**Files:**

- Create: `src/app.tsx`
- Create: `scripts/prerender.mts`
- Create: `tests/prerender.test.mjs`
- Modify: `src/main.tsx`
- Modify: `src/components/command-deck.tsx`
- Modify: `src/styles.css`
- Modify: `index.html`
- Modify: `package.json`
- Modify: `tests/release-gates.test.mjs`
- Modify: `tests/test_v32_release.py`

**Interfaces:**

- Produces: `CashioApp`, `renderCashioApp()`, `injectPrerenderedApp(documentHtml, appHtml)`, and `prerenderDist()`.
- Build contract: `tsc --noEmit && vite build && node --import tsx scripts/prerender.mts`.
- Client contract: `data-prerendered="v35"` selects `hydrateRoot`; an empty development root selects `createRoot`.

- [ ] **Step 1: Write the failing prerender tests**

Create tests that call `renderCashioApp()` without defining `window` or `document` and assert:

```js
assert.match(markup, /OWN THE IRON/);
assert.equal((markup.match(/data-deck="\d"/g) ?? []).length, 9);
assert.match(markup, /aria-label="CONTACT deck"/);
```

Test `injectPrerenderedApp()` with a hand-written HTML fixture. It must replace exactly one empty root, add `data-prerendered="v35"`, retain the surrounding document, and reject missing or multiple root markers.

- [ ] **Step 2: Verify RED**

Run:

```powershell
node --import tsx --test tests/prerender.test.mjs
```

Expected: the prerender module and shared app wrapper do not exist.

- [ ] **Step 3: Make the initial render server-safe and deterministic**

Move `StrictMode` plus `CommandDeck` into `CashioApp`. Replace render-time reads of `window.matchMedia`, `window.innerWidth`, and `window.innerHeight` with fixed server/client initial values. Use an isomorphic layout effect—`useEffect` on the server, `useLayoutEffect` in the browser—to apply real viewport and motion values before client paint and register the live media listener.

- [ ] **Step 4: Implement prerender injection and hydration**

Render `CashioApp` with `react-dom/server`, inject it into the single built root, and write `dist/index.html`. In `main.tsx`, hydrate only the marked built root and preserve `createRoot` for the Vite development document.

- [ ] **Step 5: Reduce first-viewport work without changing the design**

Measure HUD-clear targets only in the active section plus footer. Add `content-visibility: auto` and a `100dvh` intrinsic size to offscreen decks while keeping Snapshot visible. Retain only `/fonts/orbitron-900.woff2` and the responsive command poster as document preloads; use `font-display: optional` for noncritical local faces.

- [ ] **Step 6: Update release contracts**

Add the prerender test to `test:node`. Assert the built root is marked and contains the real hero and all nine deck sections. Keep the compiled CSS and JavaScript as external hashed assets and reject a second hand-maintained shell.

- [ ] **Step 7: Verify GREEN and commit**

Run the prerender tests, all Node tests, the production build, release tests, runtime layout gate, lint, and format check. Commit as:

```text
perf: prerender and hydrate the V35 command deck
```

### Task 4: Remove abandoned tooling and require workflow-only Pages publishing

**Files:**

- Delete: `audit.mjs`
- Delete: `scripts/check_regression.js`
- Delete: `scripts/create_release.sh`
- Delete: `scripts/deploy_hardening.sh`
- Delete: `scripts/generate_badges.sh`
- Delete: `scripts/verify.py`
- Delete: `scripts/verify2.py`
- Delete: `scripts/zeusapollo_bridge.py`
- Delete: `scripts/zeusapollo_swarm.py`
- Modify: `README.md`
- Modify: `docs/REPOSITORY_SETTINGS.md`
- Modify: `.github/workflows/pages.yml`
- Modify: `tests/release-gates.test.mjs`

**Interfaces:**

- Preserves: supported runtime layout, release consistency, public safety, committed whitespace, and reproducible audio-generation tools.
- Produces: a Pages build that refuses artifact upload unless the repository reports `build_type=workflow`.

- [ ] **Step 1: Add failing workflow contract tests**

Assert that the Pages workflow reads the Pages endpoint with the job token, compares `.build_type` with the literal `workflow`, uses `actions/configure-pages@v5`, and uploads with `actions/upload-pages-artifact@v5` only after the complete gate chain and source check. Set `include-hidden-files: true`: the validated `dist/.well-known/security.txt` discovery file is a required public artifact and v4 would silently omit it.

- [ ] **Step 2: Verify RED**

Run:

```powershell
node --import tsx --test tests/release-gates.test.mjs
```

Expected: missing workflow-only source guard/configuration and the older artifact action.

- [ ] **Step 3: Harden the declarative release path**

Add a fail-closed `gh api repos/${GITHUB_REPOSITORY}/pages --jq .build_type` check, compare it with `workflow`, configure Pages with v5, and upload the already-verified `dist` artifact with `upload-pages-artifact@v5` and `include-hidden-files: true` so `.well-known/security.txt` remains in the validated artifact. Do not add a fallback branch publisher.

- [ ] **Step 4: Remove unsupported repository debris**

Delete the listed unreferenced machine-specific audits, stale release/badge helpers, and unrelated bridge templates. Retain the supported gates and `build_audio_cues.py`. Update README with the supported commands and update repository settings to require GitHub Actions as the sole Pages source.

- [ ] **Step 5: Verify GREEN and commit**

Run the focused release tests, Python syntax checks for retained Python tools, public-repository guard, committed-whitespace guard, lint, and format check. Commit as:

```text
chore: make the V35 release path fail closed
```

### Task 5: Whole-branch flight certification

**Files:**

- Modify only if a verification failure proves a defect.
- Record reports under the plan-specific ignored SDD workspace.

**Interfaces:**

- Consumes: Tasks 1–4.
- Produces: a review-clean, publication-ready local branch plus exact artifact hashes.

- [ ] **Step 1: Run the complete deterministic gates**

Run `npm run verify`, Python syntax checks, `git diff --check`, the public-repository guard, release consistency, and committed-whitespace checks. Any defect enters a test-first fix cycle.

- [ ] **Step 2: Run real-browser experience certification**

Verify 320, 390, 834, 1024, 1280, and 1440 layouts; all nine direct links; Builds article 7; the 30-second flight; keyboard navigation; both focus traps; live reduced-motion changes; opt-in audio; image decode; and a clean console.

- [ ] **Step 3: Run repeatable Lighthouse certification**

Run three mobile and three desktop audits against the production preview. Require every category rounded score and the three-run median to equal 100. Record FCP, LCP, TBT, CLS, transfer size, and any remaining opportunities. Do not accept a one-off 100.

- [ ] **Step 4: Review and hash the candidate**

Complete the task reviews and final whole-branch review. Record the exact commit, `dist/index.html`, initial JS, initial CSS, `status.json`, and critical image SHA-256 hashes. Stop before any push, merge, Pages-setting mutation, or deployment; those require Doug’s action-time confirmation.
