import { soundAsset, type SoundKey } from "../src/audio/sound-identity";
const builtin = (process as unknown as { getBuiltinModule: (id: string) => any }).getBuiltinModule;
const assert = builtin("assert/strict");
const fs = builtin("fs"), path = builtin("path"), crypto = builtin("crypto"), Buffer = builtin("buffer").Buffer;
const root = path.join(path.dirname(process.argv[1]), "../assets/sounds");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "official-manifest.json"), "utf8"));
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
  assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
  assert.equal(bytes.toString("ascii", 8, 12), "WAVE");
  assert.equal(bytes.readUInt16LE(20), 1); // PCM, compatible WAV on web/iOS/Android
  assert.equal(bytes.readUInt16LE(22), 2);
  assert.equal(bytes.readUInt32LE(24), 44100);
  assert.equal(bytes.readUInt16LE(34), 16);
  assert.ok(output.seconds > 0 && output.seconds <= 4);
}
const hint = fs.readFileSync(path.join(root, "prep.wav")).subarray(44);
const double = fs.readFileSync(path.join(root, "free-final.wav")).subarray(44);
assert.deepEqual(double, Buffer.concat([hint, Buffer.alloc(Math.round(0.08 * 44100) * 4), hint]));
console.log("Official sound routing, WAV integrity, and exact D2 repetition passed");
