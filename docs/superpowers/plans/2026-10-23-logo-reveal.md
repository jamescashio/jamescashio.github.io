# cAshIo Logo Reveal Implementation Plan

> **For agentic workers:** Use native execution in this session. Steps use checkbox syntax.

**Goal:** Add Doug’s selected clickable, complete 15-second logo reveal to Cashio.us.

**Architecture:** Reuse the existing identity page and native HTML video. Add one homepage link, optimized local media, a square responsive presentation, and extend the existing pause policy to both identity films.

**Tech Stack:** React, static HTML/CSS/JavaScript, FFmpeg, existing Vite build.

**Spec:** `docs/superpowers/specs/2026-10-23-logo-reveal-design.md`

## Global Constraints

- Preserve the full source animation, square aspect ratio and audio.
- Load no reveal video before explicit playback; start muted.
- Preserve the pending V41 redesign, existing portal intro and strict content policy.
- No dependencies or refreshed infrastructure claims.

## Review Focus

- Phone layout must fit 320px without cropping the square film.
- JavaScript-disabled visitors retain native playback and a direct video link.
- Hidden/offscreen videos pause; playing one pauses the other.
- Homepage link reaches the exact section; existing intro remains available.
- Delivery media fully decodes and contains the original duration and audio.

### Task 1: Integrate and verify the reveal

**Files:** `src/v40/page.jsx`; `public/cashio.html`; `public/cashio/introduction.css`; `public/cashio/introduction.js`; new local MP4, poster and description track under `public/cashio/`.

- [x] Encode MP4 with H.264/AAC and fast-start metadata; extract a WebP still; fully decode the resulting video.
- [x] Add the homepage invitation and responsive identity-page player with native controls, explicit playback and description/fallback.
- [x] Apply the current hidden/offscreen pause policy to both films and enforce one playing identity film.
- [ ] Run build, existing relevant tests, release consistency and public guard; inspect responsive playback where browser access allows.
- [ ] Commit/push a focused pull request, use the existing safety gate and publish only this addition through the established Pages workflow if checks succeed.
