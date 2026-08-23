#!/usr/bin/env python3
"""Fail closed when the V32 source and GitHub Pages artifact disagree."""

from __future__ import annotations

import json
import math
import re
import struct
import sys
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_STATUS = ROOT / "public" / "status.json"
DIST = ROOT / "dist"

TEXT_SUFFIXES = {".html", ".js", ".css", ".json", ".txt", ".xml", ".svg"}
FORBIDDEN_LIVE = (
    "10 August 2026",
    "08-10-2026",
    "deepseek-chat",
    "Gemini 3.6 Flash",
    "Grok 4.5",
    "Creative AI Technologist",
    "REQUEST A REVIEW",
)
PRIVATE_ADDRESS = re.compile(
    r"\b(?:10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|"
    r"172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})\b"
)


def read(relative: str) -> str:
    return (ROOT / relative).read_text(encoding="utf-8")


def collect_text(folder: Path) -> str:
    chunks: list[str] = []
    for path in sorted(folder.rglob("*")):
        if path.is_file() and path.suffix.lower() in TEXT_SUFFIXES:
            chunks.append(path.read_text(encoding="utf-8"))
    return "\n".join(chunks)


def main() -> int:
    failures: list[str] = []

    try:
        status = json.loads(PUBLIC_STATUS.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"Release consistency check failed: public/status.json: {exc}")
        return 1

    expected = {
        "release": "V32 MACH ONE",
        "revised": "2026-08-23",
        "status": "current",
        "verified": "2026-08-21",
        "verifiedLong": "21 August 2026",
        "expires": "2026-09-20",
    }
    for key, value in expected.items():
        if status.get(key) != value:
            failures.append(f"public/status.json {key!r}: expected {value!r}, got {status.get(key)!r}")

    exact_nested = {
        ("proxmox", "version"): "9.2.11",
        ("proxmox", "hostsOnline"): 2,
        ("proxmox", "quorate"): True,
        ("containers", "running"): 19,
        ("containers", "documented"): 19,
        ("containers", "stopped"): 0,
        ("containers", "zeus"): 13,
        ("containers", "apollo"): 6,
        ("lanes", "public"): 10,
        ("lanes", "privateCatalog"): 36,
    }
    for (group, key), value in exact_nested.items():
        actual = status.get(group, {}).get(key)
        if actual != value:
            failures.append(f"public/status.json {group}.{key}: expected {value!r}, got {actual!r}")

    if set(status.get("deepseek", [])) != {"deepseek-v4-flash", "deepseek-v4-pro"}:
        failures.append("public/status.json must publish only deepseek-v4-flash and deepseek-v4-pro")
    if "not a Proxmox host" not in str(status.get("atlas", "")):
        failures.append("public/status.json must keep Atlas outside the Proxmox host count")
    if "static" not in str(status.get("note", "")).lower():
        failures.append("public/status.json must identify itself as a static snapshot")

    if read("status.json") != read("public/status.json"):
        failures.append("root status.json and public/status.json are not byte-identical")
    for cname in ("CNAME", "public/CNAME"):
        if read(cname).strip() != "cashio.us":
            failures.append(f"{cname} must contain only cashio.us")

    package = json.loads(read("package.json"))
    if package.get("version") != "32.0.0":
        failures.append("package.json version must be 32.0.0")
    if package.get("scripts", {}).get("build") != "tsc --noEmit && vite build":
        failures.append("package.json build script changed from the supplied TypeScript + Vite gate")

    vite = read("vite.config.ts")
    base_match = re.search(r"\bbase\s*:\s*([^,\n]+)", vite)
    if base_match and base_match.group(1).strip().strip("\"'") != "/":
        failures.append(f"Vite base must be '/', got {base_match.group(1).strip()!r}")

    pages = read(".github/workflows/pages.yml")
    for marker in (
        "branches: [main, master]",
        "npm install",
        "npm run build",
        "actions/upload-pages-artifact@v3",
        "path: dist",
        "actions/deploy-pages@v4",
    ):
        if marker not in pages:
            failures.append(f"Pages workflow is missing {marker!r}")

    required_source = {
        "src/lib/store.ts": ("gate: false", "audio: DEFAULT_AUDIO_ENABLED", "deck: 0"),
        "src/lib/content.ts": (
            'VERIFIED_LONG = "21 August 2026"',
            'REVISED = "08-23-2026"',
            'EXPIRES_AT = "2026-09-21T05:00:00Z"',
            '"19 OF 19 PUBLISHED CONTAINERS — RUNNING AT PROBE"',
            '"deepseek-v4-flash"',
            '"deepseek-v4-pro"',
            'model: "Gemini 3.7 Flash"',
            'model: "Grok 4.6"',
        ),
        "src/components/decks.tsx": (
            "SIGNED · OWNER · {VERIFIED_LONG}",
            "CHANNEL LOCK · OPEN",
            "za-plate-scan",
            "LINEAGE_EVIDENCE",
            "CONCEPT VISUAL",
            "aria-pressed={pick === i}",
            "COMMITTED",
            'getSound().craft(PILOT_CRAFT[i], "lineage")',
        ),
        "src/components/eve-console.tsx": (
            'command === "sitrep"',
            'command === "current"',
            'command === "help"',
            'command === "whoami"',
            "NO NETWORK CALLS",
        ),
        "src/lib/viewscreen-stage.js": (
            "this.warpT = Math.max(0, this.warpT - dt * 1.05)",
            "55 + warp * 34",
            "Math.min(2.05",
            "if (next !== this.craftTarget)",
            "this.warpT = 1",
            "pose: { yaw: -0.62, pitch: 0.42",
            "solidOpacity: 0.64",
            "lineageSolidOpacity: 0.08",
        ),
        "src/styles.css": (
            "transform: translateY(28px)",
            "filter: blur(12px)",
            ".za-rise {\n  animation: za-rise 900ms",
            "animation: za-shimmer 3.2s",
            ".za-plate-scan::after",
            ".za-airframe-acquire",
            "@media (max-width: 639px)",
            "@media (prefers-reduced-motion: reduce)",
        ),
        "src/lib/sound.ts": (
            "Quiet by default",
            "this.master.gain.setTargetAtTime(0.42",
            "AIRFRAME_SAMPLE_NAMES",
            "craft(i: number, trigger: AirframeAudioTrigger)",
            "no first-gesture blast",
        ),
        "src/components/command-deck.tsx": (
            'getSound().craft(i, "pip")',
            "za-command-header",
            "md:block",
            "AUDIO ARMED",
            "AUDIO OFF",
        ),
    }
    for filename, markers in required_source.items():
        text = read(filename)
        for marker in markers:
            if marker not in text:
                failures.append(f"{filename} is missing V32 contract marker {marker!r}")

    required_public = (
        "public/command.html",
        "public/lab.html",
        "public/status.json",
        "public/CNAME",
        "public/favicon.svg",
        "public/og.jpg",
        "public/x-banner.jpg",
        "public/plates/command.jpg",
        "public/plates/rack.jpg",
        "public/plates/operator.jpg",
        "public/plates/fold.jpg",
        "public/plates/proteus-nasa.webp",
        "public/plates/provenance.json",
        "public/.well-known/security.txt",
        "public/robots.txt",
        "public/sitemap.xml",
        "public/sfx/provenance.json",
    )
    for relative in required_public:
        if not (ROOT / relative).is_file():
            failures.append(f"required public asset is missing: {relative}")

    proteus_image = ROOT / "public" / "plates" / "proteus-nasa.webp"
    if proteus_image.is_file() and proteus_image.stat().st_size <= 50_000:
        failures.append("public/plates/proteus-nasa.webp is unexpectedly small")
    try:
        plate_provenance = json.loads(read("public/plates/provenance.json"))
    except (OSError, json.JSONDecodeError) as exc:
        plate_provenance = {}
        failures.append(f"public/plates/provenance.json is invalid: {exc}")
    proteus_source = plate_provenance.get("assets", {}).get("proteus-nasa", {})
    if proteus_source.get("credit") != "NASA / ESPO":
        failures.append("Proteus evidence plate must retain NASA / ESPO credit")
    if not str(proteus_source.get("sourcePage", "")).startswith("https://espo.nasa.gov/"):
        failures.append("Proteus evidence plate must retain its official NASA/ESPO source page")

    audio_names = ("x1", "sr71", "proteus", "starship", "epstein", "warp", "fold", "p51")
    try:
        provenance = json.loads(read("public/sfx/provenance.json"))
    except (OSError, json.JSONDecodeError) as exc:
        provenance = {}
        failures.append(f"public/sfx/provenance.json is invalid: {exc}")
    policy = provenance.get("policy", {})
    if policy.get("default") != "off" or policy.get("trigger") != "explicit-selection-only":
        failures.append("audio provenance must lock off-by-default, explicit-selection-only behavior")
    audio_assets = provenance.get("assets", {})
    if set(audio_assets) != set(audio_names):
        failures.append("audio provenance must describe exactly the eight published one-shots")
    for name in ("x1", "sr71", "proteus", "starship", "p51"):
        item = audio_assets.get(name, {})
        if item.get("kind") not in {"official-recording", "silent"}:
            failures.append(f"real-airframe cue {name!r} must be an official recording or intentional silence")
        if not str(item.get("sourceUrl", "")).startswith("https://"):
            failures.append(f"real-airframe cue {name!r} must have an HTTPS provenance source")
    for name in ("epstein", "warp", "fold"):
        if audio_assets.get(name, {}).get("kind") != "original":
            failures.append(f"fictional cue {name!r} must be original sound design")

    for name in audio_names:
        path = ROOT / "public" / "sfx" / f"{name}.wav"
        if not path.is_file():
            failures.append(f"required one-shot is missing: public/sfx/{name}.wav")
            continue
        try:
            with wave.open(str(path), "rb") as audio:
                channels = audio.getnchannels()
                width = audio.getsampwidth()
                rate = audio.getframerate()
                frames = audio.getnframes()
                raw = audio.readframes(frames)
            if channels != 1 or width != 2 or rate < 44_100 or frames <= 0:
                failures.append(f"public/sfx/{name}.wav must be mono 16-bit PCM at 44.1 kHz or higher")
                continue
            if frames / rate > 1.2:
                failures.append(f"public/sfx/{name}.wav exceeds the 1.2-second one-shot limit")
            samples = struct.unpack(f"<{len(raw) // 2}h", raw)
            peak = max(abs(sample) for sample in samples)
            if peak and 20 * math.log10(peak / 32767) > -3.0:
                failures.append(f"public/sfx/{name}.wav exceeds the -3 dBFS peak ceiling")
            if audio_assets.get(name, {}).get("kind") != "silent":
                rms = math.sqrt(sum(sample * sample for sample in samples) / len(samples))
                rms_dbfs = 20 * math.log10(rms / 32767) if rms else -math.inf
                if not -32.0 < rms_dbfs <= -12.0:
                    failures.append(f"public/sfx/{name}.wav RMS must stay between -32 and -12 dBFS")
        except (OSError, EOFError, wave.Error, struct.error) as exc:
            failures.append(f"public/sfx/{name}.wav is not a valid PCM WAVE asset: {exc}")

    command = read("public/command.html")
    for marker in ("Historical archive only", "May 2026", "This page does not describe the current fleet."):
        if marker not in command:
            failures.append(f"public/command.html is missing {marker!r}")
    lab = read("public/lab.html")
    if '<meta http-equiv="refresh" content="0; url=/" />' not in lab:
        failures.append("public/lab.html must redirect to /")

    if not DIST.is_dir():
        failures.append("dist/ is missing; run npm run build before the release check")
    else:
        required_dist = (
            "index.html",
            "CNAME",
            "command.html",
            "lab.html",
            "status.json",
            "robots.txt",
            "sitemap.xml",
            ".well-known/security.txt",
            "sfx/provenance.json",
        )
        for relative in required_dist:
            if not (DIST / relative).is_file():
                failures.append(f"built Pages artifact is missing {relative}")

        live = collect_text(DIST)
        for marker in (
            "21 August 2026",
            "19 OF 19",
            "QUORATE",
            "10 PUBLIC",
            "36 PRIVATE",
            "AUDIO OFF",
            "AUDIO ARMED",
            "SIGNED · OWNER",
            "CHANNEL LOCK · OPEN",
        ):
            if marker.lower() not in live.lower():
                failures.append(f"built Pages artifact is missing required marker {marker!r}")
        for marker in FORBIDDEN_LIVE:
            if marker.lower() in live.lower():
                failures.append(f"forbidden stale wording appears in built Pages artifact: {marker!r}")
        if PRIVATE_ADDRESS.search(live):
            failures.append("an RFC1918 address appears in the built Pages artifact")

        built_index = (DIST / "index.html").read_text(encoding="utf-8")
        if 'src="/assets/' not in built_index or 'href="/assets/' not in built_index:
            failures.append("built index does not use root-relative /assets/ URLs; Vite base may not be '/'")
        if re.search(r"/v\d+/", built_index, flags=re.IGNORECASE):
            failures.append("built index is incorrectly nested under a version directory")
        for csp in ("connect-src 'self'", "object-src 'none'", "form-action 'none'"):
            if csp not in built_index:
                failures.append(f"built index CSP is missing {csp!r}")

    source_tree = "\n".join(
        path.read_text(encoding="utf-8")
        for path in sorted((ROOT / "src").rglob("*"))
        if path.is_file() and path.suffix.lower() in {".ts", ".tsx", ".js", ".css"}
    )
    for token in ("google-analytics", "googletagmanager", "plausible.io", "segment.io", "mixpanel"):
        if token in source_tree.lower():
            failures.append(f"tracking/analytics dependency found in source: {token}")
    for _, target in re.findall(r"fetch\(\s*([\x60'\"])(.+?)\1", source_tree):
        if not target.startswith("/sfx/"):
            failures.append(f"non-audio fetch target found in source: {target!r}")

    if failures:
        print("V32 release consistency check failed:\n")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print(
        "V32 release consistency passed: 21 August 2026 static snapshot; "
        "19/19 containers; 2 Proxmox hosts quorate; 10 public lanes; "
        "36 private catalog entries; root Pages base; archive, privacy, "
        "motion, opt-in audio, and forbidden-token gates satisfied."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
