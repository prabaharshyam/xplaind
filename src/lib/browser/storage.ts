// Shared localStorage helpers. Every read and write is wrapped, because storage
// can be blocked, full or empty (private windows, etc.).
const CHANGE_EVENT = "xplaind:storage";

export function read(key: string): string | null {
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
  } catch {
    // Storage unavailable: the page keeps working for this visit.
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
