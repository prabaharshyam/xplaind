// Calls one of the /api/ai routes from the browser and turns any failure into a message to show.
export type AiResult<T> = { ok: true; data: T } | { ok: false; message: string; signIn?: boolean };

export async function aiPost<T>(path: string, body: unknown): Promise<AiResult<T>> {
  try {
    const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
    if (res.ok && data) return { ok: true, data };
    return { ok: false, message: data?.error ?? "Something went wrong. Please try again.", signIn: res.status === 401 };
  } catch {
    return { ok: false, message: "You seem to be offline. Check your connection and try again." };
  }
}
