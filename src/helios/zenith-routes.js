// Keep the route allowlist small; the film catalogue only loads when a studio opens.
export const ZENITH_FILM_IDS = [
  "celestial-signature",
  "starship-flyby",
  "orbital-instrument",
  "starship-blue-hour",
  "armillary-nocturne",
  "portal-arrival",
  "ringed-horizon",
  "workshop-after-hours",
  "quiet-intelligence",
  "threshold",
  "the-long-view",
  "starship-dockside",
  "armillary-detail",
  "lamplight-prototype",
  "orbital-dust",
];

export const isZenithFilm = (hash) => ZENITH_FILM_IDS.some((id) => hash === `#film=zenith-${id}`);
