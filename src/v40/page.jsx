import { waitForCanvas, startStars } from "./hero-field.js";
import { componentDidMount, componentWillUnmount, installPolish } from "./page-observers.js";
import { componentDidUpdate, applyScan, copyValue } from "./page-updates.js";
import { scramble, setupReveal, reveal, countUp, scrollFx } from "./reveal.js";
import { tilt, magnet, hoverIn, hoverOut, warpFlash, defiant } from "./pointer-effects.js";
import { filmById, stepCinema, closeCinema } from "./cinema-control.js";
import { lane } from "./experiment-state.js";
import { eve } from "./evidence-console.js";
import { startTrace, traceCaps, runPacket, animPk } from "./request-trace.js";
import { renderVals } from "./view-values.js";
import { renderPage } from "./render-page.jsx";
import { resources } from "./page-assets.ts";
import { observedDate, updatedDate, presentation } from "./evidence.ts";

import React from "react";

export class V40Page extends React.Component {
  viewportWidth = this.props.initialWidth ?? (typeof window !== "undefined" ? window.innerWidth : 1440);
  res(p) {
    const id = "r_" + p.replace(/[^a-z0-9]/gi, "_");
    return resources[id] || p;
  }
  state = {
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
        "Fleet and latest backup integrity results were observed " +
          observedDate +
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

  films = [
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

  filmById(...args) {
    return filmById.apply(this, args);
  }

  componentDidMount(...args) {
    return componentDidMount.apply(this, args);
  }
  componentDidUpdate(...args) {
    return componentDidUpdate.apply(this, args);
  }
  installPolish(...args) {
    return installPolish.apply(this, args);
  }
  copyValue(...args) {
    return copyValue.apply(this, args);
  }
  componentWillUnmount(...args) {
    return componentWillUnmount.apply(this, args);
  }
  applyScan(...args) {
    return applyScan.apply(this, args);
  }

  tilt(...args) {
    return tilt.apply(this, args);
  }
  magnet(...args) {
    return magnet.apply(this, args);
  }
  scramble(...args) {
    return scramble.apply(this, args);
  }
  setupReveal(...args) {
    return setupReveal.apply(this, args);
  }
  reveal(...args) {
    return reveal.apply(this, args);
  }
  countUp(...args) {
    return countUp.apply(this, args);
  }
  scrollFx(...args) {
    return scrollFx.apply(this, args);
  }

  waitForCanvas(...args) {
    return waitForCanvas.apply(this, args);
  }
  startStars(...args) {
    return startStars.apply(this, args);
  }

  warpFlash(...args) {
    return warpFlash.apply(this, args);
  }
  defiant(...args) {
    return defiant.apply(this, args);
  }
  stepCinema(...args) {
    return stepCinema.apply(this, args);
  }
  closeCinema(...args) {
    return closeCinema.apply(this, args);
  }

  lane(...args) {
    return lane.apply(this, args);
  }

  eve(...args) {
    return eve.apply(this, args);
  }

  startTrace(...args) {
    return startTrace.apply(this, args);
  }
  traceCaps(...args) {
    return traceCaps.apply(this, args);
  }
  edgeDefs = {
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
  runPacket(...args) {
    return runPacket.apply(this, args);
  }
  animPk(...args) {
    return animPk.apply(this, args);
  }

  hoverIn(...args) {
    return hoverIn.apply(this, args);
  }
  hoverOut(...args) {
    return hoverOut.apply(this, args);
  }

  renderVals(...args) {
    return renderVals.apply(this, args);
  }
  render() {
    const values = { ...this.props, ...this.renderVals() };
    return renderPage(values);
  }
}
