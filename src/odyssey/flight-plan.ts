import type { WorldInput } from "./sovereign-model";
import type { FlightShot } from "./flight-shots";
import type { ShipView } from "./world-renderer";

export const FLIGHT_DURATION_MS = 30_000;
export const FIRST_FLIGHT = [
  {
    id: "board",
    durationMs: 5_000,
    shot: "arrival",
    title: "Your ship. Your boundary.",
    copy: "Twelve requests. Six contain private information. In this hybrid model, the private six stay aboard; the public six can use the cloud.",
    takeaway: "You decide where the work happens.",
    view: "hero",
    hull: false,
    zone: "human",
    input: { architecture: "hybrid", sensitivity: "mixed", connected: true, allowPrivateEgress: false },
  },
  {
    id: "hull",
    durationMs: 6_500,
    shot: "inside",
    title: "Open it. Understand it.",
    copy: "The hull opens to reveal the onboard AI bay. Owned compute is a capability you can inspect, operate, and keep within your boundary.",
    takeaway: "The architecture should explain itself.",
    view: "top",
    hull: true,
    zone: "local",
    input: { architecture: "hybrid", sensitivity: "mixed", connected: true, allowPrivateEgress: false },
  },
  {
    id: "blackout",
    durationMs: 11_000,
    shot: "isolation",
    title: "Cut the cloud. Keep going.",
    copy: "The relay is disconnected. All twelve requests now stay aboard. This illustration assumes the local models and hardware can handle the workload.",
    takeaway: "A deliberate fallback earns its place.",
    view: "hero",
    hull: true,
    zone: "local",
    input: { architecture: "hybrid", sensitivity: "mixed", connected: false, allowPrivateEgress: false },
  },
  {
    id: "permission",
    durationMs: 7_500,
    shot: "command",
    title: "The final say is yours.",
    copy: "Now choose cloud-only processing for twelve private requests. With permission off, all twelve wait. A system should explain its boundary—and honor it.",
    takeaway: "Powerful tools. A human in command.",
    view: "hero",
    hull: false,
    zone: "human",
    input: { architecture: "cloud", sensitivity: "private", connected: true, allowPrivateEgress: false },
  },
] satisfies Array<{
  id: string;
  durationMs: number;
  title: string;
  copy: string;
  takeaway: string;
  view: ShipView;
  shot: FlightShot;
  hull: boolean;
  zone: "human" | "local";
  input: WorldInput;
}>;

export function flightStepIndex(id: string) {
  const found = FIRST_FLIGHT.findIndex((step) => step.id === id);
  return found < 0 ? 0 : found;
}

/** A bounded URL contract. Invalid or incomplete inputs never become a scenario. */
export function parseMissionHash(hash: string): WorldInput | null {
  const match = hash.match(
    /^#mission=(sovereign|hybrid|cloud)\.(mixed|private|public)\.(connected|offline)\.(held|permitted)$/,
  );
  if (!match || match[0] !== hash) return null;
  return {
    architecture: match[1] as WorldInput["architecture"],
    sensitivity: match[2] as WorldInput["sensitivity"],
    connected: match[3] === "connected",
    allowPrivateEgress: match[4] === "permitted",
  };
}

export function missionHash(input: WorldInput) {
  return `#mission=${input.architecture}.${input.sensitivity}.${input.connected ? "connected" : "offline"}.${input.allowPrivateEgress ? "permitted" : "held"}`;
}
