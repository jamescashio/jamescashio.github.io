import type React from "react";
import type { PageHost } from "./page-model.ts";
import { snapshot, observedDate, observedShortDate, fleetSummary, fleetLine } from "./evidence.ts";

import { posterForViewport } from "./poster-sources.ts";

import { foldReply } from "./ship-humor.ts";

import { openingValues } from "./view-opening.ts";
import { experimentValues } from "./view-experiments.ts";
import { systemValues } from "./view-system.ts";
import { evidenceValues } from "./view-evidence.ts";
export function renderVals(this: PageHost) {
  const { s, tech, pad, railItems, telemetry, worlds, F, collections, filmList, C } = openingValues.call(this);
  const { lawA, lawB, pill, pvChoices, pvText, intents, tog, knob, dot, L, routeSteps, experiments, E } =
    experimentValues.call(this, s);
  const { N, ts, tp, nodes, edgeVals, traceLog, wire, traceOutcomeL, stages, captions, traceChoices } =
    systemValues.call(this, s, pill);
  const { eveLog, eveChips, selectedTag, energized } = evidenceValues.call(this, s);
  return {
    padL: pad,
    scene: s.scene,
    heroQuip: s.heroQuip,
    cameraClose: s.cameraClose,
    toggleCamera: () =>
      this.setState((state) => ({
        cameraClose: !state.cameraClose,
        heroQuip: state.cameraClose
          ? "A little perspective. Surprisingly hard to automate."
          : "Closer to the horizon. Still outside the warranty.",
      })),
    discovery: s.discovery,
    openDiscovery: (route: string) => this.setState({ discovery: route }),
    closeDiscovery: () => this.setState({ discovery: null }),
    foldCount: s.foldCount,
    foldScene: () => {
      this.warpUntil = this.reduce ? 0 : Date.now() + 1400;
      const hero = document.getElementById("top");
      if (hero && !this.reduce) {
        // Restart the finite fold response even when the visitor folds twice in a row.
        hero.removeAttribute("data-folding");
        void hero.offsetWidth;
        hero.setAttribute("data-folding", "");
        clearTimeout(this.foldT);
        this.foldT = setTimeout(() => hero.removeAttribute("data-folding"), 1200);
      }
      this.setState((state) => ({
        sceneTurn: state.sceneTurn + Math.PI / 2,
        foldCount: state.foldCount + 1,
        heroQuip: foldReply(state.foldCount + 1),
      }));
    },
    chooseScene: (scene: string) => this.setState({ scene, heroQuip: null }),
    turnScene: () =>
      this.setState((state) => ({
        sceneTurn: state.sceneTurn + Math.PI / 4,
        heroQuip: "A fresh perspective. No committee required.",
      })),
    wide: s.wide,
    activeSection: s.active,
    navOn: s.navOn ?? true,
    tech,
    railItems,
    heroCols: s.wide ? "minmax(0,1fr) 260px" : "minmax(0,1fr)",
    heroMove: (e: React.MouseEvent<HTMLElement>) => {
      if (this.reduce || !s.wide) return;
      const b = e.currentTarget.getBoundingClientRect();
      const nx = (e.clientX - b.left) / b.width - 0.5,
        ny = (e.clientY - b.top) / b.height - 0.5;
      this.orbitPointer = { x: nx, y: ny };
      const sp = document.getElementById("hero-spot");
      if (sp)
        sp.style.background = `radial-gradient(520px circle at ${(nx + 0.5) * 100}% ${(ny + 0.5) * 100}%, rgba(0,249,255,.11), transparent 60%)`;
    },
    heroLeave: (e: React.MouseEvent<HTMLElement>) => {
      this.orbitPointer = { x: 0, y: 0 };
      const planet = e.currentTarget.querySelector<HTMLElement>(".hero-live-poster");
      if (planet) planet.style.transform = "";
    },
    boardShip: (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      this.warpFlash();
      window.location.hash = "flight=board";
    },
    trailer: this.filmById("trailer"),
    featureFilms: ["trailer", "portal-arrival", "orbital-instrument", "threshold"].map((id) => this.filmById(id)),
    telemetry,
    observedDate,
    observedShortDate,
    fleetSummary,
    fleetLine,
    snapshot,
    worlds,
    collections,
    filmList,
    featSrc: F.src,
    featPoster: posterForViewport(F.poster, s.wide ? 720 : Math.min(720, this.viewportWidth - 56)),
    featTitle: F.title,
    featDesc: F.desc,
    featColl: F.coll,
    filmCols: s.wide ? "minmax(0,1.7fr) minmax(0,1fr)" : "minmax(0,1fr)",
    openFeature: () => this.setState({ cinema: s.film }),
    nextFilm: () => {
      const list = this.films.map((f) => f[1]);
      const i = (list.indexOf(s.film) + 1) % list.length;
      this.setState({ film: list[i], coll: this.films[i][0] });
    },
    cinemaOpen: !!C,
    cinemaIntro: s.cinema === "intro",
    cinemaSrc: C ? C.src : "",
    cinemaPoster: C ? C.poster : "",
    cinemaCaptions: C ? C.captions || "" : "",
    cinemaText: C ? C.text || "" : "",
    cinemaTitle: C ? C.title : "",
    cinemaDesc: C ? C.desc : "",
    cinemaColl: C ? C.coll : "",
    closeCinema: () => this.closeCinema(),
    cinemaPrev: () => this.stepCinema(-1),
    cinemaNext: () => this.stepCinema(1),
    lawA,
    lawB,
    alert: s.alert,
    warp: s.warp,
    pvChoices,
    pvShown: s.pvShown,
    pvText,
    pvReveal: () => this.setState({ pvShown: true, pv: s.pv || "reveal" }),
    pvAnswer: s.pvShown ? "A person." : "Your call.",
    pvEnd: s.pvShown ? "A PERSON" : "?",
    pvBorder: s.pvShown ? "var(--accent)" : "var(--glass-border)",
    pvBoundary: s.pvShown
      ? "Private input holds the external route for human review."
      : "Same task. Same sources. A different boundary.",
    loadPublic: () => this.setState({ exp: 0, intent: "analyze", sources: true, priv: false, routed: null }),
    loadPrivate: () => this.setState({ exp: 0, intent: "analyze", sources: true, priv: true, routed: null }),
    tabsCol: s.wide ? "1" : "1 / -1",
    panelCol: s.wide ? "2" : "1 / -1",
    expId: E[0],
    selectedExperiment: "experiment-" + s.exp,
    experimentIndex: s.exp,
    chooseExperiment: (event: React.ChangeEvent<HTMLSelectElement>) =>
      this.setState({ exp: Number(event.target.value) }),
    experiments,
    expNum: "0" + (s.exp + 1),
    expCode: E[2],
    expName: E[1],
    expTitle: "EXPERIMENT " + "0" + (s.exp + 1),
    expColor: s.exp === 0 ? "accent" : "cyan",
    expLede: E[3],
    expHref: "#experiment=" + E[0],
    isHermes: s.exp === 0,
    notHermes: s.exp !== 0,
    nextExp: () =>
      this.setState({ exp: (s.exp + 1) % 7 }, () => {
        const panel = document.getElementById("experiment-panel");
        panel?.focus({ preventScroll: true });
        panel?.scrollIntoView({ block: "start", behavior: "instant" });
      }),
    privatePressed: String(s.priv),
    sourcesPressed: String(s.sources),
    intents,
    privStyle: tog(s.priv, true),
    privKnob: knob(s.priv, true),
    privDot: dot(s.priv),
    srcStyle: tog(s.sources, false),
    srcKnob: knob(s.sources, false),
    srcDot: dot(s.sources),
    togglePrivate: () => this.setState({ priv: !s.priv, routed: null }),
    toggleSources: () => this.setState({ sources: !s.sources, routed: null }),
    route: () => this.setState({ routed: this.lane(s.intent, s.priv, s.sources) }),
    laneName: L.name,
    laneCode: L.code,
    laneLabel: L.label,
    laneColor: L.color,
    routeSteps,
    routeDetail: L.detail,
    copyLabel: s.copied === "failed" ? "Copy unavailable · try again" : s.copied ? "Copied ✔" : "Copy these settings",
    copySettings: () => {
      const u = `${location.href.split("#")[0]}#experiment=hermes&intent=${s.intent}&private=${s.priv}&sources=${s.sources}`;
      this.copyValue(u, "copied");
    },
    nodeTitle: N.title,
    nodeRole: N.role,
    nodeValue: N.value,
    nodeUnit: N.unit,
    nodeSummary: N.summary,
    nodeBody: N.body,
    nodeEvidence: N.evidence,
    nodeColor: N.color,
    selectedTag,
    nodes,
    stages,
    traceChoices,
    traceProgress: ts < 0 ? 0 : ((ts + 1) / 4) * 100,
    traceCaption: ts < 0 ? "Follow one example from human intent to human review. No request is sent." : captions[ts],
    traceLabel: s.tracing ? "▮▮ Tracing…" : "▷ Trace a request · about 8 seconds",
    trace: () => this.startTrace(),
    requestSource: tp ? "Draft · private input" : "Draft · sources optional",
    traceOutcome: traceOutcomeL.name === "Human review" ? "Human review" : "Workhorse",
    traceOutcomeColor: traceOutcomeL.color,
    wireIntent: wire(ts >= 0, "var(--amber)"),
    wireHold: wire(ts >= 2 && tp, "var(--accent)"),
    wireZeus: wire(ts >= 2 && !tp, "var(--cyan)"),
    wireApollo: wire(ts >= 2 && !tp, "var(--purple)"),
    eOpHe: edgeVals("opHe"),
    eOpDsh: edgeVals("opDsh"),
    eDshHe: edgeVals("dshHe"),
    eHeZe: edgeVals("heZe"),
    eHeAp: edgeVals("heAp"),
    traceLog,
    traceLogHeight: 176,
    mapReadout: `REQUEST · ${tp ? "PRIVATE" : "PUBLIC"} · ${ts < 0 ? "IDLE" : "STAGE 0" + (ts + 1) + " / 04"}`,
    mapState: s.tracing ? "TRACING" : ts >= 3 ? "COMPLETE" : "STANDING BY",
    mapStateColor: s.tracing ? "var(--cyan)" : ts >= 3 ? "var(--green)" : "var(--text-dim)",
    continueHermes: () => this.setState({ exp: 0, intent: "draft", sources: false, priv: tp, routed: null }),
    evLeftCol: s.wide ? "1" : "1 / -1",
    evRightCol: s.wide ? "2" : "1 / -1",
    eveHeight: 300,
    eveLog,
    eveChips,
    eveInput: s.eveInput,
    eveChange: (e: React.ChangeEvent<HTMLInputElement>) => this.setState({ eveInput: e.target.value }),
    eveSubmit: (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      this.eve(s.eveInput);
    },
    sigState: energized ? "ENERGIZED · ORBIT LIVE" : "DORMANT · GOLD INTENT",
    sigStateColor: energized ? "var(--green)" : "var(--text-dim)",
    sigImg: `position:relative;width:100%;height:auto;display:block;transition:filter 1.2s cubic-bezier(.23,1,.32,1);filter:${energized ? "brightness(1.2) saturate(1.15)" : "brightness(.85)"}`,
    sigVid: `position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:opacity 1.2s cubic-bezier(.23,1,.32,1);opacity:${energized ? 1 : 0}`,
    sigRing: `position:absolute;left:50%;top:50%;width:40%;aspect-ratio:1;border-radius:50%;border:1px solid var(--accent);margin:-20% 0 0 -20%;pointer-events:none;opacity:0;z-index:2;${energized ? "animation:v40-ring 1.6s cubic-bezier(.23,1,.32,1) infinite" : ""}`,
    energize: () => {
      const on = !energized;
      const v = document.getElementById("sig-video");
      if (v instanceof HTMLVideoElement) {
        v.muted = true;
        v.loop = true;
        v.dataset.requested = String(on);
        document.dispatchEvent(new Event("cashio-media"));
      }
      if (on) this.warpFlash();
      this.setState({ sig: on ? "energized" : "dormant" });
    },
    copyEmailLabel:
      s.emailCopied === "failed"
        ? "Copy unavailable · use email link"
        : s.emailCopied
          ? "Copied ✔"
          : "Copy email address",
    copyEmail: () => this.copyValue("doug@cashio.us", "emailCopied"),
  };
}
