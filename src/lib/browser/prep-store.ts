// PREP-3: the learner's interview prep plan on this device. Only the setup is kept; every read is checked.
// Signed in, a save is also sent to the account, and the account's copy is merged in once per sign-in.
import { PrepSetupInput, type PrepSetup } from "@/lib/prep/plan";
import { isSignedIn } from "./account-sync";
import { read, write } from "./storage";

export const PREP_KEY = "xplaind.prep.v1";

export const rawPrep = (): string | null => read(PREP_KEY);

export function parsePrep(raw: string | null): PrepSetup | null {
  if (!raw) return null;
  try {
    const p = PrepSetupInput.safeParse(JSON.parse(raw));
    return p.success ? p.data : null;
  } catch {
    return null;
  }
}

/** PP-1 kept a bare interview date on the device; a new plan starts from it, so nobody types it twice. */
export const oldInterviewDate = (): string | null => {
  const v = read("xplaind.interview-date.v1");
  return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
};

const post = (prep: PrepSetup | null, mode: "save" | "merge") =>
  fetch("/api/prep", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prep, mode }), keepalive: true });

/** Saves the plan here (null removes it) and, signed in, in the account. The device copy is what the page reads. */
export function savePrep(prep: PrepSetup | null): void {
  write(PREP_KEY, prep ? JSON.stringify(prep) : null);
  if (isSignedIn()) void post(prep, "save").catch(() => {});
}

/**
 * Once per sign-in: settle this device's plan against the account's and keep the winner here.
 * shortcut: a plan removed on one device comes back from another that still holds it, until removed there too.
 */
export async function mergePrep(): Promise<void> {
  const res = await post(parsePrep(rawPrep()), "merge");
  if (!res.ok) return;
  const { prep } = (await res.json()) as { prep: unknown };
  const kept = PrepSetupInput.nullable().safeParse(prep);
  if (kept.success && kept.data) write(PREP_KEY, JSON.stringify(kept.data));
}
