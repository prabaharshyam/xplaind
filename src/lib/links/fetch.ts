// ED-5: opens one link and returns its response code, or null for a timeout or network error. Node only.
// HEAD first; some sites refuse HEAD, so a refusal is tried again with GET. YouTube videos go through oEmbed.
import { youtubeId } from "./check";

const UA = "Mozilla/5.0 (compatible; XplaindLinkCheck/1.0; +https://xplaind.in/how-we-rank)";

async function open(url: string, method: "HEAD" | "GET", timeoutMs: number): Promise<number | null> {
  try {
    const res = await fetch(url, { method, redirect: "follow", signal: AbortSignal.timeout(timeoutMs), headers: { "User-Agent": UA, Accept: "text/html,application/pdf,*/*" } });
    await res.body?.cancel().catch(() => undefined);
    return res.status;
  } catch {
    return null;
  }
}

export async function checkUrl(url: string, timeoutMs = 15_000): Promise<number | null> {
  const video = youtubeId(url);
  if (video) return open(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${video}`)}`, "GET", timeoutMs);
  const head = await open(url, "HEAD", timeoutMs);
  if (head !== null && head < 400) return head;
  if (head === 404 || head === 410) {
    // Some servers answer HEAD wrongly; a GET has the last word on a missing page.
    return open(url, "GET", timeoutMs);
  }
  return (await open(url, "GET", timeoutMs)) ?? head;
}
