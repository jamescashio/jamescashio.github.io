# Changelog

This file records the canonical public release line for cashio.us. Visible dates use MM-DD-YYYY. Unpublished prototype numbering is intentionally omitted; Git history retains those experiments without presenting them as releases.

## [v35] — 08-30-2026

Release name: "ALL TENS." A quality pass against the nine category audit of the live V34 build. No published figure changes: the dated export, the fleet counts and the routing inventory are exactly as verified on 28 August 2026, because no fresh measurement was taken.

### Changed

- The hero opens with one plain sentence before any operator shorthand, and the dated figure is stated once rather than repeated across the chrome.
- The header deck chip follows the deck the scroll has reached instead of the deck that was pressed, so the chrome and the content cannot disagree during a glide.
- The collapsed command rail previews each deck name and tag on hover, and the phone rail carries all nine decks on a scrolling strip.
- The corner heads up display stays anchored above the phone deck rail instead of jumping to the top of the screen, and the flight control moved out of the hero.
- The viewscreen stage arrives instead of appearing: the camera opens tight with the lens wide and pulls back into the conn while the plate dissolves through it.
- Bit offers the console once, after a quiet moment on the first deck.

### Added

- A branded 404 page, and archive markers at /grid.html and /index-v44.html so superseded release URLs stay reachable.
- A link to the source repository on the contact deck.
- Twenty console responses that are not listed in help, at console depth only.

### Performance

- Airframe one shots ship as Opus in WebM with the PCM originals kept as a fallback: 443 KB down to 24 KB. Provenance and the audio gates are unchanged.
- The four JPEG fallbacks behind the AVIF and WebP plates were re-encoded, saving 165 KB.

### Code

- The 1,801 line untyped viewscreen stage is now six typed modules under src/lib/stage, inside strict TypeScript and eslint with zero warnings. The release gates read the stage as a directory and tolerate formatter reflow.

### Boundaries

- Every published figure, date and boundary is carried forward unchanged. The stopped guest remains unnamed. Audio remains off until a visitor arms it.

### Polish — 09-02-2026

A visual pass on the live V35 build. No published figure changes: every count, date and boundary is exactly as verified on 28 August 2026.

- The viewscreen targeting frame (heading tape, scope, corner brackets, scan line and status banner) now stands down once the visitor leaves the snapshot deck and returns for the 30-second flight, so no headline, tile or lane list is drawn over on decks two through nine. Phones drop the corner brackets entirely.
- The Grid deck replaces twelve placeholder tiles with a fleet map: two host rings holding the nineteen documented guest slots (the stopped guest marked), the quorum core, and the seven observed role families on curved routes with packets in flight. Selecting a role family traces its route; roles are never attributed to a host. Phones get a portrait layout; reduced motion gets a still map.
- The hero status banner clears the airframe dossier at 1440 by 900, and the operator deck's leash list and signature yield the corner dossier like the rest of the deck copy.
- The withheld figures on the Iron deck read as an evidence rule with five held items rather than a red warning block, and the routing and iron ledes explain what to do on the deck in plain language.
- Displays wider than 1920 pixels center the decks instead of pinning them to the far left.

## [v34] — 08-28-2026

Release name: "MACH ONE." This preservation pass makes the public truth easier to read without broadening what it publishes.

### Changed

- Added the LinkedIn executive still (EXECUTIVE → ARM THE STILL): a 1.91:1 LCARS plate of the dated export, dismissed with Escape / EXIT STILL.
- Restaged viewscreen HUD, Hermes article-01 schematic, and acquisition bloom so the first five seconds read as a command console without changing palette, type, Bit, or nine decks.
- First-paint E.V.E. log height follows the viewport so `#deck=eve` canonical landing survives the Pages layout-runtime gate.

### Changed

- Replaced undated health language with a read-only, dated 28 August aggregate export: 18/19 guests running, Zeus 12/13, Apollo 6/6, and two online quorate hosts on Proxmox 9.2.11.
- Kept routing as a separate 21 August inventory: ten public lanes and thirty-six private catalog entries count different objects.
- Reframed Executive mode around Route Control, Evidence Boundary, and Human Authority; labeled Build Proof and Cashio Operating Lessons.

### Boundaries

- The stopped guest remains unnamed. No raw guest, storage, utilization, network, provider, or access-path detail is added.
- Contact wording and the Black Box Receipt remain unchanged; audio, motion, archive, and privacy boundaries remain intact.

## [v33] — 08-24-2026

Release name: "MACH ONE." This release preserves the V32 command-deck identity while making its proof journey easier to enter, share, read, and operate.

### Changed

- Added canonical deck and Deck 06 article hashes with back/forward restoration and deterministic fallbacks.
- Added the visible four-beat 30-second flight, exact owner-operator identity line, and dated Black Box Receipt.
- Strengthened dialog focus, control naming, mobile safe-area clearance, lazy images, and post-paint viewscreen loading.
- Split command chrome, navigation, shared deck primitives, flight control, and receipt UI into focused React modules.
- Added warning-free lint, deterministic formatting checks, and fail-closed PR and Pages release gates.
- Preserved the owner-verified 21 August 2026 snapshot and validity policy through 20 September 2026.

### Boundaries

- No redesign, new infrastructure claims, tracking, analytics, production API calls, private topology, credentials, automatic audio, or WebGL renderer rewrite.
- `/command.html` remains the noindexed historical archive; `/lab.html` continues to redirect to the current root console.

## [v32] — 08-23-2026

Release name: "MACH ONE." The public site moves to a Vite 6 + React 19 GitHub Pages artifact while preserving the dated, public-safe ZeusApollo truth contract.

### Changed

- Extended viewscreen warp with stronger bloom and an FOV kick on every airframe change.
- Added moving scan bands to the command, rack, operator, and fold plates.
- Increased deck reveal blur and travel; accelerated the ROUTE shimmer.
- Rebuilt Seven Test Articles as a flight-test recorder with a traversing proof route, deliberate target acquisition, staged article readouts, responsive controls, and a complete reduced-motion state.
- Replaced Falcon 9 with Burt Rutan's Scaled Composites Proteus, including a dedicated tandem-wing, twin-boom procedural airframe and intentional silence rather than an invented or generic turbofan recording.
- Added a credited NASA/ESPO Proteus flight-test evidence plate, a restrained recognition pose, factual Model 281 specifications, and clearer flight-test lineage copy.
- Corrected the static export's validity boundary so “through 20 September 2026” remains inclusive through the end of that Chicago calendar day.
- Made the corner airframe/Bit HUD compress when its full state would cover marked controls, and closed Hail with a concise human-command mission stamp.
- Kept airframe audio off by default and explicit-selection-only, with intentional silence for real aircraft lacking a verified source and three original non-franchise transitions.
- Updated the owner-confirmed multimodal and adversarial lane labels to Gemini 3.7 Flash and Grok 4.6; Sonar Pro remains the research lane.
- Kept the 21 August 2026 snapshot at 19 of 19 containers, two Proxmox hosts quorate, ten public lanes, and thirty-six private catalog entries.
- Kept GitHub Pages deployment in `.github/workflows/pages.yml` with Vite base `/`.

### Boundaries

- No loading or ENGAGE gate, Request a Review flow, tracking, analytics, cookies, production API calls, private addresses, ports, credentials, live-looking counters, score bed, passive-scroll audio, first-gesture blast, or licensed franchise stems.
- `/command.html` remains an explicitly marked May 2026 historical archive; `/lab.html` redirects to the current console.

## [v31] — 08-10-2026

Release name: "The Grid." The front page was rebuilt around a Dyson-swarm viewscreen and reset to the owner-verified 08-10-2026 public architecture snapshot: 19 of 19 containers running, two Proxmox hosts online, cluster quorate, ten public capability lanes, and thirty-six private model catalog entries.

### Added

- A self-hosted WebGL viewscreen and nine-waypoint deck flight.
- E.V.E., the local read-only Evaluation Verification Engine.
- Interactive Lineage and fleet-ring controls with keyboard operation.
- Release guards for withdrawn figures and public/private boundaries.

### Boundaries

- Effects audio remained opt-in and browser-local.
- `command.html` remained the noindexed May 2026 archive.
- Unmeasured operating, backup, DNS, and maintenance figures were omitted rather than presented stale.

## [v30] — 07-22-2026

- Introduced the quality-first routing view, verified public-safe topology, Fleet Card, local console, and seven featured public-safe projects.
- Standardized release surfaces around one status object and retained restrictive content security, reduced motion, keyboard support, and static public data.

## [v28] — 07-02-2026

- Added the initial seven-lane routing view, downloadable Fleet Card, public telemetry boundaries, and automated repository safety review.

## [v21.2a] — May 2026

- Preserved only as the clearly labeled, noindexed `command.html` historical archive. It does not describe the current fleet.
