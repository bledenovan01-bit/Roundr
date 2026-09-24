import * as Notifications from "expo-notifications";
import { AppState, Platform } from "react-native";
import { useSyncExternalStore } from "react";
import type { Session } from "../domain/types";
import { notificationPlan } from "./notification-plan";

let message: string | null = "Activer les alertes écran verrouillé";
const listeners = new Set<() => void>();
function setMessage(value: string | null) { message = value; listeners.forEach(l => l()); }
export function useNotificationMessage() { return useSyncExternalStore(l => { listeners.add(l); return () => { listeners.delete(l); }; }, () => message, () => null); }
let tail: Promise<unknown> = Promise.resolve();
let fingerprint = "";
let latest: Session | null = null;
Notifications.setNotificationHandler({
  handleNotification: async () => {
    const background = AppState.currentState !== "active";
    return { shouldShowBanner: background, shouldShowList: background, shouldPlaySound: background, shouldSetBadge: false };
  },
});
async function channels() {
  if (Platform.OS !== "android") return;
  for (const key of ["whistle", "final", "prep", "alert180", "alert120", "alert60", "alert30"]) {
    await Notifications.setNotificationChannelAsync(`roundr-${key}`, { name: key === "final" ? "Fin de match" : "Alertes Roundr", importance: Notifications.AndroidImportance.HIGH, sound: key + ".wav", enableVibrate: true });
  }
}
export async function requestMatchNotifications() {
  try {
    await channels();
    const permission = await Notifications.requestPermissionsAsync();
    setMessage(permission.granted ? null : "Alertes verrouillées désactivées dans les réglages du téléphone.");
    fingerprint = "";
    syncMatchNotifications(latest);
  } catch { setMessage("Alertes verrouillées indisponibles sur cette installation."); }
}
export function syncMatchNotifications(session: Session | null) {
  latest = session;
  const plan = notificationPlan(session, Date.now());
  const key = JSON.stringify(plan);
  if (key === fingerprint) return;
  fingerprint = key;
  tail = tail.catch(() => {}).then(async () => {
    if (key !== fingerprint) return;
    const existing = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of existing) if (n.identifier.startsWith("roundr:")) await Notifications.cancelScheduledNotificationAsync(n.identifier);
    if (!plan.length) return;
    if (!(await Notifications.getPermissionsAsync()).granted) { setMessage("Activer les alertes écran verrouillé"); return; }
    await channels();
    for (const alert of plan) {
      if (key !== fingerprint) return;
      if (alert.at <= Date.now() + 250) continue;
      await Notifications.scheduleNotificationAsync({
        identifier: alert.id,
        content: { title: "Roundr", body: alert.title, sound: alert.sound + ".wav", data: { roundr: true } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(alert.at), channelId: `roundr-${alert.sound}` },
      });
    }
    setMessage(null);
  }).catch(() => { fingerprint = ""; setMessage("Alertes verrouillées indisponibles. Garde Roundr affiché."); });
}

