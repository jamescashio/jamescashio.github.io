type ActivationScheduler = Pick<
  Window,
  | "requestAnimationFrame"
  | "cancelAnimationFrame"
  | "setTimeout"
  | "clearTimeout"
  | "addEventListener"
  | "removeEventListener"
>;

type ActivationOptions = {
  defer?: boolean;
};

type TouchPointSnapshot = {
  identifier: number;
  clientX: number;
  clientY: number;
};

const ACTIVATION_DELAY_MS = 250;
const ACTIVATION_INTENTS = ["pointerdown", "keydown", "touchstart", "hashchange", "popstate"];
const ACTIVATABLE_SELECTOR = 'button,input,select,textarea,[role="button"],[role="menuitem"],[tabindex]';
const SWIPE_THRESHOLD_PX = 72;

function stableActivatableTarget(target: EventTarget | null) {
  if (!target || typeof target !== "object") return null;
  const candidate =
    "closest" in target && typeof target.closest === "function" ? target.closest(ACTIVATABLE_SELECTOR) : target;
  if (!candidate || typeof candidate !== "object" || !("click" in candidate) || typeof candidate.click !== "function")
    return null;
  return candidate as HTMLElement;
}

function clickBelongsToTarget(target: HTMLElement, eventTarget: EventTarget | null) {
  if (eventTarget === target) return true;
  if (!eventTarget || typeof target.contains !== "function") return false;
  try {
    return target.contains(eventTarget as Node);
  } catch {
    return false;
  }
}

function touchPoint(list: TouchList | ArrayLike<Touch> | undefined): TouchPointSnapshot | null {
  const point = list?.[0];
  if (!point) return null;
  return {
    identifier: Number.isFinite(point.identifier) ? point.identifier : 0,
    clientX: point.clientX,
    clientY: point.clientY,
  };
}

function dispatchTouch(target: EventTarget, type: "touchstart" | "touchend", point: TouchPointSnapshot) {
  if (!("dispatchEvent" in target) || typeof target.dispatchEvent !== "function") return;
  const element = "ownerDocument" in target ? (target as Element) : null;
  const view = element?.ownerDocument?.defaultView;
  if (!view?.TouchEvent) return;
  const touchTarget = element ?? view.document.documentElement;
  const touch = view.Touch
    ? new view.Touch({
        identifier: point.identifier,
        target: touchTarget,
        clientX: point.clientX,
        clientY: point.clientY,
      })
    : ({ ...point, target: touchTarget } as unknown as Touch);
  const event = new view.TouchEvent(type, {
    bubbles: true,
    cancelable: true,
    touches: type === "touchstart" ? [touch] : [],
    targetTouches: type === "touchstart" ? [touch] : [],
    changedTouches: [touch],
  });
  target.dispatchEvent(event);
}

export function scheduleClientActivation(
  activate: () => void | PromiseLike<unknown>,
  scheduler: ActivationScheduler = window,
  options: ActivationOptions = {},
) {
  let waiting = true;
  let cancelled = false;
  let activationReady = false;
  let timer = 0;
  let frame = 0;
  let replayTarget: HTMLElement | null = null;
  let interceptedClick = false;
  let touchTarget: EventTarget | null = null;
  let touchStart: TouchPointSnapshot | null = null;
  let pendingSwipeEnd: TouchPointSnapshot | null = null;

  function removeIntentListeners() {
    for (const type of ACTIVATION_INTENTS) scheduler.removeEventListener(type, finish, true);
  }

  function removeTouchCompletionListeners() {
    scheduler.removeEventListener("touchend", captureTouchEnd, true);
    scheduler.removeEventListener("touchcancel", cancelTouchReplay, true);
  }

  function interceptClick(event: Event) {
    if (!replayTarget || !clickBelongsToTarget(replayTarget, event.target)) return;
    interceptedClick = true;
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  function releaseClick() {
    if (!replayTarget) return;
    scheduler.removeEventListener("click", interceptClick, true);
    if (interceptedClick && !cancelled) replayTarget.click();
    replayTarget = null;
  }

  function cancelTouchReplay() {
    removeTouchCompletionListeners();
    touchTarget = null;
    touchStart = null;
    pendingSwipeEnd = null;
  }

  function replaySwipe() {
    if (!activationReady || !touchTarget || !touchStart || !pendingSwipeEnd || cancelled) return;
    const target = touchTarget;
    const start = touchStart;
    const end = pendingSwipeEnd;
    cancelTouchReplay();
    dispatchTouch(target, "touchstart", start);
    dispatchTouch(target, "touchend", end);
  }

  function captureTouchEnd(event: Event) {
    const end = touchPoint((event as TouchEvent).changedTouches);
    removeTouchCompletionListeners();
    if (!touchStart || !end || Math.abs(end.clientX - touchStart.clientX) < SWIPE_THRESHOLD_PX) {
      touchTarget = null;
      touchStart = null;
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    pendingSwipeEnd = end;
    replaySwipe();
  }

  function captureTouchGesture(event: Event) {
    const start = touchPoint((event as TouchEvent).touches);
    if (!start || !event.target) return;
    touchTarget = event.target;
    touchStart = start;
    scheduler.addEventListener("touchend", captureTouchEnd, true);
    scheduler.addEventListener("touchcancel", cancelTouchReplay, true);
  }

  function replayKeyboardIntent(intent: Event | undefined) {
    const keyboard = intent as KeyboardEvent | undefined;
    if (keyboard?.type !== "keydown" || typeof keyboard.key !== "string") return null;
    if ((!keyboard.ctrlKey && !keyboard.metaKey) || keyboard.key.toLowerCase() !== "k") return null;
    const target = keyboard.target;
    if (!target || !("dispatchEvent" in target) || typeof target.dispatchEvent !== "function") return null;
    keyboard.preventDefault();
    keyboard.stopImmediatePropagation();
    return () => {
      if (cancelled) return;
      const view =
        "ownerDocument" in target
          ? (target as Element).ownerDocument?.defaultView
          : typeof window === "undefined"
            ? null
            : window;
      if (!view?.KeyboardEvent) return;
      target.dispatchEvent(
        new view.KeyboardEvent("keydown", {
          key: keyboard.key,
          code: keyboard.code,
          location: keyboard.location,
          ctrlKey: keyboard.ctrlKey,
          metaKey: keyboard.metaKey,
          altKey: keyboard.altKey,
          shiftKey: keyboard.shiftKey,
          repeat: keyboard.repeat,
          bubbles: true,
          cancelable: true,
        }),
      );
    };
  }

  function finish(intent?: Event) {
    if (!waiting || cancelled) return;
    waiting = false;
    if (frame) scheduler.cancelAnimationFrame(frame);
    if (timer) scheduler.clearTimeout(timer);
    frame = 0;
    timer = 0;
    removeIntentListeners();

    const replayKeyboard = replayKeyboardIntent(intent);
    const keyIntent = intent as KeyboardEvent | undefined;
    const keyClick = keyIntent?.type === "keydown" && (keyIntent.key === "Enter" || keyIntent.key === " ");
    if (intent?.type === "touchstart") captureTouchGesture(intent);
    if (intent?.type === "pointerdown" || keyClick) replayTarget = stableActivatableTarget(intent?.target ?? null);
    if (replayTarget) scheduler.addEventListener("click", interceptClick, true);

    const release = () => {
      activationReady = true;
      releaseClick();
      replayKeyboard?.();
      replaySwipe();
    };
    const result = activate();
    if (result && typeof result.then === "function") {
      Promise.resolve(result).then(release, (error) => {
        release();
        queueMicrotask(() => {
          throw error;
        });
      });
    } else {
      release();
    }
  }

  if (options.defer === false) {
    finish();
  } else {
    for (const type of ACTIVATION_INTENTS) scheduler.addEventListener(type, finish, true);
    frame = scheduler.requestAnimationFrame(() => {
      frame = scheduler.requestAnimationFrame(() => {
        frame = 0;
        timer = scheduler.setTimeout(finish, ACTIVATION_DELAY_MS);
      });
    });
  }

  return () => {
    if (cancelled) return;
    cancelled = true;
    waiting = false;
    if (frame) scheduler.cancelAnimationFrame(frame);
    if (timer) scheduler.clearTimeout(timer);
    frame = 0;
    timer = 0;
    removeIntentListeners();
    scheduler.removeEventListener("click", interceptClick, true);
    cancelTouchReplay();
    replayTarget = null;
  };
}
