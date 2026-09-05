# cashio.us V36 — THE HUMAN RECKONING

Doug Cashio’s interactive universe of AI, security, and owned infrastructure. The homepage features an explorable 3D starship, seven interactive studies, an animated Cashio identity, and accessible motion controls.

The release name is original, inspired by the Butlerian Jihad in Frank Herbert’s _Dune_: powerful tools, with human judgment in command. The reference is an inspiration, not a quoted or canonical book title.

## Routes and evidence

- `/` is the prerendered, indexable V36 homepage.
- `/odyssey.html` remains a compatible alias, canonicalized to `/`.
- `/command-deck.html` preserves the V35 command deck. Existing `/#deck=…` bookmarks redirect there with their query and selected deck intact.
- `/command.html` remains the explicitly marked May 2026 historical archive.
- `/site-release.json` describes the software release; `/event-horizon-release.json` is an identical compatibility alias.

The public fleet export remains dated **28 August 2026**, valid through **27 September 2026** in America/Chicago. Routing inventory remains separately dated **21 August 2026**. Both `status.json` snapshots are unchanged; a new website release does not establish current infrastructure state. Simulations are illustrative and send nothing to an AI service.

## Supported local commands

```powershell
npm ci
npm run verify
```

Verification covers lint, formatting, source and model tests, the production build, artifact contracts, both browser experiences, public-repository safety, release consistency, and committed whitespace. Browser gates use Chrome 147 in CI; local verification can use `CHROME_PATH`.

GitHub Pages publishes only the verified `dist` artifact through `.github/workflows/pages.yml`. Pages must use GitHub Actions. Custom domain: `cashio.us`. Repository deployment does not alter DNS or Cloudflare zone policies. The reproducible audio tool remains available as `python scripts/build_audio_cues.py`.
