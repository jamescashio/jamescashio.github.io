import type { PageHost, PageProps, PageState, FilmTuple, Point } from "./page-model.ts";
import { waitForCanvas, startStars } from "./hero-field.ts";
import { componentDidMount, componentWillUnmount, installPolish } from "./page-observers.ts";
import { componentDidUpdate, applyScan, copyValue } from "./page-updates.ts";
import { scramble, setupReveal, reveal, countUp, scrollFx } from "./reveal.ts";
import { tilt, magnet, hoverIn, hoverOut, warpFlash, defiant } from "./pointer-effects.ts";
import { filmById, stepCinema, closeCinema } from "./cinema-control.ts";
import { lane } from "./experiment-state.ts";
import { eve } from "./evidence-console.ts";
import { startTrace, traceCaps, runPacket, animPk } from "./request-trace.ts";
import { renderVals } from "./view-values.ts";
import { renderPage } from "./render-page.ts";
import { resources } from "./page-assets.ts";
import { observedDate, updatedDate, presentation } from "./evidence.ts";

import React from "react";

export class V40Page extends React.Component<PageProps, PageState> implements PageHost {
  // Controllers initialize these resources during the React lifecycle.
  declare reduce: PageHost["reduce"];
  declare stopLivingHero: PageHost["stopLivingHero"];
  declare heroEnhancement: PageHost["heroEnhancement"];
  declare heroVisible: PageHost["heroVisible"];
  declare autoTraced: PageHost["autoTraced"];
  declare ioAlive: PageHost["ioAlive"];
  declare starsStarted: PageHost["starsStarted"];
  declare orbitPointer: PageHost["orbitPointer"];
  declare foldT: PageHost["foldT"];
  declare warpT: PageHost["warpT"];
  declare alertT: PageHost["alertT"];
  declare traceTimer: PageHost["traceTimer"];
  declare starsTimer: PageHost["starsTimer"];
  declare pkT: PageHost["pkT"];
  declare warpUntil: PageHost["warpUntil"];
  declare raf: PageHost["raf"];
  declare fxRaf: PageHost["fxRaf"];
  declare starsStartupRaf: PageHost["starsStartupRaf"];
  declare sio: PageHost["sio"];
  declare uio: PageHost["uio"];
  declare rio: PageHost["rio"];
  declare io: PageHost["io"];
  declare vio: PageHost["vio"];
  declare cio: PageHost["cio"];
  declare pauseIO: PageHost["pauseIO"];
  declare heroObserver: PageHost["heroObserver"];
  declare starResizeObserver: PageHost["starResizeObserver"];
  declare onResize: PageHost["onResize"];
  declare onScroll: PageHost["onScroll"];
  declare onKey: PageHost["onKey"];
  declare onStarResize: PageHost["onStarResize"];
  declare onMove: PageHost["onMove"];
  declare onOut: PageHost["onOut"];
  declare syncMotion: PageHost["syncMotion"];
  declare stopMedia: PageHost["stopMedia"];
  declare starDraw: PageHost["starDraw"];
  declare starLoop: PageHost["starLoop"];
  declare keyBuf: PageHost["keyBuf"];
  declare tiltEl: PageHost["tiltEl"];
  declare mags: PageHost["mags"];
  declare magT: PageHost["magT"];
  declare fxEls: PageHost["fxEls"];
  declare lastDiscovery: PageHost["lastDiscovery"];
  declare lastScene: PageHost["lastScene"];
  declare lastSceneTurn: PageHost["lastSceneTurn"];
  declare lastCameraClose: PageHost["lastCameraClose"];
  declare lastCinema: PageHost["lastCinema"];
  declare lastFilm: PageHost["lastFilm"];
  declare lastScan: PageHost["lastScan"];
  declare lastLog: PageHost["lastLog"];
  declare lastTrace: PageHost["lastTrace"];

  viewportWidth = this.props.initialWidth ?? (typeof window !== "undefined" ? window.innerWidth : 1440);
  res(p: string) {
    const id = "r_" + p.replace(/[^a-z0-9]/gi, "_");
    return resources[id] || p;
  }
  state: PageState = {
    discovery: null,
    foldCount: 0,
    heroQuip: null,
    scene: "orbit",
    sceneTurn: 0,
    cameraClose: false,
    wide: this.viewportWidth >= 1180,
    navOn: this.viewportWidth >= 1100,
    active: "top",
    pv: null,
    pvShown: false,
    intent: "draft",
    priv: false,
    sources: false,
    routed: null,
    copied: false,
    exp: 0,
    node: "hermes",
    tracePrivate: false,
    traceStep: -1,
    tracing: false,
    eveLog: [
      ["d", "Page updated · " + updatedDate + " · V42 / " + presentation.name],
      [
        "d",
        // The date prints once; a second line names it only if the observation day differs.
        (observedDate === updatedDate
          ? "Fleet and latest backup integrity results come from that day’s observation"
          : "Fleet and latest backup integrity results were observed " + observedDate) +
          ". Unmeasured figures are withheld.",
      ],
      ["d", "Each reply carries its own date. Easter egg replies are marked lore."],
      ["d", "Tap a command below or type your own. Try help."],
    ],
    eveInput: "",
    sig: "dormant",
    emailCopied: false,
    film: "starship-flyby",
    coll: 0,
    cinema: null,
    alert: false,
    warp: false,
    traceLog: [["[ 0.00]", "READY", "Standing by. Press Trace a request, or let it run when the map comes into view."]],
  };

  films: FilmTuple[] = [
    [
      0,
      "starship-blue-hour",
      "Starship Blue Hour",
      "A quiet ship above a lamplit workshop. The evening is just getting started.",
    ],
    [
      0,
      "starship-dockside",
      "Starship Dockside",
      "Home for the evening. Warm windows, a waiting ship, and nowhere urgent to be.",
    ],
    [0, "starship-flyby", "Starship Flyby", "A slow departure over the workshop, into the deep blue evening."],
    [
      0,
      "workshop-after-hours",
      "Workshop After Hours",
      "The lamp stays on a little longer. There is always one more idea.",
    ],
    [
      0,
      "lamplight-prototype",
      "Lamplight Prototype",
      "A small brass mechanism catches the last light on a wooden workbench.",
    ],
    [
      0,
      "quiet-intelligence",
      "Quiet Intelligence",
      "Brass, graphite and a trace of cyan. A close look at an imagined machine.",
    ],
    [
      1,
      "armillary-nocturne",
      "Armillary Nocturne",
      "Brass rings turn against the dark. A small universe, keeping its own time.",
    ],
    [
      1,
      "orbital-instrument",
      "Orbital Instrument",
      "An armillary sphere traces its quiet orbit through a drift of gold.",
    ],
    [
      1,
      "armillary-detail",
      "Armillary Detail",
      "Up close with the instrument: engraved brass, crossing rings and moving light.",
    ],
    [1, "orbital-dust", "Orbital Dust", "A fine gold orbit gathers dust and light at the edge of the dark."],
    [
      1,
      "celestial-signature",
      "Celestial Signature",
      "The cAshIo signature holds steady while a thin orbit and gold motes drift around it.",
    ],
    [2, "threshold", "Threshold", "Through a gold portal, toward the rings of a distant world.", true],
    [2, "portal-arrival", "Portal Arrival", "A doorway in space. A ringed planet on the other side.", true],
    [2, "ringed-horizon", "Ringed Horizon", "An unhurried view across the rings of an imagined planet."],
    [2, "the-long-view", "The Long View", "From a dark observatory, a telescope looks out toward a blue world."],
  ];
  collections = ["The workshop", "Gold in orbit", "Beyond the doorway"];

  filmById(...args: Parameters<typeof filmById>) {
    return filmById.apply(this, args);
  }

  componentDidMount(...args: Parameters<typeof componentDidMount>) {
    return componentDidMount.apply(this, args);
  }
  componentDidUpdate(...args: Parameters<typeof componentDidUpdate>) {
    return componentDidUpdate.apply(this, args);
  }
  installPolish(...args: Parameters<typeof installPolish>) {
    return installPolish.apply(this, args);
  }
  copyValue(...args: Parameters<typeof copyValue>) {
    return copyValue.apply(this, args);
  }
  componentWillUnmount(...args: Parameters<typeof componentWillUnmount>) {
    return componentWillUnmount.apply(this, args);
  }
  applyScan(...args: Parameters<typeof applyScan>) {
    return applyScan.apply(this, args);
  }

  tilt(...args: Parameters<typeof tilt>) {
    return tilt.apply(this, args);
  }
  magnet(...args: Parameters<typeof magnet>) {
    return magnet.apply(this, args);
  }
  scramble(...args: Parameters<typeof scramble>) {
    return scramble.apply(this, args);
  }
  setupReveal(...args: Parameters<typeof setupReveal>) {
    return setupReveal.apply(this, args);
  }
  reveal(...args: Parameters<typeof reveal>) {
    return reveal.apply(this, args);
  }
  countUp(...args: Parameters<typeof countUp>) {
    return countUp.apply(this, args);
  }
  scrollFx(...args: Parameters<typeof scrollFx>) {
    return scrollFx.apply(this, args);
  }

  waitForCanvas(...args: Parameters<typeof waitForCanvas>) {
    return waitForCanvas.apply(this, args);
  }
  startStars(...args: Parameters<typeof startStars>) {
    return startStars.apply(this, args);
  }

  warpFlash(...args: Parameters<typeof warpFlash>) {
    return warpFlash.apply(this, args);
  }
  defiant(...args: Parameters<typeof defiant>) {
    return defiant.apply(this, args);
  }
  stepCinema(...args: Parameters<typeof stepCinema>) {
    return stepCinema.apply(this, args);
  }
  closeCinema(...args: Parameters<typeof closeCinema>) {
    return closeCinema.apply(this, args);
  }

  lane(...args: Parameters<typeof lane>) {
    return lane.apply(this, args);
  }

  eve(...args: Parameters<typeof eve>) {
    return eve.apply(this, args);
  }

  startTrace(...args: Parameters<typeof startTrace>) {
    return startTrace.apply(this, args);
  }
  traceCaps(...args: Parameters<typeof traceCaps>) {
    return traceCaps.apply(this, args);
  }
  edgeDefs: Record<string, [Point, Point, Point]> = {
    opHe: [
      [200, 40],
      [200, 95],
      [200, 150],
    ],
    opDsh: [
      [200, 40],
      [110, 50],
      [64, 108],
    ],
    dshHe: [
      [64, 108],
      [120, 150],
      [200, 150],
    ],
    heZe: [
      [200, 150],
      [130, 180],
      [100, 252],
    ],
    heAp: [
      [200, 150],
      [270, 180],
      [300, 252],
    ],
  };
  runPacket(...args: Parameters<typeof runPacket>) {
    return runPacket.apply(this, args);
  }
  animPk(...args: Parameters<typeof animPk>) {
    return animPk.apply(this, args);
  }

  hoverIn(...args: Parameters<typeof hoverIn>) {
    return hoverIn.apply(this, args);
  }
  hoverOut(...args: Parameters<typeof hoverOut>) {
    return hoverOut.apply(this, args);
  }

  renderVals(...args: Parameters<typeof renderVals>) {
    return renderVals.apply(this, args);
  }
  render() {
    const values = { ...this.props, ...this.renderVals() };
    return renderPage(values);
  }
}
