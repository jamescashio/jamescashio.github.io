type CameraView = {
  time: number;
  close: number;
  reduced: boolean;
  pointer: { x: number; y: number };
};

// A camera over the original artwork. Time is owned by the existing bounded hero loop.
export function heroCameraTransform({ time, close, reduced, pointer }: CameraView) {
  const arrival = reduced ? 0.12 : (1 - Math.exp(-time / 5)) * 0.17;
  const drift = reduced ? 0 : Math.sin(time * 0.15) * 0.008;
  const scale = 1.025 + arrival + close * 0.22 + drift;
  const x = reduced ? 0 : Math.sin(time * 0.11) * 9 - pointer.x * 24;
  const y = reduced ? 0 : Math.sin(time * 0.14) * 5 - pointer.y * 16;
  const roll = reduced ? 0 : Math.sin(time * 0.1) * 0.18;
  return `translate3d(${x.toFixed(3)}px,${y.toFixed(3)}px,0) scale(${scale.toFixed(5)}) rotate(${roll.toFixed(4)}deg)`;
}
