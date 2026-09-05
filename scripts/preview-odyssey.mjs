import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { gzip } from "node:zlib";

const compress = promisify(gzip);
const root = path.resolve(fileURLToPath(new URL("../dist/", import.meta.url)));
const port = Number(process.env.ODYSSEY_PREVIEW_PORT || 4175);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".avif": "image/avif",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".wav": "audio/wav",
};
const server = http.createServer(async (request, response) => {
  try {
    if (!["GET", "HEAD"].includes(request.method || "")) {
      response.writeHead(405).end();
      return;
    }
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const file = path.resolve(root, "." + (pathname === "/" ? "/index.html" : pathname));
    if (!file.startsWith(root + path.sep)) {
      response.writeHead(403).end();
      return;
    }
    if (!(await stat(file)).isFile()) {
      response.writeHead(404).end();
      return;
    }
    const extension = path.extname(file);
    const bytes = await readFile(file);
    const useGzip =
      /\bgzip\b/.test(request.headers["accept-encoding"] || "") &&
      [".html", ".css", ".js", ".svg", ".json"].includes(extension);
    const body = useGzip ? await compress(bytes) : bytes;
    response.writeHead(200, {
      "Content-Type": types[extension] || "application/octet-stream",
      "Content-Length": body.length,
      "Cache-Control": /\/assets\/[^/]+-[\w-]+\.(js|css)$/.test(pathname)
        ? "public, max-age=31536000, immutable"
        : extension === ".html" || extension === ".json"
          ? "no-cache"
          : "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      Vary: "Accept-Encoding",
      ...(useGzip ? { "Content-Encoding": "gzip" } : {}),
    });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
  }
});
server.listen(port, "127.0.0.1", () => console.log(`Local Odyssey preview: http://127.0.0.1:${port}/odyssey.html`));
