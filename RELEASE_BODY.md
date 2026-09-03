# V36 FRESH FIX · DATED EVIDENCE. HUMAN COMMAND.

**Fleet export date:** 2 September 2026
**Routing inventory date:** 2 September 2026
**Release revision:** 2 September 2026
**Validity window:** through 2 October 2026 in America/Chicago, or until the next owner-verified architecture change

V36 is a re-date of the public evidence against a fresh owner-run probe. Every published figure was measured on 2 September 2026: the fleet export, the routing inventory and, for the first time, three previously withheld figures (a 24 hour DNS query sample, backups verified inside 24 hours, and trailing 30 day AI operating cost). The Vite 6 + React 19 command console and its Bit-centered Dune/LCARS identity are unchanged. The Black Box Receipt evidence is reconciled to the 2 September fleet export (19 of 19 documented guests) and the 2 September routing inventory (10 public capability lanes and 22 private catalog entries).

## Locked public snapshot

| Item                        | V36 public state                                  |
| --------------------------- | ------------------------------------------------- |
| Proxmox VE                  | 9.2.11                                            |
| Containers                  | 19 of 19 at 2 Sep probe · Zeus 13/13 · Apollo 6/6 |
| Hosts                       | 2 online · quorate at the 2 Sep probe             |
| Public capability lanes     | 10 · routing inventory 2 Sep                      |
| Private catalog entries     | 22 · routing inventory 2 Sep                      |
| Owner-confirmed lane labels | Gemini 3.7 Flash · Grok 4.6 · Sonar Pro           |
| DNS queries, trailing 24h   | 226,783                                           |
| Backups inside 24h          | 18 of 19                                          |
| AI cost, trailing 30 days   | $25.07                                            |
| Withheld                    | Cost per day · automation jobs · security updates |

## Release boundaries

- Starts on SNAPSHOT with no loading or ENGAGE gate.
- Audio is effects-only, off by default, and plays airframe cues only after deliberate pip or lineage selections. There is no first-gesture blast, passive-scroll audio, continuous bed, overlap, or licensed franchise stem.
- Real-airframe cues use a traceable public-domain government recording or intentional silence; fictional transitions are original. Full attribution and edit notes ship in `public/sfx/provenance.json`.
- E.V.E. remains browser-local, read-only, and limited to the dated export.
- No tracking, analytics, cookies, production API calls, private addresses, ports, credentials, access paths, or live-looking counters.
- `/lab.html` redirects to `/`; `/command.html` remains the explicitly marked May 2026 historical archive.
- GitHub Pages deploys `dist` through `.github/workflows/pages.yml` with root base `/`.

## Verification

```text
npm ci
npm run verify
```

`npm run verify` is the authoritative local gate: lint, format check, Node tests, build, the real runtime layout gate (`npm run check:layout:runtime`), release tests, public-repository safety, release consistency, and committed-whitespace verification.

Publishing remains gated on owner approval, PR review, merge, Pages completion, cache purge, and live HTTPS verification.
