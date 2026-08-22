from __future__ import annotations

import json
import re
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

    def test_opens_on_snapshot_without_an_engage_gate_and_audio_is_on(self) -> None:
        for marker in ("gate: false", "deck: 0", 'mode: "technical"', "audio: true"):
            self.assertIn(marker, self.store)
        self.assertNotIn("REQUEST A REVIEW", self.live.upper())
        self.assertNotIn(">ENGAGE<", self.live.upper())
        self.assertIn("AUDIO ON", self.live)
        self.assertIn("DESCEND THE DECKS", self.live)

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

    def test_audio_is_hotter_effects_only_and_all_one_shots_are_valid(self) -> None:
        self.assertIn("No bed, no score.", self.sound)
        self.assertIn("NASA public-domain launch nats", self.sound)
        self.assertIn("this.master.gain.setTargetAtTime(0.74", self.sound)
        self.assertIn('const names = ["x1", "sr71", "falcon", "starship", "epstein", "warp", "fold"]', self.sound)
        self.assertNotIn("startBed", self.sound)
        self.assertNotIn("bedGain", self.sound)
        for name in ("x1", "sr71", "falcon", "starship", "epstein", "warp", "fold"):
            path = ROOT / "public" / "sfx" / f"{name}.wav"
            with self.subTest(name=name), wave.open(str(path), "rb") as audio:
                self.assertGreater(audio.getframerate(), 0)
                self.assertGreater(audio.getnframes(), 0)

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
        self.assertEqual(fetches, ["/sfx/$" + "{name}.wav?v=50"])
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
