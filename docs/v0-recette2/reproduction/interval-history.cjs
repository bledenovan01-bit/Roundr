const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),frontend=path.join(root,'frontend');
const ts=require(path.join(frontend,'node_modules/typescript'));
require(path.join(frontend,'scripts/register-ts.cjs'));
const {configFromDraft,initialFreeDraft}=require(path.join(frontend,'src/domain/free-configuration'));
const {buildSteps,INTERVAL_PRESETS,defaultConfig}=require(path.join(frontend,'src/domain/free-timer'));
const read=(rev,file)=>rev==='worktree'?fs.readFileSync(path.join(root,file),'utf8'):cp.execFileSync('git',['show',rev+':'+file],{cwd:root,encoding:'utf8'});
const parse=source=>ts.createSourceFile('config.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
function find(node,predicate){if(predicate(node))return node;let found;ts.forEachChild(node,child=>{if(!found)found=find(child,predicate);});return found;}
const configFile='frontend/src/domain/free-configuration.ts',motorFile='frontend/src/domain/free-timer.ts';
const originalAdapter=find(parse(read('03d9c65',configFile)),n=>ts.isFunctionDeclaration(n)&&n.name?.text==='configFromDraft').getText().replace(/\r/g,'');
const results=[];
for(const rev of ['accbea8','03d9c65','worktree']){
 const tree=parse(read(rev,'frontend/src/features/lovable-free-config.tsx'));
 const array=find(tree,n=>ts.isArrayLiteralExpression(n)&&n.elements.some(e=>e.getText().includes('label: "Tabata"')));
 assert(array,'quick programs found: '+rev);
 const map=array.parent.parent;
 const handler=find(map,n=>ts.isJsxAttribute(n)&&n.name.text==='onPress');
 const patchText=handler.initializer.expression.body.arguments[0].getText();
 const programs=vm.runInNewContext('('+array.getText()+')');
 const patch=vm.runInNewContext('(p)=>('+patchText+')');
 assert.equal(find(parse(read(rev,configFile)),n=>ts.isFunctionDeclaration(n)&&n.name?.text==='configFromDraft').getText().replace(/\r/g,''),originalAdapter,'adapter unchanged');
 assert.equal(read(rev,motorFile).replace(/\r/g,''),read('03d9c65',motorFile).replace(/\r/g,''),'motor unchanged');
 for(const label of ['Tabata','30/30']){
  const draft={...initialFreeDraft(),kind:'interval',...patch(programs.find(p=>p.label===label))};
  const config=configFromDraft(draft),steps=buildSteps(config);
  const result={revision:rev,program:label,periods:draft.periods,repetitions:draft.reps,restBetweenPeriodsSeconds:draft.rest,restBetweenRepetitionsSeconds:draft.repRest,workSteps:steps.filter(s=>s.type==='work').length,recoverySteps:steps.filter(s=>s.type!=='work').length,totalSeconds:steps.reduce((n,s)=>n+s.durationMs,0)/1000,sequence:steps.map(s=>({type:s.type,seconds:s.durationMs/1000}))};
  assert.equal(result.workSteps,8);assert.equal(result.recoverySteps,rev==='worktree'?7:0);
  results.push(result);
 }
}
for(const preset of INTERVAL_PRESETS){const steps=buildSteps({...defaultConfig('interval'),...preset,kind:'interval'});assert.equal(steps.filter(s=>s.type==='rest').length,7);}
const out=process.argv[2];if(out){fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(results,null,2));}
console.log(JSON.stringify(results.map(({sequence,...r})=>r),null,2));
