# V43 · Starfall

Prepared 11-03-2026 on top of V42 Omnius, Overruled (`4b9600c`), keeping its look and feel.

## Idea

The homepage is a descent. The opening is orbit, Contact is touchdown, and the sky comes with you the whole way down.

## What changed

- **Deep sky.** A fixed canvas under `#v40-root` draws three parallax star depths. Chapter backgrounds become smoked glass (`rgb(8 9 12 / 0.62)`) so the sky shows through. Two nebula washes crossfade to a palette per chapter id.
- **Hyperspace.** Scroll velocity stretches stars against the scroll. Chapter links, typed eggs and any single frame jump over 260 px burst outward from the vanishing point with a short light flash.
- **Flight instruments.** A track and craft ride the right edge of the Sections rail. Altitude falls from 400 km to touchdown along the scroll; the Mach readout follows scroll speed and rings once per twenty seconds above Mach 1. At the bottom the craft lands and the readout says Mostly harmless.
- **Target lock.** The first time each chapter `h2` is three quarters in view, four brackets converge and a scan beam crosses it. Locks are body level overlays positioned from the heading's box, so React's DOM is never touched.
- **Holographic glint.** A pointer lit sheen with an edge light follows the card under a fine pointer (links, buttons, articles, `.za-panel`, `[data-tilt]`), ignoring the header, rail, footer and dialogs.
- **Arrival.** Six meteors cross the opening frame once per browser session. Later meteors appear every 7 to 15 seconds.
- **Eggs.** `starfall`, `engage` and `zoom` from the keyboard (ignored in form fields) or E.V.E.; E.V.E. also answers `mach`.

## Guarantees

- Loads after `deferred.css`, after hydration; the initial CSS budget is unchanged.
- Decorative layers are `aria-hidden` and `pointer-events: none`; the toast is a polite status.
- Pause motion, reduced motion and hidden tabs stop the loop; the sky becomes one still frame with no parallax. Forced colors and print hide every layer.
- Device pixel ratio is capped at 1.5 (1.25 on touch or four cores or fewer), star counts scale with the viewport, and idle frames drop to 30 or 15 per second.
- No sound, no network requests, no storage beyond one session flag for the arrival shower.
