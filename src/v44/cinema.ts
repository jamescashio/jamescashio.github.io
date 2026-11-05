/** The screening room: one screen, a reel of films, nothing plays until the visitor asks. */
type Film = {
  title: string;
  label: string;
  meta: string;
  poster: string;
  sources: { src: string; minWidth: number }[];
  captions?: string;
};

const FILMS: Record<string, Film> = {
  trailer: {
    title: "House Cashio: The Trailer",
    label: "Play the trailer",
    meta: "61 seconds · Starts muted · Captions on",
    poster: "/assets/hero/cashio-trailer-poster.webp",
    sources: [
      { src: "/assets/hero/cashio-trailer-1080p.mp4", minWidth: 1100 },
      { src: "/assets/hero/cashio-trailer-720p.mp4", minWidth: 0 },
    ],
    captions: "/assets/hero/cashio-trailer-text.vtt",
  },
  portal: {
    title: "Portal Arrival",
    label: "Play Portal Arrival",
    meta: "5 seconds · Silent short",
    poster: "/assets/zenith/portal-arrival-poster.webp",
    sources: [{ src: "/assets/zenith/portal-arrival.mp4", minWidth: 0 }],
  },
  flyby: {
    title: "Starship Flyby",
    label: "Play Starship Flyby",
    meta: "5 seconds · Silent short",
    poster: "/assets/zenith/starship-flyby-poster.webp",
    sources: [{ src: "/assets/zenith/starship-flyby.mp4", minWidth: 0 }],
  },
  longview: {
    title: "The Long View",
    label: "Play The Long View",
    meta: "5 seconds · Silent short",
    poster: "/assets/zenith/the-long-view-poster.webp",
    sources: [{ src: "/assets/zenith/the-long-view.mp4", minWidth: 0 }],
  },
};

export function mountCinema(screen: HTMLElement, onPlaying: (playing: boolean) => void) {
  const video = screen.querySelector<HTMLVideoElement>("[data-screen-video]")!;
  const poster = screen.querySelector<HTMLImageElement>("[data-screen-poster]")!;
  const play = screen.querySelector<HTMLButtonElement>("[data-screen-play]")!;
  const label = screen.querySelector<HTMLElement>("[data-screen-label]")!;
  const meta = screen.querySelector<HTMLElement>("[data-screen-meta]")!;
  const title = screen.querySelector<HTMLElement>("[data-screen-title]")!;
  const reel = [...document.querySelectorAll<HTMLButtonElement>("[data-film]")];
  let film = "trailer";

  const stop = () => {
    video.pause();
    video.removeAttribute("src");
    video.replaceChildren();
    video.load();
    video.hidden = true;
    delete screen.dataset.playing;
    onPlaying(false);
  };
  const select = (id: string) => {
    const f = FILMS[id];
    if (!f) return;
    stop();
    film = id;
    poster.removeAttribute("srcset");
    poster.removeAttribute("sizes");
    poster.src = f.poster;
    poster.alt = `${f.title} poster`;
    label.textContent = f.label;
    meta.textContent = f.meta;
    title.textContent = f.title;
    reel.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.film === id)));
  };
  const start = () => {
    const f = FILMS[film];
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    const source = f.sources.find((s) => !saveData && innerWidth >= s.minWidth) || f.sources[f.sources.length - 1];
    video.replaceChildren();
    if (f.captions) {
      const track = document.createElement("track");
      track.kind = "captions";
      track.label = "English";
      track.srclang = "en";
      track.src = f.captions;
      track.default = true;
      video.appendChild(track);
    }
    video.src = source.src;
    video.poster = f.poster;
    video.muted = true;
    video.hidden = false;
    screen.dataset.playing = "";
    onPlaying(true);
    video.play().catch(() => {
      /* The visitor can still press play on the native controls. */
    });
    video.focus();
  };
  play.addEventListener("click", start);
  video.addEventListener("ended", () => {
    stop();
    play.focus();
  });
  reel.forEach((b) =>
    b.addEventListener("click", () => {
      select(b.dataset.film || "trailer");
      start();
    }),
  );
}
