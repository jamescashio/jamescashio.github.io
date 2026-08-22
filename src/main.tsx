import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CommandDeck } from "@/components/command-deck";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CommandDeck />
  </StrictMode>,
);
