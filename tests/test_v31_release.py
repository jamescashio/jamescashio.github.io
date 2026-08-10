from __future__ import annotations

import base64
import contextlib
import gzip
import hashlib
import importlib.util
import io
import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"


def load_consistency_checker():
    path = ROOT / "scripts" / "check_release_consistency.py"
    spec = importlib.util.spec_from_file_location("release_consistency", path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class V31ReleaseContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.html = INDEX.read_text(encoding="utf-8")

    def test_repository_consistency_checker_accepts_v31(self) -> None:
        checker = load_consistency_checker()
        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            result = checker.main()
        self.assertEqual(result, 0, output.getvalue())

    def test_consistency_checker_retains_archived_v44_profile(self) -> None:
        checker = load_consistency_checker()
        original_read = checker.read

        def read_with_archived_index(path: str) -> str:
            if path == "index.html":
                return original_read("index-v44.html")
            return original_read(path)

        checker.read = read_with_archived_index
        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            result = checker.main()
        self.assertEqual(result, 0, output.getvalue())

    def test_backdrop_never_exceeds_five_runners(self) -> None:
        self.assertIn("runners.length >= 5", self.html)
        self.assertNotIn("runners.length > 5", self.html)

    def test_recognizer_runs_about_twice_per_minute_independent_of_frames(self) -> None:
        timing = re.search(
            r"RECOG_TRAVEL_MIN\s*=\s*(\d+),\s*"
            r"RECOG_TRAVEL_SPAN\s*=\s*(\d+),\s*"
            r"RECOG_GAP_MIN\s*=\s*(\d+),\s*"
            r"RECOG_GAP_SPAN\s*=\s*(\d+)",
            self.html,
        )
        self.assertIsNotNone(timing, "Recognizer timing constants are missing")
        travel_min, travel_span, gap_min, gap_span = map(int, timing.groups())
        self.assertEqual((travel_min + gap_min, travel_min + travel_span + gap_min + gap_span), (26, 34))
        self.assertIn("recog.x += recog.v * recogDt", self.html)

    def test_effects_only_audio_has_no_continuous_bed(self) -> None:
        self.assertNotIn("function startBed", self.html)
        self.assertNotIn("bedGain", self.html)
        self.assertIsNone(re.search(r"\bdrone\b", self.html, re.IGNORECASE))

    def test_no_stale_release_tokens_in_the_self_contained_file(self) -> None:
        for token in ("07-30-2026", "18.3%", "220,780", "12,100", "v39"):
            self.assertNotIn(token.lower(), self.html.lower(), token)

    def test_manifest_payload_is_byte_identical_after_container_normalization(self) -> None:
        match = re.search(
            r'<script type="__bundler/manifest">\s*(\{.*?\})\s*</script>',
            self.html,
            re.DOTALL,
        )
        self.assertIsNotNone(match, "Bundler manifest is missing")
        manifest = json.loads(match.group(1))
        entry = manifest["7e586341-2183-4836-8ee2-86afd2791f4c"]
        payload = gzip.decompress(base64.b64decode(entry["data"]))
        self.assertEqual(
            hashlib.sha256(payload).hexdigest(),
            "2623a9e22809915ce789b4461154e277ddce520d5a4320c14d44332a5d0dcea0",
        )

    def test_cashout_reveal_contract_remains_present(self) -> None:
        for marker in (
            "function mountPlasma(d)",
            "var WORD = 'cashio.us'",
            "function bolt(ax, ay, bx, by, col, glow)",
            "var strands = 3 + (Math.random()<.4?1:0)",
            "x.lineWidth = st===0 ? 2.4 : 1.0",
            "var BC = [['255,150,40'",
            "rgba(255,255,255",
        ):
            self.assertIn(marker, self.html)


if __name__ == "__main__":
    unittest.main()
