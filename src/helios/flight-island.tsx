import { createRoot } from "react-dom/client";
import FlightBridge from "./flight-bridge";
import "./island-fonts.css";
import "./flight.css";
import "./cinematic-flight.css";
import "./flight-entrance.css";

export function openFlight({
  motion,
  step,
  onClose,
  arrive = false,
  startTour = false,
  showcase = false,
}: {
  motion: boolean;
  step: string;
  onClose: (destination?: string) => void;
  arrive?: boolean;
  startTour?: boolean;
  showcase?: boolean;
}) {
  const host = document.createElement("div");
  host.id = "helios-flight";
  if (arrive) host.classList.add("flight-arrive");
  document.documentElement.classList.add("flight-open");
  document.body.append(host);
  window.dispatchEvent(new Event("helios-overlay"));
  const root = createRoot(host);
  root.render(<FlightBridge motion={motion} step={step} startTour={startTour} showcase={showcase} onClose={onClose} />);
  return {
    dispose() {
      root.unmount();
      host.remove();
      document.documentElement.classList.remove("flight-open");
      window.dispatchEvent(new Event("helios-overlay"));
    },
  };
}
