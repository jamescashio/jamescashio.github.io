import { useEffect, useRef, useState, type MouseEvent } from "react";
import { isObservatoryRoute, readObservatoryState, type ObservatoryState } from "./observatory-state";
import type { LensingClip } from "./lensing-film";

function resolveLauncher(opener: HTMLElement | null, fallback: string) {
  const candidate = opener ?? document.querySelector<HTMLElement>(fallback);
  candidate?.closest<HTMLDetailsElement>("details")?.setAttribute("open", "");
  return opener?.isConnected &&
    opener !== document.body &&
    opener !== document.documentElement &&
    opener.getClientRects().length
    ? opener
    : ([...document.querySelectorAll<HTMLElement>(fallback)].find((element) => element.getClientRects().length) ??
        null);
}

export function useExperienceController(motion: boolean) {
  const [flight, setFlight] = useState<string | null>(null);
  const [signature, setSignature] = useState(false);
  const [lensing, setLensing] = useState(false);
  const [sharedWorld, setSharedWorld] = useState<ObservatoryState | null>(null);
  const [worldRoute, setWorldRoute] = useState("");
  const [film, setFilm] = useState(false);
  const [filmClip, setFilmClip] = useState<LensingClip>("lightwake");
  const [filmRouteRevision, setFilmRouteRevision] = useState(0);
  const [lensArrival, setLensArrival] = useState(false);
  const filmOpener = useRef<HTMLElement | null>(null);
  const lensOpener = useRef<HTMLElement | null>(null);
  const ambientMotion = motion && flight === null && !signature && !lensing && !film;
  function openFilm(opener: HTMLElement, clip: LensingClip = "lightwake") {
    filmOpener.current = opener;
    setFilmClip(clip);
    setFilm(true);
  }
  function openLensing(opener: HTMLElement) {
    setSharedWorld(null);
    setWorldRoute("");
    lensOpener.current = opener;
    setLensArrival(false);
    setLensing(true);
  }
  function enterFilmWorld() {
    lensOpener.current = resolveLauncher(filmOpener.current, ".lens-film-link");
    setSharedWorld(null);
    setWorldRoute("");
    setLensArrival(true);
    setFilm(false);
    setLensing(true);
    if (/^#film(?:=(?:awakening|signature|lightwake|sanctuary))?$/.test(location.hash))
      history.replaceState(null, "", location.pathname + location.search);
  }
  const signatureOpener = useRef<HTMLElement | null>(null);
  function watchSignature() {
    filmOpener.current = resolveLauncher(signatureOpener.current, ".o-signature-link");
    setSignature(false);
    setFilmClip("signature");
    setFilm(true);
    if (location.hash === "#signature") history.replaceState(null, "", location.pathname + location.search);
  }
  function sculptFilmLight() {
    signatureOpener.current = resolveLauncher(filmOpener.current, ".lens-film-link");
    setFilm(false);
    setSignature(true);
    if (/^#film(?:=(?:awakening|signature|lightwake|sanctuary))?$/.test(location.hash))
      history.replaceState(null, "", location.pathname + location.search);
  }
  function openSignature(event: MouseEvent<HTMLButtonElement>) {
    signatureOpener.current = event.currentTarget;
    setSignature(true);
  }
  const flightOpener = useRef<HTMLElement | null>(null);
  function startFlight(event?: MouseEvent<HTMLButtonElement>) {
    flightOpener.current = event?.currentTarget ?? (document.activeElement as HTMLElement);
    setFlight("board");
  }
  useEffect(() => {
    const readFlight = () => {
      const value = location.hash.match(/^#flight=(board|hull|blackout|permission)$/)?.[1];
      setFlight(value ?? null);
      setSignature(location.hash === "#signature");
      setLensing(isObservatoryRoute(location.hash));
      setSharedWorld(readObservatoryState(location.hash));
      setWorldRoute(location.hash);
      setLensArrival(false);
      const filmRoute = /^#film(?:=(?:awakening|signature|lightwake|sanctuary))?$/.test(location.hash);
      setFilm(filmRoute);
      if (filmRoute) setFilmRouteRevision((revision) => revision + 1);
      setFilmClip(
        location.hash === "#film"
          ? "arrival"
          : location.hash === "#film=awakening"
            ? "awakening"
            : location.hash === "#film=signature"
              ? "signature"
              : location.hash === "#film=sanctuary"
                ? "sanctuary"
                : "lightwake",
      );
    };
    readFlight();
    window.addEventListener("hashchange", readFlight);
    return () => window.removeEventListener("hashchange", readFlight);
  }, []);
  function dismissScene(kind: "film" | "lensing" | "signature" | "flight") {
    const scene = {
      film: {
        close: () => setFilm(false),
        opener: filmOpener.current,
        fallback: ".lens-film-link",
        route: /^#film(?:=(?:awakening|signature|lightwake|sanctuary))?$/,
      },
      lensing: {
        close: () => setLensing(false),
        opener: lensOpener.current,
        fallback: ".lens-observatory-link",
        route: /^#lensing(?:&|$)/,
      },
      signature: {
        close: () => setSignature(false),
        opener: signatureOpener.current,
        fallback: ".o-signature-link",
        route: /^#signature$/,
      },
      flight: {
        close: () => setFlight(null),
        opener: flightOpener.current,
        fallback: ".continuum-first-flight, .lens-flight-link, .lens-enter",
        route: /^#flight=/,
      },
    }[kind];
    scene.close();
    if (scene.route.test(location.hash)) history.replaceState(null, "", location.pathname + location.search);
    requestAnimationFrame(() => resolveLauncher(scene.opener, scene.fallback)?.focus({ preventScroll: true }));
  }

  return {
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
    ambientMotion,
    openFilm,
    openLensing,
    enterFilmWorld,
    watchSignature,
    sculptFilmLight,
    openSignature,
    startFlight,
    dismissScene,
  };
}
