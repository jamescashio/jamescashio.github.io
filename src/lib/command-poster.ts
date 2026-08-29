export const COMMAND_POSTER_SOURCES = [
  {
    type: "image/avif",
    srcSet: "/plates/command-mobile.avif 768w, /plates/command-desktop.avif 1440w",
    sizes: "100vw",
  },
  {
    type: "image/webp",
    srcSet: "/plates/command-mobile.webp 768w, /plates/command-desktop.webp 1440w",
    sizes: "100vw",
  },
] as const;
