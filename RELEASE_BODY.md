## v31.2 — “Fleet Awakening”

**Release date:** 07-24-2026

**Public architecture review:** 07-24-2026

v31.2 turns cashio.us into an interactive, cinematic proof deck for independently built enterprise AI, cybersecurity, automation, and sovereign infrastructure work.

### Experience

- Introduces a four-scene House Cashio proof flight with original space and Dune-inspired CSS visuals.
- Upgrades the Tron-inspired Bit companion while preserving its recognizable geometry.
- Adds a self-paced mission, observable event-chain demonstration, safe local console, synchronized fleet scene, and shareable Fleet Card.
- Moves Bit left and constrains its speech bubble and panel so every prompt remains visible.
- Adds opt-in fleet-synchronization sound, Athena’s active-state treatment, and public-safe command-deck Easter eggs.
- Preserves reduced-motion support, keyboard navigation, semantic structure, and responsive layouts.

### Public architecture reconciliation

| Metric | v31.2 public baseline |
|---|---:|
| Personal hosts | 2 |
| Documented service roles | 19 |
| Owner-reviewed active roles | 18, including Athena |
| Decommissioned services | 1 — Home-Asst |
| Configured model routes | 10 |
| Automation jobs | 31, last reported |
| Estimated daily inference burn | ~$0.35, last reported |

The inventory is owner reviewed and public safe. It describes architecture rather than live health and never exposes a remote-control path.

### Model routing

The configured routes are DeepSeek V4 Pro, Claude Sonnet 5, Grok 4.5, GLM 5.2, Gemma 4 26B A4B, Gemini 3.6 Flash, Grok 4.6 Voice TTS, and three named failovers. The route catalog was checked on 07-24-2026. Current official documentation confirms DeepSeek V4 Pro and V4 Flash, Claude Sonnet 5, Gemini 3.6 Flash, Grok 4.5, and the xAI Voice/TTS API. Grok 4.6 Voice TTS remains the owner-reported route label because xAI does not currently publish that numeric voice alias.

### Security, privacy, and employer boundary

- No private addresses, ports, credentials, access procedures, customer data, or employer-confidential material are included.
- Service roles are public-safe descriptions rather than deployment instructions.
- Interactive demonstrations do not contact live infrastructure.
- Public contact information is limited to the cashio.us domain and professional-profile links.
- The repository safety scan and release-consistency checks protect the public branch before publication.

---

*Built and operated by Doug Cashio as a personal, independent work sample.*
