// Component-contract tests only: no claim of pixel or native layout validation.
const assert=require("node:assert/strict");
import { defaultConfig, defaultTeams } from "../src/domain/defaults";
const colors=new Proxy({} as Record<string,string>,{get:(_,key)=>String(key)});
(globalThis as any).__roundrTestModules={
  "react/jsx-runtime":{jsx:(type:any,props:any,key:any)=>({type,props,key}),jsxs:(type:any,props:any,key:any)=>({type,props,key}),Fragment:"Fragment"},
  react:{
    createContext:(value:any)=>({_testDefault:value}),
    useContext:(context:any)=>context._testDefault,
    useState:(value:any)=>[typeof value==="function"?value():value,()=>{}],
    useEffect:()=>{},useId:()=>"test-id",
  },
  "react-native":{View:"View",Text:"Text",Pressable:"Pressable",TextInput:"TextInput",ActivityIndicator:"ActivityIndicator",StyleSheet:{create:(x:any)=>x}},
  "@react-native-vector-icons/material-design-icons":"Icon",
  "@/src/haptics":{selectionAsync:async()=>{},impactAsync:async()=>{},ImpactFeedbackStyle:{Light:"light"}},
  "@/src/theme":{
    useTheme:()=>({colors}),makeStyles:(fn:any)=>()=>fn(colors),
    fontFamily:{text:"text",textBold:"textBold",display:"textBold"},
    fontSize:{sm:12,base:14,lg:17,xl:21,"2xl":30},
    spacing:{xs:4,sm:8,md:12,lg:16,xl:24},radius:{sm:10,md:18,pill:999},control:{chip:48,icon:48,row:48,button:56},
  },
};
const {DesignConfig}=require("../src/features/design-config") as typeof import("../src/features/design-config");
const {PrimaryButton}=require("../src/components/primary-button") as typeof import("../src/components/primary-button");
function expand(value:any):any[]{
  if(value==null||typeof value==="boolean")return [];
  if(Array.isArray(value))return value.flatMap(expand);
  if(typeof value!=="object")return [value];
  if(typeof value.type==="function")return expand(value.type(value.props));
  return [value,...expand(value.props?.children)];
}
function nodes(config:any){return expand(DesignConfig({config,onChange:()=>{},teams:defaultTeams(config.mode,"teamCount" in config?config.teamCount:2),onTeams:()=>{}}));}
function ids(nodes:any[]){return new Set(nodes.flatMap(x=>{const id=x?.props?.testID;return id?[id,id.replace(/-(group|value)$/,"")]:[];}));}
for(const mode of ["classique","custom","maracana","cup","survie"] as const){
  const config=defaultConfig(mode);
  let rendered=ids(nodes({...config,customTeams:false}));
  assert(rendered.has("toggle-teams"));assert(rendered.has("toggle-sounds"));
  assert(!rendered.has("team-name-0"));
  rendered=ids(nodes({...config,customTeams:true}));
  assert(rendered.has("team-name-0"),`${mode}: team editor expands immediately`);
  if(mode==="classique"){
    assert(rendered.has("duration"));assert(rendered.has("periods"));assert(rendered.has("toggle-additional"));assert(rendered.has("toggle-score"));
  }
  if(mode==="maracana")for(const count of [3,4,5,6,7,8])assert(rendered.has(`teams-${count}`));
  if(mode==="cup")for(const id of ["teams","groups","format","draw","qualifiers","draw-rule"])assert(rendered.has(id),id);
  if(mode==="survie")for(const id of ["teams","draw","draw-rule"])assert(rendered.has(id),id);
}
for(const mode of ["maracana","cup","survie"] as const){
  const rendered=ids(nodes({...defaultConfig(mode),end:{byTime:false,goalTarget:3}}));
  assert(!rendered.has("duration"));assert(rendered.has("goal-target"));
}
const disabled:any=PrimaryButton({label:"Ajouter",disabled:true,onPress:()=>{throw Error("disabled callback");}});
assert.equal(disabled.props.disabled,true);
const styles=disabled.props.style({pressed:false});
assert.equal(styles.filter(Boolean).at(-1).backgroundColor,"surfaceTertiary");
const label=expand(disabled).find(x=>x?.props?.testID==="button-ajouter-label");
assert.equal(label.props.style.filter(Boolean).at(-1).color,"muted");
const enabled:any=PrimaryButton({label:"Ajouter",onPress:()=>{}});
assert(enabled.props.style({pressed:false}).some((x:any)=>x?.backgroundColor==="brandPrimary"));
console.log("✓ All five configuration component contracts preserve controls, expand teams inline and grey out disabled CTAs");
