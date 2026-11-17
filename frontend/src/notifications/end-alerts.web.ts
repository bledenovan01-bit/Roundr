// Web build: Roundr in a browser plays its own sounds while the tab is open.
// expo-notifications cannot schedule local alerts on the web, so it is not
// loaded at all here.
import type { EndAlertPlan } from "./end-alert-plan";

export function syncEndAlerts(_owner: string, _plan: EndAlertPlan | null) {}
