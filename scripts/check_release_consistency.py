#!/usr/bin/env python3
"""Verify that the public release sources agree with status.json."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def main() -> int:
    status = json.loads(read("status.json"))
    version = str(status["version"])
    release_name = str(status["release_name"])
    verified = str(status["verified_on"])
    expires = str(status["expires_on"])
    hosts = int(status["hosts"])
    roles = int(status["documented_roles"])
    healthy = int(status["healthy_services"])
    routes = int(status["model_routes"])
    jobs = int(status["automation_jobs_last_reported"])
    burn = float(status["daily_burn"])

    files = {
        "README.md": read("README.md"),
        "CHANGELOG.md": read("CHANGELOG.md"),
        "RELEASE_BODY.md": read("RELEASE_BODY.md"),
        "index.html": read("index.html"),
    }

    checks = {
        "README release heading": ("README.md", f"# ZEUSAPOLLO {version}"),
        "README release name": ("README.md", release_name),
        "README status dates": ("README.md", f"Verified {verified}; expires {expires}"),
        "README host count": ("README.md", f"| **Hosts** | {hosts} personal homelab hosts |"),
        "README role count": ("README.md", f"| **Documented roles** | {roles} public-safe service roles |"),
        "README healthy count": ("README.md", f"| **Owner-reported healthy** | {healthy} services |"),
        "README route count": ("README.md", f"| **Model routes** | {routes} configured routes |"),
        "README automation count": ("README.md", f"| **Automation** | {jobs} last-reported jobs |"),
        "README burn": ("README.md", f"Approximately ${burn:.2f}/day, last reported"),
        "Changelog release": ("CHANGELOG.md", f"## [{version}] — {verified}"),
        "Release body version": ("RELEASE_BODY.md", f"{version} —"),
        "Release body healthy count": ("RELEASE_BODY.md", f"| Owner-reported healthy services | {healthy} |"),
        "Release body route count": ("RELEASE_BODY.md", f"| Configured model routes | {routes} |"),
        "Release body automation count": ("RELEASE_BODY.md", f"| Automation jobs | {jobs}, last reported |"),
        "Release body burn": ("RELEASE_BODY.md", f"| Estimated daily inference burn | ~${burn:.2f}, last reported |"),
        "In-page release": ("index.html", f"CASHIO.US // {version}"),
        "In-page healthy count": ("index.html", f'data-fleet="healthyServiceCount">{healthy}<'),
        "In-page route count": ("index.html", f'data-fleet="routeCount">{routes}<'),
        "In-page host count": ("index.html", f'data-fleet="hostCount">{hosts}<'),
        "In-page verified date": ("index.html", f'verifiedDisplay: "{verified}"'),
        "In-page expiry date": ("index.html", f'expiresDisplay: "{expires}"'),
        "In-page burn": ("index.html", f'data-fleet="dailyBurn">${burn:.2f}<'),
        "In-page owner-reported voice disclosure": ("index.html", "owner-reported route name"),
    }

    failures: list[str] = []
    for label, (filename, expected) in checks.items():
        if expected not in files[filename]:
            failures.append(f"{label}: expected {expected!r} in {filename}")

    if failures:
        print("Release consistency check failed:\n")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print(
        f"Release consistency passed: {version} — {release_name}; "
        f"{healthy}/{roles} owner-reported healthy roles; {hosts} hosts; "
        f"{routes} model routes; status {verified} through {expires}."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
