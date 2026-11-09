import { redirectSystemPath } from "../app/+native-intent";

const builtin = (
  process as unknown as { getBuiltinModule: (id: string) => any }
).getBuiltinModule;
const assert = builtin("assert/strict"),
  fs = builtin("fs"),
  path = builtin("path");
const root = path.join(path.dirname(process.argv[1]), "..");
const source = (file: string): string => fs.readFileSync(path.join(root, file), "utf8");
const app = JSON.parse(source("app.json")).expo;
const eas = JSON.parse(source("eas.json"));

// Identity and iPhone-only configuration.
assert.equal(app.ios.bundleIdentifier, "com.bledenovan.roundr");
assert.equal(app.ios.supportsTablet, false, "iPhone only for the V0");
assert.equal(app.scheme, "roundr");
assert.equal(app.ios.config.usesNonExemptEncryption, false);
assert.equal(app.android.package, "com.bledenovan.roundr.recette", "Android identifier untouched");
assert.equal(app.slug, "roundr");
assert.equal(app.extra.eas.projectId, "fb2a6c2e-7e12-41ef-bdb6-9c3ebca1a23a", "same EAS project");
assert.doesNotMatch(JSON.stringify(app), /emergent/i, "no Emergent reference in the app configuration");

// Build profiles: Spotify only in the planned TestFlight test profile.
const build = eas.build;
assert.deepEqual(Object.keys(build).sort(), ["preview", "production", "testflight-spotify"]);
assert.equal(build["testflight-spotify"].distribution, "store", "TestFlight needs a store build");
assert.equal(build.production.distribution, "store");
assert.equal(build.preview.distribution, "internal", "EAS internal distribution stays separate");
assert.equal(build["testflight-spotify"].env.ROUNDR_SPOTIFY_EXPERIMENT, "1");
assert.equal(build.production.env.ROUNDR_SPOTIFY_EXPERIMENT, "0");
assert.equal(build.preview.env.ROUNDR_SPOTIFY_EXPERIMENT, "0");
assert.doesNotMatch(source("eas.json"), /ROUNDR_SPOTIFY_CLIENT_ID/, "the Client ID comes from the EAS environment");
for (const name of ["production", "testflight-spotify"]) {
  assert.equal(build[name].ios.image, "sdk-58", name);
  assert.equal(build[name].autoIncrement, true, "each upload needs a new build number");
  assert.notEqual(build[name].developmentClient, true);
}
assert.equal(eas.cli.appVersionSource, "remote");
assert.deepEqual(Object.keys(eas.submit).sort(), ["production", "testflight-spotify"]);
assert.equal(eas.submit.production.ios.ascAppId, undefined, "no App Store Connect app is linked yet");

// The Spotify return follows the new scheme and never opens a screen.
const plugin = source("modules/roundr-spotify-remote/app.plugin.js");
assert.match(plugin, /\$\{next\.scheme\}:\/\/\$\{CALLBACK_PATH\}/, "redirect built from the app scheme");
const callback = "roundr://spotify-login-callback#access_token=hidden&token_type=Bearer";
assert.equal(redirectSystemPath({ path: callback, initial: false }), null, "stays on the current screen");
assert.equal(redirectSystemPath({ path: callback, initial: true }), "/");
assert.equal(redirectSystemPath({ path: "/live", initial: false }), "/live", "other links unchanged");
assert.equal(redirectSystemPath({ path: "roundr://live", initial: true }), "roundr://live");
assert.match(source("src/music/native-adapters.ts"), /url\.includes\(SPOTIFY_CALLBACK\)/);
for (const file of ["app", "src"]) {
  const walk = (d: string): string[] =>
    fs.readdirSync(d, { withFileTypes: true }).flatMap((e: any) =>
      e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)],
    );
  for (const f of walk(path.join(root, file))) {
    assert.doesNotMatch(fs.readFileSync(f, "utf8"), /frontend:\/\//, `old scheme in ${f}`);
  }
}

// Icon and splash assets.
const png = (file: string) => {
  const b = fs.readFileSync(path.join(root, "assets/images", file));
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20), colorType: b[25] };
};
assert.deepEqual(png("icon.png"), { width: 1024, height: 1024, colorType: 2 }, "1024 px icon without alpha");
assert.deepEqual(png("splash-image.png"), { width: 1024, height: 1024, colorType: 6 }, "transparent splash logo");
const splash = app.plugins.find((p: unknown) => Array.isArray(p) && p[0] === "expo-splash-screen")[1];
assert.equal(splash.backgroundColor, "#020909");
assert.equal(splash.image, "./assets/images/splash-image.png");
assert.equal(splash.resizeMode, "contain");
assert.equal(splash.enableFullScreenImage_legacy, undefined, "modern splash only");

// Permissions: Face ID came from expo-secure-store, removed as unused.
assert.equal(app.plugins.includes("expo-secure-store"), false);
const plist = app.ios.infoPlist;
assert.deepEqual(Object.keys(plist), ["NSAppleMusicUsageDescription"]);
const audio = app.plugins.find((p: unknown) => Array.isArray(p) && p[0] === "expo-audio")[1];
assert.equal(audio.microphonePermission, false, "no microphone request");
assert.equal(audio.enableBackgroundPlayback, false);

console.log("✓ iOS first build: identity, EAS profiles, Spotify return, assets and permissions");
