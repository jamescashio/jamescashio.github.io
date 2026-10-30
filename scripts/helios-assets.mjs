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
  function versionAsset(filename) {
    if (!assets.has(filename)) {
      const bytes = readFileSync(path.join(root, filename));
      const sha256 = createHash("sha256").update(bytes).digest("hex");
      const ext = path.extname(filename);
      const edition = filename.startsWith("v40/") ? "v40" : "v38";
      const versioned = `${edition}/immutable/${path.basename(filename, ext)}-${sha256.slice(0, 16)}${ext}`;
      assets.set(filename, { versioned, sha256, bytes });
    }
    return "/" + assets.get(filename).versioned;
  }
  return {
    renderBuiltUrl(filename, { type }) {
      if (
        type !== "public" ||
        !/^(?:v38\/(assets|fonts)\/[\w-]+\.(webp|jpg|woff2)|v40\/assets\/[\w-]+\.woff2)$/.test(filename)
      )
        return;
      return versionAsset(filename);
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
      transform(code, id) {
        if (!/src[\\/]helios[\\/]rooms[\\/].*\.html\?raw$/.test(id)) return;
        return {
          code: code.replace(/\/v38\/(assets|fonts)\/[\w-]+\.(webp|jpg|woff2)/g, (source) =>
            versionAsset(source.slice(1)),
          ),
          map: null,
        };
      },
      async writeBundle() {
        const manifests = { v38: {}, v40: {} };
        for (const [source, { versioned, sha256, bytes }] of assets) {
          await mkdir(path.dirname(path.join(output, versioned)), { recursive: true });
          await writeFile(path.join(output, versioned), bytes);
          manifests[versioned.split("/")[0]]["/" + source] = { url: "/" + versioned, sha256, bytes: bytes.length };
        }
        for (const [edition, manifest] of Object.entries(manifests)) {
          await mkdir(path.join(output, edition), { recursive: true });
          await writeFile(path.join(output, edition, "asset-versions.json"), JSON.stringify(manifest, null, 2) + "\n");
        }
      },
    },
  };
}
