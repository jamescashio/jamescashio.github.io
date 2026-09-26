import { createRoot } from "react-dom/client";
import Studio, { type StudioOptions } from "./studio-bridge";
import "./island-fonts.css";
import "./studio.css";

/** The original studio components share V38's route, type, motion and return path. */
export function openStudio(options: StudioOptions) {
  const host = document.createElement("div");
  host.id = "helios-studio";
  document.body.append(host);
  const root = createRoot(host);
  document.documentElement.classList.add("studio-open");
  root.render(<Studio {...options} />);
  window.dispatchEvent(new Event("helios-overlay"));
  return {
    update(hash: string) {
      root.render(<Studio {...options} hash={hash} />);
    },
    dispose() {
      root.unmount();
      host.remove();
      document.documentElement.classList.remove("studio-open");
      window.dispatchEvent(new Event("helios-overlay"));
    },
  };
}
