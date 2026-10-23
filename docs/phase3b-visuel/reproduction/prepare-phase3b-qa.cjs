const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=process.cwd(),native=path.join(root,'work/Roundr/frontend'),validation=path.join(root,'work/phase1-validation/frontend');
require(path.join(validation,'scripts/register-ts.cjs'));
const S=require(path.join(native,'src/domain/session.ts')),P=require(path.join(native,'src/domain/tournament-presentation.ts')),B=require(path.join(native,'src/domain/bracket.ts')),C=require(path.join(native,'src/features/tournament-config-state.ts'));
const R=require(path.join(validation,'scripts/tournament-reference.cjs'));
const cases=[
 {id:'cup-start',mode:'cup'}, {id:'cup-preview',mode:'cup',tab:'Tableau'},
 {id:'cup-groups',mode:'cup',played:4,tab:'Poules'}, {id:'cup-qualified',mode:'cup',played:12,tab:'Tableau'},
 {id:'cup-quarter-finals',mode:'cup',n:16,groups:4,played:24,tab:'Tableau'},
 {id:'cup-ready',mode:'cup',match:true}, {id:'cup-paused',mode:'cup',match:true,paused:true},
 {id:'cup-ring',mode:'cup',match:true,paused:true,page:'Circulaire'}, {id:'cup-info',mode:'cup',match:true,paused:true,page:'Tournoi'},
 {id:'cup-result',mode:'cup',played:1,result:true}, {id:'cup-correction',mode:'cup',played:1,result:true,overlay:'Corriger le résultat'},
 {id:'cup-decision',mode:'cup',n:4,groups:1,q:1,played:6,draws:true,overlay:'Désigner les qualifiés'},
 {id:'cup-palmares',mode:'cup',all:true,summary:true},
 {id:'cup-extra-choice',mode:'cup',n:4,groups:1,q:2,played:6,tie:'extraThenShootout',step:'choice'},
 {id:'cup-extra-ready',mode:'cup',n:4,groups:1,q:2,played:6,tie:'extraThenShootout',step:'ready'},
 {id:'cup-shootout',mode:'cup',n:4,groups:1,q:2,played:6,tie:'shootout',step:'shootout'},
 {id:'cup-golden-ready',mode:'cup',n:4,groups:1,q:2,played:6,tie:'golden',step:'ready'},
 {id:'cup-auto',mode:'cup',played:1,result:true,launch:'auto'},
 {id:'cup-elapsed',mode:'cup',match:true,paused:true,elapsed:true},
 {id:'survie-byes',mode:'survie',n:5}, {id:'survie-fixtures',mode:'survie',n:5,played:1,tab:'Matchs'},
 {id:'survie-semis',mode:'survie',played:4}, {id:'survie-small-final',mode:'survie',played:6},
 {id:'survie-final',mode:'survie',played:7,match:true}, {id:'survie-palmares',mode:'survie',all:true,summary:true},
 {id:'survie-delay',mode:'survie',played:1,result:true,launch:'delay'},
 {id:'survie-auto',mode:'survie',played:1,result:true,launch:'auto'},
 {id:'survie-extra-choice',mode:'survie',n:2,tie:'extraThenShootout',step:'choice'},
 {id:'survie-extra-ready',mode:'survie',n:2,tie:'extraThenShootout',step:'ready'},
 {id:'survie-shootout',mode:'survie',n:2,tie:'shootout',step:'shootout'},
 {id:'survie-golden-ready',mode:'survie',n:2,tie:'golden',step:'ready'},
 {id:'survie-stop',mode:'survie',played:1,overlay:'Interrompre le tournoi'},
];
const t0=1700000000000;Date.now=()=>t0;
function make(spec){
 const n=spec.n??8,c={...C.tournamentDefaults(spec.mode),teamCount:n,draw:'manual',groups:spec.groups??2,qualifiersPerGroup:spec.q??2,sounds:false,smallFinal:n>=4,drawRule:spec.tie??'shootout',launch:spec.launch??'manual',launchDelaySec:30};
 let s=P.createTournamentSession(c,C.tournamentTeams(n),t0),now=t0;
 let d=R.generate({kind:s.mode,teams:s.teams.map((t,i)=>({name:t.name,color:["orange","green","blue","red","yellow","violet","cyan","pink","lime","teal","sky","indigo","fuchsia","rose","gold","white"][i%16]})),settings:{minutes:c.matchMin,byTime:true,byGoals:false,goals:3,extra:false,tie:c.drawRule==='shootout'?'tab':c.drawRule==='golden'?'golden':'prol',prol:c.extraMin,rounds:c.roundMinutes,third:c.smallFinal,nextLaunch:{mode:c.launch,seconds:30}},draw:'manual',...(s.mode==='cup'?{groups:c.groups,qualified:c.qualifiersPerGroup,legs:'single',best:c.bestNext}:{})});
 let last=null;
 for(let i=0;i<(spec.all?1000:spec.played??0)&&!P.tournamentProjection(s).complete;i++){
  const next=R.analyze(d).next;if(!next)break;now+=20000;s=S.startReady(S.launchNext(s,now),now);
  const m=S.currentMatch(s),ids=B.matchTeams(m,s.matches).map(id=>+id.slice(1)-1);if(ids[0]!==next.a||ids[1]!==next.b)throw Error('pair mismatch '+spec.id);
  let score=[0,0];if(!spec.draws){score[ids[0]<ids[1]?0:1]=2;for(let j=0;j<2;j++)s=S.goal(s,ids[0]<ids[1]?0:1,1,now+1000+j*1000);}
  now+=12345;s=S.endManual(s,now);last=next.id;
  d={...d,seq:d.seq+1,current:last,results:{...d.results,[last]:{a:next.a,b:next.b,score,how:'reg',ms:12345,order:d.seq+1}}};
 }
 let clock={stage:'ended',period:0,acc:0,since:null,score:last?d.results[last].score:[0,0],played:[12345],endReason:'manual',goals:[]};
 if(spec.match||spec.step){const next=R.analyze(d).next;now+=20000;s=S.launchNext(s,now);d={...d,current:next.id,view:'match'};clock={...clock,stage:'ready',score:[0,0],played:[],endReason:null};
  if(spec.paused){s=S.startReady(s,now);s=S.goal(s,0,1,now+1000);s=S.goal(s,0,1,now+2000);s=S.goal(s,1,1,now+3000);now+=12345;s=S.pause(s,now);clock={...clock,stage:'play',acc:12345,score:[2,1]};}
  if(spec.step){s=S.startReady(s,now);now+=c.matchMin*60000;s=S.advance(s,now);clock={...clock,stage:'ended',score:[0,0],played:[c.matchMin*60000],endReason:'time'};
   if(spec.step==='ready'){s=S.prepareTournamentTiebreak(s,now);d={...d,phase:c.drawRule==='golden'?'golden':'prol',phaseMs:c.matchMin*60000};clock={...clock,stage:'ready',played:[],acc:0,endReason:null};}
  }
 }else{s={...s,tournamentView:spec.summary?'summary':spec.result?'match':'hub'};d={...d,view:s.tournamentView};}
 let cfg=R.fixtureClock(d,d.current,d.phase);
 return {...spec,now,native:s,reference:{d,cfg,clock}};
}
const fixtures=cases.map(make);
for(const [name,source] of [['phase3b-reference-render','lovable-visual-audit'],['phase3b-native-render','Roundr/frontend']]){
 const dest=path.join(root,'work',name);fs.mkdirSync(dest,{recursive:true});
 if(name.includes('reference')){for(const dir of ['src','public'])fs.cpSync(path.join(root,'work',source,dir),path.join(dest,dir),{recursive:true});fs.copyFileSync(path.join(root,'work',source,'package.json'),path.join(dest,'package.json'));}
 else{const files=cp.execFileSync('git',['ls-files','--cached','--others','--exclude-standard','frontend'],{cwd:path.join(root,'work/Roundr'),encoding:'utf8'}).trim().split(/\r?\n/);for(const f of files){const src=path.join(root,'work/Roundr',f),target=path.join(dest,f.slice(9));if(!fs.existsSync(src))continue;fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(src,target);}}
 const deps=path.join(dest,'node_modules');if(!fs.existsSync(deps))fs.symlinkSync(path.join(root,'work',name.includes('reference')?'lovable-visual-audit/node_modules':'preview-install/node_modules'),deps,'junction');
 fs.writeFileSync(path.join(dest,'phase3b-cases.json'),JSON.stringify(fixtures));
}
const ref=path.join(root,'work/phase3b-reference-render'),nat=path.join(root,'work/phase3b-native-render');
fs.copyFileSync(path.join(root,'work/phase3b-reference-qa.tsx'),path.join(ref,'qa.tsx'));fs.copyFileSync(path.join(root,'work/phase3b-native-qa.tsx'),path.join(nat,'app/phase3bqa.tsx'));
fs.writeFileSync(path.join(ref,'index.html'),`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"/><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap"/></head><body><div id="root"></div><script type="module" src="/qa.tsx"></script></body></html>`);
fs.writeFileSync(path.join(ref,'vite.qa.config.ts'),`import {defineConfig} from 'vite';import react from '@vitejs/plugin-react';import tailwind from '@tailwindcss/vite';import path from 'node:path';export default defineConfig({plugins:[react(),tailwind()],resolve:{alias:{'@':path.resolve(import.meta.dirname,'src')}},server:{host:'127.0.0.1',port:8130,strictPort:true}});`);
fs.mkdirSync(path.join(root,'outputs/phase3b'),{recursive:true});fs.writeFileSync(path.join(root,'outputs/phase3b/scenarios.json'),JSON.stringify(cases,null,2));
console.log('Prepared '+fixtures.length+' paired fixtures; frozen source components unchanged.');
