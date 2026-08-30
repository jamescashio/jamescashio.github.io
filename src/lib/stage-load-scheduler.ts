type SchedulerEnvironment = {
  requestAnimationFrame: (callback: FrameRequestCallback) => number;
  cancelAnimationFrame: (handle: number) => void;
  setTimeout: (callback: () => void, delay: number) => number;
  clearTimeout: (handle: number) => void;
  addEventListener: (type: IntentEvent, listener: EventListener, options?: AddEventListenerOptions) => void;
  removeEventListener: (type: IntentEvent, listener: EventListener, options?: EventListenerOptions) => void;
};

type IntentEvent = "pointerdown" | "keydown" | "wheel" | "touchstart";

type StageLoadOptions<T> = {
  load: () => Promise<T>;
  onReady: (module: T) => void;
  onFallback: (error: unknown) => void;
  environment?: SchedulerEnvironment;
};

const INTENT_EVENTS: IntentEvent[] = ["pointerdown", "keydown", "wheel", "touchstart"];
const PASSIVE_INTENT_EVENTS = new Set<IntentEvent>(["wheel", "touchstart"]);
const FALLBACK_MS = 12_000;

export function scheduleStageLoad<T>({
  load,
  onReady,
  onFallback,
  environment = window as unknown as SchedulerEnvironment,
}: StageLoadOptions<T>) {
  let firstFrame = 0;
  let secondFrame = 0;
  let fallbackTimer = 0;
  let painted = false;
  let startRequested = false;
  let started = false;
  let cancelled = false;

  const removeIntentListeners = () => {
    for (const type of INTENT_EVENTS) environment.removeEventListener(type, onIntent);
  };

  const clearSchedules = () => {
    if (firstFrame) environment.cancelAnimationFrame(firstFrame);
    if (secondFrame) environment.cancelAnimationFrame(secondFrame);
    if (fallbackTimer) environment.clearTimeout(fallbackTimer);
    firstFrame = secondFrame = fallbackTimer = 0;
    removeIntentListeners();
  };

  const start = () => {
    if (cancelled || started || !painted) return;
    started = true;
    clearSchedules();
    Promise.resolve()
      .then(load)
      .then((module) => {
        if (!cancelled) onReady(module);
      })
      .catch((error) => {
        if (!cancelled) onFallback(error);
      });
  };

  function onIntent() {
    startRequested = true;
    start();
  }

  for (const type of INTENT_EVENTS) {
    environment.addEventListener(type, onIntent, PASSIVE_INTENT_EVENTS.has(type) ? { passive: true } : undefined);
  }
  fallbackTimer = environment.setTimeout(() => {
    fallbackTimer = 0;
    startRequested = true;
    start();
  }, FALLBACK_MS);
  firstFrame = environment.requestAnimationFrame(() => {
    firstFrame = 0;
    if (cancelled) return;
    secondFrame = environment.requestAnimationFrame(() => {
      secondFrame = 0;
      if (cancelled) return;
      painted = true;
      if (startRequested) start();
    });
  });

  return () => {
    cancelled = true;
    clearSchedules();
  };
}
