# Cashio.us V34 Flight Recorder Design

## Objective

Ship the approved V34 preservation polish as the next public Cashio.us release. Preserve the Bit-centered Dune/LCARS command-deck identity while making the graphics clearer, the motion faster to read, the content more defensible, and every release surface internally consistent.

## Binding constraints

- The canonical release is `V34 MACH ONE`, package version `34.0.0`, revised `2026-08-28`.
- The evidence remains a dated public-safe snapshot verified `2026-08-21` and valid through the end of `2026-09-20` in `America/Chicago`. No new infrastructure number, provider claim, address, port, access path, or production telemetry may be introduced.
- Preserve all nine technical decks, Executive mode, canonical hashes, Back/Forward behavior, four-beat 30-second flight, craft lineage, Bit, opt-in audio, complete reduced-motion states, contact actions, Black Box Receipt, and the May 2026 `command.html` archive.
- Preserve existing React/Zustand/Three.js architecture. Add no heavy dependency, route, particle system, always-on audio, generic card redesign, or additional closing section.
- Behavior changes are test-first. Pure prose is reviewed against this spec; visual-only tuning is verified in the rendered browser and must not be protected by brittle source-text tests.
- Main remains protected: publication uses a public-safe pull request, successful safety checks, squash merge, successful Pages deployment, and exact live parity verification. Never force-push main.

## 1. Canonical truth and editorial hierarchy

Every public, repository, guard, and package surface agrees on V34. Public status language states the measurement boundary: use `19/19 AT 21 AUG PROBE`, `EXPORT VALID`, and `READ-ONLY`/`DATED EXPORT` language instead of undated `NOMINAL`, `ONLINE`, or bare `CURRENT` labels.

Snapshot lets telemetry carry the figures and uses its paragraph to state the consequence: owned compute, quality-first routing, dated evidence, and one accountable operator. Technical and Executive choices promise audience value rather than page count.

Executive mode organizes three outcomes: `ROUTE CONTROL`, `EVIDENCE BOUNDARY`, and `HUMAN AUTHORITY`. Routing keeps the quality-first title/subtitle and reduces the repeated explanation to a dated counting rule: public lanes and private catalog entries count different objects at the 21 August export.

Builds replaces universal `STATE · SHIPPED` with a defensible owner-built evidence label, replaces `STRONGEST BUILD` with `BUILD PROOF`, and bounds the autonomous article label. Lineage labels every interpretive rule as a `CASHIO OPERATING LESSON`. Operator copy is approximately half its current length and retains role, owner-operation, and human accountability. Contact wording and the Black Box Receipt remain unchanged.

## 2. Graphic and responsive polish

The corner airframe HUD yields before covering marked content and compresses to a clean airframe chip. It never truncates an airframe name or covers a deck control. Bit remains visible except on E.V.E., where the deck owns the console and global HUD stands down.

Critical telemetry is at least 10 px on desktop and 11 px on mobile. Text surfaces receive targeted opaque scrims where the stage competes with copy. Proteus exposure/bloom is reduced until its tandem-wing/twin-boom silhouette reads immediately. Cyan remains system/evidence, amber selection/lock, and red is reserved for real alerts.

At common 1280x720 laptop height, E.V.E.’s prompt is in the first viewport. At 390 px and 320 px, Snapshot mode controls, CTA, status copy, and Bit occupy separate safe zones without horizontal overflow.

## 3. Semantic motion

Chrome/header state resolves immediately. General deck copy resolves within 300–450 ms. Article acquisition resolves within 450–620 ms. Stage warp may decay for up to 700 ms, but it never repeatedly blurs copy.

Each deck has one dominant motion story. Secondary packet, ticker, heartbeat, scan, and canvas animation pauses or stands down while its deck is inactive. User selection is never changed by ambient motion.

The stage remains intent-gated, capped at adaptive 30 fps, paused in hidden tabs, backed by the real poster, and complete in reduced motion. Audio remains off by default and responds only to deliberate controls.

## 4. Acceptance and go-live

- All focused RED tests fail for the intended missing behavior before implementation, then pass GREEN.
- Full Node, TypeScript/Vite, Python, public-safety, release-consistency, formatting, lint, and whitespace gates pass on the final commit.
- Browser QA passes at 1440x900, 1280x720, 390x844, and 320 px for Snapshot, Builds, Lineage, Operator, E.V.E., and Contact; deep links/history, keyboard/focus, audio-off, reduced motion, active flight, and clean console logs remain intact.
- Lighthouse is sampled three times per mode. Investigate any median regression greater than 3 performance points or mobile TBT above 200 ms; never claim every metric improved unless the measurements prove it.
- A fresh independent whole-branch review finds no unresolved Critical or Important issue.
- After GitHub re-authentication, publish through the protected PR/squash/Pages flow and verify HTTPS, CNAME, status bytes, deep links, console, and SHA-256 parity of deployed assets.
