import type React from "react";
import type { lane } from "./experiment-state.ts";

export type Timer = ReturnType<typeof setTimeout>;
export type Point = [number, number];
export type FilmTuple = [number, string, string, string, boolean?];
export type EvidenceLine = [string, string];
export type TraceLine = [string, string, string];
export interface PageProps {
  initialWidth?: number;
  scanlines?: boolean;
  starDensity?: number;
  techDetail?: boolean;
}
export interface FilmView {
  slug: string;
  title: string;
  desc: string;
  coll: string;
  src: string;
  poster: string;
  captions?: string;
  text?: string;
  noloop?: boolean;
}
export interface PageState {
  discovery: string | null;
  foldCount: number;
  heroQuip: string | null;
  scene: string;
  sceneTurn: number;
  cameraClose: boolean;
  wide: boolean;
  navOn: boolean;
  active: string;
  pv: string | null;
  pvShown: boolean;
  intent: string;
  priv: boolean;
  sources: boolean;
  routed: ReturnType<typeof lane> | null;
  copied: boolean | "failed";
  exp: number;
  node: string;
  tracePrivate: boolean;
  traceStep: number;
  tracing: boolean;
  eveLog: EvidenceLine[];
  eveInput: string;
  sig: string;
  emailCopied: boolean | "failed";
  film: string;
  coll: number;
  cinema: string | null;
  alert: boolean;
  warp: boolean;
  traceLog: TraceLine[];
}

// The component owns lifecycle resources; extracted controllers share this exact
// contract rather than an open property bag or generated presentation types.
export interface PageHost {
  props: Readonly<PageProps>;
  state: Readonly<PageState>;
  setState: React.Component<PageProps, PageState>["setState"];
  viewportWidth: number;
  films: FilmTuple[];
  collections: string[];
  edgeDefs: Record<string, [Point, Point, Point]>;
  reduce: boolean;
  heroVisible?: boolean;
  autoTraced?: boolean;
  ioAlive?: boolean;
  starsStarted?: boolean;
  orbitPointer?: { x: number; y: number };
  foldT?: Timer;
  warpT?: Timer;
  alertT?: Timer;
  traceTimer?: Timer;
  starsTimer?: Timer;
  pkT?: Record<string, Timer>;
  warpUntil?: number;
  raf: number;
  fxRaf: number;
  starsStartupRaf: number;
  sio: IntersectionObserver;
  uio: IntersectionObserver;
  rio: IntersectionObserver;
  io: IntersectionObserver;
  vio?: IntersectionObserver;
  cio?: IntersectionObserver;
  pauseIO?: IntersectionObserver;
  heroObserver?: IntersectionObserver;
  starResizeObserver?: ResizeObserver;
  onResize: () => void;
  onScroll: () => void;
  onKey: (event: KeyboardEvent) => void;
  onStarResize?: () => void;
  onMove?: (event: MouseEvent) => void;
  onOut?: (event: MouseEvent) => void;
  syncMotion: () => void;
  stopMedia?: () => void;
  starDraw?: (delta?: number) => void;
  starLoop?: (timestamp?: number) => void;
  keyBuf: string;
  tiltEl?: HTMLElement | null;
  mags?: HTMLElement[];
  magT: number;
  fxEls?: Element[];
  lastDiscovery?: string | null;
  lastScene?: string;
  lastSceneTurn?: number;
  lastCameraClose?: boolean;
  lastCinema?: string | null;
  lastFilm?: string;
  lastScan?: boolean;
  lastLog?: EvidenceLine[];
  lastTrace?: TraceLine[];
  res: (path: string) => string;
  filmById: (slug: string) => FilmView;
  lane: typeof lane;
  eve: (raw: string) => void;
  copyValue: (text: string, key: "copied" | "emailCopied") => Promise<void>;
  reveal: (element: Element) => void;
  countUp: (element: HTMLElement) => void;
  scramble: (element: Element) => void;
  setupReveal: () => void;
  scrollFx: () => void;
  waitForCanvas: (tries?: number) => void;
  startStars: (canvas: HTMLCanvasElement) => void;
  warpFlash: () => void;
  defiant: () => void;
  startTrace: () => void;
  traceCaps: (isPrivate: boolean) => string[];
  runPacket: (step: number, isPrivate: boolean) => void;
  animPk: (id: string, edge: string, direction: number, duration?: number) => void;
  hoverIn: (event: React.MouseEvent<HTMLElement>) => void;
  hoverOut: (event: React.MouseEvent<HTMLElement>) => void;
  installPolish: () => void;
  applyScan: () => void;
  closeCinema: () => void;
  stepCinema: (direction: number) => void;
}

declare global {
  interface Window {
    cashioV40?: PageHost;
  }
}
