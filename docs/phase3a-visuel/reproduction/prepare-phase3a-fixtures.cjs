const fs=require('fs'),path=require('path'),cp=require('child_process');
const root=process.cwd(),ref=path.join(root,'work/phase3-reference-render'),nat=path.join(root,'work/phase3-native-render');
fs.mkdirSync(ref,{recursive:true});fs.mkdirSync(nat,{recursive:true});
for(const dir of ['src','public'])fs.cpSync(path.join(root,'work/lovable-visual-audit',dir),path.join(ref,dir),{recursive:true});
fs.copyFileSync(path.join(root,'work/lovable-visual-audit/package.json'),path.join(ref,'package.json'));
if(!fs.existsSync(path.join(ref,'node_modules')))fs.symlinkSync(path.join(root,'work/lovable-visual-audit/node_modules'),path.join(ref,'node_modules'),'junction');
const nativeSource=path.join(root,'work/Roundr/frontend');
const files=cp.execFileSync('git',['ls-files','--cached','--others','--exclude-standard','frontend'],{cwd:path.join(root,'work/Roundr'),encoding:'utf8'}).trim().split(/\r?\n/);
for(const f of files){const rel=f.replace(/^frontend\//,''),target=path.join(nat,rel);if(!fs.existsSync(path.join(nativeSource,rel)))continue;fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(nativeSource,rel),target);}
if(!fs.existsSync(path.join(nat,'node_modules')))fs.symlinkSync(path.join(root,'work/preview-install/node_modules'),path.join(nat,'node_modules'),'junction');
const cases=[
 {id:'classic-ready-digital',mode:'classic',ready:true},
 {id:'classic-ready-ring',mode:'classic',ready:true,page:'ring'},
 {id:'classic-running',mode:'classic',ms:12345,score:[1,0]},
 {id:'classic-paused-remaining',mode:'classic',ms:12345,score:[2,1],paused:true},
 {id:'classic-paused-elapsed',mode:'classic',ms:12345,score:[2,1],paused:true,elapsed:true},
 {id:'classic-paused-ring',mode:'classic',ms:12345,score:[2,1],paused:true,page:'ring'},
 {id:'classic-score-off',mode:'classic',ms:12345,paused:true,scoreOff:true},
 {id:'classic-break',mode:'classic',ms:912345,score:[1,0]},
 {id:'classic-additional',mode:'classic',ms:912345,score:[1,0],additional:true},
 {id:'classic-result',mode:'classic',result:true,score:[1,1]},
 {id:'mara-ready-digital',mode:'mara',ready:true},
 {id:'mara-ready-next',mode:'mara',ready:true,page:'next'},
 {id:'mara-three-next',mode:'mara',count:3,ms:12345,paused:true,page:'next'},
 {id:'mara-seven-following',mode:'mara',count:7,ms:12345,paused:true,page:'next'},
 {id:'mara-running-ring',mode:'mara',ms:12345,score:[2,1],page:'ring'},
 {id:'mara-count-up',mode:'mara',ms:12345,paused:true,goalsOnly:true,score:[1,0]},
 {id:'mara-overtime',mode:'mara',count:3,ms:492345},
 {id:'mara-win-rotation',mode:'mara',ms:12345,finish:true,score:[2,1]},
 {id:'mara-winner-stays',mode:'mara',count:4,rotation:'winner',ms:12345,finish:true,score:[2,1]},
 {id:'mara-draw-one',mode:'mara',count:4,rotation:'winner',ms:12345,finish:true,score:[1,1]},
 {id:'mara-draw-both',mode:'mara',count:4,rotation:'winner',draw:'both',ms:12345,finish:true,score:[1,1]},
 {id:'mara-delay-running',mode:'mara',launch:'delay',ms:12345,finish:true,score:[2,1],pendingAge:10000},
 {id:'mara-delay-paused',mode:'mara',launch:'delay',ms:12345,finish:true,score:[2,1],pendingAge:10000,pendingPause:true},
 {id:'mara-delay-cancelled',mode:'mara',launch:'delay',ms:12345,finish:true,score:[2,1],pendingAge:10000,pendingCancel:true},
 {id:'mara-next-prepared',mode:'mara',ms:12345,finish:true,score:[2,1],next:true},
 {id:'mara-next-auto',mode:'mara',launch:'auto',ms:12345,finish:true,score:[2,1]},
 {id:'mara-ranking',mode:'mara',ms:12345,finish:true,score:[2,1],table:true},
 {id:'mara-warmup-banner',mode:'mara',ms:240000,banner:true},
 {id:'classic-time-banner',mode:'classic',ms:840000,banner:true},
 {id:'mara-music-unavailable',mode:'mara',ms:12345,paused:true,page:'music'}
];
for(const dir of [ref,nat])fs.writeFileSync(path.join(dir,'phase3-cases.json'),JSON.stringify(cases,null,2));
fs.writeFileSync(path.join(root,'outputs/phase3a/scenarios.json'),JSON.stringify(cases,null,2));
fs.writeFileSync(path.join(ref,'vite.qa.config.ts'),`import {defineConfig} from 'vite';import react from '@vitejs/plugin-react';import tailwind from '@tailwindcss/vite';import path from 'node:path';export default defineConfig({plugins:[react(),tailwind()],resolve:{alias:{'@':path.resolve(import.meta.dirname,'src')}},server:{host:'127.0.0.1',port:8120,strictPort:true}});`);
fs.writeFileSync(path.join(ref,'index.html'),`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"/><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap"/></head><body><div id="root"></div><script type="module" src="/phase3-qa.tsx"></script></body></html>`);
fs.copyFileSync(path.join(root,'work/phase3-reference-qa.tsx'),path.join(ref,'phase3-qa.tsx'));
fs.copyFileSync(path.join(root,'work/phase3-native-qa.tsx'),path.join(nat,'app/phase3qa.tsx'));
console.log(`Prepared source mirror and native QA mirror; ${cases.length} deterministic scenarios. Original reference files untouched.`);
