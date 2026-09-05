import "./styles.css";
import "./experience-shell.css";
import "./experience.css";
import { createRoot, hydrateRoot } from "react-dom/client";
import { CashioApp } from "@/app";
import { clientReady } from "@/lib/client-ready";
export { clientReady } from "@/lib/client-ready";

const root = document.getElementById("root");

if (!root) throw new Error("Cashio app root is missing");

if (root.dataset.prerendered === "v35") {
  hydrateRoot(root, <CashioApp />);
} else if (!root.hasChildNodes()) {
  createRoot(root).render(<CashioApp />);
} else {
  throw new Error("Cashio app root is neither prerendered nor empty");
}

void clientReady.then(() => {
  document.querySelector("style[data-critical-shell]")?.remove();
  root.dataset.clientActivated = "true";
});
