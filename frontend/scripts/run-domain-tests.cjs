const {spawnSync}=require("node:child_process");
const path=require("node:path");
for(const file of ["test-chrono.ts","test-domain.ts","test-live-notices.ts","test-regressions.ts","test-store-regressions.ts","test-audio.ts"]) {
  const result=spawnSync(process.execPath,["-r",path.join(__dirname,"register-ts.cjs"),path.join(__dirname,file)],{stdio:"inherit"});
  if(result.status!==0)process.exit(result.status??1);
}
