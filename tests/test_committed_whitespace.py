from __future__ import annotations

import subprocess
import tempfile
import unittest
from pathlib import Path

from scripts import check_committed_whitespace


class CommittedWhitespaceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self._git("init", "--quiet", "--initial-branch=main")
        self._git("config", "user.email", "tests@cashio.us")
        self._git("config", "user.name", "Cashio Whitespace Tests")

    def tearDown(self) -> None:
        self.temp.cleanup()

    def _git(self, *args: str) -> str:
        return subprocess.run(
            ["git", "-C", str(self.root), *args],
            check=True,
            capture_output=True,
            text=True,
        ).stdout.strip()

    def _commit(self, text: str, message: str) -> str:
        (self.root / "release.txt").write_text(text, encoding="utf-8")
        self._git("add", "release.txt")
        self._git("commit", "--quiet", "-m", message)
        return self._git("rev-parse", "HEAD")

    def test_push_range_rejects_committed_trailing_whitespace(self) -> None:
        before = self._commit("clean\n", "base")
        self._commit("clean\nbad trailing space \n", "bad")
        result = check_committed_whitespace.run(
            root=self.root,
            env={"GITHUB_EVENT_NAME": "push", "GITHUB_EVENT_BEFORE": before},
        )
        self.assertEqual(result, 1)

    def test_pull_request_uses_the_base_merge_range(self) -> None:
        self._commit("clean\n", "base")
        self._git("switch", "--quiet", "-c", "feature")
        self._commit("clean\nfeature trailing space \n", "feature")
        result = check_committed_whitespace.run(
            root=self.root,
            env={"GITHUB_EVENT_NAME": "pull_request", "GITHUB_BASE_REF": "main"},
        )
        self.assertEqual(result, 1)

    def test_workflow_dispatch_root_fallback_checks_the_root_commit(self) -> None:
        self._commit("root trailing space \n", "root")
        result = check_committed_whitespace.run(
            root=self.root,
            env={"GITHUB_EVENT_NAME": "workflow_dispatch"},
        )
        self.assertEqual(result, 1)

    def test_workflow_dispatch_checks_whitespace_retained_from_an_earlier_commit(self) -> None:
        self._commit("earlier trailing space \n", "bad earlier commit")
        (self.root / "later.txt").write_text("clean later commit\n", encoding="utf-8")
        self._git("add", "later.txt")
        self._git("commit", "--quiet", "-m", "clean later commit")

        result = check_committed_whitespace.run(
            root=self.root,
            env={"GITHUB_EVENT_NAME": "workflow_dispatch"},
        )

        self.assertEqual(result, 1)

    def test_zero_before_push_checks_whitespace_retained_from_an_earlier_commit(self) -> None:
        self._commit("earlier trailing space \n", "bad earlier commit")
        (self.root / "later.txt").write_text("clean later commit\n", encoding="utf-8")
        self._git("add", "later.txt")
        self._git("commit", "--quiet", "-m", "clean later commit")

        result = check_committed_whitespace.run(
            root=self.root,
            env={"GITHUB_EVENT_NAME": "push", "GITHUB_EVENT_BEFORE": "0" * 40},
        )

        self.assertEqual(result, 1)

    def test_no_base_current_tree_does_not_report_whitespace_that_was_removed(self) -> None:
        self._commit("temporary trailing space \n", "temporary whitespace")
        self._commit("whitespace removed\n", "remove whitespace")
        (self.root / "later.txt").write_text("clean later commit\n", encoding="utf-8")
        self._git("add", "later.txt")
        self._git("commit", "--quiet", "-m", "clean later commit")

        result = check_committed_whitespace.run(
            root=self.root,
            env={"GITHUB_EVENT_NAME": "workflow_dispatch"},
        )

        self.assertEqual(result, 0)

    def test_no_base_current_tree_is_hash_format_agnostic(self) -> None:
        sha256_temp = tempfile.TemporaryDirectory()
        self.addCleanup(sha256_temp.cleanup)
        sha256_root = Path(sha256_temp.name)

        initialized = subprocess.run(
            ["git", "-C", str(sha256_root), "init", "--quiet", "--initial-branch=main", "--object-format=sha256"],
            check=False,
            capture_output=True,
            text=True,
        )
        if initialized.returncode != 0:
            self.skipTest("installed Git does not support SHA-256 repositories")

        def git(*args: str) -> str:
            return subprocess.run(
                ["git", "-C", str(sha256_root), *args],
                check=True,
                capture_output=True,
                text=True,
            ).stdout.strip()

        git("config", "user.email", "tests@cashio.us")
        git("config", "user.name", "Cashio Whitespace Tests")
        (sha256_root / "release.txt").write_text("earlier trailing space \n", encoding="utf-8")
        git("add", "release.txt")
        git("commit", "--quiet", "-m", "bad earlier commit")
        (sha256_root / "later.txt").write_text("clean later commit\n", encoding="utf-8")
        git("add", "later.txt")
        git("commit", "--quiet", "-m", "clean later commit")
        self.assertEqual(len(git("rev-parse", "HEAD")), 64)

        result = check_committed_whitespace.run(
            root=sha256_root,
            env={"GITHUB_EVENT_NAME": "workflow_dispatch"},
        )

        self.assertEqual(result, 1)

    def test_explicit_clean_branch_range_passes(self) -> None:
        before = self._commit("clean\n", "base")
        self._commit("clean\nstill clean\n", "clean")
        result = check_committed_whitespace.run(root=self.root, env={}, base=before)
        self.assertEqual(result, 0)


if __name__ == "__main__":
    unittest.main()
