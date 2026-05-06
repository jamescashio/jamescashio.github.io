#!/usr/bin/env bash
# ───────────────────────────────────────────────
# ZEUSAPOLLO Repo Stats Badge Generator
# Generates dynamic SVG badges for repo stats
# ───────────────────────────────────────────────

set -euo pipefail
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

COMMITS=$(git rev-list --count HEAD 2>/dev/null || echo "234")
DEPLOYS=203
CONTRIBUTORS=$(git log --format='%ae' | sort -u | wc -l 2>/dev/null || echo "3")
BRANCHES=$(git branch -r | wc -l 2>/dev/null || echo "10")
LAST_COMMIT=$(git log -1 --format='%ar' 2>/dev/null || echo "recently")
REPO="jamescashio.github.io"

OUTPUT_DIR="$(dirname "$0")/../badges"
mkdir -p "$OUTPUT_DIR"

render_badge() {
  local label="$1"
  local value="$2"
  local color="$3"
  local output="$4"
  
  cat > "$output" << BADGESVG
<svg xmlns="http://www.w3.org/2000/svg" width="180" height="24" viewBox="0 0 180 24">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a0f"/>
      <stop offset="100%" style="stop-color:#121220"/>
    </linearGradient>
    <filter id="g">
      <feGaussianBlur stdDeviation="1" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="180" height="24" rx="4" fill="url(#bg)" stroke="${color}" stroke-width="0.5"/>
  <!-- Label -->
  <text x="8" y="14" font-family="'Courier New',monospace" font-size="10" font-weight="700"
        fill="${color}" filter="url(#g)" letter-spacing="1">${label}</text>
  <!-- Separator -->
  <line x1="95" y1="4" x2="95" y2="20" stroke="${color}" stroke-width="0.3" opacity="0.3"/>
  <!-- Value -->
  <text x="184" y="15" font-family="'Courier New',monospace" font-size="14" font-weight="700"
        fill="${color}" text-anchor="end" filter="url(#g)">${value}</text>
</svg>
BADGESVG
  echo "  ✓ Generated: $output"
}

echo "◆ Generating ZEUSAPOLLO badges..."
echo ""

render_badge "COMMITS" "${COMMITS}" "#ff9500" "${OUTPUT_DIR}/commits.svg"
render_badge "DEPLOYS" "${DEPLOYS}" "#00f9ff" "${OUTPUT_DIR}/deploys.svg"
render_badge "CONTRIBUTORS" "${CONTRIBUTORS}" "#cc00ff" "${OUTPUT_DIR}/contributors.svg"
render_badge "BRANCHES" "${BRANCHES}" "#00ff9f" "${OUTPUT_DIR}/branches.svg"
render_badge "UPDATED" "${LAST_COMMIT}" "#ff9500" "${OUTPUT_DIR}/updated.svg"

echo ""
echo "✅ All badges generated in ${OUTPUT_DIR}/"
ls -la "$OUTPUT_DIR"/
