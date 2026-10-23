# cAshIo logo reveal

Doug selected the clickable logo intro: a homepage invitation opens his full 15-second animation with sound controls.

Add “Watch the logo reveal · 15 seconds” beside the existing optional portal intro. Link to the existing identity page at `/cashio.html#logo-reveal`, with a square native video player, its own still poster, fullscreen and sound controls, a direct MP4 fallback, and a written visual description. Playback is explicit and starts muted. Preserve the source resolution, soundtrack and complete animation; encode a smaller delivery copy with progressive streaming metadata.

Approaches considered: a muted homepage emblem adds background motion and transfer; using both repeats the same media. Doug selected the clickable introduction. My implementation choice is to reuse the identity page and browser player, which works without JavaScript and avoids adding a second cinema controller.

No redesign, dependency, evidence-date, audience or infrastructure changes. Keep the pending V41 redesign separate. Use the existing protected pull-request and Pages workflow.
