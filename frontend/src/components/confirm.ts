import { Alert as NativeAlert, Platform, type AlertButton, type AlertOptions } from "react-native";

// React Native Web's Alert implementation is empty.
export const Alert = {
  alert(title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) {
    if (Platform.OS !== "web") { NativeAlert.alert(title, message, buttons, options); return; }
    const text = [title, message].filter(Boolean).join("\n\n");
    const actions = buttons?.filter(b => b.style !== "cancel") ?? [];
    if (!buttons?.length || buttons.length === 1) {
      window.alert(text);
      actions[0]?.onPress?.();
    } else if (window.confirm(text)) actions[actions.length - 1]?.onPress?.();
    else buttons.find(b => b.style === "cancel")?.onPress?.();
  },
  prompt: Platform.OS === "ios" ? NativeAlert.prompt : undefined,
};

