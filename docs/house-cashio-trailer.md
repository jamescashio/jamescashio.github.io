---
title: House Cashio, The Trailer
sources:
  - public/assets/hero/cashio-trailer-1080p.mp4
  - public/assets/hero/cashio-trailer-720p.mp4
  - public/assets/hero/cashio-trailer-poster.webp
  - public/assets/hero/cashio-trailer-text.vtt
  - src/v40/sections/trailer-card.jsx
  - src/v40/sections/machines.jsx
  - src/v40/page.jsx
  - src/v40/navigation.js
verified_at: November 9, 2026
---

# House Cashio, The Trailer

A 61 second trailer parody in the Meet the machines section (08 · The system map). The card sits under the section
intro, before the request trace. It opens the screening room, and `#film=trailer` links straight to it.

## Behaviour

- The card poster and the watch link both point to `#film=trailer`. The V40 navigation capture opens the screening
  room with the `trailer` film, titles the tab, and returns to `#universe` with focus on the card on Escape or close.
- The film plays inside the existing cinema dialog. It starts muted like every other film, with native controls to
  unmute. It joins the previous and next loop directly after Eagle.
- Screens 720 pixels wide or narrower, and data saver connections, receive the 720p file. Everything else receives
  1080p.
- English captions ship as a `track` (off by default, because the film already sets its key lines on screen). The film
  text version under the player describes the trailer instead of Eagle.

## Fleet figures

The fleet act matches the documented inventory in `status.json` as observed on November 6, 2026: 2 hosts, 21
containers, 3 virtual machines, and scheduled job counts blacked out as withheld. The title card reads "Now showing",
so the film carries no month. The joke reads "Scheduled jobs · On a break · Counts withheld until
they get back."

## Privacy

The home city is withheld, as the release gate requires. The approach shot reads "LOCATION · CLASSIFIED (IT'S A
HOUSE)" and the narration says "an undisclosed location". The captions and the film text follow the same rule.

## Assets

| File                         | Bytes      | SHA 256 (first 16) |
| ---------------------------- | ---------- | ------------------ |
| `cashio-trailer-1080p.mp4`   | 20,448,716 | `6fcb85067881fa9d` |
| `cashio-trailer-720p.mp4`    | 9,237,402  | `3db67f1a2ce7a890` |
| `cashio-trailer-poster.webp` | 52,746     | `4222a0dda7ba1d08` |
| `cashio-trailer-text.vtt`    | 1,212      | `89a8fed9f6fc48d9` |

H.264 High, yuv420p, BT.709 tags, 24 fps, AAC stereo, fast start. The November 9, 2026 cut measures minus 14.1 LUFS
integrated with a sample peak of minus 0.4 dBFS (the October cut: minus 14.0 LUFS and minus 0.6 dBFS). The V44 front
door requests the films and captions with `?v=recut-20261109`, so a cached copy of the October cut is never paired
with the new transcript.

## How it was made

Rendered frame by frame from an HTML canvas and Three.js scene in headless Chromium, then encoded with ffmpeg. The
score is procedural (numpy and scipy). The narration is local text to speech with a British female voice (Kokoro,
bf_emma). Two independent review rounds shaped the cut.

## The November 9, 2026 cut

The scene source of the October film was not kept, so the three stale lines were replaced in the finished film
rather than rendered again. Everything else is the October picture and sound, encoded once more.

| Was               | Is                 | Where                                          |
| ----------------- | ------------------ | ---------------------------------------------- |
| 19 containers     | 21 containers      | Count card, frames 375 to 521, and narration   |
| 1 virtual machine | 3 virtual machines | Count card, frames 413 to 521, and narration   |
| This October      | Now showing        | Title card, frames 1015 to 1121, and narration |

- Picture: on each affected frame the old glyphs were removed by inpainting and the new ones drawn with the film's own
  type (Orbitron 700 at 88 pixels for the counts, JetBrains Mono at 30 pixels with 5 pixels of tracking for the labels,
  Orbitron 400 at 56 pixels with 24 pixels of tracking for the title line). Fill, glow, the slide with its overshoot
  and the letter by letter reveal were measured from the October frames and replayed. Redrawing the old text with this
  method reproduces the October frame, which is the check that the new text sits in the film the same way.
- Narration: the voice is centred and Kokoro reproduces each October line exactly (bf_emma at speeds 0.92, 0.93 and
  0.90, starting at 15.700, 17.300 and 42.300 seconds). Each old line was subtracted from the mid channel with a least
  squares filter fitted against its own reproduction, and the new line was voiced through the same filter and level.
  The score and effects under the lines are the October mix.
- Checks: speech recognition on the finished file hears "two hosts, 21 containers, three virtual machines" and "Now
  showing"; frames outside the three windows match the October film; duration stays 61.000 seconds.
