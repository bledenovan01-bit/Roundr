// Local notifications for the end of a period or a free timer step, so the
// signal still reaches the touchline when the phone is locked or Roundr is in
// the background. In the foreground Roundr plays its own sounds, so the
// notification stays silent and hidden there.
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { AndroidImportance } from "expo-notifications";
import type { EndAlertPlan } from "./end-alert-plan";

const CHANNEL = "roundr-end";
const scheduled: Record<string, string[]> = {};
const signatures: Record<string, string> = {};
let queue: Promise<void> = Promise.resolve();
let configured = false;
let permission: Promise<boolean> | null = null;

function configure() {
  if (configured) return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: false, shouldShowList: false, shouldPlaySound: false, shouldSetBadge: false }),
  });
  if (Platform.OS === "android") {
    void Notifications.setNotificationChannelAsync(CHANNEL, {
      name: "Fin du chrono",
      description: "Signale la fin d'une période ou d'un chrono quand l'écran est verrouillé.",
      importance: AndroidImportance.HIGH,
      sound: "default",
      vibrationPattern: [0, 400, 200, 400],
    }).catch(() => {});
  }
}

export type EndAlertPermission = "granted" | "undetermined" | "denied" | "unsupported";

/** Current permission, without asking. */
export function endAlertPermission(): Promise<EndAlertPermission> {
  return Notifications.getPermissionsAsync()
    .then((current): EndAlertPermission => current.granted ? "granted" : current.canAskAgain ? "undetermined" : "denied")
    .catch((): EndAlertPermission => "unsupported");
}

/**
 * Shows the system prompt. Only called after Roundr has explained why, from
 * the sheet shown before the first start: never by the scheduler itself.
 */
export function requestEndAlertPermission(): Promise<boolean> {
  permission = Notifications.requestPermissionsAsync().then(result => result.granted).catch(() => false);
  return permission;
}

// Scheduling only uses a permission the user already gave.
function allowed(): Promise<boolean> {
  if (!permission) permission = Notifications.getPermissionsAsync().then(current => current.granted).catch(() => false);
  return permission.then(granted => {
    if (!granted) permission = null; // re-read later: the user may allow it in the phone settings
    return granted;
  });
}

/** Replaces the pending alerts of one owner ("match" or "free") with `plan`. */
export function syncEndAlerts(owner: string, plan: EndAlertPlan | null) {
  if (Platform.OS === "web") return;
  const signature = plan && plan.alerts.length ? JSON.stringify(plan) : "";
  if ((signatures[owner] ?? "") === signature) return;
  signatures[owner] = signature;
  queue = queue.then(async () => {
    configure();
    const previous = scheduled[owner] ?? [];
    scheduled[owner] = [];
    await Promise.all(previous.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
    if (!plan || !signature || !(await allowed())) return;
    if (signatures[owner] !== signature) return; // a newer plan replaced this one
    for (const alert of plan.alerts) {
      if (alert.at <= Date.now() + 1000) continue;
      try {
        const id = await Notifications.scheduleNotificationAsync({
          content: { title: alert.title, body: alert.body, sound: plan.sound },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: alert.at, channelId: CHANNEL },
        });
        scheduled[owner].push(id);
      } catch {
        // A refused alert must never break the match: the in-app signal remains.
      }
    }
  }).catch(() => {});
}
