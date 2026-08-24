from __future__ import annotations

import os
import stat
import subprocess
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from scripts import public_repo_guard

PRIVATE_ADDRESS = ".".join(("192", "168", "10", "15"))


class PublicRepoGuardTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self._git("init", "--quiet")
        self._git("config", "user.email", "tests@cashio.us")
        self._git("config", "user.name", "Cashio Guard Tests")

    def tearDown(self) -> None:
        self.temp.cleanup()

    def _git(self, *args: str) -> str:
        return subprocess.run(
            ["git", "-C", str(self.root), *args],
            check=True,
            capture_output=True,
            text=True,
        ).stdout.strip()

    def _write(self, relative: str, text: str) -> Path:
        path = self.root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")
        return path

    def _index_symlink(self, relative: str, target: str) -> Path:
        blob = subprocess.run(
            ["git", "-C", str(self.root), "hash-object", "-w", "--stdin"],
            input=f"{target}\n",
            check=True,
            capture_output=True,
            text=True,
        ).stdout.strip()
        self._git("update-index", "--add", "--cacheinfo", f"120000,{blob},{relative}")
        return self.root / relative

    def _scan_as_symlink(self, path: Path, target: str) -> list[str]:
        try:
            return public_repo_guard.scan_file(
                path,
                root=self.root,
                lstat_func=lambda _path: SimpleNamespace(st_mode=stat.S_IFLNK | 0o777),
                readlink_func=lambda _path: target,
            )
        except TypeError:
            return []

    def _windows_reparse_stat(self, tag: int):
        return SimpleNamespace(
            st_mode=stat.S_IFDIR | 0o777,
            st_file_attributes=0x00000400,
            st_reparse_tag=tag,
            st_dev=7,
            st_ino=tag,
            st_size=0,
            st_mtime_ns=1,
        )

    def test_scan_uses_git_semantics_and_still_includes_generated_dist(self) -> None:
        self._write(".gitignore", ".superpowers/\ndist/\n")
        leak = self._write(".superpowers/leak.md", f"host: {PRIVATE_ADDRESS}\n")
        self._write("tracked.md", "public release\n")
        self._git("add", ".gitignore", "tracked.md")
        self._git("add", "--force", ".superpowers/leak.md")
        self._git("commit", "--quiet", "-m", "guard fixture")

        self._write(".superpowers/local-report.md", f"ignored local {PRIVATE_ADDRESS}\n")
        self._write("notes.md", "nonignored local note\n")
        self._write("dist/status.json", '{"release":"fixture"}\n')

        scanned = {path.relative_to(self.root).as_posix() for path in public_repo_guard.iter_files(root=self.root)}
        self.assertIn(".superpowers/leak.md", scanned)
        self.assertIn("tracked.md", scanned)
        self.assertIn("notes.md", scanned)
        self.assertIn("dist/status.json", scanned)
        self.assertNotIn(".superpowers/local-report.md", scanned)
        self.assertIn("private network address", public_repo_guard.scan_file(leak, root=self.root))

    def test_git_enumeration_failure_is_fail_closed(self) -> None:
        outside_git = self.root / "not-a-repository"
        outside_git.mkdir()
        with self.assertRaises(public_repo_guard.RepositoryEnumerationError):
            list(public_repo_guard.iter_files(root=outside_git))

        report = self.root / "public-safety-report.txt"
        with (
            patch.object(
                public_repo_guard,
                "iter_files",
                side_effect=public_repo_guard.RepositoryEnumerationError("fixture failure"),
            ),
            patch.object(public_repo_guard, "REPORT", report),
        ):
            self.assertEqual(public_repo_guard.main(), 1)
        self.assertIn("failed closed", report.read_text(encoding="utf-8"))

    def test_index_only_tracked_symlink_blob_is_enumerated_and_blocked(self) -> None:
        link = self._index_symlink("broken-link.md", PRIVATE_ADDRESS)
        self.assertFalse(link.exists(), "fixture must not depend on OS symlink privileges")

        scanned = {path.relative_to(self.root).as_posix() for path in public_repo_guard.iter_files(root=self.root)}

        self.assertIn("broken-link.md", scanned)
        self.assertIn("private network address", public_repo_guard.scan_file(link, root=self.root))

    def test_every_tracked_symlink_blob_is_scanned_regardless_of_name(self) -> None:
        extensionless = self._index_symlink("private-link", PRIVATE_ADDRESS)
        binary_named = self._index_symlink("link.bin", PRIVATE_ADDRESS)

        scanned = {path.relative_to(self.root).as_posix() for path in public_repo_guard.iter_files(root=self.root)}

        self.assertIn("private-link", scanned)
        self.assertIn("link.bin", scanned)
        for link in (extensionless, binary_named):
            self.assertIn("private network address", public_repo_guard.scan_file(link, root=self.root))

    def test_staged_regular_secret_cannot_be_masked_by_clean_working_text(self) -> None:
        tracked = self._write("tracked.md", "clean committed text\n")
        self._git("add", "tracked.md")
        self._git("commit", "--quiet", "-m", "clean tracked fixture")
        tracked.write_text(f"staged host: {PRIVATE_ADDRESS}\n", encoding="utf-8")
        self._git("add", "tracked.md")
        tracked.write_text("clean unstaged text\n", encoding="utf-8")

        self.assertIn("private network address", public_repo_guard.scan_file(tracked, root=self.root))

    def test_tracked_symlink_materialized_as_regular_file_scans_both_representations(self) -> None:
        link = self._index_symlink("materialized-link", "clean-target")
        link.write_text(f"working host: {PRIVATE_ADDRESS}\n", encoding="utf-8")

        self.assertIn("private network address", public_repo_guard.scan_file(link, root=self.root))

    def test_tracked_regular_replaced_by_symlink_scans_the_working_target(self) -> None:
        tracked = self._write("tracked.md", "clean committed text\n")
        self._git("add", "tracked.md")
        self._git("commit", "--quiet", "-m", "regular tracked fixture")
        tracked.unlink()

        self.assertIn("private network address", self._scan_as_symlink(tracked, PRIVATE_ADDRESS))

    def test_tracked_symlink_retarget_scans_the_working_target(self) -> None:
        link = self._index_symlink("tracked-link", "clean-target")

        self.assertIn("private network address", self._scan_as_symlink(link, PRIVATE_ADDRESS))

    def test_duplicate_index_and_working_findings_are_reported_once(self) -> None:
        tracked = self._write("tracked.md", f"host: {PRIVATE_ADDRESS}\n")
        self._git("add", "tracked.md")

        findings = public_repo_guard.scan_file(tracked, root=self.root)

        self.assertEqual(findings.count("private network address"), 1)

    def test_staged_deletion_disappears_but_unstaged_deletion_scans_index(self) -> None:
        staged = self._write("staged-delete.md", f"host: {PRIVATE_ADDRESS}\n")
        unstaged = self._write("unstaged-delete.md", f"host: {PRIVATE_ADDRESS}\n")
        self._git("add", "staged-delete.md", "unstaged-delete.md")
        self._git("commit", "--quiet", "-m", "deletion fixtures")
        self._git("rm", "--quiet", "staged-delete.md")
        unstaged.unlink()

        scanned = {path.relative_to(self.root).as_posix() for path in public_repo_guard.iter_files(root=self.root)}

        self.assertNotIn("staged-delete.md", scanned)
        self.assertIn("unstaged-delete.md", scanned)
        self.assertIn("private network address", public_repo_guard.scan_file(unstaged, root=self.root))

    def test_untracked_broken_and_dist_directory_symlinks_are_scanned_without_traversal(self) -> None:
        self._write(".gitignore", "dist/\n.targets/\n")
        broken = self._write("private-link", "placeholder\n")

        target = self.root / ".targets" / PRIVATE_ADDRESS
        target.mkdir(parents=True)
        self._write(f".targets/{PRIVATE_ADDRESS}/inside.md", "clean ignored target\n")
        dist_link = self._write("dist/link.bin", "placeholder\n")
        links = {broken.resolve(): PRIVATE_ADDRESS, dist_link.resolve(): str(target)}

        def fake_lstat(path: Path):
            if path.resolve() in links:
                return SimpleNamespace(st_mode=stat.S_IFLNK | 0o777)
            return os.lstat(path)

        try:
            scanned_paths = list(public_repo_guard.iter_files(root=self.root, lstat_func=fake_lstat))
        except TypeError:
            scanned_paths = []

        scanned = {path.relative_to(self.root).as_posix() for path in scanned_paths}

        self.assertIn("private-link", scanned)
        self.assertIn("dist/link.bin", scanned)
        self.assertFalse(any(name.startswith("dist/link.bin/") for name in scanned))
        for link in (broken, dist_link):
            self.assertIn("private network address", self._scan_as_symlink(link, links[link.resolve()]))

    def test_dist_walker_yields_symlinks_without_descending_into_them(self) -> None:
        walker = getattr(public_repo_guard, "walk_dist_paths", None)
        self.assertTrue(callable(walker), "guard needs an injectable no-follow dist walker")

        dist = self.root / "dist"
        dist.mkdir()
        links = [dist / "private-link", dist / "link.bin"]

        class FakeEntry:
            def __init__(self, path: Path):
                self.path = str(path)

            def stat(self, *, follow_symlinks: bool):
                if follow_symlinks:
                    raise AssertionError("walker attempted to follow a symlink")
                return SimpleNamespace(st_mode=stat.S_IFLNK | 0o777)

            def is_symlink(self) -> bool:
                return True

            def is_dir(self, *, follow_symlinks: bool) -> bool:
                if follow_symlinks:
                    raise AssertionError("walker attempted to follow a symlink")
                return False

            def is_file(self, *, follow_symlinks: bool) -> bool:
                if follow_symlinks:
                    raise AssertionError("walker attempted to follow a symlink")
                return False

        class FakeScandir:
            def __init__(self, entries):
                self.entries = entries

            def __enter__(self):
                return iter(self.entries)

            def __exit__(self, *_args):
                return False

        calls: list[Path] = []

        def fake_scandir(path: Path):
            calls.append(Path(path))
            if Path(path) != dist:
                raise AssertionError("walker descended through a symlink directory")
            return FakeScandir([FakeEntry(path) for path in links])

        def fake_lstat(path: Path):
            if Path(path) in links:
                return SimpleNamespace(st_mode=stat.S_IFLNK | 0o777)
            return os.lstat(path)

        walked = list(walker(dist, scandir_func=fake_scandir, lstat_func=fake_lstat))

        self.assertEqual(walked, links)
        self.assertEqual(calls, [dist])

    def test_regular_reader_rejects_a_symlink_substitution_before_read(self) -> None:
        reader = getattr(public_repo_guard, "read_regular_path_bytes", None)
        self.assertTrue(callable(reader), "regular working files need an atomic no-follow reader")

        path = self._write("working.md", "clean working text\n")
        regular = os.lstat(path)
        substituted_link = SimpleNamespace(st_mode=stat.S_IFLNK | 0o777)
        snapshots = iter((regular, substituted_link))

        def fail_if_read(_descriptor: int, _size: int) -> bytes:
            raise AssertionError("reader accepted a descriptor reached through a substituted symlink")

        with self.assertRaises(public_repo_guard.RepositoryEnumerationError):
            reader(
                path,
                expected_stat=regular,
                lstat_func=lambda _path: next(snapshots),
                open_func=lambda _path, _flags: 73,
                fstat_func=lambda _descriptor: regular,
                read_func=fail_if_read,
                close_func=lambda _descriptor: None,
            )

    def test_regular_reader_rejects_a_post_read_metadata_change(self) -> None:
        reader = getattr(public_repo_guard, "read_regular_path_bytes", None)
        self.assertTrue(callable(reader), "regular working files need stable post-read validation")

        path = self._write("working.md", "clean working text\n")
        regular = os.lstat(path)
        changed = SimpleNamespace(
            st_mode=regular.st_mode,
            st_dev=regular.st_dev,
            st_ino=regular.st_ino,
            st_size=regular.st_size + 1,
            st_mtime_ns=regular.st_mtime_ns + 1,
        )
        path_snapshots = iter((regular, regular, regular))
        descriptor_snapshots = iter((regular, changed))
        chunks = iter((b"clean working text\n", b""))

        with self.assertRaises(public_repo_guard.RepositoryEnumerationError):
            reader(
                path,
                expected_stat=regular,
                lstat_func=lambda _path: next(path_snapshots),
                open_func=lambda _path, _flags: 73,
                fstat_func=lambda _descriptor: next(descriptor_snapshots),
                read_func=lambda _descriptor, _size: next(chunks),
                close_func=lambda _descriptor: None,
            )

    def test_regular_reader_reports_read_and_close_failures(self) -> None:
        path = self._write("working.md", "clean working text\n")
        regular = os.lstat(path)
        snapshots = iter((regular, regular))

        def fail_read(_descriptor: int, _size: int) -> bytes:
            raise OSError("read fixture failure")

        def fail_close(_descriptor: int) -> None:
            raise OSError("close fixture failure")

        with self.assertRaises(public_repo_guard.RepositoryEnumerationError) as caught:
            public_repo_guard.read_regular_path_bytes(
                path,
                expected_stat=regular,
                lstat_func=lambda _path: next(snapshots),
                open_func=lambda _path, _flags: 73,
                fstat_func=lambda _descriptor: regular,
                read_func=fail_read,
                close_func=fail_close,
            )

        self.assertIn("read fixture failure", str(caught.exception))
        self.assertIn("close fixture failure", str(caught.exception))

    def test_dist_walker_rejects_a_queued_directory_substituted_before_enumeration(self) -> None:
        dist = self.root / "dist"
        dist.mkdir()
        directory = os.lstat(dist)
        substituted_link = SimpleNamespace(st_mode=stat.S_IFLNK | 0o777)
        snapshots = iter((directory, substituted_link))

        class EmptyScandir:
            def __enter__(self):
                return iter(())

            def __exit__(self, *_args):
                return False

        with self.assertRaises(public_repo_guard.RepositoryEnumerationError):
            list(
                public_repo_guard.walk_dist_paths(
                    dist,
                    lstat_func=lambda _path: next(snapshots),
                    scandir_func=lambda _path: EmptyScandir(),
                )
            )

    def test_dist_walker_rejects_a_directory_changed_during_enumeration(self) -> None:
        dist = self.root / "dist"
        dist.mkdir()
        directory = os.lstat(dist)
        changed = SimpleNamespace(
            st_mode=directory.st_mode,
            st_dev=directory.st_dev,
            st_ino=directory.st_ino + 1,
        )
        snapshots = iter((directory, directory, changed))

        class EmptyScandir:
            def __enter__(self):
                return iter(())

            def __exit__(self, *_args):
                return False

        with self.assertRaises(public_repo_guard.RepositoryEnumerationError):
            list(
                public_repo_guard.walk_dist_paths(
                    dist,
                    lstat_func=lambda _path: next(snapshots),
                    scandir_func=lambda _path: EmptyScandir(),
                )
            )

    def test_dist_walker_uses_path_identity_when_direntry_metadata_is_incomplete(self) -> None:
        dist = self.root / "dist"
        child = dist / "sfx"
        child.mkdir(parents=True)

        class FakeEntry:
            name = "sfx"
            path = str(child)

            def stat(self, *, follow_symlinks: bool):
                if follow_symlinks:
                    raise AssertionError("walker attempted to follow a directory entry")
                return SimpleNamespace(st_mode=stat.S_IFDIR | 0o777, st_dev=0, st_ino=0)

        class FakeScandir:
            def __init__(self, entries):
                self.entries = entries

            def __enter__(self):
                return iter(self.entries)

            def __exit__(self, *_args):
                return False

        def fake_scandir(path: Path):
            return FakeScandir([FakeEntry()] if Path(path) == dist else [])

        try:
            walked = list(public_repo_guard.walk_dist_paths(dist, scandir_func=fake_scandir))
        except public_repo_guard.RepositoryEnumerationError as error:
            self.fail(f"stable path identity was rejected because DirEntry metadata was incomplete: {error}")

        self.assertEqual(walked, [])

    def test_windows_name_surrogate_constants_match_documented_and_runtime_values(self) -> None:
        expected = {
            "FILE_ATTRIBUTE_REPARSE_POINT": 0x00000400,
            "IO_REPARSE_TAG_MOUNT_POINT": 0xA0000003,
            "IO_REPARSE_TAG_SYMLINK": 0xA000000C,
            "IO_REPARSE_TAG_NAME_SURROGATE": 0x20000000,
        }

        for name, value in expected.items():
            with self.subTest(name=name):
                self.assertEqual(getattr(public_repo_guard, name, None), value)
                if hasattr(stat, name):
                    self.assertEqual(getattr(public_repo_guard, name), getattr(stat, name))

    def test_windows_name_surrogate_tags_classify_link_like_without_overclassifying_cloud_tags(self) -> None:
        name_surrogates = (0xA0000003, 0xA000000C, 0xA0000042)
        for tag in name_surrogates:
            with self.subTest(tag=hex(tag)):
                kind = public_repo_guard.classify_working_path(
                    self.root / "reparse-entry",
                    lstat_func=lambda _path, tag=tag: self._windows_reparse_stat(tag),
                )
                self.assertEqual(kind, "symlink")

        cloud = public_repo_guard.classify_working_path(
            self.root / "cloud-entry",
            lstat_func=lambda _path: self._windows_reparse_stat(0x9000001A),
        )
        self.assertEqual(cloud, "directory")

        missing_tag = SimpleNamespace(st_mode=stat.S_IFDIR | 0o777, st_file_attributes=0x00000400)
        with self.assertRaises(public_repo_guard.RepositoryEnumerationError):
            public_repo_guard.classify_working_path(
                self.root / "unknown-reparse-entry",
                lstat_func=lambda _path: missing_tag,
            )

    def test_dist_walker_yields_a_windows_junction_without_descending(self) -> None:
        dist = self.root / "dist"
        dist.mkdir()
        junction = dist / "junction"
        junction_stat = self._windows_reparse_stat(0xA0000003)

        class FakeEntry:
            path = str(junction)

        class FakeScandir:
            def __init__(self, entries):
                self.entries = entries

            def __enter__(self):
                return iter(self.entries)

            def __exit__(self, *_args):
                return False

        calls: list[Path] = []

        def fake_lstat(path: Path):
            if Path(path) == junction:
                return junction_stat
            return os.lstat(path)

        def fake_scandir(path: Path):
            path = Path(path)
            calls.append(path)
            return FakeScandir([FakeEntry()] if path == dist else [])

        walked = list(
            public_repo_guard.walk_dist_paths(
                dist,
                lstat_func=fake_lstat,
                scandir_func=fake_scandir,
            )
        )

        self.assertEqual(walked, [junction])
        self.assertEqual(calls, [dist])

    def test_windows_junction_target_is_scanned_through_readlink(self) -> None:
        junction = self._write("junction.bin", "placeholder\n")
        junction_stat = self._windows_reparse_stat(0xA0000003)

        findings = public_repo_guard.scan_file(
            junction,
            root=self.root,
            lstat_func=lambda _path: junction_stat,
            readlink_func=lambda _path: PRIVATE_ADDRESS,
        )

        self.assertIn("private network address", findings)

    def test_windows_junction_readlink_failure_is_fail_closed(self) -> None:
        junction = self._write("junction.bin", "placeholder\n")
        junction_stat = self._windows_reparse_stat(0xA0000003)

        def fail_readlink(_path: Path):
            raise OSError("junction readlink fixture failure")

        with self.assertRaises(public_repo_guard.RepositoryEnumerationError):
            public_repo_guard.scan_file(
                junction,
                root=self.root,
                lstat_func=lambda _path: junction_stat,
                readlink_func=fail_readlink,
            )

    def test_modified_regular_tracked_file_uses_working_tree_text(self) -> None:
        tracked = self._write("tracked.md", "clean committed text\n")
        self._git("add", "tracked.md")
        self._git("commit", "--quiet", "-m", "tracked fixture")
        tracked.write_text(f"modified host: {PRIVATE_ADDRESS}\n", encoding="utf-8")

        self.assertIn("private network address", public_repo_guard.scan_file(tracked, root=self.root))

    def test_loopback_tooling_is_public_safe_but_real_private_networks_fail(self) -> None:
        loopback = public_repo_guard.scan_text(Path("tests/layout.mjs"), "http://127.0.0.1:4173")
        private = public_repo_guard.scan_text(Path("src/example.ts"), f"http://{PRIVATE_ADDRESS}")
        self.assertNotIn("private network address", loopback)
        self.assertIn("private network address", private)


if __name__ == "__main__":
    unittest.main()
