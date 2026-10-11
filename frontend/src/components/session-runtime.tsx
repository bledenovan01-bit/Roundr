import { useEffect } from "react";
import { AccessibilityInfo, AppState, Pressable, Text, View } from "react-native";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePreferences } from "@/src/store/preferences";
import { dismissNotice, tick, useStore } from "@/src/store/session-store";
import { fontFamily, useTheme } from "@/src/theme";

export function SessionRuntime() {
  const session=useStore(s=>s.session);const notice=useStore(s=>s.notice);
  const p=usePreferences();const insets=useSafeAreaInsets();const {colors}=useTheme();
  const running=session?.status==="active"&&session.live?.chrono.runningSince!=null&&session.live?.stage!=="finished";
  useEffect(()=>{
    if(!running)return;
    let interval:ReturnType<typeof setInterval>|null=null;
    const start=()=>{if(interval)clearInterval(interval);tick();interval=setInterval(tick,250);};
    if(AppState.currentState==="active")start();
    const sub=AppState.addEventListener("change",state=>{
      if(interval){clearInterval(interval);interval=null;}
      if(state==="active")start();
    });
    return()=>{if(interval)clearInterval(interval);sub.remove();};
  },[running]);
  const awake=!!running&&p.keepAwake;
  useEffect(()=>{
    let cancelled=false;
    if(awake)void activateKeepAwakeAsync("roundr-match").then(()=>{if(cancelled)void deactivateKeepAwake("roundr-match");}).catch(()=>{});
    return()=>{cancelled=true;void deactivateKeepAwake("roundr-match");};
  },[awake]);
  useEffect(()=>{
    if(!notice)return;
    AccessibilityInfo.announceForAccessibility(notice.message);
    const id=setTimeout(dismissNotice,Math.max(0,notice.until-Date.now()));
    return()=>clearTimeout(id);
  },[notice]);
  if(!notice)return null;
  return <View pointerEvents="box-none" style={{position:"absolute",top:insets.top+6,left:insets.left+14,right:insets.right+14,zIndex:100}}>
    <Pressable testID="session-announcement" onPress={dismissNotice} accessibilityRole="button" accessibilityLabel={`${notice.message}. Fermer l’annonce`}
      style={{padding:16,minHeight:48,borderRadius:16,backgroundColor:colors.brandPrimary}}>
      <Text style={{fontFamily:fontFamily.textBold,color:colors.onBrandPrimary,textAlign:"center",fontSize:15}}>{notice.message}</Text>
    </Pressable>
  </View>;
}
