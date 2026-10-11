import { View } from "react-native";
import { DesignRow } from "@/src/components/design-screen";
import { Card, TeamsEditor, ToggleRow } from "@/src/components/fields";
import { ClassicForm, CupForm, CustomForm, MaracanaForm, SurvieForm } from "./config-forms";
import type { AnyConfig, Team } from "@/src/domain/types";

export function DesignConfig({ config:c, onChange, teams, onTeams }: {
  config:AnyConfig; onChange:(v:AnyConfig)=>void; teams:Team[]; onTeams:(t:Team[])=>void; validationErrors?:string[];
}) {
  return <View style={{gap:14}}>
    {c.mode==="classique"?<ClassicForm config={c} onChange={onChange}/>:
      c.mode==="custom"?<CustomForm config={c} onChange={onChange}/>:
      c.mode==="maracana"?<MaracanaForm config={c} onChange={onChange}/>:
      c.mode==="cup"?<CupForm config={c} onChange={onChange}/>:<SurvieForm config={c} onChange={onChange}/>}
    <Card><ToggleRow label="Personnaliser les équipes" hint="Définis les noms et les couleurs des équipes." testID="toggle-teams" value={c.customTeams} onChange={v=>onChange({...c,customTeams:v})}/></Card>
    {c.customTeams?<DesignRow title="Noms, couleurs et ordre" detail="Modifier les équipes">
      <TeamsEditor teams={teams} onChange={onTeams} reorder={(c.mode==="cup"||c.mode==="survie")&&c.draw==="manual"}/>
    </DesignRow>:null}
    <Card><ToggleRow label="Sons / effets" hint="Ambiance de match : début, pause, buts et fin." testID="toggle-sounds" value={c.sounds} onChange={v=>onChange({...c,sounds:v})}/></Card>
  </View>;
}
