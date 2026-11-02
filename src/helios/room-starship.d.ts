import type { RoomContext, RoomMission } from "./room-contract";
export const html: string;
export function mount(context: RoomContext): {
  render(): void;
  getState(): RoomMission;
  setMission(mission: RoomMission): void;
};
