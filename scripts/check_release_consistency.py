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
    nodes = int(status["fleet_nodes"])
    jobs = int(status["crons_active"])
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
        "README fleet count": ("README.md", f"| **Fleet** | {nodes} nodes |"),
        "README automation count": ("README.md", f"| **Automation** | {jobs} active jobs |"),
        "README burn": ("README.md", f"Approximately ${burn:.2f}/day"),
        "Changelog release": ("CHANGELOG.md", f"## [{version}]"),
        "Release body version": ("RELEASE_BODY.md", f"{version} —"),
        "Release body fleet count": ("RELEASE_BODY.md", f"| Fleet nodes | {nodes} |"),
        "Release body automation count": ("RELEASE_BODY.md", f"| Autonomous jobs | {jobs} |"),
        "Release body burn": ("RELEASE_BODY.md", f"| Estimated daily inference burn | ~${burn:.2f} |"),
        "In-page release panel": ("index.html", f'<div class="v">{version} "'),
        "In-page fleet count": ("index.html", f'<b id="sr-nodes">{nodes}</b>'),
        "In-page automation count": ("index.html", f'<b id="sr-crons">{jobs}</b>'),
        "In-page burn": ("index.html", f'id="sr-burn">${burn:.2f}</b>'),
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
        f"{nodes} nodes; {jobs} jobs; ${burn:.2f}/day."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
