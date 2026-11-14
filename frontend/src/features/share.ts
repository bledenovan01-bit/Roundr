import { Platform, Share } from "react-native";

export type ShareOutcome = "shared" | "copied" | "dismissed" | "unavailable";

/**
 * Opens the phone's share sheet with a text. On the web, uses the browser's
 * share sheet when there is one, otherwise copies the text. Never throws.
 */
export async function shareText(message: string): Promise<ShareOutcome> {
  try {
    if (Platform.OS === "web") {
      const nav = (globalThis as { navigator?: { share?: (data: { text: string }) => Promise<void>; clipboard?: { writeText: (text: string) => Promise<void> } } }).navigator;
      if (nav?.share) {
        await nav.share({ text: message });
        return "shared";
      }
      if (nav?.clipboard) {
        await nav.clipboard.writeText(message);
        return "copied";
      }
      return "unavailable";
    }
    const result = await Share.share({ message });
    return result.action === Share.dismissedAction ? "dismissed" : "shared";
  } catch {
    // The user closing the sheet is reported as an error on some platforms.
    return "dismissed";
  }
}
