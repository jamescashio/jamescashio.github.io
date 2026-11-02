import type { WorldInput, computeWorldOutcome } from "../odyssey/sovereign-model";
import type { routeExample } from "../odyssey/data";
export interface RoomMission {
  arch: WorldInput["architecture"];
  sens: WorldInput["sensitivity"];
  net: boolean;
  permit: boolean;
}
export interface RoomScenes {
  attachRoom(room: HTMLElement): void;
  renderFlow(
    result: Pick<ReturnType<typeof computeWorldOutcome>, "local" | "cloud" | "held">,
    state: Pick<RoomMission, "arch" | "net">,
  ): void;
  flowVisible(): boolean | undefined;
  rotateEngine(angle: number): void;
  selectPrinciple(index: number): void;
  updateRequest(request: Parameters<typeof routeExample>[0]): void;
  traceRequest(): void;
  selectAtlas(node?: string): void;
}
export interface RoomContext {
  scenes: RoomScenes;
  motion(): boolean;
  say(title: string, message: string, mood?: string, duration?: number): void;
  copy(value: string, message?: string): Promise<void>;
}
export interface RoomModule {
  mount?: (context: RoomContext) => { setMission(mission: RoomMission): void } | void;
}
