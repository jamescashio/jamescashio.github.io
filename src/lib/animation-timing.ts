const MAX_FRAME_DELTA_SECONDS = 0.05;

const MOTION_DURATION_MS = {
  "deck-copy": 380,
  "article-acquisition": 560,
  "stage-warp": 680,
} as const;

type MotionKind = keyof typeof MOTION_DURATION_MS;

export function motionDurationMs(kind: MotionKind): number {
  return MOTION_DURATION_MS[kind];
}

export function deckAnimationState({
  activeDeck,
  ownerDeck,
  selection,
}: {
  activeDeck: number;
  ownerDeck: number;
  selection: number;
}): { active: boolean; selection: number } {
  return { active: activeDeck === ownerDeck, selection };
}

export function frameDeltaSeconds(nowMs: number, previousMs: number): number {
  return Math.max(0, Math.min(MAX_FRAME_DELTA_SECONDS, (nowMs - previousMs) / 1000));
}

export function shouldRenderFrame(nowMs: number, previousMs: number | null, minimumIntervalMs: number): boolean {
  return previousMs == null || nowMs - previousMs >= Math.max(0, minimumIntervalMs);
}
