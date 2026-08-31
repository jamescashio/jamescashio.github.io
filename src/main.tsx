import { createRoot, hydrateRoot } from "react-dom/client";
import { CashioApp } from "@/app";
import "./styles.css";

const root = document.getElementById("root");

if (!root) throw new Error("Cashio app root is missing");

if (root.dataset.prerendered === "v35") {
  hydrateRoot(root, <CashioApp />);
} else if (!root.hasChildNodes()) {
  createRoot(root).render(<CashioApp />);
} else {
  throw new Error("Cashio app root is neither prerendered nor empty");
}
