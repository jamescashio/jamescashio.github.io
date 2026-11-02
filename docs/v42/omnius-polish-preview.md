# V42 · Omnius, Overruled · readability polish

This unpublished revision improves small text, navigation and phones while preserving the original moving planetary hero, metallic gold and cyan identity, playful interactions and all existing content. It builds on local preview 764606ee0a7094176684258d27e3341947b3da27. Production rollback remains 650f395adc36ae762acd99e43c0a4655d653ed1f.

## Review

Run `node scripts/serve-helios-preview.mjs dist 4407 --review` and open `http://127.0.0.1:4407/?preview=polish`. The review server labels the page unpublished and returns noindex headers. The current receipt remains version 42.0.0 with no publication date.

## Changes and acceptance

- Essential instrument text is at least 12 pixels. Supporting text and buttons remain readable at 320 pixels, with a 16 pixel phone introduction.
- The desktop chapter rail uses readable horizontal names and retains all seven destinations.
- The hero keeps its two primary actions and explains the Explore, Try and Watch paths.
- The phone menu opens without putting focus in Search. Search, categories, keyboard navigation, close and focus return remain functional.
- Narrow layouts retain at least 44 pixel action targets, fit without horizontal overflow and keep the existing compact page height limit.
- Motion, reduced motion, bounded artwork, camera controls, captions, world atlas, Bit and the fictional hearing remain functional.
- All twelve sections, four worlds, seven experiments, original link destinations, films and captions remain. House Cashio is still the opening film.
- The observation and archives remain byte identical. This UI work makes no new operational claims.
- No dependencies, infrastructure, credentials, routes or security settings change. The 19,000 byte compressed initial CSS limit remains.

Run the required `npm run verify`, the repository preflight and desktop and phone browser review. Save screenshots, content comparison, test receipts and exact artifact identity outside the public repository. Browser phone emulation does not constitute physical phone testing.

Doug's final approval is required before preparing released metadata, pushing, opening a pull request, merging or deploying this preview.
