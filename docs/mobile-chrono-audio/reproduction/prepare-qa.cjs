// Run from any directory. Keep this fixture route outside production sources.
const fs=require('fs'),path=require('path'),cp=require('child_process');
const repo=path.resolve(__dirname,'../../..'),work=process.env.ROUNDR_QA_WORK;
if(!work||!path.isAbsolute(work))throw Error('Set ROUNDR_QA_WORK to an absolute dedicated QA directory');
const ref=process.argv[2]||'HEAD',phase=process.argv[3]||'after',dest=path.join(work,'mobile-chrono-qa');
if(!['before','after'].includes(phase))throw Error('Expected before or after');
const files=cp.execFileSync('git',['ls-tree','-r','--name-only',ref,'frontend'],{cwd:repo,encoding:'utf8'}).trim().split(/\r?\n/);
for(const file of files){const target=path.join(dest,file.slice(9));fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,cp.execFileSync('git',['show',`${ref}:${file}`],{cwd:repo,maxBuffer:30e6}));}
if(!fs.existsSync(path.join(dest,'node_modules')))fs.symlinkSync(path.join(repo,'frontend/node_modules'),path.join(dest,'node_modules'),'junction');
for(const name of ['phase3qa.tsx','phase3bqa.tsx','phase4bqa.tsx'])fs.copyFileSync(path.join(__dirname,name),path.join(dest,'app',name));
for(const name of ['phase3-cases.json','phase3b-cases.json'])fs.copyFileSync(path.join(__dirname,name),path.join(dest,name));
const result=cp.spawnSync(process.execPath,[path.join(dest,'node_modules/expo/bin/cli'),'export','--platform','web','--output-dir',path.join(work,`mobile-chrono-${phase}`)],{cwd:dest,env:{...process.env,CI:'1',EXPO_OFFLINE:'1'},stdio:'inherit'});process.exitCode=result.status??1;
