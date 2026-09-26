import { lazy, useEffect, useLayoutEffect, useState } from "react";
import { SceneBoundary } from "../odyssey/scene-boundary";
import { readObservatoryState } from "../odyssey/observatory-state";
import type { LensingClip } from "../odyssey/lensing-film";
import brandMarkStyles from "../odyssey/brand-mark.css?inline";
import { adoptStyles } from "./adopted-styles";

const Signature = lazy(() => import("../odyssey/brand-studio"));
const Observatory = lazy(() => import("../odyssey/lensing-observatory"));
const Cinema = lazy(() => import("../odyssey/lensing-film"));

export type StudioOptions = { motion: boolean; hash: string; onClose: () => void; onNavigate: (hash: string) => void };

export default function Studio({ motion, hash, onClose, onNavigate }: StudioOptions) {
  const [activeMotion, setMotion] = useState(motion);
  useLayoutEffect(() => adoptStyles(brandMarkStyles).remove, []);
  useEffect(() => {
    const update = (event: Event) => setMotion((event as CustomEvent<boolean>).detail);
    window.addEventListener("helios-motion", update);
    return () => window.removeEventListener("helios-motion", update);
  }, []);
  const kind = hash === "#signature" ? "signature" : hash.startsWith("#lensing") ? "observatory" : "cinema";
  return (
    <SceneBoundary
      key={hash}
      name={kind === "signature" ? "Celestial Forge" : kind === "observatory" ? "Lensing Observatory" : "Cinema"}
      onClose={onClose}
    >
      {kind === "signature" ? (
        <Signature
          motion={activeMotion}
          onClose={onClose}
          onWatch={() => onNavigate("#film=signature")}
          eyebrow="THE STUDIOS / LIGHT, UNDER YOUR COMMAND"
        />
      ) : kind === "observatory" ? (
        <Observatory
          motion={activeMotion}
          reduced={!activeMotion}
          sharedState={readObservatoryState(hash)}
          eyebrow="THE STUDIOS / LENSING"
          onClose={onClose}
        />
      ) : (
        <Cinema
          motion={activeMotion}
          initialClip={(hash.split("=")[1] || "lightwake") as LensingClip}
          onClose={onClose}
          onExplore={() => onNavigate("#lensing")}
          onSignature={() => onNavigate("#signature")}
          onWork={() => onNavigate("#work")}
        />
      )}
    </SceneBoundary>
  );
}
