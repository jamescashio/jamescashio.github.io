import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { V40Page } from "./page.tsx";
import "./polish.ts";
import "./labs.ts";
import "./bit.ts";
import { setupV40Navigation } from "./navigation.ts";
setupV40Navigation();
const container = document.getElementById("v40-root")!;
const prerendered = container.hasChildNodes();
export const startPage = () => {
  // Reuse the first painted composition instead of replacing its images and text.
  container.querySelectorAll('[aria-describedby="reading-notice"]').forEach((control) => {
    control.removeAttribute("disabled");
    control.removeAttribute("aria-describedby");
  });
  const page = React.createElement(V40Page, {
    scanlines: true,
    starDensity: 220,
    techDetail: false,
    initialWidth: prerendered ? 390 : undefined,
  });
  if (prerendered) hydrateRoot(container, page);
  else createRoot(container).render(page);
  // Instruments start once their styles are in, so the systems check never plays unstyled.
  import("./deferred.css")
    .then(() => {
      void import("./hud.ts");
      void import("./cinema-previews")
        .then(({ installCinemaPreviews }) => {
          const stop = installCinemaPreviews();
          if (window.cashioV40) window.cashioV40.stopCinemaPreviews = stop;
        })
        .catch(() => {});
      void import("./hero-enhancement").then(({ installLivingHero }) => installLivingHero());
      // V43 Starfall: the deep sky and flight instruments arrive last, after the page is interactive.
      void import("./starfall.css")
        .then(() => import("./starfall"))
        .then(({ installStarfall }) => {
          const stop = installStarfall();
          if (window.cashioV40) window.cashioV40.stopStarfall = stop;
        })
        .catch(() => {});
    })
    .catch(() => {});
};
