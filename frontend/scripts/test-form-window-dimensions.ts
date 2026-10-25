const builtin = (process as unknown as { getBuiltinModule: (id: string) => any }).getBuiltinModule;
const assert = builtin("assert/strict"), req = builtin("module").createRequire(process.argv[1]);
const platform = { OS: "web" }, visual = { width: 390, height: 300, scale: 3, fontScale: 1 };
let subscribe: (onChange: () => void) => () => void;
(globalThis as any).__roundrTestModules = {
  "react-native": { Platform: platform, useWindowDimensions: () => visual },
  react: { useSyncExternalStore: (listen: typeof subscribe, snapshot: () => unknown) => { subscribe = listen; return snapshot(); } },
};
const { useFormWindowDimensions: readDimensions } = req("../src/hooks/use-form-window-dimensions") as typeof import("../src/hooks/use-form-window-dimensions");
const descriptors = ["document", "window"].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
try {
  Reflect.deleteProperty(globalThis, "document"); Reflect.deleteProperty(globalThis, "window");
  assert.deepEqual(readDimensions(), { ...visual, landscape: true }, "SSR must not access document or window");
  const layout = { clientWidth: 390, clientHeight: 844 };
  const orientation = Object.assign(new EventTarget(), { type: "portrait-primary" as string | undefined });
  let coarse = true;
  const browser = Object.assign(new EventTarget(), { screen: { orientation }, orientation: undefined as number | undefined, matchMedia: () => ({ matches: coarse }) });
  Object.defineProperty(globalThis, "document", { configurable: true, value: { documentElement: layout } });
  Object.defineProperty(globalThis, "window", { configurable: true, value: browser });
  assert.deepEqual(readDimensions(), { ...visual, width: 390, height: 844, landscape: false });
  // The missing regression: layout and visual heights BOTH shrink below width.
  layout.clientHeight = 260; visual.height = 260;
  assert.equal(readDimensions().landscape, false, "Keyboard must not turn portrait into landscape even when clientHeight shrinks");
  visual.width = 300;
  assert.equal(readDimensions().width, 390, "Visual zoom must not narrow the layout");
  orientation.type = "portrait-secondary";
  assert.equal(readDimensions().landscape, false);
  layout.clientWidth = 844; layout.clientHeight = 260;
  orientation.type = "landscape-primary";
  assert.equal(readDimensions().landscape, true, "Real rotation must work with keyboard still open");
  orientation.type = "landscape-secondary";
  assert.equal(readDimensions().landscape, true);
  orientation.type = undefined;
  for (const angle of [0, 180]) { browser.orientation = angle; assert.equal(readDimensions().landscape, false, "Legacy iOS portrait"); }
  for (const angle of [90, -90, 270]) { browser.orientation = angle; assert.equal(readDimensions().landscape, true, "Legacy iOS landscape"); }
  browser.orientation = undefined;
  assert.equal(readDimensions().landscape, true, "No orientation API falls back to layout dimensions");
  coarse = false; orientation.type = "landscape-primary";
  layout.clientWidth = 390; layout.clientHeight = 844;
  assert.equal(readDimensions().landscape, false, "Desktop portrait window must ignore landscape monitor");
  coarse = true;
  for (const os of ["ios", "android"]) {
    platform.OS = os;
    assert.deepEqual(readDimensions(), { ...visual, landscape: visual.width > visual.height }, "Native sizing, orientation and font scale remain unchanged");
  }
  platform.OS = "web";
  layout.clientWidth = 0; layout.clientHeight = 0;
  assert.deepEqual(readDimensions(), { ...visual, landscape: true }, "Unavailable layout sizes fall back to RN dimensions");
  let updates = 0;
  const stop = subscribe!(() => updates++);
  orientation.dispatchEvent(new Event("change"));
  browser.dispatchEvent(new Event("orientationchange"));
  browser.dispatchEvent(new Event("resize"));
  assert.equal(updates, 3, "Subscribe to modern rotation, legacy rotation and desktop resize");
  stop();
  orientation.dispatchEvent(new Event("change")); browser.dispatchEvent(new Event("orientationchange")); browser.dispatchEvent(new Event("resize"));
  assert.equal(updates, 3, "Unmount must clean up all listeners");
  console.log("Form viewport: shrinking layout/visual keyboard, rotation, legacy iOS, desktop, SSR, native and cleanup passed");
} finally {
  for (const [key, descriptor] of descriptors) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
}
