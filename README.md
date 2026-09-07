# cashio.us V37.7 — Parallax

Doug Cashio’s interactive universe of AI, security, and owned infrastructure. Parallax extends the Lensing edition of **THE HUMAN RECKONING**, crafted with GPT-6 Astra under Doug’s direction.

Shape this world opens an atmosphere workshop inside the observatory. Change cloud cover, aurora strength, and sun direction, then save the current rendered view as a PNG. The system atlas traces an illustrative request from human intent through HERMES and owned compute, back to human review. Within the light, a new eight-second Higgsfield film, moves through the original computing sanctuary with architectural parallax and illuminated platform circuits. A horizontal five-film collection preserves every perspective. Compact study navigation brings the instrument closer on phones, and the header gives the animated logo a seamless surface across light and dark sections.

The opening world responds to Dawn, Eclipse, and Ion lighting, with a desktop intensity control. Lightwake, an optional eight-second Higgsfield film, carries a wave of gold through the orbital gate as the atmosphere answers. Its First light, Signal, and Awakening landmarks connect the film to the explorable world. Refined machined surfaces, inset fasteners, and a thin atmosphere enrich the 3D scene. All seven studies have distinct illustrated navigation, with Previous and Next controls. The principles engine pairs beveled metal and recessed lenses with its Observe, Route, and Verify states.

The Cashio signature becomes an instrument of gold and light. Move across its orbital field to bend the light, drag to turn the artwork, or tap to send a finite ignition pulse. Balanced, Gold, and Ion treatments, a 0–100 field-strength control, Orbit and Inspect views, and six letter details keep exploration deliberate. The artwork retains its triangular A, crowned I, metallic finish, and orbital ellipse. Responsive WebP images and registered vector animation create the interactive logo; an eight-second animated GIF is also available at `/brand/celestial-signature.gif` without an initial-page download.

The signature awakens is an optional six-second Higgsfield film. Play, pause, replay, scrub the timeline, or inspect the Spark, Orbit, and Radiance frames. Sculpt this light returns to the interactive signature, which also offers Watch the signature awaken. Switching or closing a film stops the departing player; round trips preserve the original launcher. Film bytes load only after explicit Play or a frame request. Frame seeking uses the native media URL on byte-range hosts. Hosts without byte-range support use a bounded, same-origin in-memory fallback; the copy is released when the clip changes or closes.

Enter the Lensing Observatory to explore the original 3D planet, machined orbital gate, and courier traffic. Choose three light treatments and camera views, or take a finite 24-second journey with pause and manual chapter controls. Ignite the gate to reveal its recessed circuits and planetary aurora. The gate awakens and Orbital arrival remain available in the five-film cinema with their original links. All films open on still posters, play only on request, never loop, and pause when hidden.

First Flight is an optional guided starship journey. Four chapters move from arrival to the onboard core, connection loss, and a human permission decision. Visitors can change the illustrative scenario, follow the same twelve requests between routing bays, and share the exact settings. Flight controls adapt to phone and tablet screens; exploration remains available without taking the tour.

The operator insignia shares the animated Cashio identity and opens Celestial Forge. A cyan section plane reveals the ship’s onboard modules, armor, and service bays; selecting Onboard AI frames the exposed hardware. The opening orbital instrument aligns before a visitor-triggered lightfold transition.

Motion follows the visitor’s system preference and global pause control. Effects suspend offscreen and in hidden tabs, and audio requires explicit opt-in. Original orbital artwork, responsive ship stills, and a prerendered first view keep the experience useful while interactive modules load.

The release name is original, inspired by the Butlerian Jihad in Frank Herbert’s _Dune_: powerful tools, with human judgment in command. The reference is an inspiration, not a quoted or canonical book title.

## Routes and evidence

- `/` is the prerendered, indexable V37 homepage.
- `/odyssey.html` remains a compatible alias, canonicalized to `/`.
- `/command-deck.html` preserves the V35 command deck. Existing `/#deck=…` bookmarks redirect there with their query and selected deck intact.
- `/command.html` remains the explicitly marked May 2026 historical archive.
- `/site-release.json` describes software version **37.7.0**, visual edition **Lensing**, and featured experience **Lensing Observatory**; `/event-horizon-release.json` is an identical compatibility alias.
- `/#flight=board`, `hull`, `blackout`, or `permission` opens a flight chapter.
- `/#mission=hybrid.mixed.offline.held` restores a bounded routing scenario.
- `/#signature` opens Celestial Forge; it is also reachable from the hero, operator insignia, and signature film.
- `/#film=sanctuary` opens Within the light, with Threshold, Approach, and Within frame landmarks; Explore the working studies closes the cinema and focuses the study heading.
- `/#film=lightwake` opens Lightwake; Enter this world hands off to the interactive observatory.
- `/#film=signature` opens The signature awakens on a still poster. Sculpt this light opens the interactive signature.
- `/#lensing` opens the interactive observatory; `/#film` opens Orbital arrival on its still poster.
- `/#film=awakening` opens The gate awakens. Its explicit handoff opens the observatory at the illuminated gate in eclipse light.

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
