// Frozen comparison oracle, not imported by the application. Source: roundr-mockup@1c59720.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),Module=require('node:module'),ts=require('typescript');
const file=path.join(path.dirname(module.filename),'fixtures/lovable-tournament-1c59720.txt'),source=fs.readFileSync(file);
if(crypto.createHash('sha256').update(source).digest('hex')!=='f4b573122bda79d31e03b4667b75879396020f2ca76e27fd99bba181b57e8c42')throw Error('Frozen reference changed');
const mod=new Module(file,module);mod.filename=file;mod.paths=module.paths;
mod._compile(ts.transpileModule(source.toString('utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
module.exports=mod.exports;
