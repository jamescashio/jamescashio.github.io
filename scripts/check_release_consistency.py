#!/usr/bin/env python3
"""Fail closed when the V35 source and GitHub Pages artifact disagree."""

from __future__ import annotations

import json
import html
import math
import re
import subprocess
import struct
import sys
import unicodedata
import wave
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_STATUS = ROOT / "public" / "status.json"
DIST = ROOT / "dist"

TEXT_SUFFIXES = {".html", ".js", ".css", ".json", ".txt", ".xml", ".svg"}
V34_PUBLIC_SURFACES = {
    "index.html": ("28 August 2026", "18/19 AT 28 AUG PROBE", "DATED EXPORT", "ROUTING INVENTORY 21 AUGUST 2026"),
    "lab.html": ("28 August 2026", "18/19 AT 28 AUG PROBE", "DATED EXPORT", "ROUTING INVENTORY 21 AUGUST 2026"),
}
ROUTING_COUNT_CLAIM = re.compile(
    r"\b10\s+PUBLIC(?:\s+CAPABILITY)?\s+LANES\b.*?\b36\s+PRIVATE\s+CATALOG(?:\s+ENTRIES)?\b",
    re.IGNORECASE | re.DOTALL,
)
ROUTING_PROVENANCE_PREFIX = re.compile(
    r"(?:ROUTING INVENTORY 21 AUGUST 2026|08-21-2026)\s*[:—·-]\s*$",
    re.IGNORECASE,
)
APPROVED_DATED_PUBLIC_CLAIMS = (
    "E.V.E. ONLINE · READ-ONLY · DATED EXPORT",
    "2 HOSTS ONLINE · QUORATE",
    "2 PROXMOX HOSTS ONLINE · QUORATE",
    "2 PROXMOX HOSTS ONLINE · CLUSTER QUORATE",
    "Two Proxmox hosts were online and quorate.",
    "two online, quorate hosts at the dated probe",
    "08-21-2026 · 10 PUBLIC LANES · 36 PRIVATE CATALOG",
)
APPROVED_PUBLIC_STATUS_LABELS = (
    "E.V.E. EVALUATION VERIFICATION ENGINE · ONLINE",
    "SYSTEMS ONLINE · HUMAN COMMAND RETAINED",
)
APPROVED_TECHNICAL_CLASS_TOKENS = {"za-systems-online", "is-online"}
CURRENT_CLAIM_SUBJECTS = {
    "atlas",
    "zeus",
    "apollo",
    "eve",
    "system",
    "systems",
    "host",
    "hosts",
    "fleet",
    "routing",
    "lane",
    "lanes",
    "service",
    "services",
    "infrastructure",
}
CURRENT_CLAIM_STATUS = {"current", "online"}
CURRENT_CLAIM_QUALIFIERS = {"active", "availability", "health", "state", "status"}
DIRECT_STALE_FLEET_CLAIM = re.compile(r"\b19\s*(?:/|of)\s*19\b", re.IGNORECASE)
PRIVATE_CURRENT_FLEET_PATTERNS = (
    re.compile(r"\bATLAS\s*·\s*(?:GATEWAY|LOCAL INFERENCE)", re.IGNORECASE),
    re.compile(r"\bATHENA\s*·\s*QUORUM SUPPORT", re.IGNORECASE),
    re.compile(r"\bGENESIS\s*·\s*(?:PRIVATE STORAGE|RECOVERY)", re.IGNORECASE),
    re.compile(r"\bdeepseek-v4-(?:flash|pro)\b", re.IGNORECASE),
    re.compile(r"\bhub\s*[:=]\s*[\"'](?:zeus|apollo)\b", re.IGNORECASE),
    re.compile(r"\bdata-hub\s*=\s*[\"'](?:zeus|apollo)\b", re.IGNORECASE),
)
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


STAGE_DIR = "src/lib/stage"

_WHITESPACE = re.compile(r"\s+")


def collapse(text: str) -> str:
    """Drop whitespace so a marker survives a formatter reflow."""
    return _WHITESPACE.sub("", text)


def contains(text: str, marker: str) -> bool:
    """Marker match that tolerates the line breaks Prettier introduces."""
    return marker in text or collapse(marker) in collapse(text)


def read_stage() -> str:
    """The viewscreen stage is a directory of typed modules, not one file.

    Contract markers may live in any of them, so the gate reads them as one
    body of source. Adding a module never silently drops a marker check.
    """
    parts = sorted((ROOT / STAGE_DIR).glob("*.ts"))
    if not parts:
        raise SystemExit(f"{STAGE_DIR} holds no stage modules")
    return "\n".join(path.read_text(encoding="utf-8") for path in parts)


def collect_text(folder: Path) -> str:
    chunks: list[str] = []
    for path in sorted(folder.rglob("*")):
        if path.is_file() and path.suffix.lower() in TEXT_SUFFIXES:
            chunks.append(path.read_text(encoding="utf-8"))
    return "\n".join(chunks)


def check_current_public_privacy(text: str, failures: list[str], label: str) -> None:
    for pattern in PRIVATE_CURRENT_FLEET_PATTERNS:
        match = pattern.search(text)
        if match:
            failures.append(f"{label} contains private current-fleet detail {match.group(0)!r}")


class PublicSurfaceParser(HTMLParser):
    """Collect one ordered public text stream plus complete, contextual attributes."""

    _BLOCK_TAGS = {"article", "aside", "div", "footer", "header", "li", "main", "p", "section", "td", "th"}

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.visible_text: list[str] = []
        self.attribute_values: list[str] = []
        self._open_tags: list[str] = []
        self._safe_current_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.visible_text.append(" ")
        self._open_tags.append(tag)
        if tag == "button" and dict(attrs).get("data-cmd") == "current":
            self._safe_current_depth += 1
        for name, value in attrs:
            if value is None:
                continue
            if name == "class":
                # Preserve a single remaining scan unit: `hosts online` must not
                # disappear merely because adjacent class tokens are implementation-safe.
                remaining = " ".join(
                    token for token in value.split() if token not in APPROVED_TECHNICAL_CLASS_TOKENS
                )
                if remaining:
                    self.attribute_values.append(remaining)
            elif not (name == "data-cmd" and value == "current"):
                self.attribute_values.append(value)

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.handle_starttag(tag, attrs)

    def handle_endtag(self, tag: str) -> None:
        # Only a real block close is a sentence boundary. An unmatched malformed
        # close stays whitespace so HOSTS</div>ONLINE cannot evade the guard.
        if tag in self._open_tags:
            while self._open_tags:
                opened = self._open_tags.pop()
                if opened == tag:
                    break
            self.visible_text.append(". " if tag in self._BLOCK_TAGS else " ")
        else:
            self.visible_text.append(" ")
        if tag == "button" and self._safe_current_depth:
            self._safe_current_depth -= 1

    def handle_data(self, data: str) -> None:
        # HTMLParser preserves source order even for fragments and bad close tags.
        if not (self._safe_current_depth and data.strip() == "CURRENT"):
            self.visible_text.append(data)


def blank_exact_approved_visible_phrases(text: str) -> str:
    """Blank only complete, case-sensitive approved visible phrases."""
    for phrase in (*APPROVED_DATED_PUBLIC_CLAIMS, *APPROVED_PUBLIC_STATUS_LABELS):
        exact_words = r"\s+".join(re.escape(word) for word in phrase.split(" "))
        text = re.sub(rf"(?<!\w){exact_words}(?!\w)", lambda match: " " * len(match.group(0)), text)
    return text


def public_claim_tokens(text: str) -> list[str]:
    normalized = html.unescape(text)
    normalized = "".join(char for char in normalized if unicodedata.category(char) not in {"Cf", "Mn", "Mc", "Me"})
    normalized = unicodedata.normalize("NFKC", normalized)
    # E.V.E. is a subject spelling, not a sentence terminator; the exact
    # approved dated phrase was already blanked before this normalization.
    normalized = re.sub(r"\b(e[._-]?v[._-]?e)\.(?=\s)", r"\1", normalized, flags=re.IGNORECASE)
    normalized = unicodedata.normalize("NFKC", normalized).casefold()
    tokens = re.findall(r"[a-z0-9]+", normalized)
    merged: list[str] = []
    index = 0
    while index < len(tokens):
        if tokens[index : index + 3] == ["e", "v", "e"]:
            merged.append("eve")
            index += 3
        else:
            merged.append(tokens[index])
            index += 1
    return merged


def has_stale_current_public_claim(text: str) -> bool:
    normalized = html.unescape(text)
    normalized = "".join(char for char in normalized if unicodedata.category(char) not in {"Cf", "Mn", "Mc", "Me"})
    normalized = unicodedata.normalize("NFKC", normalized)
    normalized = re.sub(r"\b(e[._-]?v[._-]?e)\.(?=\s)", r"\1", normalized, flags=re.IGNORECASE)
    if DIRECT_STALE_FLEET_CLAIM.search(normalized):
        return True
    # Sentence boundaries are the only claim boundaries. Tags and newlines are
    # already ordinary whitespace in the ordered stream, so they cannot hide a
    # status assertion; unrelated sentences cannot be accidentally combined.
    for sentence in re.split(r"[.!?]+(?=\s|$)\s*", normalized):
        tokens = public_claim_tokens(sentence)
        for index, token in enumerate(tokens):
            if token not in CURRENT_CLAIM_SUBJECTS:
                continue
            window = tokens[max(0, index - 12) : index + 13]
            if "online" in window:
                return True
            if "current" in window and CURRENT_CLAIM_QUALIFIERS & set(window):
                return True
    return False


def public_surface_has_stale_current_claim(text: str) -> bool:
    parser = PublicSurfaceParser()
    parser.feed(text)
    parser.close()
    if any(has_stale_current_public_claim(value) for value in parser.attribute_values):
        return True
    visible = "".join(parser.visible_text)
    return has_stale_current_public_claim(blank_exact_approved_visible_phrases(visible))


def collect_public_code_literals(paths: list[Path]) -> list[dict[str, str]]:
    """Use TypeScript's parser so shipped literals cannot evade the HTML guard."""
    if not paths:
        return []
    result = subprocess.run(
        ["node", str(ROOT / "scripts" / "collect_public_code_literals.mjs"), *(str(path) for path in paths)],
        cwd=ROOT,
        capture_output=True,
        check=True,
        text=True,
    )
    return json.loads(result.stdout)


def has_stale_current_code_literal(literal: dict[str, str]) -> bool:
    # TypeScript may surface UTF-8 source bytes from legacy checked-in JSX as
    # U+00C2 followed by the intended middle dot; normalize that representation
    # before comparing the exact approved public phrases.
    value = literal["value"].replace("\u00c2\u00b7", "\u00b7")
    if literal.get("context") == "class":
        value = " ".join(token for token in value.split() if token not in APPROVED_TECHNICAL_CLASS_TOKENS)
    return bool(value) and has_stale_current_public_claim(blank_exact_approved_visible_phrases(value))


def check_v34_public_surface(relative: str, text: str, failures: list[str], label: str) -> None:
    for marker in V34_PUBLIC_SURFACES[relative]:
        if marker not in text:
            failures.append(f"{label}/{relative} is missing V34 marker {marker!r}")
    if public_surface_has_stale_current_claim(text):
        failures.append(f"{label}/{relative} contains a stale/current public claim")
    for occurrence, match in enumerate(ROUTING_COUNT_CLAIM.finditer(text), start=1):
        prefix = text[max(0, match.start() - 96) : match.start()]
        if not ROUTING_PROVENANCE_PREFIX.search(prefix):
            failures.append(f"must date routing count occurrence {occurrence} as the 21 August 2026 inventory")
    check_current_public_privacy(text, failures, f"{label}/{relative}")


def check_v34_motion_contract(failures: list[str]) -> None:
    """Keep the V34 motion boundary executable, rather than marker-comment based."""
    stage = read_stage()
    deck = read("src/components/command-deck.tsx")
    css = read("src/styles.css")
    timing = read("src/lib/animation-timing.ts")
    required = {
        "src/lib/animation-timing.ts": (
            '"deck-copy": 380',
            '"article-acquisition": 560',
            '"stage-warp": 680',
        ),
        "src/lib/stage": ('dt * (1000 / motionDurationMs("stage-warp"))',),
        "src/components/command-deck.tsx": (
            '"--za-deck-copy-duration": `${motionDurationMs("deck-copy")}ms`',
            '"--za-article-acquisition-duration": `${motionDurationMs("article-acquisition")}ms`',
            '"--za-stage-warp-duration": `${motionDurationMs("stage-warp")}ms`',
        ),
        "src/styles.css": (
            "animation: za-rise var(--za-deck-copy-duration)",
            "animation: za-article-acquire var(--za-article-acquisition-duration)",
            "animation: za-warpflash var(--za-stage-warp-duration)",
        ),
    }
    source_by_name = {
        "src/lib/animation-timing.ts": timing,
        "src/lib/stage": stage,
        "src/components/command-deck.tsx": deck,
        "src/styles.css": css,
    }
    for filename, markers in required.items():
        for marker in markers:
            if not contains(source_by_name[filename], marker):
                failures.append(f"{filename} is missing executable V34 motion marker {marker!r}")
    for stale in ("dt * 1.05", "V33 baseline retained", "animation: za-rise 900ms"):
        if stale in stage or stale in css:
            failures.append(f"V34 motion source retains obsolete V33 marker {stale!r}")
    for deck_index in range(9):
        selector = f'section:not([data-deck="{deck_index}"])'
        for pseudo in ("*", "*::before", "*::after"):
            if f"{selector} {pseudo}" not in css:
                failures.append(f"inactive deck {deck_index} does not pause {pseudo} animation work")


def main() -> int:
    failures: list[str] = []

    try:
        status = json.loads(PUBLIC_STATUS.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"Release consistency check failed: public/status.json: {exc}")
        return 1

    expected = {
        "release": "V35 ALL TENS",
        "revised": "2026-08-28",
        "status": "dated-export",
        "verified": "2026-08-28",
        "verifiedLong": "28 August 2026",
        "expires": "2026-09-27",
    }
    for key, value in expected.items():
        if status.get(key) != value:
            failures.append(f"public/status.json {key!r}: expected {value!r}, got {status.get(key)!r}")

    exact_nested = {
        ("proxmox", "version"): "9.2.11",
        ("proxmox", "hostsOnline"): 2,
        ("proxmox", "quorate"): True,
        ("containers", "running"): 18,
        ("containers", "documented"): 19,
        ("containers", "stopped"): 1,
        ("containers", "zeus"): 12,
        ("containers", "apollo"): 6,
        ("lanes", "public"): 10,
        ("lanes", "privateCatalog"): 36,
    }
    for (group, key), value in exact_nested.items():
        actual = status.get(group, {}).get(key)
        if actual != value:
            failures.append(f"public/status.json {group}.{key}: expected {value!r}, got {actual!r}")

    if status.get("routingVerified") != "2026-08-21":
        failures.append("public/status.json routingVerified must remain the separate 2026-08-21 inventory date")

    for private_key in ("deepseek", "atlas"):
        if private_key in status:
            failures.append(f"public/status.json must not publish private field {private_key!r}")
    check_current_public_privacy(json.dumps(status), failures, "public/status.json")
    if "static" not in str(status.get("note", "")).lower():
        failures.append("public/status.json must identify itself as a static snapshot")

    if read("status.json") != read("public/status.json"):
        failures.append("root status.json and public/status.json are not byte-identical")
    for cname in ("CNAME", "public/CNAME"):
        if read(cname).strip() != "cashio.us":
            failures.append(f"{cname} must contain only cashio.us")

    package = json.loads(read("package.json"))
    if package.get("version") != "35.0.0":
        failures.append("package.json version must be 35.0.0")
    if package.get("scripts", {}).get("build") != "tsc --noEmit && vite build && node --import tsx scripts/prerender.mts":
        failures.append("package.json build script changed from the supplied TypeScript + Vite + prerender gate")

    vite = read("vite.config.ts")
    base_match = re.search(r"\bbase\s*:\s*([^,\n]+)", vite)
    if base_match and base_match.group(1).strip().strip("\"'") != "/":
        failures.append(f"Vite base must be '/', got {base_match.group(1).strip()!r}")

    pages = read(".github/workflows/pages.yml")
    for marker in (
        "branches: [main, master]",
        "npm ci",
        "npm run lint",
        "npm run format:check",
        "npm run test:node",
        "npm run build",
        "npm run test:release",
        "python scripts/public_repo_guard.py",
        "python scripts/check_release_consistency.py",
        "python -m py_compile",
        "python scripts/check_committed_whitespace.py",
        "GH_TOKEN: ${{ github.token }}",
        'test "$(gh api repos/${GITHUB_REPOSITORY}/pages --jq .build_type)" = "workflow"',
        "actions/configure-pages@v5",
        "actions/upload-pages-artifact@v5",
        "path: dist",
        "include-hidden-files: true",
        "actions/deploy-pages@v4",
    ):
        if marker not in pages:
            failures.append(f"Pages workflow is missing {marker!r}")

    required_source = {
        "src/lib/store.ts": ("gate: false", "audio: DEFAULT_AUDIO_ENABLED", "deck: 0"),
        "src/lib/content.ts": (
            'VERIFIED_LONG = "28 August 2026"',
            'ROUTING_VERIFIED_LONG = "21 August 2026"',
            'REVISED = "08-28-2026"',
            'EXPIRES_AT = "2026-09-28T05:00:00Z"',
            '"18/19 AT 28 AUG PROBE · ZEUS 12/13 · APOLLO 6/6"',
            'model: "DeepSeek V4 Flash"',
            'model: "DeepSeek V4 Pro"',
            'model: "Gemini 3.7 Flash"',
            'model: "Grok 4.6"',
        ),
        "src/components/decks.tsx": (
            "SIGNED · OWNER · {VERIFIED_LONG}",
            "CHANNEL LOCK · OPEN",
            "LINEAGE_EVIDENCE",
            "CONCEPT VISUAL",
            "aria-pressed={pick === i}",
            "COMMITTED",
            'getSound().craft(PILOT_CRAFT[i], "lineage")',
        ),
        "src/components/deck-primitives.tsx": (
            "za-plate-scan",
            'loading="lazy"',
            'decoding="async"',
        ),
        "src/components/eve-console.tsx": (
            'command === "sitrep"',
            'command === "current"',
            'command === "help"',
            'command === "whoami"',
            "NO NETWORK CALLS",
        ),
        "src/lib/stage": (
            'this.warpT = Math.max(0, this.warpT - dt * (1000 / motionDurationMs("stage-warp")))',
            "55 + warp * 34",
            "Math.min(2.25",
            "if (next !== this.craftTarget)",
            "this.warpT = 1",
            "pose: { yaw: -0.62, pitch: 0.42",
            "solidOpacity: 0.64",
            "lineageSolidOpacity: 0.08",
        ),
        "src/styles.css": (
            "transform: translateY(28px)",
            "filter: blur(12px)",
            "animation: za-rise var(--za-deck-copy-duration)",
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
            'getSound().craft(index, "pip")',
            "md:block",
        ),
        "src/components/command-chrome.tsx": (
            "za-command-header",
            "AUDIO ARMED",
            "AUDIO OFF",
        ),
    }
    for filename, markers in required_source.items():
        text = read_stage() if filename == STAGE_DIR else read(filename)
        for marker in markers:
            if not contains(text, marker):
                failures.append(f"{filename} is missing V34 contract marker {marker!r}")

    check_v34_motion_contract(failures)

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

    for relative, source_relative in (("index.html", "index.html"), ("lab.html", "public/lab.html")):
        check_v34_public_surface(relative, read(source_relative), failures, "source")

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

        for relative in V34_PUBLIC_SURFACES:
            path = DIST / relative
            if path.is_file():
                check_v34_public_surface(relative, path.read_text(encoding="utf-8"), failures, "dist")

        live = collect_text(DIST)
        check_current_public_privacy(live, failures, "built Pages artifact")
        for marker in (
            "28 August 2026",
            "18/19 AT 28 AUG PROBE",
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
    check_current_public_privacy(source_tree, failures, "current source")
    literal_paths = [
        path
        for path in sorted((ROOT / "src").rglob("*"))
        if path.is_file() and path.suffix.lower() in {".ts", ".tsx", ".js"}
    ]
    if DIST.is_dir():
        literal_paths.extend(path for path in sorted(DIST.rglob("*.js")) if path.is_file())
    try:
        literals = collect_public_code_literals(literal_paths)
    except (OSError, subprocess.CalledProcessError, json.JSONDecodeError) as exc:
        failures.append(f"could not parse shipped public code literals: {exc}")
    else:
        for literal in literals:
            if has_stale_current_code_literal(literal):
                failures.append(f"shipped public code literal contains a stale/current claim: {literal['file']}")
                break
    check_current_public_privacy(read("RELEASE_BODY.md"), failures, "RELEASE_BODY.md")
    for token in ("google-analytics", "googletagmanager", "plausible.io", "segment.io", "mixpanel"):
        if token in source_tree.lower():
            failures.append(f"tracking/analytics dependency found in source: {token}")
    fetch_targets = [target for _, target in re.findall(r"fetch\(\s*([\x60'\"])(.+?)\1", source_tree)]
    if not fetch_targets:
        # A refactor that hides every literal behind a helper would otherwise
        # pass this gate vacuously while still being free to reach anywhere.
        failures.append("no literal fetch target found in source; the same-origin egress gate cannot read it")
    for target in fetch_targets:
        if not target.startswith("/sfx/"):
            failures.append(f"non-audio fetch target found in source: {target!r}")

    if failures:
        print("V35 release consistency check failed:\n")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print(
        "V35 release consistency passed: 28 August 2026 dated export; "
        "18/19 containers; 2 Proxmox hosts quorate; 10 public lanes; "
        "36 private catalog entries; root Pages base; archive, privacy, "
        "motion, opt-in audio, and forbidden-token gates satisfied."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
