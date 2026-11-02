# V42 mobile performance preview

Preserve the Omnius, Overruled visual composition, motion, content and media while reducing the delay before the opening appears on a phone. This is an unpublished continuation of review commit `e65092085b71fca5d7ee3e73d96a07054d08fa7d`.

## Delivery changes

The build includes the small compiled opening stylesheet in the first HTML response. Each style block is authorized by its exact SHA-256 content hash; arbitrary inline styles, inline scripts and external origins remain disallowed. The independently compiled CSS remains in the artifact, and the artifact gate compares its bytes with the inline copy, checks the exact policy hashes and retains the 19,000 byte compressed CSS budget. Secondary styles still load separately.

The opening's module script and module preload links use low network priority. The already rendered artwork and fonts take priority over the interactive runtime during a constrained connection. The same scripts still load automatically, without an added timer, interaction requirement or change to their contents.

The signature and contact background videos use native lazy loading with reserved dimensions. Supporting browsers defer their poster downloads until those sections approach the viewport. The original posters and films remain intact, and browsers without this optimization retain ordinary loading. The reading edition and manually opened House Cashio player retain their existing behavior.

Canvas measurement and the first cinematic draw run in the frame after hydration completes. This separates graphics setup from activating the page's controls. The scheduled frame is cancelled if the page unmounts; motion preferences and visibility rules remain in force.

The browser can defer rendering offscreen chapters immediately when scripting is enabled. The CSS scripting media feature replaces a flag that arrived after the first layout. The variable experiment panel stays fully rendered, and the no JavaScript reading edition remains uncontained. Unsupported browsers fall back to ordinary rendering. Native links, search, keyboard focus, scrolling and all original content remain.

No artwork, video, audio or caption files are removed or reduced in fidelity. The original moving planetary hero, all three light forms, camera controls, atlas, seven experiments and House Cashio trailer remain. Observation records and their dates remain unchanged. No dependencies or infrastructure change.

## Acceptance

- Run the existing repository verification and local repository preflight without weakening any checks.
- Run at least three fresh Lighthouse mobile audits with the existing standard mobile settings, default motion and no cached profile. Require each performance score to reach 90; retain accessibility and best practices at 100. Record the individual scores and timing metrics, including any desktop result, outside the public repository.
- Measure the user-facing approval preview and the same built files without the preview-only badge separately. Label all results as local lab measurements, not live field data or physical handset results.
- Check 1440, 390 and 320 pixel layouts, original camera and motion controls, reduced motion, keyboard navigation, the no JavaScript glossary, all atlas destinations and actual muted House Cashio playback with captions available.
- Compare the original public asset bytes, sections and destinations, retain the current production rollback commit, and save the exact review commit and artifact identity.

Open the review server at `http://127.0.0.1:4408/?preview=mobile90`. It displays the unpublished badge and sends noindex headers. Doug's final preview approval is required before publication.
