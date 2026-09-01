import type { ViewscreenStageElement } from "./viewscreen.d.ts";

export type StageSyncTarget = Pick<ViewscreenStageElement, "setProgress" | "setDeck" | "setCraft"> | null | undefined;

/**
 * Edge-triggered stage notifier. Scroll settlement can fire many events that
 * all resolve to the same deck, craft, and progress; forwarding each one makes
 * the stage re-render identical state (every notification is a full frame under
 * reduced motion) and makes notification counts timing-dependent. This wrapper
 * forwards a value only when it changed for the current stage instance, and a
 * new stage instance always receives a full first sync.
 */
export function createStageNotifier() {
  let target: object | null = null;
  let deck: number | null = null;
  let craft: number | null = null;
  let progress: number | null = null;

  const retarget = (stage: object) => {
    if (stage === target) return;
    target = stage;
    deck = null;
    craft = null;
    progress = null;
  };

  return {
    deck(stage: StageSyncTarget, value: number) {
      if (!stage?.setDeck) return false;
      retarget(stage);
      if (deck === value) return false;
      deck = value;
      stage.setDeck(value);
      return true;
    },
    craft(stage: StageSyncTarget, value: number) {
      if (!stage?.setCraft) return false;
      retarget(stage);
      if (craft === value) return false;
      craft = value;
      stage.setCraft(value);
      return true;
    },
    progress(stage: StageSyncTarget, value: number) {
      if (!stage?.setProgress) return false;
      retarget(stage);
      if (progress === value) return false;
      progress = value;
      stage.setProgress(value);
      return true;
    },
  };
}

export type StageNotifier = ReturnType<typeof createStageNotifier>;
