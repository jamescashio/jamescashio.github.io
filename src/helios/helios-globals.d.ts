/** Browser globals the front door adds: test hooks, the public fleet record, Bit, and its custom events. */
interface Window {
  /** Runs Bit's orbital effect when motion is on and the hero scene is running. */
  __fold?: () => void;
  /** Pauses or resumes the hero scene independently of the Motion control. */
  __heroPause?: (pause: boolean) => void;
  /** Loads the hero scene early, before the arrival film would have done so. */
  __prepareHero?: () => Promise<void> | void;
  /** The dated fleet record, exposed for the release checks. */
  FLEET?: typeof import("./fleet.js").FLEET;
  /** Bit's voice, exposed for the release checks. */
  Bit?: ReturnType<typeof import("./bit.js").setupBit>;
}

interface WindowEventMap {
  /** Motion control changed; the detail is the new enabled state. */
  "helios-motion": CustomEvent<boolean>;
  /** A scene overlay opened or closed. */
  "helios-overlay": Event;
  /** A room finished rendering; the detail is its section. */
  "helios-room-ready": CustomEvent<HTMLElement>;
}

interface Navigator {
  /** Network Information API, present in Chromium browsers. */
  connection?: { saveData?: boolean; effectiveType?: string };
}
