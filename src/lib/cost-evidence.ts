/** A historical published observation, never a current spend or savings claim. */
export const COST_EVIDENCE = {
  usdPerDay: 0.26,
  sampleStart: "2026-07-21",
  sampleEnd: "2026-07-22",
  sampleLabel: "21–22 July 2026",
  published: "2026-07-26",
  release: "V31 · The Iron Ascendant",
  source:
    "https://github.com/jamescashio/jamescashio.github.io/blob/fe68312aaac84ed57b9f122e26a8a14d87b6c542/status.json",
  scopeSource:
    "https://github.com/jamescashio/jamescashio.github.io/blob/fe68312aaac84ed57b9f122e26a8a14d87b6c542/index.html#L9529",
  releaseSource: "https://github.com/jamescashio/jamescashio.github.io/pull/77",
  includes: "AI provider usage in the dated sample",
  excludes: "Owned infrastructure, electricity, and Doug’s time",
} as const;
