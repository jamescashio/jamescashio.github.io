# Cashio.us V34 Preservation Pass Design

## Objective

Implement the approved 2026-08-28 Cashio.us audit recommendations as a local preview while preserving V33 MACH ONE's Bit-centered Dune/LCARS command-deck identity. Production, `origin/main`, and the live site remain unchanged.

## Binding constraints

- Preserve the current content, nine-deck information architecture, craft lineage, colors, typography, Bit, opt-in audio policy, reduced-motion behavior, and public-safe dated claims.
- Make targeted repairs; do not replace the site with a generic redesign.
- Keep every existing deep link, Back/Forward path, 30-second flight beat, E.V.E. command, and contact action working.
- Implement behavior changes test-first and visually compare the preview against the accepted audit screenshots.
- Do not push, merge, publish, or change Cloudflare/GitHub Pages configuration in this pass.

## Design

### 1. Stable logical deck through responsive reflow

The active deck is logical navigation state. A resize may change section geometry, but it must not be interpreted as user navigation.

When a resize starts, capture the active deck, enter the existing programmatic-scroll suppression state, debounce until layout settles, and re-anchor the scroller to the same deck. Intermediate geometry candidates may update progress and reveal state, but may not replace the logical deck or URL. Genuine wheel, pointer, touch, key, or explicit navigation still cancels suppression.

Success: resizing `#deck=contact` from 1440×900 to 390×844 without input leaves the URL, header, store, and visible destination on Contact.

### 2. Explicit accessible state and destination focus

Technical/Executive controls expose `aria-pressed`. Every deck navigation surface exposes exactly one `aria-current="page"`. Accessible names retain the visible `GO` and `AUDIO OFF/ARMED` wording. The E.V.E. input receives a visible focus ring.

Escape/outside dismissal of the Deck Navigator restores its opener. Selecting a destination is different: it closes the dialog and, after navigation settles, focuses the destination deck heading so the new context is announced.

### 3. Collision-safe, readable responsive composition

The collapsed 68 px desktop rail must contain its flight control. It shows a compact `30S` control while retaining the full accessible name; the expanded rail keeps the full label and active flight detail.

Mobile decks receive enough top clearance for the flight control. Contact copy receives an opaque-gradient scrim using the existing palette, with stronger protection below 768 px. Receipt and mission microtype becomes readable without changing wording. On mobile Builds, the selected article/detail and selector precede the proof map; the selector becomes a contained horizontal snap strip so the page itself never overflows.

### 4. Faster first interaction without removing the cinematic stage

The stage chunk is already split; synchronous Three.js initialization is the measured blocker. This pass keeps the complete renderer but removes its eager second-frame idle start. A real existing command-deck image is shown immediately, and the stage loads after deliberate pointer, keyboard, wheel, or touch intent. A long bounded fallback preserves the experience for a stationary visitor. The poster fades away when the live stage is ready.

The always-running sound meter loop runs only while audio is armed. Bit and the viewscreen cap redundant high-frequency work while retaining smooth motion and the reduced-motion single-frame path.

Ruling: incremental per-aircraft renderer construction is deferred because it would restructure the untyped 1,763-line renderer and risks craft-transition parity. The reversible intent-gated stage load is implemented and measured first. If the preview still misses the performance target, aircraft batching becomes the next isolated pass.

### 5. Windows portability

Add a repository `.gitattributes` policy that keeps source text LF on Windows while leaving binary assets untouched. This prevents a default Windows checkout from producing false formatting failures.

## Verification

- RED/GREEN regression coverage for responsive deck preservation, active states, dialog destination focus, compact flight control, and stage scheduling.
- Full `npm run verify`, with the production build run outside the restricted sandbox only when required.
- Local Lighthouse mobile and desktop measurements, compared with the V33 baseline of 65/61.
- In-app browser QA at 1440×900, 390×844, and 320 px for Snapshot, Builds, E.V.E., Contact, navigation history, dialog focus, audio-off default, reduced motion where the browser supports it, and clean console logs.
- Side-by-side visual comparison against the nine accepted audit captures.
