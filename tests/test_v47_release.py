from __future__ import annotations

import json
import math
import re
import struct
import unittest
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"


def read(relative: str) -> str:
    return (ROOT / relative).read_text(encoding="utf-8")


class V47ReleaseContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.status = json.loads(read("public/status.json"))
        cls.store = read("src/lib/store.ts")
        cls.content = read("src/lib/content.ts")
        cls.deck = read("src/components/command-deck.tsx")
        cls.decks = read("src/components/decks.tsx")
        cls.eve = read("src/components/eve-console.tsx")
        cls.stage = read("src/lib/viewscreen-stage.js")
        cls.sound = read("src/lib/sound.ts")
        cls.css = read("src/styles.css")
        cls.index = read("index.html")
        cls.live = "\n".join(
            path.read_text(encoding="utf-8")
            for path in sorted(DIST.rglob("*"))
            if path.is_file() and path.suffix.lower() in {".html", ".js", ".css", ".json", ".txt", ".xml", ".svg"}
        )

    def test_locked_snapshot_is_exact(self) -> None:
        self.assertEqual(self.status["release"], "V47 AWE")
        self.assertEqual(self.status["verifiedLong"], "21 August 2026")
        self.assertEqual(self.status["expires"], "2026-09-20")
        self.assertEqual(self.status["proxmox"], {"version": "9.2.11", "hostsOnline": 2, "quorate": True})
        self.assertEqual(
            self.status["containers"],
            {"running": 19, "documented": 19, "stopped": 0, "zeus": 13, "apollo": 6},
        )
        self.assertEqual(self.status["lanes"], {"public": 10, "privateCatalog": 36})
        self.assertEqual(set(self.status["deepseek"]), {"deepseek-v4-flash", "deepseek-v4-pro"})
        self.assertIn("not a Proxmox host", self.status["atlas"])
        self.assertEqual(read("status.json"), read("public/status.json"))

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

    def test_every_airframe_change_kicks_the_longer_warp_fov_and_bloom(self) -> None:
        self.assertIn("this.warpT = Math.max(0, this.warpT - dt * 1.05)", self.stage)
        self.assertIn("this.camera.fov += ((55 + warp * 34)", self.stage)
        self.assertIn("this.bloom.strength = Math.min(2.05", self.stage)
        craft_change = self.stage[self.stage.index("setCraft(i)") : self.stage.index("setClearX(f)")]
        self.assertIn("if (next !== this.craftTarget)", craft_change)
        self.assertIn("this.warpT = 1", craft_change)
        self.assertIn("st?.warp?.()", self.deck)

    def test_scan_band_rise_and_route_shimmer_contract(self) -> None:
        self.assertIn('<span className="za-plate-scan" aria-hidden />', self.decks)
        scan = self.css[self.css.index(".za-plate-scan") : self.css.index(".za-plate-fade")]
        self.assertIn(".za-plate-scan::after", scan)
        self.assertIn("animation: za-hail-scan 3.6s linear infinite", scan)
        rise = self.css[self.css.index("@keyframes za-rise") : self.css.index("@keyframes za-packet")]
        self.assertIn("translateY(28px)", rise)
        self.assertIn("blur(12px)", rise)
        self.assertIn("animation: za-rise 900ms", self.css)
        self.assertIn("animation: za-shimmer 3.2s linear infinite", self.css)

    def test_audio_is_quiet_deliberate_provenanced_and_bounded(self) -> None:
        self.assertIn("Quiet by default", self.sound)
        self.assertIn("this.master.gain.setTargetAtTime(0.42", self.sound)
        self.assertIn('const names = ["x1", "sr71", "falcon", "starship", "epstein", "warp", "fold"]', self.sound)
        self.assertNotIn("startBed", self.sound)
        self.assertNotIn("bedGain", self.sound)
        self.assertNotIn('sfx("craft"', self.deck)
        self.assertNotIn("const armAudio", self.deck)
        self.assertIn('craft(i: number, trigger: AirframeAudioTrigger)', self.sound)
        self.assertIn('getSound().craft(PILOT_CRAFT[i], "lineage")', self.decks)
        self.assertIn('getSound().craft(i, "pip")', self.deck)

        provenance = json.loads(read("public/sfx/provenance.json"))
        self.assertEqual(provenance["version"], 1)
        self.assertEqual(provenance["policy"]["default"], "off")
        self.assertEqual(provenance["policy"]["trigger"], "explicit-selection-only")
        assets = provenance["assets"]
        self.assertEqual(set(assets), {"x1", "sr71", "falcon", "starship", "epstein", "warp", "fold"})
        for name in ("x1", "sr71", "falcon", "starship"):
            self.assertIn(assets[name]["kind"], {"official-recording", "silent"})
            self.assertTrue(assets[name]["sourceUrl"].startswith("https://"))
        for name in ("epstein", "warp", "fold"):
            self.assertEqual(assets[name]["kind"], "original")

        for name in ("x1", "sr71", "falcon", "starship", "epstein", "warp", "fold"):
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
        for marker in ("npm install", "npm run build", "path: dist", "actions/deploy-pages@v4"):
            self.assertIn(marker, workflow)
        vite = read("vite.config.ts")
        match = re.search(r"\bbase\s*:\s*([^,\n]+)", vite)
        if match:
            self.assertEqual(match.group(1).strip().strip("\"'"), "/")
        built = read("dist/index.html")
        self.assertIn('src="/assets/', built)
        self.assertIn('href="/assets/', built)
        self.assertNotIn("/v47/", built)

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
        source = "\n".join((self.deck, self.decks, self.eve, self.sound, self.stage))
        fetches = [target for _, target in re.findall(r"fetch\(\s*([\x60'\"])(.+?)\1", source)]
        self.assertEqual(fetches, ["/sfx/$" + "{name}.wav?v=51"])
        for tracker in ("google-analytics", "googletagmanager", "plausible.io", "segment.io", "mixpanel"):
            self.assertNotIn(tracker, source.lower())

    def test_reduced_motion_and_accessibility_floor(self) -> None:
        self.assertIn("@media (prefers-reduced-motion: reduce)", self.css)
        self.assertIn("animation: none !important", self.css)
        self.assertIn('href="#main-content"', self.deck)
        self.assertIn('id="main-content"', self.deck)
        self.assertIn('aria-label="Command decks"', self.deck)
        self.assertIn('aria-label="Mobile command decks"', self.deck)
        self.assertIn('role="log"', self.eve)
        self.assertIn('aria-live="polite"', self.eve)
        self.assertIn('aria-label="E.V.E. command output"', self.eve)

    def test_release_preserves_security_discovery_and_crawler_files(self) -> None:
        for relative in (".well-known/security.txt", "robots.txt", "sitemap.xml"):
            self.assertTrue((DIST / relative).is_file(), relative)
        security = read("dist/.well-known/security.txt")
        self.assertIn("mailto:admin@cashio.us", security)
        self.assertIn("https://cashio.us/.well-known/security.txt", security)


if __name__ == "__main__":
    unittest.main()
