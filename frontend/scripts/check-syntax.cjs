const fs=require("node:fs"),path=require("node:path"),ts=require("typescript");
let failures=0,files=0;
function check(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const file=path.join(dir,entry.name);
    if(entry.isDirectory())check(file);
    else if(/\.tsx?$/.test(file)&&!file.endsWith(".d.ts")){
      files++;
      const result=ts.transpileModule(fs.readFileSync(file,"utf8"),{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}});
      for(const diagnostic of result.diagnostics??[])if(diagnostic.category===ts.DiagnosticCategory.Error){failures++;console.error(file,ts.flattenDiagnosticMessageText(diagnostic.messageText,"\n"));}
    }
  }
}
for(const dir of ["app","src"])check(path.join(__dirname,"..",dir));
console.log(`${files} TypeScript files parsed; ${failures} syntax errors`);process.exit(failures?1:0);
