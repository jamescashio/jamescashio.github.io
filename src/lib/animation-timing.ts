const MAX_FRAME_DELTA_SECONDS = 0.05;

export function frameDeltaSeconds(nowMs: number, previousMs: number): number {
  return Math.max(0, Math.min(MAX_FRAME_DELTA_SECONDS, (nowMs - previousMs) / 1000));
}

export function shouldRenderFrame(nowMs: number, previousMs: number | null, minimumIntervalMs: number): boolean {
  return previousMs == null || nowMs - previousMs >= Math.max(0, minimumIntervalMs);
}
