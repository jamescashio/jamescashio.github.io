export type LensingClip = "intro" | "sanctuary" | "lightwake" | "signature" | "awakening" | "arrival";
export type FilmDefinition = {
  title: string;
  duration: number;
  durationLabel: string;
  film: string;
  poster: string;
  description: string;
  eyebrow?: string;
  loopable?: boolean;
};
export type FilmCollection = { label: string; clips: Record<string, FilmDefinition> };
export const CLIPS = {
  intro: {
    title: "The portal intro",
    duration: 6,
    durationLabel: "A SIX-SECOND FILM",
    film: "/assets/celestial/helios-arrival.mp4",
    poster: "/assets/celestial/helios-arrival-poster.jpg",
    description: "Fly through the portal. A ringed planet fills the view. The original arrival, whenever you choose.",
  },
  sanctuary: {
    title: "The inner light",
    duration: 15,
    durationLabel: "A FIFTEEN-SECOND FILM",
    film: "/assets/sanctuary/inner-light.mp4",
    poster: "/assets/sanctuary/inner-light-poster.webp",
    description: "Cross the threshold. Follow the awakening. Discover the light at the heart of an imagined sanctuary.",
  },
  lightwake: {
    title: "Lightwake",
    duration: 8,
    durationLabel: "AN EIGHT-SECOND FILM",
    film: "/assets/lightwake/lightwake-awakens.mp4",
    poster: "/assets/lightwake/lightwake-poster.webp",
    description: "A signal travels. An atmosphere answers. A world wakes in light.",
  },
  signature: {
    title: "The signature awakens",
    duration: 6,
    durationLabel: "A SIX-SECOND FILM",
    film: "/assets/celestial/signature-awakens.mp4",
    poster: "/assets/celestial/signature-awakens-poster.webp",
    description: "Gold takes form. Blue light finds its orbit. A signature comes alive.",
  },
  awakening: {
    title: "The gate awakens",
    duration: 6,
    durationLabel: "A SIX-SECOND FILM",
    film: "/assets/lensing/gate-awakens.mp4",
    poster: "/assets/lensing/gate-awakens-poster.webp",
    description: "An imagined orbital gate gathers light above a distant planet.",
  },
  arrival: {
    title: "Orbital arrival",
    duration: 5,
    durationLabel: "A FIVE-SECOND FILM",
    film: "/assets/lensing/orbital-arrival.mp4",
    poster: "/assets/lensing/orbital-arrival-poster.webp",
    description: "An imagined orbital gate, a distant planet, a quiet approach.",
  },
} as const;

/** Prefer the three featured moments; other films continue within their collection. */
export function nextFilm(id: string, collections: FilmCollection[]) {
  const featured = ["zenith-starship-blue-hour", "zenith-armillary-nocturne", "zenith-threshold"];
  const available = collections.flatMap((collection) => Object.keys(collection.clips));
  const trail = featured.filter((key) => available.includes(key));
  const keys =
    trail.includes(id) && trail.length > 1
      ? trail
      : Object.keys(collections.find((collection) => Object.hasOwn(collection.clips, id))?.clips || {});
  const index = keys.indexOf(id);
  return index < 0 || keys.length < 2 ? null : keys[(index + 1) % keys.length];
}
