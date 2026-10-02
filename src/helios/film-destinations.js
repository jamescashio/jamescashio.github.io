import { CLIPS } from "../odyssey/film-catalog";
import { ZENITH_COLLECTIONS } from "./zenith-films";

/** Search reads the authored catalog; it never loads a video or its player. */
export const FILM_DESTINATIONS = [{ label: "The original films", clips: CLIPS }, ...ZENITH_COLLECTIONS].flatMap(
  (collection) =>
    Object.entries(collection.clips).map(([id, clip]) => [
      clip.title,
      `${clip.description} ${clip.duration} seconds, sound off.`,
      `#film=${id}`,
      `${collection.label} film video cinema`,
    ]),
);
