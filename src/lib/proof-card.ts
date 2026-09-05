import { ARTICLES } from "./content.ts";
import { BUILD_STORIES } from "./build-stories.ts";

export function safeArticleIndex(index: number) {
  return Number.isFinite(index) ? Math.max(0, Math.min(ARTICLES.length - 1, Math.trunc(index))) : 0;
}

export function publicBuildUrl(index: number) {
  return `https://cashio.us/#deck=builds&article=${safeArticleIndex(index) + 1}`;
}

function xml(value: string) {
  return value.replace(
    /[<>&"']/g,
    (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[character]!,
  );
}

function lines(value: string, limit: number) {
  const result: string[] = [];
  for (const word of value.split(" ")) {
    if (!result.length || `${result[result.length - 1]} ${word}`.length > limit) result.push(word);
    else result[result.length - 1] += ` ${word}`;
  }
  return result;
}

/** A portable, self-contained card using only the site's public build descriptions. */
export function createProofCardSvg(index: number) {
  const selected = safeArticleIndex(index);
  const article = ARTICLES[selected];
  const story = BUILD_STORIES[selected];
  const title = lines(article.name, 20);
  const titleText = title.map((line, i) => `<tspan x="64" y="${210 + i * 62}">${xml(line)}</tspan>`).join("");
  const outcomeText = lines(story.outcome, 46)
    .map((line, i) => `<tspan x="66" y="${title.length > 2 ? 405 + i * 33 : 364 + i * 33}">${xml(line)}</tspan>`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="title desc">
<title id="title">Cashio.us — ${xml(article.name)}</title><desc id="desc">${xml(story.outcome)} Owner-described build. ${xml(publicBuildUrl(selected))}</desc>
<defs><radialGradient id="glow"><stop stop-color="#00f9ff" stop-opacity=".16"/><stop offset="1" stop-color="#00f9ff" stop-opacity="0"/></radialGradient><linearGradient id="edge"><stop stop-color="#ff9500"/><stop offset="1" stop-color="#00f9ff"/></linearGradient></defs>
<rect width="1200" height="630" fill="#05080e"/><ellipse cx="1000" cy="280" rx="430" ry="340" fill="url(#glow)"/>
<path d="M64 99H1136M64 522H1136" stroke="#173441"/><path d="M64 100V62H156M1136 524V568H1044" fill="none" stroke="url(#edge)" stroke-width="5"/>
<g font-family="Arial, sans-serif"><text x="66" y="82" fill="#e8f6ff" font-size="25" font-weight="700" letter-spacing="5">CASHIO.US</text><text x="1136" y="79" text-anchor="end" fill="#00e8eb" font-size="13" letter-spacing="3">BLACK BOX RECEIPT / ${String(selected + 1).padStart(2, "0")} OF 07</text>
<text x="66" y="143" fill="#ffad36" font-size="14" letter-spacing="4">${xml(article.tag)} / DOUG CASHIO</text><text fill="#e8f6ff" font-size="52" font-weight="800" letter-spacing="1">${titleText}</text><text fill="#b3c5d3" font-size="25">${outcomeText}</text>
<g transform="translate(982 302)" fill="none"><circle r="145" stroke="#134653"/><circle r="109" stroke="#186779" stroke-dasharray="3 12"/><circle r="68" stroke="#1a6675"/><path d="M-170 0H170M0-170V170" stroke="#134653"/><path d="M0-66 59-25 39 51-38 51-61-22Z M0-66 0 16 59-25 M0 16 39 51 M0 16-38 51 M0 16-61-22" stroke="#00edf0" stroke-width="2"/><circle cx="109" r="7" fill="#ff9500" stroke="none"/><circle cx="-101" cy="-101" r="4" fill="#00edf0" stroke="none"/></g>
<text x="66" y="487" fill="#96acbe" font-size="13" letter-spacing="2">OWNER-DESCRIBED BUILD / EXPLORE THE INTERACTIVE DEMONSTRATION</text><text x="66" y="557" fill="#00edf0" font-size="19">cashio.us/#deck=builds&amp;article=${selected + 1}</text><text x="66" y="594" fill="#8aa0b4" font-size="13">FLEET EVIDENCE: 28 AUG 2026 · ROUTING INVENTORY: 21 AUG 2026 · DATED, NOT LIVE</text><text x="1136" y="594" text-anchor="end" fill="#ffad36" font-size="12" letter-spacing="1">HUMAN COMMAND RETAINED</text></g></svg>`;
}
