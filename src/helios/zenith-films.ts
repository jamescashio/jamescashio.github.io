import type { FilmCollection, FilmDefinition } from "../odyssey/film-catalog";

function film(title: string, slug: string, description: string, loopable = true): FilmDefinition {
  return {
    title,
    duration: 5,
    durationLabel: "A FIVE-SECOND FILM",
    film: `/assets/zenith/${slug}.mp4`,
    poster: `/assets/zenith/${slug}-poster.webp`,
    description,
    eyebrow: "ZENITH",
    loopable,
  };
}

export const ZENITH_COLLECTIONS: FilmCollection[] = [
  {
    label: "Zenith · The workshop",
    clips: {
      "zenith-starship-blue-hour": film(
        "Starship Blue Hour",
        "starship-blue-hour",
        "A quiet ship above a lamplit workshop. The evening is just getting started.",
      ),
      "zenith-starship-dockside": film(
        "Starship Dockside",
        "starship-dockside",
        "Home for the evening. Warm windows, a waiting ship, and nowhere urgent to be.",
      ),
      "zenith-starship-flyby": film(
        "Starship Flyby",
        "starship-flyby",
        "A slow departure over the workshop, into the deep blue evening.",
      ),
      "zenith-workshop-after-hours": film(
        "Workshop After Hours",
        "workshop-after-hours",
        "The lamp stays on a little longer. There is always one more idea.",
      ),
      "zenith-lamplight-prototype": film(
        "Lamplight Prototype",
        "lamplight-prototype",
        "A small brass mechanism catches the last light on a wooden workbench.",
      ),
      "zenith-quiet-intelligence": film(
        "Quiet Intelligence",
        "quiet-intelligence",
        "Brass, graphite and a trace of cyan. A close look at an imagined machine.",
      ),
    },
  },
  {
    label: "Zenith · Gold in orbit",
    clips: {
      "zenith-armillary-nocturne": film(
        "Armillary Nocturne",
        "armillary-nocturne",
        "Brass rings turn against the dark. A small universe, keeping its own time.",
      ),
      "zenith-orbital-instrument": film(
        "Orbital Instrument",
        "orbital-instrument",
        "An armillary sphere traces its quiet orbit through a drift of gold.",
      ),
      "zenith-armillary-detail": film(
        "Armillary Detail",
        "armillary-detail",
        "Up close with the instrument: engraved brass, crossing rings and moving light.",
      ),
      "zenith-orbital-dust": film(
        "Orbital Dust",
        "orbital-dust",
        "A fine gold orbit gathers dust and light at the edge of the dark.",
      ),
      "zenith-celestial-signature": film(
        "Celestial Signature",
        "celestial-signature",
        "The cAshIo signature holds steady while a thin orbit and gold motes drift around it.",
      ),
    },
  },
  {
    label: "Zenith · Beyond the doorway",
    clips: {
      "zenith-threshold": film(
        "Threshold",
        "threshold",
        "Through a gold portal, toward the rings of a distant world.",
        false,
      ),
      "zenith-portal-arrival": film(
        "Portal Arrival",
        "portal-arrival",
        "A doorway in space. A ringed planet on the other side.",
        false,
      ),
      "zenith-ringed-horizon": film(
        "Ringed Horizon",
        "ringed-horizon",
        "An unhurried view across the rings of an imagined planet.",
      ),
      "zenith-the-long-view": film(
        "The Long View",
        "the-long-view",
        "From a dark observatory, a telescope looks out toward a blue world.",
      ),
    },
  },
];
