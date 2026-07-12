#!/usr/bin/env python3
"""Fail CI when public-repository content exposes common sensitive data."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SELF = Path(__file__).resolve()
TEXT_SUFFIXES = {
    ".html", ".htm", ".js", ".mjs", ".css", ".json", ".md", ".txt",
    ".py", ".sh", ".yml", ".yaml", ".xml", ".svg", ".toml", ".ini",
}
SKIP_DIRS = {".git", "node_modules", "__pycache__", ".regression-baseline", ".regression-diffs"}
ALLOWED_EMAIL_DOMAINS = {"cashio.us", "users.noreply.github.com"}

PATTERNS = {
    "private network address": re.compile(
        r"\b(?:10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}|127\.0\.0\.1)\b"
    ),
    "private key material": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    "common credential token": re.compile(
        r"\b(?:ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[A-Z0-9]{16}|AIza[A-Za-z0-9_-]{30,}|xox[baprs]-[A-Za-z0-9-]{10,}|sk-[A-Za-z0-9_-]{16,})\b"
    ),
}

BACKUP_NAME = re.compile(r"(?:backup|golden[_-]?path|cashio-us-v\d+|^v\d+\.html$)", re.IGNORECASE)
EMAIL = re.compile(r"\b[A-Z0-9._%+-]+@([A-Z0-9.-]+\.[A-Z]{2,})\b", re.IGNORECASE)
SENSITIVE_STATUS_KEYS = {"balance", "burn_rate", "load", "swap", "latency", "disk_pct", "storage_pct", "internal_ip"}


def iter_files():
    for path in ROOT.rglob("*"):
        if not path.is_file() or path.resolve() == SELF:
            continue
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        if path.suffix.lower() in TEXT_SUFFIXES or path.name in {"CNAME", ".gitignore"}:
            yield path


def scan_file(path: Path) -> list[str]:
    relative = path.relative_to(ROOT)
    findings: list[str] = []

    if path.suffix.lower() in {".html", ".htm"} and BACKUP_NAME.search(path.name):
        findings.append("historical or backup HTML should not be published")

    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return findings

    for label, pattern in PATTERNS.items():
        if pattern.search(text):
            findings.append(label)

    for match in EMAIL.finditer(text):
        domain = match.group(1).lower()
        if domain not in ALLOWED_EMAIL_DOMAINS:
            findings.append(f"non-approved email domain: {domain}")
            break

    if relative.as_posix() == "status.json":
        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            findings.append("status.json is not valid JSON")
        else:
            serialized_keys = {str(key).lower() for key in _walk_keys(data)}
            exposed = sorted(serialized_keys & SENSITIVE_STATUS_KEYS)
            if exposed:
                findings.append("sensitive telemetry keys: " + ", ".join(exposed))

    return findings


def _walk_keys(value):
    if isinstance(value, dict):
        for key, nested in value.items():
            yield key
            yield from _walk_keys(nested)
    elif isinstance(value, list):
        for nested in value:
            yield from _walk_keys(nested)


def main() -> int:
    failures: list[tuple[Path, list[str]]] = []
    for path in iter_files():
        findings = scan_file(path)
        if findings:
            failures.append((path.relative_to(ROOT), findings))

    if failures:
        print("Public repository safety scan failed:\n")
        for path, findings in failures:
            print(f"- {path}: {'; '.join(sorted(set(findings)))}")
        print("\nMove operational data to a private repository, sanitize the content, or use an approved public alias.")
        return 1

    print("Public repository safety scan passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
