# cAshIo V41 · Eagle

**First Light · The next horizon** is an unpublished presentation preview: an original orbital observatory opens the site, and an interactive atlas connects the four existing worlds. House Cashio remains the opening film. See the [preview and content-preservation notes](docs/v41/first-light.md). The [approved Afterglow presentation](docs/v41/afterglow.md) remains the production baseline until this round is approved.

The ringed planet anchors the opening headline and the Board the starship invitation. House Cashio: The Trailer, a 61 second parody, replaces the Eagle invitation below the hero and opens only when chosen. The page keeps the V40 orbital world, LCARS rail, Orbitron, Exo 2, JetBrains Mono, Bit, E.V.E., Mission Control and seven local experiments. The headline and both main actions fit the first screen at 1440×900, 3440×1440 and 390×844.

V41 is the current production edition. GitHub Pages publishes the validated artifact through the protected main branch workflow. The rollback baseline is `1584144b27f4d520ea74d72ea4deb6ef6a84c2e0`, which preserves the optional cAshIo logo reveal.

## Current evidence

`status.json`, `public/status.json` and `public/evidence/status.json` are identical public aggregates from the October 31, 2026 read only observation. They report 19 running containers out of 20 documented containers, 1 running virtual machine out of 2, and 2 hosts reporting running guests. Running guests do not establish application health or cluster quorum.

The backup API listed 125 snapshots and reported successful integrity verification for 21 of 21 latest reported guest snapshots. This does not assert verification of every listed snapshot, complete coverage, a restore rehearsal or offsite recovery. Scheduler counts, model configuration, routing counts and quorum remain null with explicit `withheldReasons`. Public capability lanes and the private model catalog remain distinct fields. Neither has a fresh published count.

The current receipt is `/v40/site-release.json`. Compatibility receipts at `/site-release.json` and `/event-horizon-release.json` retain the V37 identity and point to Eagle through `frontDoor`. Their archived evidence remains the September 7 record. Historical observations and the V35 frozen clock retain their original dates.

## Page and media ownership

| Concern                                                                                                                    | Source                                                                           |
| -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Entry, strict CSP and reading edition                                                                                      | `index.html`, `src/v40/main.jsx`, `scripts/prerender-v40.mts`                    |
| Shared state and interaction handlers                                                                                      | `src/v40/page.jsx`                                                               |
| Hero, Eagle invitation, workshop, worlds, films, routing, decisions, experiments, machines, evidence, operator and contact | `src/v40/sections/`                                                              |
| Shared LCARS primitives                                                                                                    | `src/v40/design-system.js`, `src/v40/design.css`                                 |
| Finite interaction appearance                                                                                              | `src/v40/style-variants.js`, `src/v40/style-variants.json`, `src/v40/polish.css` |
| Planet backdrop and Eagle cinema                                                                                           | `src/v40/hero-reel.jsx`, `src/v40/hero-reel.css`                                 |
| Playback ownership, visibility and data saving                                                                             | `src/v40/media-policy.js`                                                        |
| Secondary controls                                                                                                         | `src/v40/deferred.css`                                                           |
| Shared bookmarks and scene handoffs                                                                                        | `src/v40/navigation.js`, `public/v40-entry.js`                                   |
| Public fact formatting                                                                                                     | `src/v40/evidence.js`, `public/status.json`                                      |

The former style helper calls are external CSS classes. The finite style map makes an unknown interaction variant fail visibly during testing instead of injecting CSS. When adding a state, add its rule to `polish.css` and its mapping to `style-variants.json`, then exercise that state in the browser. Section components retain the original `h()` composition style.

The hero keeps its planet artwork throughout the visit. The House Cashio invitation sits after the hero and telemetry ticker, before the workshop, while retaining the `#eagle-film` section anchor for existing bookmarks. The hero's Next: watch House Cashio link leads to this card. It uses the same poster, film, captions and text version as the trailer in Meet the machines. Waiting, returning and scrolling past its poster do not request the film. Watch House Cashio opens `/#film=trailer` with native controls and muted playback. Closing returns focus to the invitation that opened it. The original trailer card remains in Meet the machines, and `/#film=intro` still opens Eagle for existing bookmarks.

The film card uses a visible play control with hover motion in the deferred stylesheet. World cards use four columns on wide screens, two at medium widths and one on phones. The decorative starfield uses the shared elapsed time clock, caps ambient drawing near 30 frames per second, bounds its backing canvas near six million pixels, and stops when hidden, offscreen, paused or covered by the cinema.

The House Cashio trailer uses its existing 1080p rendition on desktop and 720p on phones or with data saving enabled. For the preserved Eagle film, AV1 precedes the H.264 fallback; its selector uses 1080p on desktop, 720p on phone and 480p for data saving or slow connections. Other ambient films use `preload="none"`, wait until at least half visible, pause on exit and share one playback owner. A deliberately played cinema can run with background motion paused. Turning Motion off also pauses an active replay. Optional external playback loads only after the visitor chooses Play.

The complete media inventory and checksums are in `public/assets/hero/cashio-v41-eagle-manifest.json`. All twelve encodes are 36 seconds; the largest is 3,274,766 bytes. Rebuild them with a local FFmpeg installation that includes libsvtav1 and libx264:

```powershell
python scripts/build-v41-media.py
```

The script uses existing planet and ship films plus original site effects. It writes temporary masters under ignored `artifacts/v41-media/` and updates the manifest. Encoders can produce different byte hashes across versions. Review regenerated media and rerun the release checks.

`public/v40/asset-manifest.json` records the original hashes of all 29 renamed assets. The old JPEG is preserved for rollback and has AVIF and WebP derivatives. Current cards request 320, 640 or 1280 pixel WebP thumbnails. Original V8 media remains available in the repository but is not requested by the current hero.

## Verification and preview

```powershell
npm ci
npm run verify
node scripts/serve-helios-preview.mjs dist 4191
```

Open `http://127.0.0.1:4191/`. The loopback server deliberately sends `X-Robots-Tag: noindex, nofollow, noarchive`. This lowers its Lighthouse SEO score and prevents the review surface from being indexed. Production HTML retains its canonical URL and indexable metadata.

`npm run verify` includes lint, formatting, unit and model checks, a single build, artifact checks, preserved layout and V36 browser checks, the combined V40 and V41 runtime suite, Python release tests, public data guards, consistency and committed whitespace. The V41 tests cover the first view, accessibility including visible label agreement, film placement, no unsolicited Eagle requests, the intro bookmark, explicit playback, data saving and a single visible player. The entry CSS budget remains 19,000 bytes gzip. Heavy scenes and secondary styles remain deferred.

See [the current layout review](docs/v41-layout-review.md) for the planet hero and optional film placement. The [original V41 review evidence](docs/v41-review.md) retains the earlier composition's transfer sizes, Lighthouse runs, screenshots, scorecard and limits. A passing frontend check is not a live infrastructure health claim.

## Preserved routes

Ordinary navigation stays in the current edition. Four interactive worlds live under `/rooms/<name>/interactive/`; reading editions live under `/rooms/<name>/`. Shared experiment and flight bookmarks retain their selections and return destinations.

`/v39/` preserves Helios and its dated `/v38/status.json`. `/odyssey.html` preserves V37.17 with the September 7 observation. `/command-deck.html` preserves V35 and its August observation. Version history labels these archives explicitly. Keep archive clocks, receipts and wording historical when maintaining them. Their detailed notes remain in [Helios](docs/helios-release.md), [the V37 release](docs/precision-preview-release.md) and the changelog.

GitHub Pages publishes the verified artifact after the protected main branch workflow succeeds. Rollback is a reviewed revert of the V41 squash commit or a redeployment of the baseline above.
