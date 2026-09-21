import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Version only immutable artwork and fonts. Dated evidence and release JSON retain their URLs.
// Vite renders these URLs before it hashes the CSS/JS that refers to them.
export function heliosAssetDelivery() {
  const assets = new Map();
  let root;
  let output;
  return {
    renderBuiltUrl(filename, { type }) {
      if (type !== "public" || !/^v38\/(assets|fonts)\/[\w-]+\.(webp|jpg|woff2)$/.test(filename)) return;
      if (!assets.has(filename)) {
        const bytes = readFileSync(path.join(root, filename));
        const sha256 = createHash("sha256").update(bytes).digest("hex");
        const ext = path.extname(filename);
        const versioned = `v38/immutable/${path.basename(filename, ext)}-${sha256.slice(0, 16)}${ext}`;
        assets.set(filename, { versioned, sha256, bytes });
      }
      return "/" + assets.get(filename).versioned;
    },
    plugin: {
      name: "helios-asset-versions",
      apply: "build",
      configResolved(config) {
        root = config.publicDir;
        output = path.resolve(config.root, config.build.outDir);
      },
      buildStart() {
        assets.clear();
      },
      async writeBundle() {
        await mkdir(path.join(output, "v38/immutable"), { recursive: true });
        const manifest = {};
        for (const [source, { versioned, sha256, bytes }] of assets) {
          await writeFile(path.join(output, versioned), bytes);
          manifest["/" + source] = { url: "/" + versioned, sha256, bytes: bytes.length };
        }
        await writeFile(path.join(output, "v38/asset-versions.json"), JSON.stringify(manifest, null, 2) + "\n");
      },
    },
  };
}
