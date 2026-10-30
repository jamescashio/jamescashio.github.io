import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

// The two publication paths hash the exact same authored inline script bytes.
export function secureStormHtml(source) {
  const html = source.replace(/\r\n?/g, "\n").replace(/\s*<meta\b(?=[^>]*\bdata-cashio-storm-csp\b)[^>]*>/gi, "");
  const hashes = [...html.matchAll(/<script\b(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi)].map(
    (match) => "'sha256-" + createHash("sha256").update(match[1]).digest("base64") + "'",
  );
  if (!hashes.length || !/<meta\b[^>]*\bcharset\s*=/i.test(html)) throw new Error("Storm script or charset is missing");
  const policy = [
    "default-src 'self'",
    "script-src 'self' " + hashes.join(" ") + " https://cdnjs.cloudflare.com https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://api.weather.gov https://*.weather.noaa.gov https://*.arcgis.com https://*.arcgisonline.com https://*.nationalmap.gov https://hazards.fema.gov",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-src 'none'",
  ].join("; ");
  return html.replace(
    /(<meta\b[^>]*\bcharset\s*=[^>]*>)/i,
    '$1\n<meta data-cashio-storm-csp http-equiv="Content-Security-Policy" content="' + policy + '">',
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [input = "dist/storm/index.html", output = input] = process.argv.slice(2);
  const secured = secureStormHtml(await readFile(input, "utf8"));
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, secured);
  console.log("Storm page secured with exact script hashes and fixed provider destinations.");
}
