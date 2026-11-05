/**
 * The screening room: one screen, a short reel, nothing plays until the visitor asks.
 * Every film is described once, on its reel button, so the page and the player cannot disagree.
 */
type Film = {
  id: string;
  title: string;
  label: string;
  meta: string;
  poster: string;
  /** Candidate files by minimum viewport width; the first that fits plays. A playlist plays in order. */
  sources: { minWidth: number; playlist: string[] }[];
  captions?: string;
  frame?: string;
};

/** "1100 /a.mp4, 0 /b.mp4 /c.mp4" reads as: from 1100 px play a.mp4; below that, b.mp4 then c.mp4. */
function readFilm(button: HTMLButtonElement): Film {
  const d = button.dataset;
  const sources = (d.sources || "").split(",").map((entry) => {
    const [width, ...files] = entry.trim().split(/\s+/);
    return { minWidth: Number(width) || 0, playlist: files };
  });
  return {
    id: d.film || "",
    title: d.title || "",
    label: d.label || "Play",
    meta: d.meta || "",
    poster: d.poster || "",
    sources,
    captions: d.captions,
    frame: d.frame,
  };
}

export function mountCinema(screen: HTMLElement, onPlaying: (playing: boolean) => void) {
  const video = screen.querySelector<HTMLVideoElement>("[data-screen-video]")!;
  const poster = screen.querySelector<HTMLImageElement>("[data-screen-poster]")!;
  const play = screen.querySelector<HTMLButtonElement>("[data-screen-play]")!;
  const label = screen.querySelector<HTMLElement>("[data-screen-label]")!;
  const meta = screen.querySelector<HTMLElement>("[data-screen-meta]")!;
  const title = screen.querySelector<HTMLElement>("[data-screen-title]")!;
  const status = screen.querySelector<HTMLElement>("[data-screen-status]");
  // Only the trailer has spoken words; the silent shorts hide its transcript.
  const words = document.querySelector<HTMLDetailsElement>("[data-transcript]");
  const reel = [...document.querySelectorAll<HTMLButtonElement>("[data-film]")];
  const films = new Map(reel.map((b) => [b.dataset.film || "", readFilm(b)]));
  let film = films.get("trailer") || readFilm(reel[0]);
  let queue: string[] = [];
  const say = (text: string) => status && (status.textContent = text);

  // The sky follows what the video is actually doing, not what was asked of it.
  video.addEventListener("playing", () => onPlaying(true));
  video.addEventListener("pause", () => !video.ended && onPlaying(false));

  /** Back to the poster. Focus returns to Play only if it was on the film, and the page does not jump. */
  const stop = () => {
    const hadFocus = screen.contains(document.activeElement);
    queue = [];
    video.pause();
    video.removeAttribute("src");
    video.replaceChildren();
    video.load();
    video.hidden = true;
    delete screen.dataset.playing;
    onPlaying(false);
    if (hadFocus) play.focus({ preventScroll: true });
  };
  const select = (id: string) => {
    const f = films.get(id);
    if (!f) return;
    stop();
    film = f;
    say("");
    poster.removeAttribute("srcset");
    poster.removeAttribute("sizes");
    poster.src = f.poster;
    poster.alt = `${f.title} poster`;
    label.textContent = f.label;
    meta.textContent = f.meta;
    title.textContent = f.title;
    video.setAttribute("aria-label", f.title);
    if (f.frame) screen.dataset.frame = f.frame;
    else delete screen.dataset.frame;
    if (words) {
      words.hidden = !f.captions;
      if (!f.captions) words.open = false;
    }
    reel.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.film === id)));
  };
  const load = (src: string) => {
    video.src = src;
    video.play().catch((error: DOMException) => {
      // A blocked start leaves the native controls for the visitor; a broken file is handled by "error".
      if (error?.name === "NotAllowedError") say("Press play on the film to start it.");
    });
  };
  const start = () => {
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    const source =
      film.sources.find((s) => !saveData && innerWidth >= s.minWidth) || film.sources[film.sources.length - 1];
    say("");
    video.replaceChildren();
    if (film.captions) {
      const track = document.createElement("track");
      track.kind = "captions";
      track.label = "English";
      track.srclang = "en";
      track.src = film.captions;
      track.default = true;
      video.appendChild(track);
    }
    queue = source.playlist.slice(1);
    video.poster = film.poster;
    video.muted = true;
    video.hidden = false;
    screen.dataset.playing = "";
    document.dispatchEvent(new CustomEvent("v44:film", { detail: { id: film.id, title: film.title } }));
    load(source.playlist[0]);
    video.focus({ preventScroll: true });
  };
  video.addEventListener("error", () => {
    if (!screen.hasAttribute("data-playing")) return;
    stop();
    say("This film did not load. Try again, or watch it in the Studios.");
  });
  // A playlist runs its clips in order, then returns to the poster.
  video.addEventListener("ended", () => (queue.length ? load(queue.shift()!) : stop()));
  play.addEventListener("click", start);
  reel.forEach((b) =>
    b.addEventListener("click", () => {
      select(b.dataset.film || "trailer");
      start();
    }),
  );
}
