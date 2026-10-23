import React from "react";
import { createRoot } from "react-dom/client";
import { V40Page } from "./page.jsx";
import "./design.css";
import "./polish.css";
import "./labs.css";
import "./bit.css";
import "./ai-worm.css";
import "./hero-reel.css";
import "./polish.js";
import "./labs.js";
import "./bit.js";
import { setupV40Navigation } from "./navigation.js";
import "./navigation.css";
setupV40Navigation();
createRoot(document.getElementById("v40-root")).render(
  React.createElement(V40Page, { heroFilm: "Orbital arrival", scanlines: true, starDensity: 220, techDetail: false }),
);
