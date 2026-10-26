// SVG contract: native-only flags must not be forwarded to web SVG elements.
const builtin = (process as unknown as { getBuiltinModule: (id: string) => any }).getBuiltinModule;
const assert = builtin("assert/strict"), fs = builtin("fs"), path = builtin("path");
const req = builtin("module").createRequire(process.argv[1]), ts = req("typescript");
const root = path.resolve(path.dirname(process.argv[1]), ".."), errors: string[] = [];
let elements = 0, files = 0;
function auditSource(source: string, filename: string) {
  const sf = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX), aliases = new Set<string>(["svg"]);
  for (const st of sf.statements) if (ts.isImportDeclaration(st) && st.moduleSpecifier.text === "react-native-svg") {
    if (st.importClause?.name) aliases.add(st.importClause.name.text);
    for (const el of st.importClause?.namedBindings?.elements ?? []) aliases.add(el.name.text);
  }
  const found: string[] = [];
  function visit(n: any) {
    if ((ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) && aliases.has(n.tagName.getText(sf))) {
      elements++;
      for (const attr of n.attributes.properties) {
        const name = attr.name?.getText(sf);
        if (name && (["accessible", "accessibilityElementsHidden", "importantForAccessibility", "origin", "originX", "originY"].includes(name) || /^(stroke|fill|transform|stop|clip|font)-/.test(name))) {
          found.push(`${filename}:${sf.getLineAndCharacterOfPosition(attr.getStart()).line + 1}: ${name}`);
        }
        if (ts.isJsxSpreadAttribute(attr) && !/^(decorativeSvgAccessibility|svgRotation\([\s\S]*\))$/.test(attr.expression.getText(sf))) found.push(`${filename}: SVG spread requires a platform audit`);
      }
    }
    ts.forEachChild(n, visit);
  }
  visit(sf); return found;
}
// Verify the guard catches aliases, child primitives and avoids flagging RN View.
assert.equal(auditSource('import Icon, { G as Group } from "react-native-svg"; const x=<><Icon accessible={false}/><Group origin="1,1"/><View accessibilityElementsHidden/></>;', "guard-fixture.tsx").length, 2);
elements = 0;
function walk(dir: string) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(file);
    else if (/\.[jt]sx?$/.test(file)) { files++; errors.push(...auditSource(fs.readFileSync(file, "utf8"), file)); }
  }
}
walk(path.join(root, "src")); walk(path.join(root, "app"));
assert.deepEqual(errors, [], "SVG source audit failed");
const platform = { OS: "web" };
(globalThis as any).__roundrTestModules = { "react-native": { Platform: platform } };
const modulePath = req.resolve("../src/components/svg-compat");
for (const os of ["web", "ios", "android"]) {
  platform.OS = os; delete req.cache[modulePath];
  const { decorativeSvgAccessibility, svgRotation } = req(modulePath) as typeof import("../src/components/svg-compat");
  assert.deepEqual(decorativeSvgAccessibility, os === "web" ? { "aria-hidden": true } : { accessible: false });
  for (const [angle, x, y] of [[-90, 70, 70], [-90, 100, 100], [54, 100, 100]]) {
    const props = svgRotation(angle, x, y);
    if (os === "web") {
      assert.equal(props.transform, `rotate(${angle} ${x} ${y})`);
      assert.equal("origin" in props, false, "Web must not generate transform-origin");
    } else assert.deepEqual(props, { rotation: angle, origin: `${x},${y}` }, "Keep original native rotation and pivot exactly");
  }
}
console.log(`SVG audit: ${files} source files, ${elements} SVG elements; web filtering and iOS/Android contracts passed`);
