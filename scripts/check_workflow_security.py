"""Run the pinned workflow scanner offline and retain a concise local report."""
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "artifacts" / "quality" / "workflow-security.json"


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps({"completed": False, "passed": False}) + "\n", encoding="utf-8")
    expected = re.search(r"^zizmor==([\d.]+)", (ROOT / "requirements-workflow-security.txt").read_text(encoding="utf-8"), re.M)
    if not expected:
        raise ValueError("Pinned zizmor version is missing")
    binary = os.environ.get("ZIZMOR_PATH") or shutil.which("zizmor")
    if not binary:
        raise RuntimeError("Install requirements-workflow-security.txt or set ZIZMOR_PATH")
    environment = {
        key: value
        for key, value in os.environ.items()
        if key not in ("GH_TOKEN", "GITHUB_TOKEN") and not key.startswith("ZIZMOR_")
    }
    version = subprocess.check_output([binary, "--version"], text=True, encoding="utf-8", timeout=15, env=environment).strip()
    if version != "zizmor " + expected[1]:
        raise RuntimeError("Installed zizmor does not match the reviewed requirements pin")
    scan = subprocess.run(
        [binary, "--offline", "--strict-collection", "--no-config", "--no-ignores", "--persona=regular",
         "--format=json-v1", "--no-progress", "--color=never", str(ROOT / ".github" / "workflows")],
        cwd=ROOT, env=environment, capture_output=True, text=True, encoding="utf-8", timeout=90,
    )
    findings = json.loads(scan.stdout)
    if not isinstance(findings, list) or not all(isinstance(finding, dict) for finding in findings) or scan.returncode not in (0, 11, 12, 13, 14):
        raise RuntimeError("Workflow scanner did not complete successfully")
    summary = []
    for finding in findings:
        locations = []
        for location in finding.get("locations", []):
            if location.get("symbolic", {}).get("kind") != "Primary":
                continue
            filename = Path(location["symbolic"]["key"]["Local"]["verbatim_path"])
            filename = filename if filename.is_absolute() else ROOT / filename
            locations.append({"file": filename.resolve().relative_to(ROOT).as_posix(),
                              "line": location["concrete"]["location"]["start_point"]["row"] + 1})
        summary.append({"rule": finding["ident"], "severity": finding["determinations"]["severity"],
                        "confidence": finding["determinations"]["confidence"], "locations": locations,
                        "documentation": finding["url"]})
    passed = scan.returncode == 0 and findings == []
    OUTPUT.write_text(json.dumps({"version": version, "mode": "offline", "completed": True,
                                  "passed": passed, "findings": summary}, indent=2) + "\n", encoding="utf-8")
    print(f"Workflow security: {len(summary)} finding(s); offline scan completed.")
    return 0 if passed else 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (OSError, ValueError, KeyError, TypeError, RuntimeError, subprocess.SubprocessError) as error:
        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT.write_text(json.dumps({"completed": False, "passed": False, "error_type": type(error).__name__}) + "\n", encoding="utf-8")
        print(f"Workflow security check could not complete ({type(error).__name__}).", file=sys.stderr)
        sys.exit(1)
