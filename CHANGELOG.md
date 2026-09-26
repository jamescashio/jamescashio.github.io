# Changelog

## V39.2 · Zenith

- Type checked front door: `tsconfig.helios.json` turns on `allowJs`, `checkJs` and `noUnusedLocals` for `src/helios`, and `npm run build` runs it after the main program. `dom.js` types `$` and `$$` as HTML elements and adds `closestTarget` for event delegation; `helios-globals.d.ts` declares the window hooks (`__fold`, `__heroPause`, `__prepareHero`, `FLEET`, `Bit`), the `helios-motion`, `helios-overlay` and `helios-room-ready` events and `navigator.connection`. Dialog, input, image and video elements are cast where their members are used, the island modules are awaited on their own branches, and the `toast` argument that `setupNavigation` never read is removed.
- One home per style rule: `zenith.css` is folded into the stylesheets that own its components (hero into `arrival.css`, header, rail and sticky panels into `journey.css`, Mission Control, type controls and the flight jump into `navigation.css`, the routing law, profile and glossary into `invitation.css`, the starship plate into `rooms.css`, evidence links and E.V.E. chips into `workbench.css`, the atlas caption and engine into `scenes.css`, the wordmark, targets and ultrawide frame into `base.css`, the running text wordmark into `typography.css`, colour utilities into `utilities.css`). `refinements.css` is split: its experiment rules are `instruments.css` and its page frame, header, hero, signature plate and motion rules join `base.css`, in their former cascade order. The three target size blocks become one. Declarations a later rule always overrode are removed: the heading weight, spacing and line height in `base.css`, the fixed hero canvas placement, a hero status width, a duplicate sticky rule, a hero label spacing, and Bit's float and pop animations with the class toggle that only served them. An `!important` opacity on the experiment steps, which had cancelled their staggered fade, is removed, so the steps fade in as a route runs. Three unused studio label classes are gone. The entry stylesheet is 18,964 of 19,000 bytes gzip. The colour utilities keep `!important` and say why; every other remaining `!important` is a motion or reduced motion kill switch, the `hidden` attribute, or a Readable type override.
- Names in code: `zenith.js` becomes `page-motion.js` (hero depth, solid header, rail label), `flight-jump.js` (module warming and the warp) and `type-styles.js`. The warp, flight arrival, rail label and hero animation class names drop the release codename, and the V38 comments in the front door read as current. The Cockpit type style documents why its families carry a Z suffix.
- E.V.E.: `about` and `contact` answer in the page's own words, listed under help as page commands and reached by "who is Doug", "hire", "email" and "say hello"; they are neither evidence nor lore. A mistyped command names the closest listed command, as in "unknown command: fleets. Did you mean fleet? Try help."
- Glossary: the cAshIo entry says the name is Cashio with the AI in capitals. The footer reads "V39.2 · Directed by Doug Cashio · September 26, 2026". Evidence observations and their dates are unchanged.

* Saved review work: privacy invitations reach the decision itself, revealed feedback stays on screen with focus on the answer, Motion keeps a stable accessible name, and the glossary opens only when requested. Desktop links retain a minimum target size, E.V.E. has less empty space, the Principles action names the Lensing Observatory, and the saved mission card blends the original signature correctly. The arrival film does not preload before it is eligible to play.
* Independent review repair: E.V.E. completes a partial command once with Tab, then lets Tab move forward. Shift+Tab always moves backward. Runtime coverage checks both directions at phone and desktop widths.

* Review improvements: expose the existing reading editions from the room directory and each room, return to the selected experiment tab with one action, and keep the still arrival artwork on 3G connections. Extend the existing browser checks for each behavior.

## V39.1 · Zenith

- Plain names: the seven browser studies are now Experiments in the header, chapter rail, Mission Control and section label, so they no longer sit beside the Studios room under a near twin name. The "What runs here" note and the system map introduce Zeus and Apollo, my two servers, HERMES, my scheduler, Atlas, a local model, and DSH, my operator console, in the sentence where each first appears. The footer reads "V39.1 · Directed by Doug Cashio · September 26, 2026"; the flight label reads First Flight; the Lensing and Forge labels read The Studios; the Principles instrument drops its old codename. The glossary drops House Cashio. The V37 archive keeps its original labels.
- A calmer first screen: Bit's orbit becomes a small text action under the hero note, the scroll cue gives way on screens 1100 pixels and wider, and the header's Let's talk is an outline button beside the gold Board the starship. The orbit shows at one stronger opacity on every visit. Three uppercase labels are removed, and the system map's inspection card stays beside the map while it scrolls on desktop. Narrow phones set the four room links two by two.
- Accessibility: an open room is titled by a real h1, and the home page keeps a single h1. The Trace button reads Tracing… with its pressed state while a trace runs, then Trace again. Flight toggles no longer end in the up arrow the site reserves for links that leave it. Back then Forward in quick succession restores the page and its focus; a step away and back inside one frame no longer leaves focus where the step away put it.
- Review fixes: the hero now says what I do by day. Mission Control finds the Starship lab by its name and lists Board the starship first for "flight", and finds E.V.E. for its lore words such as 42 and Dune. The headline clears the status chip between 901 and 1100 pixels, the E.V.E. hint fits a 320 pixel phone, the section rail gains Four more rooms and its dots touch so no click falls between them, room cards take their spoken names from their visible titles, and the Light up the orbit focus ring hugs its words. The studio scenes declare the same faces as the flight, so Lensing, the Forge and the films keep their type whichever opens first, and an open scene names the browser tab. Short phones give the flight's chapter text more room, and the phone film strip fades at its edge to show it scrolls. Without JavaScript, the home page hides the controls that need it and shows each room's link to its reading edition. The film and type style rules live in stylesheet files instead of script strings.
- Code and delivery: the home page's Content Security Policy drops `'unsafe-inline'` from `style-src`. The film, type style, flight and studio styles are constructable stylesheets, and the experiments set their geometry through classes and CSS custom properties instead of style attributes. The Starship reading edition carries its example bar widths in one style block its policy admits by hash. The pre-paint entry script documents why it redirects old addresses (GitHub Pages cannot send HTTP redirects). The utility stylesheet documents its naming scale; `.m-top-4`, `.m-top-6` and an unused grid class are removed. The home signature uses the Celestial Forge's own full size celestial file and the Studios card uses the same set, so the artwork downloads once. The entry stylesheet no longer declares the bold JetBrains face; mono labels use the regular weight. Evidence observations and their dates are unchanged; the export and the interface record the September 26, 2026 publication.

## V39.0 · Zenith

- Third review round: a study link, a study shortcut or the study Next button now lands on that study's instrument with its title focused, instead of the section introduction above it. On phones, Trace a request brings the system map on screen so the trace can be watched. Back from a room returns focus to that room's card. Room cards keep their short link names and now describe themselves to screen readers. The Motion button's name states the setting while its pressed state carries the toggle. The glossary adds cAshIo and House Cashio (in the words of the cAshIo page) and Zenith. The capital I in cAshIo carries its serifs on the cAshIo page and on the saved mission card, so the name never reads as "cAshlo". The phone flight fades its chapter text at the bottom edge to show that it scrolls. The hidden E.V.E. command for The Expanse is now expanse.
- Plain names first: wide screens open the glossary under the introduction, E.V.E. answers plain questions such as "who are you", "what is your name" and "hello" with its marked lore, the fifth study is labelled Zeus and Apollo as in the glossary, and the hero record chip says it is my lab. Mission Control lists its destinations before the type styles, so phones see them without scrolling past the style buttons. "Just show me" becomes a text link, so it no longer looks like a third prediction. A disclosure the visitor closes while the page is still loading stays closed.
- Second review round: keyboard focus, section jumps and scripted scrolls all stop below the fixed header, so a focused control is never hidden under it. Phone room tabs wrap onto a second line instead of clipping the current room, the ultrawide room bar lines up with the room heading, and on phones the version history opens in place instead of covering the colophon. The privacy test scores only the first prediction; a changed answer reads "Now you have it." Route steps show as a hollow preview until the request is routed. Selecting a system on the map announces one short line instead of the whole card, study sliders are named by their label and speak their units, and the E.V.E. input has a descriptive name. The arrival film waits until the page has loaded and the browser is idle. The phone flight gives the ship a third of the screen. The signature button reads "Energize again" while lit, and E.V.E. no longer puts the archived record's future expiry in the past tense.
- Wide screens (1100 pixels and up) open the studies workbench and the system map by default, so the flagship experiments show without a click; their seven study cards replace the shortcut row there. Phones keep both folded. The disclosures are titled "The workbench" and "The system map", and the sample request no longer carries the R-01 code.
- Review round: in the Zenith flight a relay choice carried from an earlier chapter no longer replaces that chapter's own title, and the ship is labelled Explorer 01. Mission Control lists "Board the starship" under that name and finds it for "flight". The reading editions keep their closing links at the end, after the full lists. The arrival film plays on a first visit only; returning visitors start from the still artwork with its gentle light. The At a glance card links the build story. Bit's notes step aside sooner, secondary labels no longer stack above headings, the footer release line keeps its date whole, film lengths read as timecodes, the ultrawide room bar matches the content width, and E.V.E. describes cluster agreement and the archived expiry in plain words. The 404 headline is "Off the chart."
- One click, fewer names: choosing a prediction in the privacy test reveals the answer, and the privacy test has one name everywhere. The "What runs here" paragraph now names only E.V.E. and Bit; the machines are introduced on the system map. Up arrows mark only links that leave the site. Esc closes Mission Control at once, and a tap on Menu shows the destinations without raising the phone keyboard. Record columns carry dates rather than release numbers. E.V.E. lines use sentence case, answer a few more lore commands and deal surprises from a deck. System map labels sit on a backing so route lines never cross their words. The reading editions list all four aviation lessons and all three principles. The system map counters ship their real values, and the sitemap drops the superseded Grid stub. The chapter rail waits until the reader leaves the opening screen, the evidence record lists the latest observation first, and the Readable type style also enlarges body text and drops all caps. Code tidy: 31 layout and type declarations drop `!important` (54 to 23) (only motion, state and colour utility overrides keep it), the display type class is named `.display` instead of `.syne`, and three dead study rules are removed; a computed style comparison across 36 page states found no visual change.
- Clarity pass: one name for each place (Start here, Studies, System map, Rooms, Evidence) across the header, chapter rail and Mission Control. A short "What runs here" paragraph introduces each system name once, in context. Studies lead with the task and keep their working names as a smaller label. The evidence record leads with three plain facts, dates the scheduler audit and labels its columns by release; observed dates show their age. Room cards carry derivative thumbnails of each room's existing artwork. The profile explains why two handles use the first name. A Zenith 404 page replaces the V35 one. Back closes Mission Control, section jumps land just under the header, E.V.E. answers the server names and never repeats a surprise twice in a row, and the Lensing title reads as two words. The current export is also served at /evidence/status.json. Evidence dates and privacy withholdings are unchanged.
- Direct section and room-story addresses retain visible heading focus after the browser’s initial fragment or reload restoration; an already focused control is respected. The build-story room is selected before its first paint. Forward to the fragment-free home also restores hero focus, while scene exits retain their original launcher.
- Give the home page a shorter path to the creative rooms. The Starship lab holds its build story, the Principles room holds its philosophy, and each E.V.E. fact names its own observation date. Tablet navigation uses Mission Control before labels wrap. Phone flights use a chapter chooser and give more height to the scene and explanation.
- Keep the Aa visible words and accessible name in agreement in every type style. After Finish, flight guidance names the controls that remain available.
- Remove the home city from the preserved archive pages and their shared console replies; retain the original version labels and observation dates.
- Further unpublished refinements: shorten the personal introduction, routing explanation and repeated caveats; keep the seven studies and system map behind native disclosures that shared links open automatically. Preserve every experiment and the complete evidence boundary.
- Repair phone fleet captions, map labels and chapter names without reducing the 14 pixel label floor. Give the Aa control an accessible name that includes its visible label. Keep Replay flight on a full row after Finish.
- Serve the complete entry stylesheet as a fingerprinted asset under the existing 19 KB gzip budget, and split the lab, principles, heritage and signature controllers out of the entry module. Keep the existing asset paths and cache settings.
- Unpublished candidate refinements: a shorter opening, system names explained at first use, and clearer separation between a routing rule, a browser demonstration and an observed result.
- Relay choices persist through the first three flight chapters. The final chapter announces its separate permission scenario; Finish describes the visible outcome. The archived V37 recap keeps its original behavior.
- E.V.E. keeps rapid replies grouped and clears pending reply timers. Surprise commands no longer mutate the stored response text.
- The cAshIo introduction shares Zenith's local fonts and content width. The original artwork now has a 276 KB WebP derivative and the 20 second film has an 817 KB 720p derivative. Originals remain available; playback remains on demand and muted, with captions and offscreen pausing.
- A shorter home page: the Starship lab, Principles Engine, The Studios and Flight heritage open as their own pages from a new "four more rooms" row, Mission Control and the chapter rail (Starship and Studios also stay in the header), each with its own title, a way back and links to the other three.
- An open invitation: open to speaking, advising and comparing notes, beside the at a glance cards and in the contact section.
- Tighter operational security: the page, E.V.E. and the current export no longer name the hypervisor, split guest counts by host or publish backup coverage counts. Integrity results and aggregate totals stay. Private provider assignments, catalog and per-host counts, service names and spending are also withheld in the archives; their original observation dates stay intact.
- Say what the site is: a hobby lab and proof of work, built after hours. The V35 command deck and V37 front door carry archive labels. V37 links to the latest site, and the May command center archive points straight home. The V35 label adds no tab stop to cinema mode.
- Operational security, round two: the search engine data drops the home city and legal name, the operator console is described by role with its provider and skill counts withheld, and the console archive line reads V35.
- Functional labels in Zenith use a 14 pixel minimum. The narrow flight footer wraps into readable rows, and the wide opening keeps its identity below navigation.
- Review fixes: the last flight chapter fits beside the stage on short desktop screens, phone chapter tabs use the same names as desktop, the default recap sets "If you say yes" beside "If you say no" and keeps its exits in view, Mission Control keeps one height while you search, body notes move to 15 pixels, E.V.E. keeps its key hints in help, and five repeated disclaimers are cut to one plain line each. The current export names its release, V39.0 Zenith, and the sitemap drops the noindexed archive.
- Lead with plain language: hardware I own, a dated proof chip in the hero, and a workshop statement with three ways in. The repair note moves into the build story.
- Publish the routing law in place of the July 21 to 22 cost sample. Spend stays withheld until it is measured again, in the page, the evidence boundary and E.V.E.
- Give the first frame life after the arrival film: pointer depth on the artwork, a breathing sun and twinkling stars, all paused by the Motion control, reduced motion, hidden tabs and open scenes.
- Board the starship with a short warp that covers loading; the flight settles in, the loader appears only when loading is slow, and the flight module warms on visitor intent.
- Add labelled lore commands and clear to E.V.E. without changing any evidence reply.
- Restore the serifed I in the wordmark, fix the phone starship card collision, give touch links 44 pixel targets, scale the hero on ultrawide screens and add a designed share card.
- Zenith refinements: a lighter Pac-Man era introduction, the Zenith name in the footer and flight, an Aa type switch (Signature, Cockpit, Readable), one date across the page from a fresh read only fleet observation on September 24, 2026, a simpler evidence introduction, E.V.E. command chips with history, completion and a surprise, a Douglas Adams contact and footer, a flight recap that tells the final chapter, a contact exit from the flight, and header fixes from 320 to 1100 pixels.
- Proof over codenames: three at a glance cards (security for the MSP channel, private AI you can inspect, work in the open) with career, record and source links, a glossary of the names on the page, calmer routing labels, brighter secondary text, a wider final flight shot, archived exports and legacy decks that withhold the old hypervisor version, and 89 inline colour styles moved to utility classes.
- After launch: add an at a glance strip (role, career since 1996, what I build, career and certification links), withhold exact hypervisor, kernel and model versions from the page, E.V.E. and the September 18 export, restore word spacing in larger touch links, name study source links in plain words and let Bit's note step aside sooner.
- Final polish: every label reaches 12 pixels outside the smallest diagram marks, the header turns solid once the page scrolls, the chapter rail follows the main navigation in tab order, Bit's note steps aside when the reader scrolls, the scroll cue sits on the centre line, the atlas readout stays beside the map on desktop and header, hero and chapters share one frame on ultrawide screens.
- Serve the hero from the existing AVIF set, drop the unseen film poster and remove the dead custom cursor. The Helios inline style budget moves to 19 KB gzip as inline style attributes move into the stylesheet; the whole page still gets smaller.

## V38.9 — A decision you can see

- Illustrate the public research route and private decision boundary with authored vectors and a finite, interruptible signal. Keep a complete still explanation.
- Reset stale prediction feedback, announce new results, shorten phone copy and keep both prediction choices on one row at 320 pixels.
- Refine aviation lessons in the first person and link the selected aircraft to its historical source.
- Give the signature a bounded orbital response, clean up interrupted animations and retire superseded style declarations while retaining the existing stylesheet budget.
- Preserve original artwork, typography, studios, quiet startup, routing rules, evidence dates and compatibility entries. Verify both polish passes before the owner-authorized public release.

## V38.8 — A guided invitation

- Make Board the starship the primary invitation, retain the privacy test beside it, and bring the documented engineering story immediately after the opening.
- Offer Explore, Try and Understand starting routes in Mission Control while preserving its complete searchable directory, keyboard navigation and fixed search/Close controls.
- Reframe the original orbital artwork for phones and bring both opening actions and the next section into reach.
- Separate studies, privacy, atlas and evidence-console behavior into focused modules; version existing artwork and fonts with byte-preserving content-derived URLs.
- Preserve the palette, typography, original studios, quiet startup, motion controls, bounded models, dated evidence and V37.17 compatibility experience. Align the interface date and publication records for 09-21-2026.

## V38.7 — A clearer way through the workshop

- Keep Mission Control search and Close visible as destinations scroll, including on narrow phones. Refine spacing, search affordances and focus feedback with the existing visual identity.
- Match search words in any order, announce the result count, provide a clear-search action and add the Starship build story as a destination.
- Give enabled, manually paused and device-reduced motion distinct icons so the compact phone control accurately reflects its state.
- Verify keyboard scrolling, search recovery, heading focus, short-screen layouts, motion preferences and existing scenes before the authorized public release.

## V38.6 — An opening at your pace

- Keep the original orbital artwork visible. Let the opening light settle, and reserve the finite particle animation for an explicit request.
- Make Try one decision the primary invitation; start the Helios flight at rest with optional Play tour. Keep the archived flight behavior unchanged.
- Remember manual motion preferences in the browser while honoring system reduced motion. Retain usable controls when browser storage is unavailable.
- Refine phone composition, headline sizing, concise controls and spacing. Connect the starship build story to the unchanged twelve-request model, immutable source and tests, with its assumptions visible.
- Preserve root navigation, original studios, quiet startup and dated evidence. Verify motion preference changes, cancellation, narrow layouts, keyboard journeys and optional tour playback.

## V38.5 — Helios at home

- Serve the current experience directly at cashio.us. Normalize older V38 addresses and release markers while keeping their section and scene; preserve the V37.17 archive explicitly in Version history.
- Bring Celestial Forge, Lensing Observatory, all five films and the Sanctuary into Helios as optional studios, with original artwork, matching typography, shared links, cancellation and context restoration.
- Add a Studios gallery, finite light reflections, a trace progress line and faceted request tokens. Pause the portfolio behind overlays and preserve reduced motion, quiet startup and all dated evidence.
- Verify root and archive routing, Back/Forward, keyboard focus, studio loading failure/cancellation, narrow layouts, accessibility, model outcomes and the production artifact.

## V38 — Helios

- Publish the V38 Helios homepage at `/v38/` as a standalone single file page: WebGL ignition ring, GSAP and Lenis motion, Bit the co-pilot, the seven study switchboard with the routing instrument, the system atlas with DSH beside HERMES, the starship request schematic, the flight heritage hangar, and E.V.E. with fleet, kernel, backups, atlas, dsh, hermes, routes, archive and cost.
- Make `/v38/` the front door: a plain visit to the root moves there from the legacy route script. Fragments and queries keep the V37.17 experience at the root, so every 3D scene deep link and `/?v=37.17` still work.
- Ship `public/v38/status.json`, the September 18, 2026 read only observation collected through the DeepSeek Harness: 20 LXC guests (Zeus 15, Apollo 5), 1 QEMU guest, Proxmox 9.2.20, quorate, routing withheld as unknown.
- Vendor gsap 3.15.0, lenis 1.3.25 and three 0.185.1 under `public/v38/vendor/` for the same origin script policy; the public repository guard exempts those files from the email domain rule so their license banners stay intact. Commit `d64249a` (#130).

## V37.17 — Continuum

- Polish the first minute: introduce local AI and security work, a short exploration path, an explicit routing consequence, and the shipped interface without an extra disclosure.
- After a phone visitor changes the cloud or permission boundary, the primary action becomes See my decision; Test a private request restores the private HERMES example without executing it.
- Keep the twelve-request routing model; show all three short-phone recap totals together; let chapter labels wrap under increased text spacing.
- Stabilize interaction callbacks and memoize instruments so unchanged scene content is not recreated when navigation changes.
- Preserve cAshIo orbital identity, opt-in sound, scene pauses, reduced motion, artwork, media, seven studies, archived command deck, and evidence dates. Commit `3511a0f` (#126).

## V37.16 — Continuum

- Editorial refinement: remove the minor settings-link process block (duplicate screenshot, navigation link, unused stylesheet) while keeping the main personal introduction.
- Lead the smart-routing story with problem, decision, and historical result; gold Try the routing demo loads the public draft example and focuses Run, leaving execution explicit.
- Preserve original artwork, Bit, typography, colors, lighting, seven studies, legacy command deck, reduced motion, and opt-in audio. Commit `62df475` (#124).

## V37.15 — Continuum

- Fit the full boarding action on a 320×568 phone; completed flights show readable Save mission card and Copy this scenario controls.
- Shared locally generated HDR reflection lighting, tuned materials, and camera framing refine the ship and Lensing Observatory without new remote assets.
- Put the real build story before the study library; operator section adds a factual three-step account of the published V37.11 settings-link improvement.
- Software labels advance to V37.15; historical screenshot versions and infrastructure observation dates retain their original meaning. Commit `515e9ea` (#123).

## V37.14 — Continuum

- First Flight explains the visitor's actual decision and leads to one next action: test a private request.
- Refine completion feedback, motion-off replay, narrow phone controls, and laptop spacing; sourced HERMES demonstration capture plus a brief Bit response for human review.
- Consolidate shared menu and evidence-panel styles. Preserve artwork, palette, typography, Bit, films, legacy routes, opt-in audio, and dated evidence. Commit `a8aff1e` (#121).

## V37.13 — Perspective

- Meet one privacy decision before the seven-study browser; each study leads to a specific next question.
- Keep First Flight primary; observatory links preserve lighting, atmosphere, and viewpoint as a paused scene.
- Split page content, modal coordination, studies, and planet rendering into focused modules; optional study code loads on selection.
- Preserve original artwork, palette, typography, Bit, films, sound policy, legacy routes, and dated evidence. Commit `1f35f59` (#120).

## V37.12 — Continuum

- Bring the mobile flight invitation forward and preserve the original artwork, Bit, palette, fonts, films, and legacy routes.
- Refine ship materials and lighting; export an illustrated mission card with the selected settings and actual demonstration outcome.
- Restore the July V31 provider-usage observation of $0.26/day with its 21–22 July sample dates, exclusions and original source links; share that record between the story and both E.V.E. consoles.
- Explain all seven study takeaways and distinguish requests held for privacy permission from requests waiting for a connection.
- Improve tablet shading, utility text, graph labels, signature instruction space and Mission Control readability; serve the correct smaller phone artwork candidate.
- Add accessible scene-loading cancellation and recoverable failures with launcher focus restoration.
- Document the separately authorized Cloudflare analytics disable and browser-local mission-card downloads.

## V37.11 — Continuum

- Make First Flight the primary invitation, extend its blackout chapter, and keep essential phone controls reachable with manual motion-off chapters.
- Explain all seven study rules and boundaries, support reproducible settings links, and compare HERMES public and private request handling through explicit visitor actions.
- Publish the reviewed 7 September fleet observation and a real audit comparison while preserving its timestamps, unverified routing, and unchanged August archive.
- Improve artwork contrast, accessible names, keyboard focus, phone labels, and WebKit mission-share contrast while stabilizing Bit's alignment.
- Consolidate shared evidence, console data, and E.V.E. styles; fix command destinations and unusual-input recovery without changing the established artwork, films, or legacy routes.
- Synchronize browser checks with restored study settings and pass destination values as structured browser-protocol arguments.

## V37.10 — Continuum

- Connect the Sanctuary film to an original 3D chamber with selectable monoliths and core, camera and light controls, and a finite six-second awakening.
- Refine ship reflections, armor seams, gold edges, and cyan engine light without increasing geometry or rendering costs; refresh its responsive stills.
- Prioritize First Flight on phones and disclose Atmosphere controls, preserving the existing film, signature, and observatory entries.
- Add a source-backed build story, distinguish Lensing Observatory from Principles Engine, and offer a clearer contact draft.
- Load Mission Control panel styles on request, with cancellation and retry, while preserving the initial CSS limits, motion preferences, dated evidence, and legacy routes.

## V37.9 — Sanctuary

- Replace the eight-second sanctuary approach with The inner light, a new fifteen-second film with a deliberate cinematic arc.
- Add actual film-frame chapter thumbnails, timestamps and current-chapter feedback while retaining paused seeking and explicit playback.
- Fix small native keyboard timeline steps being discarded, and protect Home, End and arrow-key scrubbing with a persistent browser regression.
- Preserve the other four films, Vector opening and ship, motion controls, reduced-motion behavior, navigation and dated public evidence.

## V37.8 — Vector

- Strengthen the carrier's machined hull, recessed machinery, material contrast and directional lighting within bounded geometry and rendering costs.
- Add a real propulsion throttle and continuous hull inspection, with immediate manual responses under paused and reduced motion. Preserve the twelve-request model and existing flight controls.
- Bring the original Lightwake film into the opening on explicit request, with finite silent playback, pause, replay, still restoration, and visibility/overlay suspension.
- Tighten the phone cockpit around its scene, essential controls and outcomes; disclose precision camera controls and secondary explanations.
- Refresh ship stills from the final rendered geometry. Preserve the animated Cashio identity, five-film cinema, world workshop, seven studies, dated evidence and legacy routes.

## V37.7 — Parallax

- Shape the real observatory atmosphere with cloud, aurora, and sun controls; save the current rendered perspective as a PNG, including while motion is paused.
- Trace a finite illustrative request through human intent, orchestration, owned compute, and human review, with manual steps and explicit pause.
- Enter the computing sanctuary through Within the light, an original eight-second film. Five film choices, frame landmarks, and a focused handoff to the studies connect cinema to interaction.
- Compress repeated study-gallery navigation on phones, retain illustrated keyboard-accessible choices, and give the animated navbar logo a seamless opaque backdrop across page sections.
- Keep the 195 KB raw / 42 KB gzip initial stylesheet limits, existing rendering budget, lazy media, reduced motion, legacy routes, and dated evidence.

## V37.6 — Lightwake

- Direct Dawn, Eclipse, and Ion atmosphere controls in the opening, with illustrated entry points for film, signature, and flight.
- An original eight-second film with three frame landmarks, deliberate playback, and a handoff into the interactive world. All earlier films and links remain available.
- Richer machined orbital surfaces, inset fasteners, atmospheric scattering, and coherent resonance fronts within the existing rendering budget.
- Seven distinct study illustrations, clearer selection, and Previous/Next controls; a deeper principles engine with state-specific lighting and usable narrow-phone controls.
- Preserve animated Cashio identity, keyboard and touch interaction, global pause, reduced motion, hidden-page suspension, and the dated public archive.

## V37.5 — CELESTIAL FORGE · 09-06-2026

- Introduce the Cashio signature in champagne gold and electric cyan, with responsive WebP artwork, registered vector motion, and an optional eight-second animated GIF.
- Turn the signature viewer into Celestial Forge: a projected orbital light field responds to pointer movement, touch drag, tap ignition, six letter selections, three light treatments, and adjustable field strength.
- Add The signature awakens, an original six-second film, with a scrubbable timeline, three frame landmarks, and an explicit handoff between cinema and interactive artwork.
- Preserve both earlier films and shared links; keep all playback silent, finite, and visitor initiated. Support frame seeking on progressive hosts through a bounded same-origin media copy that is released when the film changes or closes.
- Contain zoomed artwork within its viewing window, preserve original launchers across cinema round trips, and retain keyboard, touch, pause, hidden-page suspension, and static reduced-motion controls.
- Promote software identity to 37.5.0 while preserving the Lensing Observatory, First Flight, all seven studies, dated evidence, and legacy Command Deck routes.

## V37.4 — LENSING: GATEWAKE · 09-06-2026

- Add The gate awakens, an original six-second shot with gold-core activation and planetary auroras, optimized to a 1.65 MB silent 1080p film.
- Connect the optional cinema to the actual interactive world through Enter this world, preserving the original film and its shared link.
- Refine gate materials and geometry, add deliberate gate ignition and polar auroras, and introduce a finite observatory entrance.
- Preserve poster-first playback, keyboard and touch controls, immediate reduced-motion views, hidden-page suspension, and strict rendering budgets.
- Publish consistent 37.4.0 metadata while retaining the original starship, animated Cashio identity, all seven studies, dated evidence and legacy routes.

## V37.3 — LENSING · 09-06-2026

- Open an interactive orbital observatory with machined titanium, champagne inlays, cyan courier engines, and three light treatments and camera views.
- Add a finite, visitor-controlled 24-second journey with pause, manual chapters, hidden-tab suspension, and immediate reduced-motion views.
- Include Orbital arrival, an optional five-second film with a poster-first viewer, explicit playback, and an optimized local 1080p asset.
- Refine project navigation, study illustrations, scene captions, and responsive hero composition while preserving the animated Cashio identity.
- Publish consistent 37.3.0 metadata and preserve the original starship, all seven studies, V35 evidence, and Command Deck bookmarks.

## V37 — LIGHTFOLD · 09-05-2026

- Add First Flight: four guided starship chapters with cinematic camera framing, controllable routing scenarios, and exact shared links.
- Animate twelve persistent request tokens between detailed routing bays, showing the consequences of connection and permission decisions.
- Reveal onboard AI through layered ship armor, service bays, and a progressive section plane, with matching responsive fallback art.
- Preserve the owner’s Cashio artwork in the Living Circuit viewer with six-letter exploration, touch and keyboard controls, and deliberate circuit pulses.
- Align the orbital instrument before the lightfold transition; refine the operator insignia and seven interactive studies.
- Deliver the first view directly in prerendered HTML and preserve system reduced motion, global pause, opt-in audio, and offscreen suspension.
- Promote software metadata to 37.0.0 while retaining the V35 archive, its original observation dates, and legacy command-deck bookmarks.

## V36 — THE HUMAN RECKONING · 4 September 2026

- Promote the approved Sovereign Starship experience to the main homepage, preserving the V35 command deck and existing deck bookmarks.
- Add original orbital artwork, a real interactive 3D ship, seven explanatory studies, animated Cashio branding, and accessible motion controls.
- Separate V36 software identity from the unchanged, dated V35 public evidence.
- Add production entrypoint, redirect, prerender, and V36 browser checks to the release gates.
- Original release name inspired by the Butlerian Jihad in Frank Herbert’s _Dune_ and the principle of human command.

This file records the canonical public release line for cashio.us. Visible dates use MM-DD-YYYY. Unpublished prototype numbering is intentionally omitted; Git history retains those experiments without presenting them as releases.

## [v35] — 08-30-2026

Release name: "ALL TENS." A quality pass against the nine category audit of the live V34 build. No published figure changes: the dated export, the fleet counts and the routing inventory are exactly as verified on 28 August 2026, because no fresh measurement was taken.

### Changed

- The hero opens with one plain sentence before any operator shorthand, and the dated figure is stated once rather than repeated across the chrome.
- The header deck chip follows the deck the scroll has reached instead of the deck that was pressed, so the chrome and the content cannot disagree during a glide.
- The collapsed command rail previews each deck name and tag on hover, and the phone rail carries all nine decks on a scrolling strip.
- The corner heads up display stays anchored above the phone deck rail instead of jumping to the top of the screen, and the flight control moved out of the hero.
- The viewscreen stage arrives instead of appearing: the camera opens tight with the lens wide and pulls back into the conn while the plate dissolves through it.
- Bit offers the console once, after a quiet moment on the first deck.

### Added

- A branded 404 page, and archive markers at /grid.html and /index-v44.html so superseded release URLs stay reachable.
- A link to the source repository on the contact deck.
- Twenty console responses that are not listed in help, at console depth only.

### Performance

- Airframe one shots ship as Opus in WebM with the PCM originals kept as a fallback: 443 KB down to 24 KB. Provenance and the audio gates are unchanged.
- The four JPEG fallbacks behind the AVIF and WebP plates were re-encoded, saving 165 KB.

### Code

- The 1,801 line untyped viewscreen stage is now six typed modules under src/lib/stage, inside strict TypeScript and eslint with zero warnings. The release gates read the stage as a directory and tolerate formatter reflow.

### Boundaries

- Every published figure, date and boundary is carried forward unchanged. The stopped guest remains unnamed. Audio remains off until a visitor arms it.

### Polish — 09-02-2026

A visual pass on the live V35 build. No published figure changes: every count, date and boundary is exactly as verified on 28 August 2026.

- The viewscreen targeting frame (heading tape, scope, corner brackets, scan line and status banner) now stands down once the visitor leaves the snapshot deck and returns for the 30-second flight, so no headline, tile or lane list is drawn over on decks two through nine. Phones drop the corner brackets entirely.
- The Grid deck replaces twelve placeholder tiles with a fleet map: two host rings holding the nineteen documented guest slots (the stopped guest marked), the quorum core, and the seven observed role families on curved routes with packets in flight. Selecting a role family traces its route; roles are never attributed to a host. Phones get a portrait layout; reduced motion gets a still map.
- The hero status banner clears the airframe dossier at 1440 by 900, and the operator deck's leash list and signature yield the corner dossier like the rest of the deck copy.
- The withheld figures on the Iron deck read as an evidence rule with five held items rather than a red warning block, and the routing and iron ledes explain what to do on the deck in plain language.
- Displays wider than 1920 pixels center the decks instead of pinning them to the far left.

## [v34] — 08-28-2026

Release name: "MACH ONE." This preservation pass makes the public truth easier to read without broadening what it publishes.

### Changed

- Added the LinkedIn executive still (EXECUTIVE → ARM THE STILL): a 1.91:1 LCARS plate of the dated export, dismissed with Escape / EXIT STILL.
- Restaged viewscreen HUD, Hermes article-01 schematic, and acquisition bloom so the first five seconds read as a command console without changing palette, type, Bit, or nine decks.
- First-paint E.V.E. log height follows the viewport so `#deck=eve` canonical landing survives the Pages layout-runtime gate.

### Changed

- Replaced undated health language with a read-only, dated 28 August aggregate export: 18/19 guests running, Zeus 12/13, Apollo 6/6, and two online quorate hosts on Proxmox 9.2.11.
- Kept routing as a separate 21 August inventory: ten public lanes and thirty-six private catalog entries count different objects.
- Reframed Executive mode around Route Control, Evidence Boundary, and Human Authority; labeled Build Proof and Cashio Operating Lessons.

### Boundaries

- The stopped guest remains unnamed. No raw guest, storage, utilization, network, provider, or access-path detail is added.
- Contact wording and the Black Box Receipt remain unchanged; audio, motion, archive, and privacy boundaries remain intact.

## [v33] — 08-24-2026

Release name: "MACH ONE." This release preserves the V32 command-deck identity while making its proof journey easier to enter, share, read, and operate.

### Changed

- Added canonical deck and Deck 06 article hashes with back/forward restoration and deterministic fallbacks.
- Added the visible four-beat 30-second flight, exact owner-operator identity line, and dated Black Box Receipt.
- Strengthened dialog focus, control naming, mobile safe-area clearance, lazy images, and post-paint viewscreen loading.
- Split command chrome, navigation, shared deck primitives, flight control, and receipt UI into focused React modules.
- Added warning-free lint, deterministic formatting checks, and fail-closed PR and Pages release gates.
- Preserved the owner-verified 21 August 2026 snapshot and validity policy through 20 September 2026.

### Boundaries

- No redesign, new infrastructure claims, tracking, analytics, production API calls, private topology, credentials, automatic audio, or WebGL renderer rewrite.
- `/command.html` remains the noindexed historical archive; `/lab.html` continues to redirect to the current root console.

## [v32] — 08-23-2026

Release name: "MACH ONE." The public site moves to a Vite 6 + React 19 GitHub Pages artifact while preserving the dated, public-safe ZeusApollo truth contract.

### Changed

- Extended viewscreen warp with stronger bloom and an FOV kick on every airframe change.
- Added moving scan bands to the command, rack, operator, and fold plates.
- Increased deck reveal blur and travel; accelerated the ROUTE shimmer.
- Rebuilt Seven Test Articles as a flight-test recorder with a traversing proof route, deliberate target acquisition, staged article readouts, responsive controls, and a complete reduced-motion state.
- Replaced Falcon 9 with Burt Rutan's Scaled Composites Proteus, including a dedicated tandem-wing, twin-boom procedural airframe and intentional silence rather than an invented or generic turbofan recording.
- Added a credited NASA/ESPO Proteus flight-test evidence plate, a restrained recognition pose, factual Model 281 specifications, and clearer flight-test lineage copy.
- Corrected the static export's validity boundary so “through 20 September 2026” remains inclusive through the end of that Chicago calendar day.
- Made the corner airframe/Bit HUD compress when its full state would cover marked controls, and closed Hail with a concise human-command mission stamp.
- Kept airframe audio off by default and explicit-selection-only, with intentional silence for real aircraft lacking a verified source and three original non-franchise transitions.
- Updated the owner-confirmed multimodal and adversarial lane labels to Gemini 3.7 Flash and Grok 4.6; Sonar Pro remains the research lane.
- Kept the 21 August 2026 snapshot at 19 of 19 containers, two Proxmox hosts quorate, ten public lanes, and thirty-six private catalog entries.
- Kept GitHub Pages deployment in `.github/workflows/pages.yml` with Vite base `/`.

### Boundaries

- No loading or ENGAGE gate, Request a Review flow, tracking, analytics, cookies, production API calls, private addresses, ports, credentials, live-looking counters, score bed, passive-scroll audio, first-gesture blast, or licensed franchise stems.
- `/command.html` remains an explicitly marked May 2026 historical archive; `/lab.html` redirects to the current console.

## [v31] — 08-10-2026

Release name: "The Grid." The front page was rebuilt around a Dyson-swarm viewscreen and reset to the owner-verified 08-10-2026 public architecture snapshot: 19 of 19 containers running, two Proxmox hosts online, cluster quorate, ten public capability lanes, and thirty-six private model catalog entries.

### Added

- A self-hosted WebGL viewscreen and nine-waypoint deck flight.
- E.V.E., the local read-only Evaluation Verification Engine.
- Interactive Lineage and fleet-ring controls with keyboard operation.
- Release guards for withdrawn figures and public/private boundaries.

### Boundaries

- Effects audio remained opt-in and browser-local.
- `command.html` remained the noindexed May 2026 archive.
- Unmeasured operating, backup, DNS, and maintenance figures were omitted rather than presented stale.

## [v30] — 07-22-2026

- Introduced the quality-first routing view, verified public-safe topology, Fleet Card, local console, and seven featured public-safe projects.
- Standardized release surfaces around one status object and retained restrictive content security, reduced motion, keyboard support, and static public data.

## [v28] — 07-02-2026

- Added the initial seven-lane routing view, downloadable Fleet Card, public telemetry boundaries, and automated repository safety review.

## [v21.2a] — May 2026

- Preserved only as the clearly labeled, noindexed `command.html` historical archive. It does not describe the current fleet.
