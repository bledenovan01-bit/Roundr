import { useEffect, useRef, useState } from "react";
import { useNavigation } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";
import { Alert } from "@/src/alert";

export function useUnsavedChanges(dirty:boolean) {
  const navigation=useNavigation();
  const [approved,setApproved]=useState(false);
  const pending=useRef<(()=>void)|null>(null);
  usePreventRemove(dirty&&!approved,({data})=>{
    Alert.alert("Abandonner ces réglages ?", "Tes modifications de réglages seront perdues.", [
      {text:"Continuer les réglages",style:"cancel"},
      {text:"Abandonner",style:"destructive",onPress:()=>navigation.dispatch(data.action)},
    ]);
  });
  useEffect(()=>{if(approved&&pending.current){const action=pending.current;pending.current=null;action();}},[approved]);
  return (action:()=>void)=>{pending.current=action;setApproved(true);};
}
