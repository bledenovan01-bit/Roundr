/* global __dirname, Buffer */
// Deterministic short, soft chimes. Existing whistle/final/prep assets are retained.
const fs = require("fs");
const path = require("path");
const rate = 22050;
for (const [key, notes] of Object.entries({ alert180: [660], alert120: [660, 880], alert60: [880, 1100], alert30: [1100, 880, 1100] })) {
  const samples = [];
  for (const frequency of notes) {
    for (let i = 0; i < rate * 0.13; i++) {
      const t = i / rate, envelope = Math.sin(Math.PI * t / 0.13) ** 2;
      samples.push(Math.round(0.4 * envelope * Math.sin(2 * Math.PI * frequency * t) * 32767));
    }
    for (let i = 0; i < rate * 0.07; i++) samples.push(0);
  }
  const wav = Buffer.alloc(44 + samples.length * 2);
  wav.write("RIFF"); wav.writeUInt32LE(wav.length - 8, 4); wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 2, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
  wav.write("data", 36); wav.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((n, i) => wav.writeInt16LE(n, 44 + i * 2));
  fs.writeFileSync(path.join(__dirname, "../assets/sounds", key + ".wav"), wav);
}

