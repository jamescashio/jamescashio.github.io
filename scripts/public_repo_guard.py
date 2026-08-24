#!/usr/bin/env python3
"""Fail CI when public-repository content exposes common sensitive data."""

from __future__ import annotations

import json
import os
import re
import stat
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / "public-safety-report.txt"
# Windows exposes these through ``stat`` on supported Python versions. Keep
# documented fallbacks so no-follow reparse classification is deterministic on
# every host that can consume an injected or native Windows stat result.
FILE_ATTRIBUTE_REPARSE_POINT = getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0x00000400)
IO_REPARSE_TAG_MOUNT_POINT = getattr(stat, "IO_REPARSE_TAG_MOUNT_POINT", 0xA0000003)
IO_REPARSE_TAG_SYMLINK = getattr(stat, "IO_REPARSE_TAG_SYMLINK", 0xA000000C)
IO_REPARSE_TAG_NAME_SURROGATE = getattr(stat, "IO_REPARSE_TAG_NAME_SURROGATE", 0x20000000)
TEXT_SUFFIXES = {
    ".html", ".htm", ".js", ".mjs", ".css", ".json", ".md", ".txt",
    ".py", ".sh", ".yml", ".yaml", ".xml", ".svg", ".toml", ".ini",
}
ALLOWED_EMAIL_DOMAINS = {"cashio.us", "users.noreply.github.com"}
# Third-party libraries carry their own license banners, which sometimes include
# a vendor contact address. Those are not operator PII and must not be stripped —
# the license requires the notice to stay intact. Scan them for secrets and
# private addresses as usual; exempt them only from the email-domain rule.
VENDOR_DIRS = ("assets/js/vendor/",)

PATTERNS = {
    "private network address": re.compile(
        r"\b(?:10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})\b"
    ),
    "private key material": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    "common credential token": re.compile(
        r"\b(?:ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[A-Z0-9]{16}|AIza[A-Za-z0-9_-]{30,}|xox[baprs]-[A-Za-z0-9-]{10,}|sk-[A-Za-z0-9_-]{16,})\b"
    ),
}

BACKUP_NAME = re.compile(r"(?:backup|golden[_-]?path|cashio-us-v\d+|^v\d+\.html$)", re.IGNORECASE)
EMAIL = re.compile(r"\b[A-Z0-9._%+-]+@([A-Z0-9.-]+\.[A-Z]{2,})\b", re.IGNORECASE)
SENSITIVE_STATUS_KEYS = {"balance", "burn_rate", "load", "swap", "latency", "disk_pct", "storage_pct", "internal_ip"}


class RepositoryEnumerationError(RuntimeError):
    """Raised when Git cannot enumerate the repository safety boundary."""


def _ensure_repository_root(root: Path) -> None:
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--show-toplevel"],
            cwd=root,
            check=False,
            capture_output=True,
            text=True,
            encoding="utf-8",
        )
    except OSError as error:
        raise RepositoryEnumerationError(f"Git enumeration could not start: {error}") from error

    if result.returncode != 0:
        raise RepositoryEnumerationError(f"Git enumeration failed: {result.stderr.strip() or 'not a repository'}")
    if Path(result.stdout.strip()).resolve() != root.resolve():
        raise RepositoryEnumerationError("scan root is not the repository root")


def _git_paths(root: Path, *args: str) -> set[Path]:
    try:
        result = subprocess.run(
            ["git", *args],
            cwd=root,
            check=False,
            capture_output=True,
        )
    except OSError as error:
        raise RepositoryEnumerationError(f"Git enumeration could not start: {error}") from error

    if result.returncode != 0:
        stderr = result.stderr.decode("utf-8", errors="replace").strip()
        raise RepositoryEnumerationError(f"Git enumeration failed: {stderr or 'unknown error'}")

    paths: set[Path] = set()
    for raw_path in result.stdout.split(b"\0"):
        if not raw_path:
            continue
        try:
            relative = Path(raw_path.decode("utf-8"))
        except UnicodeDecodeError as error:
            raise RepositoryEnumerationError("Git returned a non-UTF-8 repository path") from error
        paths.add(root / relative)
    return paths


def _lstat_path(path: Path, *, lstat_func=os.lstat):
    try:
        return lstat_func(path)
    except FileNotFoundError:
        return None
    except OSError as error:
        raise RepositoryEnumerationError(f"working path could not be classified: {path}: {error}") from error


def _is_windows_name_surrogate(snapshot) -> bool:
    attributes = getattr(snapshot, "st_file_attributes", 0)
    try:
        is_reparse_point = bool(attributes & FILE_ATTRIBUTE_REPARSE_POINT)
    except TypeError as error:
        raise RepositoryEnumerationError("Windows file-attribute metadata is malformed") from error
    if not is_reparse_point:
        return False

    tag = getattr(snapshot, "st_reparse_tag", None)
    if not isinstance(tag, int):
        raise RepositoryEnumerationError("Windows reparse-point tag metadata is unavailable")

    return tag in {IO_REPARSE_TAG_MOUNT_POINT, IO_REPARSE_TAG_SYMLINK} or bool(
        tag & IO_REPARSE_TAG_NAME_SURROGATE
    )


def _stat_kind(snapshot) -> str:
    if _is_windows_name_surrogate(snapshot):
        return "symlink"
    mode = snapshot.st_mode
    if stat.S_ISLNK(mode):
        return "symlink"
    if stat.S_ISREG(mode):
        return "regular"
    if stat.S_ISDIR(mode):
        return "directory"
    return "other"


def _stat_signature(snapshot, *, include_content_metadata: bool) -> tuple[int, ...]:
    try:
        signature = (stat.S_IFMT(snapshot.st_mode), snapshot.st_dev, snapshot.st_ino)
        if include_content_metadata:
            signature += (snapshot.st_size, snapshot.st_mtime_ns)
        return signature
    except AttributeError as error:
        raise RepositoryEnumerationError("filesystem identity metadata is incomplete") from error


def _require_stable_snapshot(
    path: Path,
    expected,
    current,
    *,
    expected_kind: str,
    include_content_metadata: bool,
    boundary: str,
) -> None:
    if current is None or _stat_kind(expected) != expected_kind or _stat_kind(current) != expected_kind:
        raise RepositoryEnumerationError(f"{expected_kind} path changed type at {boundary}: {path}")
    if _stat_signature(expected, include_content_metadata=include_content_metadata) != _stat_signature(
        current, include_content_metadata=include_content_metadata
    ):
        raise RepositoryEnumerationError(f"{expected_kind} path changed identity at {boundary}: {path}")


def classify_working_path(path: Path, *, lstat_func=os.lstat) -> str:
    """Classify a working-tree path without following symbolic links."""
    snapshot = _lstat_path(path, lstat_func=lstat_func)
    if snapshot is None:
        return "missing"
    return _stat_kind(snapshot)


def read_regular_path_bytes(
    path: Path,
    *,
    expected_stat=None,
    lstat_func=os.lstat,
    open_func=os.open,
    fstat_func=os.fstat,
    read_func=os.read,
    close_func=os.close,
) -> bytes:
    """Read one regular file through a no-follow descriptor with stable identity checks."""
    before = _lstat_path(path, lstat_func=lstat_func)
    if before is None:
        raise RepositoryEnumerationError(f"regular path disappeared before open: {path}")
    if expected_stat is not None:
        _require_stable_snapshot(
            path,
            expected_stat,
            before,
            expected_kind="regular",
            include_content_metadata=True,
            boundary="pre-open validation",
        )
    elif _stat_kind(before) != "regular":
        raise RepositoryEnumerationError(f"regular path changed type before open: {path}")

    flags = os.O_RDONLY | getattr(os, "O_BINARY", 0) | getattr(os, "O_NOFOLLOW", 0)
    try:
        descriptor = open_func(path, flags)
    except OSError as error:
        raise RepositoryEnumerationError(f"regular path could not be opened without following links: {path}: {error}") from error

    data: bytes | None = None
    try:
        try:
            opened_before = fstat_func(descriptor)
            _require_stable_snapshot(
                path,
                before,
                opened_before,
                expected_kind="regular",
                include_content_metadata=True,
                boundary="descriptor open",
            )
            after_open = _lstat_path(path, lstat_func=lstat_func)
            _require_stable_snapshot(
                path,
                before,
                after_open,
                expected_kind="regular",
                include_content_metadata=True,
                boundary="path after open",
            )

            chunks: list[bytes] = []
            while True:
                chunk = read_func(descriptor, 1024 * 1024)
                if not isinstance(chunk, bytes):
                    raise RepositoryEnumerationError(f"regular path read returned non-byte content: {path}")
                if not chunk:
                    break
                chunks.append(chunk)

            opened_after = fstat_func(descriptor)
            _require_stable_snapshot(
                path,
                opened_before,
                opened_after,
                expected_kind="regular",
                include_content_metadata=True,
                boundary="descriptor after read",
            )
            after_read = _lstat_path(path, lstat_func=lstat_func)
            _require_stable_snapshot(
                path,
                before,
                after_read,
                expected_kind="regular",
                include_content_metadata=True,
                boundary="path after read",
            )
            data = b"".join(chunks)
        except OSError as error:
            raise RepositoryEnumerationError(f"regular path could not be read atomically: {path}: {error}") from error
    finally:
        active_error = sys.exc_info()[1]
        try:
            close_func(descriptor)
        except OSError as error:
            if active_error is None:
                raise RepositoryEnumerationError(f"regular path descriptor could not be closed: {path}: {error}") from error
            raise RepositoryEnumerationError(
                f"{active_error}; regular path descriptor also could not be closed: {path}: {error}"
            ) from error

    if data is None:
        raise RepositoryEnumerationError(f"regular path read did not complete: {path}")
    return data


def _supports_descriptor_scandir(*, scandir_func, open_func) -> bool:
    return (
        scandir_func is os.scandir
        and open_func is os.open
        and os.scandir in getattr(os, "supports_fd", set())
        and hasattr(os, "O_DIRECTORY")
        and hasattr(os, "O_NOFOLLOW")
    )


def _collect_dist_entries(directory: Path, entries, *, lstat_func=os.lstat) -> list[tuple[Path, object]]:
    collected: list[tuple[Path, object]] = []
    for entry in entries:
        raw_path = Path(entry.path)
        path = raw_path if raw_path.is_absolute() else directory / raw_path
        snapshot = _lstat_path(path, lstat_func=lstat_func)
        if snapshot is None:
            raise RepositoryEnumerationError(f"generated dist entry disappeared during classification: {path}")
        collected.append((path, snapshot))
    return collected


def _enumerate_dist_directory(
    directory: Path,
    queued_stat,
    *,
    scandir_func=os.scandir,
    lstat_func=os.lstat,
    open_func=os.open,
    fstat_func=os.fstat,
    close_func=os.close,
) -> list[tuple[Path, object]]:
    before = _lstat_path(directory, lstat_func=lstat_func)
    _require_stable_snapshot(
        directory,
        queued_stat,
        before,
        expected_kind="directory",
        include_content_metadata=False,
        boundary="before enumeration",
    )

    if _supports_descriptor_scandir(scandir_func=scandir_func, open_func=open_func):
        flags = os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW | getattr(os, "O_CLOEXEC", 0)
        try:
            descriptor = open_func(directory, flags)
        except OSError as error:
            raise RepositoryEnumerationError(
                f"generated dist directory could not be opened without following links: {directory}: {error}"
            ) from error

        collected: list[tuple[Path, object]] | None = None
        try:
            try:
                opened_before = fstat_func(descriptor)
                _require_stable_snapshot(
                    directory,
                    before,
                    opened_before,
                    expected_kind="directory",
                    include_content_metadata=False,
                    boundary="directory descriptor open",
                )
                after_open = _lstat_path(directory, lstat_func=lstat_func)
                _require_stable_snapshot(
                    directory,
                    before,
                    after_open,
                    expected_kind="directory",
                    include_content_metadata=False,
                    boundary="directory path after open",
                )
                with scandir_func(descriptor) as entries:
                    collected = _collect_dist_entries(directory, entries, lstat_func=lstat_func)
                opened_after = fstat_func(descriptor)
                _require_stable_snapshot(
                    directory,
                    opened_before,
                    opened_after,
                    expected_kind="directory",
                    include_content_metadata=False,
                    boundary="directory descriptor after enumeration",
                )
                after_enumeration = _lstat_path(directory, lstat_func=lstat_func)
                _require_stable_snapshot(
                    directory,
                    before,
                    after_enumeration,
                    expected_kind="directory",
                    include_content_metadata=False,
                    boundary="directory path after enumeration",
                )
            except OSError as error:
                raise RepositoryEnumerationError(f"generated dist could not be enumerated: {directory}: {error}") from error
        finally:
            active_error = sys.exc_info()[1]
            try:
                close_func(descriptor)
            except OSError as error:
                if active_error is None:
                    raise RepositoryEnumerationError(
                        f"generated dist directory descriptor could not be closed: {directory}: {error}"
                    ) from error
                raise RepositoryEnumerationError(
                    f"{active_error}; generated dist directory descriptor also could not be closed: {directory}: {error}"
                ) from error
        if collected is None:
            raise RepositoryEnumerationError(f"generated dist enumeration did not complete: {directory}")
        return collected

    try:
        with scandir_func(directory) as entries:
            collected = _collect_dist_entries(directory, entries, lstat_func=lstat_func)
    except OSError as error:
        raise RepositoryEnumerationError(f"generated dist could not be enumerated: {directory}: {error}") from error
    after_enumeration = _lstat_path(directory, lstat_func=lstat_func)
    _require_stable_snapshot(
        directory,
        before,
        after_enumeration,
        expected_kind="directory",
        include_content_metadata=False,
        boundary="after enumeration",
    )
    return collected


def walk_dist_paths(
    dist: Path,
    *,
    scandir_func=os.scandir,
    lstat_func=os.lstat,
    open_func=os.open,
    fstat_func=os.fstat,
    close_func=os.close,
):
    """Yield generated dist files and links without following link directories."""
    dist_stat = _lstat_path(dist, lstat_func=lstat_func)
    if dist_stat is None:
        return
    dist_kind = _stat_kind(dist_stat)
    if dist_kind in {"regular", "symlink"}:
        yield dist
        return
    if dist_kind != "directory":
        return

    pending = [(dist, dist_stat)]
    while pending:
        directory, queued_stat = pending.pop()
        children = _enumerate_dist_directory(
            directory,
            queued_stat,
            scandir_func=scandir_func,
            lstat_func=lstat_func,
            open_func=open_func,
            fstat_func=fstat_func,
            close_func=close_func,
        )

        for path, snapshot in children:
            kind = _stat_kind(snapshot)
            if kind == "directory":
                pending.append((path, snapshot))
            elif kind in {"regular", "symlink"}:
                yield path


def _is_textual_path(path: Path) -> bool:
    return path.suffix.lower() in TEXT_SUFFIXES or path.name in {"CNAME", ".gitignore"}


def _tracked_index_entries(root: Path) -> dict[Path, tuple[str, str]]:
    tracked: dict[Path, tuple[str, str]] = {}
    for mode, object_id, stage, relative in _git_paths_with_metadata(root, "ls-files", "-s", "-z", "--cached"):
        path = root / relative
        if stage != "0" or path in tracked:
            raise RepositoryEnumerationError(f"tracked path has no unambiguous stage-zero entry: {relative}")
        tracked[path] = (mode, object_id)
    return tracked


def iter_files(*, root: Path = ROOT, lstat_func=os.lstat):
    _ensure_repository_root(root)
    tracked = _tracked_index_entries(root)
    candidates = set(tracked)
    candidates.update(_git_paths(root, "ls-files", "-z", "--others", "--exclude-standard"))
    candidates.update(walk_dist_paths(root / "dist", lstat_func=lstat_func))

    for path in sorted(candidates, key=lambda candidate: candidate.as_posix()):
        kind = classify_working_path(path, lstat_func=lstat_func)
        tracked_entry = tracked.get(path)
        is_indexed_symlink = tracked_entry is not None and tracked_entry[0] == "120000"
        if is_indexed_symlink or kind == "symlink" or (_is_textual_path(path) and (tracked_entry or kind == "regular")):
            yield path


def _tracked_index_entry(path: Path, root: Path) -> tuple[str, str] | None:
    relative = path.relative_to(root).as_posix()
    entries = _git_paths_with_metadata(root, "ls-files", "-s", "-z", "--", relative)
    if not entries:
        return None
    if len(entries) != 1:
        raise RepositoryEnumerationError(f"tracked path has no unambiguous stage-zero entry: {relative}")

    mode, object_id, stage, indexed_path = entries[0]
    if stage != "0" or indexed_path != relative:
        raise RepositoryEnumerationError(f"tracked path has no unambiguous stage-zero entry: {relative}")
    if mode not in {"100644", "100755", "120000"}:
        raise RepositoryEnumerationError(f"tracked textual path has unsupported Git mode {mode}: {relative}")
    return mode, object_id


def _read_git_blob(object_id: str, relative: Path, root: Path) -> str:
    try:
        result = subprocess.run(
            ["git", "cat-file", "blob", object_id],
            cwd=root,
            check=False,
            capture_output=True,
        )
    except OSError as error:
        raise RepositoryEnumerationError(f"Git blob read could not start: {error}") from error
    if result.returncode != 0:
        stderr = result.stderr.decode("utf-8", errors="replace").strip()
        raise RepositoryEnumerationError(f"Git blob read failed for {relative.as_posix()}: {stderr or 'unknown error'}")
    try:
        return result.stdout.decode("utf-8")
    except UnicodeDecodeError as error:
        raise RepositoryEnumerationError(f"tracked textual blob is not UTF-8: {relative.as_posix()}") from error


def _git_paths_with_metadata(root: Path, *args: str) -> list[tuple[str, str, str, str]]:
    try:
        result = subprocess.run(
            ["git", *args],
            cwd=root,
            check=False,
            capture_output=True,
        )
    except OSError as error:
        raise RepositoryEnumerationError(f"Git enumeration could not start: {error}") from error
    if result.returncode != 0:
        stderr = result.stderr.decode("utf-8", errors="replace").strip()
        raise RepositoryEnumerationError(f"Git enumeration failed: {stderr or 'unknown error'}")

    entries: list[tuple[str, str, str, str]] = []
    for raw_entry in result.stdout.split(b"\0"):
        if not raw_entry:
            continue
        try:
            metadata, raw_path = raw_entry.split(b"\t", 1)
            mode, object_id, stage = metadata.decode("ascii").split()
            relative = raw_path.decode("utf-8")
        except (UnicodeDecodeError, ValueError) as error:
            raise RepositoryEnumerationError("Git returned malformed index metadata") from error
        entries.append((mode, object_id, stage, relative))
    return entries


def scan_file(
    path: Path,
    *,
    root: Path = ROOT,
    lstat_func=os.lstat,
    readlink_func=os.readlink,
    open_func=os.open,
    fstat_func=os.fstat,
    read_func=os.read,
    close_func=os.close,
) -> list[str]:
    relative = path.relative_to(root)
    tracked_entry = _tracked_index_entry(path, root)
    texts: list[str] = []

    if tracked_entry is not None:
        texts.append(_read_git_blob(tracked_entry[1], relative, root))

    working_stat = _lstat_path(path, lstat_func=lstat_func)
    kind = "missing" if working_stat is None else _stat_kind(working_stat)
    if kind == "symlink":
        try:
            target = readlink_func(path)
        except OSError as error:
            raise RepositoryEnumerationError(f"symbolic link target could not be read: {relative.as_posix()}: {error}") from error
        if isinstance(target, bytes):
            try:
                texts.append(target.decode("utf-8"))
            except UnicodeDecodeError as error:
                raise RepositoryEnumerationError(f"symbolic link target is not UTF-8: {relative.as_posix()}") from error
        else:
            texts.append(str(target))
    elif kind == "regular":
        try:
            contents = read_regular_path_bytes(
                path,
                expected_stat=working_stat,
                lstat_func=lstat_func,
                open_func=open_func,
                fstat_func=fstat_func,
                read_func=read_func,
                close_func=close_func,
            )
            texts.append(contents.decode("utf-8"))
        except UnicodeDecodeError as error:
            raise RepositoryEnumerationError(f"textual file is not UTF-8: {relative.as_posix()}") from error

    findings: list[str] = []
    for text in dict.fromkeys(texts):
        findings.extend(scan_text(relative, text))
    return list(dict.fromkeys(findings))


def scan_text(relative: Path, text: str) -> list[str]:
    findings: list[str] = []

    if relative.suffix.lower() in {".html", ".htm"} and BACKUP_NAME.search(relative.name):
        findings.append("historical or backup HTML should not be published")

    for label, pattern in PATTERNS.items():
        if pattern.search(text):
            findings.append(label)

    is_vendor = relative.as_posix().startswith(VENDOR_DIRS)
    if not is_vendor:
        for match in EMAIL.finditer(text):
            domain = match.group(1).lower()
            if domain not in ALLOWED_EMAIL_DOMAINS:
                findings.append(f"non-approved email domain: {domain}")
                break

    if relative.as_posix() in {"status.json", "public/status.json", "dist/status.json"}:
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
    enumeration_error: RepositoryEnumerationError | None = None
    try:
        for path in iter_files():
            findings = scan_file(path)
            if findings:
                failures.append((path.relative_to(ROOT), findings))
    except RepositoryEnumerationError as error:
        enumeration_error = error

    lines: list[str] = []
    if enumeration_error is not None:
        lines.append(f"Public repository safety scan failed closed: {enumeration_error}")
        result = 1
    elif failures:
        lines.append("Public repository safety scan failed:\n")
        for path, findings in failures:
            lines.append(f"- {path}: {'; '.join(sorted(set(findings)))}")
        lines.append("\nMove operational data to a private repository, sanitize the content, or use an approved public alias.")
        result = 1
    else:
        lines.append("Public repository safety scan passed.")
        result = 0

    output = "\n".join(lines) + "\n"
    REPORT.write_text(output, encoding="utf-8")
    print(output, end="")
    return result


if __name__ == "__main__":
    sys.exit(main())
