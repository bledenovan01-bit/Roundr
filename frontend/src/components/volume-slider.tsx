import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useTheme } from "@/src/theme";
export function VolumeSlider({value,onChange}:{value:number;onChange:(v:number)=>void}) {
  const {colors}=useTheme();const [width,setWidth]=useState(1);const [draft,setDraft]=useState(value);
  useEffect(()=>setDraft(value),[value]);
  const at=(x:number)=>Math.round(Math.min(1,Math.max(0,x/width))*100)/100;
  return <View>
    <Text style={{color:colors.onSurface}}>Volume : {Math.round(draft*100)} %</Text>
    <View testID="volume-slider" accessible accessibilityRole="adjustable" accessibilityLabel="Volume des sons de Roundr"
      accessibilityValue={{min:0,max:100,now:Math.round(draft*100)}}
      accessibilityActions={[{name:"increment",label:"Augmenter le volume"},{name:"decrement",label:"Diminuer le volume"}]}
      onAccessibilityAction={e=>{const v=Math.min(1,Math.max(0,value+(e.nativeEvent.actionName==="increment"?0.1:-0.1)));setDraft(v);onChange(v);}}
      onLayout={e=>setWidth(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={()=>true} onMoveShouldSetResponder={()=>true}
      onResponderGrant={e=>setDraft(at(e.nativeEvent.locationX))}
      onResponderMove={e=>setDraft(at(e.nativeEvent.locationX))}
      onResponderRelease={e=>{const v=at(e.nativeEvent.locationX);setDraft(v);onChange(v);}}
      onResponderTerminate={()=>onChange(draft)}
      style={{minHeight:52,justifyContent:"center"}}>
      <View pointerEvents="none" style={{height:6,borderRadius:3,backgroundColor:colors.border}}>
        <View style={{height:6,width:`${draft*100}%`,backgroundColor:colors.brandPrimary,borderRadius:3}}/>
        <View style={{position:"absolute",left:Math.max(0,Math.min(width-24,draft*width-12)),top:-9,width:24,height:24,borderRadius:12,backgroundColor:colors.brandPrimary}}/>
      </View>
    </View>
  </View>;
}
