// Test-only loader: executes the repository's TypeScript sources directly.
const fs=require("node:fs");
const path=require("node:path");
const Module=require("node:module");
const ts=require("typescript");
const root=path.resolve(__dirname,"..");
const resolve=Module._resolveFilename;
Module._resolveFilename=function(request,parent,...args){
  if(request.startsWith("@/"))request=path.join(root,request.slice(2));
  return resolve.call(this,request,parent,...args);
};
const load=Module._load;
Module._load=function(request,parent,...args){
  const mocks=globalThis.__roundrTestModules;
  if(mocks&&Object.prototype.hasOwnProperty.call(mocks,request))return mocks[request];
  return load.call(this,request,parent,...args);
};
Module._extensions[".ts"]=function(module,filename){
  const source=fs.readFileSync(filename,"utf8");
  const result=ts.transpileModule(source,{fileName:filename,compilerOptions:{
    module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,
  }});
  module._compile(result.outputText,filename);
};
