// External Playwright QA; no application dependency or console suppression.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const [base,fixturesPath,out,phase='before']=process.argv.slice(2);
fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'}),results=[];
try{for(const fixture of JSON.parse(fs.readFileSync(fixturesPath,'utf8'))){
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
