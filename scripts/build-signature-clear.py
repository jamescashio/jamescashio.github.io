"""Derive the clear signature: the approved artwork with its painted black ground turned to transparency.

The approved signature (public/brand/platinum/signature.png) is painted on near black. On a page that is
not black, that ground shows as a box. This script removes only the ground: every pixel keeps the light
the artwork gave it, and the darkness between becomes see through, so the letters, the orbits and their
glow sit on whatever is behind them. The letters themselves stay solid. Laid over black, the result is the approved artwork again.

No pixel is repainted, recolored or generated. Run: python scripts/build-signature-clear.py
"""

from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

DIRECTORY = Path("public/brand/platinum")
SOURCE = DIRECTORY / "signature.png"
WIDTHS = (420, 840)
# Light at or under this level above the ground is ground; at or over the upper level it is solid artwork.
GROUND = 0.03
SOLID = 0.34
# Dark detail narrower than this many source pixels inside a letter stays part of the letter.
BODY = 9


def separate(image: Image.Image) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """The artwork, the light it adds to its ground, and how solid each pixel is."""
    art = np.asarray(image.convert("RGB"), dtype=np.float64) / 255.0
    # The ground's own color, read from the four corners where nothing is drawn.
    corner = max(8, image.width // 40)
    corners = np.concatenate(
        [
            art[:corner, :corner].reshape(-1, 3),
            art[:corner, -corner:].reshape(-1, 3),
            art[-corner:, :corner].reshape(-1, 3),
            art[-corner:, -corner:].reshape(-1, 3),
        ]
    )
    light = np.clip(art - np.median(corners, axis=0), 0.0, 1.0)
    level = light.max(axis=2)
    alpha = np.clip((level - GROUND) / (SOLID - GROUND), 0.0, 1.0)
    # A smooth shoulder, so faint glow fades out instead of ending on a line.
    alpha = alpha * alpha * (3.0 - 2.0 * alpha)
    # The letters are solid objects: the dark lines engraved in them are artwork, not ground.
    y, x = np.ogrid[-BODY : BODY + 1, -BODY : BODY + 1]
    body = ndimage.binary_closing(alpha > 0.85, structure=(x * x + y * y) <= BODY * BODY)
    alpha = np.maximum(alpha, ndimage.gaussian_filter(body.astype(np.float64), 1.2))
    return art, light, alpha


def scaled(values: np.ndarray, size: tuple[int, int]) -> np.ndarray:
    """Resize a float image channel by channel, so no precision is lost between steps."""
    planes = values if values.ndim == 3 else values[..., None]
    out = [
        np.asarray(Image.fromarray(planes[..., i].astype(np.float32), "F").resize(size, Image.LANCZOS))
        for i in range(planes.shape[2])
    ]
    return np.clip(np.dstack(out) if values.ndim == 3 else out[0], 0.0, 1.0)


def clear(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    art, light, alpha = separate(image)
    # Light is resized as light (it is already weighted by how much of it there is), so edges gather no fringe.
    art, glow, alpha = scaled(art, size), scaled(light, size), scaled(alpha, size)
    # Where the artwork is solid it keeps its exact color; where it is glow, the color is the light itself.
    safe = np.maximum(alpha, 1e-3)[..., None]
    color = np.where(alpha[..., None] >= 0.995, art, np.clip(glow / safe, 0.0, 1.0))
    color = np.where(alpha[..., None] <= 0.004, 0.0, color)
    rgba = np.dstack([color, alpha])
    return Image.fromarray(np.round(rgba * 255.0).astype(np.uint8), "RGBA")


def main() -> None:
    source = Image.open(SOURCE)
    for width in WIDTHS:
        height = round(width * source.height / source.width)
        target = DIRECTORY / f"signature-clear-{width}.webp"
        clear(source, (width, height)).save(target, "WEBP", quality=80, alpha_quality=75, method=6)
        print(f"{target} {width}x{height} {target.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
