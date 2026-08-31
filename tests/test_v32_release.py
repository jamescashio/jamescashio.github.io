from __future__ import annotations

import json
import importlib.util
import math
import re
import struct
import tempfile
import unittest
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"

_guard_spec = importlib.util.spec_from_file_location("release_consistency", ROOT / "scripts" / "check_release_consistency.py")
assert _guard_spec and _guard_spec.loader
release_consistency = importlib.util.module_from_spec(_guard_spec)
_guard_spec.loader.exec_module(release_consistency)


def read_stage() -> str:
    """Read every typed viewscreen stage module as one body of source."""
    parts = sorted((ROOT / "src/lib/stage").glob("*.ts"))
    return "\n".join(path.read_text(encoding="utf-8") for path in parts)


def read(relative: str) -> str:
    return (ROOT / relative).read_text(encoding="utf-8")


class V34ReleaseContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.status = json.loads(read("public/status.json"))
        cls.store = read("src/lib/store.ts")
        cls.content = read("src/lib/content.ts")
        cls.deck = read("src/components/command-deck.tsx")
        cls.chrome = read("src/components/command-chrome.tsx")
        cls.decks = read("src/components/decks.tsx")
        cls.primitives = read("src/components/deck-primitives.tsx")
        cls.envelope = read("src/components/build-envelope.tsx")
        cls.eve = read("src/components/eve-console.tsx")
        cls.stage = read_stage()
        cls.stage_flat = re.sub(r"\s+", "", cls.stage)
        cls.sound = read("src/lib/sound.ts")
        cls.css = read("src/styles.css")
        cls.index = read("index.html")
        cls.live = "\n".join(
            path.read_text(encoding="utf-8")
            for path in sorted(DIST.rglob("*"))
            if path.is_file() and path.suffix.lower() in {".html", ".js", ".css", ".json", ".txt", ".xml", ".svg"}
        )

    def test_locked_snapshot_is_exact(self) -> None:
        self.assertEqual(self.status["release"], "V35 ALL TENS")
        self.assertEqual(self.status["revised"], "2026-08-28")
        self.assertEqual(self.status["verifiedLong"], "28 August 2026")
        self.assertEqual(self.status["expires"], "2026-09-27")
        self.assertEqual(self.status["proxmox"], {"version": "9.2.11", "hostsOnline": 2, "quorate": True})
        self.assertEqual(
            self.status["containers"],
            {"running": 18, "documented": 19, "stopped": 1, "zeus": 12, "apollo": 6},
        )
        self.assertEqual(self.status["lanes"], {"public": 10, "privateCatalog": 36})
        self.assertNotIn("deepseek", self.status)
        self.assertNotIn("atlas", self.status)
        self.assertEqual(read("status.json"), read("public/status.json"))

    def test_public_surface_guard_requires_separate_routing_provenance(self) -> None:
        valid = (
            "28 August 2026 · 18/19 AT 28 AUG PROBE · DATED EXPORT · "
            "ROUTING INVENTORY 21 AUGUST 2026 · 10 PUBLIC LANES · 36 PRIVATE CATALOG"
        )
        fixtures = {
            "valid": (valid, True),
            "false date": (valid.replace("21 AUGUST 2026", "28 AUGUST 2026"), False),
            "undated": (valid.replace("21 AUGUST 2026 · ", ""), False),
            "mixed valid and undated": (
                valid + " · 10 PUBLIC LANES · 36 PRIVATE CATALOG",
                False,
            ),
            "mixed valid and false date": (
                valid + " · ROUTING INVENTORY 28 AUGUST 2026 · 10 PUBLIC LANES · 36 PRIVATE CATALOG",
                False,
            ),
        }
        for label, (text, expected_valid) in fixtures.items():
            failures: list[str] = []
            release_consistency.check_v34_public_surface("index.html", text, failures, "test")
            with self.subTest(label=label):
                if expected_valid:
                    self.assertEqual(failures, [])
                else:
                    self.assertTrue(
                        any("must date routing count occurrence" in failure for failure in failures),
                        failures,
                    )

    def test_public_surface_guard_accepts_dated_eve_availability_and_receipt_provenance(self) -> None:
        text = (
            "28 August 2026 · 18/19 AT 28 AUG PROBE · DATED EXPORT · "
            "ROUTING INVENTORY 21 AUGUST 2026 · 10 PUBLIC LANES · 36 PRIVATE CATALOG · "
            "E.V.E. ONLINE · READ-ONLY · DATED EXPORT · "
            "08-21-2026 · 10 PUBLIC LANES · 36 PRIVATE CATALOG · "
            "E.V.E. EVALUATION VERIFICATION ENGINE · ONLINE. "
            "2 HOSTS ONLINE · QUORATE · 2 PROXMOX HOSTS ONLINE · CLUSTER QUORATE · "
            "Two Proxmox hosts were online and quorate. SYSTEMS ONLINE · HUMAN COMMAND RETAINED. "
            "Try sitrep, current, or help."
        )
        failures: list[str] = []
        release_consistency.check_v34_public_surface("index.html", text, failures, "test")
        self.assertEqual(failures, [])

    def test_public_surface_guard_rejects_stale_or_current_claim_variants(self) -> None:
        dated_surface = (
            "28 August 2026 · 18/19 AT 28 AUG PROBE · DATED EXPORT · "
            "ROUTING INVENTORY 21 AUGUST 2026 · 10 PUBLIC LANES · 36 PRIVATE CATALOG"
        )
        fixtures = {
            "atlas availability": "ATLAS ONLINE",
            "systems availability": "SYSTEMS ONLINE",
            "current routing": "CURRENT ROUTING STATUS",
            "host availability": "HOSTS: ONLINE",
            "fleet availability": "FLEET STATUS · ONLINE",
            "reversed host availability": "ONLINE — HOSTS",
            "lowercase EVE bypass": "e.v.e. online · read-only · dated export",
        }
        for label, claim in fixtures.items():
            failures: list[str] = []
            release_consistency.check_v34_public_surface("index.html", f"{dated_surface} · {claim}", failures, "test")
            with self.subTest(label=label):
                self.assertTrue(any("stale/current public claim" in failure for failure in failures), failures)

    def test_public_surface_guard_ignores_only_the_exact_technical_status_class(self) -> None:
        text = (
            '28 August 2026 · 18/19 AT 28 AUG PROBE · DATED EXPORT · '
            'ROUTING INVENTORY 21 AUGUST 2026 · 10 PUBLIC LANES · 36 PRIVATE CATALOG · '
            '<div class="za-systems-online is-online" role="status"></div>'
            '<button data-cmd="current">CURRENT</button><button data-cmd="fleet">FLEET</button>'
        )
        failures: list[str] = []
        release_consistency.check_v34_public_surface("index.html", text, failures, "test")
        self.assertEqual(failures, [])

    def test_public_surface_guard_rejects_approved_phrase_and_structural_bypasses(self) -> None:
        dated_surface = (
            "28 August 2026 · 18/19 AT 28 AUG PROBE · DATED EXPORT · "
            "ROUTING INVENTORY 21 AUGUST 2026 · 10 PUBLIC LANES · 36 PRIVATE CATALOG"
        )
        approved = "E.V.E. ONLINE · READ-ONLY · DATED EXPORT"
        repeated = " ".join([approved] * 6)
        fixtures = {
            "approved phrase before claim": f"{approved} HOSTS ONLINE",
            "approved phrase after subject": f"HOSTS {approved} ONLINE",
            "visible technical class wording": "<p>HOSTS is-online</p>",
            "allowed current command dangerous attribute": '<button data-cmd="current" title="SYSTEMS ONLINE">CURRENT</button>',
            "newlines": "<p>HOSTS\nONLINE</p>",
            "long HTML tag": '<p>HOSTS <span data-filler="' + "x" * 600 + '">ONLINE</span></p>',
            "repeated approved phrases": f"HOSTS {repeated} ONLINE",
            "hyphenated EVE": "E-V-E ONLINE",
            "mixed punctuation EVE": "e_v.e ONLINE",
            "allowed class dangerous attribute": '<div class="za-systems-online is-online" title="SYSTEMS ONLINE"></div>',
            "allowed command adjacent visible claim": '<button data-cmd="current">CURRENT <span>HOSTS ONLINE</span></button>',
        }
        for label, bypass in fixtures.items():
            failures: list[str] = []
            release_consistency.check_v34_public_surface("index.html", f"{dated_surface} · {bypass}", failures, "test")
            with self.subTest(label=label):
                self.assertTrue(any("stale/current public claim" in failure for failure in failures), failures)

    def test_public_surface_guard_rejects_fragment_unicode_and_script_bypasses(self) -> None:
        dated_surface = (
            "28 August 2026 · 18/19 AT 28 AUG PROBE · DATED EXPORT · "
            "ROUTING INVENTORY 21 AUGUST 2026 · 10 PUBLIC LANES · 36 PRIVATE CATALOG"
        )
        fixtures = {
            "remaining class unit": '<div class="za-systems-online hosts online"></div>',
            "nested current control": '<div>HOSTS <button data-cmd="current">CURRENT</button> ONLINE</div>',
            "siblings": '<span>HOSTS</span><span>ONLINE</span>',
            "malformed": 'HOSTS</div>ONLINE',
            "fragment": '<>HOSTS <span>ONLINE</span></>',
            "fullwidth fleet": '１９／１９',
            "zero width online": 'HOSTS ONL\u200bINE',
            "combining online": 'HOSTS ONLI\u0307NE',
            "script entity": '<script>document.write("HOSTS ONL&#73;NE")</script>',
        }
        for label, bypass in fixtures.items():
            failures: list[str] = []
            release_consistency.check_v34_public_surface("index.html", f"{dated_surface} · {bypass}", failures, "test")
            with self.subTest(label=label):
                self.assertTrue(any("stale/current public claim" in failure for failure in failures), failures)

    def test_public_surface_guard_keeps_sentence_boundaries(self) -> None:
        text = (
            "28 August 2026 · 18/19 AT 28 AUG PROBE · DATED EXPORT · "
            "ROUTING INVENTORY 21 AUGUST 2026 · 10 PUBLIC LANES · 36 PRIVATE CATALOG · "
            "Host a party. Later, go online with friends."
        )
        failures: list[str] = []
        release_consistency.check_v34_public_surface("index.html", text, failures, "test")
        self.assertEqual(failures, [])

    def test_public_surface_guard_rejects_shipped_source_and_bundle_literals(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source = root / "claim.tsx"
            bundle = root / "assets" / "claim.js"
            bundle.parent.mkdir()
            source.write_text('export const claim = "HOSTS ONLINE";\n', encoding="utf-8")
            bundle.write_text('const claim = "SYSTEMS ONLINE";\n', encoding="utf-8")
            literals = release_consistency.collect_public_code_literals([source, bundle])
        self.assertTrue(release_consistency.has_stale_current_code_literal(literals[0]), literals)
        self.assertTrue(release_consistency.has_stale_current_code_literal(literals[1]), literals)

    def test_public_surface_guard_collects_static_template_claims(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source = root / "claim.tsx"
            bundle = root / "assets" / "claim.js"
            bundle.parent.mkdir()
            source.write_text(
                'const a = `HOSTS ${"ONLINE"}`;\n'
                'const b = `HOSTS ${`ON${"LINE"}`}`;\n'
                'const c = "HOSTS " + `ON${"LINE"}`;\n'
                'const d = true ? `HOSTS ${"ONLINE"}` : "safe";\n'
                'export const view = <p>{`HOSTS ${"ONLINE"}`}</p>;\n',
                encoding="utf-8",
            )
            bundle.write_text('const claim = `HOSTS ${"ONLINE"}`;\n', encoding="utf-8")
            literals = release_consistency.collect_public_code_literals([source, bundle])
        values = [literal["value"] for literal in literals]
        self.assertGreaterEqual(values.count("HOSTS ONLINE"), 5, values)
        self.assertTrue(all(release_consistency.has_stale_current_code_literal(literal) for literal in literals if literal["value"] == "HOSTS ONLINE"))

    def test_public_surface_guard_rejects_any_residual_online_and_nested_current_context(self) -> None:
        dated_surface = (
            "28 August 2026 · 18/19 AT 28 AUG PROBE · DATED EXPORT · "
            "ROUTING INVENTORY 21 AUGUST 2026 · 10 PUBLIC LANES · 36 PRIVATE CATALOG"
        )
        fixtures = {
            "nested current status": 'HOSTS <button data-cmd="current"><span>CURRENT</span></button> STATUS',
            "cluster attr": '<div title="CLUSTER ONLINE"></div>',
            "node attr": '<div aria-label="NODE ONLINE"></div>',
            "pool": "POOL ONLINE",
            "control plane": "CONTROL PLANE ONLINE",
            "gateway": "GATEWAY ONLINE",
            "lower cluster": "cluster online",
            "lower node": "node online",
            "lower pool": "pool online",
            "lower control plane": "control plane online",
            "lower gateway": "gateway online",
            "mixed cluster": "CLUSTER online",
            "lower attribute": '<div title="cluster online"></div>',
        }
        for label, bypass in fixtures.items():
            failures: list[str] = []
            release_consistency.check_v34_public_surface("index.html", f"{dated_surface} · {bypass}", failures, "test")
            with self.subTest(label=label):
                self.assertTrue(any("stale/current public claim" in failure for failure in failures), failures)

    def test_public_surface_guard_balances_self_closing_current_controls(self) -> None:
        dated_surface = (
            "28 August 2026 · 18/19 AT 28 AUG PROBE · DATED EXPORT · "
            "ROUTING INVENTORY 21 AUGUST 2026 · 10 PUBLIC LANES · 36 PRIVATE CATALOG"
        )
        fixtures = {
            "self closing then status": "<button data-cmd='current'/>CURRENT <span>HOSTS</span> STATUS",
            "nested self closing": "<button data-cmd='current'><span/></button>HOSTS STATUS",
        }
        for label, markup in fixtures.items():
            failures: list[str] = []
            release_consistency.check_v34_public_surface("index.html", f"{dated_surface} · {markup}", failures, "test")
            with self.subTest(label=label):
                self.assertTrue(any("stale/current public claim" in failure for failure in failures), failures)

    def test_public_surface_guard_rejects_non_button_current_contexts(self) -> None:
        dated_surface = (
            "28 August 2026 · 18/19 AT 28 AUG PROBE · DATED EXPORT · "
            "ROUTING INVENTORY 21 AUGUST 2026 · 10 PUBLIC LANES · 36 PRIVATE CATALOG"
        )
        fixtures = {
            "input self closing": "HOSTS <input data-cmd='current'/> STATUS",
            "div paired": "HOSTS <div data-cmd='current'>CURRENT</div> STATUS",
            "span nested": "HOSTS <span data-cmd='current'><i>CURRENT</i></span> STATUS",
            "custom self closing": "HOSTS <current-control data-cmd='current'/> STATUS",
            "div standalone": "<div data-cmd='current'></div>",
        }
        for label, markup in fixtures.items():
            failures: list[str] = []
            release_consistency.check_v34_public_surface("index.html", f"{dated_surface} · {markup}", failures, "test")
            with self.subTest(label=label):
                self.assertTrue(any("stale/current public claim" in failure for failure in failures), failures)

    def test_public_surface_guard_keeps_direct_button_current_in_context(self) -> None:
        dated_surface = (
            "28 August 2026 · 18/19 AT 28 AUG PROBE · DATED EXPORT · "
            "ROUTING INVENTORY 21 AUGUST 2026 · 10 PUBLIC LANES · 36 PRIVATE CATALOG"
        )
        fixtures = {
            "direct": 'HOSTS <button data-cmd="current">CURRENT</button> STATUS',
            "nested": 'HOSTS <button data-cmd="current"><span>CURRENT</span></button> STATUS',
            "self closing": "HOSTS <button data-cmd='current'/> STATUS",
        }
        for label, markup in fixtures.items():
            failures: list[str] = []
            release_consistency.check_v34_public_surface("index.html", f"{dated_surface} · {markup}", failures, "test")
            with self.subTest(label=label):
                self.assertTrue(any("stale/current public claim" in failure for failure in failures), failures)

    def test_public_surface_guard_resolves_scoped_const_template_claims(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source = root / "claim.tsx"
            bundle = root / "assets" / "claim.js"
            bundle.parent.mkdir()
            source.write_text(
                'const middle = "ST"; const outer = "HO" + middle;\n'
                'export const view = <p>{`${outer}S CURRENT STATUS`}</p>;\n'
                'function shadow() { const middle = "XX"; return `HO${middle}S`; }\n',
                encoding="utf-8",
            )
            bundle.write_text('const middle="ST";const claim=`HO${middle}S CURRENT STATUS`;\n', encoding="utf-8")
            literals = release_consistency.collect_public_code_literals([source, bundle])
        claims = [literal for literal in literals if literal["value"] == "HOSTS CURRENT STATUS"]
        self.assertGreaterEqual(len(claims), 2, literals)
        self.assertTrue(all(release_consistency.has_stale_current_code_literal(literal) for literal in claims))

    def test_public_surface_guard_rejects_current_fleet_topology_and_raw_route_identifiers(self) -> None:
        base = (
            "28 August 2026 · 18/19 AT 28 AUG PROBE · DATED EXPORT · "
            "ROUTING INVENTORY 21 AUGUST 2026 · 10 PUBLIC LANES · 36 PRIVATE CATALOG"
        )
        fixtures = {
            "unprobed gateway": base + " · ATLAS · GATEWAY · LOCAL INFERENCE",
            "unprobed quorum support": base + " · ATHENA · QUORUM SUPPORT",
            "unprobed recovery": base + " · GENESIS · PRIVATE STORAGE · RECOVERY",
            "raw route id": base + " · deepseek-v4-flash",
            "role host mapping": base + ' · hub:"zeus"',
            "data attribute mapping": base + ' · data-hub="apollo"',
        }
        for label, text in fixtures.items():
            failures: list[str] = []
            release_consistency.check_v34_public_surface("index.html", text, failures, "test")
            with self.subTest(label=label):
                self.assertTrue(any("private current-fleet detail" in failure for failure in failures), failures)

    def test_release_identity_is_canonical_v35(self) -> None:
        package = json.loads(read("package.json"))
        self.assertEqual(package["version"], "35.0.0")
        self.assertIn('V35 "ALL TENS"', self.content)
        retired_candidate = "V" + "47"
        for relative in (
            "README.md",
            "RELEASE_BODY.md",
            "CHANGELOG.md",
            ".github/workflows/public-safety.yml",
            "scripts/check_release_consistency.py",
        ):
            with self.subTest(relative=relative):
                self.assertNotIn(retired_candidate, read(relative).upper())

    def test_opens_on_snapshot_without_an_engage_gate_and_audio_is_opt_in(self) -> None:
        for marker in ("gate: false", "deck: 0", 'mode: "technical"', "audio: DEFAULT_AUDIO_ENABLED"):
            self.assertIn(marker, self.store)
        self.assertIn("DEFAULT_AUDIO_ENABLED", self.store)
        self.assertNotIn("REQUEST A REVIEW", self.live.upper())
        self.assertNotIn(">ENGAGE<", self.live.upper())
        self.assertIn("AUDIO OFF", self.live)
        self.assertIn("ARM AUDIO", self.live)
        self.assertIn("DESCEND THE DECKS", self.live)

    def test_owner_confirmed_model_lane_labels_are_current(self) -> None:
        self.assertIn('model: "Gemini 3.7 Flash"', self.content)
        self.assertIn('model: "Grok 4.6"', self.content)
        self.assertIn("Gemini 3.7 Flash", self.live)
        self.assertIn("Grok 4.6", self.live)
        self.assertIn("Sonar Pro", self.live)

    def assertInStage(self, marker: str) -> None:
        """Assert a stage contract marker is present, tolerating formatter reflow.

        The stage is Prettier formatted, so a marker written on one line in the
        source may be wrapped across several. Compare with whitespace removed.
        """
        if marker in self.stage:
            return
        self.assertIn(re.sub(r"\s+", "", marker), self.stage_flat)

    def test_every_airframe_change_kicks_the_bounded_v34_warp_fov_and_bloom(self) -> None:
        self.assertInStage('motionDurationMs("stage-warp")')
        self.assertInStage('dt * (1000 / motionDurationMs("stage-warp"))')
        self.assertNotIn("dt * 1.05", self.stage)
        # The arrival widens the lens on the way in, and the restage raised the
        # bloom ceiling. Both hold: the typed modules keep the reflow tolerant
        # assertion, the constants come from the restage.
        self.assertInStage("this.camera.fov += (55 + warp * 34 + (1 - arrive) * 26 - this.camera.fov)")
        self.assertInStage("this.bloom.strength = Math.min(2.25")
        craft_change = self.stage[self.stage.index("setCraft(i: number)") : self.stage.index("setClearX(f: number)")]
        self.assertIn("if (next !== this.craftTarget)", craft_change)
        self.assertIn("this.warpT = 1", craft_change)
        self.assertIn("st?.warp?.()", self.deck)

    def test_motion_guard_rejects_a_dead_v33_warp_marker(self) -> None:
        """The stage now spans several typed modules, so the guard reads them as one."""
        original_read_stage = release_consistency.read_stage

        def stale_read_stage() -> str:
            return original_read_stage().replace(
                'dt * (1000 / motionDurationMs("stage-warp"))',
                "dt * 1.05",
            )

        release_consistency.read_stage = stale_read_stage
        try:
            failures: list[str] = []
            release_consistency.check_v34_motion_contract(failures)
        finally:
            release_consistency.read_stage = original_read_stage
        self.assertTrue(any("obsolete V33 marker" in failure for failure in failures), failures)

    def test_scan_band_rise_and_route_shimmer_contract(self) -> None:
        self.assertIn('<span className="za-plate-scan" aria-hidden />', self.primitives)
        scan = self.css[self.css.index(".za-plate-scan") : self.css.index(".za-plate-fade")]
        self.assertIn(".za-plate-scan::after", scan)
        self.assertIn("animation: za-hail-scan 3.6s linear infinite", scan)
        rise = self.css[self.css.index("@keyframes za-rise") : self.css.index("@keyframes za-packet")]
        self.assertIn("translateY(28px)", rise)
        self.assertIn("blur(12px)", rise)
        self.assertIn("animation: za-rise var(--za-deck-copy-duration)", self.css)
        self.assertIn("animation: za-article-acquire var(--za-article-acquisition-duration)", self.css)
        self.assertIn("animation: za-warpflash var(--za-stage-warp-duration)", self.css)
        self.assertNotIn("V33 baseline retained", self.css)
        self.assertNotIn("animation: za-rise 900ms", self.css)
        self.assertIn('section:not([data-deck="0"]) *::after', self.css)
        self.assertIn("animation: za-shimmer 3.2s linear infinite", self.css)

    def test_audio_is_quiet_deliberate_provenanced_and_bounded(self) -> None:
        self.assertIn("Quiet by default", self.sound)
        self.assertIn("this.master.gain.setTargetAtTime(0.42", self.sound)
        self.assertIn('AIRFRAME_SAMPLE_NAMES', self.sound)
        self.assertNotIn("startBed", self.sound)
        self.assertNotIn("bedGain", self.sound)
        self.assertNotIn('sfx("craft"', self.deck)
        self.assertNotIn("const armAudio", self.deck)
        self.assertIn('craft(i: number, trigger: AirframeAudioTrigger)', self.sound)
        self.assertIn('getSound().craft(PILOT_CRAFT[i], "lineage")', self.decks)
        self.assertIn('getSound().craft(index, "pip")', self.deck)

        provenance = json.loads(read("public/sfx/provenance.json"))
        self.assertEqual(provenance["version"], 1)
        self.assertEqual(provenance["policy"]["default"], "off")
        self.assertEqual(provenance["policy"]["trigger"], "explicit-selection-only")
        assets = provenance["assets"]
        self.assertEqual(set(assets), {"x1", "sr71", "proteus", "starship", "epstein", "warp", "fold", "p51"})
        self.assertEqual(assets["proteus"]["kind"], "silent")
        for name in ("x1", "sr71", "proteus", "starship", "p51"):
            self.assertIn(assets[name]["kind"], {"official-recording", "silent"})
            self.assertTrue(assets[name]["sourceUrl"].startswith("https://"))
        for name in ("epstein", "warp", "fold"):
            self.assertEqual(assets[name]["kind"], "original")

        for name in ("x1", "sr71", "proteus", "starship", "epstein", "warp", "fold", "p51"):
            path = ROOT / "public" / "sfx" / f"{name}.wav"
            with self.subTest(name=name), wave.open(str(path), "rb") as audio:
                self.assertEqual(audio.getnchannels(), 1)
                self.assertEqual(audio.getsampwidth(), 2)
                self.assertGreaterEqual(audio.getframerate(), 44100)
                self.assertGreater(audio.getnframes(), 0)
                self.assertLessEqual(audio.getnframes() / audio.getframerate(), 1.2)
                frames = audio.readframes(audio.getnframes())
                samples = struct.unpack(f"<{len(frames) // 2}h", frames)
                peak = max(abs(sample) for sample in samples)
                peak_dbfs = -math.inf if peak == 0 else 20 * math.log10(peak / 32767)
                self.assertLessEqual(peak_dbfs, -3.0)
                if assets[name]["kind"] != "silent":
                    rms = math.sqrt(sum(sample * sample for sample in samples) / len(samples))
                    rms_dbfs = 20 * math.log10(rms / 32767)
                    self.assertLessEqual(rms_dbfs, -12.0)
                    self.assertGreater(rms_dbfs, -32.0)

    def test_eve_is_local_read_only_and_has_every_required_command(self) -> None:
        self.assertIn("LOCAL · READ ONLY · NO NETWORK CALLS", self.decks)
        self.assertIn("NO EGRESS", self.eve)
        for command in ("help", "status", "sitrep", "current", "fleet", "lanes", "whoami", "talk", "photo"):
            self.assertIn(f'command === "{command}"', self.eve)
        whoami = self.eve[self.eve.index('if (command === "whoami")') : self.eve.index('if (command === "talk"')]
        self.assertIn("OWNER · OPERATOR · HUMAN ACCOUNTABLE", whoami)
        self.assertNotIn("go:", whoami)
        self.assertNotIn("dangerouslySetInnerHTML", self.eve)
        fetches = re.findall(r"fetch\(\s*([\x60'\"])(.+?)\1", self.eve)
        self.assertEqual(fetches, [])

    def test_pages_workflow_and_root_base_are_locked(self) -> None:
        workflow = read(".github/workflows/pages.yml")
        for marker in ("npm ci", "npm run build", "path: dist", "actions/deploy-pages@v4"):
            self.assertIn(marker, workflow)
        vite = read("vite.config.ts")
        match = re.search(r"\bbase\s*:\s*([^,\n]+)", vite)
        if match:
            self.assertEqual(match.group(1).strip().strip("\"'"), "/")
        built = read("dist/index.html")
        self.assertIn('src="/assets/', built)
        self.assertIn('href="/assets/', built)
        self.assertIsNone(re.search(r"/v\d+/", built, flags=re.IGNORECASE))

    def test_built_root_is_the_single_prerendered_react_command_deck(self) -> None:
        built = read("dist/index.html")
        roots = re.findall(r'<div\b[^>]*\bid="root"[^>]*>', built)
        self.assertEqual(len(roots), 1)
        self.assertIn('data-prerendered="v35"', roots[0])
        self.assertIn("OWN THE IRON", built)
        self.assertEqual(len(re.findall(r'data-deck="\d"', built)), 9)
        self.assertIn('aria-label="CONTACT deck"', built)
        self.assertEqual(len(re.findall(r'<script\b[^>]*\bsrc="/assets/index-[\w-]+\.js"', built)), 1)
        self.assertEqual(
            len(re.findall(r'<link\b[^>]*\bhref="/assets/index-[\w-]+\.css"', built)),
            1,
        )

    def test_seven_articles_runs_a_motion_safe_proof_flight(self) -> None:
        for marker in ("TEST_ROUTE", "drawPatrol", "drawTargetVector", "RANGE SWEEP", "PROOF FLIGHT"):
            self.assertIn(marker, self.envelope)
        self.assertIn("za-article-card", self.decks)
        self.assertIn("aria-pressed={i === sel}", self.decks)
        self.assertIn("@keyframes za-article-acquire", self.css)
        self.assertIn(".za-article-card::after", self.css)
        reduced = self.css[self.css.rindex("@media (prefers-reduced-motion: reduce)") :]
        self.assertIn(".za-article-card::after", reduced)
        self.assertIn("animation: none !important", reduced)

    def test_proteus_has_credited_evidence_and_a_recognition_pass(self) -> None:
        image = ROOT / "public" / "plates" / "proteus-nasa.webp"
        self.assertTrue(image.is_file())
        self.assertGreater(image.stat().st_size, 50_000)
        provenance = json.loads(read("public/plates/provenance.json"))
        self.assertEqual(provenance["assets"]["proteus-nasa"]["credit"], "NASA / ESPO")
        self.assertIn("https://espo.nasa.gov/", provenance["assets"]["proteus-nasa"]["sourcePage"])
        for marker in (
            "FOUR FLIGHT-TEST MINDS. FOUR RULES.",
            "FLIGHT-TEST EVIDENCE · MODEL 281",
            "77.6 FT",
            "2 × FJ44-2E",
            "NASA / ESPO",
        ):
            self.assertIn(marker, self.live)
        self.assertInStage("pose: { yaw: -0.62, pitch: 0.42")
        self.assertIn("aria-pressed={pick === i}", self.decks)
        reduced = self.css[self.css.rindex("@media (prefers-reduced-motion: reduce)") :]
        self.assertIn(".za-airframe-acquire", reduced)

    def test_archive_and_lab_routes_are_exact(self) -> None:
        command = read("dist/command.html")
        for marker in ("Historical archive only", "May 2026", "This page does not describe the current fleet."):
            self.assertIn(marker, command)
        self.assertIn('<meta name="robots" content="noindex" />', command)
        self.assertIn('<meta http-equiv="refresh" content="0; url=/" />', read("dist/lab.html"))

    def test_stale_and_private_tokens_are_absent_from_the_live_artifact(self) -> None:
        for marker in (
            "10 August 2026",
            "08-10-2026",
            "deepseek-chat",
            "Gemini 3.6 Flash",
            "Grok 4.5",
            "Creative AI Technologist",
            "REQUEST A REVIEW",
        ):
            self.assertNotIn(marker.lower(), self.live.lower())
        private = re.compile(
            r"\b(?:10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|"
            r"172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})\b"
        )
        self.assertIsNone(private.search(self.live))

    def test_csp_and_source_keep_network_egress_same_origin(self) -> None:
        for marker in (
            "default-src 'self'",
            "script-src 'self'",
            "connect-src 'self'",
            "object-src 'none'",
            "base-uri 'none'",
            "form-action 'none'",
        ):
            self.assertIn(marker, self.index)
        source = "\n".join(
            (self.deck, self.chrome, self.decks, self.primitives, self.eve, self.sound, self.stage)
        )
        fetches = [target for _, target in re.findall(r"fetch\(\s*([\x60'\"])(.+?)\1", source)]
        # Opus first, PCM as the fallback. Both stay same origin under /sfx/.
        self.assertEqual(fetches, ["/sfx/$" + "{name}.webm?v=52", "/sfx/$" + "{name}.wav?v=52"])
        for tracker in ("google-analytics", "googletagmanager", "plausible.io", "segment.io", "mixpanel"):
            self.assertNotIn(tracker, source.lower())

    def test_reduced_motion_and_accessibility_floor(self) -> None:
        self.assertIn("@media (prefers-reduced-motion: reduce)", self.css)
        self.assertIn("animation: none !important", self.css)
        self.assertIn('href="#main-content"', self.deck)
        self.assertIn('id="main-content"', self.deck)
        self.assertIn('aria-label="Command decks"', self.chrome)
        self.assertIn('aria-label="Mobile command decks"', self.chrome)
        self.assertIn('role="log"', self.eve)
        self.assertIn('aria-live="polite"', self.eve)
        self.assertIn('aria-label="E.V.E. command output, scrollable"', self.eve)

    def test_release_preserves_security_discovery_and_crawler_files(self) -> None:
        for relative in (".well-known/security.txt", "robots.txt", "sitemap.xml"):
            self.assertTrue((DIST / relative).is_file(), relative)
        security = read("dist/.well-known/security.txt")
        self.assertIn("mailto:admin@cashio.us", security)
        self.assertIn("https://cashio.us/.well-known/security.txt", security)


if __name__ == "__main__":
    unittest.main()
