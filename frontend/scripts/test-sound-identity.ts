import { soundAsset, soundPreviewContext, type SoundKey, type SoundPreference } from "../src/audio/sound-identity";
const builtin = (process as unknown as { getBuiltinModule: (id: string) => any }).getBuiltinModule;
const assert = builtin("assert/strict");
const fs = builtin("fs"), path = builtin("path"), crypto = builtin("crypto"), Buffer = builtin("buffer").Buffer;
const root = path.join(path.dirname(process.argv[1]), "../assets/sounds");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "official-manifest.json"), "utf8"));
// Approved bytes are pinned independently of the editable manifest.
const approved: Record<string, string> = {
  "whistle.wav": "a19433fc86d71e3349920b440be47d6f9f2256895715c5fe38ea46e9009abcca",
  "final.wav": "0abfcb5a5d7b5245b2165ce14ab8d0aad3aa55377481efc30402b390868623a9",
  "alert.wav": "ef40106105c9ddf44bbcde64c9ecfd8efc5b78aa05f65bad7766d6b67bd03729",
  "gong.wav": "5b85713e97edf06d22cca3e59f6e48adedaefd7ca2c11520949ecb6decdfa11c",
  "prep.wav": "2d56df605aea51d761272d93b0048b0df3375c119149f417aaaac4c11d32cec9",
  "free-final.wav": "e533d9c3cb3251fb6a6268ade3793e2329574b3393fac7edaeec0841a19380a6",
  "confirmation.wav": "41a603d2ae46827f4d1436522fc4fa78e341b02d6b3185032bdaa1e4ec4534e6",
};
assert.deepEqual(manifest.outputs.map((o: {file: string}) => o.file).sort(), Object.keys(approved).sort());
for (const key of ["alert", "whistle", "final", "prep", "gong"] as SoundKey[]) {
  assert.equal(soundAsset(key), key, "Saved preference keys retain their selected resource");
  for (const context of ["periodEnd", "freeTransition", "freeEnd"] as const) {
    if (key !== "gong" && key !== "final") assert.equal(soundAsset(key, context), key);
  }
}
assert.equal(soundAsset("gong", "periodEnd"), "prep");
assert.equal(soundAsset("gong", "freeTransition"), "prep");
assert.equal(soundAsset("final", "freeEnd"), "free-final");
assert.equal(soundAsset("gong", "freeEnd"), "gong");
assert.equal(soundAsset("final", "periodEnd"), "final");
for (const output of manifest.outputs) {
  const bytes = fs.readFileSync(path.join(root, output.file));
  assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"), output.sha256);
  assert.equal(output.sha256, approved[output.file]);
  assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
  assert.equal(bytes.toString("ascii", 8, 12), "WAVE");
  assert.equal(bytes.readUInt16LE(20), 1); // PCM, compatible WAV on web/iOS/Android
  assert.equal(bytes.readUInt16LE(22), 2);
  assert.equal(bytes.readUInt32LE(24), 44100);
  assert.equal(bytes.readUInt16LE(34), 16);
  assert.equal((bytes.length - 44) / 176400, output.seconds);
  assert.ok(output.validatedPack && output.validatedMember);
  assert.ok(output.seconds > 0 && output.seconds <= 4);
}
const hint = fs.readFileSync(path.join(root, "prep.wav")).subarray(44);
const double = fs.readFileSync(path.join(root, "free-final.wav")).subarray(44);
assert.deepEqual(double, Buffer.concat([hint, Buffer.alloc(Math.round(0.16 * 44100) * 4), hint]));
const periodChoices = {whistle:"whistle",final:"final",alert:"alert",prep:"prep",gong:"prep"};
for (const key of Object.keys(periodChoices) as SoundKey[]) {
  assert.equal(soundAsset(key, soundPreviewContext("periodSound")), periodChoices[key]);
  for (const preference of ["startSound", "goalSound", "minuteSound", "endSound", "warmupSound"] as SoundPreference[]) {
    assert.equal(soundAsset(key, soundPreviewContext(preference)), key, "Alternative saved selections remain effective in previews");
  }
}

async function testPlayer() {
  const req = builtin("module").createRequire(process.argv[1]);
  const Module = builtin("module");
  const created: any[] = [];
  (globalThis as any).__roundrTestModules = {
    "@/src/store/preferences": {getPreferences: () => ({volume:.8})},
    "expo-audio": {
      async setAudioModeAsync() {},
      createAudioPlayer(source: string) {
        const player = {source, volume:0, seeks:[] as number[], plays:0, async seekTo(n: number) {this.seeks.push(n);}, play() {this.plays++;}};
        created.push(player); return player;
      },
    },
  };
  Module._extensions[".wav"] = (module: any, filename: string) => {module.exports = filename;};
  const {playSound, SOUND_CATALOG} = req("../src/audio/sounds.ts");
  await playSound("gong", soundPreviewContext("periodSound"));
  assert.equal(path.basename(created[0].source), "prep.wav", "Period preview plays the real period resource");
  await playSound("gong", soundPreviewContext("minuteSound"));
  assert.equal(path.basename(created[1].source), "gong.wav", "Time alert keeps C1");
  await playSound("alert", soundPreviewContext("periodSound"));
  assert.equal(path.basename(created[2].source), "alert.wav", "Custom period sound is not replaced");
  await playSound("final", "freeEnd");
  assert.equal(path.basename(created[3].source), "free-final.wav");
  assert(created.every(p => p.volume === .8 && p.plays === 1 && p.seeks[0] === 0));
  assert(!created.some(p => path.basename(p.source) === "confirmation.wav"), "E1 has no new trigger");
  for (const item of SOUND_CATALOG) {
    const entry = manifest.outputs.find((o: {file:string}) => o.file === item.key + ".wav");
    assert(Math.abs(item.duration - entry.seconds) < .001, "Catalog duration matches the actual WAV");
  }
  console.log("Seven approved WAV hashes, exact B1 V2, D2 160ms, previews, alternatives and player calls passed");
}
testPlayer().catch(error => {console.error(error); process.exitCode = 1;});
