// UX-1: after a new deploy, a page left open may ask for code files that no longer exist. Those
// errors fix themselves with one fresh load, so the error page reloads once, quietly. Pure, for tests.

const CHUNK = /ChunkLoadError|Loading chunk [\w-]+ failed|Loading CSS chunk|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i;

/** True when the error is a missing code file from an older deploy. */
export function isStaleDeployError(error: unknown): boolean {
  if (!error) return false;
  const text = error instanceof Error ? `${error.name} ${error.message}` : String(error);
  return CHUNK.test(text);
}

const KEY = "xp:reloaded-at";

/** Reload at most once a minute, so a real outage never turns into a reload loop. */
export function shouldReload(now: number, last: string | null): boolean {
  const at = last ? Number(last) : 0;
  return !Number.isFinite(at) || now - at > 60_000;
}

export function reloadOnce(): boolean {
  try {
    if (!shouldReload(Date.now(), sessionStorage.getItem(KEY))) return false;
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}
