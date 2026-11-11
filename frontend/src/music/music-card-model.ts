// Pure rules of the single Roundr music card. Whatever the source behind it,
// the card only ever shows real state and real commands: nothing here invents
// a track or enables a button that the source did not declare.

export type MusicSourceId = "apple" | "spotify";
export type MusicCommand = "play" | "pause" | "next" | "previous";
export type MusicUserCommand = "toggle" | "next" | "previous";

export type MusicAuthorization = "notDetermined" | "granted" | "denied" | "restricted";
export type MusicConnection = "connected" | "connecting" | "disconnected" | "lost";
export type MusicPlayback = "playing" | "paused" | "stopped" | "unknown";

export type MusicTrack = {
  title: string | null;
  artist: string | null;
  artworkUri: string | null;
};

export type MusicSnapshot = {
  source: MusicSourceId;
  authorization: MusicAuthorization;
  connection: MusicConnection;
  playback: MusicPlayback;
  track: MusicTrack | null;
  canToggle: boolean;
  canPrevious: boolean;
  canNext: boolean;
};

export type MusicState = {
  /** Sources available in this build. Empty in Expo Go, on web and on Android. */
  sources: MusicSourceId[];
  ready: boolean;
  snapshots: Partial<Record<MusicSourceId, MusicSnapshot>>;
  /** iOS only says that another app is playing, never which one. */
  otherAudio: boolean;
  lastActive: MusicSourceId | null;
  busy: MusicUserCommand | "connect" | null;
  notice: string | null;
};

export type MusicAction =
  | { type: "connect"; source: MusicSourceId; label: string }
  | { type: "settings"; label: string };

export type MusicCardModel =
  | {
      kind: "player";
      source: MusicSourceId;
      title: string;
      artist: string;
      artworkUri: string | null;
      playing: boolean;
      canToggle: boolean;
      canPrevious: boolean;
      canNext: boolean;
      notice: string | null;
    }
  | {
      kind: "message";
      title: string;
      hint: string;
      actions: MusicAction[];
      notice: string | null;
    };

export const initialMusicState = (sources: MusicSourceId[]): MusicState => ({
  sources,
  ready: false,
  snapshots: {},
  otherAudio: false,
  lastActive: null,
  busy: null,
  notice: null,
});

const usable = (s: MusicSnapshot | undefined): s is MusicSnapshot =>
  !!s && s.authorization === "granted" && s.connection === "connected";

const names: Record<MusicSourceId, string> = { apple: "Apple Music", spotify: "Spotify" };

/** The source the card follows, or null when no controllable source applies. */
export function selectMusicSource(state: MusicState): MusicSourceId | null {
  const live = state.sources.map((id) => state.snapshots[id]).filter(usable);
  const playing = live.filter((s) => s.playback === "playing" && s.track);
  if (playing.length) {
    return (playing.find((s) => s.source === state.lastActive) ?? playing[0]).source;
  }
  // A third app is playing: a paused track elsewhere would be misleading.
  if (state.otherAudio) return null;
  const last = live.find((s) => s.source === state.lastActive && s.track);
  if (last) return last.source;
  return live.find((s) => s.track)?.source ?? null;
}

/** Remembers the source the user last listened to, so a pause keeps the card. */
export function nextLastActive(state: MusicState) {
  const playing = state.sources
    .map((id) => state.snapshots[id])
    .filter((s): s is MusicSnapshot => usable(s) && s.playback === "playing" && !!s.track);
  if (!playing.length || playing.some((s) => s.source === state.lastActive)) {
    return state.lastActive;
  }
  return playing[0].source;
}

function connectActions(state: MusicState) {
  const actions: MusicAction[] = [];
  for (const id of state.sources) {
    const s = state.snapshots[id];
    if (s?.authorization === "notDetermined") {
      actions.push({ type: "connect", source: id, label: `Connecter ${names[id]}` });
    }
  }
  return actions;
}

function connectHint(actions: MusicAction[], fallback: string) {
  return actions.some((a) => a.type === "connect" && a.source === "spotify")
    ? `${fallback} L’application Spotify s’ouvrira un instant pour la connexion.`
    : fallback;
}

export function musicCardModel(state: MusicState): MusicCardModel {
  const message = (title: string, hint: string, actions: MusicAction[] = []): MusicCardModel => ({
    kind: "message",
    title,
    hint,
    actions,
    notice: state.notice,
  });
  if (!state.sources.length) {
    return message(
      "Contrôle musical indisponible",
      "Cette version de Roundr ne peut pas commander la musique du téléphone. Le contrôle est prévu dans l’application Roundr installée sur iPhone.",
    );
  }
  if (!state.ready) return message("Recherche de la musique…", "Lecture de l’état du lecteur.");

  const sourceId = selectMusicSource(state);
  const source = sourceId ? state.snapshots[sourceId] : undefined;
  if (source?.track) {
    const free = state.busy === null;
    return {
      kind: "player",
      source: source.source,
      title: source.track.title?.trim() || "Titre indisponible",
      artist: source.track.artist?.trim() || "",
      artworkUri: source.track.artworkUri,
      playing: source.playback === "playing",
      canToggle: free && source.canToggle,
      canPrevious: free && source.canPrevious,
      canNext: free && source.canNext,
      notice: state.notice,
    };
  }

  const lost = state.sources.map((id) => state.snapshots[id]).find((s) => s?.connection === "lost");
  if (lost) {
    return message(
      `Connexion à ${names[lost.source]} perdue`,
      lost.source === "spotify"
        ? "Reconnecte pour reprendre le contrôle. L’application Spotify s’ouvrira un instant."
        : "Reconnecte pour reprendre le contrôle.",
      [{ type: "connect", source: lost.source, label: "Reconnecter" }],
    );
  }
  const connecting = state.sources.map((id) => state.snapshots[id]).find((s) => s?.connection === "connecting");
  if (connecting) return message(`Connexion à ${names[connecting.source]}…`, "Lecture de l’état du lecteur.");
  const connect = connectActions(state);
  if (state.otherAudio) {
    return message(
      "Musique lue dans une autre application",
      connectHint(connect, "iOS ne permet pas de la commander depuis Roundr. Utilise le Centre de contrôle."),
      connect,
    );
  }
  if (connect.length) {
    return message(
      "Connecte ta musique",
      connectHint(connect, "Autorise Roundr à afficher et commander le morceau en cours."),
      connect,
    );
  }
  const disconnected = state.sources
    .map((id) => state.snapshots[id])
    .find((s) => s?.authorization === "granted" && s.connection === "disconnected");
  if (disconnected) {
    return message(
      `${names[disconnected.source]} n’est pas connecté`,
      "Lance la lecture dans l’application, puis reconnecte.",
      [{ type: "connect", source: disconnected.source, label: "Reconnecter" }],
    );
  }
  const apple = state.snapshots.apple;
  if (apple?.authorization === "denied") {
    return message(
      "Accès à Musique refusé",
      "Autorise l’accès à Musique pour Roundr dans les Réglages de l’iPhone.",
      [{ type: "settings", label: "Ouvrir les Réglages" }],
    );
  }
  if (apple?.authorization === "restricted") {
    return message("Accès à Musique restreint", "Cet accès est bloqué par les restrictions de l’iPhone.");
  }
  return message("Aucune musique en cours", "Lance un morceau, il apparaîtra ici.");
}

const text = (value: unknown) => (typeof value === "string" && value.length ? value : null);
const one = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback;

/** Reads a snapshot from native code. Anything unexpected disables the commands. */
export function parseMusicSnapshot(source: MusicSourceId, raw: unknown): MusicSnapshot {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const rawTrack = r.track && typeof r.track === "object" ? (r.track as Record<string, unknown>) : null;
  const track = rawTrack
    ? { title: text(rawTrack.title), artist: text(rawTrack.artist), artworkUri: text(rawTrack.artworkUri) }
    : null;
  return {
    source,
    authorization: one(r.authorization, ["notDetermined", "granted", "denied", "restricted"] as const, "notDetermined"),
    connection: one(r.connection, ["connected", "connecting", "disconnected", "lost"] as const, "disconnected"),
    playback: one(r.playback, ["playing", "paused", "stopped", "unknown"] as const, "unknown"),
    track,
    canToggle: !!track && r.canToggle === true,
    canPrevious: !!track && r.canPrevious === true,
    canNext: !!track && r.canNext === true,
  };
}
