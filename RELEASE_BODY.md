## v39 — “Aurora”

**Release date:** 07-30-2026

**Public status window:** 07-30-2026 through 08-29-2026, or until the next architecture change

v39 renders the deck. The background stops being decoration and becomes a live WebGL scene — a star with three station rings around it, lit by its own photosphere and cut by god rays through the structure. Every texture is generated in code at load, so the page still fetches nothing. Same eight decks, same palette, same figures.

What v32 established: Eight decks replace the eleven-chapter scroll, the Iron becomes an automatic deck-entry signature moment rather than a hover state, and the whole page ships as a real static site instead of one half-megabyte file — with container figures re-verified live over cluster SSH on release day.

### Experience

- Eight decks: 00 Viewscreen, 01 The Grid, 02 Routing, 03 The Iron, 04 Builds, 05 Operator, 06 Console, 07 Hail.
- The Iron is the signature moment: entering its deck racks all six plates automatically, and the completed set remains directly inspectable and replayable.
- The Grid is a draggable fleet lattice; Routing is a selectable ten-lane charter; the Console is a local read-only narrative interface that opens no sockets and holds no credentials.
- Bit is a live canvas companion rendering a stellated icosahedron; the LCARS sound set is synthesized in WebAudio, so the front page loads no audio files at all.
- Motion is GSAP 3.15 with ScrollTrigger and SplitText over Lenis smooth scroll. Reveals run off an IntersectionObserver with a visibility guard, so a dropped trigger cannot leave content invisible.
- Ships as `index.html` plus `assets/{css,js,fonts,img}`; about 299KB gzipped, down from 492KB. Nothing is fetched from a CDN at runtime.
- Zero axe violations against WCAG 2.1 AA; zero console errors, failed requests or misplaced anchors verified at 1440, 834 and 390.

### Public status reconciliation

| Metric | v32 public baseline |
|---|---:|
| Core hosts | 2 |
| Documented service roles | 19 |
| Owner-reported healthy services | 19 |
| Verified containers | 19 of 19 running at the 07-30-2026 live check; 0 in maintenance |
| Backup chain | 18 of 19 inside 24 hours at verification time |
| Patch posture | 0 security updates due at verification time |
| Athena | Owner-confirmed active physical Home Assistant edge node and cluster quorum device; outside container count |
| Atlas | Standalone local Ollama inference host; outside Proxmox quorum and container count |
| Configured model routes | 10 |
| Automation jobs | 71, last reported |
| Automation health | 71 of 71 at last Hermes report (07-22-2026); zero errors |
| Observed AI operating cost | $0.26/day; $6.49 estimated monthly run rate; quality-first escalation retained |

Container figures come from an owner-run live verification over cluster SSH; automation and cost figures are Hermes-generated, public-safe, and sampled—not streaming telemetry. The interface automatically stops presenting health as current after 08-29-2026 or the next architecture change.

### Model routing

The ten-lane fabric includes Kimi K3, DeepSeek V4 Flash, DeepSeek V4 Pro, Gemini 3.6 Flash, Grok 4.5, Sol 5.6 Luna, Sonar Pro, GPT-5.6 Sol, local Gemma 4 26B, and the Atlas/OpenRouter/ZenMux gateway layer. Hermes verified names, priorities, fallbacks, and provider state on 07-22-2026.

### Security, privacy, and employer boundary

- No private addresses, ports, credentials, access procedures, customer data, or employer-confidential material are included.
- Service roles are public-safe descriptions rather than deployment instructions.
- Interactive demonstrations do not contact live infrastructure.
- Public contact information is limited to the cashio.us domain and professional-profile links.
- The root logic ships as a first-party precompiled factory, so the page-level CSP does not require `'unsafe-eval'`. Scripts stay self-hosted and `connect-src` remains `'none'`, so the page opens no sockets.
- The repository safety scan and release-consistency checks protect the public branch before publication.

---

*Built and operated by Doug Cashio as a personal, independent work sample.*
