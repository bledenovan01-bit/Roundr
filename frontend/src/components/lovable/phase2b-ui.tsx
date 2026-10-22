import { isValidElement, useState, type ReactNode } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions, type TextInputProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { LovableBackground } from "./background";
import { LovableIcon, type LovableIconName } from "./icon";
import { Mark, configStyles as s } from "./configuration";
import { lovable as c, lovableFont as f, withAlpha } from "@/src/visual/lovable";
// Intrinsic minimum measured on the frozen "Nouveau tirage" button (Manrope 14/700).
export const REDRAW_MIN_WIDTH = 160.6875;

export function PhaseIcon({name,color,size=16}:{name:"shuffle"|"plus"|"x";color:string;size?:number}) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" accessible={false} aria-hidden>
    {name==="plus"?<Path d="M12 5v14M5 12h14"/>:name==="x"?<Path d="m18 6-12 12M6 6l12 12"/>:<><Path d="m18 14 4 4-4 4M18 2l4 4-4 4"/><Path d="M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22M2 6h1.972a4 4 0 0 1 3.6 2.2M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45"/></>}
  </Svg>;
}
export function PhaseAction({label,onPress,disabled=false,kind="primary",icon,testID,height}:{label:string;onPress:()=>void;disabled?:boolean;kind?:"primary"|"secondary"|"ghost";icon?:"shuffle"|"plus"|"play"|LovableIconName;testID?:string;height?:number}) {
  const {width,height:screenHeight}=useWindowDimensions(),landscape=width>screenHeight;
  const color=kind==="primary"?c.onPrimary:kind==="ghost"?c.muted:c.foreground;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{disabled}} disabled={disabled} testID={testID} onPress={onPress}
    hitSlop={height===36?4:0} style={({pressed})=>[s.action,{minHeight:height??(kind==="primary"?(landscape?48:56):kind==="secondary"?50:44),backgroundColor:kind==="primary"?c.primary:kind==="secondary"?c.cardRaised:"transparent",borderWidth:kind==="secondary"?1:0,opacity:disabled?.4:1,gap:kind==="primary"?10:8},pressed&&s.pressed]}>
    {icon?(icon==="play"?<Mark name="play" size={16} color={color}/>:icon==="shuffle"||icon==="plus"?<PhaseIcon name={icon} color={color}/>:<LovableIcon name={icon} color={color}/>):null}
    <Text style={{fontFamily:kind==="primary"?f.extrabold:"ManropeRefined-Bold",fontSize:kind==="primary"?16:14,lineHeight:kind==="primary"?160/7:20,color,textAlign:"center",flexShrink:1}}>{label}</Text>
  </Pressable>;
}
export function PhaseFrame({title,subtitle,onBack,intro,children,footer,pair=false,blocked=false,onContentHeight,onViewportHeight}:{title:string;subtitle?:string;onBack:()=>void;intro?:ReactNode;children:ReactNode[];footer?:ReactNode;pair?:boolean;blocked?:boolean;onContentHeight?:(n:number)=>void;onViewportHeight?:(n:number)=>void}) {
  const {width,height,fontScale}=useWindowDimensions(),inset=useSafeAreaInsets(),landscape=width>height;
  const two=landscape&&width-inset.left-inset.right>=600&&fontScale<=1.5;
  return <KeyboardAvoidingView style={s.screen} behavior={Platform.OS==="ios"?"padding":"height"}>
    <LovableBackground/>
    <View style={[s.header,{paddingTop:inset.top+(landscape?10:18),paddingBottom:landscape?4:10,paddingLeft:20+inset.left,paddingRight:20+inset.right}]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={onBack} disabled={blocked} accessibilityState={{disabled:blocked}} style={s.back}><LovableIcon name="back" color={c.foreground} size={20}/></Pressable>
      <View style={{flex:1,minWidth:0}}><Text accessibilityRole="header" numberOfLines={1} style={s.title}>{title}</Text>{subtitle?<Text style={s.subtitle}>{subtitle}</Text>:null}</View><View style={{width:44}}/>
    </View>
    <ScrollView testID="config-scroll" style={{flex:1}} pointerEvents={blocked?"none":"auto"} onContentSizeChange={(_,h)=>onContentHeight?.(h)} onLayout={e=>onViewportHeight?.(e.nativeEvent.layout.height)} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}
      contentContainerStyle={{paddingTop:6,paddingLeft:20+inset.left,paddingRight:20+inset.right,paddingBottom:Math.max(16,inset.bottom),gap:12,flexDirection:"row",flexWrap:"wrap",alignItems:"flex-start"}}>
      {intro?<View style={{width:"100%"}}>{intro}</View>:null}
      {children.filter(Boolean).map((child,i)=><View key={isValidElement(child)?child.key??i:i} style={{width:two?(width-inset.left-inset.right-52)/2:"100%"}}>{child}</View>)}
    </ScrollView>
    {footer?<View style={{paddingTop:landscape?8:12,paddingBottom:Math.max(inset.bottom,landscape?10:16),paddingLeft:20+inset.left,paddingRight:20+inset.right,alignItems:"center"}}>
      <View style={{width:"100%",maxWidth:landscape?(pair?REDRAW_MIN_WIDTH*2.4+10:420):undefined}}>{footer}</View>
    </View>:null}
  </KeyboardAvoidingView>;
}
export function PhaseSummary({children}:{children:ReactNode}) {
  return <View style={s.summary}><View style={{marginTop:1}}><Mark name="info" color={c.primary}/></View><Text style={s.summaryText}>{children}</Text></View>;
}
export function PhaseInput(props:TextInputProps) {
  const [focused,setFocused]=useState(false);
  return <TextInput {...props} onFocus={e=>{setFocused(true);props.onFocus?.(e);}} onBlur={e=>{setFocused(false);props.onBlur?.(e);}}
    placeholderTextColor={c.muted} style={[s.input,{outlineStyle:"solid",outlineWidth:focused?2:0,outlineOffset:-1,outlineColor:c.primary},props.style]}/>;
}
export function CompositionSheet({title,description,onClose,children,success=false}:{title:string;description:string;onClose:()=>void;children:ReactNode;success?:boolean}) {
  const {height,width}=useWindowDimensions(),inset=useSafeAreaInsets(),landscape=width>height;
  return <Modal transparent visible animationType="fade" onRequestClose={onClose} accessibilityViewIsModal>
    <View style={{flex:1,backgroundColor:"rgba(0,3,3,.78)",justifyContent:"flex-end",alignItems:"center",paddingLeft:landscape?inset.left:0,paddingRight:landscape?inset.right:0,paddingTop:inset.top}}>
      <ScrollView testID="composition-sheet" role="dialog" accessibilityLabel={title} style={{maxHeight:(height-inset.top)*(landscape?.96:.92),width:"100%",maxWidth:landscape?520:undefined,flexGrow:0,backgroundColor:c.card,borderTopLeftRadius:26,borderTopRightRadius:26,borderTopWidth:1,borderColor:c.border}} contentContainerStyle={{paddingTop:landscape?14:20,paddingHorizontal:20,paddingBottom:Math.max(18,inset.bottom),gap:landscape?8:14}}>
        {success?<View style={{width:46,height:46,borderRadius:14,borderWidth:1,borderColor:withAlpha(c.classic,.35),alignSelf:"center",alignItems:"center",justifyContent:"center",backgroundColor:withAlpha(c.classic,.16)}}><LovableIcon name="users" color={c.classic} size={22}/></View>:null}
        <Text accessibilityRole="header" style={{fontFamily:f.extrabold,fontSize:18,lineHeight:27,color:c.foreground,textAlign:"center"}}>{title}</Text>
        <Text style={{fontFamily:f.regular,fontSize:14,lineHeight:21,color:c.muted,textAlign:"center"}}>{description}</Text>
        {children}
      </ScrollView>
    </View>
  </Modal>;
}
