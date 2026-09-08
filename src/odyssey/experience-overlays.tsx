import { lazy } from "react";
import { SceneBoundary } from "./scene-boundary";
import { STUDY_BROWSER_ID } from "./study-navigation";
import type { useExperienceController } from "./experience-controller";
const FirstFlight = lazy(() => import("./first-flight"));
const BrandStudio = lazy(() => import("./brand-studio"));
const LensingObservatory = lazy(() => import("./lensing-observatory"));
const LensingFilm = lazy(() => import("./lensing-film"));

export function ExperienceOverlays({
  scenes,
  motion,
  reduced,
}: {
  scenes: ReturnType<typeof useExperienceController>;
  motion: boolean;
  reduced: boolean;
}) {
  const {
    flight,
    setFlight,
    signature,
    lensing,
    sharedWorld,
    worldRoute,
    film,
    setFilm,
    filmClip,
    filmRouteRevision,
    lensArrival,
    enterFilmWorld,
    watchSignature,
    sculptFilmLight,
    dismissScene,
  } = scenes;
  return (
    <>
      {film && (
        <SceneBoundary name="Cinema" onClose={() => dismissScene("film")}>
          <LensingFilm
            key={`${filmClip}-${filmRouteRevision}`}
            motion={motion}
            initialClip={filmClip}
            onExplore={enterFilmWorld}
            onSignature={sculptFilmLight}
            onWork={() => {
              setFilm(false);
              history.replaceState(null, "", location.pathname + location.search + "#work");
              requestAnimationFrame(() => {
                const heading = document.getElementById("work-title");
                heading?.focus({ preventScroll: true });
                heading?.scrollIntoView({ block: "start", behavior: "instant" });
              });
            }}
            onClose={() => dismissScene("film")}
          />
        </SceneBoundary>
      )}
      {lensing && (
        <SceneBoundary name="Lensing Observatory" onClose={() => dismissScene("lensing")}>
          <LensingObservatory
            key={worldRoute}
            sharedState={sharedWorld}
            motion={motion}
            reduced={reduced}
            initialPreset={lensArrival ? { light: "eclipse", view: "gate", resonance: true } : undefined}
            onClose={() => dismissScene("lensing")}
          />
        </SceneBoundary>
      )}
      {signature && (
        <SceneBoundary name="Celestial signature" onClose={() => dismissScene("signature")}>
          <BrandStudio motion={motion} onWatch={watchSignature} onClose={() => dismissScene("signature")} />
        </SceneBoundary>
      )}
      {flight !== null && (
        <SceneBoundary name="First Flight" onClose={() => dismissScene("flight")}>
          <FirstFlight
            key={flight}
            motion={motion}
            initialStep={flight}
            onClose={(destination) => {
              setFlight(null);
              if (destination) {
                location.hash = destination;
                requestAnimationFrame(() => {
                  const target = document.getElementById(
                    destination.startsWith("build=") ? STUDY_BROWSER_ID : destination,
                  );
                  target?.scrollIntoView({ behavior: "instant" });
                  const heading = target?.querySelector<HTMLElement>("h2,h3");
                  heading?.setAttribute("tabindex", "-1");
                  heading?.focus({ preventScroll: true });
                });
              } else {
                dismissScene("flight");
              }
            }}
          />
        </SceneBoundary>
      )}
    </>
  );
}
