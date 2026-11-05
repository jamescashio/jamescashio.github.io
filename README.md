# cAshIo V44 · Drummer

**Drummer · Human in command** is a ground up rebuild of the cashio.us front door, prepared on Thu Nov 5, 2026 and named for the captain of _The Expanse_ who keeps a cool head when it counts. It is a preview until Doug approves publication.

One transit gate, seven stations, the captain decides. The page opens on a live, generative gate in the platinum cAshIo identity: hull segments ignite once per visit, scrolling flies the camera through the ring, and the same sky carries on behind every station. Films, worlds, the routing helm, the dated evidence and E.V.E. sit on that sky as hull plates. Bit is in the corner.

The previous front door is preserved unchanged as [V43 Centauri at /v43/](https://cashio.us/v43/), with its receipt at `public/v43/site-release.json`. Its rollback commit is `e75c774b285c1cca75c1e878c758af0a94731579`. The current receipt is `public/v40/site-release.json`; the `v40` path is a compatibility path, not the version label. See [the Drummer release contract](docs/v44/drummer.md).

## The seven stations

| Station     | What a visitor does                                                               |
| ----------- | --------------------------------------------------------------------------------- |
| 01 Arrival  | Watches the gate ignite, then begins the transit                                  |
| 02 Cinema   | Plays House Cashio: The Trailer or a silent short; The Sovereign links to YouTube |
| 03 Worlds   | Enters the starship lab, principles engine, Studios or flight heritage            |
| 04 Workshop | Opens Roadster Studio, reads the system map, the backup receipt and the brief     |
| 05 Helm     | Steers a teaching model of the routing rule, entirely in the browser              |
| 06 Evidence | Reads the dated record and asks E.V.E. about it                                   |
| 07 Doug     | Meets Doug and says hello                                                         |

The six further experiments, the 30 second tour, mission cards, the Omnius hearing and the Roadster inspection remain in V43 Centauri.

## Current evidence

The verified record was refreshed on **November 4, 2026** from new read only checks. `status.json`, `public/status.json` and `public/evidence/status.json` are identical public aggregates. They report 19 running containers out of 20, 2 running virtual machines out of 3, and 2 hosts reporting running guests. The backup source listed 161 snapshots and reported successful integrity verification for 22 of 22 latest reported guest snapshots.

The V44 page prints these figures at build time from `status.json` through `scripts/v44-status.mjs`, so the page and the record cannot disagree, and the build fails if a figure is missing. The page makes no network requests of its own. These readings do not establish application health, a restore rehearsal, offsite recovery or current AI routing.

## Source ownership

| Concern                                        | Source                                             |
| ---------------------------------------------- | -------------------------------------------------- |
| Front door markup and copy                     | `index.html`                                       |
| Evidence figures filled from the record        | `scripts/v44-status.mjs`                           |
| Gate, sun, planet, nebula and stars            | `src/v44/shader.ts`                                |
| Sky engine: layout, ignition, budget, fallback | `src/v44/sky.ts`                                   |
| Page wiring: stations, transit, reveal, eggs   | `src/v44/main.ts`                                  |
| Motion preference and Pause                    | `src/v44/motion.ts`                                |
| Screening room                                 | `src/v44/cinema.ts`                                |
| Helm routing model                             | `src/v44/route.ts`                                 |
| E.V.E. terminal                                | `src/v44/eve.ts`                                   |
| Bit                                            | `src/v44/bit.ts`, jokes in `src/v40/ship-humor.ts` |
| Styles                                         | `src/v44/v44.css`                                  |
| Gate posters for software rendering            | `public/v44/gate-*.webp`                           |
| Preserved V43 Centauri entry and receipt       | `v43/index.html`, `public/v43/site-release.json`   |

## Performance and motion

The gate runs on a real GPU. Software rasterizers get the painted poster of the same scene, because a full screen shader on a CPU costs more than it gives. The canvas backing store is capped near 2.1 million pixels, steps down at once after a slow frame, renders the sky behind content at half rate, and stops when the tab is hidden, motion is paused or a film plays. Pause and the reduced motion preference leave a complete still page. Nothing makes sound.

## Verification

Run `npm run verify`. `tests/v44-drummer.test.mjs` covers the helm rule against the Odyssey teaching model, the gate layout at phone, laptop and ultrawide sizes, the evidence filler and the built page: strict security policy, station order, evidence parity with `status.json`, image dimensions and text, and links that resolve inside the build. `npm run test:v44` opens the built front door in Chrome and checks what static tests cannot see: every arrival fits its first screen at nine sizes from 320 by 568 to 3822 by 1600, the header turns solid once the page scrolls, keyboard focus is visible inside every cut corner control, the station sheet moves focus and keeps Back, Pause leaves nothing moving, E.V.E. counts the list the page prints, the helm map follows the rule, the transcript matches the captions and Bit stays clear of the arrival on phones.

## History and publication

V43 Centauri, V42 Omnius, Overruled, V41 First Light, V39.8, V37.17, V35 and the May 2026 command center keep their own receipts, dates and evidence. Publication requires Doug's approval, the protected repository checks and a look at the ordinary live desktop and phone site.
