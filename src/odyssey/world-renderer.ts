import * as THREE from "three";
import { createStudioEnvironment } from "./studio-environment";
import { createExplorationCarrier, type ShipZone } from "./ship-geometry";
import type { WorldInput, computeWorldOutcome } from "./sovereign-model";
import {
  FLIGHT_SHOT_MS,
  flightComposition,
  easeFlightShot,
  flightShotDistance,
  flightCarrierDistance,
  shortestFlightTurn,
  type FlightShot,
} from "./flight-shots";

type Outcome = ReturnType<typeof computeWorldOutcome>;
export type ShipView = "hero" | "top" | "aft";
export type WorldController = {
  /** Request a settled frame after the host reveals or moves the canvas. */
  refresh: () => void;
  update: (input: WorldInput, outcome: Outcome) => void;
  setMotion: (enabled: boolean) => void;
  setPlaying: (playing: boolean) => void;
  rotate: (horizontal: number, vertical?: number) => void;
  zoom: (amount: number) => void;
  resetView: () => void;
  setView: (view: ShipView) => void;
  setFlightShot: (shot: FlightShot) => void;
  setCutaway: (enabled: boolean) => void;
  /** Visual engine output only; never changes routing, motion state or framing. */
  setPropulsion: (percent: number) => void;
  /** Direct, settled partial hull inspection. Existing boolean endpoints remain supported. */
  setHullProgress: (percent: number) => void;
  select: (zone: ShipZone) => void;
  /** Copy a freshly rendered frame without retaining the WebGL drawing buffer. */
  captureFrame: () => HTMLCanvasElement;
  dispose: () => void;
};
