import { Platform } from "react-native";

// The music card commands the phone's player through native modules that only
// exist on iOS. On Android the card is left out of the carousels rather than
// shown as unavailable. Presentation only: no timer, score or storage change.
export const MUSIC_CARD_AVAILABLE = Platform.OS !== "android";
