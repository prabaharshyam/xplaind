// Shared localStorage helpers. Every read and write is wrapped, because storage
// can be blocked, full or empty (private windows, etc.).
const CHANGE_EVENT = "xplaind:storage";

/** Values that could not be saved to localStorage, kept for this visit so buttons still respond. */
const memory = new Map<string, string | null>();

export function read(key: string): string | null {
  if (memory.has(key)) return memory.get(key) ?? null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function write(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
    memory.delete(key);
  } catch {
    // Storage blocked or full: keep the value in memory, so the page keeps working for this visit.
    memory.set(key, value);
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** For useSyncExternalStore. */
export function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/** What the server and the first client render see: nothing stored. */
export const serverSnapshot = (): string | null => null;
