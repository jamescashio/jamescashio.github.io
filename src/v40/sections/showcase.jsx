import React from "react";
const h = React.createElement;

const projects = [
  {
    id: "sovereign",
    href: "#ai-worm",
    title: "The Sovereign",
    medium: "01 / Short film",
    image: "/v40/thumbs/sovereign-v9-poster-640.webp",
    description: "A science fiction parody about AI, cosmic bureaucracy, and the weekend it promised to save.",
    action: "Meet The Sovereign",
  },
  {
    id: "roadster",
    href: "#roadster-studio",
    title: "Roadster Studio",
    medium: "02 / Interactive design study",
    image: "/images/roadster-studio-640.webp",
    description: "An independent automotive CAD concept. Explore the form, change the view, compose a photograph.",
    action: "Explore the Roadster",
  },
  {
    id: "house",
    href: "#eagle-film",
    title: "House Cashio",
    medium: "03 / Trailer parody",
    image: "/assets/hero/cashio-trailer-poster.webp",
    description: "The lab becomes a movie. A subscription villain, an unlikely crew, and a cat who was not consulted.",
    action: "Meet the crew",
  },
];

export function ShowcaseSection() {
  return h(
    "section",
    { id: "showcase", className: "observatory-showcase", "aria-labelledby": "showcase-title" },
    h(
      "div",
      { className: "showcase-heading" },
      h(
        "div",
        null,
        h("p", { className: "showcase-kicker" }, "Selected work / From the studio"),
        h("h2", { id: "showcase-title" }, "Imagination, made tangible."),
      ),
      h(
        "p",
        null,
        "A film. A design study. A world with a story. Built to be explored, with a human behind every choice.",
      ),
    ),
    h(
      "div",
      { className: "showcase-grid" },
      projects.map((project) =>
        h(
          "a",
          {
            key: project.id,
            href: project.href,
            className: "showcase-project",
          },
          h(
            "div",
            { className: "showcase-plate" },
            h("img", {
              src: project.image,
              width: 640,
              height: 360,
              loading: "lazy",
              decoding: "async",
              alt: "",
            }),
            h("span", { className: "showcase-crosshair", "aria-hidden": "true" }, "+"),
          ),
          h(
            "div",
            { className: "showcase-copy" },
            h("p", { className: "showcase-medium" }, project.medium),
            h("h3", { id: `showcase-${project.id}-title` }, project.title),
            h("p", { className: "showcase-description" }, project.description),
            h(
              "span",
              { className: "showcase-action", id: `showcase-${project.id}-action` },
              project.action,
              " ",
              h("span", { "aria-hidden": "true" }, "↗"),
            ),
          ),
        ),
      ),
    ),
  );
}
