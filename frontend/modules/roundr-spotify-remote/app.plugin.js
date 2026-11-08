// Experimental Spotify App Remote wiring. Does nothing unless the build sets
// ROUNDR_SPOTIFY_EXPERIMENT=1 and ROUNDR_SPOTIFY_CLIENT_ID, so a normal or
// public build contains neither the SDK nor any Spotify configuration.
const { execFileSync } = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { withDangerousMod, withInfoPlist } = require("expo/config-plugins");

const SDK_VERSION = "5.0.1";
const SDK_URL = `https://github.com/spotify/ios-sdk/archive/refs/tags/v${SDK_VERSION}.tar.gz`;
const SDK_SHA256 = "acafc07d35ce3f0bce93cac0031cd1cca1ba7ba6647a3e07e123f2e954ec298b";
const CALLBACK_PATH = "spotify-login-callback";

function fetchSdk() {
  const vendor = path.join(__dirname, "ios", "vendor");
  if (fs.existsSync(path.join(vendor, "SpotifyiOS.xcframework"))) return;
  fs.mkdirSync(vendor, { recursive: true });
  const archive = path.join(vendor, "sdk.tar.gz");
  execFileSync("curl", ["-fsSL", "-o", archive, SDK_URL], { stdio: "inherit" });
  const hash = crypto.createHash("sha256").update(fs.readFileSync(archive)).digest("hex");
  if (hash !== SDK_SHA256) {
    fs.rmSync(archive);
    throw new Error("Spotify iOS SDK archive does not match the expected checksum.");
  }
  execFileSync(
    "tar",
    ["-xzf", "sdk.tar.gz", "--strip-components=1", `ios-sdk-${SDK_VERSION}/SpotifyiOS.xcframework`],
    { cwd: vendor, stdio: "inherit" },
  );
  fs.rmSync(archive);
}

module.exports = function withRoundrSpotifyRemote(config) {
  if (process.env.ROUNDR_SPOTIFY_EXPERIMENT !== "1") return config;
  const clientId = process.env.ROUNDR_SPOTIFY_CLIENT_ID;
  if (!clientId) {
    throw new Error("ROUNDR_SPOTIFY_CLIENT_ID is required when the Spotify experiment is enabled.");
  }
  config = withInfoPlist(config, (next) => {
    next.modResults.RoundrSpotifyClientID = clientId;
    next.modResults.RoundrSpotifyRedirectURL = `${next.scheme}://${CALLBACK_PATH}`;
    const schemes = next.modResults.LSApplicationQueriesSchemes ?? [];
    if (!schemes.includes("spotify")) schemes.push("spotify");
    next.modResults.LSApplicationQueriesSchemes = schemes;
    return next;
  });
  return withDangerousMod(config, [
    "ios",
    (next) => {
      fetchSdk();
      return next;
    },
  ]);
};
