/** Where the gate, sun and planet sit for a viewport, in shader units (height = 1, origin at centre, y up). */
export type SkyLayout = {
  ring: [number, number, number, number];
  rot: number;
  sun: [number, number];
  planet: [number, number, number];
};
type Column = { left: number; right: number };

/** The content column the stylesheet draws at a width: a gutter of 4vw between 18 and 56 px, at most 1320 px wide (1680 from 2400). */
export function columnFor(width: number): Column {
  const gutter = Math.min(56, Math.max(18, width * 0.04));
  const span = Math.min(width - 2 * gutter, width >= 2400 ? 1680 : 1320);
  return { left: (width - span) / 2, right: (width + span) / 2 };
}

/** The composition rule: the gate owns the right of the content column, or the sky above the words on phones. */
export function layoutFor(width: number, height: number, column: Column = columnFor(width)): SkyLayout {
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
  const span = column.right - column.left;
  // Free sky beside the column on wide screens moves the gate outward instead of shrinking it.
  const cx = toX(column.left + span * 0.775 + Math.max(0, width - column.right) * 0.3);
  const R = Math.min(0.36, Math.max((span / height) * 0.235, 0.3));
  const cy = 0.02;
  return {
    ring: [cx, cy, R, 0.6],
    rot: -0.2,
    sun: [cx + R * 0.78, cy + R * 0.62],
    planet: [column.left / height - aspect / 2 - 0.28, -1.02, 0.78],
  };
}

/**
 * The painted posters. Each is rendered from the live shader (scripts/render-gate-posters.mjs) with
 * the layout of its reference screen, so a poster and the live gate show one scene. The short poster
 * keeps a small gate in the band above the words of the shortest phones.
 */
export type Poster = { id: string; aspect: number; layout: SkyLayout; sizes: [number, number][] };
export const POSTERS: Poster[] = [
  {
    id: "gate",
    aspect: 16 / 9,
    layout: layoutFor(1600, 900),
    sizes: [
      [960, 540],
      [1600, 900],
      [2400, 1350],
    ],
  },
  {
    id: "gate-wide",
    aspect: 3822 / 1600,
    layout: layoutFor(3822, 1600),
    sizes: [
      [1600, 670],
      [2400, 1005],
    ],
  },
  {
    id: "gate-portrait",
    aspect: 720 / 1560,
    layout: layoutFor(720, 1560),
    sizes: [
      [720, 1560],
      [1080, 2340],
    ],
  },
  {
    id: "gate-short",
    aspect: 9 / 16,
    layout: {
      ring: [0.07, 0.315, 0.105, 0.58],
      rot: -0.24,
      sun: [0.07 + 0.105 * 0.9, 0.315 + 0.105 * 1.1],
      planet: [-0.18, -0.98, 0.66],
    },
    sizes: [[720, 1280]],
  },
];

/** The poster a file name belongs to, such as /v44/gate-wide-2400.webp. */
export function posterFor(src: string): Poster {
  const name = src.split("/").pop() || "";
  return [...POSTERS].sort((a, b) => b.id.length - a.id.length).find((p) => name.startsWith(`${p.id}-`)) || POSTERS[0];
}

/**
 * The poster's own layout as it lands on this screen: object-fit cover, placed by its object-position
 * (fractions of the free space, as in CSS). The live gate draws exactly this, so the crossfade from
 * poster to live never shows two gates.
 */
export function projectPoster(poster: Poster, width: number, height: number, position: [number, number] = [0.5, 0.5]) {
  const imageH = Math.max(height, width / poster.aspect);
  const imageW = imageH * poster.aspect;
  const offsetX = (width - imageW) * position[0];
  const offsetY = (height - imageH) * position[1];
  // Poster units are fractions of the poster's height around its centre; screen units are the same around the screen's.
  const x = (u: number) => (offsetX + imageW / 2 + u * imageH - width / 2) / height;
  const y = (v: number) => (height / 2 - (offsetY + imageH / 2 - v * imageH)) / height;
  const k = imageH / height;
  const { ring, rot, sun, planet } = poster.layout;
  return {
    ring: [x(ring[0]), y(ring[1]), ring[2] * k, ring[3]] as SkyLayout["ring"],
    rot,
    sun: [x(sun[0]), y(sun[1])] as SkyLayout["sun"],
    planet: [x(planet[0]), y(planet[1]), planet[2] * k] as SkyLayout["planet"],
  };
}
