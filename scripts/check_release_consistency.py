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
    backups = int(status["backups_inside_24h"])
    patches_due = int(status["security_updates_due"])
    daily_cost = float(status["observed_ai_cost_per_day"])
    monthly_cost = float(status["estimated_ai_cost_per_month"])

    # The deck spells the host count in words in its lead paragraph.
    HOST_WORDS = {1: "One core host", 2: "Two core hosts", 3: "Three core hosts"}
    host_phrase = HOST_WORDS.get(hosts, f"{hosts} core hosts")

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
        "README host count": ("README.md", f"| **Hosts** | {hosts} core homelab hosts, plus Athena at the edge |"),
        "README role count": ("README.md", f"| **Documented roles** | {roles} public-safe service roles |"),
        "README healthy count": ("README.md", f"| **Owner-reported healthy** | {healthy} services |"),
        "README route count": ("README.md", f"| **Model routes** | {routes} configured routes |"),
        "README automation count": ("README.md", f"| **Automation** | {jobs} last-reported jobs |"),
        "README operating cost": ("README.md", f"| **Observed AI operating cost** | ${daily_cost:.2f}/day; ${monthly_cost:.2f} estimated monthly run rate |"),
        "Changelog release": ("CHANGELOG.md", f"## [{version}] — {verified}"),
        "Release body version": ("RELEASE_BODY.md", f"{version} —"),
        "Release body healthy count": ("RELEASE_BODY.md", f"| Owner-reported healthy services | {healthy} |"),
        "Release body route count": ("RELEASE_BODY.md", f"| Configured model routes | {routes} |"),
        "Release body automation count": ("RELEASE_BODY.md", f"| Automation jobs | {jobs}, last reported |"),
        "Release body operating cost": ("RELEASE_BODY.md", f"| Observed AI operating cost | ${daily_cost:.2f}/day; ${monthly_cost:.2f} estimated monthly run rate; quality-first escalation retained |"),
        # --- deck markers (v39 "Aurora" DOM) ---------------------------------
        # The eleven-chapter page carried data-fleet attributes and a JS config
        # block; v32 anchored on StatCell imports. v39 renders the stat rail
        # from data- attributes on the cells and drives the boot sequence from
        # a manifest in the data block, so the checks anchor there instead.
        # The figures asserted are unchanged — only where they are read from.
        "In-page release tag": ("index.html", f"{version} · {release_name.upper()}"),
        "In-page release footer": ("index.html", f"ZEUSAPOLLO {version} // {release_name.upper()}"),
        "In-page container stat": (
            "index.html",
            f'data-value="{healthy}/{roles}" data-label="CONTAINERS RUNNING" data-sub="LIVE CHECK {verified}"',
        ),
        "In-page route stat": ("index.html", f'data-value="{routes}" data-label="MODEL LANES"'),
        "In-page patch stat": ("index.html", f'data-value="{patches_due}" data-label="SECURITY UPDATES DUE"'),
        "In-page cost stat": (
            "index.html",
            f'data-value="${daily_cost:.2f}" data-label="OBSERVED AI COST / DAY" data-sub="${monthly_cost:.2f} EST. MONTHLY"',
        ),
        "In-page host count": ("index.html", f"{host_phrase}."),
        "Boot documented roles": ("index.html", f"'CONTAINER ROLES', '{roles} DOCUMENTED'"),
        "Boot live check": ("index.html", f"'LIVE CHECK {verified}', '{healthy} OF {roles} RUNNING'"),
        "Boot backup chain": ("index.html", f"'BACKUP CHAIN', '{backups} OF {roles} INSIDE 24H'"),
        "Boot operating cost": ("index.html", f"'OPERATING COST', '${daily_cost:.2f} / DAY'"),
        "In-page Kimi K3 route": ("index.html", status["routes"]["tier_0"]),
        "In-page Gemini 3.6 route": ("index.html", status["routes"]["tier_3_multimodal"]),
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
