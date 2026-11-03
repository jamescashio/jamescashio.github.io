export interface HeroSize {
  width: number;
  height: number;
  density: number;
}
export type HeroCommand =
  | { type: "init"; canvas: OffscreenCanvas; size: HeroSize; artwork: string; depth: string; orbit: number }
  | { type: "resize"; size: HeroSize }
  | { type: "frame"; time: number; x: number; y: number };
export type HeroReply = { type: "ready" | "frame" | "failed" };
