# Changelog

All notable public-facing changes to the ZeusApollo portfolio are recorded here. Visible dates use MM-DD-YYYY.

## [v31] — 07-26-2026

Release name: “The Iron Ascendant.”

### Added — fidelity pass

- Procedural-noise cinema: the journey sun now has a boiling plasma surface (SVG fractal turbulence + displacement, slow SMIL drift), heat shimmer rises off the dune horizon, and a full-page animated film-grain layer makes the deck read like projected footage. All of it disappears under FX-off and reduced motion.
- Journey scene composition: rotating corona spokes and chromatic limb on the sun, an original ringed-companion SVG with scroll parallax, a sunlight shaft with floating dust motes, gold rim light and atmospheric haze on the horizon.
- Fixed the header collision where the brand subtitle could run beneath the primary nav; enlarged the journey depth readout.
- Secondary pages (`/ai`, `lab.html`) bumped to the v31 release identity.

### Verified

- Container figures re-verified live over cluster SSH on 07-26-2026: 17 of 18 core containers running, 1 stopped in a storage maintenance operation at verification time; cluster quorate with the Athena quorum device answering. The public host split was corrected to zeus 12 / Apollo 6 (previously shown as 11 / 7). Automation health remains Hermes-reported (71 of 71 at the 07-22-2026 report). Per the standing order: the number we publish is the number we measured.

### Added — eleven pass II

- Ops data ticker above the footer: one continuous masked stream of the real verified numbers (containers, automations, lanes, cost, export date, Graphify nodes) — pauses on hover, parked when FX is off.
- Section-head materialize: chapter titles now wipe in with a focus-pull (clip-path + blur) instead of a plain fade.
- Hermes console self-test: the first time the console chapter is approached, the terminal types its own two-line diagnostic before the visitor touches it.
- Rare deck-status signal glitch: every 40–75 seconds the hero readout bar jitters with chromatic fringing for a quarter second — ambient life, motion-gated.
- Cursor aurora: a soft cyan-violet light that follows the pointer across the whole deck (desktop, FX-gated).

### Added — eleven pass

- Cinematic letterbox bars that sweep in on arrival and frame every warp jump.
- **The Iron Ledger**: five rolling odometers under the Iron (30 build iterations, 18 containers, 71 automations, 10 lanes, 353,437 Graphify nodes) with slot-machine digit strips that roll when scrolled into view.
- "Rack another set" control on the Iron — replays the plate drop and counts your sets.
- Scroll-linked hero camera pull: the opening scene eases up and fades as the visitor descends, like a crane shot leaving the deck.
- Magnetic primary buttons (composed via the `translate` property so no existing transform is disturbed).
- Opt-in ambient deck hum behind the SND toggle: a 54 Hz root-and-fifth pad with a slow LFO swell, faded in and out, never audible unless sound is on.
- The House crest is now drawn onto the shareable Fleet Card PNG.

### Added — visual chrome pass

- **THE IRON**: an original SVG asset in the Operator chapter — a barbell loaded with six labeled plate-pairs (hardware · network · storage · models · policy · proof) that rack one by one on reveal with a periodic shine sweep. The "lift the iron" doctrine, drawn.
- **House Cashio crest**: an original SVG sigil (hex shield, orbit, bolt) as an operator-card watermark and footer mark.
- **HUD corner brackets** on nineteen major surfaces (proof cells, lab consoles, clusters, project cards, terminal, chain console, fleet card) — a single injected element per surface that tightens and brightens on hover.
- Cinematic section seams: the flat hairline between chapters is now a centered glowing divider with a soft bloom.
- Subtle chromatic split on the hero wordmark under FX.

### Added

- **Policy Routing Lab** (new chapter 03): the doctrine made playable. Visitors pick one of six workloads and watch the quality gate qualify, refuse, and select a lane across the ten configured routes—with refusal reasons stated per lane and a relative-cost comparison. Privacy is demonstrated as a hard gate: private context refuses all eight hosted lanes and routes to local Gemma. Costs are a labeled relative index, never a fabricated per-task dollar figure.
- **Featured builds** (new chapter 07): the seven public-safe projects were promoted out of a collapsed bullet list into a showcase with headline metrics (Graphify's 353,437 nodes now reads as a headline instead of buried text).
- **The Operator** (new chapter 09): the portfolio previously contained no person. Adds who Doug is and the four-step working method, sourced only from claims already established on the site.
- New console commands `lab`, `route`, `operator`, `builds`; palette and Bit guide entries for all three new sections.

### Changed

- Chapters renumbered 01–11 and every navigation surface (primary nav, mobile nav, mission spine, Bit panel, command palette) updated to match the new journey.
- Removed six orphaned, unreferenced assets (`webgl_starfield.js`, `audio_engine.js`, `lcars_hover.wav`, `warp.mp3`, `make_it_so.mp3`, `og-image.png`).
- Corrected the stale `$0.35` daily-cost example remaining in the protection-guide docs to the measured `$0.26`.

### Notes

- The routing lab's cost bars use a validated status palette (chosen / qualified / refused) rather than per-lane categorical hues: the site's gold and orange differ by only ΔE 9.5 to normal vision and can never sit adjacent in a chart. State is carried by text labels and a legend, never color alone.

## [v30 polish] — 07-23-2026 / 07-24-2026

### Added — 07-24 apex port (from the v31 prototype)

- Bit is now a deck guide: clicking Bit opens a local panel of suggested questions that fly the visitor to the mission, journey, proof, chain, fleet, console, card, or contact — with the classic yes/no toy preserved as its own easter-egg button and an honest "Is the data live?" answer.
- Mission spine: a fixed progress rail of section dots with hover labels and a live current-section marker (desktop only).
- Ambient topography contour layer behind the deck; cluster-wide fleet scan sweep when the topology powers on.
- Corrected the daily-cost example in the protection guide docs to the measured $0.26.

### Added — 07-24 cinematic pass

- Sample-based LCARS interface sound set (click, success, sequence, warp, red-alert klaxon) from repo-hosted assets, loaded only when sound is enabled, with the synth engine as automatic fallback.
- Fleet topology "starmap": animated canvas with curved data links and traveling packets between Zeus, Apollo, and Athena, radar pings, cluster count-up on power-up, per-container breathing status lights, and hover states.
- Athena edge upgrade: animated signal bars and an "Edge link active" state readout.
- Hyperspace starfield burst on every warp pulse; slow-drifting hero nebulas.
- Easter eggs for the observant: the Konami code triggers a Guild Navigator spice overload, and the console understands make it so, engage, red alert, tea earl grey hot, end of line, greetings program, fear/litany, kwisatz haderach, pantheon, konami, and xyzzy.
- Bit companion moved inboard with its answer bubble anchored on-screen (it previously clipped off the right edge on hover).

### Changed — 07-24

- `command.html` archive is now noindexed and removed from the sitemap; `lab.html` labels its link to it as the v21 archive.

### Added

- Local command palette (Ctrl+K / ⌘K, `palette` console command, chip): fuzzy jump to any section and one-keystroke access to the mission, event chain, Fleet Card, toggles, and console commands — fully local, zero network calls.
- Route-spectrum lane inspector: hovering the hero routing spectrum names each of the ten quality-gated lanes.
- Hermes console typewriter output with motion-safe caret; full text is exposed immediately to assistive technology.
- Identity decrypt reveal on the hero wordmark and scroll-velocity warp streaks in the starfield (both FX- and reduced-motion-gated).
- Animated data packets on the fleet architecture bus.

### Changed

- Typography is now fully self-hosted from `/fonts`; the Google Fonts dependency was removed and the Content Security Policy tightened accordingly.
- `lab.html` refreshed from stale v28 figures to the verified v30 export (18 containers, 10 lanes, 71 jobs, $0.26/day observed).
- `command.html` reframed as a clearly labeled v21.2a historical archive; view-time randomized counters were replaced with fixed, labeled period samples per the "never fake a number" standing order.
- The hidden `/ai` deck's assessment CTAs now open a working email request instead of pointing at a page that was never published.
- Sitemap `lastmod` dates refreshed.

## [v30] — 07-22-2026

### Added

- Interactive business-value constellation translating the lab into efficiency, continuity, governance, and adoption outcomes.
- Reactive sovereign decision engine and local proof-fabric console visualization tied to user-selected signals and commands.
- Sovereign AI art direction centered on quality-first routing, measured operating economics, human command, animated signal meters, and a matching social-preview card.
- Cinematic House Cashio proof flight, signal-field event demo, accessible local console, downloadable Fleet Card, and expanded closing channel.
- Upgraded Bit companion, audience-directed mission flow, richer responsive states, and reduced-motion-safe animation controls.
- Verified Kimi K3, Gemini 3.6 Flash, Sonar Pro, GPT-5.6 Sol, local Gemma, and gateway-fabric lanes with official provider-documentation links.
- Seven public-safe featured projects and the four-tier Escalation Cascade architecture.
- Public metadata, canonical domain metadata, and social-sharing copy for cashio.us.

### Changed

- Refreshed the Hermes public-safe snapshot to 18 of 18 containers running and 71 of 71 automations healthy with zero errors.
- Reframed verified AI spend around the measured $0.26/day cost and $6.49 estimated monthly run rate while keeping quality-gated routing and operational reliability as the public proof.
- Reconciled Athena as an owner-confirmed active physical Home Assistant edge node, shown separately from the 18-container core count.
- Set the public evidence window to 30 days or the next architecture change and separated the always-current review date from the telemetry date.
- Standardized visible dates to MM-DD-YYYY and aligned repeated metrics to one public-safe status object.

### Security and privacy

- Preserved the public/private boundary: no addresses, ports, credentials, customer data, private access paths, or employer-confidential material.
- Removed live infrastructure behavior; interactive demonstrations and card rendering remain browser local.
- Retained a restrictive Content Security Policy, reduced-motion handling, keyboard support, semantic labels, and automatic stale-state presentation.

### Operational notes

- GitHub Pages continues to publish from `main` at `https://cashio.us`.
- `index.html`, `status.json`, `README.md`, `RELEASE_BODY.md`, and the release-consistency checker share the same v30 public baseline.

## [v28] — 07-02-2026

### Added

- Downloadable Fleet Card and interactive command-deck navigation.
- Earlier seven-lane model-routing view and public-safe topology.
- Initial normalized release documentation and privacy-preserving status sample.

### Security

- Added public telemetry boundaries and automated repository safety review.
- Removed conflicting private topology and credential-adjacent details from the active public presentation.
