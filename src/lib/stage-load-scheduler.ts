type SchedulerEnvironment = {
  requestAnimationFrame: (callback: FrameRequestCallback) => number;
  cancelAnimationFrame: (handle: number) => void;
  setTimeout: (callback: () => void, delay: number) => number;
  clearTimeout: (handle: number) => void;
  requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
  cancelIdleCallback?: (handle: number) => void;
  addEventListener: (type: "pointerdown" | "keydown", listener: EventListener) => void;
  removeEventListener: (type: "pointerdown" | "keydown", listener: EventListener) => void;
};

type StageLoadOptions<T> = {
  load: () => Promise<T>;
  onReady: (module: T) => void;
  onFallback: (error: unknown) => void;
  environment?: SchedulerEnvironment;
};

const FALLBACK_MS = 1600;

export function scheduleStageLoad<T>({
  load,
  onReady,
  onFallback,
  environment = window as unknown as SchedulerEnvironment,
}: StageLoadOptions<T>) {
  let firstFrame = 0;
  let secondFrame = 0;
  let idleCallback = 0;
  let fallbackTimer = 0;
  let immediateTimer = 0;
  let painted = false;
  let started = false;
  let cancelled = false;

  const removeIntentListeners = () => {
    environment.removeEventListener("pointerdown", onIntent);
    environment.removeEventListener("keydown", onIntent);
  };

  const clearSchedules = () => {
    if (firstFrame) environment.cancelAnimationFrame(firstFrame);
    if (secondFrame) environment.cancelAnimationFrame(secondFrame);
    if (idleCallback) environment.cancelIdleCallback?.(idleCallback);
    if (fallbackTimer) environment.clearTimeout(fallbackTimer);
    if (immediateTimer) environment.clearTimeout(immediateTimer);
    firstFrame = secondFrame = idleCallback = fallbackTimer = immediateTimer = 0;
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
    start();
  }

  environment.addEventListener("pointerdown", onIntent);
  environment.addEventListener("keydown", onIntent);
  firstFrame = environment.requestAnimationFrame(() => {
    firstFrame = 0;
    if (cancelled) return;
    painted = true;
    fallbackTimer = environment.setTimeout(start, FALLBACK_MS);
    secondFrame = environment.requestAnimationFrame(() => {
      secondFrame = 0;
      if (cancelled || started) return;
      if (environment.requestIdleCallback) {
        idleCallback = environment.requestIdleCallback(start, { timeout: 900 });
      } else {
        immediateTimer = environment.setTimeout(start, 0);
      }
    });
  });

  return () => {
    cancelled = true;
    clearSchedules();
  };
}
