"""Failure-path checks for the offline workflow security gate."""
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

from scripts import check_workflow_security as gate


class WorkflowSecurityTests(unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory()
        self.addCleanup(self.folder.cleanup)
        root = Path(self.folder.name)
        (root / "requirements-workflow-security.txt").write_text("zizmor==1.30.1\n", encoding="utf-8")
        self.output = root / "report.json"
        for name, value in (("ROOT", root), ("OUTPUT", self.output)):
            patcher = patch.object(gate, name, value)
            patcher.start()
            self.addCleanup(patcher.stop)
        self.binary = patch.object(gate.shutil, "which", return_value="zizmor").start()
        self.version = patch.object(gate.subprocess, "check_output", return_value="zizmor 1.30.1\n").start()
        self.scan = patch.object(gate.subprocess, "run").start()
        self.addCleanup(patch.stopall)

    def report(self):
        return json.loads(self.output.read_text(encoding="utf-8"))

    def test_clean_scan_is_offline_and_does_not_inherit_tokens(self):
        self.scan.return_value = subprocess.CompletedProcess([], 0, "[]", "")
        with patch.dict(gate.os.environ, {"GH_TOKEN": "test", "GITHUB_TOKEN": "test", "ZIZMOR_TOKEN": "test"}):
            self.assertEqual(gate.main(), 0)
        args, options = self.scan.call_args
        self.assertIn("--offline", args[0])
        self.assertFalse(any(k in options["env"] for k in ("GH_TOKEN", "GITHUB_TOKEN", "ZIZMOR_TOKEN")))
        self.assertTrue(self.report()["passed"])

    def test_malformed_output_invalidates_prior_pass(self):
        self.output.write_text('{"completed":true,"passed":true}', encoding="utf-8")
        for stdout in ("not json", "{}", "[0]"):
            with self.subTest(stdout=stdout):
                self.scan.return_value = subprocess.CompletedProcess([], 0, stdout, "")
                with self.assertRaises((ValueError, RuntimeError)):
                    gate.main()
                self.assertFalse(self.report()["completed"])
                self.assertFalse(self.report()["passed"])

    def test_scanner_failure_and_empty_nonzero_result_never_pass(self):
        self.scan.return_value = subprocess.CompletedProcess([], 2, "[]", "failed")
        with self.assertRaises(RuntimeError):
            gate.main()
        self.assertFalse(self.report()["completed"])
        self.scan.return_value = subprocess.CompletedProcess([], 13, "[]", "")
        self.assertEqual(gate.main(), 1)
        self.assertFalse(self.report()["passed"])

    def test_unreviewed_version_prevents_scan(self):
        self.version.return_value = "zizmor 0.0.0"
        with self.assertRaises(RuntimeError):
            gate.main()
        self.scan.assert_not_called()
        self.assertFalse(self.report()["passed"])

    def test_security_finding_fails_and_omits_source_snippets(self):
        finding = {"ident": "unpinned-uses", "determinations": {"severity": "Medium", "confidence": "High"},
                   "locations": [], "url": "https://docs.zizmor.sh/audits/#unpinned-uses", "snippet": "private source"}
        self.scan.return_value = subprocess.CompletedProcess([], 13, json.dumps([finding]), "")
        self.assertEqual(gate.main(), 1)
        report = self.report()
        self.assertTrue(report["completed"])
        self.assertFalse(report["passed"])
        self.assertEqual(report["findings"][0]["rule"], "unpinned-uses")
        self.assertNotIn("private source", self.output.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
