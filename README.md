# cashio.us V36 FRESH FIX

Public command console. Release revision **2 September 2026**; read-only, dated fleet export **2 September 2026**, valid through **2 October 2026** in America/Chicago. Routing inventory dated **2 September 2026**.

## Supported local commands

```powershell
npm ci
npm run verify
```

`npm run verify` runs the supported lint, formatting, Node source/artifact,
build, runtime-layout, release, public-safety, release-consistency, and
committed-whitespace gates. The reproducible audio tool remains available as
`python scripts/build_audio_cues.py`.

GitHub Pages publishes only the already-verified `dist` artifact through
`.github/workflows/pages.yml`; no branch or Jekyll publisher is supported.
The repository's live Pages source must separately be set to **GitHub Actions**
by an authorized owner before deployment. That action-time repository setting is
manual and is not changed by this code. Custom domain `cashio.us`. Do not redesign.
