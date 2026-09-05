import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { OdysseyApp } from "./app";
import "./odyssey.css";
import "./orbit-instrument.css";
import "./mission-control.css";
import "./event-horizon.css";
import "./aurora-theme.css";
import "./aurora-motion.css";
import "./final-polish.css";
import "./system-atlas.css";
import "./sovereign-world.css";
import "./starship-theme.css";
import "./brand-mark.css";
import "./lab-visuals.css";
import "./operator-insignia.css";

const root = document.getElementById("odyssey-root")!;
const app = (
  <StrictMode>
    <OdysseyApp />
  </StrictMode>
);
if (root.hasAttribute("data-prerendered")) hydrateRoot(root, app);
else createRoot(root).render(app);
