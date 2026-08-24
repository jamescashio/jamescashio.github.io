#!/usr/bin/env python3
"""Check committed changes for whitespace errors on every workflow event."""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from collections.abc import Mapping
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class RangeResolutionError(RuntimeError):
    """Raised when a safe committed comparison range cannot be resolved."""


def _git(root: Path, *args: str, input_text: str | None = None) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", *args],
        cwd=root,
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
        input=input_text,
    )


def _require_commit(root: Path, revision: str) -> str:
    result = _git(root, "rev-parse", "--verify", f"{revision}^{{commit}}")
    if result.returncode != 0:
        raise RangeResolutionError(f"cannot resolve commit {revision!r}: {result.stderr.strip()}")
    return result.stdout.strip()


def _empty_tree(root: Path) -> str:
    result = _git(root, "hash-object", "-t", "tree", "-w", "--stdin", input_text="")
    if result.returncode != 0 or not result.stdout.strip():
        raise RangeResolutionError(f"cannot create empty tree: {result.stderr.strip() or 'unknown error'}")
    return result.stdout.strip()


def _is_zero_object_id(value: str) -> bool:
    return bool(value) and not value.strip("0")


def _resolve_range(root: Path, env: Mapping[str, str], base: str | None) -> tuple[str, list[str]]:
    if base:
        base_sha = _require_commit(root, base)
        return f"{base_sha}..HEAD", ["diff", "--check", f"{base_sha}..HEAD"]

    event_name = env.get("GITHUB_EVENT_NAME", "")
    if event_name == "pull_request":
        base_ref = env.get("GITHUB_BASE_REF", "")
        if not base_ref:
            raise RangeResolutionError("pull_request event has no GITHUB_BASE_REF")
        candidates = (f"origin/{base_ref}", base_ref)
        resolved_base = next(
            (candidate for candidate in candidates if _git(root, "rev-parse", "--verify", f"{candidate}^{{commit}}").returncode == 0),
            None,
        )
        if resolved_base is None:
            raise RangeResolutionError(f"cannot resolve pull-request base {base_ref!r}")
        merge_base = _git(root, "merge-base", "HEAD", resolved_base)
        if merge_base.returncode != 0 or not merge_base.stdout.strip():
            raise RangeResolutionError(f"cannot find merge base with {resolved_base!r}: {merge_base.stderr.strip()}")
        merge_base_sha = merge_base.stdout.strip()
        return f"{merge_base_sha}..HEAD", ["diff", "--check", f"{merge_base_sha}..HEAD"]

    before = env.get("GITHUB_EVENT_BEFORE", "")
    if event_name == "push" and before and not _is_zero_object_id(before):
        before_sha = _require_commit(root, before)
        return f"{before_sha}..HEAD", ["diff", "--check", f"{before_sha}..HEAD"]

    _require_commit(root, "HEAD")
    empty_tree = _empty_tree(root)
    return "empty tree to current HEAD", ["diff", "--check", empty_tree, "HEAD"]


def run(*, root: Path = ROOT, env: Mapping[str, str] = os.environ, base: str | None = None) -> int:
    try:
        description, command = _resolve_range(root, env, base)
    except RangeResolutionError as error:
        print(f"Committed whitespace check failed closed: {error}", file=sys.stderr)
        return 1

    print(f"Checking committed whitespace in {description}")
    result = _git(root, *command)
    if result.stdout:
        print(result.stdout, end="")
    if result.stderr:
        print(result.stderr, end="", file=sys.stderr)
    return 0 if result.returncode == 0 else 1


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", help="explicit base commit for a BASE..HEAD check")
    args = parser.parse_args()
    return run(base=args.base)


if __name__ == "__main__":
    sys.exit(main())
