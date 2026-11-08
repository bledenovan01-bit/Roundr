import { requireOptionalNativeModule } from "expo";
import { Linking } from "react-native";
import { parseMusicSnapshot, type MusicCommand } from "./music-card-model";
import type { MusicAdapter, OtherAudioProbe } from "./music-controller";

type Subscription = { remove(): void };

type AppleMusicNative = {
  isOtherAudioPlaying(): boolean;
  requestAuthorization(): Promise<string>;
  getSnapshot(): Promise<unknown>;
  command(name: MusicCommand): Promise<void>;
  addListener(event: "onAppleMusicChange", listener: () => void): Subscription;
};

/** Experimental: only present and enabled in builds made with the Spotify flag. */
type SpotifyNative = {
  isEnabled(): boolean;
  getSnapshot(): Promise<unknown>;
  command(name: MusicCommand): Promise<void>;
  authorize(): Promise<void>;
  handleAuthUrl(url: string): Promise<boolean>;
  reconnect(): Promise<void>;
  disconnect(): Promise<void>;
  addListener(event: "onSpotifyChange", listener: () => void): Subscription;
};

// null in Expo Go, on web and on Android: the card then says it is unavailable.
const apple = requireOptionalNativeModule<AppleMusicNative>("RoundrMusic");
const spotify = requireOptionalNativeModule<SpotifyNative>("RoundrSpotifyRemote");

function appleAdapter(native: AppleMusicNative): MusicAdapter {
  return {
    id: "apple",
    getSnapshot: async () => parseMusicSnapshot("apple", await native.getSnapshot()),
    send: (command) => native.command(command),
    connect: async () => {
      await native.requestAuthorization();
    },
    subscribe: (listener) => {
      const subscription = native.addListener("onAppleMusicChange", listener);
      return () => subscription.remove();
    },
  };
}

const SPOTIFY_CALLBACK = "spotify-login-callback";

function spotifyAdapter(native: SpotifyNative): MusicAdapter {
  let links: Subscription | null = null;
  return {
    id: "spotify",
    getSnapshot: async () => parseMusicSnapshot("spotify", await native.getSnapshot()),
    send: (command) => native.command(command),
    connect: () => native.authorize(),
    subscribe: (listener) => {
      const subscription = native.addListener("onSpotifyChange", listener);
      return () => subscription.remove();
    },
    activate: async () => {
      links ??= Linking.addEventListener("url", ({ url }) => {
        if (url.includes(SPOTIFY_CALLBACK)) void native.handleAuthUrl(url);
      });
      await native.reconnect();
    },
    deactivate: async () => {
      links?.remove();
      links = null;
      await native.disconnect();
    },
  };
}

export function createMusicAdapters(): MusicAdapter[] {
  const adapters: MusicAdapter[] = [];
  if (apple) adapters.push(appleAdapter(apple));
  if (spotify?.isEnabled()) adapters.push(spotifyAdapter(spotify));
  return adapters;
}

export const isOtherAudioPlaying: OtherAudioProbe = async () =>
  apple?.isOtherAudioPlaying() ?? false;
