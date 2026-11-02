# cAshIo V42 · Omnius, Overruled

**Omnius, Overruled · Imagination, with intention** is an unpublished V42 preview prepared on 11-01-2026. The name nods to the machine overmind in the Butlerian Jihad prequels. A fictional hearing gives visitors the last word over four absurd machine proposals. Dry shipboard responses and new Bit jokes add personality to the original moving planetary hero, black, metallic gold and electric cyan. The original content, films and dated evidence remain, with House Cashio first in the cinema.

Production remains at commit `650f395adc36ae762acd99e43c0a4655d653ed1f` until Doug approves the final preview. The local review server displays an unpublished ribbon and sends noindex headers. The current receipt at `public/v40/site-release.json` explicitly records `published: false`, `status: preview` and no release date.

## Preserved content

The final craft pass turns Explore, Try and Watch into direct illustrated entrances, makes the starship invitation visually primary, and gives the deeper sections illustrated previews. A compact phone dock reaches Watch, Worlds, Try and Top after the hero; optional scene controls expand on demand. Larger supporting text and chapter labels retain the cinematic identity. Mission Control opens without focusing Search on phones. See the [final acceptance contract](docs/v42/omnius-finale-preview.md).

All twelve homepage sections, four worlds, seven experiments, films, captions, reading editions and existing bookmark destinations remain. House Cashio is the opening feature; Eagle remains available at `/#film=intro`. The Sovereign, Roadster Studio, the fifteen Zenith shorts, Bit, E.V.E., the logo reveal, signature and contact routes remain accessible. Motion can be paused, reduced motion is honored, and films start muted only after an explicit choice.

The aesthetic reference informs the moving light, orbital depth and luminous material system. Its personal content and source code are excluded. Omnius, Overruled reuses the original planetary observatory, original Canvas geometry and the project's existing dependencies; no remote runtime is added. The Discovery console adds selectable multicolor holographic beacons, an artwork view and a copyable route of public links without sending any data. All three light forms remain manually operable when motion is paused.

The optional hearing is an original fictional scene. Its lore links to the publisher, its verdicts respond only to visitor choices, and its brief stamp respects Pause and reduced motion. It does not operate or claim to control an AI service. The release hearing and styling live in `src/v40/release-hearing.tsx` and `src/v40/release-hearing.css`; shared jokes live in `src/v40/ship-humor.ts`.

## Current evidence

The verified record remains **November 1, 2026**. `status.json`, `public/status.json` and `public/evidence/status.json` remain byte identical to the production baseline. They report 19 running containers out of 20, 1 running virtual machine out of 2, and 2 hosts reporting running guests. The backup source listed 122 snapshots and reported successful integrity verification for 21 of 21 latest reported guest snapshots.

These inventory and integrity readings do not establish application health, a restore rehearsal, offsite recovery or current AI routing. Unmeasured fields remain null with their reasons. V42 describes the interface; the existing observation retains its V41 source identity and provenance. No operational data was recollected for this design change.

## Source ownership

| Concern                                             | Source                                                                                         |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Omnius, Overruled opening and fallback illustration | `src/v40/immersive-hero.tsx`                                                                   |
| Original projected geometry                         | `src/v40/orbital-field.js`, `src/v40/continuum-field.js`                                       |
| Original artwork camera                             | `src/v40/hero-camera.ts`                                                                       |
| Critical opening styles                             | `src/v40/signature-opening.css`                                                                |
| Shared secondary material system                    | `src/v40/signature-surfaces.css`, `src/v40/prism-surfaces.css`, `src/v40/continuum-panels.css` |
| Page state, visibility and bounded animation loop   | `src/v40/page.jsx`                                                                             |
| Destination search and previews                     | `src/v40/mission-desk.js`                                                                      |
| Existing content and world atlas                    | `src/v40/sections/`                                                                            |
| Observation formatting and release presentation     | `src/v40/evidence.js`                                                                          |
| Finite interaction styles                           | `src/v40/polish-states.css`, with first-render frame variants in `polish.css`                  |
| Strict CSP and complete reading edition             | `index.html`, `scripts/prerender-v40.mts`                                                      |

The `v40` source and receipt paths are compatibility paths, not the current version label. Four current interactive worlds remain at `/rooms/<name>/interactive/`, alongside their static reading editions.

## Verification

Run `npm run verify`. It includes lint, formatting, model and unit checks, the production build, artifact checks, preserved layout and V36 checks, current browser tests, Python release checks, public-data guards, consistency and committed whitespace. The initial stylesheet budget stays at 19,000 gzip bytes. Heavy scenes and secondary styles load on demand. The new canvas stops while hidden, paused, offscreen or covered by cinema; its frame rate and backing-pixel budget are bounded.

For review, run `node scripts/serve-helios-preview.mjs dist 4408 --review`. See [the V42 design and content contract](docs/v42/omnius-finale-preview.md) for scope and acceptance. Browser emulation covers desktop and phone viewports; it is not physical phone testing.

The [mobile delivery pass](docs/v42/mobile-performance-preview.md) sends the opening styles with the first document under exact content hashes. The full reading edition, artwork and interactions remain. Its acceptance target is at least 90 in three standard mobile Lighthouse runs, with accessibility and best practices retained.

## History and publication

The exact previous current receipt is retained at `/v41/first-light-release.json`. The [First Light implementation notes](docs/v41/first-light-implementation.md), [First Light presentation](docs/v41/first-light.md), [Afterglow](docs/v41/afterglow.md) and changelog preserve earlier design decisions. The V39, V37 and V35 experiences keep their own original receipts, dates and evidence. Compatibility receipts preserve their historical V37 identity while their frontDoor pointer identifies the V42 preview receipt. Publication state is explicit in that current receipt.

Final publication requires Doug's approval of the preview. At that point prepare released metadata, pass the protected repository checks, publish the verified artifact, and verify the ordinary live desktop and phone site. The production rollback baseline is `650f395adc36ae762acd99e43c0a4655d653ed1f`.
