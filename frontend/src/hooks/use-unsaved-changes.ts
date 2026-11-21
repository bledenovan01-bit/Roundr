import { useEffect, useRef, useState } from "react";
import { usePreventRemove } from "expo-router/react-navigation";
import { Alert } from "@/src/alert";

export function useUnsavedChanges(dirty:boolean) {
  const [approved,setApproved]=useState(false);
  const pending=useRef<(()=>void)|null>(null);
  usePreventRemove(dirty&&!approved,({repeat})=>{
    Alert.alert("Abandonner ces réglages ?", "Tes modifications de réglages seront perdues.", [
      {text:"Continuer les réglages",style:"cancel"},
      // `repeat` lifts the prevention before navigating, so the action is not blocked again.
      {text:"Abandonner",style:"destructive",onPress:repeat},
    ]);
  });
  useEffect(()=>{if(approved&&pending.current){const action=pending.current;pending.current=null;action();}},[approved]);
  return (action:()=>void)=>{pending.current=action;setApproved(true);};
}
