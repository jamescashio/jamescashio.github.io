export type ViewportBounds = {
  width: number;
  height: number;
};

export type ElementBounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

const AIRFRAME_BREAKPOINT = 768;
const MOBILE_NAV_BREAKPOINT = 768;
const FULL_HUD_WIDTH = 376;
const FULL_HUD_HEIGHT = 172;
const BIT_HUD_SIZE = 104;
const HUD_EDGE = 16;
const MOBILE_NAV_CLEARANCE = 80;
const CLEARANCE = 10;

function fullHudBounds({ width, height }: ViewportBounds): ElementBounds | null {
  if (width <= 0 || height <= 0) return null;
  const mobileBitOnly = width < AIRFRAME_BREAKPOINT;
  const hudWidth = mobileBitOnly ? BIT_HUD_SIZE : Math.min(FULL_HUD_WIDTH, width - HUD_EDGE * 2);
  const hudHeight = mobileBitOnly ? BIT_HUD_SIZE : FULL_HUD_HEIGHT;
  const bottomEdge = width < MOBILE_NAV_BREAKPOINT ? MOBILE_NAV_CLEARANCE : HUD_EDGE;
  return {
    left: width - HUD_EDGE - hudWidth,
    top: Math.max(HUD_EDGE, height - bottomEdge - hudHeight),
    right: width - HUD_EDGE,
    bottom: height - bottomEdge,
  };
}

function intersects(a: ElementBounds, b: ElementBounds, clearance = 0) {
  return (
    a.left < b.right + clearance &&
    a.right > b.left - clearance &&
    a.top < b.bottom + clearance &&
    a.bottom > b.top - clearance
  );
}

export function shouldYieldAirframeHud(viewport: ViewportBounds, targets: ElementBounds[]) {
  const hud = fullHudBounds(viewport);
  if (!hud) return false;
  return targets.some(
    (target) =>
      target.right > 0 &&
      target.left < viewport.width &&
      target.bottom > 0 &&
      target.top < viewport.height &&
      intersects(hud, target, CLEARANCE),
  );
}
