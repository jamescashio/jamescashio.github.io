# cAshIo V44 · Navigator

**Navigator · Human in command** is V44.5, named for the Guild Navigators of _Dune_, who steer a ship through folded space. Opening a world card is now a jump: the page falls away, the camera flies through the far gate in that world's color, and the room opens out of the same light. A chosen card lights the far gate before the jump. On a screen at least twice as wide as it is tall the page reads on the left and the right is a window on the sky, where the far gate hangs large. Prepared on Fri Nov 13, 2026.

**Holtzman** was V44.4, named for the effect in _Dune_ that folds space, because pages now fold into one another. A world card opens into its room and the room folds back into its card. The four rooms are set in the front door's own typefaces. Three ships use the transit gate. Screens 3200 pixels and wider get a wider page, and the share card loses the box around the signature.

**Heighliner** was V44.3, named for the Guild ships of _Dune_ that fold space, because this release belongs to the transit gate. The gate is rebuilt as a hoop with real depth (a lit deck, a far inner wall washed by its own light, a near outer wall with ports and four clamps) and every edge is one pixel sharp. The live gate now climbs to the screen's own resolution on a GPU that can carry it, up to a native 4K screen, and is paced in the display's own beats. Rooms play their films, the lensing observatory, the signature forge and the first flight in place, the preserved V43 edition returns a guest to the room they came from and points to the current site, and the rooms carry the front door's mark. Prepared on Thu Nov 12, 2026.

**Bitmaxing** was V44.2, named by Doug for Bit, the copilot in the corner. Bit is redrawn as a glass icosahedron around a lit core with a ring and a small red moon, and it is alive: it turns while the visitor is active, looks toward the pointer, blinks, thinks along while E.V.E. works out an answer, swells and throws sparks when tapped or pleased, and goes red and nearly still while a request is held for a person. The Workshop and Helm maps are redrawn as hull plates on a drafting grid, the Helm names its lane out of noise, the four worlds arrive one after another and the screen's play button sends out a ring of light. Prepared on Thu Nov 12, 2026.

**Mentat** was V44.1, the scorecard round on the Drummer front door, prepared and approved by Doug on Thu Nov 12, 2026. It is named for the human computers of _Dune_: after the Butlerian Jihad, people trained to do the thinking themselves. A rendered nine category review of the live site led to four changes: the arrival says who is speaking before the first scroll, the dated record says how old it is, forced color palettes show what is chosen and what is on, and the headline and the world cards answer with a little light and motion. The composition and the seven stations are unchanged.

**Drummer** is the front door itself: a ground up rebuild of the cashio.us front door, prepared on Thu Nov 5, 2026 and named for Camina Drummer of _The Expanse_, who keeps a cool head when it counts. Doug approved it for publication on Thu Nov 5, 2026.

One transit gate, seven stations, the captain decides. The page opens on a live, generative gate in the platinum cAshIo identity: the gate arrives lit and a light front races around it once per visit, scrolling flies the camera through the ring, and the same sky carries on behind every station. Films, worlds, the routing helm, the dated evidence and E.V.E. sit on that sky as hull plates. Bit is in the corner.

The previous front door is preserved unchanged as [V43 Centauri at /v43/](https://cashio.us/v43/), with its receipt at `public/v43/site-release.json`. Rollback to it is the previous production commit `b21725755cab03412fd77fe85493580d5342d105`. The current receipt is `public/v40/site-release.json`; the `v40` path is a compatibility path, not the version label. See [the Drummer release contract](docs/v44/drummer.md).

## The seven stations

| Station     | What a visitor does                                                                         |
| ----------- | ------------------------------------------------------------------------------------------- |
| 01 Arrival  | Watches the gate open, then begins the transit                                              |
| 02 Cinema   | Plays House Cashio: The Trailer or the studio shorts; The Sovereign links to YouTube        |
| 03 Worlds   | Enters the starship lab, principles engine, Studios, flight heritage or the Roadster hangar |
| 04 Workshop | Reads the system map of the design and an example decision brief                            |
| 05 Helm     | Steers an illustration of the routing rule and watches its route map, in the browser        |
| 06 Evidence | Reads the dated record and asks E.V.E. about it                                             |
| 07 Doug     | Meets Doug and says hello                                                                   |

The six further experiments, the 30 second tour, mission cards, the Omnius hearing and the Roadster inspection remain in V43 Centauri.

## Current evidence

The verified record was refreshed on **November 6, 2026** from new read only checks. `status.json`, `public/status.json` and `public/evidence/status.json` are identical public aggregates. They report 20 running containers out of 21, 2 running virtual machines out of 3, and 2 hosts reporting running guests. The backup source listed 200 snapshots and reported successful integrity verification for 23 of 23 latest reported guest snapshots.

The V44 page prints these figures at build time from `public/status.json`, the export it ships beside, through `scripts/v44-status.mjs`, so the page and the record cannot disagree, and the build fails if a figure is missing, is not a whole count, or exceeds the inventory it belongs to. The page makes no network requests of its own. These inventory and integrity readings do not establish application health, a restore rehearsal, offsite recovery or current AI routing. Unmeasured fields remain null with their reasons. The observation schema retains its V41 source identity. Fresh collection provenance is recorded in UTC and America/Chicago. The November 5, 2026 record is preserved unchanged at `/evidence/status-2026-11-05.json`.

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
| Toasts and copying the address                 | `src/v44/toast.ts`                                          |
| Motion preference and Pause                    | `src/v44/motion.ts`                                         |
| Screening room                                 | `src/v44/cinema.ts`                                         |
| Helm routing model and shared routes           | `src/v44/route.ts`                                          |
| E.V.E. terminal                                | `src/v44/eve.ts`                                            |
| Bit                                            | `src/v44/bit.ts`, jokes in `src/shared/ship-humor.ts`       |
| Styles, one file per station in cascade order  | `src/v44/v44.css`, `src/v44/styles/*.css`                   |
| House date style for every printed date        | `src/shared/dates.ts`                                       |
| Browser gate for the front door                | `tests/v44-runtime.test.mjs`, `npm run test:v44`            |
| Gate posters, painted from the shader          | `public/v44/gate-*.webp`, `scripts/render-gate-posters.mjs` |
| Preserved V43 Centauri entry and receipt       | `v43/index.html`, `public/v43/site-release.json`            |

## Performance and motion

Each station lends the deep sky its own light: amber for the screening room, green for the worlds, steel for the workshop, violet at the helm, a cold archive light for the evidence and the house red for Doug. The live gate eases its nebula between them in the shader; the painted poster carries the same colors in a light layer. The posters are painted from the shader itself by `scripts/render-gate-posters.mjs`, one per composition: landscape, ultrawide, portrait and short phones. The live gate does not keep a layout of its own: it projects the layout of the poster on screen, placed as the stylesheet places it, so the live scene fades in exactly over its painting. It arrives lit, as the poster shows it; once per visit a light front races around the ring, and the poster answers with a flare of its own. The gate runs on a real GPU. Software rasterizers get the painted poster of the same scene, because a full screen shader on a CPU costs more than it gives. The canvas backing store is capped near 2.1 million pixels, steps down at once after a slow frame, renders the sky behind content at half rate, rests on a still frame when nobody scrolls, points or types, and stops when the tab is hidden, motion is paused, a film plays or the context is lost. Pause and the reduced motion preference leave a complete still page. There is no ambient audio; films start muted, and a visitor can unmute them from the player's own controls.

## Verification

Run `npm run verify`. `tests/v44-drummer.test.mjs` covers the helm rule against the Odyssey routing example, the gate layout at phone, laptop and ultrawide sizes, the evidence filler and the built page: strict security policy, station order, evidence parity with `status.json`, image dimensions and text, and links that resolve inside the build. `npm run test:v44` opens the built front door in Chrome and checks what static tests cannot see: every arrival fits its first screen at nine sizes from 320 by 568 to 3822 by 1600, the header turns solid once the page scrolls, keyboard focus is visible inside every cut corner control, the station sheet moves focus and keeps Back, Pause leaves nothing moving, E.V.E. counts the list the page prints, the helm map follows the rule, a shared route opens the helm on the same decision, Share hands over that link, the transcript matches the captions and Bit stays clear of the arrival on phones. On phones it also checks that the helm's result and the chosen film land on screen, and it checks that the header chips stay on one line from 1024 to 1366 wide, that the gate readout steps aside for Bit on short laptops, that links to ids on the page stay on the page and that E.V.E. opens without speaking for the visitor. It runs axe at five widths with every disclosure open, and opens the live gate in a WebGL browser to check that Pause stops its frame loop. `npm run audit:v44` runs Lighthouse three times on mobile and once on desktop against the build and holds it to the release contract's bar, keeping the reports under `artifacts/v44/<commit>/`.

## History and publication

V43 Centauri, V42 Omnius, Overruled, V41 First Light, V39.8, V37.17, V35 and the May 2026 command center keep their own receipts, dates and evidence. Publication requires Doug's approval, the protected repository checks and a look at the ordinary live desktop and phone site.
