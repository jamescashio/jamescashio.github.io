"""Release contract for v31 "The Grid".

Two builds are covered here:

* ``index.html`` — the production Dyson deck. Framework-free, self-hosted
  dependencies, published figures reconciled against ``status.json``.
* ``grid.html`` — the archived stage-one grid front page. Its contract is
  retained so the archive cannot silently rot or start claiming current health.
"""

from __future__ import annotations

import base64
import contextlib
import gzip
import importlib.util
import io
import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"
GRID = ROOT / "grid.html"


def load_consistency_checker():
    path = ROOT / "scripts" / "check_release_consistency.py"
    spec = importlib.util.spec_from_file_location("release_consistency", path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class V31ReleaseContractTests(unittest.TestCase):
    """The production deck."""

    @classmethod
    def setUpClass(cls) -> None:
        cls.html = INDEX.read_text(encoding="utf-8")
        cls.deck = (ROOT / "assets" / "js" / "deck-v31.js").read_text(encoding="utf-8")
        cls.status = json.loads((ROOT / "status.json").read_text(encoding="utf-8"))

    def test_repository_consistency_checker_passes(self) -> None:
        checker = load_consistency_checker()
        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            result = checker.main()
        self.assertEqual(result, 0, output.getvalue())

    def test_retired_figures_are_absent_from_every_published_surface(self) -> None:
        checker = load_consistency_checker()
        for surface in checker.PUBLISHED_SURFACES:
            text = (ROOT / surface).read_text(encoding="utf-8")
            for token in checker.RETIRED_TOKENS:
                self.assertNotRegex(
                    text,
                    re.compile(re.escape(token), re.IGNORECASE),
                    f"{token!r} must stay withdrawn from {surface}",
                )

    def test_public_lanes_are_never_published_as_the_catalog_count(self) -> None:
        """10 public capability lanes and 36 private catalog entries are different objects."""
        catalog = self.status["private_catalog_entries"]
        for surface in ("index.html", "assets/js/deck-v31.js", "README.md", "llms.txt", "lab.html"):
            text = (ROOT / surface).read_text(encoding="utf-8")
            self.assertIsNone(
                re.search(rf"{catalog}\s+(?:model\s+|public\s+|capability\s+)?lanes", text, re.IGNORECASE),
                f"{surface} merges the catalog count into a lane count",
            )

    def test_every_runtime_dependency_is_self_hosted(self) -> None:
        """connect-src is 'none'; nothing may be fetched from a third-party origin."""
        importmap = re.search(r'<script type="importmap">\s*(\{.*?\})\s*</script>', self.html, re.DOTALL)
        self.assertIsNotNone(importmap, "The three.js import map is missing")
        imports = json.loads(importmap.group(1))["imports"]
        for specifier, path in imports.items():
            self.assertTrue(path.startswith("/assets/"), f"{specifier} resolves off-origin: {path}")
        for src in re.findall(r'<script[^>]+src="([^"]+)"', self.html):
            self.assertFalse(src.startswith("http"), f"Off-origin script: {src}")
        # Only fetched assets matter here; rel=canonical is an absolute URL by design.
        for tag in re.findall(r"<link[^>]+>", self.html):
            rel = re.search(r'rel="([^"]+)"', tag)
            href = re.search(r'href="([^"]+)"', tag)
            if not rel or not href or rel.group(1) == "canonical":
                continue
            self.assertFalse(
                href.group(1).startswith("http"), f"Off-origin {rel.group(1)}: {href.group(1)}"
            )
        self.assertNotIn("cdn.jsdelivr.net", self.html)
        self.assertNotIn("unpkg.com", self.html)

    def test_vendored_three_resolves_every_addon_import(self) -> None:
        vendor = ROOT / "assets" / "js" / "vendor" / "three"
        self.assertTrue((vendor / "three.module.js").is_file())
        for module in vendor.rglob("*.js"):
            source = module.read_text(encoding="utf-8")
            for spec in re.findall(r"from\s+'(\.{1,2}/[^']+)'", source):
                self.assertTrue(
                    (module.parent / spec).resolve().is_file(),
                    f"{module.name} imports {spec}, which was not vendored",
                )
            for spec in re.findall(r"from\s+'(three(?:/addons/[^']+)?)'", source):
                if spec == "three":
                    continue
                addon = vendor / "addons" / spec.split("three/addons/", 1)[1]
                self.assertTrue(addon.is_file(), f"{module.name} imports {spec}, which was not vendored")

    def test_csp_forbids_eval_and_all_network_egress(self) -> None:
        csp = re.search(r'http-equiv="Content-Security-Policy" content="([^"]+)"', self.html)
        self.assertIsNotNone(csp, "The deck must ship a Content Security Policy")
        policy = csp.group(1)
        self.assertIn("connect-src 'none'", policy)
        self.assertIn("object-src 'none'", policy)
        self.assertIn("form-action 'none'", policy)
        self.assertNotIn("unsafe-eval", policy)
        self.assertNotIn("http://", policy)
        self.assertNotIn("https://", policy)

    def test_the_deck_opens_no_sockets(self) -> None:
        for network_api in ("fetch(", "XMLHttpRequest", "WebSocket", "EventSource", "sendBeacon", "window.open"):
            self.assertNotIn(network_api, self.deck, f"The deck must not use {network_api}")
        self.assertNotIn("eval(", self.deck)

    def test_effects_only_audio_has_no_continuous_bed(self) -> None:
        audio = (ROOT / "assets" / "js" / "zasfx.js").read_text(encoding="utf-8")
        self.assertNotIn("startHum", audio)
        self.assertNotIn("bedGain", audio)
        self.assertIsNone(re.search(r"\bdrone\b", audio, re.IGNORECASE))
        self.assertIn("effects only", audio.lower())

    def test_audio_stays_muted_until_the_operator_arms_it(self) -> None:
        audio = (ROOT / "assets" / "js" / "zasfx.js").read_text(encoding="utf-8")
        self.assertIn("if (!on) return;", audio)
        self.assertIn("localStorage.getItem(KEY) === 'on'", audio)
        self.assertIn('data-snd-toggle', self.html)

    def test_bit_is_present_with_its_animation_set(self) -> None:
        self.assertIn('data-bit data-mood="idle"', self.html)
        self.assertIn("Bit, the deck guide", self.html)
        self.assertIn('[data-bit][data-mood="yes"]', self.html)
        self.assertIn('[data-bit][data-mood="no"]', self.html)
        self.assertIn("window.ZABit.mount(cv)", self.deck)
        self.assertIn("window.ZABit.setState", self.deck)
        self.assertIn("window.ZABit.setStill(true)", self.deck)
        self.assertTrue((ROOT / "assets" / "js" / "bit.js").is_file())

    def test_console_is_branded_eve_and_answers_from_the_dated_snapshot(self) -> None:
        self.assertIn("E.V.E. — EVALUATION VERIFICATION ENGINE", self.html)
        self.assertIn("E.V.E. Command Console", self.html)
        self.assertIn("E.V.E. — Evaluation Verification Engine.", self.deck)
        verified = self.status["verified_on"]
        self.assertIn(f"verified {verified}", self.deck)
        for command in (
            "help", "status", "fleet", "services", "routes",
            "catalog", "eve", "lineage", "creed", "whoami", "archive",
        ):
            self.assertIn(f"k === '{command}'", self.deck, f"E.V.E. is missing the {command} command")

    def test_every_console_chip_maps_to_a_real_command(self) -> None:
        chips = re.findall(r'data-hint="([^"]+)"', self.html)
        self.assertTrue(chips, "The console publishes no command chips")
        for chip in chips:
            self.assertIn(f"k === '{chip}'", self.deck, f"Chip {chip!r} has no handler")

    def test_every_deck_anchor_in_the_nav_exists_as_a_section(self) -> None:
        anchors = set(re.findall(r'<a href="#([a-z]+)"', self.html))
        sections = set(re.findall(r'<section id="([a-z]+)"', self.html))
        self.assertTrue(anchors)
        self.assertTrue(anchors <= sections, f"Dangling anchors: {sorted(anchors - sections)}")

    def test_deck_tracking_covers_every_section(self) -> None:
        sections = re.findall(r'<section id="([a-z]+)"', self.html)
        for section in sections:
            self.assertIn(f"['{section}'", self.deck, f"{section} is missing from the deck strip table")

    def test_fleet_ring_geometry_cannot_regress_to_an_ellipse(self) -> None:
        """A square ring box is what keeps rotation from smearing the orbits."""
        self.assertIn(".fleet-ringbox", self.html)
        self.assertIn("aspect-ratio: 1", self.html)
        self.assertIn("var rx = zeus ? 41 : 26, ry = rx;", self.deck)

    def test_counter_rotation_keeps_the_centring_transform(self) -> None:
        """A bare rotate() keyframe replaces translate(-50%,-50%) and every node
        drifts off its anchor and tilts. Both parts must be in both keyframes."""
        block = self.html[self.html.index("@keyframes za-counter") : self.html.index("@keyframes za-ping-node")]
        self.assertIn("from { transform: translate(-50%,-50%) rotate(0deg); }", block)
        self.assertIn("to   { transform: translate(-50%,-50%) rotate(-360deg); }", block)

    def test_ring_holds_still_when_reached_for(self) -> None:
        """A target that drifts under the pointer is a motor-accessibility problem."""
        self.assertIn(".fleetmap:hover .za-orbit", self.html)
        self.assertIn(".za-orbit:focus-within", self.html)
        self.assertIn("animation-play-state: paused", self.html)
        # the animation must live in the stylesheet, or no rule can override it
        self.assertNotIn('class="za-orbit" style="position:absolute;inset:0;animation', self.html)
        self.assertIn(".za-orbit { position: absolute; inset: 0; animation: za-orbit", self.html)

    def test_ring_is_operable_by_keyboard_with_a_roving_tabindex(self) -> None:
        self.assertIn("b.tabIndex = -1;", self.deck)
        self.assertIn("b.tabIndex = on ? 0 : -1;", self.deck)
        for key in ("ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Home", "End"):
            self.assertIn(f"'{key}'", self.deck, f"the ring does not answer {key}")

    def test_host_filter_covers_every_host_and_keeps_a_valid_selection(self) -> None:
        hosts = set(re.findall(r'data-host="([A-Z]+)"', self.html))
        self.assertEqual(hosts, {"ALL", "ZEUS", "APOLLO"})
        self.assertIn("if (vis.indexOf(selNode) < 0) selNode = vis[0];", self.deck)
        for chip in re.findall(r"<button[^>]*data-host[^>]*>", self.html):
            self.assertIn("aria-pressed", chip)

    def test_starmap_motion_is_bounded(self) -> None:
        """One rAF loop, gated on reduced motion and on the deck being visible."""
        self.assertIn("if (!gridOnScreen || reduced || !sctx)", self.deck)
        self.assertIn("gridOnScreen = false;", self.deck)
        self.assertEqual(self.deck.count("requestAnimationFrame(drawStarmap)"), 1)
        # Node positions are derived from one rotation read, not measured per
        # node — nineteen forced layouts a frame is the thing being prevented.
        body = self.deck[self.deck.index("function drawStarmap(ts)"):self.deck.index("var runPulse = drawStarmap;")]
        self.assertNotIn("getBoundingClientRect", body)
        self.assertIn("Math.atan2", self.deck)
        for helper in ("function fitStarmap()", "function measureRing(mapRect)"):
            self.assertIn(helper, self.deck)

    def test_routes_survive_reduced_motion(self) -> None:
        """The canvas never runs under reduced motion, so the link fabric that
        carries the meaning has to be SVG, not something the canvas draws."""
        self.assertIn("linkSvg.appendChild(ln)", self.deck)
        self.assertIn(".fleet-links path", self.html)
        self.assertNotIn("sctx.quadraticCurveTo", self.deck)

    def test_packets_ride_the_curve_the_svg_actually_draws(self) -> None:
        """One lift function feeds both, so canvas and SVG cannot drift apart."""
        self.assertIn("function LIFT(i) { return ((i % 4) - 1.5) * 3.2; }", self.deck)
        self.assertIn("' Q' + ((x + 50) / 2).toFixed(2)", self.deck)
        self.assertEqual(self.deck.count("LIFT(pkt.node) / 100 * ringGeom.s"), 2)
        self.assertIn("LIFT(selNode) / 100 * ringGeom.s", self.deck)

    def test_archived_builds_stay_reachable(self) -> None:
        for archive in ("grid.html", "index-v44.html", "command.html"):
            self.assertTrue((ROOT / archive).is_file(), f"{archive} is missing")
        self.assertIn('href="/grid.html"', self.html)
        self.assertIn('href="/index-v44.html"', self.html)

    def test_reduced_motion_renders_a_complete_still_page(self) -> None:
        self.assertIn("@media (prefers-reduced-motion: reduce)", self.html)
        self.assertIn("prefers-reduced-motion: reduce", self.deck)
        # Reveals, plate racking and the routing trace must all resolve without motion.
        self.assertIn("if (!reduced && 'IntersectionObserver' in window)", self.deck)
        self.assertIn("if (reduced) { plateSeen = 6; paintPlates(); return; }", self.deck)
        self.assertIn("if (reduced) rack();", self.deck)
        stage = (ROOT / "assets" / "js" / "dyson-stage.js").read_text(encoding="utf-8")
        self.assertIn("if (this.reduced) { this.frame(0); return; }", stage)

    def test_accessibility_floor(self) -> None:
        self.assertIn('<a class="skip" href="#conn">Skip to content</a>', self.html)
        self.assertIn('lang="en"', self.html)
        self.assertIn('role="log" aria-live="polite"', self.html)
        self.assertIn('aria-label="Console command input"', self.html)
        self.assertIn('aria-label="Decks"', self.html)
        self.assertIn('aria-label="Toggle deck audio"', self.html)
        # Every interactive control carries an accessible name: either an
        # explicit aria-label, or visible text between the tags.
        for match in re.finditer(r"<button([^>]*)>(.*?)</button>", self.html, re.DOTALL):
            attrs, inner = match.group(1), match.group(2)
            if "aria-label=" in attrs:
                continue
            text = re.sub(r"<[^>]+>", "", inner).strip()
            self.assertTrue(
                text, f"Button with neither aria-label nor visible text: <button{attrs}>"
            )

    def test_no_custom_cursor(self) -> None:
        """The native pointer stays; custom cursors were rejected."""
        self.assertIsNone(re.search(r"cursor\s*:\s*url\(", self.html, re.IGNORECASE))
        self.assertNotIn("cursor: none", self.html)
        self.assertNotIn("custom-cursor", self.html)

    def test_release_identity_is_v31_the_grid_everywhere_visible(self) -> None:
        self.assertIn("V31 // THE GRID", self.html)
        self.assertEqual(self.status["version"], "v31")
        self.assertEqual(self.status["release_name"], "The Grid")
        self.assertNotIn("v44 · AURORA", self.html)


class ArchivedGridStageOneTests(unittest.TestCase):
    """The archived stage-one grid page keeps its own contract."""

    @classmethod
    def setUpClass(cls) -> None:
        cls.html = GRID.read_text(encoding="utf-8")

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
        import hashlib

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
        ):
            self.assertIn(marker, self.html)
        self.assertIn("      mountPlasma(d);", self.html)

    def test_embedded_runtime_obeys_the_live_script_csp(self) -> None:
        """The archived policy allows inline scripts, but not blob: or eval."""
        for marker in (
            "function bundlerEval(names, args, body)",
            "Object.defineProperty(window, '__bundlerFunction'",
            "CSP_RUNTIME_UUID",
            "preload.textContent = pendingSource",
            "pending.remove()",
        ):
            self.assertIn(marker, self.html)
        self.assertLess(
            self.html.index("for (const pending of Array.from(doc.querySelectorAll('script[src]')))"),
            self.html.index("document.documentElement.replaceWith(doc.documentElement)"),
            "Bundled scripts must be inlined before the runtime can detach them",
        )

    def test_embedded_fonts_match_the_repository_copies(self) -> None:
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


if __name__ == "__main__":
    unittest.main()
