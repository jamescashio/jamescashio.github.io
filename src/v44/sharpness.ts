/**
 * How sharp the live gate is drawn. The backing store starts where every device has always carried it
 * and climbs toward the screen's own pixels one measured step at a time, so a strong GPU shows the gate
 * at native resolution and a weak one never pays for pixels it cannot draw in time.
 * Scales are canvas pixels per CSS pixel.
 */

/** Every device starts within this many pixels; fast frames earn more, up to a native 4K screen. */
export const PIXELS_AT_START = 2.1e6;
export const PIXELS_AT_MOST = 8.3e6;
/** A sharper frame is taken only while the GPU draws the present one inside this many milliseconds. */
export const FRAME_BUDGET_MS = 5;
/** One step up in sharpness, and what it costs in pixels. */
export const STEP_UP = 1.16;
const STEP_COST = STEP_UP * STEP_UP;

const ratio = (devicePixelRatio: number) => Math.min(devicePixelRatio || 1, 2);

/** Where a device begins: a little under its screen, and inside the starting pixel count. */
export function startScale(devicePixelRatio: number, coarse: boolean, area: number): number {
  return Math.min(ratio(devicePixelRatio) * (coarse ? 0.68 : 0.72), Math.sqrt(PIXELS_AT_START / Math.max(1, area)));
}

/**
 * The sharpest backing store worth asking for: the screen's own pixels (a little under on phones),
 * within the pixel ceiling and whatever the device has shown to be its limit.
 */
export function ceilingScale(devicePixelRatio: number, coarse: boolean, area: number, limit = Infinity): number {
  return Math.min(ratio(devicePixelRatio) * (coarse ? 0.8 : 1), Math.sqrt(PIXELS_AT_MOST / Math.max(1, area)), limit);
}

/** Whether a frame that cost this much leaves room for one step more. */
export function affordsStep(costMs: number): boolean {
  return costMs * STEP_COST <= FRAME_BUDGET_MS;
}

/** The scale after a frame that cost this much: one step up if it was cheap, never past the ceiling. */
export function stepped(scale: number, ceiling: number, costMs: number): number {
  return affordsStep(costMs) ? Math.min(ceiling, scale * STEP_UP) : scale;
}

/**
 * The gap between drawn frames on a display with this refresh, for a wanted pace: sixty frames a second
 * at most, counted in the display's own beats. A 75 Hz screen draws on every beat and a 144 Hz one on
 * every third, so no display ever looks slow to itself.
 */
export function beatFor(wantMs: number, refreshMs: number): number {
  return Math.max(1, Math.ceil((wantMs - 1.5) / refreshMs - 0.15)) * refreshMs;
}
