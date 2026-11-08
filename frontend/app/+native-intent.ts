// The Spotify authorization comes back through a deep link. It is handled by
// the music adapter and must not open a route (or leave a match in progress).
export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }) {
  if (path.includes("spotify-login-callback")) return initial ? "/" : null;
  return path;
}
