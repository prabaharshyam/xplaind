// Calls one of the /api/ai routes from the browser and turns any failure into a message to show.
// PAY-4: when the server says a Pro pass would give more today, it also raises the upgrade
// prompt (UpgradePrompt, in the root layout), and every finished call refreshes the usage counter.
export type AiResult<T> = { ok: true; data: T } | { ok: false; message: string; signIn?: boolean; upgrade?: string };

export const UPGRADE_EVENT = "xplaind:upgrade";
export const AI_USED_EVENT = "xplaind:ai-used";

export async function aiPost<T>(path: string, body: unknown): Promise<AiResult<T>> {
  try {
    const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = (await res.json().catch(() => null)) as (T & { error?: string; upgrade?: string }) | null;
    if (typeof window !== "undefined") window.dispatchEvent(new Event(AI_USED_EVENT));
    if (res.ok && data) return { ok: true, data };
    const message = data?.error ?? "Something went wrong. Please try again.";
    const upgrade = res.status === 429 && typeof data?.upgrade === "string" && data.upgrade.startsWith("/") ? data.upgrade : undefined;
    if (upgrade && typeof window !== "undefined") window.dispatchEvent(new CustomEvent(UPGRADE_EVENT, { detail: { message, href: upgrade } }));
    return { ok: false, message, signIn: res.status === 401, ...(upgrade ? { upgrade } : {}) };
  } catch {
    return { ok: false, message: "You seem to be offline. Check your connection and try again." };
  }
}
