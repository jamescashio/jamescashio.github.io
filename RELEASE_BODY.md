# V36 GREEN BOARD · DATED EVIDENCE. HUMAN COMMAND.

**Fleet export date:** 31 August 2026
**Routing inventory date:** 21 August 2026
**Release revision:** 31 August 2026
**Validity window:** through 30 September 2026 in America/Chicago, or until the next owner-verified architecture change

V36 turns the board green. A fresh owner-run read-only probe on 31 August 2026 re-verified the fleet with figures identical to the 28 August export: 18 of 19 documented guests running, Zeus 12/13, Apollo 6/6, two Proxmox hosts online and quorate on 9.2.11. The routing inventory keeps its separate 21 August date because its source was not re-measured. The release also repairs the deployment path itself — viewscreen stage notifications are now edge-triggered so the settlement gate passes deterministically on every runner, and pull requests now certify layout on the exact pinned browser the deploy gate uses, so a green PR can no longer strand a red deploy. The Evidence Locker gains a Ship's Log: every superseded deck stays reachable through its archive marker, named without republishing a superseded figure, and the E.V.E. console recites the same canonical release line on `log`.

## Locked public snapshot

| Item                        | V36 public state                                   |
| --------------------------- | -------------------------------------------------- |
| Proxmox VE                  | 9.2.11                                             |
| Containers                  | 18 of 19 at 31 Aug probe · Zeus 12/13 · Apollo 6/6 |
| Hosts                       | 2 online · quorate at the 31 Aug probe             |
| Public capability lanes     | 10 · routing inventory 21 Aug                      |
| Private catalog entries     | 36 · routing inventory 21 Aug                      |
| Owner-confirmed lane labels | Gemini 3.7 Flash · Grok 4.6 · Sonar Pro            |
| Cost                        | Withheld                                           |

## Release boundaries

- Starts on SNAPSHOT with no loading or ENGAGE gate.
- Audio is effects-only, off by default, and plays airframe cues only after deliberate pip or lineage selections. There is no first-gesture blast, passive-scroll audio, continuous bed, overlap, or licensed franchise stem.
- Real-airframe cues use a traceable public-domain government recording or intentional silence; fictional transitions are original. Full attribution and edit notes ship in `public/sfx/provenance.json`.
- E.V.E. remains browser-local, read-only, and limited to the dated export.
- No tracking, analytics, cookies, production API calls, private addresses, ports, credentials, access paths, or live-looking counters.
- `/lab.html` redirects to `/`; `/command.html` remains the explicitly marked May 2026 historical archive; `/grid.html` and `/index-v44.html` remain archive markers, now linked from the Ship's Log.
- GitHub Pages deploys `dist` through `.github/workflows/pages.yml` with root base `/`.

## Verification

```text
npm ci
npm run verify
```

`npm run verify` is the authoritative local gate: lint, format check, Node tests, build, the real runtime layout gate (`npm run check:layout:runtime`), release tests, public-repository safety, release consistency, and committed-whitespace verification.

Publishing remains gated on owner approval, PR review, merge, Pages completion, cache purge, and live HTTPS verification.
