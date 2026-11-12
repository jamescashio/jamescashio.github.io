# V44 Drummer release contract

Prepared Thu Nov 5, 2026. Doug approved it for publication the same day.

## Scope

- The front door at `/` is rebuilt: new composition, a generative transit gate, station navigation and seven stations.
- V43 Centauri stays reachable, unchanged in content, at `/v43/` (noindex, canonical to itself). Since V44.3 it says that it is an archive and links to the current site from its first line and the foot of its rail. Its receipt is preserved byte for byte at `/v43/site-release.json`.
- The page title says what the site is and then names the release, `Doug Cashio · cAshIo · Local AI workshop · V44 Heighliner`, which `scripts/check_release_consistency.py` enforces; share cards use `Doug Cashio · cAshIo · Local AI workshop`. Until V44.1 the title carried the release name alone.
- V44.3 Heighliner (Thu Nov 12, 2026) rebuilds the gate as a hoop with depth and one pixel edges, lets the live gate climb to the screen's own resolution on a GPU that can carry it (`src/v44/sharpness.ts`), and keeps room visitors in their room: films, the observatory, the forge and the first flight open over the room, and the preserved edition returns a guest to the room they came from.
- V44.2 Bitmaxing (Thu Nov 12, 2026) redraws Bit and the maps and gives Bit a fuller set of behaviours. Doug named and ordered it the same day.
- V44.1 Mentat (Thu Nov 12, 2026) is the scorecard round on this front door. The composition, stations and this contract are unchanged; Doug approved it the same day.
- The helm keeps the Odyssey rule (the same input reaches the same lane and code) and words it in this edition's voice.
- Rooms, films, evidence archives and older editions keep their URLs. V43 deep links on `/` open the matching place in `/v43/`; room bookmarks open the room; the reading editions point straight at the V44 stations or the preserved player, so they work without JavaScript.

## Acceptance

- Every one of the nine scorecard categories at 9.0 or above, measured, before Doug is asked to approve.
- Lighthouse mobile performance at 90 or above on three consecutive runs; accessibility, best practices and SEO at 100 on the production host. `npm run audit:v44` measures this on the build, served compressed and without the preview's noindex header, and keeps its reports under `artifacts/v44/<commit>/`. It is a release step rather than a CI gate, because shared CI machines vary too much in timing for a performance floor.
- axe: zero WCAG 2.2 AA or best practice violations at 320, 390, 834, 1440 and 3822 pixel widths with every disclosure open, checked inside `npm run test:v44`.
- No horizontal overflow at 320 pixels or wider; no visible text under 12 pixels; 44 pixel touch targets on coarse pointers.
- Pause and reduced motion leave a complete still page with no running animation. Pause is one setting across the front door, the rooms and the preserved edition.
- Evidence on the page equals `status.json`; the page makes no network request of its own. Dates read like Wed Nov 4, 2026.
- The preserved V43 edition loads no code from another page's entry; shared modules have their own chunks.
- No hyphens or em or en dashes in visible copy, except handles such as @james-cashio and aircraft designations.

- `npm run test:v44` passes: arrival fit, solid header on scroll, visible focus inside clipped controls, sheet focus and history, Pause, E.V.E. parity, helm map, transcript and Bit placement; on phones the helm result and the chosen film land on screen; the scope film keeps its frame; header chips keep one line; on page ids stay on the page; E.V.E. opens without speaking for the visitor; each station lights the sky; Pause stops the live gate's frame loop in a WebGL browser; Bit's card closes from the keyboard; the transit line reaches its end after the page changes height; print shows every plate and no sky; Bit never offers the place the visitor is at; the helm announces its decision in one line.

## Known limits

- The sandbox renders WebGL in software, so the live gate's frame cost must be confirmed on a real GPU before publication. The climb to native resolution is decided by a timed frame (one pixel read back, which makes the browser wait for the GPU); the rules are unit tested, and the climb itself was exercised in software with the budget lifted, reaching 3440 by 1440 on a 3822 by 1600 window at 90 percent zoom.
- The gate posters are painted from the same shader (`node --import tsx scripts/render-gate-posters.mjs`), and the live gate projects the poster's layout, so a change to the shader or a composition means painting the posters again. Posters are drawn at twice their size and averaged down. The live frame and its poster differ only in fine shading where a poster is shown larger than its own size (tablets in portrait), never in where the gate sits.
