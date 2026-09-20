import { createRoot } from "react-dom/client";
import FlightBridge from "./flight-bridge";
import "./flight.css";

export function openFlight({
  motion,
  step,
  onClose,
}: {
  motion: boolean;
  step: string;
  onClose: (destination?: string) => void;
}) {
  const host = document.createElement("div");
  host.id = "helios-flight";
  document.documentElement.classList.add("flight-open");
  document.body.append(host);
  window.dispatchEvent(new Event("helios-overlay"));
  const root = createRoot(host);
  root.render(<FlightBridge motion={motion} step={step} onClose={onClose} />);
  return {
    dispose() {
      root.unmount();
      host.remove();
      document.documentElement.classList.remove("flight-open");
      window.dispatchEvent(new Event("helios-overlay"));
    },
  };
}
