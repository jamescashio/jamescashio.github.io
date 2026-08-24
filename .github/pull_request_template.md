## Purpose

Describe the public-facing outcome and why this is the smallest safe change that achieves it.

## Prime Directive

- [ ] This change works smarter, not harder: it removes duplication, automates repetition, or simplifies maintenance.
- [ ] The change is narrowly scoped and does not replace working components unnecessarily.

## Public safety

- [ ] No credentials, tokens, private keys, private addresses, internal hostnames, ports, container IDs, or deployment paths are included.
- [ ] No personal Gmail address, phone number, home address, family information, customer data, employer-confidential information, or detailed financial information is included.
- [ ] Images and documents have been checked for visible PII and metadata.
- [ ] Public telemetry is coarse and does not expose balances, utilization, latency, storage pressure, incidents, or maintenance conditions.
- [ ] Public examples fail closed and use environment-provided configuration.

## Quality

- [ ] `npm install` and `npm run build` pass.
- [ ] `python scripts/public_repo_guard.py` passes.
- [ ] `python scripts/check_release_consistency.py` passes.
- [ ] `npm run verify` passes.
- [ ] Keyboard access, reduced motion, responsive layout, and readable contrast were considered.
- [ ] Dynamic content uses safe DOM APIs rather than untrusted `innerHTML`.

## Release consistency

- [ ] `public/status.json`, root `status.json`, `CHANGELOG.md`, `RELEASE_BODY.md`, and the in-page release panel agree.
- [ ] The 21 August 2026 snapshot remains 19/19 containers, 2 hosts quorate, 10 public lanes, and 36 private catalog entries; unmeasured figures remain withheld.
- [ ] A release tag is created only after the safety workflow passes on `main`.

## Verification

List the commands, screenshots, or checks used to validate this change.
