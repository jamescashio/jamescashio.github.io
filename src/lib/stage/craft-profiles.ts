// ZeusApollo viewscreen stage.
// Craft profiles. Hulls are revolved from real fuselage profiles and extruded
// from real planform outlines at published length, span and diameter ratios.
// Every craft works in its own units; the stage normalizes scale through mag.
import * as THREE from "three";

import { bell, cap, cluster, fin, plan, plan2, revolve, ring, slab, tube } from "./geometry.ts";

/** A resting pose plus the look the stage settles into while this craft holds. */
export type CraftPose = {
  yaw: number;
  pitch: number;
  roll?: number;
  /** Idle drift multiplier. Lower is calmer. */
  motion?: number;
  /** Bloom strength multiplier while this craft is shown. */
  bloom?: number;
  /** Tone mapping exposure multiplier while this craft is shown. */
  exposure?: number;
};

export type CraftMaterial = {
  metal: number;
  rough: number;
  env?: number;
  emis?: number;
};

/** Per part livery multiplier. Receives a sampled surface point and the part index. */
export type LiveryFn = (x: number, y: number, z: number, partIndex: number) => [number, number, number];

export type CraftSpec = {
  /** Display name shown in the airframe readout. */
  name: string;
  /** Year the airframe first flew, or the in world date for fictional craft. */
  era: string;
  /** Base hull tint. */
  tint: number;
  mat: CraftMaterial;
  glowColor: number;
  /** [length, radius, color] of the exhaust plume. */
  exhaust: [number, number, number];
  livery?: LiveryFn;
  /** Optional wireframe overlay colour, drawn over the solids. */
  wire?: number;
  /** Opacity of the solid hull for this craft, when it needs to differ. */
  solidOpacity?: number;
  /** Opacity of the wireframe overlay for this craft. */
  wireOpacity?: number;
  /** Solid opacity used while the lineage deck holds the craft. */
  lineageSolidOpacity?: number;
  /** Wire opacity used while the lineage deck holds the craft. */
  lineageWireOpacity?: number;
  /** Resting pose and look, in radians and unit multipliers. */
  pose?: CraftPose;
  /** Builds the part geometries. Called once, lazily, when the craft is first needed. */
  build: () => THREE.BufferGeometry[];
  /** Scale magnitude used to normalize the craft into the stage frame.
   * Defaults to 1 when a craft does not need renormalizing. */
  mag?: number;
};

export const CRAFT: CraftSpec[] = [
  {
    // 0 — Bell X-1 "Glamorous Glennis". 31ft long, 28ft span, 4.7ft dia:
    // a .50-cal bullet with straight thin wings and a high-mounted tailplane.
    name: "BELL X-1",
    era: "1947",
    tint: 0xf2721c,
    mat: { metal: 0.4, rough: 0.48 },
    glowColor: 0xffb066,
    exhaust: [1.0, 0.3, 0xffb066],
    // international orange airframe, smoked canopy, steel nozzles, silver boom
    livery: (x, y, z, pi) =>
      pi === 5
        ? [0.2, 0.24, 0.3]
        : pi >= 6 && pi <= 9
          ? [0.42, 0.42, 0.46]
          : pi === 1
            ? [0.75, 0.76, 0.8]
            : pi === 10
              ? [0.5, 0.5, 0.54]
              : [1, 1, 1],
    build: () => [
      revolve(
        [
          [3.55, 0.02],
          [3.38, 0.1],
          [3.1, 0.2],
          [2.7, 0.3],
          [2.2, 0.385],
          [1.55, 0.44],
          [0.8, 0.468],
          [0.1, 0.47],
          [-0.75, 0.455],
          [-1.6, 0.41],
          [-2.35, 0.34],
          [-2.95, 0.27],
          [-3.3, 0.22],
          [-3.42, 0.21],
        ],
        26,
      ),
      revolve(
        [
          [4.15, 0.007],
          [3.62, 0.014],
          [3.55, 0.02],
        ],
        8,
      ),
      plan(
        [
          [0.72, 0],
          [0.55, 1.1],
          [0.42, 2.6],
          [0.3, 3.02],
          [0.02, 3.06],
          [-0.18, 2.62],
          [-0.34, 1.1],
          [-0.55, 0],
          [-0.34, -1.1],
          [-0.18, -2.62],
          [0.02, -3.06],
          [0.3, -3.02],
          [0.42, -2.6],
          [0.55, -1.1],
        ],
        0.075,
        -0.04,
      ),
      fin(
        [
          [-1.7, 0.28],
          [-2.1, 0.9],
          [-2.72, 1.52],
          [-3.18, 1.55],
          [-3.3, 0.24],
        ],
        0.08,
        0,
      ),
      plan(
        [
          [-2.42, 0],
          [-2.55, 1.22],
          [-2.9, 1.26],
          [-3.02, 0],
          [-2.9, -1.26],
          [-2.55, -1.22],
        ],
        0.07,
        0.95,
      ),
      (() => {
        const c = cap(0.3, 12, 1.35, 0.4, 0);
        c.scale(1.9, 0.35, 0.75);
        return c;
      })(),
      ...cluster(4, 0.145, (y, z) => bell(0.3, 0.06, 0.095, -3.52, y, z)),
      ring(0.225, 0.018, -3.42, 18),
    ],
    mag: 0.82,
  },
  {
    // 1 — Lockheed SR-71. 107ft long, 56ft span: one continuous ogee chine
    // from nose into a modified delta, dorsal spine, two mid-span nacelles
    // with inlet spikes and ejector nozzles, inward-canted all-moving fins.
    name: "SR-71 BLACKBIRD",
    era: "1964",
    tint: 0x2e323c,
    mat: { metal: 0.88, rough: 0.28, env: 3.2, emis: 0.24 },
    // black titanium; bare-metal spikes, warm inlet lips, scorched ejectors
    livery: (x, y, z, pi) =>
      pi === 6 || pi === 12
        ? [1.5, 1.42, 1.28]
        : pi === 7 || pi === 13
          ? [1.34, 1.22, 1.06]
          : pi === 9 || pi === 15
            ? [1.5, 1.12, 0.82]
            : pi === 8 || pi === 14
              ? [0.66, 0.64, 0.62]
              : pi === 3
                ? [0.52, 0.6, 0.74]
                : [1, 1, 1],
    glowColor: 0x8fd8ff,
    exhaust: [1.9, 0.34, 0xffb27a],
    build: () => {
      const parts = [
        plan(
          [
            [5.5, 0.0],
            [4.7, 0.16],
            [3.7, 0.32],
            [2.7, 0.44],
            [1.8, 0.56],
            [1.05, 0.72],
            [0.3, 1.04],
            [-0.6, 1.52],
            [-1.55, 2.06],
            [-2.45, 2.52],
            [-2.95, 2.7],
            [-3.38, 2.74],
            [-3.3, 2.12],
            [-3.52, 1.88],
            [-3.74, 1.62],
            [-3.74, 1.3],
            [-3.44, 1.06],
            [-3.32, 0.62],
            [-4.35, 0.44],
            [-5.22, 0.15],
            [-5.35, 0.0],
            [-5.22, -0.15],
            [-4.35, -0.44],
            [-3.32, -0.62],
            [-3.44, -1.06],
            [-3.74, -1.3],
            [-3.74, -1.62],
            [-3.52, -1.88],
            [-3.3, -2.12],
            [-3.38, -2.74],
            [-2.95, -2.7],
            [-2.45, -2.52],
            [-1.55, -2.06],
            [-0.6, -1.52],
            [0.3, -1.04],
            [1.05, -0.72],
            [1.8, -0.56],
            [2.7, -0.44],
            [3.7, -0.32],
            [4.7, -0.16],
          ],
          0.11,
          0,
        ),
        (() => {
          const f = revolve(
            [
              [5.48, 0.02],
              [5.0, 0.1],
              [4.2, 0.2],
              [3.2, 0.3],
              [2.3, 0.36],
              [1.2, 0.4],
              [-0.4, 0.4],
              [-2.0, 0.37],
              [-3.4, 0.3],
              [-4.6, 0.2],
              [-5.3, 0.12],
            ],
            22,
          );
          f.scale(1, 0.6, 1);
          f.translate(0, 0.06, 0);
          return f;
        })(),
        revolve(
          [
            [6.3, 0.006],
            [5.62, 0.014],
            [5.48, 0.02],
          ],
          8,
        ),
        (() => {
          const c = cap(0.26, 14, 2.95, 0.22, 0);
          c.scale(2.1, 0.6, 0.72);
          return c;
        })(),
        (() => {
          const s2 = revolve(
            [
              [2.3, 0.16],
              [0.5, 0.185],
              [-2.0, 0.17],
              [-4.2, 0.12],
              [-5.05, 0.07],
            ],
            12,
          );
          s2.scale(1, 0.5, 0.8);
          s2.translate(0, 0.18, 0);
          return s2;
        })(),
      ];
      for (const z of [1.58, -1.58]) {
        parts.push(
          revolve(
            [
              [1.55, 0.3],
              [1.3, 0.42],
              [0.6, 0.48],
              [-0.8, 0.48],
              [-2.2, 0.44],
              [-3.1, 0.38],
              [-3.45, 0.33],
            ],
            18,
          ).translate(0, -0.02, z),
        );
        parts.push(
          revolve(
            [
              [2.45, 0.02],
              [2.05, 0.13],
              [1.7, 0.24],
              [1.45, 0.3],
            ],
            14,
          ).translate(0, -0.02, z),
        );
        parts.push(ring(0.435, 0.02, 1.42, 20, -0.02, z));
        parts.push(bell(0.55, 0.37, 0.3, -3.6, -0.02, z));
        parts.push(ring(0.37, 0.018, -3.86, 18, -0.02, z));
        parts.push(
          fin(
            [
              [-1.45, 0.3],
              [-2.05, 1.24],
              [-2.85, 1.34],
              [-3.1, 0.28],
            ],
            0.09,
            z,
            z > 0 ? -0.28 : 0.28,
          ),
        );
      }
      return parts;
    },
    mag: 1.02,
  },
  {
    // 2 — Scaled Composites Model 281 Proteus. 56ft 4in long, 77.6ft main
    // span, 54.7ft canard span: tandem gull wings, twin booms, two FJ44s.
    name: "PROTEUS",
    era: "1998 · RUTAN",
    tint: 0xb8c7d2,
    mat: { metal: 0.18, rough: 0.64, env: 0.82, emis: 0.015 },
    glowColor: 0x7ed9ee,
    wire: 0x45a8c2,
    // A settled, restrained three-quarter pose makes the tandem planform legible.
    pose: { yaw: -0.62, pitch: 0.42, roll: -0.035, motion: 0.2, bloom: 0.2, exposure: 0.64 },
    solidOpacity: 0.64,
    wireOpacity: 0.58,
    lineageSolidOpacity: 0.08,
    lineageWireOpacity: 0.95,
    // No theatrical exhaust: a high-altitude turbofan does not leave a rocket plume.
    exhaust: [0, 0.18, 0xa9dfff],
    livery: (x, y, z, pi) =>
      pi === 1
        ? [0.055, 0.1, 0.15]
        : pi === 12 || pi === 15
          ? [0.16, 0.18, 0.2]
          : pi === 11 || pi === 14
            ? [0.52, 0.58, 0.62]
            : pi === 10 || pi === 13
              ? [0.66, 0.72, 0.76]
              : pi === 8 || pi === 9
                ? [0.54, 0.6, 0.64]
                : pi === 6 || pi === 7
                  ? [0.64, 0.7, 0.74]
                  : pi === 16
                    ? [0.48, 0.55, 0.62]
                    : pi >= 2 && pi <= 5 && Math.abs(z) > 4.45
                      ? [0.12, 0.17, 0.2]
                      : pi >= 2 && pi <= 5
                        ? [0.84, 0.89, 0.92]
                        : [0.9, 0.93, 0.95],
    build: () => {
      const gull = (side: number) => {
        const root = 1.52 * side;
        const tip = 5.42 * side;
        const panel = plan(
          [
            [0.04, root],
            [-0.24, 3.25 * side],
            [-0.72, tip],
            [-1.28, tip],
            [-1.38, 3.2 * side],
            [-1.52, root],
          ],
          0.09,
          0.08,
        );
        panel.translate(0, 0, -root);
        panel.rotateX(side * -0.075);
        panel.translate(0, 0, root);
        return panel;
      };
      const parts = [
        revolve(
          [
            [4.22, 0.025],
            [4.0, 0.13],
            [3.62, 0.28],
            [3.05, 0.44],
            [2.15, 0.56],
            [0.85, 0.58],
            [-0.45, 0.54],
            [-1.65, 0.43],
            [-2.52, 0.29],
            [-3.02, 0.14],
          ],
          26,
        ), // pressure cabin
        (() => {
          const c = cap(0.34, 14, 0, 0, 0);
          c.scale(2.25, 0.48, 0.92);
          c.translate(2.3, 0.43, 0);
          return c;
        })(),
        plan(
          [
            [2.72, 0],
            [2.48, 1.34],
            [2.12, 3.72],
            [1.68, 3.84],
            [1.3, 1.34],
            [1.02, 0],
            [1.3, -1.34],
            [1.68, -3.84],
            [2.12, -3.72],
            [2.48, -1.34],
          ],
          0.075,
          0.02,
        ),
        plan(
          [
            [0.2, 0],
            [0.04, 1.52],
            [-1.52, 1.52],
            [-1.72, 0],
            [-1.52, -1.52],
            [0.04, -1.52],
          ],
          0.11,
          0.06,
        ), // main wing centre
        gull(1),
        gull(-1),
        revolve(
          [
            [0.4, 0.13],
            [-0.4, 0.16],
            [-2.1, 0.17],
            [-3.62, 0.14],
            [-4.12, 0.08],
          ],
          14,
        ).translate(0, 0.1, 1.38),
        revolve(
          [
            [0.4, 0.13],
            [-0.4, 0.16],
            [-2.1, 0.17],
            [-3.62, 0.14],
            [-4.12, 0.08],
          ],
          14,
        ).translate(0, 0.1, -1.38),
        fin(
          [
            [-2.72, 0.12],
            [-3.08, 0.92],
            [-3.7, 1.38],
            [-4.08, 0.14],
          ],
          0.075,
          1.38,
          -0.05,
        ),
        fin(
          [
            [-2.72, 0.12],
            [-3.08, 0.92],
            [-3.7, 1.38],
            [-4.08, 0.14],
          ],
          0.075,
          -1.38,
          0.05,
        ),
      ];
      for (const z of [0.58, -0.58]) {
        parts.push(
          revolve(
            [
              [0.58, 0.09],
              [0.38, 0.23],
              [0.05, 0.3],
              [-0.82, 0.31],
              [-1.7, 0.27],
              [-2.18, 0.16],
            ],
            18,
          ).translate(0, 0.32, z),
        );
        parts.push(ring(0.235, 0.026, 0.38, 20, 0.32, z));
        parts.push(bell(0.28, 0.145, 0.2, -2.3, 0.32, z));
      }
      const pod = revolve(
        [
          [1.55, 0.04],
          [1.32, 0.2],
          [0.82, 0.3],
          [-0.62, 0.31],
          [-1.18, 0.22],
          [-1.42, 0.05],
        ],
        16,
      );
      pod.scale(1, 0.72, 0.78);
      pod.translate(0, -0.48, 0);
      parts.push(pod);
      return parts;
    },
    mag: 0.88,
  },
  {
    // 3 — Starship full stack. 121m, 9m dia: Ship with two fore and two aft
    // flaps, hot-stage ring, Super Heavy with 33 Raptors and four grid fins.
    name: "STARSHIP",
    era: "2023",
    tint: 0xbcc6d6,
    mat: { metal: 0.96, rough: 0.18, env: 2.2 },
    glowColor: 0x9fd0ff,
    exhaust: [3.2, 0.4, 0x9fd0ff],
    // stainless with the black tile belly on Ship and both flap sets
    livery: (x, y, z, pi) =>
      (pi === 0 || pi === 5 || pi === 6) && z > 0.05
        ? [0.09, 0.09, 0.11]
        : pi === 1 && x < -5.2
          ? [0.5, 0.46, 0.44]
          : pi === 2
            ? [0.4, 0.4, 0.44]
            : pi >= 7 && pi <= 10
              ? [0.4, 0.41, 0.45]
              : pi >= 11
                ? [0.4, 0.31, 0.26]
                : [1, 1, 1],
    build: () => {
      const parts = [
        revolve(
          [
            [6.7, 0.03],
            [6.46, 0.14],
            [6.1, 0.27],
            [5.64, 0.38],
            [5.1, 0.46],
            [4.6, 0.494],
            [4.2, 0.5],
            [1.95, 0.5],
          ],
          28,
        ), // Ship
        revolve(
          [
            [1.7, 0.5],
            [-5.9, 0.5],
            [-6.36, 0.485],
          ],
          28,
        ), // Super Heavy
        ring(0.525, 0.055, 1.82, 30), // hot-stage ring
        ring(0.505, 0.014, 3.1, 30),
        ring(0.505, 0.014, -3.4, 30),
        plan2(
          [
            [4.3, 0.44],
            [4.14, 0.8],
            [3.62, 0.8],
            [3.48, 0.46],
          ],
          0.1,
          0.3,
        ),
        plan2(
          [
            [2.66, 0.46],
            [2.48, 0.94],
            [1.72, 0.94],
            [1.56, 0.48],
          ],
          0.12,
          -0.28,
        ),
      ];
      parts.push(...cluster(4, 0.72, (y, z, a) => slab(0.5, 0.44, 0.06, 1.18, y, z, 0, a)));
      parts.push(...cluster(20, 0.42, (y, z) => bell(0.4, 0.055, 0.095, -6.6, y, z)));
      parts.push(...cluster(10, 0.27, (y, z) => bell(0.44, 0.06, 0.1, -6.62, y, z)));
      parts.push(...cluster(3, 0.11, (y, z) => bell(0.5, 0.07, 0.115, -6.66, y, z)));
      return parts;
    },
  },
  {
    // 4 — Rocinante, the first Epstein-drive corvette: a hexagonal-section
    // spearhead hull that flares into the drive cone. Torch, not thrust.
    name: "EPSTEIN DRIVE",
    era: "THE EXPANSE",
    tint: 0x7f8b9c,
    mat: { metal: 0.8, rough: 0.38 },
    glowColor: 0x9fe8ff,
    exhaust: [8.0, 0.28, 0x9fe8ff],
    // MCRN grey-on-grey: lighter prow armor, black keel rail, scorched drive
    livery: (x, y, z, pi) =>
      pi === 1
        ? [0.34, 0.31, 0.29]
        : pi === 5
          ? [0.22, 0.22, 0.26]
          : pi >= 2 && pi <= 4
            ? [0.62, 0.64, 0.7]
            : pi === 0 && x > 2.8
              ? [1.22, 1.18, 1.12]
              : [1, 1, 1],
    build: () => {
      const parts = [
        revolve(
          [
            [4.6, 0.04],
            [4.34, 0.22],
            [3.88, 0.42],
            [3.18, 0.6],
            [2.2, 0.74],
            [0.8, 0.82],
            [-0.8, 0.84],
            [-2.0, 0.8],
            [-2.74, 0.72],
            [-2.96, 0.55],
            [-3.16, 0.5],
            [-3.36, 0.48],
          ],
          6,
          Math.PI / 6,
        ),
        bell(1.05, 0.44, 0.88, -3.9, 0, 0),
        ring(0.5, 0.05, -3.36, 6),
        ring(0.86, 0.05, -2.05, 6),
        ring(0.8, 0.04, 0.6, 6),
        slab(3.6, 0.07, 0.16, 1.0, -0.86, 0), // keel railgun rail
        fin(
          [
            [0.4, 0.82],
            [-0.6, 1.16],
            [-2.3, 1.16],
            [-2.6, 0.78],
          ],
          0.08,
          0,
        ),
        fin(
          [
            [0.4, -0.82],
            [-0.6, -1.16],
            [-2.3, -1.16],
            [-2.6, -0.78],
          ],
          0.08,
          0,
        ),
      ];
      for (const z of [0.66, -0.66]) {
        for (const x of [1.5, -0.5]) {
          const t = cap(0.17, 10, x, 0.5, z);
          t.scale(1.3, 0.8, 1);
          parts.push(t);
        }
      }
      return parts;
    },
  },
  {
    // 5 — Cochrane's Phoenix. Converted launch core with a compact command
    // module and twin warp nacelles on swept industrial pylons.
    name: "PHOENIX",
    era: "2063 · COCHRANE",
    tint: 0xc8d0da,
    mat: { metal: 0.78, rough: 0.42, env: 1.28, emis: 0.025 },
    pose: { yaw: -0.38, pitch: 0.12, roll: -0.06, motion: 0.22, bloom: 0.44, exposure: 0.78 },
    solidOpacity: 0.9,
    wireOpacity: 0.14,
    glowColor: 0x58e8f4,
    exhaust: [0, 0.14, 0x66fff8],
    // Missile silver, scorched bell, a dark cockpit, gunmetal nacelles,
    // amber collectors, and cyan coils. The light stays on the machinery.
    livery: (x, y, z, pi) =>
      pi === 2
        ? [0.34, 0.3, 0.26]
        : pi === 6
          ? [0.08, 0.14, 0.2]
          : pi === 7
            ? [0.38, 0.43, 0.51]
            : pi === 9 || pi === 14
              ? [1.34, 0.58, 0.18]
              : pi === 10 || pi === 15
                ? [0.18, 1.12, 1.36]
                : pi === 8 || pi === 13
                  ? [0.42, 0.48, 0.57]
                  : pi === 11 || pi === 16
                    ? [0.56, 0.6, 0.68]
                    : pi === 12 || pi === 17
                      ? [1.18, 0.68, 0.28]
                      : pi >= 3 && pi <= 5
                        ? [0.58, 0.62, 0.68]
                        : pi === 0 && x > 3.7
                          ? [1.12, 1.09, 1.04]
                          : [0.92, 0.95, 1.0],
    build: () => {
      const parts = [
        revolve(
          [
            [4.95, 0.012],
            [4.8, 0.08],
            [4.58, 0.2],
            [4.28, 0.34],
            [3.92, 0.44],
            [3.6, 0.47],
            [3.36, 0.43],
          ],
          26,
        ), // command module
        revolve(
          [
            [3.36, 0.36],
            [3.18, 0.39],
            [2.7, 0.41],
            [1.4, 0.42],
            [-2.1, 0.42],
            [-2.55, 0.38],
            [-2.9, 0.28],
            [-3.08, 0.2],
          ],
          26,
        ),
        bell(0.72, 0.18, 0.5, -3.48, 0, 0),
        ring(0.16, 0.03, 4.92, 14),
        ring(0.425, 0.02, 1.4, 24),
        ring(0.425, 0.02, -0.9, 24),
        slab(0.32, 0.11, 0.36, 4.15, 0.4, 0), // cockpit window
      ];
      parts.push(
        plan2(
          [
            [1.42, 0.36],
            [0.76, 1.92],
            [-0.92, 1.92],
            [-1.48, 0.38],
          ],
          0.075,
          0.08,
        ),
      ); // swept pylon pair
      for (const z of [2.04, -2.04]) {
        const y = 0.18;
        parts.push(
          revolve(
            [
              [2.84, 0.025],
              [2.64, 0.12],
              [2.38, 0.24],
              [2.1, 0.22],
              [1.76, 0.29],
              [0.45, 0.32],
              [-1.24, 0.32],
              [-2.16, 0.27],
              [-2.68, 0.15],
              [-2.98, 0.045],
            ],
            22,
          ).translate(-0.08, y, z),
        ); // nacelle
        const bus = new THREE.SphereGeometry(0.235, 18, 12);
        bus.scale(1.28, 1, 1);
        bus.translate(2.48, y, z);
        parts.push(bus); // bussard
        parts.push(slab(2.44, 0.12, 0.045, -0.14, y + 0.02, z + (z > 0 ? -0.32 : 0.32))); // coil
        parts.push(ring(0.282, 0.018, -2.1, 18, y, z));
        parts.push(ring(0.228, 0.038, 2.12, 18, y, z)); // collector collar
      }
      return parts;
    },
    mag: 1.34,
  },
  {
    // 6 — Guild heighliner: a colossal ribbed cylinder, blunt at both ends.
    // It does not fly to you. It folds the space between.
    name: "HEIGHLINER",
    era: "DUNE · FOLD SPACE",
    tint: 0xb59357,
    mat: { metal: 0.52, rough: 0.6, env: 1.4, emis: 0.05 },
    glowColor: 0xffcc00,
    // Guild bronze: darker structural ribs, shadowed hangar bays, hot fold array
    livery: (x, y, z, pi) =>
      pi >= 1 && pi <= 11
        ? [0.66, 0.6, 0.5]
        : pi >= 20 && pi < 40 && (pi - 20) % 2 === 0
          ? [0.15, 0.14, 0.12]
          : pi >= 51
            ? [1.12, 0.92, 0.64]
            : pi >= 12 && pi <= 19
              ? [0.8, 0.74, 0.62]
              : [1, 1, 1],
    wire: 0xffcc00,
    exhaust: [0, 0, 0xffcc00],
    build: () => {
      const parts = [
        revolve(
          [
            [5.6, 0.5],
            [5.5, 1.0],
            [5.3, 1.3],
            [4.9, 1.45],
            [4.2, 1.52],
            [2.5, 1.55],
            [0.0, 1.55],
            [-2.5, 1.55],
            [-4.2, 1.52],
            [-4.9, 1.45],
            [-5.3, 1.28],
            [-5.55, 0.9],
            [-5.62, 0.55],
          ],
          40,
        ),
      ];
      for (let i = 0; i < 11; i++) {
        const x = -4.6 + i * 0.92;
        parts.push(ring(1.57 + (i > 7 ? 0.03 : 0), 0.05 + (i > 7 ? 0.025 : 0), x, 40));
      }
      parts.push(...cluster(8, 1.555, (y, z, a) => slab(9.4, 0.1, 0.36, 0, y, z, 0, a)));
      for (const z of [1, -1]) {
        for (let i = 0; i < 5; i++) {
          const x = -3.2 + i * 1.6;
          parts.push(slab(0.98, 0.5, 0.26, x, 0.1, z * 1.49, 0, 0));
          parts.push(slab(1.06, 0.06, 0.28, x, 0.42, z * 1.5, 0, 0));
        }
      }
      parts.push(...cluster(4, 1.66, (y, z, a) => slab(1.9, 0.42, 1.05, 2.2, y, z, 0, a)));
      parts.push(...cluster(4, 1.62, (y, z, a) => slab(1.2, 0.32, 0.75, -3.4, y, z, 0, a + 0.4)));
      parts.push(ring(0.72, 0.09, 5.62, 26));
      parts.push(ring(1.02, 0.1, -5.58, 30), ring(0.66, 0.07, -5.66, 22));
      parts.push(...cluster(6, 0.85, (y, z) => bell(0.75, 0.17, 0.32, -6.05, y, z)));
      parts.push(tube(0.1, 0.52, 0.52, 22, -5.72, 0, 0));
      return parts;
    },
    mag: 1.42,
  },
  {
    // 7 — North American P-51D Mustang. The laminar-flow wing, bubble canopy,
    // ventral radiator scoop, four-blade propeller and tall fin must read first.
    name: "P-51D MUSTANG",
    era: "1944 · HOOVER",
    tint: 0xbfc7ce,
    mat: { metal: 0.84, rough: 0.32, env: 1.7, emis: 0.015 },
    glowColor: 0x9fdfff,
    wire: 0x67bed0,
    pose: { yaw: -0.58, pitch: 0.28, roll: -0.08, motion: 0.22, bloom: 0.24, exposure: 0.72 },
    solidOpacity: 0.72,
    wireOpacity: 0.56,
    lineageSolidOpacity: 0.07,
    lineageWireOpacity: 0.96,
    exhaust: [0, 0.12, 0xb9e8ff],
    // Polished aluminum, a red fin and spinner, dark canopy and propeller.
    livery: (x, y, z, pi) =>
      pi === 1 || pi === 4
        ? [1.18, 0.16, 0.12]
        : pi === 5
          ? [0.06, 0.12, 0.17]
          : pi === 6 || pi === 7 || pi === 8
            ? [0.14, 0.16, 0.18]
            : [0.9, 0.94, 0.98],
    build: () => [
      revolve(
        [
          [4.05, 0.035],
          [3.7, 0.18],
          [3.08, 0.34],
          [2.1, 0.42],
          [0.78, 0.46],
          [-0.54, 0.44],
          [-1.72, 0.38],
          [-2.78, 0.29],
          [-3.42, 0.2],
          [-3.72, 0.12],
        ],
        26,
      ),
      revolve(
        [
          [4.42, 0.025],
          [4.25, 0.2],
          [4.02, 0.3],
        ],
        18,
      ),
      plan(
        [
          [1.35, 0],
          [1.02, 1.18],
          [0.42, 3.84],
          [-0.32, 3.78],
          [-0.92, 1.06],
          [-1.22, 0],
          [-0.92, -1.06],
          [-0.32, -3.78],
          [0.42, -3.84],
          [1.02, -1.18],
        ],
        0.1,
        -0.02,
      ),
      plan(
        [
          [-2.48, 0],
          [-2.58, 1.08],
          [-3.12, 1.68],
          [-3.46, 1.64],
          [-3.55, 0],
          [-3.46, -1.64],
          [-3.12, -1.68],
          [-2.58, -1.08],
        ],
        0.075,
        0.22,
      ),
      fin(
        [
          [-2.05, 0.2],
          [-2.42, 1.12],
          [-3.05, 1.66],
          [-3.58, 1.56],
          [-3.67, 0.16],
        ],
        0.08,
        0,
      ),
      (() => {
        const c = cap(0.34, 16, 0.74, 0.43, 0);
        c.scale(2.25, 0.72, 0.88);
        return c;
      })(),
      (() => {
        const s = revolve(
          [
            [0.2, 0.06],
            [-0.2, 0.18],
            [-0.68, 0.22],
            [-1.02, 0.1],
          ],
          14,
        );
        s.scale(1, 0.72, 0.78);
        s.translate(-0.12, -0.46, 0);
        return s;
      })(),
      slab(0.055, 2.24, 0.12, 4.38, 0, 0, 0, 0, 0.18),
      slab(0.055, 0.12, 2.24, 4.38, 0, 0, 0, 0.18, 0),
      ring(0.3, 0.018, 4.04, 20),
    ],
    mag: 0.9,
  },
];
