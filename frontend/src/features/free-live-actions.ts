import { freeCommand, type FreeCommand } from "./free-live-state";
import { getStoreState, setFreeTimer } from "@/src/store/session-store";
// Resolve the latest durable session when a user command occurs, not during render.
export function dispatchFreeCommand(action: FreeCommand) {
  const current = getStoreState().freeTimer;
  if (current) setFreeTimer(freeCommand(current, action, Date.now()));
}
