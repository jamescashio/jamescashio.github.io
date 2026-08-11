## v31 — “The Grid”

**Release date:** 08-10-2026

**Public status window:** 08-10-2026 through 09-09-2026, or until the next architecture change

v31 rebuilds the cashio.us front page around a live Dyson-swarm viewscreen and resets every published figure to the owner-verified 08-10-2026 architecture snapshot. Figures that could not be freshly measured were removed rather than carried forward.

The deck is framework-free: vanilla HTML, CSS and JavaScript on the ZeusApollo design system, with three.js self-hosted so the production Content Security Policy needs no third-party origin.

### Experience

- Nine decks: 00 Snapshot, 01 The Grid, 02 Routing, 03 The Iron, 03B Lineage, 04 Builds, 05 Operator, 06 E.V.E., 07 Contact.
- A new WebGL viewscreen (`<dyson-stage>`): a star under a partially built Dyson swarm — collector rings, an unfinished shell lattice, a shipyard throwing construction beams, a grid horizon and a starfield. The camera flies waypoints driven by scroll, with damped pointer parallax.
- Deck 03B “Lineage” is new: Yeager, Johnson and Rutan as an interactive record card, with the operating rule taken from each.
- The Grid is a selectable nineteen-node fleet ring; Routing is a ten-lane charter with a live routing trace; The Iron racks all six plates on entry.
- Deck 06 is E.V.E. — the Evaluation Verification Engine console. Local, read-only, no network calls, answering from the same dated snapshot published on the page.
- Bit returns as the deck-guide companion, calling each deck as it comes into view.
- Deck audio is synthesized in WebAudio with no audio files and no ambient bed — discrete effects only, muted until the operator arms it.
- Reduced motion renders a complete still page: the viewscreen holds a single frame, the plates rack instantly, and the routing trace resolves without animation.

### Public status reconciliation

| Metric | v31 public snapshot |
|---|---:|
| Core hosts | 2 |
| Cluster state | Quorate |
| Documented service roles | 19 |
| Verified containers running | 19 of 19 |
| Maintenance | 0 containers stopped at verification time |
| Public capability lanes | 10 |
| Private model catalog entries | 36 |
| Athena | Owner-confirmed active physical Home Assistant edge node and cluster quorum device; outside container count |
| Atlas | Standalone LiteLLM gateway and local-inference host; outside Proxmox quorum and container count |

Container and service figures come from an owner-run live verification over cluster SSH on 08-10-2026. Public capability lanes and private model catalog entries count different objects and are never merged. The interface stops presenting health as current after 09-09-2026 or the next architecture change.

### Withdrawn figures

Five classes of figure were removed from every published surface and will not return without a fresh, dated measurement: AI operating cost per day and per month, automation job counts, DNS query sample figures, backup recovery telemetry, and security update counts. Nine retired service and topology references were purged alongside them; `CHANGELOG.md` names each one.

`scripts/check_release_consistency.py` now fails the build if any of them reappear. The retired tokens themselves live only in that checker and in the changelog, so the guard cannot be satisfied by a surface that merely quotes them back.

### Model routing

The ten public capability lanes are Kimi K3, DeepSeek V4 Flash, DeepSeek V4 Pro, Gemini 3.6 Flash, Grok 4.5, Sol 5.6 Luna, Sonar Pro, GPT-5.6 Sol, local Gemma 4 26B, and the Atlas/OpenRouter/ZenMux gateway fabric. The Atlas LiteLLM gateway is operational with DeepSeek V4 Pro and V4 Flash routes available.

### Archives

Previous releases stay reachable with their figures frozen as historical: `/grid.html` (V31 stage one, the 1982 grid), `/index-v44.html` (v44 “Aurora”), and `/command.html` (v21.2a, banner-marked as an archived build).

### Security, privacy, and employer boundary

- No private addresses, ports, credentials, access procedures, customer data, or employer-confidential material are included.
- Service roles are public-safe descriptions rather than deployment instructions.
- Interactive demonstrations do not contact live infrastructure.
- Public contact information is limited to the cashio.us domain and professional-profile links.
- All runtime dependencies are self-hosted; `connect-src` remains `'none'`.
