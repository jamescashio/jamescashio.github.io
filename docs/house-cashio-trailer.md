---
title: House Cashio, The Trailer
sources:
  - public/assets/hero/cashio-trailer-1080p.mp4
  - public/assets/hero/cashio-trailer-720p.mp4
  - public/assets/hero/cashio-trailer-poster.webp
  - public/assets/hero/cashio-trailer-text.vtt
  - src/v40/sections/films.jsx
  - src/v40/page.jsx
  - src/v40/navigation.js
verified_at: October 25, 2026
---

# House Cashio, The Trailer

A 61 second trailer parody in the Films section (04 · The Studios). The card sits after the AI Worm film and before
Roadster Studio. It opens the screening room, and `#film=trailer` links straight to it.

## Behaviour

- The card poster and the watch link both point to `#film=trailer`. The V40 navigation capture opens the screening
  room with the `trailer` film, titles the tab, and returns focus to `#films` on Escape or close.
- The film plays inside the existing cinema dialog. It starts muted like every other film, with native controls to
  unmute. It joins the previous and next loop directly after Eagle.
- Screens 720 pixels wide or narrower, and data saver connections, receive the 720p file. Everything else receives
  1080p.
- English captions ship as a `track` (off by default, because the film already sets its key lines on screen). The film
  text version under the player describes the trailer instead of Eagle.

## Privacy

The home city is withheld, as the release gate requires. The approach shot reads "LOCATION · CLASSIFIED (IT'S A
HOUSE)" and the narration says "an undisclosed location". The captions and the film text follow the same rule.

## Assets

| File                         | Bytes      | SHA 256 (first 16) |
| ---------------------------- | ---------- | ------------------ |
| `cashio-trailer-1080p.mp4`   | 19,314,131 | `b264d5bc70e6a8cf` |
| `cashio-trailer-720p.mp4`    | 7,959,903  | `1b8c2eddf84eb414` |
| `cashio-trailer-poster.webp` | 52,746     | `4222a0dda7ba1d08` |
| `cashio-trailer-text.vtt`    | 1,243      | `4d52ac59a862020a` |

H.264 High, yuv420p, BT.709 tags, 24 fps, AAC stereo, fast start. Master: 1920 by 1080, minus 14.0 LUFS integrated,
true peak minus 1.1 dBTP.

## How it was made

Rendered frame by frame from an HTML canvas and Three.js scene in headless Chromium, then encoded with ffmpeg. The
score is procedural (numpy and scipy). The narration is local text to speech with a British female voice (Kokoro,
bf_emma). Two independent review rounds shaped the cut.
