# Cashio.us V35 Preservation-First Design

## Objective

Raise the approved V35 candidate to a defensible 10/10 across content clarity, visual polish, brand/personality, UX flow, responsiveness, accessibility, performance, code cleanliness, and wow factor without changing the established Bit-centered Dune/LCARS command-deck identity.

## Experience contract

- Preserve the current hero, Bit, nine-deck information architecture, command rails, 30-second flight, aircraft imagery, E.V.E. console, and opt-in audio policy.
- Preserve every dated public claim and its provenance. No fleet, routing, version, or validity figure changes without a fresh measurement.
- Preserve all canonical hashes, including direct E.V.E., Contact, and Builds article links.
- Keep every working control keyboard-operable, every visible control label represented in its accessible name, and every essential touch target at least 44 by 44 CSS pixels.
- Reduced-motion preference changes must settle immediately and must never replay one-shot entrance motion or collapse the airframe HUD.
- The first HTML response must contain the real React command deck. The browser hydrates that same markup; no substitute design, fake screenshot, or duplicate hand-maintained hero is permitted.
- Add no runtime framework or compatibility dependency. React remains the renderer.
- Production remains on verified V34 until V35 passes all local gates and Doug separately confirms the exact publication action.

## Implementation architecture

### Deterministic navigation and accessibility

Treat the initial URL restoration as a distinct navigation origin. It lands synchronously without cinematic overlays, sound, smooth scrolling, or history writes. Subsequent manual, flight, and browser-history navigation retain their current semantics. Accessible names retain the complete visible deck labels, including numeric prefixes.

### Live motion preference

After the first live reduced-motion preference change, mark one-shot entrance motion as settled for the remainder of the page session. Interactive transitions may resume when normal motion returns, but `.za-rise` content must not replay and transient geometry must not leave the collision-aware HUD in a stale yielded state.

### First paint and hydration

Extract the shared app wrapper, render it with `react-dom/server` after the Vite build, and inject the resulting markup into the single empty `#root`. The client uses `hydrateRoot` only for marked prerendered output and keeps `createRoot` as the development fallback. Server and client initial state must be deterministic; real viewport and motion preferences are applied in an isomorphic layout effect before client paint.

Offscreen decks use `content-visibility`, HUD collision measurement inspects only the active deck plus the footer, and only the display face and responsive command poster remain preloaded. The result must improve first paint without Preact, a second content tree, or inlining the complete stylesheet.

### Repository and deployment hygiene

Keep only supported release, safety, runtime-layout, and reproducible media-generation tools. Remove abandoned machine-specific audits and unrelated unreferenced templates. GitHub Pages must be configured for GitHub Actions publishing only; the workflow verifies that setting before artifact upload, and repository documentation records it as mandatory.

## Acceptance evidence

- `npm run lint`
- `npm run format:check`
- all Node tests, including the prerender, navigation, accessibility, and live-motion regressions
- production build and release-consistency checks
- real Chrome runtime gate at 320, 390, 834, 1024, 1280, and 1440 widths
- keyboard, focus-trap, direct-link, reduced-motion-toggle, and clean-console checks
- three mobile and three desktop Lighthouse runs; median and every category rounded score must be 100, with no material layout shift
- public-repository safety and committed-whitespace guards
- exact built asset hashes recorded before publication
- GitHub Pages `build_type` verified as `workflow` before any new `main` deployment
