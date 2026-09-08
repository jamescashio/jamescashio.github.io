# Odyssey composition

`app.tsx` owns the page order, shared motion/sound preferences, navigation, and existing in-page artwork. Keep its content sections independent of the modal lifecycle.

- `hero-section.tsx` owns the opening composition and optional native disclosure.
- `experience-controller.ts` owns scene selection, bookmark restoration, handoffs, and focus restoration. `experience-overlays.tsx` composes the lazy scene boundaries.
- `boundary-comparison.tsx` uses the existing HERMES routing model. It does not duplicate the decision rules.
- `labs.tsx` owns study state, saved settings, visibility, and deferred study loading. `studies/` contains one component per study and shared labeled controls. Model functions and URL validation stay in `data.ts` and `study-experiment.ts`.
- `lensing-renderer.ts` owns the Observatory scene and its rendering lifecycle. `planet-surface.ts` builds the deterministic local atlas; `planet-shaders.ts` owns its surface shaders; `planet-shadow.ts` adds analytical planet occlusion to physical materials.

The stylesheet imports in `main.tsx` retain their deliberate cascade order. The six secondary studies' code, vector artwork and styles load together only when selected; scene CSS remains with its lazy scene component. Section-specific rules live beside their component and are collected in `page-sections.css`; the Node prerenderer therefore never imports CSS. The comparison has one narrow-screen layout rule. Avoid appending a new global theme override for an isolated feature: edit the owning stylesheet.

Motion follows the shared pause preference and system reduced motion. Audio remains opt-in. Scene effects must use the existing render clock, stop when hidden, dispose owned resources, and keep keyboard/manual controls available. The model is authoritative for study results; imagery and motion illustrate it.

Validate changed behavior with the existing model and artifact tests and `check_v36_runtime.mjs`. `perspective-runtime.mjs` covers the new disclosure, comparison order and keyboard lifecycle, deferred code and styles, next-question focus, network-failure recovery, navigation hierarchy, and shared Observatory state.
