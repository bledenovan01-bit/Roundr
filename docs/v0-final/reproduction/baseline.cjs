// Reproduce the eight reports against an exported, unmodified accbea8 tree.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const [tree,fixtureFile,output]=process.argv.slice(2),root=path.resolve(tree),out=path.resolve(output);
fs.mkdirSync(out,{recursive:true});
require(path.join(root,'frontend/scripts/register-ts.cjs'));
const load=p=>require(path.join(root,'frontend/src',p));
const S=load('domain/session'),{matchProjection}=load('features/match-presentation'),{homeSessionPreviews}=load('features/home-session-preview');
const {lovableLaunchDefaults,lovableConfigTeams}=load('features/lovable-config-state');
const {createFreeTimer,defaultConfig}=load('domain/free-timer'),{freeCommand}=load('features/free-live-state');
const fixtures=JSON.parse(fs.readFileSync(fixtureFile,'utf8')),results=[],at=1793000000000;
let s=S.createSession({...lovableLaunchDefaults('maracana'),teamCount:5},lovableConfigTeams('maracana',5),at);
s=S.endManual(S.goal(s,0,1,at+1000),at+12345);
assert.equal(matchProjection(s,at).time,'00:00.00');assert.equal(s.live.chrono.accumulatedMs,12345);
results.push({anomaly:3,observed:'00:00.00',storedElapsedMs:12345,scope:'match projection; engine already preserves elapsed'});
const cd=freeCommand(createFreeTimer(defaultConfig('countdown')),'toggle',at);
assert.equal(homeSessionPreviews(null,cd,at+900000).length,1);
results.push({anomaly:7,observed:'expired countdown still resumable before runtime tick',scope:'pure home projection; stable reload already advances during store load'});
const log=fs.openSync(path.join(out,'server.log'),'w');
const server=cp.spawn(process.execPath,['node_modules/expo/bin/cli','start','--web','--host','localhost','--port','8097'],{cwd:path.join(root,'frontend'),env:{...process.env,EXPO_OFFLINE:'1',EXPO_NO_TELEMETRY:'1'},stdio:['ignore',log,log],windowsHide:true});
process.on('exit',()=>server.kill());
(async()=>{let browser;try{
 for(let i=0;i<120;i++){try{if((await fetch('http://localhost:8097')).ok)break;}catch{}if(i===119)throw Error('baseline server unavailable');await new Promise(r=>setTimeout(r,1000));}
 browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'});
 async function visit(name,route,fn,fixture){const context=await browser.newContext({viewport:{width:320,height:568}});const p=await context.newPage();await context.addInitScript(f=>{Date.now=()=>f.now;localStorage.setItem('roundr.welcome.v1','seen');for(const[k,v]of Object.entries(f.storage))localStorage.setItem(k,v);},fixture||{now:at,storage:{}});try{await p.goto('http://localhost:8097'+route,{timeout:180000});await p.getByRole('heading').first().waitFor({timeout:60000});await p.evaluate(()=>document.fonts.ready);await fn(p);await p.screenshot({path:path.join(out,name+'.png'),fullPage:true});console.log('REPRODUCED',name);}finally{await context.close();}}
 await visit('1-name','/chrono-libre/countdown',async p=>{await p.getByRole('button',{name:'Enregistrer dans Mes chronos',exact:true}).click();await p.getByText('Donnez un nom à ce chrono.',{exact:true}).waitFor();results.push({anomaly:1,observed:'error before input'});});
 for(const mode of ['cup','survie']){const f=structuredClone(fixtures.find(f=>f.name===mode+'-champion'));const s=JSON.parse(f.storage['roundr.session.v1']);s.tournamentView='hub';f.storage['roundr.session.v1']=JSON.stringify(s);await visit('2-'+mode,'/live',async p=>{await p.getByRole('button',{name:'Interrompre le tournoi',exact:true}).waitFor();results.push({anomaly:2,mode,observed:'interrupt after final'});},f);}
 await visit('4-chips','/chrono-libre/countdown',async p=>{const rects=[];for(const m of[1,5,10,15,30])rects.push({minutes:m,...await p.getByRole('button',{name:m+' min',exact:true}).boundingBox()});const rows=new Set(rects.map(r=>Math.round(r.y)));assert(rows.size>=3);results.push({anomaly:4,observed:'three rows at 320px',rects});});
 await visit('5-rest','/chrono-libre/interval',async p=>{await p.getByText('Repos entre périodes',{exact:true}).waitFor();results.push({anomaly:5,observed:'rest with one period'});});
 await visit('6-players','/team-builder',async p=>{await p.getByRole('textbox',{name:'Nom du joueur à ajouter',exact:true}).fill('Alice');await p.getByRole('button',{name:'Ajouter le joueur',exact:true}).click();await p.getByText(/1 joueurs/).waitFor();results.push({anomaly:6,observed:'1 joueur in card and 1 joueurs in summary'});});
 await visit('8-ids','/live',async p=>{const ids=await p.evaluate(()=>{const ids=[...document.querySelectorAll('[data-testid]')].map(e=>e.dataset.testid);return [...new Set(ids.filter((id,i)=>ids.indexOf(id)!==i))];});assert(ids.includes('match-digits'));assert(ids.includes('match-status'));results.push({anomaly:8,observed:ids});},fixtures.find(f=>f.name==='maracana-result'));
 await visit('7-catalogue','/chrono-libre',async p=>{await p.getByRole('button',{name:'Reprendre le chrono en cours',exact:true}).waitFor();results.push({anomaly:7,observed:'finished countdown resume in catalogue'});},fixtures.find(f=>f.name==='free-countdown-finished-numeric'));
}finally{await browser?.close();server.kill();fs.closeSync(log);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));}})().catch(e=>{console.error(e);process.exitCode=1;});
