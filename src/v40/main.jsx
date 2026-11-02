import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { V40Page } from "./page.jsx";
import "./chapters/opening.css";
import "./polish.js";
import "./labs.js";
import "./bit.js";
import { setupV40Navigation } from "./navigation.js";
setupV40Navigation();
const container = document.getElementById("v40-root");
const prerendered = container.hasChildNodes();
const startPage = () => {
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
  import("./deferred.css").then(() => import("./hud.js")).catch(() => {});
};
// Give the already readable opening a paint before preparing the interactive chapters.
if (prerendered) requestAnimationFrame(() => requestAnimationFrame(startPage));
else startPage();
