const MOTION_KEY = "cashio.helios.motion";

export function readMotionPreference() {
  try {
    const value = localStorage.getItem(MOTION_KEY);
    return value === "off" || value === "on" ? value : null;
  } catch {
    return null;
  }
}

export function saveMotionPreference(value) {
  try {
    localStorage.setItem(MOTION_KEY, value);
  } catch {
    // A blocked or full store must not prevent this visit's motion control from working.
  }
}

export { MOTION_KEY };
