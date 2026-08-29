# V34 MACH ONE — DATED EVIDENCE. HUMAN COMMAND.

**Fleet export date:** 28 August 2026
**Routing inventory date:** 21 August 2026
**Release revision:** 28 August 2026
**Validity window:** through 27 September 2026 in America/Chicago, or until the next owner-verified architecture change

V34 preserves the Vite 6 + React 19 command console and its Bit-centered Dune/LCARS identity while making the public truth more legible: dated aggregate evidence, separate routing provenance, Executive outcomes, Build Proof, and Cashio Operating Lessons. Audio remains restrained and opt-in. Contact wording and the Black Box Receipt are unchanged.

## Locked public snapshot

| Item                        | V34 public state                                   |
| --------------------------- | -------------------------------------------------- |
| Proxmox VE                  | 9.2.11                                             |
| Containers                  | 18 of 19 at 28 Aug probe · Zeus 12/13 · Apollo 6/6 |
| Hosts                       | 2 online · quorate at the 28 Aug probe             |
| Public capability lanes     | 10 · routing inventory 21 Aug                      |
| Private catalog entries     | 36 · routing inventory 21 Aug                      |
| Owner-confirmed lane labels | Gemini 3.7 Flash · Grok 4.6 · Sonar Pro            |
| DeepSeek routes             | `deepseek-v4-flash` · `deepseek-v4-pro`            |
| Atlas                       | Gateway and local inference · not a Proxmox host   |
| Cost                        | Withheld                                           |

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
npm run lint
npm run format:check
npm test
npm run build
python scripts/public_repo_guard.py
python scripts/check_release_consistency.py
python -m unittest tests.test_v32_release
```

Publishing remains gated on owner approval, PR review, merge, Pages completion, cache purge, and live HTTPS verification.
