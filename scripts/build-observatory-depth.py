"""Author a decorative depth field in the original poster's 1920 x 1080 space.

This is an offline artistic mask, not measured scene geometry or telemetry.
The poster itself is unchanged. Ring, planet, moon and foreground shapes were
registered by inspecting the source artwork; smooth falloffs avoid edge tears.
"""
from math import exp, hypot
from pathlib import Path
from PIL import Image

out = Path("public/v42")
out.mkdir(parents=True, exist_ok=True)
image = Image.new("L", (960, 540))
pixels = image.load()
def smooth(edge, softness):
    return 1 / (1 + exp(max(-60, min(60, edge / softness))))
for y in range(540):
    for x in range(960):
        px, py = x * 2, y * 2
        planet = smooth(hypot(px - 1360, py - 664) - 485, 28)
        ring_radius = hypot((px - 1600) / 0.97, (py - 438) / 1.04)
        ring = exp(-((ring_radius - 527) / 29) ** 2)
        foreground = smooth(820 - py, 17) * smooth(1135 - px, 24)
        moon = exp(-((hypot(px - 1297, py - 392)) / 14) ** 4)
        depth = max(.06 + .26 * planet, .72 * ring, .9 * foreground, .42 * moon)
        pixels[x, y] = round(255 * depth)
image.save(out / "observatory-depth.webp", lossless=True, method=6)
print(out / "observatory-depth.webp")
