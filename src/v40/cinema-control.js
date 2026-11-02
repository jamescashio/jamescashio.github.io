import { reelPoster } from "./hero-reel.tsx";


export function filmById(slug) {
  if (slug === "trailer") {
    const small = this.viewportWidth <= 720 || (typeof navigator !== "undefined" && navigator.connection?.saveData);
    return {
      slug,
      title: "House Cashio: The Trailer",
      desc: "A trailer parody · 61 seconds · Unmute for the score",
      coll: "House Cashio",
      src: "/assets/hero/cashio-trailer-" + (small ? "720p" : "1080p") + ".mp4",
      poster: "/assets/hero/cashio-trailer-poster.webp",
      captions: "/assets/hero/cashio-trailer-text.vtt",
      text: "A cold open: in a world where the machines can think. A star rush toward a ringed planet at a classified location. It is a house. He built a lab. At home. The garage was busy. The fleet is counted: two hosts, nineteen containers, one virtual machine, and the scheduled jobs, whose counts are blacked out and withheld. A record scratch freezes the frame: the scheduled jobs are on a break, and the counts stay withheld until they get back. In the dark, a subscription monolith rises with scrolling prices. Renewal in three days. The cancel button is not found. Only one crew could stand against it. Meet the machines: Zeus and Apollo, Hermes, Atlas, DSH, E.V.E. and Bit. Uptime. Backups. Snapshots. One very tired admin. A heighliner folds space to keep the lights on. House Cashio, rated MH, mostly harmless, while a cat on the planet's edge turns to the camera. The cat was not consulted. No clouds were harmed in the making of this film. One was slightly inconvenienced.",
      noloop: true,
    };
  }
  if (slug === "intro")
    return {
      slug,
      title: "Eagle",
      desc: "The workshop in orbit · 36 seconds · Sound effects available",
      coll: "cAshIo",
      src: "",
      poster: reelPoster,
    };
  const f = this.films.find((x) => x[1] === slug) || this.films[2];
  return {
    slug: f[1],
    title: f[2],
    desc: f[3],
    coll: "Zenith · " + this.collections[f[0]],
    src: `/assets/zenith/${f[1]}.mp4`,
    poster: this.res(`public/assets/zenith/${f[1]}-poster.webp`),
    noloop: !!f[4],
  };
}

export function stepCinema(d) {
  const list = ["intro", "trailer", ...this.films.map((f) => f[1])];
  const i = list.indexOf(this.state.cinema);
  this.setState({ cinema: list[(i + d + list.length) % list.length] });
}

export function closeCinema() {
  this.setState({ cinema: null });
  window.dispatchEvent(new Event("cashio-cinema-close"));
}
