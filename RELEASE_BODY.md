# V47 AWE — OWN THE IRON AND THE ROUTE.

**Snapshot date:** 21 August 2026 at 15:39 CDT
**Validity window:** through 20 September 2026, or until the next owner-verified architecture change

V47 publishes the supplied Vite 6 + React 19 command console through GitHub Pages Actions. The release extends the viewscreen warp and FOV kick, adds plate scan bands, increases deck-reveal travel and blur, accelerates the ROUTE shimmer, and replaces the involuntary craft bus with restrained opt-in selection audio. It does not redesign the locked console.

## Locked public snapshot

| Item | V47 public state |
|---|---|
| Proxmox VE | 9.2.11 |
| Hosts | 2 online · quorate |
| Containers | 19 of 19 · Zeus 13 · Apollo 6 |
| Public capability lanes | 10 |
| Private catalog entries | 36 |
| Owner-confirmed lane labels | Gemini 3.7 Flash · Grok 4.6 · Sonar Pro |
| DeepSeek routes | `deepseek-v4-flash` · `deepseek-v4-pro` |
| Atlas | Gateway and local inference · not a Proxmox host |
| Cost | Withheld |

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
npm install
npm run build
node --test tests/audio-policy.test.mjs
python scripts/public_repo_guard.py
python scripts/check_release_consistency.py
python -m unittest tests.test_v47_release
```

Publishing remains gated on owner approval, PR review, merge, Pages completion, cache purge, and live HTTPS verification.
