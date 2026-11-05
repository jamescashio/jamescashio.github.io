/**
 * The front door's own events, typed once: the helm's decision, a film starting and a visitor's
 * E.V.E. command. Bit listens to all three; the sky listens to the helm.
 */
import type { Route } from "./route.ts";

declare global {
  interface DocumentEventMap {
    "v44:route": CustomEvent<Route>;
    "v44:film": CustomEvent<{ id: string; title: string }>;
    "v44:eve": CustomEvent<{ cmd: string }>;
  }
}
export {};
