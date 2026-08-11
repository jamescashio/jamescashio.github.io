#!/usr/bin/env python3
"""Verify that the public release sources agree with status.json.

status.json is the single source of truth for every published figure. This
checker proves two things:

1. Every figure status.json declares appears verbatim in the deck, the README,
   the changelog and the release body.
2. Every figure that was deliberately *withdrawn* stays withdrawn. Figures with
   no fresh measurement are omitted entirely rather than published stale, so the
   stale-token guard below is a hard gate, not a lint.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Figures and services retired from the public site. None of these may return to
# a published surface without a fresh, dated measurement — at which point the
# entry is removed from this tuple in the same commit that republishes it.
RETIRED_TOKENS: tuple[str, ...] = (
    "$0.26",
    "$6.49",
    "71 of 71",
    "71/71",
    "219,628",
    "31,547",
    "216,108",
    "89,851",
    "14.4%",
    "18 of 19",
    "18/19",
    "17/18",
    "11 LXC",
    "AdGuard",
    "RAGFlow",
    "LobeChat",
    "CodeGate",
    "Hermes v0.12.0",
    "18 active nodes",
    "deepseek-chat",
)

# Published surfaces the stale-figure guard covers. command.html is excluded:
# it is an explicitly banner-marked historical archive of the v21.2a build.
PUBLISHED_SURFACES: tuple[str, ...] = (
    "index.html",
    "lab.html",
    "status.json",
    "README.md",
    "RELEASE_BODY.md",
    "llms.txt",
)


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
    lanes = int(status["public_capability_lanes"])
    catalog = int(status["private_catalog_entries"])

    # The deck spells the host count in words in its lead paragraph.
    HOST_WORDS = {1: "One Proxmox host", 2: "Two Proxmox hosts", 3: "Three Proxmox hosts"}
    host_phrase = HOST_WORDS.get(hosts, f"{hosts} Proxmox hosts")
    ROLE_WORDS = {19: "nineteen"}
    role_word = ROLE_WORDS.get(roles, str(roles))
    LANE_WORDS = {10: "Ten"}
    lane_word = LANE_WORDS.get(lanes, str(lanes))
    CATALOG_WORDS = {36: "thirty-six"}
    catalog_word = CATALOG_WORDS.get(catalog, str(catalog))

    files = {name: read(name) for name in PUBLISHED_SURFACES}
    files["CHANGELOG.md"] = read("CHANGELOG.md")

    checks = {
        # ---- README ------------------------------------------------------
        "README release heading": ("README.md", f"# ZEUSAPOLLO {version}"),
        "README release name": ("README.md", release_name),
        "README status dates": ("README.md", f"Verified {verified}; expires {expires}"),
        "README host count": ("README.md", f"| **Hosts** | {hosts} core homelab hosts, plus Athena at the edge |"),
        "README role count": ("README.md", f"| **Documented roles** | {roles} public-safe service roles |"),
        "README healthy count": ("README.md", f"| **Verified running** | {healthy} of {roles} containers at the {verified} live check |"),
        "README lane count": ("README.md", f"| **Public capability lanes** | {lanes} |"),
        "README catalog count": ("README.md", f"| **Private model catalog entries** | {catalog} |"),
        "README counting rule": ("README.md", status["counting_rule"]),
        # ---- Changelog / release body ------------------------------------
        "Changelog release": ("CHANGELOG.md", f"## [{version}] — {verified}"),
        "Release body version": ("RELEASE_BODY.md", f"{version} —"),
        "Release body healthy count": ("RELEASE_BODY.md", f"| Verified containers running | {healthy} of {roles} |"),
        "Release body lane count": ("RELEASE_BODY.md", f"| Public capability lanes | {lanes} |"),
        "Release body catalog count": ("RELEASE_BODY.md", f"| Private model catalog entries | {catalog} |"),
        # ---- The deck ----------------------------------------------------
        "Deck build marker": ("index.html", 'data-build="v31-dyson"'),
        "Deck release footer": ("index.html", f"ZEUSAPOLLO · {version.upper()} // {release_name.upper()}"),
        "Deck verification chip": ("index.html", f"VERIFIED {verified}"),
        "Deck container stat": ("index.html", f"<b>{healthy}/{roles}</b><span class=\"l\">Containers running</span>"),
        "Deck host stat": ("index.html", f"<b>{hosts}</b><span class=\"l\">Proxmox hosts online</span>"),
        "Deck lane stat": ("index.html", f"<b>{lanes}</b><span class=\"l\">Public capability lanes</span>"),
        "Deck catalog stat": ("index.html", f"<b>{catalog}</b><span class=\"l\">Private catalog entries</span>"),
        "Deck host sentence": ("index.html", f"{host_phrase} run {role_word} containers."),
        "Deck lane sentence": ("index.html", f"{lane_word} public capability lanes sit in front of a private model catalog"),
        "Deck catalog sentence": ("index.html", f"the private catalog behind the gateway holds {catalog_word} entries"),
        "Deck E.V.E. branding": ("index.html", "E.V.E. — EVALUATION VERIFICATION ENGINE"),
        "Deck Bit dock": ("index.html", 'data-bit data-mood="idle"'),
        # ---- Console answers (deck logic) --------------------------------
        "Console status line": (
            "assets/js/deck-v31.js",
            f"{healthy} of {roles} containers running · {hosts} Proxmox hosts online · cluster quorate",
        ),
        "Console catalog split": (
            "assets/js/deck-v31.js",
            f"{lanes} public capability lanes — the abstraction this page publishes.",
        ),
        "Console catalog entries": (
            "assets/js/deck-v31.js",
            f"{catalog} private model catalog entries — behind the gateway, not published.",
        ),
        # ---- Lab page ----------------------------------------------------
        "Lab verified date": ("lab.html", f"verified {verified}"),
        "Lab container count": ("lab.html", f"{healthy} of {roles} containers running"),
        "Lab lane count": ("lab.html", f"{lanes} public capability lanes"),
        "Lab catalog count": ("lab.html", f"{catalog} private gateway model entries"),
        # ---- Routes ------------------------------------------------------
        "In-page Kimi K3 route": ("index.html", status["routes"]["tier_0"]),
        "In-page Gemini 3.6 route": ("index.html", status["routes"]["tier_3_multimodal"]),
        "In-page DeepSeek V4 Pro route": ("index.html", status["routes"]["tier_2"]),
    }

    files["assets/js/deck-v31.js"] = read("assets/js/deck-v31.js")

    failures: list[str] = []
    for label, (filename, expected) in checks.items():
        if expected not in files[filename]:
            failures.append(f"{label}: expected {expected!r} in {filename}")

    # ---- the stale-figure guard -----------------------------------------
    for filename in PUBLISHED_SURFACES:
        haystack = files[filename]
        for token in RETIRED_TOKENS:
            if re.search(re.escape(token), haystack, re.IGNORECASE):
                failures.append(
                    f"Retired figure {token!r} reappeared in {filename}. "
                    "Withdrawn figures need a fresh dated measurement before republication."
                )

    # The two counts describe different objects and must never be merged.
    merged = re.search(
        r"{}\s+(?:model\s+)?lanes".format(catalog), files["index.html"], re.IGNORECASE
    )
    if merged:
        failures.append(
            f"index.html publishes {catalog!r} as a lane count. "
            f"{lanes} public capability lanes and {catalog} private catalog entries are different objects."
        )

    if failures:
        print("Release consistency check failed:\n")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print(
        f"Release consistency passed: {version} — {release_name}; "
        f"{healthy}/{roles} containers verified running; {hosts} hosts; "
        f"{lanes} public capability lanes; {catalog} private catalog entries; "
        f"status {verified} through {expires}. "
        f"{len(RETIRED_TOKENS)} retired figures confirmed absent from {len(PUBLISHED_SURFACES)} published surfaces."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
