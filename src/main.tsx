import "./styles.css";
import { createRoot, hydrateRoot } from "react-dom/client";
import { CashioApp } from "@/app";

const root = document.getElementById("root");

if (!root) throw new Error("Cashio app root is missing");
document.querySelector("style[data-critical-shell]")?.remove();
root.dataset.clientActivated = "true";

if (root.dataset.prerendered === "v35") {
  hydrateRoot(root, <CashioApp />);
} else if (!root.hasChildNodes()) {
  createRoot(root).render(<CashioApp />);
} else {
  throw new Error("Cashio app root is neither prerendered nor empty");
}
