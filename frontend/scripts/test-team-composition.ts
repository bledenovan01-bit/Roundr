import { drawPlayers, editPlayer, movePlayer, validComposition, type TeamComposition } from "../src/domain/team-maker";
import { tournamentTeams } from "../src/features/tournament-config-state";
const builtin=(process as unknown as {getBuiltinModule:(id:string)=>any}).getBuiltinModule;
const assert=builtin("assert/strict");
const req=builtin("module").createRequire(process.argv[1]) as {(id:string):unknown;cache:Record<string,unknown>;resolve:(id:string)=>string};
const key="roundr.preferences.v1";
function gate(){let release!:()=>void;const promise=new Promise<void>(r=>{release=r;});return {promise,release};}
const composition=(name="Les Renards"):TeamComposition=>({teams:tournamentTeams(2).map((t,i)=>i? t:{...t,name}),groups:[["Hugo","Léa"],["Sami","Noah"]],savedAt:1000});
function fixture(raw:string|null=null){
 const memory=new Map<string,string>();if(raw!==null)memory.set(key,raw);
 const faults={read:false,write:false},gates={read:null as Promise<void>|null,write:null as Promise<void>|null};
 let active=0,maximum=0,reads=0,writes=0;
 (globalThis as any).__roundrTestModules={react:{useSyncExternalStore(){}}, "@react-native-async-storage/async-storage":{
  async getItem(k:string){reads++;if(gates.read)await gates.read;if(faults.read)throw Error("read");return memory.get(k)??null;},
  async setItem(k:string,v:string){active++;maximum=Math.max(maximum,active);try{if(gates.write)await gates.write;if(faults.write)throw Error("write");memory.set(k,v);writes++;}finally{active--;}}
 }};
 delete req.cache[req.resolve("../src/store/preferences")];
 const prefs=req("../src/store/preferences") as typeof import("../src/store/preferences");
 return {prefs,memory,faults,gates,reads:()=>reads,writes:()=>writes,maximum:()=>maximum};
}
const players=["Hugo","Léa","Sami","Noah","Inès","Yanis","Chloé","Adam","Maya","Lucas"];
assert.deepEqual(editPlayer(["Hugo"]," hugo "),null);assert.deepEqual(editPlayer(["Hugo"],"Léa"),["Hugo","Léa"]);
assert.deepEqual(editPlayer(["Hugo","Léa"],"Sami",0),["Sami","Léa"]);assert.equal(editPlayer(["Hugo","Léa"],"léa",0),null);
assert.equal(editPlayer([]," ".repeat(3)),null);assert.equal(editPlayer([],"x".repeat(21)),null);
for(let count=2;count<=8;count++){
 const groups=drawPlayers(players,count,42);assert.deepEqual(groups,drawPlayers(players,count,42));
 assert.deepEqual(groups.flat().sort(),[...players].sort());
 const sizes=groups.map(g=>g.length);assert(Math.max(...sizes)-Math.min(...sizes)<=1);
}
assert.notDeepEqual(drawPlayers(players,2,42),drawPlayers(players,2,43));
assert.throws(()=>drawPlayers(["Hugo","hugo"],2,1));assert.throws(()=>drawPlayers(["Hugo"],2,1));
const original=[["Hugo"],["Léa","Sami"]],moved=movePlayer(original,0,0,1);
assert.deepEqual(original,[["Hugo"],["Léa","Sami"]]);assert.deepEqual(moved,[[],["Léa","Sami","Hugo"]]);
assert.equal(validComposition({teams:tournamentTeams(2),groups:moved}),false);
assert.deepEqual(movePlayer(moved,1,2,0),original);
for(const invalid of [{...composition(),teams:tournamentTeams(1)},{...composition(),groups:[["Hugo"],["hugo"]]},{...composition(),groups:[[],["Hugo"]]},{...composition(),savedAt:NaN}])assert.equal(validComposition(invalid),false);
assert.equal(validComposition(composition()),true);
console.log("✓ Names/add/edit/remove, limits, reproducible balanced draws, moves and empty/duplicate team validation");

async function run(){
 const empty=fixture();await empty.prefs.loadPreferences();assert.equal(empty.prefs.getSavedComposition(),null);
 const first=composition();assert.equal(await empty.prefs.saveTeamComposition(first),true);assert.deepEqual(empty.prefs.getSavedComposition(),first);
 const restart=fixture(empty.memory.get(key)!);await restart.prefs.loadPreferences();assert.deepEqual(restart.prefs.getSavedComposition(),first);
 const copy=restart.prefs.getSavedComposition()!;copy.teams[0].name="copie";copy.groups[0].push("autre");
 assert.deepEqual(restart.prefs.getSavedComposition(),first);
 console.log("✓ Missing data creates a first composition; restart/import/resume return independent copies");
 const draftRaw=JSON.stringify({players:["Hugo","hugo","Un ancien nom de joueur long"],teams:[],groups:[]});
 const draft=fixture(draftRaw);await draft.prefs.loadPreferences();
 assert.deepEqual(draft.prefs.getPreferences().players,["Hugo","hugo","Un ancien nom de joueur long"]);
 assert.equal(draft.prefs.getSavedComposition(),null);assert.equal(draft.memory.get(key),draftRaw);assert.equal(draft.writes(),0);
 console.log("✓ Legacy player lists stay available for explicit recovery, with no implicit reuse or overwrite");

 const legacyRaw=JSON.stringify({teams:first.teams,groups:first.groups,players:[],sounds:false,volume:.2,screenSleepVersion:2});
 const legacy=fixture(legacyRaw);await legacy.prefs.loadPreferences();
 assert.deepEqual(legacy.prefs.getSavedComposition()!.groups,first.groups);
 assert.equal(legacy.memory.get(key),legacyRaw);
 const failed=composition("Nouvelle équipe");legacy.faults.write=true;
 assert.equal(await legacy.prefs.saveTeamComposition(failed),false);assert.equal(legacy.memory.get(key),legacyRaw);
 assert.equal(legacy.prefs.getSavedComposition()!.teams[0].name,first.teams[0].name);assert(legacy.prefs.getCompositionStatus().error);
 legacy.faults.write=false;await legacy.prefs.setPreferences({sounds:true});
 assert(legacy.prefs.getCompositionStatus().error,"An unrelated preference save must not erase a composition failure");
 assert.equal(JSON.parse(legacy.memory.get(key)!).teams[0].name,first.teams[0].name);
 assert.equal(await legacy.prefs.saveTeamComposition(failed),true);assert.equal(legacy.prefs.getCompositionStatus().error,null);
 assert.equal(legacy.prefs.getPreferences().volume,.2);assert.equal(legacy.prefs.getPreferences().sounds,true);
 console.log("✓ Legacy compositions remain byte-for-byte until explicit save; failure keeps old teams and persistent operation-specific error");

 for(const raw of ["{bad",JSON.stringify({groups:"bad"}),JSON.stringify({teams:[{id:"a",name:4,color:"#fff"}]}),JSON.stringify({players:42})]){
  const f=fixture(raw);await f.prefs.loadPreferences();assert.equal(f.prefs.getCompositionStatus().readable,false);
  assert.equal(await f.prefs.saveTeamComposition(first),false);await f.prefs.setPreferences({sounds:false});
  assert.equal(f.memory.get(key),raw);assert.equal(f.writes(),0);
 }
 const unread=fixture(legacyRaw);unread.faults.read=true;await unread.prefs.loadPreferences();
 assert.equal(await unread.prefs.saveTeamComposition(first),false);assert.equal(unread.memory.get(key),legacyRaw);
 unread.faults.read=false;await unread.prefs.loadPreferences();assert.equal(await unread.prefs.saveTeamComposition(first),true);
 console.log("✓ Invalid JSON, invalid structures and read failure preserve raw data and block empty or replacement writes until a successful reread");

 const concurrent=fixture(legacyRaw),readGate=gate(),writeGate=gate();concurrent.gates.read=readGate.promise;concurrent.gates.write=writeGate.promise;
 const load=concurrent.prefs.loadPreferences();assert.equal(concurrent.prefs.loadPreferences(),load);
 const candidate=composition("Équipe validée"),save=concurrent.prefs.saveTeamComposition(candidate);
 candidate.teams[0].name="mutation après validation";candidate.groups[0].push("intrus");
 const setting=concurrent.prefs.setPreferences({volume:.4});
 assert.equal(concurrent.reads(),0);assert.equal(concurrent.writes(),0);
 readGate.release();await load;assert.equal(concurrent.memory.get(key),legacyRaw);
 assert.equal(await concurrent.prefs.saveTeamComposition(composition("concurrente")),false);
 writeGate.release();assert.equal(await save,true);await setting;await concurrent.prefs.flushPreferences();
 const saved=JSON.parse(concurrent.memory.get(key)!);assert.equal(saved.teams[0].name,"Équipe validée");assert.equal(saved.groups.flat().includes("intrus"),false);assert.equal(saved.volume,.4);assert.equal(concurrent.maximum(),1);
 console.log("✓ Single-flight loading, edits during loading, caller mutations, concurrent saves and preference updates serialize without loss");

 const reread=fixture(legacyRaw);await reread.prefs.loadPreferences();const block=gate();reread.gates.write=block.promise;
 const saving=reread.prefs.saveTeamComposition(composition("Avant relecture"));
 const reading=reread.prefs.loadPreferences();block.release();
 assert.equal(await saving,true);await reading;assert.equal(reread.prefs.getSavedComposition()!.teams[0].name,"Avant relecture");
 const rapid=fixture(legacyRaw);await rapid.prefs.loadPreferences();
 await Promise.all([rapid.prefs.setPreferences({volume:.1}),rapid.prefs.setPreferences({sounds:false}),rapid.prefs.setPreferences({volume:.7})]);
 assert.equal(JSON.parse(rapid.memory.get(key)!).volume,.7);assert.equal(JSON.parse(rapid.memory.get(key)!).sounds,false);
 assert.deepEqual(JSON.parse(rapid.memory.get(key)!).groups,first.groups);
 console.log("✓ Rereading during a pending save and rapid unrelated writes preserve the final composition and settings");
}
void run().catch(e=>{console.error(e);process.exitCode=1;});
