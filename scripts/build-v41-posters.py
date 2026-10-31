"""Build smaller, content-addressed derivatives without changing the source artwork."""
from pathlib import Path
from hashlib import sha256
import io
import json
from PIL import Image

root = Path(__file__).resolve().parents[1]
public = root / "public"
destination = public / "v40/posters"
destination.mkdir(exist_ok=True)
sources = (
    "assets/hero/cashio-trailer-poster.webp",
    "v40/assets/zenith-celestial-signature-poster.webp",
    "v40/assets/zenith-starship-flyby-poster.webp",
)
manifest = {}
for relative in sources:
    source = Image.open(public / relative).convert("RGB")
    variants = []
    for width in (320, 640, 960, 1280):
        width = min(width, source.width)
        height = round(source.height * width / source.width)
        resized = source.resize((width, height), Image.Resampling.LANCZOS)
        buffer = io.BytesIO()
        resized.save(buffer, "WEBP", quality=82, method=6)
        data = buffer.getvalue()
        digest = sha256(data).hexdigest()
        name = f"{Path(relative).stem}-{width}-{digest[:12]}.webp"
        (destination / name).write_bytes(data)
        variants.append({"url": "/v40/posters/" + name, "width": width, "height": height, "bytes": len(data), "sha256": digest})
    manifest["/" + relative] = variants
    print(f"{Path(relative).name}: {len(variants)} responsive sizes")
(public / "v40/poster-variants.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
