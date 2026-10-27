import { useEffect } from "react";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";

let leaseId = 0;
// Each effect owns its request, including when acquisition completes after
// cleanup. Never release an unacquired tag or a newer effect's screen lock.
export function acquireRuntimeKeepAwake(active: boolean, tag: string) {
  if (!active) return;
  const leaseTag = `${tag}-${++leaseId}`;
  const acquired = activateKeepAwakeAsync(leaseTag).then(() => true, () => false);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    void acquired.then(async (ok) => {
      if (ok) await deactivateKeepAwake(leaseTag).catch(error => console.warn("Roundr: screen lock release failed", error));
    });
  };
}

export function useRuntimeKeepAwake(active: boolean, tag: string) {
  useEffect(() => acquireRuntimeKeepAwake(active, tag), [active, tag]);
}
