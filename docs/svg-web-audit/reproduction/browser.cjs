// External Playwright QA; no application dependency or console suppression.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const [base,fixturesPath,out,phase='before']=process.argv.slice(2);
fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'}),results=[];
try{if(phase==='audio'){await audioPreviews(browser);return;}if(phase==='functional'){await functional(browser);return;}for(const fixture of JSON.parse(fs.readFileSync(fixturesPath,'utf8'))){
 const context=await browser.newContext({viewport:JSON.parse(process.env.SVG_VIEWPORT||'{"width":390,"height":844}'),hasTouch:true,isMobile:true});
 await context.addInitScript(f=>{Date.now=()=>f.now;for(const [key,value]of Object.entries(f.storage))localStorage.setItem(key,value);},fixture);
 const page=await context.newPage(),messages=[],errors=[],actions=[];
 page.on('console',m=>{if(['warning','error'].includes(m.type()))messages.push({type:m.type(),text:m.text()});});
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(base+fixture.route,{timeout:180000});await page.waitForSelector('svg',{timeout:60000});await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(250);
 if(fixture.name.endsWith('-config')&&!fixture.name.startsWith('free-')){
  const toggle=page.getByRole('switch',{name:'Personnaliser les équipes',exact:true});
  if(await toggle.count()&&await toggle.getAttribute('aria-checked')!=='true')await toggle.click();
  const color=page.getByRole('button',{name:/Changer la couleur de/}).first();
  if(await color.count()){await color.click();actions.push('open-team-palette');}
 }
 if(fixture.name.endsWith('-history')){
  const open=page.getByRole('button',{name:/Consulter|Voir le résumé/}).first();
  if(await open.count()){await open.click();actions.push('open-archived-summary');}
 }
 await page.waitForTimeout(150);
 const snapshot=await page.evaluate(()=>({url:location.pathname,headings:[...document.querySelectorAll('[role="heading"],h1,h2')].map(e=>e.textContent),svgs:[...document.querySelectorAll('svg')].map(e=>({attributes:[...e.attributes].filter(a=>a.name!=='class').map(a=>[a.name,a.value]),markup:e.innerHTML,rect:{width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}})),badAttributes:[...document.querySelectorAll('svg,svg *')].flatMap(e=>e.getAttributeNames().filter(n=>/^(accessible|accessibility|importantforaccessibility)/i.test(n)).map(n=>({tag:e.tagName,name:n,value:e.getAttribute(n)})))}));
 // Representative screenshots, including all four remaining defective components.
 const screenshot=/^(classique-ready|maracana-ready|cup-config|survie-config|cup-history|survie-history|free-stopwatch-config|free-stopwatch-ready-analog|free-interval-running-numeric)$/.test(fixture.name);
 if(screenshot)await page.screenshot({path:path.join(out,fixture.name+'.png'),animations:'disabled'});
 const result={name:fixture.name,route:fixture.route,actions,errors,messages,snapshot};results.push(result);
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));
 console.log(fixture.name,'svg',snapshot.svgs.length,'errors',errors.length,'messages',messages.length);
 await context.close();
}
const svgWarnings=results.flatMap(r=>r.messages.filter(m=>/non-boolean attribute|does not recognize|Invalid DOM property|Unknown event handler|Invalid ARIA|accessibilityRole is deprecated|accessibilityLabel is deprecated/.test(m.text)).map(m=>({case:r.name,...m})));
const summary={phase,consoleErrors:results.flatMap(r=>r.messages.filter(m=>m.type==='error').map(m=>({case:r.name,...m}))),cases:results.length,pageErrors:results.flatMap(r=>r.errors),badAttributes:results.flatMap(r=>r.snapshot.badAttributes),svgWarnings,allMessages:[...new Set(results.flatMap(r=>r.messages.map(m=>m.text)))]};
fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify(summary,null,2));
if(phase==='after'){assert.deepEqual(summary.pageErrors,[]);assert.deepEqual(summary.consoleErrors,[]);assert.deepEqual(summary.badAttributes,[]);assert.equal(svgWarnings.filter(m=>/non-boolean attribute|does not recognize|Invalid DOM property|Unknown event handler|Invalid ARIA/.test(m.text)).length,0);}
console.log(JSON.stringify({phase,cases:summary.cases,pageErrors:summary.pageErrors.length,badAttributes:summary.badAttributes.length,warningKinds:summary.allMessages}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
async function functional(browser) {
 const fixtures=JSON.parse(fs.readFileSync(fixturesPath,'utf8')), report=[];
 const open=async(f,viewport,remaining)=>{
  const context=await browser.newContext({viewport,isMobile:true,hasTouch:true});
  const page=await context.newPage(),errors=[],messages=[];
  page.on('pageerror',e=>{errors.push(String(e));fs.writeFileSync(path.join(out,'failure-console.json'),JSON.stringify({case:f.name,errors,messages},null,2));});page.on('console',m=>{if(['error','warning'].includes(m.type()))messages.push({type:m.type(),text:m.text()});if(m.type()==='error')fs.writeFileSync(path.join(out,'failure-console.json'),JSON.stringify({case:f.name,errors,messages},null,2));});page.on('dialog',d=>d.accept());
  const storage=JSON.parse(JSON.stringify(f.storage)),free=f.route.includes('chrono-libre/run');
  if(remaining!==undefined){const key=free?'roundr.free-timer.v1':'roundr.session.v1',state=JSON.parse(storage[key]);if(free){state.stepStartedAt=f.now-(state.config.durationMs-remaining);state.stepAccumulatedMs=0;}else{state.live.chrono.runningSince=f.now-(state.live.periodMs[state.live.periodIndex]-remaining);state.live.chrono.accumulatedMs=0;}storage[key]=JSON.stringify(state);}
  await page.clock.install({time:new Date(f.now)});await page.clock.pauseAt(new Date(f.now+1000));
  await page.addInitScript(storage=>{if(!sessionStorage.getItem('roundr.test.seeded')){for(const [key,value]of Object.entries(storage))localStorage.setItem(key,value);sessionStorage.setItem('roundr.test.seeded','true');}},storage);
  await page.goto(base+f.route,{timeout:180000});await page.getByTestId(free?'free-run-screen':'match-screen').waitFor({timeout:60000});await page.evaluate(()=>document.fonts.ready);await page.clock.runFor(300);
  return {context,page,errors,messages,free};
 };
 const stored=(p,free)=>p.evaluate(key=>JSON.parse(localStorage.getItem(key)),free?'roundr.free-timer.v1':'roundr.session.v1');
 const visible=async(p,free)=>{
  const banner=p.getByTestId(free?'free-notice-banner':'live-notice-banner');assert.equal(await banner.count(),1,'Exactly one banner');
  const box=await banner.evaluate(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,opacity:Number(getComputedStyle(e).opacity),pointer:getComputedStyle(e).pointerEvents,text:e.textContent,clippedBy:(()=>{const bad=[];for(let a=e.parentElement;a;a=a.parentElement){const s=getComputedStyle(a),b=a.getBoundingClientRect();if(/auto|scroll|hidden|clip/.test(s.overflowY)&&(r.y<b.y-1||r.bottom>b.bottom+1))bad.push({tag:a.tagName,y:b.y,bottom:b.bottom});}return bad;})()};});
  const dock=await (free?p.getByTestId('free-dock').getByRole('button').first():p.getByTestId('match-end')).boundingBox(),viewport=p.viewportSize();
  assert(box.width>0&&box.height>0&&box.x>=-1&&box.y>=0&&box.right<=viewport.width+1&&box.bottom<=dock.y+1,'Banner must be fully visible above fixed controls: '+JSON.stringify({box,dock}));
  assert.deepEqual(box.clippedBy,[],'No ancestor may clip the banner');assert(box.opacity>.5,'Banner must not be transparent');assert.equal(box.pointer,'none','Banner must not block gestures');return box;
 };
 const checkpoint=(name,data,errors,messages)=>{
  assert.deepEqual(errors,[]);assert.deepEqual(messages.filter(m=>m.type==='error'),[]);
  report.push({name,...data,errors,messages});fs.writeFileSync(path.join(out,'functional-results.json'),JSON.stringify(report,null,2));console.log('functional passed',name);
 };
 for(const viewport of [{width:390,height:600},{width:844,height:390}])for(const mode of ['classique','maracana','cup','survie','libre']){
  const f=fixtures.find(f=>f.name===(mode==='libre'?'free-countdown-running-numeric':mode+'-running'));
  const targets=mode==='libre'?['Numérique','Analogique','Circulaire']:mode==='classique'?['digital','ring','music']:mode==='maracana'?['digital','ring','next','music']:['digital','ring','tournament','music'];
  for(const target of targets){
   if(process.env.ROUNDR_CASE_FILTER&&!new RegExp(process.env.ROUNDR_CASE_FILTER).test(mode+'-'+target+'-'+viewport.width))continue;
   const {context,page:p,errors,messages,free}=await open(f,viewport,65000);
   const banner=p.getByTestId(free?'free-notice-banner':'live-notice-banner');
   const select=t=>free?p.getByRole('tab',{name:t,exact:true}).click():p.getByTestId('match-view-'+t).click();
   const selected=t=>free?p.getByRole('tab',{name:t,exact:true}).getAttribute('aria-selected'):p.getByTestId('match-view-'+t).getAttribute('aria-current');
   await select(target);await p.clock.runFor(400);assert.equal(await selected(target),'true');
   const state=await stored(p,free),duration=free?state.config.durationMs:state.live.periodMs[state.live.periodIndex],start=free?state.stepStartedAt:state.live.chrono.runningSince;
   const threshold=start+duration-60000;
   await p.clock.fastForward(threshold-await p.evaluate(()=>Date.now())-500);assert.equal(await banner.count(),0,'No early alert');
   await p.clock.runFor(900);const minute=await visible(p,free);assert.equal(await selected(target),'true','Alert must not select another view');
   const other=targets[(targets.indexOf(target)+1)%targets.length];await select(other);await p.clock.runFor(400);const switched=await visible(p,free);assert.equal(switched.text,minute.text,'Changing view must retain the same alert');
   await select(target);await p.clock.runFor(400);
   if(viewport.width===390&&target===targets[0]){await p.setViewportSize({width:600,height:390});await p.clock.runFor(400);await visible(p,free);await p.setViewportSize(viewport);await p.clock.runFor(400);await visible(p,free);assert.equal(await selected(target),'true','Rotation retains carousel selection');}
   if(viewport.width===390)await p.screenshot({path:path.join(out,`${mode}-${target}-60s.png`)});
   await p.clock.fastForward(4700);await p.clock.runFor(300);if(mode==='maracana'){await p.clock.fastForward(4700);await p.clock.runFor(300);}assert.equal(await banner.count(),0,'Alert expires even when no carousel change occurs');
   await p.clock.fastForward(start+duration-30000-await p.evaluate(()=>Date.now())-500);assert.equal(await banner.count(),0);
   await p.clock.runFor(900);const thirty=await visible(p,free);assert.match(thirty.text,/30/);assert.equal(await selected(target),'true');
   if(viewport.width===844&&['digital','Circulaire','music'].includes(target))await p.screenshot({path:path.join(out,`${mode}-${target}-landscape-30s.png`)});
   await p.clock.runFor(3300);await visible(p,free);await p.clock.fastForward(1800);await p.clock.runFor(300);assert.equal(await banner.count(),0,'Thirty-second alert must expire');
   checkpoint(`${mode}-${target}-${viewport.width}`,{kind:'alerts',minute,thirty,viewSwitchRetainsNotice:true,noEarlyNotice:true,expires:true,selectedViewStable:true},errors,messages);await context.close();
  }
 }
 // Exercise real controls and persistence once per mode, beyond seeded snapshots.
 for(const mode of ['classique','maracana','cup','survie','libre']){
  if(process.env.ROUNDR_CASE_FILTER&&!new RegExp(process.env.ROUNDR_CASE_FILTER).test(mode+'-controls-and-reload'))continue;
  const f=fixtures.find(f=>f.name===(mode==='libre'?'free-countdown-ready-numeric':mode+'-ready'));
  const {context,page:p,errors,messages,free}=await open(f,{width:390,height:600});
  await p.getByRole('button',{name:'Démarrer',exact:true}).click();await p.clock.runFor(1000);
  let state=await stored(p,free);assert(free?state.running:state.live.chrono.runningSince!==null);
  const starting=await stored(p,free),length=free?starting.config.durationMs:starting.live.periodMs[starting.live.periodIndex];
  await p.clock.fastForward(length-63000);await p.clock.runFor(2500);await visible(p,free);
  const pause=()=>free?p.getByRole('button',{name:'Pause',exact:true}).click():p.getByTestId('match-pause').click();
  await pause();await p.clock.runFor(100);state=await stored(p,free);assert(free?!state.running:state.live.chrono.runningSince===null);
  const paused=free?state.stepAccumulatedMs:state.live.chrono.accumulatedMs;await p.clock.fastForward(5000);await p.clock.runFor(300);if(mode==='maracana'){await p.clock.fastForward(5000);await p.clock.runFor(300);}assert.equal(await p.getByTestId(free?'free-notice-banner':'live-notice-banner').count(),0,'Alert expires while paused');state=await stored(p,free);assert.equal(free?state.stepAccumulatedMs:state.live.chrono.accumulatedMs,paused);
  if(!free){await p.getByTestId('match-goal-0').click();await p.clock.runFor(100);assert.equal((await stored(p,free)).live.score[0],1);}
  const saved=await stored(p,free);await p.reload();await p.getByTestId(free?'free-run-screen':'match-screen').waitFor();await p.clock.runFor(300);
  state=await stored(p,free);assert.equal(free?state.stepAccumulatedMs:state.live.chrono.accumulatedMs,paused);if(!free)assert.deepEqual(state.live.score,saved.live.score);
  await p.getByRole('button',{name:'Reprendre',exact:true}).click();await p.clock.runFor(1000);state=await stored(p,free);assert(free?state.running:state.live.chrono.runningSince!==null);
  if(free){await p.getByRole('button',{name:'Fin',exact:true}).click();await p.clock.runFor(300);await p.getByRole('button',{name:'Terminer la session',exact:true}).click();await p.clock.runFor(500);assert.equal(new URL(p.url()).pathname,'/');}
  else {await p.getByTestId('match-end').click();await p.clock.runFor(300);assert.notEqual((await stored(p,free)).live.stage,'period');}
  checkpoint(mode+'-controls-and-reload',{kind:'lifecycle',start:true,pause:true,pausedTimeStable:true,resume:true,score:!free,reloadPreservesState:true,end:true},errors,messages);await context.close();
 }
 return report;
}

// Real Settings buttons, real player source URLs; compare fetched WAV bytes to
// the approved manifest rather than guessing Metro asset names.
async function audioPreviews(browser) {
 const crypto=require('node:crypto');
 const manifest=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../../frontend/assets/sounds/official-manifest.json'),'utf8'));
 const hashes=Object.fromEntries(manifest.outputs.map(o=>[o.file,o.sha256]));
 const preferences=['startSound','goalSound','minuteSound','periodSound','endSound','warmupSound'];
 const report=[];
 for(const choice of ['whistle','final','alert','prep','gong','off']){
  const context=await browser.newContext({viewport:{width:390,height:844}});
  await context.addInitScript(({choice,preferences})=>{
   localStorage.setItem('roundr.preferences.v1',JSON.stringify({sounds:true,volume:.8,...Object.fromEntries(preferences.map(k=>[k,choice]))}));
   window.__audioPreviews=[];
   const play=HTMLMediaElement.prototype.play;
   HTMLMediaElement.prototype.play=function(){window.__audioPreviews.push({src:this.src,volume:this.volume});return play.call(this);};
  },{choice,preferences});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(base+'/settings',{timeout:180000});
  await page.getByRole('button',{name:'Réglages avancés',exact:true}).click();
  let count=0;
  for(const key of preferences){
   const button=page.getByTestId('preview-'+key);
   if(choice==='off'){
    assert.equal(await button.getAttribute('aria-disabled'),'true');
    report.push({choice,event:key,disabled:true});continue;
   }
   await button.click();
   await page.waitForFunction(n=>window.__audioPreviews.length>n,count);
   const call=await page.evaluate(n=>window.__audioPreviews[n],count++);
   const expected=(key==='periodSound'&&choice==='gong'?'prep':choice)+'.wav';
   const response=await page.request.get(call.src);assert(response.ok());
   assert.equal(crypto.createHash('sha256').update(await response.body()).digest('hex'),hashes[expected],key+' selected '+choice);
   assert.equal(call.volume,.8);
   report.push({choice,event:key,expected,sha256:hashes[expected],volume:call.volume});
  }
  assert.deepEqual(errors,[]);
  assert.equal((await page.evaluate(()=>window.__audioPreviews.length)),count);
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('roundr.preferences.v1')));
  for(const key of preferences)assert.equal(saved[key],choice,'Preview must not change saved preference');
  await context.close();
 }
 fs.writeFileSync(path.join(out,'audio-previews.json'),JSON.stringify(report,null,2));
 console.log(report.length+' Settings preview cases passed: approved WAV bytes, contexts, alternatives, volume, off and unchanged preferences');
}
