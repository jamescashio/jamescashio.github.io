import { useEffect, useLayoutEffect, useState } from "react";
import FirstFlight from "../odyssey/first-flight";
import reviewStyles from "../odyssey/human-review-signal.css?inline";
import polishStyles from "../odyssey/visitor-polish.css?inline";
import { adoptStyles } from "./adopted-styles";

/** Shared styles travel with this island without changing the legacy entry's CSS contract. */
export default function FlightBridge({
  motion,
  step,
  onClose,
}: {
  motion: boolean;
  step: string;
  onClose: (destination?: string) => void;
}) {
  const [activeMotion, setActiveMotion] = useState(motion);
  useLayoutEffect(() => adoptStyles(reviewStyles + polishStyles).remove, []);
  useEffect(() => {
    const update = (event: Event) => setActiveMotion((event as CustomEvent<boolean>).detail);
    window.addEventListener("helios-motion", update);
    return () => window.removeEventListener("helios-motion", update);
  }, []);
  return (
    <FirstFlight
      motion={activeMotion}
      initialStep={step}
      onClose={onClose}
      edition="FIRST FLIGHT"
      helios
      visitorPaced
    />
  );
}
