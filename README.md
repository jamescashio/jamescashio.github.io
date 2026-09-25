# cAshIo V39.0 · Helios

The public front door is **[cashio.us](https://cashio.us/)**. The root serves the current orbital workshop directly from `index.html` and `src/helios/`. Former `/v38/` addresses normalize to the root and keep their requested section or scene.

**V39.0 Zenith** keeps the Helios world, palette, type, artwork, Bit and quiet sound, and sharpens what a first visit says and feels like:

- **Clearer story.** The hero introduces the after hours workshop, and the dated observation stays with its evidence. The engineering repair note that used to follow the hero now lives only inside the build story; its place is a concise profile and a glossary; the hero supplies the main entry points. The AI budget panel publishes the routing law instead of a July cost sample, and the evidence boundary says spend stays withheld until it is measured again.
- **A living first frame.** After the arrival film, the artwork answers the pointer with a few pixels of depth, the sun breathes and a few stars twinkle. All of it yields to the Motion control, reduced motion, hidden tabs and open scenes.
- **A jump, not a wait.** Boarding the starship plays a short starfield warp that covers loading, and the flight arrives with a settle. The loader only appears when loading is slow. The flight module warms when a visitor hovers, focuses or touches a boarding link.
- **E.V.E. lore.** Unlisted console commands carry labelled Dune, aviation and fleet lore. Listed commands still answer only from the dated export.
- **Craft.** The wordmark I carries the serifs of the celestial signature. The phone starship card no longer collides with its caption, touch links have 44 pixel targets, ultrawide screens get a larger hero, and a designed share card replaces the plain orbit image for social previews. The hero art uses the existing AVIF set; the unseen 504 KB film poster is gone. The dead custom cursor markup and rules are removed.

The current receipt remains `/v38/site-release.json`. V37.17 is preserved at `/odyssey.html`, accessible through Version history, and `?v=37.17` links explicitly select it. The shared package and compatibility receipts keep their historical identity with a `frontDoor` record pointing to V39.0. Interface revisions do not renew evidence observations. See [Helios validation and rollback](docs/helios-release.md).

## Preserved V37.17 compatibility experience

Doug Cashio’s interactive universe of AI, security, and owned infrastructure. Built for technical peers and AI enthusiasts, with Bit, orbital artwork, midnight blue, cyan, gold, and human judgment at its center.

**V37.17 makes the first minute clearer and the phone decision easier to inspect.** The software version is 37.17.0. A concise introduction and three-step path lead from the flight to a visible routing consequence and the shipped interface. Changing a flight decision promotes the recap into the phone's primary action; before/after instruments use the same twelve-request model. Short-phone spacing and expanded text wrapping are refined. Bit, the orbital artwork, seven studies, dated evidence, legacy routes, quiet startup and motion controls retain their identity. See [release validation and rollback](docs/precision-preview-release.md).

## Experience

Start with First Flight: a 30-second, four-chapter journey through arrival, onboard AI, a lost connection, and a human permission decision. Follow twelve illustrative requests, change the scenario, and share the exact choices. Manual chapter controls remain available with motion paused.

The first visit keeps the seven studies and system map in native disclosures. Section navigation and shared experiment links open the relevant disclosure and restore keyboard focus. Seven working studies turn the ideas into experiments. Each explains its rules, suggests a boundary to try, links to its supporting source, and shares reproducible settings. The HERMES comparison loads the same request with public or private handling; the visitor explicitly runs each version.

The Evidence section connects those demonstrations to a real owner-run audit. “How the audit changed this record” compares two dated fleet observations, distinguishes an absent historical field from zero, and leaves unverified routing unknown. E.V.E. offers named links to the evidence, builds, operator, and preserved flight lineage.

The existing cinematic world remains available: Lensing Observatory, the explorable Sanctuary chamber, Celestial Forge, five optional films, controllable ship materials and propulsion, and the original command deck. Films open on still posters and play on request. Motion follows system preferences and the global pause control; audio requires opt-in. Heavy scenes load when opened.

**THE HUMAN RECKONING** is an original release name inspired by the Butlerian Jihad in Frank Herbert’s _Dune_; it is not a quotation or canonical book title. The Lensing edition was crafted with GPT-6 Astra under Doug’s direction. The earlier visual releases are documented in [Continuum](docs/continuum.md), [Vector](docs/vector.md), [Lightwake](docs/lightwake.md), and [Sanctuary](docs/sanctuary.md).

## Routes and evidence

- `/` serves the current V39 Zenith homepage directly. Release builds contain indexable metadata. Separately packaged local previews must disable indexing.
- `/odyssey.html` preserves V37.17; old `/v38/` addresses normalize to the current homepage.
- `/command-deck.html` preserves the V35 command deck. Existing `/#deck=…` bookmarks redirect there with their query and selected deck intact.
- `/command.html` remains the explicitly marked May 2026 archive.
- `/site-release.json` describes the software release, Lensing edition, and Lensing Observatory; `/event-horizon-release.json` is its identical compatibility alias. Software and evidence dates are separate.
- `/#flight=board`, `hull`, `blackout`, or `permission` opens a flight chapter.
- `/#mission=hybrid.mixed.offline.held` restores a bounded routing scenario.
- `/#build=hermes&intent=analyze&private=1&sources=1` restores a study without running it.
- `/#signature` opens Celestial Forge.
- `/#lensing` opens Lensing Observatory; `/#film` opens Orbital arrival.
- `/#film=sanctuary`, `lightwake`, `signature`, or `awakening` opens that film on its still poster. The films retain their scene handoffs and frame controls.

The published `status.json` and `public/status.json` contain the owner-run observation of **7 September 2026 at 23:14:58 UTC**, collected in the HERMES audit completed at **23:29:51 UTC**. It records 19 running LXC containers, one running QEMU virtual machine, and two online hosts. Per host counts and the hypervisor identity are withheld. These are observations from that time, not live telemetry or application-health guarantees.

Current lane counts, routing verification, and expiry remain `null`. The observation does not establish demonstrated recovery, storage redundancy, failover, or production AI routing.

`public/evidence/status-2026-08-28.json` preserves the dates and aggregate facts of the August export with explicit privacy redactions: its fleet observation is **28 August 2026**, its routing inventory is **21 August 2026**, and its original expiry is **27 September 2026**. That expiry does not extend the September observation. The audit case links to both records.

All request-routing studies execute locally in the browser and send nothing to an AI service. Private operational findings and credentials are excluded from the public evidence.

## Where to make changes

The current homepage is composed in `index.html`. `src/helios/main.js` connects focused controllers for studies, privacy, the atlas, navigation, evidence, the sovereign lab, principles, flight heritage and the signature. `src/helios/styles.css` defines the stylesheet order. The build ships one fingerprinted, cacheable entry stylesheet with the existing 19,000 byte gzip budget; it does not embed the complete stylesheet in the HTML. The table below describes the preserved V37 experience and its shared models.

| Concern                                               | Source                                                                                             |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Page composition, overlay handoffs, focus restoration | `app.tsx`, `experience-controller.ts`, `experience-overlays.tsx` in `src/odyssey/`                 |
| Study interface and rules                             | `labs.tsx`, `data.ts`, `study-experiment.ts`, `study-notes.ts` in `src/odyssey/`                   |
| Shared dated evidence and audit explanation           | `fleet-evidence.ts`, `audit-story.tsx`, `build-story.tsx` in `src/odyssey/`                        |
| Modern E.V.E. replies and destinations                | `src/odyssey/public-console.ts` and `evidence-console.tsx`                                         |
| Shared safe replies, deck names, historical lineage   | `src/lib/eve-common.ts`, `deck-metadata.ts`, `flight-lineage.ts`                                   |
| First Flight and request model                        | `first-flight.tsx`, `flight-plan.ts`, `flight-requests.ts`, `sovereign-model.ts` in `src/odyssey/` |
| Motion, visibility, opt-in audio                      | `src/odyssey/hooks.ts`                                                                             |
| Modern stylesheet order                               | `src/odyssey/main.tsx`                                                                             |

The modern homepage and legacy command deck have separate entry points. Keep shared data in focused modules; importing a legacy component into the homepage can pull its unrelated content into the initial download. Preserve historical wording and dates when editing the legacy view.

E.V.E.'s component-specific appearance lives in `src/odyssey/evidence-console.css`: structure, responsive controls, Aurora colors, and Lensing materials. Site-wide typography and forced-color rules stay in the shared themes. Its stylesheet follows the Lensing surface import so local maintenance preserves the established cascade.

Styles retain the original layered theme. Fix a component in its existing stylesheet rather than adding another global override. Import order is intentional; verify affected desktop and phone states after changing it. Optional scenes keep their styles with their lazy-loaded modules.

## Local development and verification

```powershell
npm ci
npm run build
npm run preview -- --host 127.0.0.1 --port 4178 --strictPort
npm run verify
```

For focused checks, use `lint`, `format:check`, `test:node`, `test:odyssey`, `test:artifact`, and `test:release`. The full verification command runs those checks, builds both experiences, checks their browser behavior, and verifies public-repository safety, release consistency, and whitespace.

The retained `check:v36:runtime` name checks V37 and the preserved V35 experience. Browser gates use Chrome 147 in CI; local verification can use `CHROME_PATH`. The historical `check:preview` command validates explicitly unpublished metadata and intentionally rejects the released receipt in this source tree.

A passing build or browser test does not establish live infrastructure health. Visual release review also covers desktop, phone, narrow-phone, keyboard, reduced motion, opt-in audio, legacy routes, and the actual target artifact.

GitHub Pages publishes only the verified `dist` artifact through `.github/workflows/pages.yml`. The configured public domain is `cashio.us`. Publish through the protected pull-request workflow, then verify the deployment and live routes. This release does not change DNS or Cloudflare policies. The reproducible audio tool remains available as `python scripts/build_audio_cues.py`.

## Public asset layout and archive redactions

The current front door lives in `src/helios`; `src/odyssey` supplies shared optional scenes and the V37 archive. `src/components` supplies V35. Public archive dates remain historical. Per host counts, hypervisor identity, private service and model names, private catalog counts and spend are withheld in both the rendered archives and their shipped records. A redaction does not erase copies in previously published Git history.

Asset directories preserve compatible URLs and existing cache coverage:

| Path                               | Purpose                                                                      |
| ---------------------------------- | ---------------------------------------------------------------------------- |
| `/assets/*.js` and `/assets/*.css` | Vite content hashes, covered by the existing immutable cache rule            |
| `/v38/immutable/`                  | Content-addressed current artwork covered by the same rule                   |
| `/v38/vendor/`                     | Versioned build output for the animation library                             |
| `/v38/fonts/` and `/fonts/`        | Local font families shared by current and archived pages                     |
| `/odyssey/` and `/plates/`         | Preserved scene media and archive artwork                                    |
| `/cashio/`                         | Personal workspace introduction, original identity artwork and optional film |

The directory names remain unchanged. Consolidating them would require a separate cache compatibility review. No Cloudflare configuration is changed by this refinement.

The cAshIo introduction uses a 1600px WebP derivative of the original logo and a 720p H.264 film derivative. The originals remain available for provenance; the page serves the lighter files, keeps the film on demand and muted, and uses the same local display/body fonts and content width as Zenith.
