// Web build: Roundr in a browser plays its own sounds while the tab is open.
// expo-notifications cannot schedule local alerts on the web, so it is not
// loaded at all here.
import type { EndAlertPlan } from "./end-alert-plan";

export type EndAlertPermission = "granted" | "undetermined" | "denied" | "unsupported";

export function syncEndAlerts(_owner: string, _plan: EndAlertPlan | null) {}

export function endAlertPermission(): Promise<EndAlertPermission> {
  return Promise.resolve("unsupported");
}

export function requestEndAlertPermission(): Promise<boolean> {
  return Promise.resolve(false);
}
