export type AirframeAudioTrigger =
  | "pip"
  | "lineage"
  | "first-gesture"
  | "scroll"
  | "deck-nav"
  | "tour";

export const DEFAULT_AUDIO_ENABLED = false;

export const AIRFRAME_SAMPLE_NAMES = [
  "x1",
  "sr71",
  "proteus",
  "starship",
  "epstein",
  "warp",
  "fold",
  "p51",
] as const;

const DELIBERATE_TRIGGERS = new Set<AirframeAudioTrigger>(["pip", "lineage"]);

export function canPlayAirframe({
  enabled,
  armed,
  trigger,
}: {
  enabled: boolean;
  armed: boolean;
  trigger: AirframeAudioTrigger;
}) {
  return enabled && armed && DELIBERATE_TRIGGERS.has(trigger);
}
