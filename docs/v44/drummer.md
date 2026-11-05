# V44 Drummer release contract

Prepared Thu Nov 5, 2026 as a preview. Not published until Doug approves it.

## Scope

- The front door at `/` is rebuilt: new composition, a generative transit gate, station navigation and seven stations.
- V43 Centauri stays reachable, unchanged in content, at `/v43/` (noindex, canonical to itself). Its receipt is preserved byte for byte at `/v43/site-release.json`.
- The page title keeps the repository's release convention, `Doug Cashio · cAshIo · V44 Drummer`, which `scripts/check_release_consistency.py` enforces; share cards use `Doug Cashio · cAshIo · Local AI workshop`.
- The helm keeps the Odyssey rule (the same input reaches the same lane and code) and words it in this edition's voice.
- Rooms, films, evidence archives and older editions keep their URLs. V43 deep links on `/` open the matching place in `/v43/`; room bookmarks open the room; the reading editions point straight at the V44 stations or the preserved player, so they work without JavaScript.

## Acceptance

- Every one of the nine scorecard categories at 9.0 or above, measured, before Doug is asked to approve.
- Lighthouse mobile performance at 90 or above on three consecutive runs; accessibility, best practices and SEO at 100 on the production host.
- axe: zero violations at 390, 834, 1440 and 3822 pixel widths, and nothing serious or critical at 320.
- No horizontal overflow at 320 pixels or wider; no visible text under 12 pixels; 44 pixel touch targets on coarse pointers.
- Pause and reduced motion leave a complete still page with no running animation. Pause is one setting across the front door, the rooms and the preserved edition.
- Evidence on the page equals `status.json`; the page makes no network request of its own. Dates read like Wed Nov 4, 2026.
- The preserved V43 edition loads no code from another page's entry; shared modules have their own chunks.
- No hyphens or em or en dashes in visible copy, except handles such as @james-cashio and aircraft designations.

- `npm run test:v44` passes: arrival fit, solid header on scroll, visible focus inside clipped controls, sheet focus and history, Pause, E.V.E. parity, helm map, transcript and Bit placement; on phones the helm result and the chosen film land on screen; the scope film keeps its frame; header chips keep one line; on page ids stay on the page; E.V.E. opens without speaking for the visitor; each station lights the sky.

## Known limits

- The sandbox renders WebGL in software, so the live gate's frame cost must be confirmed on a real GPU before publication.
- The gate posters are rendered from the same shader; on a software renderer the page shows the poster instead of the live scene.
