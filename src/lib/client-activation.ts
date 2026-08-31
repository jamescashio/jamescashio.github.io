type ActivationScheduler = Pick<
  Window,
  | "requestAnimationFrame"
  | "cancelAnimationFrame"
  | "setTimeout"
  | "clearTimeout"
  | "addEventListener"
  | "removeEventListener"
>;

const ACTIVATION_DELAY_MS = 250;
const ACTIVATION_INTENTS = ["pointerdown", "keydown", "touchstart", "hashchange", "popstate"];

export function scheduleClientActivation(
  activate: () => void | PromiseLike<unknown>,
  scheduler: ActivationScheduler = window,
) {
  let active = true;
  let timer = 0;
  let frame = scheduler.requestAnimationFrame(() => {
    frame = scheduler.requestAnimationFrame(() => {
      frame = 0;
      timer = scheduler.setTimeout(finish, ACTIVATION_DELAY_MS);
    });
  });

  function removeIntentListeners() {
    for (const type of ACTIVATION_INTENTS) scheduler.removeEventListener(type, finish, true);
  }

  function finish(intent?: Event) {
    if (!active) return;
    active = false;
    if (frame) scheduler.cancelAnimationFrame(frame);
    if (timer) scheduler.clearTimeout(timer);
    frame = 0;
    timer = 0;
    removeIntentListeners();
    const keyIntent = intent?.type === "keydown" && "key" in intent && (intent.key === "Enter" || intent.key === " ");
    const clickIntent = intent?.type === "pointerdown" || intent?.type === "touchstart" || keyIntent;
    const replayTarget = clickIntent && "click" in (intent?.target ?? {}) ? (intent?.target as HTMLElement) : null;
    let interceptedClick = false;
    const interceptClick = (event: Event) => {
      if (!replayTarget || event.target !== replayTarget) return;
      interceptedClick = true;
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    if (replayTarget) scheduler.addEventListener("click", interceptClick, true);
    const releaseClick = () => {
      if (!replayTarget) return;
      scheduler.removeEventListener("click", interceptClick, true);
      if (interceptedClick) replayTarget.click();
    };
    const result = activate();
    if (result && typeof result.then === "function") {
      Promise.resolve(result).then(releaseClick, (error) => {
        releaseClick();
        queueMicrotask(() => {
          throw error;
        });
      });
    } else {
      releaseClick();
    }
  }

  for (const type of ACTIVATION_INTENTS) scheduler.addEventListener(type, finish, true);

  return () => {
    if (!active) return;
    active = false;
    if (frame) scheduler.cancelAnimationFrame(frame);
    if (timer) scheduler.clearTimeout(timer);
    frame = 0;
    timer = 0;
    removeIntentListeners();
  };
}
