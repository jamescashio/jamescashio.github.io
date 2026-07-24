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
    reviewed = str(status["reviewed_on"])
    hosts = int(status["hosts"])
    roles = int(status["documented_roles"])
    active = int(status["active_roles"])
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
        "README review date": ("README.md", f"Owner reviewed {reviewed}"),
        "README host count": ("README.md", f"| **Hosts** | {hosts} personal homelab hosts |"),
        "README role count": ("README.md", f"| **Documented roles** | {roles} public-safe service roles |"),
        "README active count": ("README.md", f"| **Owner-reviewed active roles** | {active} roles, including Athena |"),
        "README route count": ("README.md", f"| **Model routes** | {routes} configured routes |"),
        "README automation count": ("README.md", f"| **Automation** | {jobs} last-reported jobs |"),
        "README burn": ("README.md", f"Approximately ${burn:.2f}/day, last reported"),
        "Changelog release": ("CHANGELOG.md", f"## [{version} Fleet Awakening] — {reviewed}"),
        "Release body version": ("RELEASE_BODY.md", f"{version} —"),
        "Release body active count": ("RELEASE_BODY.md", f"| Owner-reviewed active roles | {active}, including Athena |"),
        "Release body route count": ("RELEASE_BODY.md", f"| Configured model routes | {routes} |"),
        "Release body automation count": ("RELEASE_BODY.md", f"| Automation jobs | {jobs}, last reported |"),
        "Release body burn": ("RELEASE_BODY.md", f"| Estimated daily inference burn | ~${burn:.2f}, last reported |"),
        "In-page release": ("index.html", f"CASHIO.US // {version}"),
        "In-page active count": ("index.html", f'data-fleet="activeRoleCount">{active}<'),
        "In-page route count": ("index.html", f'data-fleet="routeCount">{routes}<'),
        "In-page host count": ("index.html", f'data-fleet="hostCount">{hosts}<'),
        "In-page review date": ("index.html", f'reviewedDisplay: "{reviewed}"'),
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
        f"{active}/{roles} owner-reviewed active roles; {hosts} hosts; "
        f"{routes} model routes; architecture reviewed {reviewed}."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
