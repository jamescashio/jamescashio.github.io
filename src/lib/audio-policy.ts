export type AirframeAudioTrigger =
  | "pip"
  | "lineage"
  | "first-gesture"
  | "scroll"
  | "deck-nav"
  | "tour";

export const DEFAULT_AUDIO_ENABLED = false;

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
