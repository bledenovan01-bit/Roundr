/* global __dirname */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const root = path.resolve(__dirname, "../dist");
function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(path.join(dir, e.name)) : [path.join(dir, e.name)]);
}
const entries = files(root).filter(p => !p.endsWith(".map") && !p.endsWith("/sw.js") && !p.endsWith("\\sw.js"));
const hash = crypto.createHash("sha256");
entries.forEach(p => hash.update(fs.readFileSync(p)));
const cache = "roundr-" + hash.digest("hex").slice(0, 16);
const urls = entries.map(p => "/" + path.relative(root, p).replace(/\\/g, "/"));
fs.writeFileSync(path.join(root, "sw.js"), `
const CACHE = ${JSON.stringify(cache)};
const URLS = ${JSON.stringify(urls)};
self.addEventListener("install", e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(URLS))));
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("roundr-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const cached = await c.match(e.request);
    if (cached) return cached;
    try { return await fetch(e.request); }
    catch(error) { if (e.request.mode === "navigate") return await c.match("/index.html"); throw error; }
  }));
});
`);
console.log("Offline precache:", entries.length, "files", cache);

