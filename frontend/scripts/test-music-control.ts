import {
  initialMusicState,
  musicCardModel,
  parseMusicSnapshot,
  selectMusicSource,
  type MusicCommand,
  type MusicSnapshot,
  type MusicSourceId,
  type MusicState,
} from "../src/music/music-card-model";
import { MusicController, type MusicAdapter } from "../src/music/music-controller";
import { freeCarouselViews } from "../src/features/free-live-state";

const builtin = (
  process as unknown as { getBuiltinModule: (id: string) => any }
).getBuiltinModule;
const assert = builtin("assert/strict"),
  fs = builtin("fs"),
  path = builtin("path");
const root = path.join(path.dirname(process.argv[1]), "..");
const source = (file: string): string => fs.readFileSync(path.join(root, file), "utf8");

const track = { title: "Seven Nation Army", artist: "The White Stripes", artworkUri: null };
const snap = (id: MusicSourceId, patch: Partial<MusicSnapshot> = {}): MusicSnapshot => ({
  source: id,
  authorization: "granted",
  connection: "connected",
  playback: "playing",
  track,
  canToggle: true,
  canPrevious: true,
  canNext: true,
  ...patch,
});
const state = (patch: Partial<MusicState> = {}): MusicState => ({
  ...initialMusicState(["apple", "spotify"]),
  ready: true,
  ...patch,
});
const title = (s: MusicState) => {
  const m = musicCardModel(s);
  return m.kind === "message" ? m.title : `player:${m.source}`;
};

// Unavailable builds never show a player or an action.
const none = musicCardModel(initialMusicState([]));
assert.equal(none.kind, "message");
assert.equal(none.kind === "message" && none.title, "Contrôle musical indisponible");
assert.deepEqual(none.kind === "message" && none.actions, []);

// One card for any source, and the same model fields for both.
const apple = musicCardModel(state({ snapshots: { apple: snap("apple") } }));
const spotify = musicCardModel(state({ snapshots: { spotify: snap("spotify") } }));
assert.equal(apple.kind, "player");
assert.deepEqual({ ...apple, source: "x" }, { ...spotify, source: "x" }, "identical card for both sources");

// Source selection.
const paused = (id: MusicSourceId) => snap(id, { playback: "paused" });
assert.equal(selectMusicSource(state({ snapshots: { apple: paused("apple"), spotify: snap("spotify") } })), "spotify", "the playing source wins");
assert.equal(selectMusicSource(state({ lastActive: "spotify", snapshots: { apple: snap("apple"), spotify: snap("spotify") } })), "spotify", "last active when both play");
assert.equal(selectMusicSource(state({ lastActive: "spotify", snapshots: { apple: paused("apple"), spotify: paused("spotify") } })), "spotify", "a pause keeps the card on its source");
assert.equal(selectMusicSource(state({ otherAudio: true, snapshots: { apple: paused("apple") } })), null, "no stale track over a third app");
assert.equal(selectMusicSource(state({ otherAudio: true, snapshots: { apple: snap("apple") } })), "apple", "Apple Music itself counts as other audio");
assert.equal(selectMusicSource(state({ snapshots: { apple: snap("apple", { authorization: "denied" }) } })), null);
assert.equal(selectMusicSource(state({ snapshots: { spotify: snap("spotify", { connection: "lost" }) } })), null, "no controls on a lost connection");

// Authorization, connection and other-app states.
const noAccess = (id: MusicSourceId, authorization: MusicSnapshot["authorization"]) =>
  snap(id, { authorization, connection: "disconnected", playback: "unknown", track: null, canToggle: false, canPrevious: false, canNext: false });
const asking = musicCardModel(state({ snapshots: { apple: noAccess("apple", "notDetermined"), spotify: noAccess("spotify", "notDetermined") } }));
assert.equal(asking.kind === "message" && asking.title, "Connecte ta musique");
assert.deepEqual(asking.kind === "message" && asking.actions.map((a) => a.label), ["Connecter Apple Music", "Connecter Spotify"]);
assert.match(asking.kind === "message" ? asking.hint : "", /Spotify s’ouvrira/, "the app switch is announced");
const denied = musicCardModel(state({ snapshots: { apple: noAccess("apple", "denied") } }));
assert.deepEqual(denied.kind === "message" && denied.actions, [{ type: "settings", label: "Ouvrir les Réglages" }]);
assert.equal(title(state({ snapshots: { apple: noAccess("apple", "restricted") } })), "Accès à Musique restreint");
assert.equal(title(state({ otherAudio: true, snapshots: { apple: noAccess("apple", "denied") } })), "Musique lue dans une autre application");
assert.equal(title(state({ snapshots: { apple: snap("apple", { track: null, playback: "stopped" }) } })), "Aucune musique en cours");
assert.equal(title(state({ snapshots: { spotify: snap("spotify", { connection: "connecting", track: null }) } })), "Connexion à Spotify…");
const lost = musicCardModel(state({ otherAudio: true, snapshots: { spotify: snap("spotify", { connection: "lost", track: null }) } }));
assert.equal(lost.kind === "message" && lost.title, "Connexion à Spotify perdue", "a lost link is said even if Spotify plays");
assert.deepEqual(lost.kind === "message" && lost.actions, [{ type: "connect", source: "spotify", label: "Reconnecter" }]);
assert.equal(title({ ...initialMusicState(["apple"]) }), "Recherche de la musique…");

// Unavailable commands stay off, missing metadata is not invented.
const limited = musicCardModel(state({ snapshots: { spotify: snap("spotify", { canNext: false, canPrevious: false, track: { title: null, artist: null, artworkUri: null } }) } }));
assert.equal(limited.kind === "player" && limited.canNext, false);
assert.equal(limited.kind === "player" && limited.canPrevious, false);
assert.equal(limited.kind === "player" && limited.title, "Titre indisponible");
assert.equal(limited.kind === "player" && limited.artist, "");
const busy = musicCardModel(state({ busy: "toggle", snapshots: { apple: snap("apple") } }));
assert.equal(busy.kind === "player" && (busy.canToggle || busy.canNext || busy.canPrevious), false, "no double command");

// Native input is distrusted.
const empty = parseMusicSnapshot("apple", null);
assert.deepEqual([empty.authorization, empty.connection, empty.playback, empty.canToggle], ["notDetermined", "disconnected", "unknown", false]);
const noTrack = parseMusicSnapshot("spotify", { authorization: "granted", connection: "connected", playback: "playing", canToggle: true, canNext: true, canPrevious: true });
assert.deepEqual([noTrack.canToggle, noTrack.canNext, noTrack.canPrevious], [false, false, false], "no command without a track");
assert.equal(parseMusicSnapshot("apple", { playback: "weird" }).playback, "unknown");
assert.deepEqual(parseMusicSnapshot("apple", { track: { title: "", artist: 3 } }).track, { title: null, artist: null, artworkUri: null });

// Controller with fake sources.
class FakeAdapter implements MusicAdapter {
  sent: MusicCommand[] = [];
  connects = 0;
  activations = 0;
  deactivations = 0;
  fail = false;
  failRead = false;
  listener: (() => void) | null = null;
  constructor(
    public id: MusicSourceId,
    public snapshot: MusicSnapshot,
  ) {}
  getSnapshot = async () => {
    if (this.failRead) throw Error("read");
    return this.snapshot;
  };
  send = async (command: MusicCommand) => {
    if (this.fail) throw Error("send");
    this.sent.push(command);
    if (command === "play" || command === "pause") {
      this.snapshot = { ...this.snapshot, playback: command === "play" ? "playing" : "paused" };
    }
  };
  connect = async () => {
    this.connects++;
    if (this.fail) throw Error("connect");
  };
  subscribe = (listener: () => void) => {
    this.listener = listener;
    return () => {
      this.listener = null;
    };
  };
  activate = async () => {
    this.activations++;
  };
  deactivate = async () => {
    this.deactivations++;
  };
}
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

async function main() {
  const a = new FakeAdapter("apple", snap("apple"));
  const s = new FakeAdapter("spotify", noAccess("spotify", "notDetermined"));
  let other = false;
  const music = new MusicController([a, s], async () => other);
  await music.command("toggle");
  assert.deepEqual(a.sent, [], "nothing is sent before the first read");
  await music.start();
  assert.equal(a.activations, 1);
  assert.equal(s.connects + a.connects, 0, "starting never asks for access nor opens another app");
  assert.equal(musicCardModel(music.getState()).kind, "player");

  await music.command("toggle");
  assert.deepEqual(a.sent, ["pause"], "toggle follows the real state");
  const afterPause = musicCardModel(music.getState());
  assert.equal(afterPause.kind === "player" && afterPause.playing, false, "state read back from the source");
  await music.command("toggle");
  assert.deepEqual(a.sent, ["pause", "play"]);

  a.snapshot = snap("apple", { canNext: false });
  await music.refresh();
  await music.command("next");
  assert.deepEqual(a.sent, ["pause", "play"], "a command the source refuses is not sent");

  a.snapshot = snap("apple");
  await music.refresh();
  a.fail = true;
  await music.command("next");
  assert.equal(music.getState().notice, "La commande n’a pas abouti.");
  assert.equal(music.getState().busy, null);
  a.fail = false;
  await music.command("next");
  assert.equal(music.getState().notice, null, "the error clears on the next success");

  // Source events and app switches.
  a.snapshot = snap("apple", { playback: "paused" });
  a.listener?.();
  await tick();
  await tick();
  const event = musicCardModel(music.getState());
  assert.equal(event.kind === "player" && event.playing, false, "external change reflected");
  other = true;
  await music.foreground();
  assert.equal(a.activations, 2, "reattached on return from another app");
  assert.equal(title(music.getState()).startsWith("Musique lue"), true);
  other = false;
  await music.refresh();

  // A source that stops answering loses its commands.
  a.failRead = true;
  await music.refresh();
  assert.equal(music.getState().snapshots.apple?.connection, "lost");
  assert.equal(music.getState().snapshots.apple?.canToggle, false);
  await music.command("toggle");
  assert.equal(a.sent.includes("pause") && a.sent.length, 3, "no command on a lost source");
  a.failRead = false;
  await music.refresh();

  await music.connect("spotify");
  assert.equal(s.connects, 1);
  s.fail = true;
  await music.connect("spotify");
  assert.equal(music.getState().notice, "La connexion n’a pas abouti.");
  s.fail = false;

  await music.stop();
  assert.equal(a.deactivations, 1);
  assert.equal(a.listener, null, "no listener left when the card is hidden");
  const before = music.getState();
  await music.refresh();
  assert.equal(music.getState(), before, "no native read while hidden");

  // A slow answer must not overwrite a newer one.
  let release: (v: MusicSnapshot) => void = () => undefined;
  const slow = new FakeAdapter("apple", snap("apple"));
  const late = new MusicController([slow], async () => false);
  await late.start();
  slow.getSnapshot = () => new Promise<MusicSnapshot>((resolve) => (release = resolve));
  const pending = late.refresh();
  slow.getSnapshot = async () => snap("apple", { playback: "paused" });
  await late.refresh();
  release(snap("apple", { playback: "playing" }));
  await pending;
  assert.equal(late.getState().snapshots.apple?.playback, "paused");

  const unsupported = new MusicController([], async () => false);
  await unsupported.start();
  assert.equal(unsupported.getState().ready, false);

  // Several cards share one controller: one attachment, one subscription.
  let watchers = 0,
    unwatched = 0;
  const shared = new FakeAdapter("apple", snap("apple"));
  let subscriptions = 0;
  const subscribe = shared.subscribe;
  shared.subscribe = (listener) => {
    subscriptions++;
    return subscribe(listener);
  };
  const common = new MusicController([shared], async () => false, () => {
    watchers++;
    return () => {
      unwatched++;
    };
  });
  const firstCard = common.hold();
  const secondCard = common.hold();
  await tick();
  await tick();
  assert.deepEqual([shared.activations, subscriptions, watchers], [1, 1, 1], "attached once for two cards");
  firstCard();
  firstCard();
  await tick();
  assert.deepEqual([shared.deactivations, unwatched], [0, 0], "kept while a card remains");
  assert.notEqual(shared.listener, null);
  secondCard();
  await tick();
  assert.deepEqual([shared.deactivations, unwatched], [1, 1], "released with the last card");
  assert.equal(shared.listener, null);
  const thirdCard = common.hold();
  await tick();
  await tick();
  assert.deepEqual([shared.activations, watchers], [2, 2], "reattached when a card comes back");
  thirdCard();

  // Chrono libre: a fourth view, once started, using the same card.
  assert.deepEqual([...freeCarouselViews("ready")], ["numeric", "analog", "circular"], "same rule as the match: not before the start");
  for (const stage of ["running", "paused", "waiting", "ended"]) {
    assert.deepEqual([...freeCarouselViews(stage)], ["numeric", "analog", "circular", "music"]);
  }
  const clock = source("src/components/lovable/free-clock.tsx");
  const freeLive = source("src/features/lovable-free-live.tsx");
  assert.match(clock, /<MusicCard/, "same component in the Chrono libre");
  assert.match(clock, /count: views\.length/, "the validated swipe covers the music view");
  assert.match(freeLive, /disabled=\{blocked \|\| isStopwatch \|\| showMusic\}/, "a tap on the music view cannot toggle the clock");
  assert.match(freeLive, /accessible=\{!showMusic\}/, "VoiceOver reaches the music buttons");
  assert.match(freeLive, /if \(locked\) return;\s+setMusicOpen/, "locked commands also lock the view");
  assert.doesNotMatch(source("src/store/free-timer-validation.ts"), /music/, "the music view is not part of the saved session");
  assert.doesNotMatch(source("src/domain/free-timer.ts"), /"music"/, "the timer engine does not know the music view");
  assert.equal((source("src/music/use-music-card.ts").match(/new MusicController/g) ?? []).length, 1, "one controller");
  assert.match(source("src/music/use-music-card.ts"), /music\.hold\(\)/);

  // Scope guards.
  const swift = source("modules/roundr-music/ios/RoundrMusicModule.swift");
  const spotifySwift = source("modules/roundr-spotify-remote/ios/RoundrSpotifyRemoteModule.swift");
  for (const code of [swift, spotifySwift]) {
    assert.doesNotMatch(code, /setCategory|setActive|MRMediaRemote|NSClassFromString/, "no audio session change, no private API");
  }
  assert.match(swift, /guard authorized else \{ return result \}/, "no player access before authorization");
  assert.doesNotMatch(swift, /requestAuthorization[\s\S]{0,40}definition/, "permission only on request");
  const adapters = source("src/music/native-adapters.ts");
  assert.match(adapters, /requireOptionalNativeModule<AppleMusicNative>/, "no crash in Expo Go");
  assert.match(adapters, /spotify\?\.isEnabled\(\)/, "Spotify off unless the build enables it");
  const plugin = source("modules/roundr-spotify-remote/app.plugin.js");
  assert.match(plugin, /ROUNDR_SPOTIFY_EXPERIMENT !== "1"\) return config/, "no Spotify in a normal build");
  assert.match(source("modules/roundr-spotify-remote/ios/RoundrSpotifyRemote.podspec"), /ROUNDR_SPOTIFY_EXPERIMENT/);
  const card = source("src/components/lovable/music-card.tsx");
  assert.doesNotMatch(card, /spotify|apple/i, "the card does not depend on the source");
  assert.match(source("src/components/lovable/match-ui.tsx"), /<MusicCard/);
  const config = JSON.parse(source("app.json")).expo;
  assert.equal(config.ios.bundleIdentifier, "com.bledenovan.roundr", "iOS identifier chosen by the owner");
  assert.equal(config.android.package, "com.bledenovan.roundr", "final Android identifier");
  assert.ok(config.ios.infoPlist.NSAppleMusicUsageDescription.length > 20);

  console.log("✓ Music: single card, sources, permissions, lost connections and unavailable commands");
}
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
