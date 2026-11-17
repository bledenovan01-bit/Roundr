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

// Asked once, the first time a running chrono needs a signal.
function allowed(): Promise<boolean> {
  if (!permission) {
    permission = Notifications.getPermissionsAsync()
      .then(async (current) => {
        if (current.granted) return true;
        if (!current.canAskAgain) return false;
        return (await Notifications.requestPermissionsAsync()).granted;
      })
      .catch(() => false);
  }
  return permission;
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
