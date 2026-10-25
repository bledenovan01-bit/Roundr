const {spawnSync}=require("node:child_process");
const path=require("node:path");
const scriptDir=path.dirname(module.filename);
const audio=spawnSync(process.execPath,["-r",path.join(scriptDir,"register-ts.cjs"),path.join(scriptDir,"test-sound-identity.ts")],{stdio:"inherit"});
if(audio.status!==0)process.exit(audio.status??1);
for(const file of ["test-chrono.ts","test-domain.ts","test-live-notices.ts","test-regressions.ts","test-store-regressions.ts","test-free-timer.ts","test-maracana-rotation.ts","test-storage-reliability.ts","test-home-session-preview.ts","test-competition-history.ts","test-config-phase2a.ts","test-maracana-launch-storage.ts","test-tournament-phase2b.ts","test-team-composition.ts","test-match-phase3a.ts","test-match-confirmations.ts","test-tournament-phase3b.ts","test-tournament-storage-phase3b.ts","test-free-configuration-phase4a.ts","test-free-storage-phase4a.ts","test-free-live-phase4b.ts","test-settings-phase5a.ts"]) {
  const result=spawnSync(process.execPath,["-r",path.join(scriptDir,"register-ts.cjs"),path.join(scriptDir,file)],{stdio:"inherit"});
  if(result.status!==0)process.exit(result.status??1);
}
