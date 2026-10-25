const qaWork=process.env.ROUNDR_QA_WORK;if(!qaWork)throw Error("Set ROUNDR_QA_WORK");
const {chromium}=require(process.env.ROUNDR_PLAYWRIGHT_MODULE||'C:/Users/denoe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path');
(async()=>{fs.mkdirSync(path.join(qaWork,"../outputs/mobile-chrono/checks"),{recursive:true});const phase=process.argv[2]||'before',port=process.argv[3]||8181;
const server=require('child_process').spawn(process.execPath,[path.join(__dirname,'serve-phase3b.cjs'),path.join(qaWork,`mobile-chrono-${phase}`),port],{stdio:'ignore'});
process.on('exit',()=>server.kill());await new Promise(r=>setTimeout(r,1200));
const browser=await chromium.launch({headless:true,channel:'msedge'});
const out=path.resolve(qaWork,'../outputs/mobile-chrono',phase);fs.mkdirSync(out,{recursive:true});
const cases=[['classique','phase3qa?scenario=classic-paused-remaining'],['maracana','phase3qa?scenario=mara-running-ring'],['cup','phase3bqa?scenario=cup-paused'],['survie','phase3bqa?scenario=survie-final'],['libre','phase4bqa?kind=stopwatch&state=paused&hours=1']];
const results=[];
for(const [width,height] of [[320,568],[360,640],[390,844],[568,320],[844,390]])for(const [mode,url] of cases){
const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto(`http://127.0.0.1:${port}/${url}`);await page.waitForTimeout(900);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(300);
await page.screenshot({path:path.join(out,`${mode}-${width}x${height}.png`),fullPage:true});
const geometry=await page.evaluate(()=>{const elems=[...document.querySelectorAll('[data-testid="match-digits"],[data-testid="free-digits"],[aria-label]')].filter(e=>/^[+\d]+:\d{2}.*\.\d{2}$/.test(e.getAttribute('aria-label')||''));return elems.map(e=>{const r=e.getBoundingClientRect();return {text:e.getAttribute('aria-label'),x:r.x,y:r.y,width:r.width,height:r.height,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth,children:[...e.children].map(t=>{const b=t.getBoundingClientRect(),s=getComputedStyle(t);return {text:t.textContent,x:b.x,width:b.width,height:b.height,font:s.fontSize,line:s.lineHeight}})}})});
results.push({mode,width,height,errors,geometry});console.log(mode,width,height,geometry.map(x=>x.text).join(','),errors.length);
const views=mode==='libre'?['Circulaire','Analogique']:['Chrono circulaire'];
for(const view of views){await page.getByRole(mode==='libre'?'tab':'button',{name:view,exact:true}).click();await page.waitForTimeout(400);await page.screenshot({path:path.join(out,`${mode}-${width}x${height}-${view.includes('Analog')?'analog':'ring'}.png`),fullPage:true});
const fit=await page.evaluate(()=>[...document.querySelectorAll('[data-testid="match-digits"],[data-testid="free-digits"]')].filter(e=>!e.closest('[aria-hidden="true"]')).map(e=>{const b=e.getBoundingClientRect();return {text:e.textContent,width:b.width,height:b.height,overflow:[...e.children].some(t=>{const r=t.getBoundingClientRect();return r.left<b.left-1||r.right>b.right+1}),x:b.x,y:b.y}}));results.push({mode,width,height,view,fit});}
if(mode!=='libre'){await page.getByRole('button',{name:'Chrono classique',exact:true}).click();await page.waitForTimeout(400);await page.locator('[data-testid="match-page-digital"] [role="button"]').click({delay:800});await page.waitForTimeout(300);if(await page.getByTestId('giant-chrono').count()){await page.screenshot({path:path.join(out,`${mode}-${width}x${height}-giant.png`),fullPage:true});await page.getByTestId('giant-close').click();}}
await page.setViewportSize({width:height,height:width});await page.waitForTimeout(400);results.push({mode,width,height,rotated:true,errors});await context.close();}
fs.writeFileSync(path.join(out,'geometry.json'),JSON.stringify(results,null,2));await browser.close();server.kill();})().catch(e=>{console.error(e);process.exit(1)});
