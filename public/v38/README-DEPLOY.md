# cAshIo V38.2 Helios — approved release

Prepared 09-20-2026 against GitHub main at `24234b0fe2cd54910f1fc491c09ab7b2c2efa4f6`.

## Build and preview

V38 now has a maintained Vite entry at `v38/index.html`. Its styles and behavior live in `src/helios/`, with shared teaching models and flight components in `src/odyssey/`. `public/v38/` contains assets, font licenses and the preserved vendor files; it is no longer a standalone website source folder.

Run `npm ci`, then `npm run build`. The build compiles all existing entries, preserves the legacy prerender and creates `dist/v38/index.html`. The Helios post-build step inlines the small first-paint stylesheet. Run `npm run preview:helios` and open `http://127.0.0.1:4388/v38/`.

The preview server binds only to this computer, compresses text and sends noindex headers. The approved V38 HTML permits indexing. The loopback server remains a local review tool; production is served by GitHub Pages.

## Preserved identity and evidence

Keep the Unbounded, Instrument Sans and JetBrains Mono typography, navy/gold/cyan palette, original artwork, Bit, ship and quiet startup. The original image files remain alongside the efficient WebP derivatives. The fonts are served locally with their licenses. GSAP is a pinned dependency with its license retained in a vendor chunk; the optional hero and orbital engine share the existing Three.js module. The engine loads on approach, caps rendering at 30 frames per second and retains an authored vector fallback. Atlas and request-flow graphics are inline vectors with readable HTML labels. No new font, image, or library dependency is needed.

Seven studies reuse the existing bounded teaching models. Every simulated result stays labeled. The latest evidence displayed by V38 is the inherited September 18, 2026 observation; this interface work does not refresh or independently verify infrastructure, routing or backups. Legacy views preserve their own historical records.

## Verification

Run `npm run lint`, `npm run format:check`, `npm run test:node`, `npm run test:odyssey`, `npm run test:artifact`, `npm run test:release`, `npm run test:helios`, the existing layout/experience browser checks, the public repository guard and release-consistency check. The Helios test runner starts and closes its own loopback server, unless HELIOS_URL selects an existing local or live target. The existing consistency flag `--preview` refers to an older V37 preview identity and is not the flag for this nested V38 candidate.

`node scripts/measure-helios.mjs 3` measures three mobile Lighthouse runs against the compressed loopback build. `node scripts/measure-helios.mjs 1 desktop` measures desktop. Run timing checks without concurrent browser tests. These are laboratory results, not production visitor metrics.

## Publication and rollback

The owner authorized this release on 09-19-2026. Its indexing/footer markers and release records are prepared for production. Workflow actions retain their selected versions and now use immutable commits; checkout credentials are not persisted, and the privileged tag-release job no longer uses the dependency cache. Run the required checks and publish through the established pull-request and Pages workflow. The plain-root redirect already leads to V38; preserve legacy hash/query entry behavior.

After publication, verify the delivered HTML and asset hashes, mobile/desktop navigation, flight, all studies, keyboard, reduced motion and a fresh public PageSpeed sample. Revert the eventual release commit through the normal checked workflow to roll back. Record the actual merge and Pages deployment before calling the release live.
