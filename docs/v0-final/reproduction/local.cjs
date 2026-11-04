// Starts server and browsers in the same Windows execution environment.
const cp=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../../..'),out=path.resolve(process.argv[2]);
fs.mkdirSync(out,{recursive:true});
const log=fs.openSync(path.join(out,'server.log'),'w');
const server=cp.spawn(process.execPath,['node_modules/expo/bin/cli','start','--web','--host','localhost','--port','8099'],{cwd:path.join(root,'frontend'),env:{...process.env,EXPO_OFFLINE:'1',EXPO_NO_TELEMETRY:'1'},stdio:['ignore',log,log],windowsHide:true});
process.on('exit',()=>server.kill());
function run(script,args) {return new Promise((resolve,reject)=>{const p=cp.spawn(process.execPath,[path.join(root,script),...args],{cwd:root,stdio:'inherit',env:process.env,windowsHide:true});p.on('error',reject);p.on('exit',code=>code===0?resolve():reject(Error(script+' exited '+code)));});}
(async()=>{try {
  for(let i=0;i<120;i++){try{const r=await fetch('http://localhost:8099');if(r.ok)break;}catch{}if(i===119)throw Error('Server unavailable');await new Promise(r=>setTimeout(r,1000));}
  const fixtures=path.join(out,'fixtures.json');
  await run('docs/svg-web-audit/reproduction/fixtures.cjs',[fixtures]);
  await run('docs/v0-final/reproduction/browser.cjs',['http://localhost:8099',fixtures,path.join(out,'targeted')]);
  if(process.argv[3] !== 'targeted') await run('docs/svg-web-audit/reproduction/browser.cjs',['http://localhost:8099',fixtures,path.join(out,'render'),'after']);
} finally {server.kill();fs.closeSync(log);}})().catch(e=>{console.error(e);process.exitCode=1;});
