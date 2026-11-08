import {
  initialMusicState,
  musicCardModel,
  nextLastActive,
  type MusicCommand,
  type MusicSnapshot,
  type MusicSourceId,
  type MusicState,
  type MusicUserCommand,
} from "./music-card-model";

/** One music service behind the common card. */
export interface MusicAdapter {
  id: MusicSourceId;
  getSnapshot(): Promise<MusicSnapshot>;
  send(command: MusicCommand): Promise<void>;
  /** Asks for access or reconnects. Only ever called from a user tap. */
  connect(): Promise<void>;
  subscribe(listener: () => void): () => void;
  /** Quiet attach when the card becomes visible: never opens another app. */
  activate?(): Promise<void>;
  deactivate?(): Promise<void>;
}

export type OtherAudioProbe = () => Promise<boolean>;

/**
 * Keeps the card in step with the real players. Native state is always read
 * back after a command: nothing is assumed from the button that was pressed.
 */
export class MusicController {
  private state: MusicState;
  private listeners = new Set<() => void>();
  private unsubscribe: (() => void)[] = [];
  private generation = 0;
  private started = false;

  constructor(
    private adapters: MusicAdapter[],
    private probe: OtherAudioProbe,
  ) {
    this.state = initialMusicState(adapters.map((a) => a.id));
  }

  getState = () => this.state;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private set(patch: Partial<MusicState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener());
  }

  async start() {
    if (this.started || !this.adapters.length) return;
    this.started = true;
    this.unsubscribe = this.adapters.map((a) => a.subscribe(() => void this.refresh()));
    await Promise.all(this.adapters.map((a) => a.activate?.().catch(() => undefined)));
    await this.refresh();
  }

  async stop() {
    if (!this.started) return;
    this.started = false;
    this.generation++;
    this.unsubscribe.forEach((remove) => remove());
    this.unsubscribe = [];
    await Promise.all(this.adapters.map((a) => a.deactivate?.().catch(() => undefined)));
  }

  /** Back from another app: reattach quietly and read the real state again. */
  async foreground() {
    if (!this.started) return;
    await Promise.all(this.adapters.map((a) => a.activate?.().catch(() => undefined)));
    await this.refresh();
  }

  async refresh() {
    if (!this.started) return;
    const generation = ++this.generation;
    const [snapshots, otherAudio] = await Promise.all([
      Promise.all(this.adapters.map((a) => a.getSnapshot().catch(() => null))),
      this.probe().catch(() => false),
    ]);
    // A newer read started meanwhile: this answer may already be out of date.
    if (generation !== this.generation || !this.started) return;
    const next: MusicState["snapshots"] = {};
    this.adapters.forEach((adapter, i) => {
      const read = snapshots[i];
      const previous = this.state.snapshots[adapter.id];
      if (read) next[adapter.id] = read;
      else if (previous) {
        // The source stopped answering: keep no command that could not work.
        next[adapter.id] = {
          ...previous,
          connection: "lost",
          playback: "unknown",
          track: null,
          canToggle: false,
          canPrevious: false,
          canNext: false,
        };
      }
    });
    const updated = { ...this.state, snapshots: next, otherAudio, ready: true };
    this.set({ snapshots: next, otherAudio, ready: true, lastActive: nextLastActive(updated) });
  }

  async command(command: MusicUserCommand) {
    if (this.state.busy) return;
    const model = musicCardModel(this.state);
    if (model.kind !== "player") return;
    const allowed =
      command === "toggle" ? model.canToggle : command === "next" ? model.canNext : model.canPrevious;
    const adapter = this.adapters.find((a) => a.id === model.source);
    if (!allowed || !adapter) return;
    const native: MusicCommand = command === "toggle" ? (model.playing ? "pause" : "play") : command;
    this.set({ busy: command, notice: null });
    try {
      await adapter.send(native);
    } catch {
      this.set({ notice: "La commande n’a pas abouti." });
    } finally {
      this.set({ busy: null });
      await this.refresh();
    }
  }

  async connect(source: MusicSourceId) {
    if (this.state.busy) return;
    const adapter = this.adapters.find((a) => a.id === source);
    if (!adapter) return;
    this.set({ busy: "connect", notice: null });
    try {
      await adapter.connect();
    } catch {
      this.set({ notice: "La connexion n’a pas abouti." });
    } finally {
      this.set({ busy: null });
      await this.refresh();
    }
  }
}
