# V42 Continuum / Immersive edition

Prepared 11-01-2026 as an unpublished revision of the first V42 preview. The interface is a gateway to Doug's original work, with cinematic scale and useful discovery rather than decorative telemetry.

- An original generated portal panorama replaces the opening backdrop. The two responsive WebP variants are 1672 by 941 and 960 by 540 pixels. The artwork is fictional and contains no private briefing content.
- Original perspective geometry renders a toroidal field, a double helix and a spiral constellation. Selection morphs briefly, while manual rotation and Fold space give a deliberate response. Reduced motion shows the result immediately. Automatic work stops offscreen, while hidden, paused, or covered by cinema or Discovery.
- Discovery has three curated paths with four stops each. Select a cyan beacon in its holographic constellation, or switch to the original artwork. Gold traces the selected destination. Every stop points to an existing world, study, section or film. Copy this route copies ordinary public links to the visitor's clipboard. No account, tracking, storage or external AI service is involved.
- The opening cinema has four selectable features. House Cashio remains first, with its original media, text and captions. Eagle retains its original media and captions. The two Zenith visual shorts have text descriptions and do not claim caption tracks they do not have. Changing a selection never starts playback.
- The world map retains its accessible tabs, original illustrations, original descriptions and direct links. The selected illustration becomes a panoramic backdrop with a quiet foreground reading surface.

The previous V42 preview is retained at local commit `e950e5467fa43756cde9188d183c0b430c066ded`. Production and its rollback baseline remain `650f395adc36ae762acd99e43c0a4655d653ed1f`. Current observations, original public assets, historical releases and dates remain unchanged. New image assets are additive.

Implementation owners are `immersive-hero.tsx`, `continuum-field.js`, `continuum.css`, `discovery-console.tsx`, `discovery-projection.tsx`, `discovery-routes.ts` and `immersive-surfaces.css` under `src/v40`. The existing page owns the animation lifecycle; the existing cinema and navigation own media and destinations.

Verification includes desktop and narrow phone views, all three paths and twelve destinations, clipboard failure handling, keyboard navigation, focus return, caption provenance, real film playback, no automatic media requests, motion suspension and all existing repository gates. This document describes scope; the private review report records the actual results and limitations.
