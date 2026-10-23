# V40.0.2 Mostly Harmless: Arrival reel

Original cinematic artwork rendered from code (an HTML canvas film with Three.js models, captured frame by frame in headless Chromium and encoded with ffmpeg). The 36 second film opens on a star rush and a sunrise over a ringed world, passes the lab's fleet as seven craft in formation, dives through a world portal into a stainless starship flyby, and closes with the convoy locking into the cAshIo orbit. It is an imagined environment, not operational footage or a physical simulation; the figures spoken in the narration are the dated public record already on the page.

Two encodes ship under `public/assets/celestial/`:

- `cashio-v40-hero-960.mp4`: the text free cut for the hero, 960 x 540, 24 fps, 36.00 seconds, no audio, faststart, 2079072 bytes, SHA-256 `65669e4b2f5521513abf80267dc92c20050fff7dffd975223798ce1b9a21696d`. Poster `cashio-v40-hero-poster.webp` (1280 x 720).
- `cashio-v40-reel-1920.mp4`: the full cut with score and narration for the cinema, 1920 x 1080 with a baked 2.39:1 letterbox, 24 fps, 36.00 seconds, AAC stereo, faststart, 10333771 bytes, SHA-256 `9b5db4c945bbcb61fbe244f77734d5a16fa88b3eac4ebc3b960c758539241d95`. Poster `cashio-v40-reel-poster.webp`.

The hero plays the text free cut once per browser session (`sessionStorage` key `cashio-v40-arrival`), then hands off to the ringed horizon loop; later loads in the same session open on the loop. When session storage is unavailable the arrival plays as on a first visit. Watch the intro (`#film=reel`, a route of its own so the shared Helios cinema and its `#film=intro` portal film stay unchanged) opens the full cut in the V40 cinema, poster first, muted by default with native controls, so audio stays opt in. Reduced motion and hidden page handling follow the existing V40 video rules. The Helios arrival film stays on disk for the V39 edition.

The film source lives outside this repository (the code film workspace); only the encodes are published here.
