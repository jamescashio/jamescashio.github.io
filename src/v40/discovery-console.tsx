import { useEffect, useRef, useState } from "react";

import { discoveryRoutes } from "./discovery-routes";
import { DiscoveryProjection } from "./discovery-projection";

export function DiscoveryConsole({ routeId, onClose }: { routeId: string | null; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [chosen, choose] = useState("worlds");
  const [index, setIndex] = useState(0);
  const [copied, setCopied] = useState<"ready" | "copied" | "failed">("ready");
  const [projection, setProjection] = useState(true);
  const open = routeId !== null;
  const route = discoveryRoutes.find((r) => r.id === chosen) || discoveryRoutes[0];
  const stop = route.stops[index];
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (!open) {
      element.close();
      return;
    }
    const previous = document.activeElement;
    element.showModal();
    return () => {
      element.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true });
    };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    // The shared scene router captures film links before React's click handler.
    // Close on its navigation event as well as ordinary section-link clicks.
    window.addEventListener("hashchange", onClose);
    return () => window.removeEventListener("hashchange", onClose);
  }, [open, onClose]);
  useEffect(() => {
    if (routeId) {
      choose(routeId);
      setIndex(0);
      setCopied("ready");
    }
  }, [routeId]);
  function selectRoute(id: string) {
    choose(id);
    setIndex(0);
    setCopied("ready");
  }
  function step(direction: number) {
    setIndex((index + direction + route.stops.length) % route.stops.length);
  }
  async function copyRoute() {
    const text = [
      "cAshIo / " + route.title,
      ...route.stops.map((s, i) => i + 1 + ". " + s.title + "\n" + new URL(s.href, "https://cashio.us/").href),
    ].join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied("copied");
    } catch {
      setCopied("failed");
    }
  }
  return (
    <dialog
      ref={dialog}
      className="discovery-console"
      aria-labelledby="discovery-title"
      onCancel={onClose}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          event.stopPropagation();
          step(event.key === "ArrowRight" ? 1 : -1);
        }
      }}
    >
      <div className="discovery-topline">
        <span>
          <span aria-hidden="true">✦</span> cAshIo / Discovery console
        </span>
        <button type="button" onClick={onClose} aria-label="Close discovery console">
          Close <span aria-hidden="true">×</span>
        </button>
      </div>
      <div className="discovery-heading">
        <p className="continuum-label">Your curiosity is the flight plan.</p>
        <h2 id="discovery-title">{route.title}</h2>
        <p>{route.description}</p>
      </div>
      <div className="discovery-paths" role="group" aria-label="Discovery path">
        {discoveryRoutes.map((r) => (
          <button type="button" key={r.id} aria-pressed={chosen === r.id} onClick={() => selectRoute(r.id)}>
            {r.label}
            <span aria-hidden="true">↗</span>
          </button>
        ))}
      </div>
      <div className="discovery-view">
        <div className="discovery-visual">
          <div className="discovery-view-controls" role="group" aria-label="Destination view">
            <button type="button" aria-pressed={projection} onClick={() => setProjection(true)}>
              Hologram
            </button>
            <button type="button" aria-pressed={!projection} onClick={() => setProjection(false)}>
              Artwork
            </button>
          </div>
          {projection ? (
            <DiscoveryProjection stops={route.stops} index={index} onSelect={setIndex} />
          ) : (
            <div className="discovery-art">
              <img key={stop.image} src={stop.image} alt="" width="1280" height="720" loading="lazy" decoding="async" />
              <svg className="discovery-orbit" viewBox="0 0 600 400" fill="none" aria-hidden="true">
                <ellipse cx="300" cy="200" rx="250" ry="145" stroke="currentColor" strokeDasharray="2 9" />
                <ellipse cx="300" cy="200" rx="220" ry="115" stroke="currentColor" strokeOpacity=".35" />
                {[0, 1, 2, 3].map((i) => (
                  <circle
                    key={i}
                    cx={300 + Math.cos((i * Math.PI) / 2 - Math.PI / 4) * 250}
                    cy={200 + Math.sin((i * Math.PI) / 2 - Math.PI / 4) * 145}
                    r={i === index ? 7 : 3}
                    fill={i === index ? "#f5f5f7" : "#3578ff"}
                  />
                ))}
              </svg>
              <span className="discovery-art-caption">Original worlds / Human in command</span>
            </div>
          )}
        </div>
        <div className="discovery-description" aria-live="polite" aria-atomic="true">
          <p className="continuum-label">{stop.kind}</p>
          <h3>{stop.title}</h3>
          <p>{stop.text}</p>
          <a className="continuum-primary" href={stop.href} onClick={onClose}>
            {stop.action}
            <span aria-hidden="true">↗</span>
          </a>
          <p className="discovery-hint">Explore at your own pace. Nothing starts with sound.</p>
        </div>
      </div>
      <div className="discovery-stops" role="group" aria-label="Stops on this path">
        {route.stops.map((s, i) => (
          <button type="button" key={s.title} aria-pressed={index === i} onClick={() => setIndex(i)}>
            <span>0{i + 1}</span>
            {s.title}
          </button>
        ))}
      </div>
      <div className="discovery-footer">
        <button type="button" onClick={copyRoute} aria-live="polite">
          {copied === "copied" ? "Route copied" : copied === "failed" ? "Copy unavailable" : "Copy this route"}
        </button>
        <span>
          0{index + 1} / 0{route.stops.length}
        </span>
        <div>
          <button type="button" onClick={() => step(-1)} aria-label="Previous discovery">
            ←
          </button>
          <button type="button" onClick={() => step(1)} aria-label="Next discovery">
            →
          </button>
        </div>
      </div>
    </dialog>
  );
}
