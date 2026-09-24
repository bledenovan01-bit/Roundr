import type { Session } from '../domain/types';

// While foregrounded, compare elapsed monotonic time with civil time. Reset
// the sample on suspension: some platforms stop their monotonic clock asleep.
export function createClockGuard() {
  let previous: { wall: number; monotonic: number } | null = null;
  return {
    reset() { previous = null; },
    reconcile(session: Session, wall: number, monotonic: number): Session {
      const old = previous;
      previous = { wall, monotonic };
      const live = session.live;
      if (!old || !live || live.chrono.runningSince === null) return session;
      const shift = wall - old.wall - (monotonic - old.monotonic);
      if (Math.abs(shift) < 2000) return session;
      return { ...session, updatedAt: wall, live: { ...live, chrono: { ...live.chrono, runningSince: live.chrono.runningSince + shift } } };
    },
  };
}

