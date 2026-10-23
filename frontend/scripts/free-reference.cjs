// Exact frozen source; test oracle only, never part of application bundles.
const fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto"),
  Module = require("node:module"),
  ts = require("typescript");
const file = path.join(
    path.dirname(module.filename),
    "fixtures/lovable-chrono-1c59720.txt",
  ),
  source = fs.readFileSync(file);
if (
  crypto.createHash("sha256").update(source).digest("hex") !==
  "5a1013b360ee6c989de10dec4398bd9bd02dbb7def28cba49a14db3cb96df3bf"
)
  throw Error("Frozen chrono reference changed");
const mod = new Module(file, module);
mod.filename = file;
mod.paths = module.paths;
mod.require = (id) =>
  id === "react"
    ? {
        useSyncExternalStore() {
          throw Error("Oracle rendering not allowed");
        },
      }
    : module.require(id);
mod._compile(
  ts.transpileModule(source.toString("utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText,
  file,
);
module.exports = mod.exports;
