# cAshIo V44 · Drummer

**Drummer · Human in command** is a ground up rebuild of the cashio.us front door, prepared on Thu Nov 5, 2026 and named for Camina Drummer of _The Expanse_, who keeps a cool head when it counts. It is a preview until Doug approves publication.

One transit gate, seven stations, the captain decides. The page opens on a live, generative gate in the platinum cAshIo identity: hull segments ignite once per visit, scrolling flies the camera through the ring, and the same sky carries on behind every station. Films, worlds, the routing helm, the dated evidence and E.V.E. sit on that sky as hull plates. Bit is in the corner.

The previous front door is preserved unchanged as [V43 Centauri at /v43/](https://cashio.us/v43/), with its receipt at `public/v43/site-release.json`. Its rollback commit is `e75c774b285c1cca75c1e878c758af0a94731579`. The current receipt is `public/v40/site-release.json`; the `v40` path is a compatibility path, not the version label. See [the Drummer release contract](docs/v44/drummer.md).

## The seven stations

| Station     | What a visitor does                                                                         |
| ----------- | ------------------------------------------------------------------------------------------- |
| 01 Arrival  | Watches the gate ignite, then begins the transit                                            |
| 02 Cinema   | Plays House Cashio: The Trailer or the studio shorts; The Sovereign links to YouTube        |
| 03 Worlds   | Enters the starship lab, principles engine, Studios, flight heritage or the Roadster hangar |
| 04 Workshop | Reads the system map of the design and an example decision brief                            |
| 05 Helm     | Steers an illustration of the routing rule and watches its route map, in the browser        |
| 06 Evidence | Reads the dated record and asks E.V.E. about it                                             |
| 07 Doug     | Meets Doug and says hello                                                                   |

The six further experiments, the 30 second tour, mission cards, the Omnius hearing and the Roadster inspection remain in V43 Centauri.

## Current evidence

The verified record was refreshed on **November 4, 2026** from new read only checks. `status.json`, `public/status.json` and `public/evidence/status.json` are identical public aggregates. They report 19 running containers out of 20, 2 running virtual machines out of 3, and 2 hosts reporting running guests. The backup source listed 161 snapshots and reported successful integrity verification for 22 of 22 latest reported guest snapshots.

The V44 page prints these figures at build time from `public/status.json`, the export it ships beside, through `scripts/v44-status.mjs`, so the page and the record cannot disagree, and the build fails if a figure is missing, is not a whole count, or exceeds the inventory it belongs to. The page makes no network requests of its own. These readings do not establish application health, a restore rehearsal, offsite recovery or current AI routing.

## Source ownership

| Concern                                        | Source                                                      |
| ---------------------------------------------- | ----------------------------------------------------------- |
| Front door markup and copy                     | `index.html`                                                |
| Evidence figures filled from the record        | `scripts/v44-status.mjs`                                    |
| Gate, sun, planet, nebula and stars            | `src/v44/shader.ts`                                         |
| Sky engine: entrance, budget, fallback         | `src/v44/sky.ts`                                            |
| Gate composition, posters and their projection | `src/v44/layout.ts`                                         |
| Station colors of the nebula                   | `src/v44/nebula.ts`                                         |
| Page wiring: scroll, sky state, motion button  | `src/v44/main.ts`                                           |
| Stations, phone sheet, travel and Back         | `src/v44/stations.ts`                                       |
| Plate reveals, focus and pointer light         | `src/v44/plates.ts`                                         |
| Toasts, copying the address, typed eggs        | `src/v44/eggs.ts`                                           |
| Motion preference and Pause                    | `src/v44/motion.ts`                                         |
| Screening room                                 | `src/v44/cinema.ts`                                         |
| Helm routing model                             | `src/v44/route.ts`                                          |
| E.V.E. terminal                                | `src/v44/eve.ts`                                            |
| Bit                                            | `src/v44/bit.ts`, jokes in `src/shared/ship-humor.ts`       |
| Styles, one file per station in cascade order  | `src/v44/v44.css`, `src/v44/styles/*.css`                   |
| House date style for every printed date        | `src/shared/dates.ts`                                       |
| Browser gate for the front door                | `tests/v44-runtime.test.mjs`, `npm run test:v44`            |
| Gate posters, painted from the shader          | `public/v44/gate-*.webp`, `scripts/render-gate-posters.mjs` |
| Preserved V43 Centauri entry and receipt       | `v43/index.html`, `public/v43/site-release.json`            |

## Performance and motion

Each station lends the deep sky its own light: amber for the screening room, green for the worlds, steel for the workshop, violet at the helm, a cold archive light for the evidence and the house red for Doug. The live gate eases its nebula between them in the shader; the painted poster carries the same colors in a light layer. The posters are painted from the shader itself by `scripts/render-gate-posters.mjs`, one per composition: landscape, ultrawide, portrait and short phones. The live gate does not keep a layout of its own: it projects the layout of the poster on screen, placed as the stylesheet places it, so the live scene fades in exactly over its painting. It arrives lit, as the poster shows it; once per visit a light front races around the ring, and the poster answers with a flare of its own. The gate runs on a real GPU. Software rasterizers get the painted poster of the same scene, because a full screen shader on a CPU costs more than it gives. The canvas backing store is capped near 2.1 million pixels, steps down at once after a slow frame, renders the sky behind content at half rate, rests on a still frame when nobody scrolls, points or types, and stops when the tab is hidden, motion is paused, a film plays or the context is lost. Pause and the reduced motion preference leave a complete still page. Nothing makes sound.

## Verification

Run `npm run verify`. `tests/v44-drummer.test.mjs` covers the helm rule against the Odyssey routing example, the gate layout at phone, laptop and ultrawide sizes, the evidence filler and the built page: strict security policy, station order, evidence parity with `status.json`, image dimensions and text, and links that resolve inside the build. `npm run test:v44` opens the built front door in Chrome and checks what static tests cannot see: every arrival fits its first screen at nine sizes from 320 by 568 to 3822 by 1600, the header turns solid once the page scrolls, keyboard focus is visible inside every cut corner control, the station sheet moves focus and keeps Back, Pause leaves nothing moving, E.V.E. counts the list the page prints, the helm map follows the rule, the transcript matches the captions and Bit stays clear of the arrival on phones. On phones it also checks that the helm's result and the chosen film land on screen, and it checks that the header chips stay on one line from 1024 to 1366 wide, that the gate readout steps aside for Bit on short laptops, that links to ids on the page stay on the page and that E.V.E. opens without speaking for the visitor. It runs axe at five widths with every disclosure open, and opens the live gate in a WebGL browser to check that Pause stops its frame loop. `npm run audit:v44` runs Lighthouse three times on mobile and once on desktop against the build and holds it to the release contract's bar, keeping the reports under `artifacts/v44/<commit>/`.

## History and publication

V43 Centauri, V42 Omnius, Overruled, V41 First Light, V39.8, V37.17, V35 and the May 2026 command center keep their own receipts, dates and evidence. Publication requires Doug's approval, the protected repository checks and a look at the ordinary live desktop and phone site.
