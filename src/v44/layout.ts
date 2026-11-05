/** Where the gate, sun and planet sit for a viewport, in shader units (height = 1, origin at centre, y up). */
export type SkyLayout = {
  ring: [number, number, number, number];
  rot: number;
  sun: [number, number];
  planet: [number, number, number];
};

export function layoutFor(width: number, height: number, column?: { left: number; right: number }): SkyLayout {
  const aspect = width / Math.max(1, height);
  const toX = (px: number) => (px - width / 2) / height;
  if (aspect < 0.9) {
    const R = Math.min(0.27, aspect * 0.42);
    const cx = 0.02;
    const cy = 0.23;
    return {
      ring: [cx, cy, R, 0.58],
      rot: -0.24,
      sun: [cx + R * 0.62, cy + R * 0.86],
      planet: [-aspect * 0.32, -0.98, 0.66],
    };
  }
  const left = column ? column.left : 0;
  const right = column ? column.right : width;
  const span = right - left;
  // The gate owns the right half of the content column, so ultrawide screens keep one composition.
  // Free sky beside the column on wide screens moves the gate outward instead of shrinking it.
  const cx = toX(left + span * 0.775 + Math.max(0, width - right) * 0.3);
  const R = Math.min(0.36, Math.max((span / height) * 0.235, 0.3));
  const cy = 0.02;
  return {
    ring: [cx, cy, R, 0.6],
    rot: -0.2,
    sun: [cx + R * 0.78, cy + R * 0.62],
    planet: [toX(left) - 0.28, -1.02, 0.78],
  };
}
