const {spawnSync}=require("node:child_process");
const path=require("node:path");
const scriptDir=path.dirname(module.filename);
for(const file of ["test-chrono.ts","test-domain.ts","test-live-notices.ts","test-regressions.ts","test-store-regressions.ts","test-free-timer.ts","test-maracana-rotation.ts","test-storage-reliability.ts","test-home-session-preview.ts","test-competition-history.ts","test-config-phase2a.ts","test-maracana-launch-storage.ts"]) {
  const result=spawnSync(process.execPath,["-r",path.join(scriptDir,"register-ts.cjs"),path.join(scriptDir,file)],{stdio:"inherit"});
  if(result.status!==0)process.exit(result.status??1);
}
