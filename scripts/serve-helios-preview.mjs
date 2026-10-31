import http from "node:http";
import path from "node:path";
import fs from "node:fs/promises";
import { gzipSync } from "node:zlib";

// Loopback only. This is an unpublished review surface, not a deployment service.
const root = path.resolve(process.argv[2] || "dist");
const port = Number(process.argv[3] || 4388);
const review = process.argv.includes("--review");
const reviewStyle =
  ".review-status{position:fixed;bottom:8px;left:50%;transform:translateX(-50%);z-index:1000;max-width:95vw;padding:6px 12px;border:1px solid #e9b65c66;border-radius:20px;background:#080f1bf2;color:#e9b65c;font:11px/1.4 system-ui;white-space:nowrap;pointer-events:none}@media(max-width:700px){.review-status{left:auto;right:2px;bottom:12px;transform:none;writing-mode:vertical-rl;font-size:9px;padding:4px 2px;border-radius:5px;max-width:18px}}";
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".woff2": "font/woff2",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".vtt": "text/vtt; charset=utf-8",
  ".ico": "image/x-icon",
};
const cache = new Map();
http
  .createServer(async (request, response) => {
    try {
      const url = new URL(request.url, "http://localhost");
      if (review && url.pathname === "/review-status.css") {
        response.writeHead(200, { "Content-Type": "text/css", "Cache-Control": "no-store" });
        response.end(request.method === "HEAD" ? undefined : reviewStyle);
        return;
      }
      const relative = decodeURIComponent(url.pathname).replace(/^\/+/, "");
      let target = path.resolve(root, relative);
      if (target !== root && !target.startsWith(root + path.sep)) {
        response.writeHead(403).end();
        return;
      }
      if ((await fs.stat(target)).isDirectory()) target = path.join(target, "index.html");
      const stat = await fs.stat(target);
      const type = mime[path.extname(target)] || "application/octet-stream";
      const compressed =
        /text\/|application\/json|image\/svg/.test(type) && request.headers["accept-encoding"]?.includes("gzip");
      const key = target + stat.mtimeMs + Boolean(compressed);
      let data = cache.get(key);
      if (!data) {
        data = await fs.readFile(target);
        if (review && path.extname(target) === ".html") {
          data = Buffer.from(
            data
              .toString("utf8")
              .replace('content="index, follow"', 'content="noindex, nofollow"')
              .replace("</head>", '<link rel="stylesheet" href="/review-status.css"></head>')
              .replace(
                /<body([^>]*)>/,
                `<body$1><aside class="review-status" aria-label="Preview status">PREVIEW · UNPUBLISHED</aside>`,
              ),
          );
        }
        if (compressed) data = gzipSync(data);
        cache.set(key, data);
      }
      const headers = {
        "Content-Type": type,
        "Content-Length": data.length,
        "X-Robots-Tag": "noindex, nofollow, noarchive",
        "Cache-Control": "no-cache",
        Vary: "Accept-Encoding",
        ...(compressed ? { "Content-Encoding": "gzip" } : {}),
      };
      if (!compressed && /^(video|audio)\//.test(type)) {
        headers["Accept-Ranges"] = "bytes";
        if (request.headers.range && ["GET", "HEAD"].includes(request.method)) {
          const match = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range.trim());
          let start = NaN;
          let end = NaN;
          if (match && (match[1] || match[2])) {
            if (match[1]) {
              start = Number(match[1]);
              end = match[2] ? Number(match[2]) : data.length - 1;
            } else {
              const suffix = Number(match[2]);
              if (Number.isSafeInteger(suffix) && suffix > 0) {
                start = Math.max(0, data.length - suffix);
                end = data.length - 1;
              }
            }
          }
          if (
            !Number.isSafeInteger(start) ||
            !Number.isSafeInteger(end) ||
            start < 0 ||
            start >= data.length ||
            end < start
          ) {
            response.writeHead(416, { ...headers, "Content-Length": 0, "Content-Range": `bytes */${data.length}` });
            response.end();
            return;
          }
          end = Math.min(end, data.length - 1);
          response.writeHead(206, {
            ...headers,
            "Content-Length": end - start + 1,
            "Content-Range": `bytes ${start}-${end}/${data.length}`,
          });
          response.end(request.method === "HEAD" ? undefined : data.subarray(start, end + 1));
          return;
        }
      }
      response.writeHead(200, headers);
      response.end(request.method === "HEAD" ? undefined : data);
    } catch {
      response.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
    }
  })
  .listen(port, "127.0.0.1", () => process.stdout.write(`Unpublished Helios preview: http://127.0.0.1:${port}/\n`));
