import * as Haptics from "expo-haptics";
import { getPreferences } from "@/src/store/preferences";
export const ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle;
export const selectionAsync = () => getPreferences().vibrations ? Haptics.selectionAsync() : Promise.resolve();
export const impactAsync = (style?: Haptics.ImpactFeedbackStyle) => getPreferences().vibrations ? Haptics.impactAsync(style) : Promise.resolve();
