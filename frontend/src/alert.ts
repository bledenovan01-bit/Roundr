import { Alert as NativeAlert, Platform } from "react-native";
export const Alert: typeof NativeAlert = {
  alert(title, message, buttons, options) {
    if (Platform.OS !== "web") { NativeAlert.alert(title,message,buttons,options); return; }
    const text = [title,message].filter(Boolean).join("\n\n");
    const action = buttons?.find(b=>b.style !== "cancel");
    if (action) { if (window.confirm(text)) action.onPress?.(); }
    else window.alert(text);
  },
  prompt(title,message,callbackOrButtons,type,defaultValue,keyboardType,options) {
    if (Platform.OS !== "web") { NativeAlert.prompt(title,message,callbackOrButtons,type,defaultValue,keyboardType,options); return; }
    const value=window.prompt([title,message].filter(Boolean).join("\n\n"),defaultValue);
    if(value!==null && typeof callbackOrButtons==="function") callbackOrButtons(value);
  },
};
