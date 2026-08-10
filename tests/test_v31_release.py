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
        self.assertIn("      mountPlasma(d);", self.html)
        self.assertNotIn(
            "if (d.fonts && d.fonts.check && d.fonts.check('900 20px Orbitron')) mountPlasma(d);",
            self.html,
            "The Reveal must not disappear when FontFaceSet.check is delayed or unavailable",
        )

    def test_embedded_runtime_obeys_the_live_script_csp(self) -> None:
        """The production policy allows inline scripts, but not blob: or eval."""
        for marker in (
            "function bundlerEval(names, args, body)",
            "Object.defineProperty(window, '__bundlerFunction'",
            "Runtime CSP patch drift",
            "CSP_RUNTIME_UUID",
            "Preload bundled JavaScript dependencies inline",
            "Inline bundled scripts while the parsed document is still detached",
            "for (const pending of Array.from(doc.querySelectorAll('script[src]')))",
            "if (pending.closest('x-dc'))",
            "preload.textContent = pendingSource",
            "pending.remove()",
            "const pendingSource = await pendingBundle.text()",
            "pending.textContent = pendingSource",
            "const bundledScript = scriptSrc ? resourceBlobs[scriptSrc.split('#')[0]] : null",
            "s.textContent = await bundledScript.text()",
        ):
            self.assertIn(marker, self.html)
        self.assertLess(
            self.html.index("for (const pending of Array.from(doc.querySelectorAll('script[src]')))"),
            self.html.index("document.documentElement.replaceWith(doc.documentElement)"),
            "Bundled scripts must be inlined before the runtime can detach them",
        )

    def test_embedded_assets_match_the_live_font_and_image_csp(self) -> None:
        """Production permits same-origin fonts and data images, not blob URLs."""
        manifest_match = re.search(
            r'<script type="__bundler/manifest">\s*(\{.*?\})\s*</script>',
            self.html,
            re.DOTALL,
        )
        self.assertIsNotNone(manifest_match, "Bundler manifest is missing")
        manifest = json.loads(manifest_match.group(1))
        font_paths = {
            "0bacb948-df39-4d94-93c4-93720754a7ce": "orbitron-latin-600-normal.woff2",
            "cfb1bd30-26f7-4fbb-8a2a-ddc61c6bb223": "orbitron-latin-700-normal.woff2",
            "3006d8e6-4e29-46d7-a6d1-fa07eb4d6565": "orbitron-latin-900-normal.woff2",
            "2775d986-6ed9-4326-96e2-272e5fbee9c4": "exo-2-latin-400-normal.woff2",
            "49fd112b-fa1a-4366-bdc8-29a91e900963": "exo-2-latin-500-normal.woff2",
            "8c783f64-123a-4e54-a658-43bdadfd1af8": "exo-2-latin-700-normal.woff2",
            "d58e88ba-4b4d-4810-ae2c-e734f06becc6": "jetbrains-mono-latin-400-normal.woff2",
            "e8e8b7ed-b422-4b92-abb7-33814a4c7126": "jetbrains-mono-latin-600-normal.woff2",
        }
        for uuid, filename in font_paths.items():
            entry = manifest[uuid]
            embedded = base64.b64decode(entry["data"])
            if entry["compressed"]:
                embedded = gzip.decompress(embedded)
            self.assertEqual(embedded, (ROOT / "fonts" / filename).read_bytes(), filename)
            self.assertIn(f'"{uuid}": "/fonts/{filename}"', self.html)
        self.assertIn("location.protocol !== 'file:' && FONT_PATHS[uuid]", self.html)
        self.assertIn("IMAGE_MIME.test(entry.mime)", self.html)


if __name__ == "__main__":
    unittest.main()
