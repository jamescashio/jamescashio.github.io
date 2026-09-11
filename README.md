# cashio.us V37.17 — Continuum

Doug Cashio’s interactive universe of AI, security, and owned infrastructure. Built for technical peers and AI enthusiasts, with Bit, orbital artwork, midnight blue, cyan, gold, and human judgment at its center.

**V37.17 makes the first minute clearer and the phone decision easier to inspect.** The software version is 37.17.0. A concise introduction and three-step path lead from the flight to a visible routing consequence and the shipped interface. Changing a flight decision promotes the recap into the phone's primary action; before/after instruments use the same twelve-request model. Short-phone spacing and expanded text wrapping are refined. Bit, the orbital artwork, seven studies, dated evidence, legacy routes, quiet startup and motion controls retain their identity. See [release validation and rollback](docs/precision-preview-release.md).

## Experience

Start with First Flight: a 30-second, four-chapter journey through arrival, onboard AI, a lost connection, and a human permission decision. Follow twelve illustrative requests, change the scenario, and share the exact choices. Manual chapter controls remain available with motion paused.

Seven working studies turn the ideas into experiments. Each explains its rules, suggests a boundary to try, links to its supporting source, and shares reproducible settings. The HERMES comparison loads the same request with public or private handling; the visitor explicitly runs each version.

The Evidence section connects those demonstrations to a real owner-run audit. “How the audit changed this record” compares two dated fleet observations, distinguishes an absent historical field from zero, and leaves unverified routing unknown. E.V.E. offers named links to the evidence, builds, operator, and preserved flight lineage.

The existing cinematic world remains available: Lensing Observatory, the explorable Sanctuary chamber, Celestial Forge, five optional films, controllable ship materials and propulsion, and the original command deck. Films open on still posters and play on request. Motion follows system preferences and the global pause control; audio requires opt-in. Heavy scenes load when opened.

**THE HUMAN RECKONING** is an original release name inspired by the Butlerian Jihad in Frank Herbert’s _Dune_; it is not a quotation or canonical book title. The Lensing edition was crafted with GPT-6 Astra under Doug’s direction. The earlier visual releases are documented in [Continuum](docs/continuum.md), [Vector](docs/vector.md), [Lightwake](docs/lightwake.md), and [Sanctuary](docs/sanctuary.md).

## Routes and evidence

- `/` is the prerendered V37 homepage. Release builds contain indexable metadata. Separately packaged local previews must disable indexing.
- `/odyssey.html` remains an alias canonicalized to `/`.
- `/command-deck.html` preserves the V35 command deck. Existing `/#deck=…` bookmarks redirect there with their query and selected deck intact.
- `/command.html` remains the explicitly marked May 2026 archive.
- `/site-release.json` describes the software release, Lensing edition, and Lensing Observatory; `/event-horizon-release.json` is its identical compatibility alias. Software and evidence dates are separate.
- `/#flight=board`, `hull`, `blackout`, or `permission` opens a flight chapter.
- `/#mission=hybrid.mixed.offline.held` restores a bounded routing scenario.
- `/#build=hermes&intent=analyze&private=1&sources=1` restores a study without running it.
- `/#signature` opens Celestial Forge.
- `/#lensing` opens Lensing Observatory; `/#film` opens Orbital arrival.
- `/#film=sanctuary`, `lightwake`, `signature`, or `awakening` opens that film on its still poster. The films retain their scene handoffs and frame controls.

The published `status.json` and `public/status.json` contain the owner-run observation of **7 September 2026 at 23:14:58 UTC**, collected in the HERMES audit completed at **23:29:51 UTC**. It records 19 running LXC containers (Zeus 14, Apollo 5), one running QEMU virtual machine, and two online Proxmox hosts. These are observations from that time, not live telemetry or application-health guarantees.

Current lane counts, routing verification, and expiry remain `null`. The observation does not establish demonstrated recovery, storage redundancy, failover, or production AI routing.

`public/evidence/status-2026-08-28.json` preserves the unchanged August export: its fleet observation is **28 August 2026**, its routing inventory is **21 August 2026**, and its original expiry is **27 September 2026**. That expiry does not extend the September observation. The audit case links to both records.

All request-routing studies execute locally in the browser and send nothing to an AI service. Private operational findings and credentials are excluded from the public evidence.

## Where to make changes

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
