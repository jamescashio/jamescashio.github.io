import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { JSDOM } from "jsdom";

/** Render the dated build note from the same bytes enforced by the delivery gate. */
export function measureDelivery(html, css, source) {
  const previous = 18968;
  const current = gzipSync(css).byteLength;
  const budget = 19000;
  const values = {
    current: current.toLocaleString("en-US"),
    saved: ((1 - current / previous) * 100).toFixed(1) + "%",
    headroom: (budget - current).toLocaleString("en-US"),
  };
  const section = html.match(/<section\b[^>]*id="workshop"[\s\S]*?<\/section>/)?.[0];
  if (!section) throw new Error("The delivery build note must live in the workshop");
  const fragment = JSDOM.fragment(section);
  for (const element of fragment.querySelectorAll("[data-delivery]")) {
    const key = element.getAttribute("data-delivery");
    if (!(key in values)) throw new Error(`Unknown delivery field: ${key}`);
    element.textContent = values[key];
  }
  fragment.querySelector('[data-delivery-bar="current"]').setAttribute("width", String((current / budget) * 420));
  const receipt = {
    schemaVersion: 1,
    title: "A lighter front door",
    recordedDate: "2026-09-29",
    classification: "Build artifact measurement; not browser timing or field performance",
    compression: "Node.js gzipSync, default compression level",
    baseline: { edition: "V39.3", commit: "88bfcb83c1e0e9f15c1a67d5b7728d34ee835ea8", initialCssGzipBytes: previous },
    current: {
      stylesheet: source,
      sha256: createHash("sha256").update(css).digest("hex"),
      initialCssGzipBytes: current,
    },
    initialCssBudgetBytes: budget,
    headroomBytes: budget - current,
    reductionPercent: Number(((1 - current / previous) * 100).toFixed(1)),
    method:
      "Measure the built entry stylesheet. Load authored room styles when a room opens, and include those styles directly in the static reading editions.",
    limitation:
      "This measures compressed entry CSS only. It does not establish faster paint, total page weight, live system health or production field performance.",
  };
  return { html: html.replace(section, fragment.firstElementChild.outerHTML), receipt };
}
