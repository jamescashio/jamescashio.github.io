const MAX_FRAME_DELTA_SECONDS = 0.05;

export function frameDeltaSeconds(nowMs: number, previousMs: number): number {
  return Math.max(0, Math.min(MAX_FRAME_DELTA_SECONDS, (nowMs - previousMs) / 1000));
}
