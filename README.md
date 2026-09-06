# cashio.us V37.3 — Lensing

Doug Cashio’s interactive universe of AI, security, and owned infrastructure. Lensing is the V37.3 edition of **THE HUMAN RECKONING**, crafted with GPT-6 Astra under Doug’s direction.

Enter the Lensing Observatory to explore an original 3D planet, machined orbital gate, and courier traffic. Choose three light treatments and camera views, or take a finite 24-second journey with pause and manual chapter controls. Orbital arrival adds an optional five-second Higgsfield film, delivered as a locally hosted 1080p clip. It opens on a still poster, plays only on request, never loops, and pauses when hidden.

First Flight is an optional guided starship journey. Four chapters move from arrival to the onboard core, connection loss, and a human permission decision. Visitors can change the illustrative scenario, follow the same twelve requests between routing bays, and share the exact settings. Flight controls adapt to phone and tablet screens; exploration remains available without taking the tour.

The Living Circuit viewer preserves the owner’s animated Cashio artwork. Explore six letters with touch or keyboard, change the presentation, or send a circuit pulse from the selected letter. The operator insignia responds with a finite orbital sequence. A cyan section plane reveals the ship’s onboard modules, armor, and service bays; selecting Onboard AI frames the exposed hardware. The opening orbital instrument aligns before a visitor-triggered lightfold transition.

Motion follows the visitor’s system preference and global pause control. Effects suspend offscreen and in hidden tabs, and audio requires explicit opt-in. Original orbital artwork, responsive ship stills, and a prerendered first view keep the experience useful while interactive modules load.

The release name is original, inspired by the Butlerian Jihad in Frank Herbert’s _Dune_: powerful tools, with human judgment in command. The reference is an inspiration, not a quoted or canonical book title.

## Routes and evidence

- `/` is the prerendered, indexable V37 homepage.
- `/odyssey.html` remains a compatible alias, canonicalized to `/`.
- `/command-deck.html` preserves the V35 command deck. Existing `/#deck=…` bookmarks redirect there with their query and selected deck intact.
- `/command.html` remains the explicitly marked May 2026 historical archive.
- `/site-release.json` describes the software release; `/event-horizon-release.json` is an identical compatibility alias.
- `/#flight=board`, `hull`, `blackout`, or `permission` opens a flight chapter.
- `/#mission=hybrid.mixed.offline.held` restores a bounded routing scenario.
- `/#signature` opens the interactive Living Circuit viewer; it is also reachable from the hero and operator insignia.
- `/#lensing` opens the interactive observatory; `/#film` opens Orbital arrival on its still poster.

The public fleet export remains dated **28 August 2026**, valid through **27 September 2026** in America/Chicago. Routing inventory remains separately dated **21 August 2026**. Both `status.json` snapshots are unchanged; a new website release does not establish current infrastructure state. Simulations are illustrative and send nothing to an AI service.

## Supported local commands

```powershell
npm ci
npm run build
npm run preview -- --host 127.0.0.1 --port 4178 --strictPort
npm run lint
npm run format:check
npm run test:node
npm run test:odyssey
npm run test:artifact
npm run test:release
npm run verify
```

Verification covers lint, formatting, source and model tests, the production build, artifact contracts, both browser experiences, public-repository safety, released metadata, and committed whitespace. Browser gates use Chrome 147 in CI; local verification can use `CHROME_PATH`. The retained `check:v36:runtime` command checks V37 and the preserved V35 experience. The historical `check:preview` command deliberately rejects this released manifest; it is reserved for explicitly unpublished preview metadata.

GitHub Pages publishes only the verified `dist` artifact through `.github/workflows/pages.yml`. Pages must use GitHub Actions. Custom domain: `cashio.us`. Repository deployment does not alter DNS or Cloudflare zone policies. The reproducible audio tool remains available as `python scripts/build_audio_cues.py`.
