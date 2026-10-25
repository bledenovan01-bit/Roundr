const builtin = (process as unknown as { getBuiltinModule: (id: string) => any }).getBuiltinModule;
const assert = builtin("assert/strict"), req = builtin("module").createRequire(process.argv[1]);
const platform = { OS: "web" }, visual = { width: 390, height: 300, scale: 3, fontScale: 1 };
(globalThis as any).__roundrTestModules = { "react-native": { Platform: platform, useWindowDimensions: () => visual } };
const { useFormWindowDimensions: readDimensions } = req("../src/hooks/use-form-window-dimensions") as typeof import("../src/hooks/use-form-window-dimensions");
const descriptor = Object.getOwnPropertyDescriptor(globalThis, "document");
try {
  Reflect.deleteProperty(globalThis, "document");
  assert.strictEqual(readDimensions(), visual, "SSR must not access document");
  const layout = { clientWidth: 390, clientHeight: 844 };
  Object.defineProperty(globalThis, "document", { configurable: true, value: { documentElement: layout } });
  assert.deepEqual(readDimensions(), { ...visual, width: 390, height: 844 }, "Keyboard visual viewport must not switch form columns");
  visual.height = 260;
  visual.width = 300;
  assert.equal(readDimensions().width, 390, "Visual zoom must not narrow the layout");
  assert.equal(readDimensions().height, 844);
  layout.clientWidth = 844; layout.clientHeight = 390;
  assert.equal(readDimensions().width, 844, "Real layout rotation must still resize");
  assert.equal(readDimensions().height, 390);
  for (const os of ["ios", "android"]) {
    platform.OS = os;
    assert.strictEqual(readDimensions(), visual, "Native dimensions and font scale must remain untouched");
  }
  platform.OS = "web";
  layout.clientWidth = 0; layout.clientHeight = 0;
  assert.deepEqual(readDimensions(), visual, "Unavailable layout sizes fall back to RN dimensions");
  console.log("Form viewport: keyboard, zoom, rotation, SSR and native invariants passed");
} finally {
  if (descriptor) Object.defineProperty(globalThis, "document", descriptor);
  else Reflect.deleteProperty(globalThis, "document");
}
